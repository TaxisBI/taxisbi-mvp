import type { KpiCardConfig, VegaLiteSpec } from './types';

export function buildKpiCardSpec(config: KpiCardConfig): VegaLiteSpec {
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    title: config.title,
    layer: [
      {
        mark: {
          type: 'text',
          fontSize: 42,
          fontWeight: 'bold',
          align: 'center',
          baseline: 'middle',
        },
        encoding: {
          text: {
            field: config.valueField,
            type: 'quantitative',
          },
        },
      },
      {
        mark: {
          type: 'text',
          fontSize: 14,
          dy: 34,
          align: 'center',
          baseline: 'middle',
          color: '#666666',
        },
        encoding: {
          text: {
            value: config.subtitle ?? '',
          },
        },
      },
    ],
    width: 260,
    height: 120,
  };
}
