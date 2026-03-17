import VegaChartRenderer from '../../charts/components/VegaChartRenderer';
import type { ThemeBuilderUiTheme } from '../types';
import { normalizeHexColor } from '../utils';

type ThemePreviewChartProps = {
  uiTheme: ThemeBuilderUiTheme;
  editableThemeUi: Record<string, unknown> | null;
  colorDraftByToken: Record<string, string>;
};

type TypographySettings = {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  fontColor: string;
  textRenderMode: 'fill' | 'hollow';
  textStrokeColor: string;
  textStrokeWidth: number;
};

function getTokenColor(
  colorDraftByToken: Record<string, string>,
  terms: string[],
  fallback: string
): string {
  const entries = Object.entries(colorDraftByToken);
  for (const [key, value] of entries) {
    const normalizedKey = key.toLowerCase();
    if (terms.some((term) => normalizedKey.includes(term.toLowerCase()))) {
      return value;
    }
  }
  return fallback;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function getUiNumber(
  editableThemeUi: Record<string, unknown> | null,
  key: string,
  fallback: number
) {
  if (!editableThemeUi) {
    return fallback;
  }

  const value = editableThemeUi[key];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  return fallback;
}

function getUiString(
  editableThemeUi: Record<string, unknown> | null,
  key: string,
  fallback: string
) {
  if (!editableThemeUi) {
    return fallback;
  }

  const value = editableThemeUi[key];
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function getUiColor(
  editableThemeUi: Record<string, unknown> | null,
  key: string,
  fallback: string
) {
  return normalizeHexColor(getUiString(editableThemeUi, key, fallback)) ?? fallback;
}

function getTypographySettingKey(prefix: string | null, suffix: string) {
  return prefix ? `${prefix}${suffix}` : `${suffix.charAt(0).toLowerCase()}${suffix.slice(1)}`;
}

function resolveTypographySettings(
  editableThemeUi: Record<string, unknown> | null,
  prefix: string | null,
  fallback: TypographySettings
): TypographySettings {
  return {
    fontFamily: getUiString(
      editableThemeUi,
      getTypographySettingKey(prefix, 'FontFamily'),
      fallback.fontFamily
    ),
    fontSize: Math.max(
      8,
      getUiNumber(editableThemeUi, getTypographySettingKey(prefix, 'FontSize'), fallback.fontSize)
    ),
    fontWeight: getUiString(
      editableThemeUi,
      getTypographySettingKey(prefix, 'FontWeight'),
      fallback.fontWeight
    ),
    fontStyle: getUiString(
      editableThemeUi,
      getTypographySettingKey(prefix, 'FontStyle'),
      fallback.fontStyle
    ),
    fontColor: getUiColor(
      editableThemeUi,
      getTypographySettingKey(prefix, 'FontColor'),
      fallback.fontColor
    ),
    textRenderMode:
      getUiString(
        editableThemeUi,
        getTypographySettingKey(prefix, 'TextRenderMode'),
        fallback.textRenderMode
      ) === 'hollow'
        ? 'hollow'
        : 'fill',
    textStrokeColor: getUiColor(
      editableThemeUi,
      getTypographySettingKey(prefix, 'TextStrokeColor'),
      fallback.textStrokeColor
    ),
    textStrokeWidth: Math.max(
      0.1,
      getUiNumber(
        editableThemeUi,
        getTypographySettingKey(prefix, 'TextStrokeWidth'),
        fallback.textStrokeWidth
      )
    ),
  };
}

function getTooltipTheme(background: string): 'light' | 'dark' {
  const hex = background.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    return 'light';
  }
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5 ? 'dark' : 'light';
}

export default function ThemePreviewChart({
  uiTheme,
  editableThemeUi,
  colorDraftByToken,
}: ThemePreviewChartProps) {
  const pageBackground = getTokenColor(colorDraftByToken, ['pageBackground'], uiTheme.pageBackground);
  const pageText = getTokenColor(colorDraftByToken, ['pageText'], uiTheme.pageText);
  const tone = getTooltipTheme(pageBackground) === 'dark' ? 'dark' : 'light';
  const hoverColor = getTokenColor(colorDraftByToken, ['hoverColor'], '#22c55e');
  const barDefaultColor = getTokenColor(colorDraftByToken, ['chartBarDefaultColor'], '#4f46e5');
  const barHoverColor = getTokenColor(
    colorDraftByToken,
    ['chartBarHoverColor', 'hoverColor'],
    '#10b981'
  );
  const barStrokeColor = getTokenColor(colorDraftByToken, ['chartBarDefaultStrokeColor'], '#1f2937');
  const barHoverStrokeColor = getTokenColor(
    colorDraftByToken,
    ['chartBarHoverStrokeColor', 'hoverColor'],
    barHoverColor
  );
  const barDefaultOpacity = clamp01(getUiNumber(editableThemeUi, 'chartBarDefaultOpacity', 0.78));
  const barHoverOpacity = clamp01(getUiNumber(editableThemeUi, 'chartBarHoverOpacity', 1));
  const barDefaultStrokeOpacity = clamp01(
    getUiNumber(editableThemeUi, 'chartBarDefaultStrokeOpacity', 1)
  );
  const barHoverStrokeOpacity = clamp01(
    getUiNumber(editableThemeUi, 'chartBarHoverStrokeOpacity', 1)
  );
  const barDefaultStrokeWidth = Math.max(
    0,
    getUiNumber(editableThemeUi, 'chartBarDefaultStrokeWidth', 1.5)
  );
  const barHoverStrokeWidth = Math.max(
    0,
    getUiNumber(editableThemeUi, 'chartBarHoverStrokeWidth', 3)
  );

  const categoricalB = getTokenColor(
    colorDraftByToken,
    [`colorTokens.multi.categorical.${tone}[1]`, `colorTokens.multi.categorical.${tone}.1`],
    '#0ea5e9'
  );
  const overlapBandBackground = getTokenColor(
    colorDraftByToken,
    ['overlapPalette[0].background', 'overlapPalette.0.background'],
    '#fee2e2'
  );
  const overlapBandBorder = getTokenColor(
    colorDraftByToken,
    ['overlapPalette[0].border', 'overlapPalette.0.border'],
    '#dc2626'
  );
  const statusSuccess = getTokenColor(colorDraftByToken, ['statusSuccess'], '#16a34a');
  const axisGrid = getTokenColor(colorDraftByToken, ['buttonBorder', 'border'], '#cbd5e1');

  const sharedTypography = resolveTypographySettings(editableThemeUi, null, {
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontSize: 12,
    fontWeight: 'normal',
    fontStyle: 'normal',
    fontColor: pageText,
    textRenderMode: 'fill',
    textStrokeColor: pageText,
    textStrokeWidth: 1.2,
  });
  const titleTypography = resolveTypographySettings(editableThemeUi, 'title', sharedTypography);
  const legendTypography = resolveTypographySettings(editableThemeUi, 'legend', sharedTypography);
  const axisTypography = resolveTypographySettings(editableThemeUi, 'axis', sharedTypography);
  const barLabelTypography = resolveTypographySettings(editableThemeUi, 'barLabel', sharedTypography);
  const tooltipTypography = resolveTypographySettings(editableThemeUi, 'tooltip', sharedTypography);

  const tooltipCardBackground = getUiColor(
    editableThemeUi,
    'tooltipBackgroundColor',
    tone === 'dark' ? '#111827' : '#ffffff'
  );
  const tooltipCardBorder = getUiColor(
    editableThemeUi,
    'tooltipBorderColor',
    tone === 'dark' ? '#334155' : '#d1d5db'
  );
  const tooltipBorderWidth = Math.max(0, getUiNumber(editableThemeUi, 'tooltipBorderWidth', 1));
  const tooltipPadding = Math.max(0, getUiNumber(editableThemeUi, 'tooltipPadding', 12));

  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 720,
    height: 420,
    title: 'Theme Preview: Bars + Line + Labels',
    data: {
      values: [
        { month: 'Jan', value: 130, target: 110, segment: 'Actual', label: '130' },
        { month: 'Jan', value: 105, target: 110, segment: 'Prior', label: '105' },
        { month: 'Feb', value: 180, target: 150, segment: 'Actual', label: '180' },
        { month: 'Feb', value: 150, target: 150, segment: 'Prior', label: '150' },
        { month: 'Mar', value: 160, target: 170, segment: 'Actual', label: '160' },
        { month: 'Mar', value: 145, target: 170, segment: 'Prior', label: '145' },
        { month: 'Apr', value: 210, target: 190, segment: 'Actual', label: '210' },
        { month: 'Apr', value: 188, target: 190, segment: 'Prior', label: '188' },
        { month: 'May', value: 240, target: 220, segment: 'Actual', label: '240' },
        { month: 'May', value: 205, target: 220, segment: 'Prior', label: '205' },
      ],
    },
    layer: [
      {
        mark: {
          type: 'rect',
          opacity: 0.24,
          strokeWidth: 1,
          strokeDash: [3, 3],
        },
        encoding: {
          x: { datum: 'Apr' },
          x2: { datum: 'May' },
          color: { value: overlapBandBackground },
          stroke: { value: overlapBandBorder },
        },
      },
      {
        params: [
          {
            name: 'barHoverPreview',
            select: {
              type: 'point',
              fields: ['month', 'segment'],
              on: 'mouseover',
              clear: 'mouseout',
            },
          },
        ],
        mark: {
          type: 'bar',
          cornerRadiusTopLeft: 4,
          cornerRadiusTopRight: 4,
        },
        encoding: {
          x: { field: 'month', type: 'ordinal', title: 'Month' },
          xOffset: { field: 'segment' },
          y: { field: 'value', type: 'quantitative', title: 'Value' },
          color: {
            condition: {
              param: 'barHoverPreview',
              empty: false,
              value: barHoverColor,
            },
            field: 'segment',
            type: 'nominal',
            scale: { domain: ['Actual', 'Prior'], range: [barDefaultColor, categoricalB] },
            legend: { title: 'Series' },
          },
          opacity: {
            condition: {
              param: 'barHoverPreview',
              empty: false,
              value: barHoverOpacity,
            },
            value: barDefaultOpacity,
          },
          stroke: {
            condition: {
              param: 'barHoverPreview',
              empty: false,
              value: barHoverStrokeColor,
            },
            value: barStrokeColor,
          },
          strokeOpacity: {
            condition: {
              param: 'barHoverPreview',
              empty: false,
              value: barHoverStrokeOpacity,
            },
            value: barDefaultStrokeOpacity,
          },
          strokeWidth: {
            condition: {
              param: 'barHoverPreview',
              empty: false,
              value: barHoverStrokeWidth,
            },
            value: barDefaultStrokeWidth,
          },
          tooltip: [
            { field: 'month', type: 'nominal', title: 'Month' },
            { field: 'segment', type: 'nominal', title: 'Series' },
            { field: 'value', type: 'quantitative', title: 'Actual' },
            { field: 'target', type: 'quantitative', title: 'Target' },
          ],
        },
      },
      {
        mark: { type: 'line', point: false, strokeDash: [6, 4], strokeWidth: 2 },
        encoding: {
          x: { field: 'month', type: 'ordinal' },
          y: { field: 'target', type: 'quantitative' },
          color: { value: hoverColor },
        },
      },
      {
        mark: { type: 'point', size: 70, filled: true },
        encoding: {
          x: { field: 'month', type: 'ordinal' },
          y: { field: 'target', type: 'quantitative' },
          color: { value: statusSuccess },
        },
      },
      {
        transform: [{ filter: "datum.segment === 'Actual'" }],
        mark: {
          type: 'text',
          dy: -8,
          font: barLabelTypography.fontFamily,
          fontSize: barLabelTypography.fontSize,
          fontWeight: barLabelTypography.fontWeight,
          fontStyle: barLabelTypography.fontStyle,
          fill: barLabelTypography.fontColor,
          fillOpacity: sharedTypography.textRenderMode === 'hollow' ? 0 : 1,
          stroke: sharedTypography.textStrokeColor,
          strokeWidth: sharedTypography.textRenderMode === 'hollow' ? sharedTypography.textStrokeWidth : 0,
        },
        encoding: {
          x: { field: 'month', type: 'ordinal' },
          y: { field: 'value', type: 'quantitative' },
          text: { field: 'label', type: 'nominal' },
        },
      },
      {
        mark: { type: 'rule', strokeDash: [8, 5], strokeWidth: 2 },
        encoding: {
          y: { datum: 175 },
          color: { value: hoverColor },
        },
      },
    ],
    config: {
      background: pageBackground,
      view: { stroke: axisGrid, strokeOpacity: 0.85 },
      axis: {
        labelColor: axisTypography.fontColor,
        titleColor: axisTypography.fontColor,
        labelFont: axisTypography.fontFamily,
        titleFont: axisTypography.fontFamily,
        labelFontSize: Math.max(10, axisTypography.fontSize - 1),
        titleFontSize: Math.max(12, axisTypography.fontSize + 1),
        labelFontStyle: axisTypography.fontStyle,
        titleFontStyle: axisTypography.fontStyle,
        labelFontWeight: axisTypography.fontWeight,
        titleFontWeight: axisTypography.fontWeight,
        grid: true,
        gridColor: axisGrid,
        domainColor: axisGrid,
        tickColor: axisGrid,
      },
      title: {
        color: titleTypography.fontColor,
        font: titleTypography.fontFamily,
        fontSize: Math.max(14, titleTypography.fontSize + 3),
        fontWeight: titleTypography.fontWeight,
        fontStyle: titleTypography.fontStyle,
      },
      legend: {
        labelColor: legendTypography.fontColor,
        titleColor: legendTypography.fontColor,
        labelFont: legendTypography.fontFamily,
        titleFont: legendTypography.fontFamily,
        labelFontSize: Math.max(10, legendTypography.fontSize - 1),
        titleFontSize: Math.max(12, legendTypography.fontSize + 1),
        labelFontStyle: legendTypography.fontStyle,
        titleFontStyle: legendTypography.fontStyle,
        labelFontWeight: legendTypography.fontWeight,
        titleFontWeight: legendTypography.fontWeight,
      },
      style: {
        'guide-label': {
          fill: axisTypography.fontColor,
          font: axisTypography.fontFamily,
          fontStyle: axisTypography.fontStyle,
          fontWeight: axisTypography.fontWeight,
        },
        'guide-title': {
          fill: axisTypography.fontColor,
          font: axisTypography.fontFamily,
          fontStyle: axisTypography.fontStyle,
          fontWeight: axisTypography.fontWeight,
        },
      },
    },
  };

  return (
    <VegaChartRenderer
      spec={spec}
      tooltipTheme={getTooltipTheme(pageBackground)}
      cardBackground={uiTheme.cardBackground}
      cardShadow={uiTheme.cardShadow}
      tooltipStyle={{
        fillColor: tooltipCardBackground,
        fontFamily: tooltipTypography.fontFamily,
        fontSize: tooltipTypography.fontSize,
        fontWeight: tooltipTypography.fontWeight,
        fontStyle: tooltipTypography.fontStyle,
        textColor: tooltipTypography.fontColor,
        backgroundColor: tooltipCardBackground,
        borderColor: tooltipCardBorder,
        borderWidth: tooltipBorderWidth,
        borderRadius: 8,
        padding: tooltipPadding,
      }}
      canvasSizeMode="fit-width"
    />
  );
}
