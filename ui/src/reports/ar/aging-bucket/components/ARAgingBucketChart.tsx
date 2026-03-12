import { useEffect, useState } from 'react';
import VegaChartRenderer from '../../../../charts/components/VegaChartRenderer';

export type ThemeOption = {
  key: string;
  label: string;
};

export type ResolvedUiTheme = {
  pageBackground: string;
  pageText: string;
  cardBackground: string;
  cardShadow: string;
  buttonBackground: string;
  buttonText: string;
  buttonBorder: string;
  tooltipTheme: 'light' | 'dark';
};

type ARAgingBucketChartProps = {
  theme: string;
  onThemeCatalogResolved?: (themes: ThemeOption[], defaultTheme: string) => void;
  onUiThemeResolved?: (uiTheme: ResolvedUiTheme) => void;
};

type ChartTheme = {
  key?: string;
  label?: string;
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

export default function ARAgingBucketChart({
  theme,
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
      const res = await fetch('/api/charts/aging-by-bucket');
      const json = await res.json();
      const themes = (json.themes ?? {}) as Record<string, ChartTheme>;
      const fallbackThemeKey = (json.defaultTheme as string | undefined) ?? 'light';
      const themeOptions = Object.entries(themes).map(([key, value]) => ({
        key,
        label: value.label ?? key,
      }));
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

      const fullSpec = {
        ...mergedSpec,
        data: { values: json.data },
        encoding: {
          ...mergedSpec.encoding,
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

    loadChart();
  }, [theme, onThemeCatalogResolved, onUiThemeResolved]);

  if (!spec) {
    return <div>Loading chart...</div>;
  }

  return (
    <VegaChartRenderer
      spec={spec}
      tooltipTheme={uiTheme.tooltipTheme}
      cardBackground={uiTheme.cardBackground}
      cardShadow={uiTheme.cardShadow}
    />
  );
}
