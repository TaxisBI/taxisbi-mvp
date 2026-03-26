import type { CategoricalBarConfig, VegaLiteSpec } from './types';

export function buildCategoricalBarSpec(config: CategoricalBarConfig): VegaLiteSpec {
  // Keep a horizontal bar layout to stay compatible with existing AR chart consumption.
  const encoding: Record<string, unknown> = {
    x: {
      field: config.yField,
      type: config.yType,
    },
    y: {
      field: config.xField,
      type: config.xType,
      sort: config.sort,
    },
  };

  if (config.showDataLabels) {
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      title: config.title,
      encoding,
      layer: [
        {
          mark: {
            type: 'bar',
          },
        },
        {
          mark: {
            type: 'text',
            align: 'left',
            baseline: 'middle',
            dx: 4,
          },
          encoding: {
            text: {
              field: config.yField,
              type: 'quantitative',
            },
          },
        },
      ],
    };
  }

  return {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    title: config.title,
    mark: {
      type: 'bar',
    },
    encoding,
  };
}
