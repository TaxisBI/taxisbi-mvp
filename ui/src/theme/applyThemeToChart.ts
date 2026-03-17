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

function asDashStyle(value: unknown): 'solid' | 'dotted' | 'dashed' {
  return value === 'dotted' || value === 'dashed' ? value : 'solid';
}

function asLegendOrient(
  value: unknown
): 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' {
  const allowed = new Set([
    'left',
    'right',
    'top',
    'bottom',
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
  ]);
  return typeof value === 'string' && allowed.has(value) ? (value as any) : 'right';
}

function asAxisOverlap(value: unknown): 'parity' | 'greedy' | 'none' {
  return value === 'greedy' || value === 'none' ? value : 'parity';
}

function asPointShape(
  value: unknown
): 'circle' | 'square' | 'cross' | 'diamond' | 'triangle-up' | 'triangle-down' {
  const allowed = new Set(['circle', 'square', 'cross', 'diamond', 'triangle-up', 'triangle-down']);
  return typeof value === 'string' && allowed.has(value) ? (value as any) : 'circle';
}

function asLineInterpolate(
  value: unknown
): 'linear' | 'step' | 'step-after' | 'step-before' | 'basis' | 'cardinal' | 'monotone' {
  const allowed = new Set([
    'linear',
    'step',
    'step-after',
    'step-before',
    'basis',
    'cardinal',
    'monotone',
  ]);
  return typeof value === 'string' && allowed.has(value) ? (value as any) : 'linear';
}

function asToggleNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number') {
    return value > 0 ? 1 : 0;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === '1' || normalized === 'true' || normalized === 'on') {
      return 1;
    }
    if (normalized === '0' || normalized === 'false' || normalized === 'off') {
      return 0;
    }
  }
  return fallback > 0 ? 1 : 0;
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
    chartCardBorderRadius: asNumber(ui.chartCardBorderRadius, 12),
    chartViewCornerRadius: asNumber(ui.chartViewCornerRadius, 0),
    chartBarCornerRadius: asNumber(ui.chartBarCornerRadius, 4),
    chartRectCornerRadius: asNumber(ui.chartRectCornerRadius, 4),
    chartLegendCornerRadius: asNumber(ui.chartLegendCornerRadius, 4),
    chartBarBandPaddingInner: asNumber(ui.chartBarBandPaddingInner, 0.15),
    chartBarBandPaddingOuter: asNumber(ui.chartBarBandPaddingOuter, 0.1),
    chartBandPaddingInner: asNumber(ui.chartBandPaddingInner, 0.15),
    chartBandPaddingOuter: asNumber(ui.chartBandPaddingOuter, 0.1),
    chartBarDiscreteBandSize: asNumber(ui.chartBarDiscreteBandSize, 20),
    chartBarContinuousBandSize: asNumber(ui.chartBarContinuousBandSize, 5),
    chartLineStrokeColor: asString(ui.chartLineStrokeColor, '#4f46e5'),
    chartLineFillColor: asString(ui.chartLineFillColor, '#4f46e5'),
    chartLineStrokeWidth: asNumber(ui.chartLineStrokeWidth, 2),
    chartLinePointFillColor: asString(ui.chartLinePointFillColor, '#4f46e5'),
    chartLinePointStrokeColor: asString(ui.chartLinePointStrokeColor, '#ffffff'),
    chartLinePointStrokeWidth: asNumber(ui.chartLinePointStrokeWidth, 1),
    titleFontFamily: asString(ui.titleFontFamily, asString(ui.fontFamily, 'Helvetica, Arial, sans-serif')),
    titleFontSize: asNumber(ui.titleFontSize, 18),
    titleFontWeight: asString(ui.titleFontWeight, '600'),
    titleFontStyle: asString(ui.titleFontStyle, 'normal'),
    titleFontColor: asString(ui.titleFontColor, asString(ui.pageText, '#101828')),
    axisTickCount: asNumber(ui.axisTickCount, 6),
    axisGridDashStyle: asDashStyle(ui.axisGridDashStyle),
    axisDomainDashStyle: asDashStyle(ui.axisDomainDashStyle),
    axisTickDashStyle: asDashStyle(ui.axisTickDashStyle),
    axisGridWidth: asNumber(ui.axisGridWidth, 1),
    axisTickWidth: asNumber(ui.axisTickWidth, 1),
    axisDomainWidth: asNumber(ui.axisDomainWidth, 1),
    legendSymbolSize: asNumber(ui.legendSymbolSize, 140),
    legendSymbolStrokeWidth: asNumber(ui.legendSymbolStrokeWidth, 1),
    legendLabelLimit: asNumber(ui.legendLabelLimit, 220),
    legendRowPadding: asNumber(ui.legendRowPadding, 4),
    legendColumnPadding: asNumber(ui.legendColumnPadding, 12),
    legendOrient: asLegendOrient(ui.legendOrient),
    axisLabelAngle: asNumber(ui.axisLabelAngle, 0),
    axisLabelLimit: asNumber(ui.axisLabelLimit, 180),
    axisLabelPadding: asNumber(ui.axisLabelPadding, 6),
    axisLabelOverlapStrategy: asAxisOverlap(ui.axisLabelOverlapStrategy),
    axisNumberFormat: asString(ui.axisNumberFormat, ',.2f'),
    axisDateFormat: asString(ui.axisDateFormat, '%Y-%m-%d'),
    xAxisGridEnabled: asToggleNumber(ui.xAxisGridEnabled, 1),
    yAxisGridEnabled: asToggleNumber(ui.yAxisGridEnabled, 1),
    chartPointShape: asPointShape(ui.chartPointShape),
    chartPointSize: asNumber(ui.chartPointSize, 70),
    chartPointOpacity: asNumber(ui.chartPointOpacity, 1),
    chartAreaOpacity: asNumber(ui.chartAreaOpacity, 0.2),
    chartLineInterpolate: asLineInterpolate(ui.chartLineInterpolate),
    referenceLineColor: asString(ui.referenceLineColor, '#64748b'),
    referenceLineWidth: asNumber(ui.referenceLineWidth, 2),
    referenceLineDashStyle: asDashStyle(ui.referenceLineDashStyle),
    referenceLineLabelColor: asString(ui.referenceLineLabelColor, asString(ui.pageText, '#101828')),
    referenceLineLabelFontSize: asNumber(ui.referenceLineLabelFontSize, 12),
    chartSeriesSelectedColor: asString(ui.chartSeriesSelectedColor, asString(ui.chartBarHoverColor, '#22c55e')),
    chartSeriesSelectedOpacity: asNumber(ui.chartSeriesSelectedOpacity, 1),
    chartSeriesMutedColor: asString(ui.chartSeriesMutedColor, '#94a3b8'),
    chartSeriesMutedOpacity: asNumber(ui.chartSeriesMutedOpacity, 0.45),
    chartSeriesInactiveOpacity: asNumber(ui.chartSeriesInactiveOpacity, 0.2),
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
