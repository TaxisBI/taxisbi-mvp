export type ThemeScope = 'global' | 'domain' | 'rulebook' | 'dashboard';
export type ThemePathSegment = string | number;

export type ThemeDefinition = {
  key?: string;
  label?: string;
  scope?: ThemeScope;
  createdBy?: string;
  displayOrder?: number;
  extends?: string;
  appliesTo?: {
    domain?: string[];
    rulebook?: string[];
    chart?: string[];
    dashboard?: string[];
  };
  ui?: Record<string, unknown>;
  spec?: Record<string, unknown>;
};

export type ThemeOption = {
  key: string;
  label: string;
  scope?: ThemeScope;
  createdBy?: string;
  displayOrder?: number;
};

export type ThemeBuilderContext = {
  domain: string;
  rulebook: string;
  chart: string;
  dashboard: string;
};

export type ThemeSaveDraft = {
  label: string;
  key: string;
  scope: ThemeScope;
  domain: string;
  rulebook: string;
  chart: string;
  dashboard: string;
};

export type ColorStudioToken = {
  path: ThemePathSegment[];
  pathText: string;
  label: string;
  value: string;
};

export type StyleStudioToken = {
  path: ThemePathSegment[];
  pathText: string;
  label: string;
  value: number | string;
  valueType: 'number' | 'text';
  group: 'widths' | 'typography';
};

export type ThemeBuilderUiTheme = {
  pageBackground: string;
  pageText: string;
  cardBackground: string;
  cardShadow: string;
  buttonBackground: string;
  buttonText: string;
  buttonBorder: string;
  modalOverlayBackground: string;
  statusDanger: string;
};

export type TooltipStyleContract = {
  fillColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  padding: number;
};

export type ChartUiThemeContract = {
  pageBackground: string;
  pageText: string;
  cardBackground: string;
  cardShadow: string;
  buttonBackground: string;
  buttonText: string;
  buttonBorder: string;
  hoverColor: string;
  fontFamily: string;
  modalOverlayBackground: string;
  statusDanger: string;
  statusSuccess: string;
  statusOnColor: string;
  chartBarDefaultColor: string;
  chartBarHoverColor: string;
  chartBarDefaultOpacity: number;
  chartBarHoverOpacity: number;
  chartBarDefaultStrokeColor: string;
  chartBarHoverStrokeColor: string;
  chartBarDefaultStrokeOpacity: number;
  chartBarHoverStrokeOpacity: number;
  chartBarDefaultStrokeWidth: number;
  chartBarHoverStrokeWidth: number;
  chartCardBorderRadius: number;
  chartViewCornerRadius: number;
  chartBarCornerRadius: number;
  chartRectCornerRadius: number;
  chartLegendCornerRadius: number;
  chartBarBandPaddingInner: number;
  chartBarBandPaddingOuter: number;
  chartBandPaddingInner: number;
  chartBandPaddingOuter: number;
  chartBarDiscreteBandSize: number;
  chartBarContinuousBandSize: number;
  chartLineStrokeColor: string;
  chartLineFillColor: string;
  chartLineStrokeWidth: number;
  chartLinePointFillColor: string;
  chartLinePointStrokeColor: string;
  chartLinePointStrokeWidth: number;
  titleFontFamily: string;
  titleFontSize: number;
  titleFontWeight: string;
  titleFontStyle: string;
  titleFontColor: string;
  axisTickCount: number;
  axisGridDashStyle: 'solid' | 'dotted' | 'dashed';
  axisDomainDashStyle: 'solid' | 'dotted' | 'dashed';
  axisTickDashStyle: 'solid' | 'dotted' | 'dashed';
  axisGridWidth: number;
  axisTickWidth: number;
  axisDomainWidth: number;
  legendSymbolSize: number;
  legendSymbolStrokeWidth: number;
  legendLabelLimit: number;
  legendRowPadding: number;
  legendColumnPadding: number;
  legendOrient: 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  axisLabelAngle: number;
  axisLabelLimit: number;
  axisLabelPadding: number;
  axisLabelOverlapStrategy: 'parity' | 'greedy' | 'none';
  axisNumberFormat: string;
  axisDateFormat: string;
  xAxisGridEnabled: number;
  yAxisGridEnabled: number;
  chartPointShape: 'circle' | 'square' | 'cross' | 'diamond' | 'triangle-up' | 'triangle-down';
  chartPointSize: number;
  chartPointOpacity: number;
  chartAreaOpacity: number;
  chartLineInterpolate:
    | 'linear'
    | 'step'
    | 'step-after'
    | 'step-before'
    | 'basis'
    | 'cardinal'
    | 'monotone';
  referenceLineColor: string;
  referenceLineWidth: number;
  referenceLineDashStyle: 'solid' | 'dotted' | 'dashed';
  referenceLineLabelColor: string;
  referenceLineLabelFontSize: number;
  chartSeriesSelectedColor: string;
  chartSeriesSelectedOpacity: number;
  chartSeriesMutedColor: string;
  chartSeriesMutedOpacity: number;
  chartSeriesInactiveOpacity: number;
  overlapPalette: Array<{ border: string; background: string }>;
  tooltipTheme: 'light' | 'dark';
  tooltipStyle: TooltipStyleContract;
};

