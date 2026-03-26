import type { ChartUiThemeContract } from '../../../theme/types';

export type CanvasSizeMode =
  | 'fit-width'
  | 'fit-height'
  | 'fit-screen'
  | 'ratio-4-3'
  | 'ratio-16-9'
  | 'ratio-16-10'
  | 'ratio-21-9'
  | 'custom-pixels';

export type ThemeOption = {
  key: string;
  label: string;
  scope?: 'global' | 'domain' | 'rulebook' | 'dashboard';
  createdBy?: string;
  displayOrder?: number;
};

export type ThemeDefinition = {
  key?: string;
  label?: string;
  scope?: 'global' | 'domain' | 'rulebook' | 'dashboard';
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

export type ResolvedUiTheme = ChartUiThemeContract;

export type ChartParameterDefinition = {
  type: string;
  uiControl?: string;
  label?: string;
  description?: string;
  required?: boolean;
  default?: unknown;
};

export type ChartPackMetadata = {
  parameters?: Record<string, ChartParameterDefinition>;
  runtime?: Record<string, unknown>;
};

export type ChartContext = {
  domain: string;
  rulebook: string;
  chart: string;
};

export type AgingBucketDef = {
  id: string;
  name: string;
  isSpecial: boolean;
  combinator: 'AND' | 'OR';
  conditions: Array<{
    operator: '=' | '<>' | '>=' | '<=' | '>' | '<';
    value: number;
  }>;
};

