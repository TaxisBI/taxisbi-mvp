import type { TimeSeriesLineConfig } from "./types.js";

/**
 * Build a Vega-Lite spec for a time-series line chart.
 *
 * The X axis is always treated as temporal.  When `showPoints` is true the
 * spec uses a "line + point" compound mark so individual data points are
 * visible on hover.
 */
export function buildTimeSeriesLineSpec(config: TimeSeriesLineConfig): object {
  const { title, xField, yField, yType, showPoints } = config;

  const mark: object = showPoints
    ? { type: "line", point: true }
    : { type: "line" };

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    ...(title ? { title } : {}),
    mark,
    encoding: {
      x: {
        field: xField,
        type: "temporal",
        axis: { title: xField, format: "%b %Y", labelAngle: -30 },
      },
      y: {
        field: yField,
        type: yType,
        axis: { title: yField },
      },
    },
  };
}
