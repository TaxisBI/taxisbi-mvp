import fs from 'node:fs/promises';
import path from 'node:path';
import { clickhouse } from '../clickhouse/client';

type ThemeDef = {
  key: string;
  label: string;
  createdBy?: string;
  displayOrder?: number;
  extends?: string;
  scope?: 'global' | 'domain' | 'pack' | 'dashboard';
  appliesTo?: {
    domain?: string[];
    pack?: string[];
    chart?: string[];
    dashboard?: string[];
  };
  ui: Record<string, unknown>;
  spec: Record<string, unknown>;
};

type ThemeContext = {
  domain: string;
  pack: string;
  chart: string;
  dashboard?: string;
};

export type AgingBucketInput = {
  name: string;
  isSpecial: boolean;
  combinator: 'AND' | 'OR';
  conditions: Array<{
    operator: '=' | '<>' | '>=' | '<=' | '>' | '<';
    value: number;
  }>;
};

const DEFAULT_AGING_BUCKETS: AgingBucketInput[] = [
  { name: 'Current', isSpecial: false, combinator: 'AND', conditions: [{ operator: '<=', value: 0 }] },
  {
    name: '1-30',
    isSpecial: false,
    combinator: 'AND',
    conditions: [
      { operator: '>=', value: 1 },
      { operator: '<=', value: 30 },
    ],
  },
  {
    name: '31-60',
    isSpecial: false,
    combinator: 'AND',
    conditions: [
      { operator: '>=', value: 31 },
      { operator: '<=', value: 60 },
    ],
  },
  {
    name: '61-90',
    isSpecial: false,
    combinator: 'AND',
    conditions: [
      { operator: '>=', value: 61 },
      { operator: '<=', value: 90 },
    ],
  },
  { name: '91+', isSpecial: false, combinator: 'AND', conditions: [{ operator: '>', value: 90 }] },
];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<T>(base: T, override: unknown): T {
  if (override === undefined) {
    return base;
  }

  if (Array.isArray(base) && Array.isArray(override)) {
    const maxLength = Math.max(base.length, override.length);
    const merged = Array.from({ length: maxLength }, (_, index) => {
      if (index in override) {
        return deepMerge((base as unknown[])[index], override[index]);
      }
      return (base as unknown[])[index];
    });
    return merged as T;
  }

  if (isObject(base) && isObject(override)) {
    const result: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(override)) {
      result[key] = key in result ? deepMerge(result[key], value) : value;
    }
    return result as T;
  }

  return override as T;
}

async function collectJsonFilesRecursively(dirPath: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await collectJsonFilesRecursively(fullPath)));
      } else if (
        entry.isFile() &&
        entry.name.endsWith('.json') &&
        !entry.name.includes('.schema.')
      ) {
        files.push(fullPath);
      }
    }
  } catch {
    // Optional theme folder.
  }

  return files;
}

function matchesApplyList(list: string[] | undefined, value: string | undefined) {
  if (!list || list.length === 0) {
    return true;
  }
  if (!value) {
    return false;
  }
  return list.includes(value);
}

function themeAppliesToContext(theme: ThemeDef, context: ThemeContext) {
  const appliesTo = theme.appliesTo;
  if (!appliesTo) {
    return true;
  }

  return (
    matchesApplyList(appliesTo.domain, context.domain) &&
    matchesApplyList(appliesTo.pack, context.pack) &&
    matchesApplyList(appliesTo.chart, context.chart) &&
    matchesApplyList(appliesTo.dashboard, context.dashboard)
  );
}

function resolveTheme(
  themeKey: string,
  themeMap: Record<string, ThemeDef>,
  resolving: Set<string>
): ThemeDef | null {
  const theme = themeMap[themeKey];
  if (!theme) {
    return null;
  }

  if (!theme.extends) {
    return theme;
  }

  if (resolving.has(themeKey)) {
    return null;
  }

  resolving.add(themeKey);
  const parent = resolveTheme(theme.extends, themeMap, resolving);
  resolving.delete(themeKey);

  if (!parent) {
    return theme;
  }

  return {
    ...theme,
    ui: deepMerge(parent.ui, theme.ui),
    spec: deepMerge(parent.spec, theme.spec),
  };
}

async function loadBuiltInThemes(themeRootPath: string, context: ThemeContext) {
  const allThemeFiles = await collectJsonFilesRecursively(themeRootPath);
  const rawThemeMap: Record<string, ThemeDef> = {};

  for (const themeFilePath of allThemeFiles) {
    const themeText = await fs.readFile(themeFilePath, 'utf8');
    const parsed = JSON.parse(themeText) as Partial<ThemeDef>;

    if (
      typeof parsed.key !== 'string' ||
      !parsed.key.trim() ||
      typeof parsed.label !== 'string' ||
      !isObject(parsed.ui) ||
      !isObject(parsed.spec)
    ) {
      continue;
    }

    rawThemeMap[parsed.key.trim()] = {
      key: parsed.key.trim(),
      label: parsed.label,
      createdBy: typeof parsed.createdBy === 'string' ? parsed.createdBy : undefined,
      displayOrder: typeof parsed.displayOrder === 'number' ? parsed.displayOrder : undefined,
      extends: parsed.extends,
      scope: parsed.scope,
      appliesTo: parsed.appliesTo,
      ui: parsed.ui,
      spec: parsed.spec,
    };
  }

  const resolved: Record<string, ThemeDef> = {};
  for (const key of Object.keys(rawThemeMap)) {
    const hydrated = resolveTheme(key, rawThemeMap, new Set<string>());
    if (hydrated && themeAppliesToContext(hydrated, context)) {
      resolved[key] = hydrated;
    }
  }

  return resolved;
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.toISOString().slice(0, 10) === value;
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function escapeSqlString(value: string) {
  return value.replace(/'/g, "''");
}

function buildBucketExpressions(buckets: AgingBucketInput[]) {
  const labelParts: string[] = [];
  const orderParts: string[] = [];

  buckets.forEach((bucket, index) => {
    const conditionParts = bucket.conditions
      .map((entry) => `days_past_due ${entry.operator} ${entry.value}`)
      .map((entry) => `(${entry})`);
    const joiner = bucket.isSpecial && bucket.combinator === 'OR' ? ' OR ' : ' AND ';
    const condition = conditionParts.join(joiner);
    const label = `'${escapeSqlString(bucket.name)}'`;
    const orderValue = String(index + 1);

    labelParts.push(condition, label);
    orderParts.push(condition, orderValue);
  });

  const agingBucketExpr = `multiIf(${labelParts.join(', ')}, 'Unbucketed')`;
  const agingBucketOrderExpr = `multiIf(${orderParts.join(', ')}, 9999)`;

  return {
    agingBucketExpr,
    agingBucketOrderExpr,
  };
}

function toSafeAgingBuckets(input?: AgingBucketInput[]) {
  if (!input || input.length === 0) {
    return DEFAULT_AGING_BUCKETS;
  }

  return input.map((bucket) => ({
    name: bucket.name,
    isSpecial: bucket.isSpecial,
    combinator: bucket.combinator,
    conditions: bucket.conditions.map((entry) => ({
      operator: entry.operator,
      value: entry.value,
    })),
  }));
}

export async function getAgingChart(reportDateInput?: string, bucketDefsInput?: AgingBucketInput[]) {
  const themeContext: ThemeContext = {
    domain: 'AR',
    pack: 'Receivable_item',
    chart: 'aging_by_bucket',
  };
  const reportDate =
    reportDateInput && isValidIsoDate(reportDateInput) ? reportDateInput : getTodayIsoDate();

  const sqlPath = path.resolve(
    process.cwd(),
    'domains/AR/packs/Receivable_item/queries/aging_by_bucket.sql'
  );

  const specPath = path.resolve(
    process.cwd(),
    'domains/AR/packs/Receivable_item/charts/aging_by_bucket.v1.json'
  );
  const themeRootPath = path.resolve(process.cwd(), 'themes');

  const sql = await fs.readFile(sqlPath, 'utf8');
  const bucketDefs = toSafeAgingBuckets(bucketDefsInput);
  const { agingBucketExpr, agingBucketOrderExpr } = buildBucketExpressions(bucketDefs);
  const finalSql = sql
    .replace('{{AGING_BUCKET_EXPR}}', agingBucketExpr)
    .replace('{{AGING_BUCKET_ORDER_EXPR}}', agingBucketOrderExpr);
  const specText = await fs.readFile(specPath, 'utf8');
  const spec = JSON.parse(specText);
  const themes = await loadBuiltInThemes(themeRootPath, themeContext);
  const defaultTheme = themes.light ? 'light' : Object.keys(themes)[0] ?? 'light';

  const resultSet = await clickhouse.query({
    query: finalSql,
    format: 'JSONEachRow',
    query_params: {
      report_date: reportDate,
    },
  });

  const data = await resultSet.json();

  return {
    spec,
    data,
    themes,
    defaultTheme,
    reportDate,
    buckets: bucketDefs,
  };
}
