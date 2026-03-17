import { useEffect, useRef, useState } from 'react';
import VegaChartRenderer from '../../../../charts/components/VegaChartRenderer';
import { applyThemeToChart } from '../../../../theme/applyThemeToChart';
import type {
  AgingBucketDef,
  CanvasSizeMode,
  ChartContext,
  ChartPackMetadata,
  ChartParameterDefinition,
  ResolvedUiTheme,
  ThemeDefinition,
  ThemeOption,
} from '../types';

type ARAgingBucketChartProps = {
  chartContext: ChartContext;
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
  onPackMetadataResolved?: (metadata: ChartPackMetadata) => void;
};

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toObject(value: unknown): Record<string, unknown> {
  return isObject(value) ? (value as Record<string, unknown>) : {};
}

function requireObject(value: unknown, label: string): Record<string, unknown> {
  if (isObject(value)) {
    return value as Record<string, unknown>;
  }
  throw new Error(`Missing required object in chart contract: ${label}`);
}

function requireString(value: unknown, label: string): string {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }
  throw new Error(`Missing required string in chart contract: ${label}`);
}

function requireNumber(value: unknown, label: string): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }
  throw new Error(`Missing required number in chart contract: ${label}`);
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  throw new Error(`Missing required boolean in chart contract: ${label}`);
}

function escapeVegaLabelExpressionLiteral(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function trimTrailingZeros(value: string) {
  return value.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

function formatCurrency(value: number, symbol: string, decimals: number) {
  const numberPart = value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${symbol}${numberPart}`;
}

function formatCompactCurrency(value: number, symbol: string, decimals: number, suffix: string) {
  const numberPart = trimTrailingZeros(
    value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );
  return `${symbol}${numberPart}${suffix}`;
}

function resolveDash(style: 'solid' | 'dotted' | 'dashed'): number[] {
  if (style === 'dotted') {
    return [1, 3];
  }
  if (style === 'dashed') {
    return [6, 4];
  }
  return [];
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
  chartContext,
  theme,
  reportDate,
  buckets,
  canvasSizeMode,
  customCanvasSize,
  onThemeCatalogResolved,
  onUiThemeResolved,
  onThemeDefinitionsResolved,
  onPackMetadataResolved,
}: ARAgingBucketChartProps) {
  const [uiTheme, setUiTheme] = useState({
    cardBackground: '',
    cardShadow: '',
    cardBorderRadius: 12,
    tooltipTheme: 'light' as 'light' | 'dark',
    tooltipStyle: {
      fillColor: '',
      backgroundColor: '',
      textColor: '',
      fontFamily: '',
      fontSize: 12,
      fontWeight: '',
      fontStyle: '',
      borderColor: '',
      borderWidth: 1,
      borderRadius: 8,
      padding: 8,
    },
  });
  const [spec, setSpec] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestSequenceRef = useRef(0);

  useEffect(() => {
    const abortController = new AbortController();
    const requestId = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestId;

    const serializedBuckets = JSON.stringify(
      buckets.map((bucket) => ({
        name: bucket.name,
        isSpecial: bucket.isSpecial,
        combinator: bucket.combinator,
        conditions: bucket.conditions,
      }))
    );

    async function loadChart() {
      setErrorMessage(null);
      const chartPath = `/api/charts/${chartContext.domain}/${chartContext.pack}/${chartContext.chart}`;
      const initialParams = new URLSearchParams({
        report_date: reportDate,
        buckets: serializedBuckets,
      });
      let res = await fetch(`${chartPath}?${initialParams.toString()}`, {
        signal: abortController.signal,
        cache: 'no-store',
      });
      let json = await res.json();

      if (!res.ok) {
        throw new Error(typeof json?.error === 'string' ? json.error : 'Failed to load chart');
      }

      const initialRuntime = toObject(json.runtime);
      const initialQueryParams = toObject(initialRuntime.queryParams);
      const reportDateParamName =
        typeof initialQueryParams.reportDate === 'string'
          ? initialQueryParams.reportDate
          : 'report_date';
      const bucketsParamName =
        typeof initialQueryParams.buckets === 'string' ? initialQueryParams.buckets : 'buckets';

      if (reportDateParamName !== 'report_date' || bucketsParamName !== 'buckets') {
        const metadataParams = new URLSearchParams();
        metadataParams.set(reportDateParamName, reportDate);
        metadataParams.set(bucketsParamName, serializedBuckets);

        res = await fetch(`${chartPath}?${metadataParams.toString()}`, {
          signal: abortController.signal,
          cache: 'no-store',
        });
        json = await res.json();
      }

      if (!res.ok) {
        throw new Error(typeof json?.error === 'string' ? json.error : 'Failed to load chart');
      }

      onPackMetadataResolved?.({
        parameters: toObject(json.parameters) as Record<string, ChartParameterDefinition>,
        runtime: toObject(json.runtime),
      });

      const runtime = requireObject(json.runtime, 'runtime');
      const chartRuntime = requireObject(runtime.chartRuntime, 'runtime.chartRuntime');
      const valueField = requireString(chartRuntime.valueField, 'runtime.chartRuntime.valueField');
      const categoryField = requireString(chartRuntime.categoryField, 'runtime.chartRuntime.categoryField');
      const bucketOrderField = requireString(
        chartRuntime.bucketOrderField,
        'runtime.chartRuntime.bucketOrderField'
      );
      const hoverField = requireString(chartRuntime.hoverField, 'runtime.chartRuntime.hoverField');
      const hoverParamName = requireString(
        chartRuntime.hoverParamName,
        'runtime.chartRuntime.hoverParamName'
      );
      const xAxisTitlePrefix = requireString(
        chartRuntime.xAxisTitlePrefix,
        'runtime.chartRuntime.xAxisTitlePrefix'
      );
      const unitLabels = requireObject(chartRuntime.unitLabels, 'runtime.chartRuntime.unitLabels');
      const unitBaseLabel = requireString(unitLabels.base, 'runtime.chartRuntime.unitLabels.base');
      const unitThousandLabel = requireString(
        unitLabels.thousand,
        'runtime.chartRuntime.unitLabels.thousand'
      );
      const unitMillionLabel = requireString(
        unitLabels.million,
        'runtime.chartRuntime.unitLabels.million'
      );
      const unitBillionLabel = requireString(
        unitLabels.billion,
        'runtime.chartRuntime.unitLabels.billion'
      );
      const valueFormatting = requireObject(
        chartRuntime.valueFormatting,
        'runtime.chartRuntime.valueFormatting'
      );
      const axisDecimals = requireNumber(
        valueFormatting.axisDecimals,
        'runtime.chartRuntime.valueFormatting.axisDecimals'
      );
      const compactDecimals = requireNumber(
        valueFormatting.compactDecimals,
        'runtime.chartRuntime.valueFormatting.compactDecimals'
      );
      const tooltipDecimals = requireNumber(
        valueFormatting.tooltipDecimals,
        'runtime.chartRuntime.valueFormatting.tooltipDecimals'
      );
      const tooltipContract = requireObject(chartRuntime.tooltip, 'runtime.chartRuntime.tooltip');
      const tooltipEnabled = requireBoolean(
        tooltipContract.enabled,
        'runtime.chartRuntime.tooltip.enabled'
      );
      const tooltipCategoryTitle = requireString(
        tooltipContract.categoryTitle,
        'runtime.chartRuntime.tooltip.categoryTitle'
      );
      const tooltipValueTitle = requireString(
        tooltipContract.valueTitle,
        'runtime.chartRuntime.tooltip.valueTitle'
      );

      const themes = requireObject(json.themes, 'themes') as Record<string, ThemeDefinition>;
      const fallbackThemeKey = requireString(json.defaultTheme, 'defaultTheme');
      if (Object.keys(themes).length === 0) {
        throw new Error('Theme contract violation: themes payload is empty.');
      }
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
      const selectedTheme = themes[theme] ?? themes[fallbackThemeKey];
      const selectedThemeKey = themes[theme]
        ? theme
        : themes[fallbackThemeKey]
          ? fallbackThemeKey
          : (() => {
              throw new Error('Theme contract violation: defaultTheme not found in themes payload.');
            })();
      const fallbackTheme = themes[fallbackThemeKey];
      if (!fallbackTheme || !selectedTheme) {
        throw new Error('Theme contract violation: selected/fallback theme is missing.');
      }

      const selectedThemeUi = requireObject(selectedTheme.ui, `themes.${selectedThemeKey}.ui`);
      const currencySymbol = requireString(
        selectedThemeUi.currencySymbol,
        `themes.${selectedThemeKey}.ui.currencySymbol`
      );
      const compactSuffixes = requireObject(
        selectedThemeUi.compactSuffixes,
        `themes.${selectedThemeKey}.ui.compactSuffixes`
      );
      const compactThousandSuffix = requireString(
        compactSuffixes.thousand,
        `themes.${selectedThemeKey}.ui.compactSuffixes.thousand`
      );
      const compactMillionSuffix = requireString(
        compactSuffixes.million,
        `themes.${selectedThemeKey}.ui.compactSuffixes.million`
      );
      const compactBillionSuffix = requireString(
        compactSuffixes.billion,
        `themes.${selectedThemeKey}.ui.compactSuffixes.billion`
      );

      onThemeDefinitionsResolved?.(themes, selectedThemeKey, fallbackThemeKey);

      const mergedSpec = selectedTheme?.spec ? deepMerge(json.spec, selectedTheme.spec) : json.spec;

      // Use generic theme application utility
      const resolvedUiTheme = applyThemeToChart(selectedTheme ?? fallbackTheme ?? {});
      setUiTheme({
        cardBackground: resolvedUiTheme.cardBackground,
        cardShadow: resolvedUiTheme.cardShadow,
        cardBorderRadius: resolvedUiTheme.chartCardBorderRadius,
        tooltipTheme: resolvedUiTheme.tooltipTheme,
        tooltipStyle: resolvedUiTheme.tooltipStyle,
      });
      onUiThemeResolved?.(resolvedUiTheme);

      const balances = (json.data ?? [])
        .map((row: any) => Number(row[valueField]))
        .filter((value: number) => Number.isFinite(value));
      const maxBalance = balances.length > 0 ? Math.max(...balances) : 0;

      let unit = 1;
      let unitTitle = unitBaseLabel;
      let compactSuffix = '';
      if (maxBalance >= 1000000000) {
        unit = 1000000000;
        unitTitle = unitBillionLabel;
        compactSuffix = compactBillionSuffix;
      } else if (maxBalance >= 1000000) {
        unit = 1000000;
        unitTitle = unitMillionLabel;
        compactSuffix = compactMillionSuffix;
      } else if (maxBalance >= 1000) {
        unit = 1000;
        unitTitle = unitThousandLabel;
        compactSuffix = compactThousandSuffix;
      }

      const compactValueField = '__taxisbi_compact_value_label';
      const tooltipValueField = '__taxisbi_tooltip_value_label';
      const chartData = (json.data ?? []).map((row: Record<string, unknown>) => {
        const rawValue = Number(row[valueField]);
        if (!Number.isFinite(rawValue)) {
          return {
            ...row,
            [compactValueField]: `${currencySymbol}0`,
            [tooltipValueField]: `${currencySymbol}0.00`,
          };
        }

        return {
          ...row,
          [compactValueField]: formatCompactCurrency(rawValue / unit, currencySymbol, compactDecimals, compactSuffix),
          [tooltipValueField]: formatCurrency(rawValue, currencySymbol, tooltipDecimals),
        };
      });

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
        ? firstLayer.params.some((entry: any) => entry?.name === hoverParamName)
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
      const mergedEncoding = toObject(mergedSpec.encoding);
      const mergedXEncoding = toObject(mergedEncoding.x);
      const mergedYEncoding = toObject(mergedEncoding.y);
      const gridDash = resolveDash(resolvedUiTheme.axisGridDashStyle);
      const domainDash = resolveDash(resolvedUiTheme.axisDomainDashStyle);
      const tickDash = resolveDash(resolvedUiTheme.axisTickDashStyle);

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
          view: {
            ...(mergedSpec.config?.view ?? {}),
            cornerRadius: mergedSpec.config?.view?.cornerRadius ?? resolvedUiTheme.chartViewCornerRadius,
          },
          axis: {
            ...(mergedSpec.config?.axis ?? {}),
            labelFont: mergedSpec.config?.axis?.labelFont ?? resolvedUiTheme.fontFamily,
            titleFont: mergedSpec.config?.axis?.titleFont ?? resolvedUiTheme.fontFamily,
            tickCount: mergedSpec.config?.axis?.tickCount ?? resolvedUiTheme.axisTickCount,
            gridDash: mergedSpec.config?.axis?.gridDash ?? gridDash,
            domainDash: mergedSpec.config?.axis?.domainDash ?? domainDash,
            tickDash: mergedSpec.config?.axis?.tickDash ?? tickDash,
            gridWidth: mergedSpec.config?.axis?.gridWidth ?? resolvedUiTheme.axisGridWidth,
            tickWidth: mergedSpec.config?.axis?.tickWidth ?? resolvedUiTheme.axisTickWidth,
            domainWidth: mergedSpec.config?.axis?.domainWidth ?? resolvedUiTheme.axisDomainWidth,
          },
          legend: {
            ...(mergedSpec.config?.legend ?? {}),
            labelFont: mergedSpec.config?.legend?.labelFont ?? resolvedUiTheme.fontFamily,
            titleFont: mergedSpec.config?.legend?.titleFont ?? resolvedUiTheme.fontFamily,
            cornerRadius:
              mergedSpec.config?.legend?.cornerRadius ?? resolvedUiTheme.chartLegendCornerRadius,
          },
          header: {
            ...(mergedSpec.config?.header ?? {}),
            labelFont: mergedSpec.config?.header?.labelFont ?? resolvedUiTheme.fontFamily,
            titleFont: mergedSpec.config?.header?.titleFont ?? resolvedUiTheme.fontFamily,
          },
          scale: {
            ...(mergedSpec.config?.scale ?? {}),
            bandPaddingInner:
              mergedSpec.config?.scale?.bandPaddingInner ?? resolvedUiTheme.chartBandPaddingInner,
            bandPaddingOuter:
              mergedSpec.config?.scale?.bandPaddingOuter ?? resolvedUiTheme.chartBandPaddingOuter,
          },
          bar: {
            ...(mergedSpec.config?.bar ?? {}),
            cornerRadius: mergedSpec.config?.bar?.cornerRadius ?? resolvedUiTheme.chartBarCornerRadius,
            discreteBandSize:
              mergedSpec.config?.bar?.discreteBandSize ?? resolvedUiTheme.chartBarDiscreteBandSize,
            continuousBandSize:
              mergedSpec.config?.bar?.continuousBandSize ?? resolvedUiTheme.chartBarContinuousBandSize,
            binSpacing: mergedSpec.config?.bar?.binSpacing ?? resolvedUiTheme.chartBarBandPaddingInner,
          },
          rect: {
            ...(mergedSpec.config?.rect ?? {}),
            cornerRadius: mergedSpec.config?.rect?.cornerRadius ?? resolvedUiTheme.chartRectCornerRadius,
          },
          line: {
            ...(mergedSpec.config?.line ?? {}),
            color: mergedSpec.config?.line?.color ?? resolvedUiTheme.chartLineStrokeColor,
            fill: mergedSpec.config?.line?.fill ?? resolvedUiTheme.chartLineFillColor,
            strokeWidth: mergedSpec.config?.line?.strokeWidth ?? resolvedUiTheme.chartLineStrokeWidth,
          },
          point: {
            ...(mergedSpec.config?.point ?? {}),
            fill: mergedSpec.config?.point?.fill ?? resolvedUiTheme.chartLinePointFillColor,
            stroke: mergedSpec.config?.point?.stroke ?? resolvedUiTheme.chartLinePointStrokeColor,
            strokeWidth:
              mergedSpec.config?.point?.strokeWidth ?? resolvedUiTheme.chartLinePointStrokeWidth,
          },
          title: {
            ...(mergedSpec.config?.title ?? {}),
            font: mergedSpec.config?.title?.font ?? resolvedUiTheme.titleFontFamily,
            fontSize: mergedSpec.config?.title?.fontSize ?? resolvedUiTheme.titleFontSize,
            fontWeight: mergedSpec.config?.title?.fontWeight ?? resolvedUiTheme.titleFontWeight,
            fontStyle: mergedSpec.config?.title?.fontStyle ?? resolvedUiTheme.titleFontStyle,
            color: mergedSpec.config?.title?.color ?? resolvedUiTheme.titleFontColor,
          },
          text: {
            ...(mergedSpec.config?.text ?? {}),
            font: mergedSpec.config?.text?.font ?? resolvedUiTheme.fontFamily,
          },
        },
        data: { values: chartData },
        layer: Array.isArray(mergedSpec.layer)
          ? mergedSpec.layer.map((layerEntry: any, layerIndex: number) => {
              const layerMark =
                layerEntry && typeof layerEntry.mark === 'object' ? layerEntry.mark : undefined;
              const layerMarkType =
                typeof layerEntry?.mark === 'string'
                  ? layerEntry.mark
                  : typeof layerMark?.type === 'string'
                    ? layerMark.type
                    : undefined;

              const layerWithSeriesStyling =
                layerMarkType === 'line'
                  ? {
                      ...layerEntry,
                      mark:
                        typeof layerEntry?.mark === 'string'
                          ? layerEntry.mark
                          : {
                              ...layerMark,
                              stroke: layerMark?.stroke ?? resolvedUiTheme.chartLineStrokeColor,
                              fill: layerMark?.fill ?? resolvedUiTheme.chartLineFillColor,
                              strokeWidth: layerMark?.strokeWidth ?? resolvedUiTheme.chartLineStrokeWidth,
                            },
                    }
                  : layerMarkType === 'point'
                    ? {
                        ...layerEntry,
                        mark:
                          typeof layerEntry?.mark === 'string'
                            ? layerEntry.mark
                            : {
                                ...layerMark,
                                fill: layerMark?.fill ?? resolvedUiTheme.chartLinePointFillColor,
                                stroke: layerMark?.stroke ?? resolvedUiTheme.chartLinePointStrokeColor,
                                strokeWidth:
                                  layerMark?.strokeWidth ?? resolvedUiTheme.chartLinePointStrokeWidth,
                              },
                      }
                    : layerEntry;

              if (layerIndex !== 0) {
                if (layerIndex === 1) {
                  return {
                    ...layerWithSeriesStyling,
                    encoding: {
                      ...(layerWithSeriesStyling?.encoding ?? {}),
                      text: {
                        field: compactValueField,
                        type: 'nominal',
                      },
                    },
                  };
                }
                return layerWithSeriesStyling;
              }

              const existingParams = Array.isArray(layerWithSeriesStyling?.params)
                ? layerWithSeriesStyling.params
                : [];

              return {
                ...layerWithSeriesStyling,
                mark:
                  typeof layerWithSeriesStyling?.mark === 'string'
                    ? layerWithSeriesStyling.mark
                    : {
                        ...(layerWithSeriesStyling?.mark ?? {}),
                        cornerRadius:
                          layerWithSeriesStyling?.mark?.cornerRadius ?? resolvedUiTheme.chartBarCornerRadius,
                      },
                params: hasHoverParam
                  ? existingParams
                  : [
                      ...existingParams,
                      {
                        name: hoverParamName,
                        select: {
                          type: 'point',
                          fields: [hoverField],
                          on: 'mouseover',
                          clear: 'mouseout',
                        },
                      },
                    ],
                encoding: {
                  ...(layerWithSeriesStyling?.encoding ?? {}),
                  ...(tooltipEnabled
                    ? {
                        tooltip: [
                          {
                            field: categoryField,
                            type: 'nominal',
                            title: tooltipCategoryTitle,
                          },
                          {
                            field: tooltipValueField,
                            type: 'nominal',
                            title: tooltipValueTitle,
                          },
                        ],
                      }
                    : {}),
                  color: {
                    condition: {
                      param: hoverParamName,
                      empty: false,
                      value: resolvedUiTheme.chartBarHoverColor,
                    },
                    value: chartBarDefaultColor,
                  },
                  opacity: {
                    condition: {
                      param: hoverParamName,
                      empty: false,
                      value: resolvedUiTheme.chartBarHoverOpacity,
                    },
                    value: resolvedUiTheme.chartBarDefaultOpacity,
                  },
                  stroke: {
                    condition: {
                      param: hoverParamName,
                      empty: false,
                      value: resolvedUiTheme.chartBarHoverStrokeColor,
                    },
                    value: chartBarDefaultStrokeColor,
                  },
                  strokeOpacity: {
                    condition: {
                      param: hoverParamName,
                      empty: false,
                      value: resolvedUiTheme.chartBarHoverStrokeOpacity,
                    },
                    value: chartBarDefaultStrokeOpacity,
                  },
                  strokeWidth: {
                    condition: {
                      param: hoverParamName,
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
          ...mergedEncoding,
          y: {
            ...mergedYEncoding,
            sort: {
              field: bucketOrderField,
              op: 'min',
              order: 'ascending',
            },
          },
          x: {
            ...mergedXEncoding,
            title: `${xAxisTitlePrefix} (${unitTitle})`,
            axis: {
              ...toObject(mergedXEncoding.axis),
              values: axisValues,
              labelExpr: `'${escapeVegaLabelExpressionLiteral(currencySymbol)}' + format(datum.value / ${unit}, ',.${axisDecimals}f')`,
            },
          },
        },
      };

      if (requestSequenceRef.current !== requestId) {
        return;
      }

      setSpec(fullSpec);
    }

    loadChart().catch((error) => {
      if (abortController.signal.aborted) {
        return;
      }
      console.error(error);
      setSpec(null);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load chart.');
    });

    return () => {
      abortController.abort();
    };
  }, [
    chartContext.domain,
    chartContext.pack,
    chartContext.chart,
    theme,
    reportDate,
    buckets,
    canvasSizeMode,
    customCanvasSize,
    onThemeCatalogResolved,
    onUiThemeResolved,
    onThemeDefinitionsResolved,
    onPackMetadataResolved,
  ]);

  if (!spec) {
    if (errorMessage) {
      return <div>{errorMessage}</div>;
    }
    return <div>Loading chart...</div>;
  }

  return (
    <VegaChartRenderer
      spec={spec}
      tooltipTheme={uiTheme.tooltipTheme}
      tooltipStyle={uiTheme.tooltipStyle}
      cardBackground={uiTheme.cardBackground}
      cardShadow={uiTheme.cardShadow}
      cardBorderRadius={uiTheme.cardBorderRadius}
      canvasSizeMode={canvasSizeMode}
      customCanvasSize={customCanvasSize}
    />
  );
}
