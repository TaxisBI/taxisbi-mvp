import { clickhouse } from '../clickhouse/client';
import path from 'node:path';
import { buildChartSpec } from '../charts/buildChartSpec';
import { loadBuiltInThemes } from '../routes/agingChart';
import { loadChartSpec } from './loadChartSpec';
import { loadRulebookChartConfig } from './loadRulebookChartConfig';
import { loadQuerySql } from './loadQuerySql';
import { resolveRulebookPaths } from './resolveRulebookPaths';

export class ChartContractValidationError extends Error {
  readonly contractErrors: string[];

  constructor(contractErrors: string[]) {
    super('Chart contract validation failed.');
    this.name = 'ChartContractValidationError';
    this.contractErrors = contractErrors;
  }
}

export type ChartPayload = {
  spec: Record<string, unknown>;
  data: Array<Record<string, unknown>>;
  parameters?: Record<string, unknown>;
  runtime?: Record<string, unknown>;
  themes?: Record<string, unknown>;
  defaultTheme?: string;
};

type BucketOperator = '=' | '<>' | '>=' | '<=' | '>' | '<';
type BucketCombinator = 'AND' | 'OR';

type AgingBucketConditionInput = {
  operator: BucketOperator;
  value: number;
};

type AgingBucketInput = {
  name: string;
  isSpecial: boolean;
  combinator: BucketCombinator;
  conditions: AgingBucketConditionInput[];
};

function isBucketOperator(value: unknown): value is BucketOperator {
  return value === '=' || value === '<>' || value === '>=' || value === '<=' || value === '>' || value === '<';
}

function isBucketCombinator(value: unknown): value is BucketCombinator {
  return value === 'AND' || value === 'OR';
}

function escapeSqlString(value: string) {
  return value.replace(/'/g, "''");
}

function parseAgingBuckets(input: unknown): AgingBucketInput[] | undefined {
  if (typeof input !== 'string' || !input.trim()) {
    return undefined;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error('Invalid buckets payload. Expected JSON array.');
  }

  return validateAgingBuckets(parsed);
}

function validateAgingBuckets(input: unknown): AgingBucketInput[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error('Buckets must be a non-empty array.');
  }

  if (input.length > 30) {
    throw new Error('Too many buckets. Maximum is 30.');
  }

  return input.map((raw, index) => {
    if (!raw || typeof raw !== 'object') {
      throw new Error(`Bucket ${index + 1} is invalid.`);
    }

    const candidate = raw as Record<string, unknown>;
    const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';
    const isSpecial = candidate.isSpecial === true;
    const combinator = candidate.combinator === undefined ? 'AND' : candidate.combinator;
    const rawConditions = candidate.conditions;

    if (!name) {
      throw new Error(`Bucket ${index + 1} name is required.`);
    }

    if (name.length > 64) {
      throw new Error(`Bucket ${index + 1} name is too long (max 64).`);
    }

    if (!Array.isArray(rawConditions) || rawConditions.length === 0) {
      throw new Error(`Bucket ${index + 1} must include at least one condition.`);
    }

    if (!isBucketCombinator(combinator)) {
      throw new Error(`Bucket ${index + 1} has invalid combinator.`);
    }

    if (!isSpecial && combinator === 'OR') {
      throw new Error(`Bucket ${index + 1} can only use OR when marked as special.`);
    }

    if (rawConditions.length > 2) {
      throw new Error(`Bucket ${index + 1} supports up to two conditions.`);
    }

    const conditions = rawConditions.map((rawCondition, conditionIndex) => {
      if (!rawCondition || typeof rawCondition !== 'object') {
        throw new Error(`Bucket ${index + 1} condition ${conditionIndex + 1} is invalid.`);
      }

      const condition = rawCondition as Record<string, unknown>;
      if (!isBucketOperator(condition.operator)) {
        throw new Error(`Bucket ${index + 1} condition ${conditionIndex + 1} has invalid operator.`);
      }

      const value = Number(condition.value);
      if (!Number.isInteger(value)) {
        throw new Error(`Bucket ${index + 1} condition ${conditionIndex + 1} value must be an integer.`);
      }

      return {
        operator: condition.operator,
        value,
      };
    });

    return {
      name,
      isSpecial,
      combinator,
      conditions,
    };
  });
}

function readDefaultBuckets(parameters: Record<string, unknown> | null): AgingBucketInput[] | null {
  const bucketsParam = asObject(parameters?.buckets);
  if (!bucketsParam || !Array.isArray(bucketsParam.default)) {
    return null;
  }

  return validateAgingBuckets(bucketsParam.default);
}

function buildBucketExpressions(buckets: AgingBucketInput[]) {
  const labelParts: string[] = [];
  const orderParts: string[] = [];
  const dimensionRows: string[] = [];

  buckets.forEach((bucket, index) => {
    const conditionParts = bucket.conditions
      .map((entry) => `days_past_due ${entry.operator} ${entry.value}`)
      .map((entry) => `(${entry})`);
    const joiner = bucket.isSpecial && bucket.combinator === 'OR' ? ' OR ' : ' AND ';
    const condition = conditionParts.join(joiner);
    const label = `'${escapeSqlString(bucket.name)}'`;
    const order = String(index + 1);

    labelParts.push(condition, label);
    orderParts.push(condition, order);
    dimensionRows.push(`tuple(${order}, ${label})`);
  });

  return {
    agingBucketExpr: `multiIf(${labelParts.join(', ')}, 'Unbucketed')`,
    agingBucketOrderExpr: `multiIf(${orderParts.join(', ')}, 9999)`,
    agingBucketDimRows: dimensionRows.join(', '),
  };
}

function resolveBucketRuntimeSql(
  sql: string,
  queryParams: Record<string, string | number | boolean>,
  chartMetadata: {
    runtime: Record<string, unknown> | null;
    parameters: Record<string, unknown> | null;
  }
) {
  const runtime = asObject(chartMetadata.runtime);
  const runtimeSqlTokens = asObject(runtime?.sqlTokens);
  const bucketExprToken =
    typeof runtimeSqlTokens?.agingBucketExpr === 'string' && runtimeSqlTokens.agingBucketExpr.trim()
      ? runtimeSqlTokens.agingBucketExpr.trim()
      : null;
  const bucketOrderExprToken =
    typeof runtimeSqlTokens?.agingBucketOrderExpr === 'string' && runtimeSqlTokens.agingBucketOrderExpr.trim()
      ? runtimeSqlTokens.agingBucketOrderExpr.trim()
      : null;
  const bucketDimRowsToken =
    typeof runtimeSqlTokens?.agingBucketDimRows === 'string' && runtimeSqlTokens.agingBucketDimRows.trim()
      ? runtimeSqlTokens.agingBucketDimRows.trim()
      : null;

  if (!bucketExprToken || !bucketOrderExprToken || !bucketDimRowsToken) {
    throw new Error(
      'Missing required SQL token contract: runtime.sqlTokens.agingBucketExpr, runtime.sqlTokens.agingBucketOrderExpr, and runtime.sqlTokens.agingBucketDimRows.'
    );
  }

  const bucketExprPlaceholder = `{{${bucketExprToken}}}`;
  const bucketOrderExprPlaceholder = `{{${bucketOrderExprToken}}}`;
  const bucketDimRowsPlaceholder = `{{${bucketDimRowsToken}}}`;

  const hasBucketTokens =
    sql.includes(bucketExprPlaceholder) ||
    sql.includes(bucketOrderExprPlaceholder) ||
    sql.includes(bucketDimRowsPlaceholder);

  if (!hasBucketTokens) {
    return {
      sql,
      queryParams,
    };
  }

  const runtimeQueryParams = asObject(runtime?.queryParams);
  const bucketsParamName =
    typeof runtimeQueryParams?.buckets === 'string' && runtimeQueryParams.buckets.trim()
      ? runtimeQueryParams.buckets
      : 'buckets';

  const runtimeBuckets = parseAgingBuckets(queryParams[bucketsParamName]);
  const defaultBuckets = readDefaultBuckets(chartMetadata.parameters);
  const buckets = runtimeBuckets ?? defaultBuckets;

  if (!buckets || buckets.length === 0) {
    throw new Error('Missing bucket definitions. Provide buckets query param or parameters.buckets.default.');
  }

  const { agingBucketExpr, agingBucketOrderExpr, agingBucketDimRows } = buildBucketExpressions(buckets);
  const queryWithBuckets = sql
    .replaceAll(bucketExprPlaceholder, agingBucketExpr)
    .replaceAll(bucketOrderExprPlaceholder, agingBucketOrderExpr)
    .replaceAll(bucketDimRowsPlaceholder, agingBucketDimRows);

  const queryParamsWithoutBuckets = { ...queryParams };
  delete queryParamsWithoutBuckets[bucketsParamName];

  return {
    sql: queryWithBuckets,
    queryParams: queryParamsWithoutBuckets,
  };
}

function normalizeQueryParams(input: Record<string, unknown>) {
  const params: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      params[key] = value;
      continue;
    }

    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      if (typeof first === 'string' || typeof first === 'number' || typeof first === 'boolean') {
        params[key] = first;
      }
    }
  }

  return params;
}

export async function getChartPayload(args: {
  domain: string;
  rulebook: string;
  chart: string;
  queryParams?: Record<string, unknown>;
}): Promise<ChartPayload> {
  const paths = await resolveRulebookPaths(args.domain, args.rulebook, args.chart);
  const themeRootPath = path.resolve(process.cwd(), 'themes');
  const [chartMetadata, sql, themes] = await Promise.all([
    loadRulebookChartConfig(paths.packManifestPath, paths.chartName),
    loadQuerySql(paths.querySqlPath),
    loadBuiltInThemes(themeRootPath, {
      domain: paths.domainName,
      rulebook: paths.packName,
      chart: paths.chartName,
    }),
  ]);
  const contractErrors = collectContractErrors(chartMetadata, themes);
  if (contractErrors.length > 0) {
    throw new ChartContractValidationError(contractErrors);
  }

  const defaultTheme = themes.light ? 'light' : Object.keys(themes)[0] ?? 'light';

  const spec = chartMetadata.chartBuilderInput
    ? buildChartSpec(chartMetadata.chartBuilderInput)
    : await loadChartSpec(paths.chartSpecPath);

  const normalizedParams = normalizeQueryParams(args.queryParams ?? {});
  const queryParams = chartMetadata.allowedQueryParams
    ? filterAllowedQueryParams(normalizedParams, chartMetadata.allowedQueryParams)
    : normalizedParams;
  const queryRuntime = resolveBucketRuntimeSql(sql, queryParams, chartMetadata);

  const result = await clickhouse.query({
    query: queryRuntime.sql,
    format: 'JSONEachRow',
    query_params: queryRuntime.queryParams,
  });

  const data = (await result.json()) as Array<Record<string, unknown>>;
  return {
    spec,
    data,
    parameters: chartMetadata.parameters ?? undefined,
    runtime: chartMetadata.runtime ?? undefined,
    themes,
    defaultTheme,
  };
}

function collectContractErrors(
  chartMetadata: {
    runtime: Record<string, unknown> | null;
    parameters: Record<string, unknown> | null;
    allowedQueryParams: string[] | null;
  },
  themes: Record<string, unknown>
) {
  const errors: string[] = [];

  const runtime = asObject(chartMetadata.runtime);
  if (!runtime) {
    errors.push('Missing required contract object: runtime.');
  }

  const queryParams = asObject(runtime?.queryParams);
  if (!queryParams) {
    errors.push('Missing required contract object: runtime.queryParams.');
  }
  if (!isNonEmptyString(queryParams?.reportDate)) {
    errors.push('Missing required contract string: runtime.queryParams.reportDate.');
  }
  if (!isNonEmptyString(queryParams?.buckets)) {
    errors.push('Missing required contract string: runtime.queryParams.buckets.');
  }

  const sqlTokens = asObject(runtime?.sqlTokens);
  if (!sqlTokens) {
    errors.push('Missing required contract object: runtime.sqlTokens.');
  }
  if (!isNonEmptyString(sqlTokens?.agingBucketExpr)) {
    errors.push('Missing required contract string: runtime.sqlTokens.agingBucketExpr.');
  }
  if (!isNonEmptyString(sqlTokens?.agingBucketOrderExpr)) {
    errors.push('Missing required contract string: runtime.sqlTokens.agingBucketOrderExpr.');
  }
  if (!isNonEmptyString(sqlTokens?.agingBucketDimRows)) {
    errors.push('Missing required contract string: runtime.sqlTokens.agingBucketDimRows.');
  }

  const chartRuntime = asObject(runtime?.chartRuntime);
  if (!chartRuntime) {
    errors.push('Missing required contract object: runtime.chartRuntime.');
  }

  const requiredChartRuntimeFields = [
    'categoryField',
    'valueField',
    'bucketOrderField',
    'hoverField',
    'hoverParamName',
    'xAxisTitlePrefix',
  ] as const;

  for (const field of requiredChartRuntimeFields) {
    if (!isNonEmptyString(chartRuntime?.[field])) {
      errors.push(`Missing required contract string: runtime.chartRuntime.${field}.`);
    }
  }

  const valueFormatting = asObject(chartRuntime?.valueFormatting);
  if (!valueFormatting) {
    errors.push('Missing required contract object: runtime.chartRuntime.valueFormatting.');
  }
  if (!isNonNegativeNumber(valueFormatting?.axisDecimals)) {
    errors.push('Missing required contract number: runtime.chartRuntime.valueFormatting.axisDecimals.');
  }
  if (!isNonNegativeNumber(valueFormatting?.compactDecimals)) {
    errors.push('Missing required contract number: runtime.chartRuntime.valueFormatting.compactDecimals.');
  }
  if (!isNonNegativeNumber(valueFormatting?.tooltipDecimals)) {
    errors.push('Missing required contract number: runtime.chartRuntime.valueFormatting.tooltipDecimals.');
  }

  const tooltip = asObject(chartRuntime?.tooltip);
  if (!tooltip) {
    errors.push('Missing required contract object: runtime.chartRuntime.tooltip.');
  }
  if (!isBoolean(tooltip?.enabled)) {
    errors.push('Missing required contract boolean: runtime.chartRuntime.tooltip.enabled.');
  }
  if (!isNonEmptyString(tooltip?.categoryTitle)) {
    errors.push('Missing required contract string: runtime.chartRuntime.tooltip.categoryTitle.');
  }
  if (!isNonEmptyString(tooltip?.valueTitle)) {
    errors.push('Missing required contract string: runtime.chartRuntime.tooltip.valueTitle.');
  }

  const unitLabels = asObject(chartRuntime?.unitLabels);
  if (!unitLabels) {
    errors.push('Missing required contract object: runtime.chartRuntime.unitLabels.');
  }

  const requiredUnitLabelFields = ['base', 'thousand', 'million', 'billion'] as const;
  for (const field of requiredUnitLabelFields) {
    if (!isNonEmptyString(unitLabels?.[field])) {
      errors.push(`Missing required contract string: runtime.chartRuntime.unitLabels.${field}.`);
    }
  }

  const controls = asObject(runtime?.controls);
  if (!controls) {
    errors.push('Missing required contract object: runtime.controls.');
  }

  const bucketEditor = asObject(controls?.bucketEditor);
  if (!bucketEditor) {
    errors.push('Missing required contract object: runtime.controls.bucketEditor.');
  }

  const bucketEditorLabels = asObject(bucketEditor?.labels);
  if (!bucketEditorLabels) {
    errors.push('Missing required contract object: runtime.controls.bucketEditor.labels.');
  } else {
    const requiredBucketEditorLabelFields = [
      'modalTitle',
      'modalHelperText',
      'addBucketButton',
      'restoreDefaultsButton',
      'validateButton',
      'cancelButton',
      'applyButton',
      'overlapErrorText',
      'validateBeforeApplyText',
    ] as const;

    for (const field of requiredBucketEditorLabelFields) {
      if (!isNonEmptyString(bucketEditorLabels[field])) {
        errors.push(`Missing required contract string: runtime.controls.bucketEditor.labels.${field}.`);
      }
    }
  }

  const nameSuggestion = asObject(bucketEditor?.nameSuggestion);
  if (!nameSuggestion) {
    errors.push('Missing required contract object: runtime.controls.bucketEditor.nameSuggestion.');
  } else {
    const requiredNameSuggestionFields = [
      'title',
      'subtitle',
      'boundsLabel',
      'currentLabel',
      'suggestedLabel',
      'customInputLabel',
      'previousButtonTitle',
      'nextButtonTitle',
      'backButton',
      'applyCustomNameButton',
      'useSuggestedButton',
      'keepCurrentButton',
      'enterNewNameButton',
    ] as const;

    for (const field of requiredNameSuggestionFields) {
      if (!isNonEmptyString(nameSuggestion[field])) {
        errors.push(`Missing required contract string: runtime.controls.bucketEditor.nameSuggestion.${field}.`);
      }
    }
  }

  const parameters = asObject(chartMetadata.parameters);
  if (!parameters) {
    errors.push('Missing required contract object: parameters.');
  }

  const reportDateParam = asObject(parameters?.report_date);
  if (!reportDateParam) {
    errors.push('Missing required parameter contract: parameters.report_date.');
  }

  const bucketsParam = asObject(parameters?.buckets);
  if (!bucketsParam) {
    errors.push('Missing required parameter contract: parameters.buckets.');
  }
  if (!Array.isArray(bucketsParam?.default) || bucketsParam.default.length === 0) {
    errors.push('Missing required parameter default array: parameters.buckets.default.');
  }

  const allowed = chartMetadata.allowedQueryParams;
  if (!Array.isArray(allowed)) {
    errors.push('Missing required contract array: allowedQueryParams.');
  } else {
    const allowedLower = new Set(allowed.map((key) => key.toLowerCase()));
    if (!allowedLower.has('report_date')) {
      errors.push('allowedQueryParams must include report_date.');
    }
    if (!allowedLower.has('buckets')) {
      errors.push('allowedQueryParams must include buckets.');
    }
  }

  if (Object.keys(themes).length === 0) {
    errors.push('Missing required themes contract: themes payload is empty.');
  }

  if (!themes.light && Object.keys(themes).length === 0) {
    errors.push('Missing required default theme contract: no available theme key.');
  }

  for (const [themeKey, themeValue] of Object.entries(themes)) {
    const themeRecord = asObject(themeValue);
    const ui = asObject(themeRecord?.ui);
    if (!ui) {
      errors.push(`Missing required theme contract object: themes.${themeKey}.ui.`);
      continue;
    }

    if (!isNonEmptyString(ui.currencySymbol)) {
      errors.push(`Missing required theme contract string: themes.${themeKey}.ui.currencySymbol.`);
    }

    if (!isNonEmptyString(ui.tooltipTheme)) {
      errors.push(`Missing required theme contract string: themes.${themeKey}.ui.tooltipTheme.`);
    }

    const tooltip = asObject(ui.tooltip);
    if (!tooltip) {
      errors.push(`Missing required theme contract object: themes.${themeKey}.ui.tooltip.`);
    } else {
      if (!isNonEmptyString(tooltip.fillColor)) {
        errors.push(`Missing required theme contract string: themes.${themeKey}.ui.tooltip.fillColor.`);
      }
      if (!isNonEmptyString(tooltip.backgroundColor)) {
        errors.push(
          `Missing required theme contract string: themes.${themeKey}.ui.tooltip.backgroundColor.`
        );
      }
      if (!isNonEmptyString(tooltip.textColor)) {
        errors.push(`Missing required theme contract string: themes.${themeKey}.ui.tooltip.textColor.`);
      }
      if (!isNonEmptyString(tooltip.fontFamily)) {
        errors.push(`Missing required theme contract string: themes.${themeKey}.ui.tooltip.fontFamily.`);
      }
      if (!isNonNegativeNumber(tooltip.fontSize)) {
        errors.push(`Missing required theme contract number: themes.${themeKey}.ui.tooltip.fontSize.`);
      }
      if (!isNonEmptyString(tooltip.fontWeight)) {
        errors.push(`Missing required theme contract string: themes.${themeKey}.ui.tooltip.fontWeight.`);
      }
      if (!isNonEmptyString(tooltip.fontStyle)) {
        errors.push(`Missing required theme contract string: themes.${themeKey}.ui.tooltip.fontStyle.`);
      }
      if (!isNonEmptyString(tooltip.borderColor)) {
        errors.push(`Missing required theme contract string: themes.${themeKey}.ui.tooltip.borderColor.`);
      }
      if (!isNonNegativeNumber(tooltip.borderWidth)) {
        errors.push(`Missing required theme contract number: themes.${themeKey}.ui.tooltip.borderWidth.`);
      }
      if (!isNonNegativeNumber(tooltip.borderRadius)) {
        errors.push(`Missing required theme contract number: themes.${themeKey}.ui.tooltip.borderRadius.`);
      }
      if (!isNonNegativeNumber(tooltip.padding)) {
        errors.push(`Missing required theme contract number: themes.${themeKey}.ui.tooltip.padding.`);
      }
    }

    const compactSuffixes = asObject(ui.compactSuffixes);
    if (!compactSuffixes) {
      errors.push(`Missing required theme contract object: themes.${themeKey}.ui.compactSuffixes.`);
      continue;
    }

    const requiredSuffixes = ['thousand', 'million', 'billion'] as const;
    for (const suffixKey of requiredSuffixes) {
      if (!isNonEmptyString(compactSuffixes[suffixKey])) {
        errors.push(
          `Missing required theme contract string: themes.${themeKey}.ui.compactSuffixes.${suffixKey}.`
        );
      }
    }
  }

  return errors;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function filterAllowedQueryParams(
  params: Record<string, string | number | boolean>,
  allowed: string[]
) {
  const allowedSet = new Set(allowed.map((key) => key.toLowerCase()));
  const filtered: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(params)) {
    if (allowedSet.has(key.toLowerCase())) {
      filtered[key] = value;
    }
  }

  return filtered;
}

