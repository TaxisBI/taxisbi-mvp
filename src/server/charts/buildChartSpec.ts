import type {
  CategoricalBarConfig,
  TimeSeriesLineConfig,
  KpiCardConfig,
} from "./types.js";
import { buildCategoricalBarSpec } from "./categorical_bar.js";
import { buildTimeSeriesLineSpec } from "./time_series_line.js";
import { buildKpiCardSpec } from "./kpi_card.js";

/** All supported chart archetypes, used for error messages and validation. */
const SUPPORTED_CHART_TYPES = [
  "categorical_bar",
  "time_series_line",
  "kpi_card",
] as const;

/**
 * Union of all supported per-chart config types, keyed by chart type.
 *
 * Adding a new chart archetype requires:
 *  1. A new config interface in types.ts
 *  2. A new builder function in its own file
 *  3. A new entry in the union and switch below
 */
export type ChartConfig =
  | ({ type: "categorical_bar" } & CategoricalBarConfig)
  | ({ type: "time_series_line" } & TimeSeriesLineConfig)
  | ({ type: "kpi_card" } & KpiCardConfig);

/**
 * Dispatch to the correct chart builder based on `config.type`.
 *
 * Packs must choose from the supported archetypes — arbitrary Vega-Lite
 * cannot be generated through this path by design.
 *
 * @param config - A chart config object that includes a `type` discriminant.
 * @returns A Vega-Lite spec object ready to be sent to the frontend.
 * @throws If `config.type` is not a recognised chart archetype.
 *
 * @example
 * ```ts
 * const spec = buildChartSpec({
 *   type: "categorical_bar",
 *   title: "AR Aging by Bucket",
 *   xField: "AgingBucket",
 *   xType: "ordinal",
 *   yField: "Balance",
 *   yType: "quantitative",
 *   sort: ["Current", "1-30", "31-60", "61-90", "90+"],
 *   showDataLabels: true,
 * });
 * ```
 */
export function buildChartSpec(config: ChartConfig): object {
  switch (config.type) {
    case "categorical_bar":
      return buildCategoricalBarSpec(config);
    case "time_series_line":
      return buildTimeSeriesLineSpec(config);
    case "kpi_card":
      return buildKpiCardSpec(config);
    default: {
      // Exhaustiveness check — TypeScript will catch unhandled union members
      // at compile time; the runtime branch below handles JS callers.
      const _exhaustive: never = config;
      const unknownType = (_exhaustive as { type: string }).type;
      throw new Error(
        `Unsupported chart type: "${unknownType}". ` +
          `Supported types are: ${SUPPORTED_CHART_TYPES.join(", ")}.`
      );
    }
  }
}
