import type { KpiCardConfig } from "./types.js";

// Styling constants — centralised so they are easy to update consistently.
const KPI_VALUE_FONT_SIZE = 36;
const KPI_SUBTITLE_FONT_SIZE = 14;
const KPI_SUBTITLE_COLOR = "#666666";
const KPI_SUBTITLE_DY = 30; // vertical offset (px) below the value text

/**
 * Build a minimal Vega-Lite spec for a single-value KPI card.
 *
 * The spec renders the value field as a large centred text mark with an
 * optional title and subtitle.  This intentionally stays simple — the goal is
 * a scannable KPI tile, not a full dashboard widget.
 */
export function buildKpiCardSpec(config: KpiCardConfig): object {
  const { title, valueField, subtitle } = config;

  // Optional subtitle layer shown below the main value.
  const layers: object[] = [
    {
      mark: { type: "text", fontSize: KPI_VALUE_FONT_SIZE, fontWeight: "bold", dy: 0 },
      encoding: {
        text: { field: valueField, type: "nominal" },
      },
    },
  ];

  if (subtitle) {
    layers.push({
      mark: {
        type: "text",
        fontSize: KPI_SUBTITLE_FONT_SIZE,
        color: KPI_SUBTITLE_COLOR,
        dy: KPI_SUBTITLE_DY,
      },
      encoding: {
        text: { value: subtitle },
      },
    });
  }

  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    ...(title ? { title } : {}),
    width: 200,
    height: 100,
    layer: layers,
  };
}
