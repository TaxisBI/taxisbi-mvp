import type { TimeSeriesLineConfig, VegaLiteSpec } from './types';

export function buildTimeSeriesLineSpec(config: TimeSeriesLineConfig): VegaLiteSpec {
  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    title: config.title,
    mark: {
      type: 'line',
      point: config.showPoints ?? false,
    },
    encoding: {
      x: {
        field: config.xField,
        type: 'temporal',
      },
      y: {
        field: config.yField,
        type: config.yType,
      },
    },
  };
}
