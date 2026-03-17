export type VegaLiteSpec = Record<string, unknown>;

export type CategoricalSort = string[] | 'x' | 'y' | '-x' | '-y';

export type CategoricalBarConfig = {
  title?: string;
  xField: string;
  xType: 'nominal' | 'ordinal';
  yField: string;
  yType: 'quantitative';
  sort?: CategoricalSort;
  showDataLabels?: boolean;
};

export type TimeSeriesLineConfig = {
  title?: string;
  xField: string;
  yField: string;
  yType: 'quantitative';
  showPoints?: boolean;
};

export type KpiCardConfig = {
  title?: string;
  valueField: string;
  subtitle?: string;
};

export type SupportedChartType = 'categorical_bar' | 'time_series_line' | 'kpi_card';
