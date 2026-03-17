import fs from 'node:fs/promises';
import { parse } from 'yaml';
import type { BuildChartSpecInput } from '../charts/buildChartSpec';
import { isSupportedChartType } from '../charts/buildChartSpec';
import { PackArtifactNotFoundError } from './resolvePackPaths';

type RawManifest = {
  charts?: Record<string, unknown>;
};

export type PackChartParameterDef = {
  type: string;
  uiControl?: string;
  label?: string;
  description?: string;
  required?: boolean;
  default?: unknown;
};

export type PackChartMetadata = {
  chartBuilderInput: BuildChartSpecInput | null;
  allowedQueryParams: string[] | null;
  parameters: Record<string, PackChartParameterDef> | null;
  runtime: Record<string, unknown> | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export async function loadPackChartConfig(
  manifestPath: string,
  chartName: string
): Promise<PackChartMetadata> {
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
    throw new PackArtifactNotFoundError(`Invalid chart metadata for chart: ${chartName}`);
  }

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
    throw new PackArtifactNotFoundError(
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
  parameters: Record<string, PackChartParameterDef> | null
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

function readParameters(input: unknown): Record<string, PackChartParameterDef> | null {
  const record = asRecord(input);
  if (!record) {
    return null;
  }

  const result: Record<string, PackChartParameterDef> = {};
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
