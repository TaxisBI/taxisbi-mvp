import { useEffect, useState } from 'react';
import VegaChartRenderer from '../../../../charts/components/VegaChartRenderer';

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
  scope?: 'global' | 'domain' | 'pack' | 'dashboard';
  createdBy?: string;
  displayOrder?: number;
};

export type ThemeDefinition = {
  key?: string;
  label?: string;
  scope?: 'global' | 'domain' | 'pack' | 'dashboard';
  createdBy?: string;
  displayOrder?: number;
  extends?: string;
  appliesTo?: {
    domain?: string[];
    pack?: string[];
    chart?: string[];
    dashboard?: string[];
  };
  ui?: Record<string, unknown>;
  spec?: Record<string, unknown>;
};

export type ResolvedUiTheme = {
  pageBackground: string;
  pageText: string;
  cardBackground: string;
  cardShadow: string;
  buttonBackground: string;
  buttonText: string;
  buttonBorder: string;
  hoverColor: string;
  fontFamily: string;
  modalOverlayBackground: string;
  statusDanger: string;
  statusSuccess: string;
  statusOnColor: string;
  chartBarDefaultColor: string;
  chartBarHoverColor: string;
  chartBarDefaultOpacity: number;
  chartBarHoverOpacity: number;
  chartBarDefaultStrokeColor: string;
  chartBarHoverStrokeColor: string;
  chartBarDefaultStrokeOpacity: number;
  chartBarHoverStrokeOpacity: number;
  chartBarDefaultStrokeWidth: number;
  chartBarHoverStrokeWidth: number;
  overlapPalette: Array<{ border: string; background: string }>;
  tooltipTheme: 'light' | 'dark';
};

type ARAgingBucketChartProps = {
  theme: string;
  reportDate: string;
  buckets: AgingBucketDef[];
  canvasSizeMode: CanvasSizeMode;
  customCanvasSize: { width: number; height: number };
  onThemeCatalogResolved?: (themes: ThemeOption[], defaultTheme: string) => void;
  onUiThemeResolved?: (uiTheme: ResolvedUiTheme) => void;
  onThemeDefinitionsResolved?: (
    themes: Record<string, ThemeDefinition>,
    selectedThemeKey: string,
    defaultThemeKey: string
  ) => void;
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

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<T>(base: T, override: any): T {
  if (override === undefined) {
    return base;
  }

  if (Array.isArray(base) && Array.isArray(override)) {
    const maxLength = Math.max(base.length, override.length);
    const merged = Array.from({ length: maxLength }, (_, index) => {
      if (index in override) {
        return deepMerge((base as any[])[index], override[index]);
      }
      return (base as any[])[index];
    });
    return merged as T;
  }

  if (isObject(base) && isObject(override)) {
    const result: Record<string, any> = { ...base };
    for (const [key, value] of Object.entries(override)) {
      result[key] = key in result ? deepMerge(result[key], value) : value;
    }
    return result as T;
  }

  return override as T;
}

function fallbackThemeOrder(key: string) {
  if (key === 'light') {
    return 1;
  }
  if (key === 'dark') {
    return 2;
  }
  if (key === 'ember-dark') {
    return 3;
  }
  return 999;
}

export default function ARAgingBucketChart({
  theme,
  reportDate,
  buckets,
  canvasSizeMode,
  customCanvasSize,
  onThemeCatalogResolved,
  onUiThemeResolved,
  onThemeDefinitionsResolved,
}: ARAgingBucketChartProps) {
  const [uiTheme, setUiTheme] = useState({
    cardBackground: '',
    cardShadow: '',
    tooltipTheme: 'light' as 'light' | 'dark',
  });
  const [spec, setSpec] = useState<any>(null);

  useEffect(() => {
    async function loadChart() {
      const params = new URLSearchParams({
        report_date: reportDate,
        buckets: JSON.stringify(
          buckets.map((bucket) => ({
            name: bucket.name,
            isSpecial: bucket.isSpecial,
            combinator: bucket.combinator,
            conditions: bucket.conditions,
          }))
        ),
      });
      const res = await fetch(`/api/charts/ar/receivable_item/aging_by_bucket?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(typeof json?.error === 'string' ? json.error : 'Failed to load chart');
      }

      const themes = (json.themes ?? {}) as Record<string, ThemeDefinition>;
      const fallbackThemeKey = (json.defaultTheme as string | undefined) ?? 'light';
      const themeOptions = Object.entries(themes)
        .map(([key, value]) => ({
          key,
          label: value.label ?? key,
          scope: value.scope,
          createdBy: value.createdBy,
          displayOrder: value.displayOrder,
        }))
        .sort((left, right) => {
          const leftOrder = left.displayOrder ?? fallbackThemeOrder(left.key);
          const rightOrder = right.displayOrder ?? fallbackThemeOrder(right.key);
          if (leftOrder !== rightOrder) {
            return leftOrder - rightOrder;
          }
          return left.label.localeCompare(right.label);
        });
      onThemeCatalogResolved?.(themeOptions, fallbackThemeKey);
      const selectedTheme = themes[theme] ?? themes[fallbackThemeKey] ?? undefined;
      const selectedThemeKey = themes[theme]
        ? theme
        : themes[fallbackThemeKey]
          ? fallbackThemeKey
          : Object.keys(themes)[0] ?? fallbackThemeKey;
      const fallbackTheme = themes[fallbackThemeKey] ?? themes.light ?? Object.values(themes)[0];
      const selectedUi = (selectedTheme?.ui ?? {}) as Record<string, unknown>;
      const fallbackUi = (fallbackTheme?.ui ?? {}) as Record<string, unknown>;

      onThemeDefinitionsResolved?.(themes, selectedThemeKey, fallbackThemeKey);

      const mergedSpec = selectedTheme?.spec ? deepMerge(json.spec, selectedTheme.spec) : json.spec;

      const resolvedUiTheme: ResolvedUiTheme = {
        pageBackground: (selectedUi.pageBackground ?? fallbackUi.pageBackground ?? '') as string,
        pageText: (selectedUi.pageText ?? fallbackUi.pageText ?? '') as string,
        cardBackground: (selectedUi.cardBackground ?? fallbackUi.cardBackground ?? '') as string,
        cardShadow: (selectedUi.cardShadow ?? fallbackUi.cardShadow ?? '') as string,
        buttonBackground: (selectedUi.buttonBackground ?? fallbackUi.buttonBackground ?? '') as string,
        buttonText: (selectedUi.buttonText ?? fallbackUi.buttonText ?? '') as string,
        buttonBorder: (selectedUi.buttonBorder ?? fallbackUi.buttonBorder ?? '') as string,
        hoverColor: (selectedUi.hoverColor ?? fallbackUi.hoverColor ?? '') as string,
        fontFamily: (selectedUi.fontFamily ?? fallbackUi.fontFamily ?? 'sans-serif') as string,
        modalOverlayBackground: (selectedUi.modalOverlayBackground ??
          fallbackUi.modalOverlayBackground ??
          '') as string,
        statusDanger: (selectedUi.statusDanger ?? fallbackUi.statusDanger ?? '') as string,
        statusSuccess: (selectedUi.statusSuccess ?? fallbackUi.statusSuccess ?? '') as string,
        statusOnColor: (selectedUi.statusOnColor ?? fallbackUi.statusOnColor ?? '') as string,
        chartBarDefaultColor: (selectedUi.chartBarDefaultColor ??
          fallbackUi.chartBarDefaultColor ??
          selectedUi.hoverColor ??
          fallbackUi.hoverColor ??
          '') as string,
        chartBarHoverColor: (selectedUi.chartBarHoverColor ??
          fallbackUi.chartBarHoverColor ??
          selectedUi.hoverColor ??
          fallbackUi.hoverColor ??
          '') as string,
        chartBarDefaultOpacity:
          typeof selectedUi.chartBarDefaultOpacity === 'number'
            ? selectedUi.chartBarDefaultOpacity
            : typeof fallbackUi.chartBarDefaultOpacity === 'number'
              ? fallbackUi.chartBarDefaultOpacity
            : 0.72,
        chartBarHoverOpacity:
          typeof selectedUi.chartBarHoverOpacity === 'number'
            ? selectedUi.chartBarHoverOpacity
            : typeof fallbackUi.chartBarHoverOpacity === 'number'
              ? fallbackUi.chartBarHoverOpacity
            : 1,
        chartBarDefaultStrokeColor: (selectedUi.chartBarDefaultStrokeColor ??
          fallbackUi.chartBarDefaultStrokeColor ??
          selectedUi.chartBarDefaultColor ??
          fallbackUi.chartBarDefaultColor ??
          '') as string,
        chartBarHoverStrokeColor: (selectedUi.chartBarHoverStrokeColor ??
          fallbackUi.chartBarHoverStrokeColor ??
          selectedUi.chartBarHoverColor ??
          fallbackUi.chartBarHoverColor ??
          selectedUi.hoverColor ??
          fallbackUi.hoverColor ??
          '') as string,
        chartBarDefaultStrokeOpacity:
          typeof selectedUi.chartBarDefaultStrokeOpacity === 'number'
            ? selectedUi.chartBarDefaultStrokeOpacity
            : typeof fallbackUi.chartBarDefaultStrokeOpacity === 'number'
              ? fallbackUi.chartBarDefaultStrokeOpacity
            : 1,
        chartBarHoverStrokeOpacity:
          typeof selectedUi.chartBarHoverStrokeOpacity === 'number'
            ? selectedUi.chartBarHoverStrokeOpacity
            : typeof fallbackUi.chartBarHoverStrokeOpacity === 'number'
              ? fallbackUi.chartBarHoverStrokeOpacity
            : 1,
        chartBarDefaultStrokeWidth:
          typeof selectedUi.chartBarDefaultStrokeWidth === 'number'
            ? selectedUi.chartBarDefaultStrokeWidth
            : typeof fallbackUi.chartBarDefaultStrokeWidth === 'number'
              ? fallbackUi.chartBarDefaultStrokeWidth
            : 2,
        chartBarHoverStrokeWidth:
          typeof selectedUi.chartBarHoverStrokeWidth === 'number'
            ? selectedUi.chartBarHoverStrokeWidth
            : typeof fallbackUi.chartBarHoverStrokeWidth === 'number'
              ? fallbackUi.chartBarHoverStrokeWidth
            : 3,
        overlapPalette: Array.isArray(selectedUi.overlapPalette)
          ? (selectedUi.overlapPalette as Array<{ border: string; background: string }>).filter(
              (entry) =>
                entry &&
                typeof entry.border === 'string' &&
                typeof entry.background === 'string'
            )
          : Array.isArray(fallbackUi.overlapPalette)
            ? (fallbackUi.overlapPalette as Array<{ border: string; background: string }>).filter(
                (entry) =>
                  entry &&
                  typeof entry.border === 'string' &&
                  typeof entry.background === 'string'
              )
            : [],
        tooltipTheme:
          ((selectedUi.tooltipTheme ?? fallbackUi.tooltipTheme ?? 'light') as 'light' | 'dark'),
      };

      setUiTheme({
        cardBackground: resolvedUiTheme.cardBackground,
        cardShadow: resolvedUiTheme.cardShadow,
        tooltipTheme: resolvedUiTheme.tooltipTheme,
      });
      onUiThemeResolved?.(resolvedUiTheme);

      const balances = (json.data ?? [])
        .map((row: any) => Number(row.Balance))
        .filter((value: number) => Number.isFinite(value));
      const maxBalance = balances.length > 0 ? Math.max(...balances) : 0;

      let unit = 1;
      let unitTitle = 'Dollars';
      if (maxBalance >= 1000000000) {
        unit = 1000000000;
        unitTitle = 'Billions';
      } else if (maxBalance >= 1000000) {
        unit = 1000000;
        unitTitle = 'Millions';
      } else if (maxBalance >= 1000) {
        unit = 1000;
        unitTitle = 'Thousands';
      }

      const step = 2 * unit;
      const maxTick = Math.max(step, Math.ceil(maxBalance / step) * step);
      const axisValues: number[] = [];
      for (let value = 0; value <= maxTick; value += step) {
        axisValues.push(value);
      }

      const ratioSizeMap: Partial<Record<CanvasSizeMode, { width: number; height: number }>> = {
        'ratio-4-3': { width: 1200, height: 900 },
        'ratio-16-9': { width: 1200, height: 675 },
        'ratio-16-10': { width: 1200, height: 750 },
        'ratio-21-9': { width: 1260, height: 540 },
        'custom-pixels': {
          width: customCanvasSize.width,
          height: customCanvasSize.height,
        },
      };

      const ratioSize = ratioSizeMap[canvasSizeMode];

      const firstLayer = Array.isArray(mergedSpec.layer) ? mergedSpec.layer[0] : undefined;
      const hasHoverParam = Array.isArray(firstLayer?.params)
        ? firstLayer.params.some((entry: any) => entry?.name === 'barHoverLocal')
        : false;
      const barDefaultColorFromSpec =
        typeof firstLayer?.mark?.color === 'string' ? firstLayer.mark.color : undefined;
      const barDefaultStrokeColorFromSpec =
        typeof firstLayer?.mark?.stroke === 'string' ? firstLayer.mark.stroke : undefined;
      const barDefaultStrokeOpacityFromSpec =
        typeof firstLayer?.mark?.strokeOpacity === 'number' ? firstLayer.mark.strokeOpacity : undefined;
      const barDefaultStrokeWidthFromSpec =
        typeof firstLayer?.mark?.strokeWidth === 'number' ? firstLayer.mark.strokeWidth : undefined;
      const chartBarDefaultColor = barDefaultColorFromSpec ?? resolvedUiTheme.chartBarDefaultColor;
      const chartBarDefaultStrokeColor =
        barDefaultStrokeColorFromSpec ?? resolvedUiTheme.chartBarDefaultStrokeColor;
      const chartBarDefaultStrokeOpacity =
        barDefaultStrokeOpacityFromSpec ?? resolvedUiTheme.chartBarDefaultStrokeOpacity;
      const chartBarDefaultStrokeWidth =
        barDefaultStrokeWidthFromSpec ?? resolvedUiTheme.chartBarDefaultStrokeWidth;

      const fullSpec = {
        ...mergedSpec,
        ...(ratioSize
          ? {
              autosize: { type: 'pad', contains: 'padding' },
              width: ratioSize.width,
              height: ratioSize.height,
            }
          : {}),
        config: {
          ...(mergedSpec.config ?? {}),
          ...(mergedSpec.config?.style ? { style: mergedSpec.config.style } : {}),
          font: mergedSpec.config?.font ?? resolvedUiTheme.fontFamily,
          axis: {
            ...(mergedSpec.config?.axis ?? {}),
            labelFont: mergedSpec.config?.axis?.labelFont ?? resolvedUiTheme.fontFamily,
            titleFont: mergedSpec.config?.axis?.titleFont ?? resolvedUiTheme.fontFamily,
          },
          legend: {
            ...(mergedSpec.config?.legend ?? {}),
            labelFont: mergedSpec.config?.legend?.labelFont ?? resolvedUiTheme.fontFamily,
            titleFont: mergedSpec.config?.legend?.titleFont ?? resolvedUiTheme.fontFamily,
          },
          header: {
            ...(mergedSpec.config?.header ?? {}),
            labelFont: mergedSpec.config?.header?.labelFont ?? resolvedUiTheme.fontFamily,
            titleFont: mergedSpec.config?.header?.titleFont ?? resolvedUiTheme.fontFamily,
          },
          title: {
            ...(mergedSpec.config?.title ?? {}),
            font: mergedSpec.config?.title?.font ?? resolvedUiTheme.fontFamily,
          },
          text: {
            ...(mergedSpec.config?.text ?? {}),
            font: mergedSpec.config?.text?.font ?? resolvedUiTheme.fontFamily,
          },
        },
        data: { values: json.data },
        layer: Array.isArray(mergedSpec.layer)
          ? mergedSpec.layer.map((layerEntry: any, layerIndex: number) => {
              if (layerIndex !== 0) {
                return layerEntry;
              }

              const existingParams = Array.isArray(layerEntry?.params) ? layerEntry.params : [];

              return {
                ...layerEntry,
                params: hasHoverParam
                  ? existingParams
                  : [
                      ...existingParams,
                      {
                        name: 'barHoverLocal',
                        select: {
                          type: 'point',
                          fields: ['AgingBucket'],
                          on: 'mouseover',
                          clear: 'mouseout',
                        },
                      },
                    ],
                encoding: {
                  ...(layerEntry?.encoding ?? {}),
                  color: {
                    condition: {
                      param: 'barHoverLocal',
                      empty: false,
                      value: resolvedUiTheme.chartBarHoverColor,
                    },
                    value: chartBarDefaultColor,
                  },
                  opacity: {
                    condition: {
                      param: 'barHoverLocal',
                      empty: false,
                      value: resolvedUiTheme.chartBarHoverOpacity,
                    },
                    value: resolvedUiTheme.chartBarDefaultOpacity,
                  },
                  stroke: {
                    condition: {
                      param: 'barHoverLocal',
                      empty: false,
                      value: resolvedUiTheme.chartBarHoverStrokeColor,
                    },
                    value: chartBarDefaultStrokeColor,
                  },
                  strokeOpacity: {
                    condition: {
                      param: 'barHoverLocal',
                      empty: false,
                      value: resolvedUiTheme.chartBarHoverStrokeOpacity,
                    },
                    value: chartBarDefaultStrokeOpacity,
                  },
                  strokeWidth: {
                    condition: {
                      param: 'barHoverLocal',
                      empty: false,
                      value: resolvedUiTheme.chartBarHoverStrokeWidth,
                    },
                    value: chartBarDefaultStrokeWidth,
                  },
                },
              };
            })
          : mergedSpec.layer,
        encoding: {
          ...mergedSpec.encoding,
          y: {
            ...mergedSpec.encoding?.y,
            sort: {
              field: 'BucketOrder',
              op: 'min',
              order: 'ascending',
            },
          },
          x: {
            ...mergedSpec.encoding.x,
            title: `Receivable Balance (${unitTitle})`,
            axis: {
              ...mergedSpec.encoding?.x?.axis,
              values: axisValues,
              labelExpr: `format(datum.value / ${unit}, '.0f')`,
            },
          },
        },
      };

      setSpec(fullSpec);
    }

    loadChart().catch((error) => {
      console.error(error);
      setSpec(null);
    });
  }, [
    theme,
    reportDate,
    buckets,
    canvasSizeMode,
    customCanvasSize,
    onThemeCatalogResolved,
    onUiThemeResolved,
    onThemeDefinitionsResolved,
  ]);

  if (!spec) {
    return <div>Loading chart...</div>;
  }

  return (
    <VegaChartRenderer
      spec={spec}
      tooltipTheme={uiTheme.tooltipTheme}
      cardBackground={uiTheme.cardBackground}
      cardShadow={uiTheme.cardShadow}
      canvasSizeMode={canvasSizeMode}
      customCanvasSize={customCanvasSize}
    />
  );
}
