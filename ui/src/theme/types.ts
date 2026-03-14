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
