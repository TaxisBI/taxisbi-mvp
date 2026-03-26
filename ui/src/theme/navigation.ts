import type { ThemeBuilderContext } from './types';

type ThemeBuilderReportConfig = {
  themeContext: ThemeBuilderContext;
};

// Add new reports here. One new key entry is enough to make context routing available.
export const THEME_BUILDER_REPORTS = {
  'ar-aging': {
    themeContext: {
      domain: 'AR',
      rulebook: 'Receivable_item',
      chart: 'aging_by_bucket',
      dashboard: 'ar-aging-bucket',
    },
  },
} satisfies Record<string, ThemeBuilderReportConfig>;

export type ThemeBuilderReportId = keyof typeof THEME_BUILDER_REPORTS;

export function isThemeBuilderReportId(value: string): value is ThemeBuilderReportId {
  return value in THEME_BUILDER_REPORTS;
}

export function getThemeBuilderContextForReport(reportId: ThemeBuilderReportId): ThemeBuilderContext {
  return THEME_BUILDER_REPORTS[reportId].themeContext;
}

