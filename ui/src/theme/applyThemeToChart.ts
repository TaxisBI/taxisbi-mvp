// Utility to resolve and apply theme settings for any chart
import type { ThemeDefinition } from './types';

export function applyThemeToChart(theme: ThemeDefinition) {
  const ui = theme.ui ?? {};
  // Extract generic settings
  return {
    cardBackground: ui.cardBackground ?? '#fff',
    cardShadow: ui.cardShadow ?? '0 12px 40px rgba(15, 23, 42, 0.15)',
    tooltipTheme: ui.tooltipTheme ?? 'light',
    typography: {
      title: {
        fontFamily: ui.titleFontFamily ?? 'Helvetica, Arial, sans-serif',
        fontSize: ui.titleFontSize ?? 16,
        fontWeight: ui.titleFontWeight ?? 'bold',
        fontStyle: ui.titleFontStyle ?? 'normal',
        fontColor: ui.titleFontColor ?? '#111827',
      },
      legend: {
        fontFamily: ui.legendFontFamily ?? 'Helvetica, Arial, sans-serif',
        fontSize: ui.legendFontSize ?? 12,
        fontWeight: ui.legendFontWeight ?? 'normal',
        fontStyle: ui.legendFontStyle ?? 'normal',
        fontColor: ui.legendFontColor ?? '#111827',
      },
      axis: {
        fontFamily: ui.axisFontFamily ?? 'Helvetica, Arial, sans-serif',
        fontSize: ui.axisFontSize ?? 12,
        fontWeight: ui.axisFontWeight ?? 'normal',
        fontStyle: ui.axisFontStyle ?? 'normal',
        fontColor: ui.axisFontColor ?? '#111827',
      },
      barLabel: {
        fontFamily: ui.barLabelFontFamily ?? 'Helvetica, Arial, sans-serif',
        fontSize: ui.barLabelFontSize ?? 12,
        fontWeight: ui.barLabelFontWeight ?? 'normal',
        fontStyle: ui.barLabelFontStyle ?? 'normal',
        fontColor: ui.barLabelFontColor ?? '#111827',
      },
      tooltip: {
        fontFamily: ui.tooltipFontFamily ?? 'Helvetica, Arial, sans-serif',
        fontSize: ui.tooltipFontSize ?? 12,
        fontWeight: ui.tooltipFontWeight ?? 'normal',
        fontStyle: ui.tooltipFontStyle ?? 'normal',
        fontColor: ui.tooltipFontColor ?? '#111827',
      },
    },
    // Add other settings as needed
  };
}
