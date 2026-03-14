import { clickhouse } from '../clickhouse/client';
import { loadChartSpec } from './loadChartSpec';
import { loadQuerySql } from './loadQuerySql';
import { resolvePackPaths } from './resolvePackPaths';

export type ChartPayload = {
  spec: Record<string, unknown>;
  data: Array<Record<string, unknown>>;
};

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

  if (!params.report_date) {
    params.report_date = new Date().toISOString().slice(0, 10);
  }

  return params;
}

export async function getChartPayload(args: {
  domain: string;
  pack: string;
  chart: string;
  queryParams?: Record<string, unknown>;
}): Promise<ChartPayload> {
  const paths = await resolvePackPaths(args.domain, args.pack, args.chart);
  const [spec, sql] = await Promise.all([
    loadChartSpec(paths.chartSpecPath),
    loadQuerySql(paths.querySqlPath),
  ]);

  const result = await clickhouse.query({
    query: sql,
    format: 'JSONEachRow',
    query_params: normalizeQueryParams(args.queryParams ?? {}),
  });

  const data = (await result.json()) as Array<Record<string, unknown>>;
  return { spec, data };
}
