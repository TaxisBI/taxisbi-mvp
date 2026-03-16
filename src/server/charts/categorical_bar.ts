import type { CategoricalBarConfig } from "./types.js";

/**
 * Build a Vega-Lite spec for a categorical bar chart.
 *
 * If `showDataLabels` is true the function returns a layered spec with a
 * text mark on top of the bars so that values are readable at a glance.
 */
export function buildCategoricalBarSpec(config: CategoricalBarConfig): object {
  const { title, xField, xType, yField, yType, sort, showDataLabels } = config;

  // X encoding shared by all layers.
  const xEncoding = {
    field: xField,
    type: xType,
    ...(sort !== undefined ? { sort } : {}),
    axis: { labelAngle: -30 },
  };

  // Y encoding shared by all layers.
  const yEncoding = {
    field: yField,
    type: yType,
    axis: { title: yField },
  };

  // Base bar layer.
  const barLayer = {
    mark: { type: "bar" },
    encoding: {
      x: xEncoding,
      y: yEncoding,
    },
  };

  if (!showDataLabels) {
    // Single-layer spec (simpler output when labels are not needed).
    return {
      $schema: "https://vega.github.io/schema/vega-lite/v5.json",
      ...(title ? { title } : {}),
      mark: barLayer.mark,
      encoding: barLayer.encoding,
    };
  }

  // Layered spec: bars + text labels.
  const textLayer = {
    mark: { type: "text", dy: -5 },
    encoding: {
      x: xEncoding,
      y: yEncoding,
      text: { field: yField, type: yType, format: ",.0f" },
    },
  };

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    ...(title ? { title } : {}),
    layer: [barLayer, textLayer],
  };
}
