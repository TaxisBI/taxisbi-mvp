import type { ThemeBuilderContext } from './types';

export type ThemeBuilderReportId = 'ar-aging';

const THEME_BUILDER_CONTEXT_BY_REPORT: Record<ThemeBuilderReportId, ThemeBuilderContext> = {
  'ar-aging': {
    domain: 'AR',
    pack: 'Receivable_item',
    chart: 'aging_by_bucket',
    dashboard: 'ar-aging-bucket',
  },
};

export function getThemeBuilderContextForReport(reportId: ThemeBuilderReportId): ThemeBuilderContext {
  return THEME_BUILDER_CONTEXT_BY_REPORT[reportId];
}
