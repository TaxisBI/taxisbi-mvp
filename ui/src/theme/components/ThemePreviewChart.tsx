import VegaChartRenderer from '../../charts/components/VegaChartRenderer';
import type { ThemeBuilderUiTheme } from '../types';

type ThemePreviewChartProps = {
  uiTheme: ThemeBuilderUiTheme;
  colorDraftByToken: Record<string, string>;
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

export default function ThemePreviewChart({ uiTheme, colorDraftByToken }: ThemePreviewChartProps) {
  const pageBackground = getTokenColor(colorDraftByToken, ['pageBackground'], uiTheme.pageBackground);
  const pageText = getTokenColor(colorDraftByToken, ['pageText'], uiTheme.pageText);
  const hoverColor = getTokenColor(colorDraftByToken, ['hoverColor'], '#22c55e');
  const barDefaultColor = getTokenColor(colorDraftByToken, ['chartBarDefaultColor'], '#4f46e5');
  const barHoverColor = getTokenColor(colorDraftByToken, ['chartBarHoverColor'], '#10b981');
  const barStrokeColor = getTokenColor(colorDraftByToken, ['chartBarDefaultStrokeColor'], '#1f2937');
  const statusDanger = getTokenColor(colorDraftByToken, ['statusDanger'], '#dc2626');
  const statusSuccess = getTokenColor(colorDraftByToken, ['statusSuccess'], '#16a34a');
  const axisGrid = getTokenColor(colorDraftByToken, ['buttonBorder', 'border'], '#cbd5e1');

  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    width: 720,
    height: 420,
    title: 'Theme Preview: Bars + Line + Labels',
    data: {
      values: [
        { month: 'Jan', value: 130, target: 110, segment: 'Actual', label: '130' },
        { month: 'Feb', value: 180, target: 150, segment: 'Actual', label: '180' },
        { month: 'Mar', value: 160, target: 170, segment: 'Actual', label: '160' },
        { month: 'Apr', value: 210, target: 190, segment: 'Actual', label: '210' },
        { month: 'May', value: 240, target: 220, segment: 'Actual', label: '240' },
      ],
    },
    layer: [
      {
        mark: { type: 'bar', cornerRadiusTopLeft: 4, cornerRadiusTopRight: 4, strokeWidth: 1.5 },
        encoding: {
          x: { field: 'month', type: 'ordinal', title: 'Month' },
          y: { field: 'value', type: 'quantitative', title: 'Value' },
          color: {
            field: 'segment',
            type: 'nominal',
            scale: { range: [barDefaultColor, barHoverColor] },
            legend: { title: 'Series' },
          },
          stroke: { value: barStrokeColor },
          tooltip: [
            { field: 'month', type: 'nominal', title: 'Month' },
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
        mark: { type: 'text', dy: -8, fontSize: 11, fontWeight: 700 },
        encoding: {
          x: { field: 'month', type: 'ordinal' },
          y: { field: 'value', type: 'quantitative' },
          text: { field: 'label', type: 'nominal' },
          color: { value: statusDanger },
        },
      },
    ],
    config: {
      background: pageBackground,
      view: { stroke: axisGrid, strokeOpacity: 0.85 },
      axis: {
        labelColor: pageText,
        titleColor: pageText,
        grid: true,
        gridColor: axisGrid,
        domainColor: axisGrid,
        tickColor: axisGrid,
      },
      title: {
        color: pageText,
        fontSize: 15,
      },
      legend: {
        labelColor: pageText,
        titleColor: pageText,
      },
      style: {
        'guide-label': { fill: pageText },
        'guide-title': { fill: pageText },
      },
    },
  };

  return (
    <VegaChartRenderer
      spec={spec}
      tooltipTheme={getTooltipTheme(pageBackground)}
      cardBackground={uiTheme.cardBackground}
      cardShadow={uiTheme.cardShadow}
      canvasSizeMode="fit-width"
    />
  );
}
