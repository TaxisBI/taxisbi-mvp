/**
 * Public API for the TaxisBI chart builder library.
 *
 * Import chart builders and types from here rather than from the individual
 * files so internal paths can change without breaking callers.
 *
 * @example
 * ```ts
 * import { buildChartSpec } from "./charts/index.js";
 *
 * const spec = buildChartSpec({
 *   type: "categorical_bar",
 *   xField: "AgingBucket",
 *   xType: "ordinal",
 *   yField: "Balance",
 *   yType: "quantitative",
 * });
 * ```
 */

export { buildCategoricalBarSpec } from "./categorical_bar.js";
export { buildTimeSeriesLineSpec } from "./time_series_line.js";
export { buildKpiCardSpec } from "./kpi_card.js";
export { buildChartSpec } from "./buildChartSpec.js";
export type {
  ChartType,
  CategoricalBarConfig,
  TimeSeriesLineConfig,
  KpiCardConfig,
} from "./types.js";
export type { ChartConfig } from "./buildChartSpec.js";
