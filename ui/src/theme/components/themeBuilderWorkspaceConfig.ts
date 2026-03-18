import { normalizeHexColor } from '../utils';

export const FONT_FAMILY_OPTIONS = [
  { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica (Default)' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Segoe UI, Tahoma, sans-serif', label: 'Segoe UI' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, Times, serif', label: 'Times New Roman' },
  { value: 'Courier New, Courier, monospace', label: 'Courier New' },
  { value: 'Trebuchet MS, sans-serif', label: 'Trebuchet MS' },
];

export const TYPOGRAPHY_OVERRIDE_SECTIONS = [
  {
    key: 'title',
    label: 'Chart Title',
    description: 'Overrides the main chart title above the preview.',
  },
  {
    key: 'legend',
    label: 'Legend',
    description: 'Overrides legend labels and the legend title.',
  },
  {
    key: 'axis',
    label: 'Axis',
    description: 'Overrides axis labels and axis titles.',
  },
  {
    key: 'barLabel',
    label: 'Bar Labels',
    description: 'Overrides the numeric labels drawn above the bars.',
  },
  {
    key: 'tooltip',
    label: 'Tooltip',
    description: 'Controls the preview tooltip card shown under the chart.',
  },
] as const;

export const TYPOGRAPHY_BASE_SUFFIXES = [
  'FontFamily',
  'FontWeight',
  'FontStyle',
  'FontSize',
  'FontColor',
] as const;

export const TYPOGRAPHY_SHARED_SUFFIXES = [
  ...TYPOGRAPHY_BASE_SUFFIXES,
  'TextRenderMode',
  'TextStrokeColor',
  'TextStrokeWidth',
] as const;

export const TOOLTIP_SURFACE_SUFFIXES = [
  'BackgroundColor',
  'BorderColor',
  'BorderWidth',
  'Padding',
] as const;

export const STYLE_ENUM_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
  legendOrient: [
    { value: 'left', label: 'Left' },
    { value: 'right', label: 'Right' },
    { value: 'top', label: 'Top' },
    { value: 'bottom', label: 'Bottom' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
  ],
  axisLabelOverlapStrategy: [
    { value: 'parity', label: 'Parity' },
    { value: 'greedy', label: 'Greedy' },
    { value: 'none', label: 'None' },
  ],
  axisGridDashStyle: [
    { value: 'solid', label: 'Solid' },
    { value: 'dotted', label: 'Dotted' },
    { value: 'dashed', label: 'Dashed' },
  ],
  axisDomainDashStyle: [
    { value: 'solid', label: 'Solid' },
    { value: 'dotted', label: 'Dotted' },
    { value: 'dashed', label: 'Dashed' },
  ],
  axisTickDashStyle: [
    { value: 'solid', label: 'Solid' },
    { value: 'dotted', label: 'Dotted' },
    { value: 'dashed', label: 'Dashed' },
  ],
  referenceLineDashStyle: [
    { value: 'solid', label: 'Solid' },
    { value: 'dotted', label: 'Dotted' },
    { value: 'dashed', label: 'Dashed' },
  ],
  chartLineInterpolate: [
    { value: 'linear', label: 'Linear' },
    { value: 'step', label: 'Step' },
    { value: 'step-after', label: 'Step After' },
    { value: 'step-before', label: 'Step Before' },
    { value: 'basis', label: 'Basis' },
    { value: 'cardinal', label: 'Cardinal' },
    { value: 'monotone', label: 'Monotone' },
  ],
  chartPointShape: [
    { value: 'circle', label: 'Circle' },
    { value: 'square', label: 'Square' },
    { value: 'cross', label: 'Cross' },
    { value: 'diamond', label: 'Diamond' },
    { value: 'triangle-up', label: 'Triangle Up' },
    { value: 'triangle-down', label: 'Triangle Down' },
  ],
};

export const STYLE_TOGGLE_KEYS = new Set(['xAxisGridEnabled', 'yAxisGridEnabled']);

export type ChartControlField =
  | {
      key: string;
      label: string;
      type: 'number';
      min?: number;
      max?: number;
      step?: number;
    }
  | {
      key: string;
      label: string;
      type: 'color';
    }
  | {
      key: string;
      label: string;
      type: 'select';
      options: Array<{ value: string; label: string }>;
    }
  | {
      key: string;
      label: string;
      type: 'toggle';
    };

export const CHART_CONTROL_GROUPS: Array<{
  key: string;
  label: string;
  description: string;
  fields: ChartControlField[];
}> = [
  {
    key: 'legend',
    label: 'Legend',
    description: 'Legend symbol size, spacing, and orientation.',
    fields: [
      { key: 'legendSymbolSize', label: 'Symbol Size', type: 'number', min: 0, step: 1 },
      { key: 'legendSymbolStrokeWidth', label: 'Symbol Stroke Width', type: 'number', min: 0, step: 0.5 },
      { key: 'legendLabelLimit', label: 'Label Limit', type: 'number', min: 0, step: 1 },
      { key: 'legendRowPadding', label: 'Row Padding', type: 'number', min: 0, step: 1 },
      { key: 'legendColumnPadding', label: 'Column Padding', type: 'number', min: 0, step: 1 },
      {
        key: 'legendOrient',
        label: 'Orientation',
        type: 'select',
        options: STYLE_ENUM_OPTIONS.legendOrient,
      },
    ],
  },
  {
    key: 'axis',
    label: 'Axis & Grid',
    description: 'Tick interval, label layout, and per-axis grid visibility.',
    fields: [
      { key: 'axisTickCount', label: 'Tick Count', type: 'number', min: 1, step: 1 },
      { key: 'axisLabelAngle', label: 'Label Angle', type: 'number', min: -180, max: 180, step: 1 },
      { key: 'axisLabelLimit', label: 'Label Limit', type: 'number', min: 0, step: 1 },
      { key: 'axisLabelPadding', label: 'Label Padding', type: 'number', min: 0, step: 1 },
      {
        key: 'axisLabelOverlapStrategy',
        label: 'Overlap Strategy',
        type: 'select',
        options: STYLE_ENUM_OPTIONS.axisLabelOverlapStrategy,
      },
      {
        key: 'axisNumberFormat',
        label: 'Number Format',
        type: 'select',
        options: [
          { value: ',.2f', label: 'Default (,.2f)' },
          { value: ',.0f', label: 'Integer (,.0f)' },
          { value: '$,.2f', label: 'Currency ($,.2f)' },
        ],
      },
      {
        key: 'axisDateFormat',
        label: 'Date Format',
        type: 'select',
        options: [
          { value: '%Y-%m-%d', label: 'YYYY-MM-DD' },
          { value: '%b %d, %Y', label: 'Mon DD, YYYY' },
          { value: '%m/%d/%Y', label: 'MM/DD/YYYY' },
        ],
      },
      { key: 'xAxisGridEnabled', label: 'X Axis Grid', type: 'toggle' },
      { key: 'yAxisGridEnabled', label: 'Y Axis Grid', type: 'toggle' },
      { key: 'axisGridWidth', label: 'Grid Width', type: 'number', min: 0, step: 0.5 },
      { key: 'axisTickWidth', label: 'Tick Width', type: 'number', min: 0, step: 0.5 },
      { key: 'axisDomainWidth', label: 'Domain Width', type: 'number', min: 0, step: 0.5 },
      {
        key: 'axisGridDashStyle',
        label: 'Grid Dash Style',
        type: 'select',
        options: STYLE_ENUM_OPTIONS.axisGridDashStyle,
      },
      {
        key: 'axisTickDashStyle',
        label: 'Tick Dash Style',
        type: 'select',
        options: STYLE_ENUM_OPTIONS.axisTickDashStyle,
      },
      {
        key: 'axisDomainDashStyle',
        label: 'Domain Dash Style',
        type: 'select',
        options: STYLE_ENUM_OPTIONS.axisDomainDashStyle,
      },
    ],
  },
  {
    key: 'series',
    label: 'Line/Point/Area',
    description: 'Series shape and interpolation settings.',
    fields: [
      { key: 'chartLineStrokeColor', label: 'Line Stroke', type: 'color' },
      { key: 'chartLineFillColor', label: 'Line Fill', type: 'color' },
      { key: 'chartLineStrokeWidth', label: 'Line Width', type: 'number', min: 0, step: 0.5 },
      { key: 'chartAreaOpacity', label: 'Area Opacity', type: 'number', min: 0, max: 1, step: 0.05 },
      {
        key: 'chartLineInterpolate',
        label: 'Interpolation',
        type: 'select',
        options: STYLE_ENUM_OPTIONS.chartLineInterpolate,
      },
      { key: 'chartLinePointFillColor', label: 'Point Fill', type: 'color' },
      { key: 'chartLinePointStrokeColor', label: 'Point Stroke', type: 'color' },
      { key: 'chartLinePointStrokeWidth', label: 'Point Stroke Width', type: 'number', min: 0, step: 0.5 },
      { key: 'chartPointSize', label: 'Point Size', type: 'number', min: 0, step: 1 },
      { key: 'chartPointOpacity', label: 'Point Opacity', type: 'number', min: 0, max: 1, step: 0.05 },
      {
        key: 'chartPointShape',
        label: 'Point Shape',
        type: 'select',
        options: STYLE_ENUM_OPTIONS.chartPointShape,
      },
    ],
  },
  {
    key: 'reference',
    label: 'Reference Line',
    description: 'Threshold/reference line appearance.',
    fields: [
      { key: 'referenceLineColor', label: 'Line Color', type: 'color' },
      { key: 'referenceLineWidth', label: 'Line Width', type: 'number', min: 0, step: 0.5 },
      {
        key: 'referenceLineDashStyle',
        label: 'Dash Style',
        type: 'select',
        options: STYLE_ENUM_OPTIONS.referenceLineDashStyle,
      },
      { key: 'referenceLineLabelColor', label: 'Label Color', type: 'color' },
      { key: 'referenceLineLabelFontSize', label: 'Label Font Size', type: 'number', min: 1, step: 1 },
    ],
  },
  {
    key: 'interaction',
    label: 'Interaction States',
    description: 'Selected, muted, and inactive series state styling.',
    fields: [
      { key: 'chartSeriesSelectedColor', label: 'Selected Color', type: 'color' },
      { key: 'chartSeriesSelectedOpacity', label: 'Selected Opacity', type: 'number', min: 0, max: 1, step: 0.05 },
      { key: 'chartSeriesMutedColor', label: 'Muted Color', type: 'color' },
      { key: 'chartSeriesMutedOpacity', label: 'Muted Opacity', type: 'number', min: 0, max: 1, step: 0.05 },
      { key: 'chartSeriesInactiveOpacity', label: 'Inactive Opacity', type: 'number', min: 0, max: 1, step: 0.05 },
    ],
  },
];

export type TypographySettings = {
  fontFamily: string;
  fontStyle: 'normal' | 'italic';
  fontWeight: 'normal' | 'bold';
  fontSize: number;
  fontColor: string;
  textRenderMode: 'fill' | 'hollow';
  textStrokeColor: string;
  textStrokeWidth: number;
};

export function getTypographySettingKey(prefix: string | null, suffix: string) {
  return prefix ? `${prefix}${suffix}` : `${suffix.charAt(0).toLowerCase()}${suffix.slice(1)}`;
}

export function getUiStringValue(
  editableThemeUi: Record<string, unknown> | null,
  key: string,
  fallback: string
) {
  const value = editableThemeUi?.[key];
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function getUiNumberValue(
  editableThemeUi: Record<string, unknown> | null,
  key: string,
  fallback: number
) {
  const value = editableThemeUi?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function getUiColorValue(
  editableThemeUi: Record<string, unknown> | null,
  key: string,
  fallback: string
) {
  const value = editableThemeUi?.[key];
  return typeof value === 'string' && normalizeHexColor(value) ? normalizeHexColor(value)! : fallback;
}

export function resolveTypographySettings(
  editableThemeUi: Record<string, unknown> | null,
  prefix: string | null,
  fallback?: TypographySettings
): TypographySettings {
  return {
    fontFamily: getUiStringValue(
      editableThemeUi,
      getTypographySettingKey(prefix, 'FontFamily'),
      fallback?.fontFamily ?? 'Helvetica, Arial, sans-serif'
    ),
    fontStyle:
      getUiStringValue(
        editableThemeUi,
        getTypographySettingKey(prefix, 'FontStyle'),
        fallback?.fontStyle ?? 'normal'
      ) === 'italic'
        ? 'italic'
        : 'normal',
    fontWeight:
      getUiStringValue(
        editableThemeUi,
        getTypographySettingKey(prefix, 'FontWeight'),
        fallback?.fontWeight ?? 'normal'
      ) === 'bold'
        ? 'bold'
        : 'normal',
    fontSize: getUiNumberValue(
      editableThemeUi,
      getTypographySettingKey(prefix, 'FontSize'),
      fallback?.fontSize ?? 12
    ),
    fontColor: getUiColorValue(
      editableThemeUi,
      getTypographySettingKey(prefix, 'FontColor'),
      fallback?.fontColor ?? '#111827'
    ),
    textRenderMode:
      getUiStringValue(
        editableThemeUi,
        getTypographySettingKey(prefix, 'TextRenderMode'),
        fallback?.textRenderMode ?? 'fill'
      ) === 'hollow'
        ? 'hollow'
        : 'fill',
    textStrokeColor: getUiColorValue(
      editableThemeUi,
      getTypographySettingKey(prefix, 'TextStrokeColor'),
      fallback?.textStrokeColor ?? '#111827'
    ),
    textStrokeWidth: getUiNumberValue(
      editableThemeUi,
      getTypographySettingKey(prefix, 'TextStrokeWidth'),
      fallback?.textStrokeWidth ?? 1.2
    ),
  };
}

export const MANAGED_TYPOGRAPHY_STYLE_KEYS = new Set<string>([
  ...TYPOGRAPHY_SHARED_SUFFIXES.map((suffix) => getTypographySettingKey(null, suffix)),
  ...TYPOGRAPHY_OVERRIDE_SECTIONS.flatMap((section) =>
    TYPOGRAPHY_BASE_SUFFIXES.map((suffix) => getTypographySettingKey(section.key, suffix))
  ),
]);

export const MANAGED_WIDTH_STYLE_KEYS = new Set<string>([
  ...TOOLTIP_SURFACE_SUFFIXES.filter((suffix) => suffix === 'BorderWidth' || suffix === 'Padding').map(
    (suffix) => getTypographySettingKey('tooltip', suffix)
  ),
]);