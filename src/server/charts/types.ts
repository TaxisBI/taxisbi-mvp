/**
 * Shared config types for the TaxisBI chart builder library.
 *
 * Each config type is intentionally narrow and opinionated so that packs are
 * constrained to a controlled set of chart archetypes.  Arbitrary Vega-Lite
 * cannot be expressed through these types by design.
 */

/** Supported chart archetypes.  Adding a new archetype requires both a type
 *  entry here AND a corresponding builder in buildChartSpec.ts. */
export type ChartType = "categorical_bar" | "time_series_line" | "kpi_card";

// ---------------------------------------------------------------------------
// Categorical bar
// ---------------------------------------------------------------------------

export interface CategoricalBarConfig {
  title?: string;
  /** Field name for the X axis (category). */
  xField: string;
  xType: "nominal" | "ordinal";
  /** Field name for the Y axis (measure). */
  yField: string;
  /** Y axis is always quantitative for a bar chart. */
  yType: "quantitative";
  /** Sort order for the X categories.  Accepts Vega-Lite sort shorthand or an
   *  explicit array of category values. */
  sort?: string[] | "x" | "y" | "-x" | "-y";
  /** When true, render data-label text on each bar. */
  showDataLabels?: boolean;
}

// ---------------------------------------------------------------------------
// Time-series line
// ---------------------------------------------------------------------------

export interface TimeSeriesLineConfig {
  title?: string;
  /** Field name for the temporal X axis. */
  xField: string;
  /** Field name for the quantitative Y axis. */
  yField: string;
  yType: "quantitative";
  /** When true, render a point mark at each data value. */
  showPoints?: boolean;
}

// ---------------------------------------------------------------------------
// KPI card
// ---------------------------------------------------------------------------

export interface KpiCardConfig {
  title?: string;
  /** Field name that holds the single KPI value to display. */
  valueField: string;
  subtitle?: string;
}
