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

type ChartTheme = {
  key?: string;
  label?: string;
  scope?: 'global' | 'domain' | 'pack' | 'dashboard';
  createdBy?: string;
  displayOrder?: number;
  ui?: Partial<ResolvedUiTheme>;
  spec?: Record<string, any>;
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
}: ARAgingBucketChartProps) {
  const [uiTheme, setUiTheme] = useState({
    cardBackground: '#ffffff',
    cardShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
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
      const res = await fetch(`/api/charts/aging-by-bucket?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(typeof json?.error === 'string' ? json.error : 'Failed to load chart');
      }

      const themes = (json.themes ?? {}) as Record<string, ChartTheme>;
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

      const mergedSpec = selectedTheme?.spec ? deepMerge(json.spec, selectedTheme.spec) : json.spec;

      const resolvedUiTheme: ResolvedUiTheme = {
        pageBackground: selectedTheme?.ui?.pageBackground ?? '#f8fafc',
        pageText: selectedTheme?.ui?.pageText ?? '#0f172a',
        cardBackground: selectedTheme?.ui?.cardBackground ?? '#ffffff',
        cardShadow: selectedTheme?.ui?.cardShadow ?? '0 8px 24px rgba(15, 23, 42, 0.08)',
        buttonBackground: selectedTheme?.ui?.buttonBackground ?? '#ffffff',
        buttonText: selectedTheme?.ui?.buttonText ?? '#0f172a',
        buttonBorder: selectedTheme?.ui?.buttonBorder ?? '#cbd5e1',
        hoverColor: selectedTheme?.ui?.hoverColor ?? '#22c55e',
        fontFamily: selectedTheme?.ui?.fontFamily ?? 'Helvetica, Arial, sans-serif',
        modalOverlayBackground:
          selectedTheme?.ui?.modalOverlayBackground ?? 'rgba(15, 23, 42, 0.45)',
        statusDanger: selectedTheme?.ui?.statusDanger ?? '#dc2626',
        statusSuccess: selectedTheme?.ui?.statusSuccess ?? '#16a34a',
        overlapPalette: Array.isArray(selectedTheme?.ui?.overlapPalette)
          ? (selectedTheme?.ui?.overlapPalette as Array<{ border: string; background: string }>).filter(
              (entry) =>
                entry &&
                typeof entry.border === 'string' &&
                typeof entry.background === 'string'
            )
          : [
              { border: '#dc2626', background: '#fee2e2' },
              { border: '#d97706', background: '#ffedd5' },
              { border: '#0891b2', background: '#cffafe' },
              { border: '#7c3aed', background: '#ede9fe' },
              { border: '#16a34a', background: '#dcfce7' },
              { border: '#be185d', background: '#fce7f3' },
            ],
        tooltipTheme: selectedTheme?.ui?.tooltipTheme ?? 'light',
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
