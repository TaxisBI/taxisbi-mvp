// Utility to resolve and apply theme settings for any chart
import type { ChartUiThemeContract, ThemeDefinition } from './types';

function asString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asTooltipTheme(value: unknown): 'light' | 'dark' {
  return value === 'dark' ? 'dark' : 'light';
}

function asOverlapPalette(value: unknown): Array<{ border: string; background: string }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        return null;
      }

      const record = entry as Record<string, unknown>;
      if (typeof record.border !== 'string' || typeof record.background !== 'string') {
        return null;
      }

      return {
        border: record.border,
        background: record.background,
      };
    })
    .filter((entry): entry is { border: string; background: string } => entry !== null);
}

export function applyThemeToChart(theme: ThemeDefinition): ChartUiThemeContract {
  const ui = theme.ui ?? {};
  const tooltip =
    ui.tooltip && typeof ui.tooltip === 'object' && !Array.isArray(ui.tooltip)
      ? (ui.tooltip as Record<string, unknown>)
      : {};

  return {
    pageBackground: asString(ui.pageBackground, '#f5f7fb'),
    pageText: asString(ui.pageText, '#101828'),
    cardBackground: asString(ui.cardBackground, '#ffffff'),
    cardShadow: asString(ui.cardShadow, '0 12px 40px rgba(15, 23, 42, 0.15)'),
    buttonBackground: asString(ui.buttonBackground, '#ffffff'),
    buttonText: asString(ui.buttonText, '#0f172a'),
    buttonBorder: asString(ui.buttonBorder, '#cbd5e1'),
    hoverColor: asString(ui.hoverColor, '#f1f5f9'),
    fontFamily: asString(ui.fontFamily, 'Helvetica, Arial, sans-serif'),
    modalOverlayBackground: asString(ui.modalOverlayBackground, 'rgba(15, 23, 42, 0.45)'),
    statusDanger: asString(ui.statusDanger, '#dc2626'),
    statusSuccess: asString(ui.statusSuccess, '#16a34a'),
    statusOnColor: asString(ui.statusOnColor, '#ffffff'),
    chartBarDefaultColor: asString(ui.chartBarDefaultColor, '#4f46e5'),
    chartBarHoverColor: asString(ui.chartBarHoverColor, '#6366f1'),
    chartBarDefaultOpacity: asNumber(ui.chartBarDefaultOpacity, 0.72),
    chartBarHoverOpacity: asNumber(ui.chartBarHoverOpacity, 1),
    chartBarDefaultStrokeColor: asString(ui.chartBarDefaultStrokeColor, '#1d4ed8'),
    chartBarHoverStrokeColor: asString(ui.chartBarHoverStrokeColor, '#1e40af'),
    chartBarDefaultStrokeOpacity: asNumber(ui.chartBarDefaultStrokeOpacity, 1),
    chartBarHoverStrokeOpacity: asNumber(ui.chartBarHoverStrokeOpacity, 1),
    chartBarDefaultStrokeWidth: asNumber(ui.chartBarDefaultStrokeWidth, 2),
    chartBarHoverStrokeWidth: asNumber(ui.chartBarHoverStrokeWidth, 3),
    overlapPalette:
      asOverlapPalette(ui.overlapPalette).length > 0
        ? asOverlapPalette(ui.overlapPalette)
        : [{ border: '#dc2626', background: '#ffffff' }],
    tooltipTheme: asTooltipTheme(ui.tooltipTheme),
    tooltipStyle: {
      fillColor: asString(tooltip.fillColor, '#f1f5f9'),
      backgroundColor: asString(tooltip.backgroundColor, '#ffffff'),
      textColor: asString(tooltip.textColor, '#0f172a'),
      fontFamily: asString(tooltip.fontFamily, asString(ui.fontFamily, 'Helvetica, Arial, sans-serif')),
      fontSize: asNumber(tooltip.fontSize, 12),
      fontWeight: asString(tooltip.fontWeight, '600'),
      fontStyle: asString(tooltip.fontStyle, 'normal'),
      borderColor: asString(tooltip.borderColor, '#cbd5e1'),
      borderWidth: asNumber(tooltip.borderWidth, 1),
      borderRadius: asNumber(tooltip.borderRadius, 8),
      padding: asNumber(tooltip.padding, 8),
    },
  };
}
