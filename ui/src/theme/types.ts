export type ThemeScope = 'global' | 'domain' | 'pack' | 'dashboard';
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
    pack?: string[];
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
  pack: string;
  chart: string;
  dashboard: string;
};

export type ThemeSaveDraft = {
  label: string;
  key: string;
  scope: ThemeScope;
  domain: string;
  pack: string;
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
  overlapPalette: Array<{ border: string; background: string }>;
  tooltipTheme: 'light' | 'dark';
  tooltipStyle: TooltipStyleContract;
};
