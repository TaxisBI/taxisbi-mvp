import fs from 'node:fs/promises';
import { parse } from 'yaml';
import type { BuildChartSpecInput } from '../charts/buildChartSpec';
import { isSupportedChartType } from '../charts/buildChartSpec';
import { RulebookArtifactNotFoundError } from './resolveRulebookPaths';

type RawManifest = {
  charts?: Record<string, unknown>;
};

export type RulebookChartParameterDef = {
  type: string;
  uiControl?: string;
  label?: string;
  description?: string;
  required?: boolean;
  default?: unknown;
};

export type RulebookChartMetadata = {
  chartBuilderInput: BuildChartSpecInput | null;
  allowedQueryParams: string[] | null;
  parameters: Record<string, RulebookChartParameterDef> | null;
  runtime: Record<string, unknown> | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function throwManifestError(manifestPath: string, chartName: string, message: string): never {
  throw new Error(`Invalid chart metadata in ${manifestPath} for chart '${chartName}': ${message}`);
}

function assertNoCommonTypos(
  chartRecord: Record<string, unknown>,
  manifestPath: string,
  chartName: string
) {
  const typoMap: Record<string, string> = {
    parameteres: 'parameters',
    allowedQueryParam: 'allowedQueryParams',
    allowed_query_params: 'allowedQueryParams',
    queryParams: 'runtime.queryParams',
    sqlToken: 'runtime.sqlTokens',
  };

  for (const [typo, expected] of Object.entries(typoMap)) {
    if (typo in chartRecord) {
      throwManifestError(manifestPath, chartName, `found '${typo}'. Did you mean '${expected}'?`);
    }
  }
}

function assertParametersShape(
  parameters: unknown,
  manifestPath: string,
  chartName: string
) {
  if (parameters === undefined || parameters === null) {
    return;
  }

  const record = asRecord(parameters);
  if (!record) {
    throwManifestError(manifestPath, chartName, `'parameters' must be an object.`);
  }

  for (const [key, value] of Object.entries(record)) {
    const parameter = asRecord(value);
    if (!parameter) {
      throwManifestError(manifestPath, chartName, `parameter '${key}' must be an object.`);
    }

    if (typeof parameter.type !== 'string' || !parameter.type.trim()) {
      throwManifestError(manifestPath, chartName, `parameter '${key}' must include non-empty string 'type'.`);
    }
  }
}

function assertAllowedQueryParamsShape(
  allowedQueryParams: unknown,
  manifestPath: string,
  chartName: string
) {
  if (allowedQueryParams === undefined || allowedQueryParams === null) {
    return;
  }

  if (!Array.isArray(allowedQueryParams)) {
    throwManifestError(manifestPath, chartName, `'allowedQueryParams' must be an array of strings.`);
  }

  for (const value of allowedQueryParams) {
    if (typeof value !== 'string' || !value.trim()) {
      throwManifestError(manifestPath, chartName, `'allowedQueryParams' must contain only non-empty strings.`);
    }
  }
}

export async function loadRulebookChartConfig(
  manifestPath: string,
  chartName: string
): Promise<RulebookChartMetadata> {
  let manifestText = '';

  try {
    manifestText = await fs.readFile(manifestPath, 'utf8');
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      return {
        chartBuilderInput: null,
        allowedQueryParams: null,
        parameters: null,
        runtime: null,
      };
    }
    throw error;
  }

  if (!manifestText.trim()) {
    return {
      chartBuilderInput: null,
      allowedQueryParams: null,
      parameters: null,
      runtime: null,
    };
  }

  const manifest = parse(manifestText) as RawManifest;
  if (!manifest?.charts || typeof manifest.charts !== 'object') {
    return {
      chartBuilderInput: null,
      allowedQueryParams: null,
      parameters: null,
      runtime: null,
    };
  }

  const rawChart = manifest.charts[chartName];
  if (!rawChart) {
    return {
      chartBuilderInput: null,
      allowedQueryParams: null,
      parameters: null,
      runtime: null,
    };
  }

  const chartRecord = asRecord(rawChart);
  if (!chartRecord) {
    throw new RulebookArtifactNotFoundError(`Invalid chart metadata for chart: ${chartName}`);
  }

  assertNoCommonTypos(chartRecord, manifestPath, chartName);
  assertParametersShape(chartRecord.parameters, manifestPath, chartName);
  assertAllowedQueryParamsShape(chartRecord.allowedQueryParams, manifestPath, chartName);

  const parameters = readParameters(chartRecord.parameters);
  const allowedQueryParams = readAllowedQueryParams(chartRecord.allowedQueryParams, parameters);
  const runtime = asRecord(chartRecord.runtime);

  const chartType = chartRecord.type;
  if (chartType === undefined || chartType === null || chartType === '') {
    return {
      chartBuilderInput: null,
      allowedQueryParams,
      parameters,
      runtime,
    };
  }

  if (!isSupportedChartType(chartType)) {
    throw new RulebookArtifactNotFoundError(
      `Unsupported chart type '${String(chartType)}' in ${manifestPath} for chart '${chartName}'.`
    );
  }

  const {
    type,
    parameters: _parameters,
    allowedQueryParams: _allowedQueryParams,
    runtime: _runtime,
    ...rest
  } = chartRecord;

  return {
    chartBuilderInput: {
      type,
      config: rest,
    } as BuildChartSpecInput,
    allowedQueryParams,
    parameters,
    runtime,
  };
}

function readAllowedQueryParams(
  input: unknown,
  parameters: Record<string, RulebookChartParameterDef> | null
): string[] | null {
  if (Array.isArray(input)) {
    const values = input.filter((value): value is string => typeof value === 'string' && !!value.trim());
    return values.length > 0 ? values : [];
  }

  if (parameters && Object.keys(parameters).length > 0) {
    return Object.keys(parameters);
  }

  return null;
}

function readParameters(input: unknown): Record<string, RulebookChartParameterDef> | null {
  const record = asRecord(input);
  if (!record) {
    return null;
  }

  const result: Record<string, RulebookChartParameterDef> = {};
  for (const [key, value] of Object.entries(record)) {
    const paramRecord = asRecord(value);
    if (!paramRecord || typeof paramRecord.type !== 'string' || !paramRecord.type.trim()) {
      continue;
    }

    result[key] = {
      type: paramRecord.type.trim(),
      uiControl: typeof paramRecord.uiControl === 'string' ? paramRecord.uiControl : undefined,
      label: typeof paramRecord.label === 'string' ? paramRecord.label : undefined,
      description: typeof paramRecord.description === 'string' ? paramRecord.description : undefined,
      required: typeof paramRecord.required === 'boolean' ? paramRecord.required : undefined,
      default: paramRecord.default,
    };
  }

  return Object.keys(result).length > 0 ? result : null;
}

