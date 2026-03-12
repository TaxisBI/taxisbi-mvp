import { VegaEmbed } from 'react-vega';
import { useEffect, useState } from 'react';

type VegaChartProps = {
  theme: 'light' | 'dark';
};

export default function VegaChart({ theme }: VegaChartProps) {
  const isDark = theme === 'dark';
  const [spec, setSpec] = useState<any>(null);

  useEffect(() => {
    async function loadChart() {
      const res = await fetch('/api/charts/aging-by-bucket');
      const json = await res.json();

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
        ...json.spec,
        data: { values: json.data },
        background: isDark ? '#0f172a' : '#ffffff',
        config: {
          ...json.spec.config,
          view: {
            ...(json.spec.config?.view ?? {}),
            stroke: null,
          },
          axis: {
            ...(json.spec.config?.axis ?? {}),
            domain: false,
            gridColor: isDark ? '#334155' : '#d1d5db',
            labelColor: isDark ? '#cbd5e1' : '#1f2937',
            titleColor: isDark ? '#e5e7eb' : '#111827',
          },
          text: {
            ...(json.spec.config?.text ?? {}),
            color: isDark ? '#e5e7eb' : '#1f2937',
          },
        },
        layer: [
          {
            ...json.spec.layer?.[0],
            mark: {
              ...json.spec.layer?.[0]?.mark,
              color: isDark ? '#60a5fa' : '#4f46e5',
              stroke: isDark ? '#60a5fa' : '#4f46e5',
            },
          },
          {
            ...json.spec.layer?.[1],
            mark: {
              ...json.spec.layer?.[1]?.mark,
              color: isDark ? '#e5e7eb' : '#1f2937',
            },
          },
        ],
        encoding: {
          ...json.spec.encoding,
          x: {
            ...json.spec.encoding.x,
            title: `Receivable Balance (${unitTitle})`,
            axis: {
              ...json.spec.encoding.x.axis,
              gridColor: isDark ? '#334155' : '#d1d5db',
              values: axisValues,
              labelExpr: `format(datum.value / ${unit}, '.0f')`
            }
          }
        }
      };

      setSpec(fullSpec);
    }

    loadChart();
  }, [isDark]);

  if (!spec) {
    return <div>Loading chart...</div>;
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 1200,
        minHeight: 420,
        background: isDark ? '#0f172a' : '#ffffff',
        borderRadius: 12,
        boxShadow: isDark
          ? '0 12px 32px rgba(2, 6, 23, 0.45)'
          : '0 8px 24px rgba(15, 23, 42, 0.08)',
        padding: 16,
        transition: 'background-color 200ms ease, box-shadow 200ms ease',
      }}
    >
      <VegaEmbed spec={spec} options={{ actions: true }} />
    </div>
  );
}
