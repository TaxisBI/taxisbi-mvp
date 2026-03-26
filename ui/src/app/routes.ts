import type { ThemeBuilderReportId } from '../theme/navigation';

export const APP_ROUTES = {
  landing: '/',
  themeBuilder: '/themebuilder',
  themeBuilderWithReport: '/themebuilder/:reportId',
  arAgingBucket: '/domains/ar/aging-bucket',
  apPayablesOverview: '/domains/ap/payables-overview',
  otherStarter: '/domains/other/starter',
} as const;

export function getThemeBuilderPath(reportId?: ThemeBuilderReportId) {
  return reportId ? `${APP_ROUTES.themeBuilder}/${reportId}` : APP_ROUTES.themeBuilder;
}
