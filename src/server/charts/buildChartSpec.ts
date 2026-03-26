import { buildCategoricalBarSpec } from './categorical_bar';
import { buildKpiCardSpec } from './kpi_card';
import { buildTimeSeriesLineSpec } from './time_series_line';
import type {
  CategoricalBarConfig,
  KpiCardConfig,
  SupportedChartType,
  TimeSeriesLineConfig,
  VegaLiteSpec,
} from './types';

export type BuildChartSpecInput =
  | { type: 'categorical_bar'; config: CategoricalBarConfig }
  | { type: 'time_series_line'; config: TimeSeriesLineConfig }
  | { type: 'kpi_card'; config: KpiCardConfig };

export function buildChartSpec(input: BuildChartSpecInput): VegaLiteSpec {
  switch (input.type) {
    case 'categorical_bar':
      return buildCategoricalBarSpec(input.config);
    case 'time_series_line':
      return buildTimeSeriesLineSpec(input.config);
    case 'kpi_card':
      return buildKpiCardSpec(input.config);
  }

  const unsupported = input as { type: string };
  throw new Error(`Unsupported chart type: ${unsupported.type}`);
}

export function isSupportedChartType(value: unknown): value is SupportedChartType {
  return value === 'categorical_bar' || value === 'time_series_line' || value === 'kpi_card';
}
