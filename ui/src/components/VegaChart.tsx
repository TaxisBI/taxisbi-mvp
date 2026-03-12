import { VegaEmbed } from 'react-vega';
import { useEffect, useState } from 'react';

export default function VegaChart() {
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
        encoding: {
          ...json.spec.encoding,
          x: {
            ...json.spec.encoding.x,
            title: `Receivable Balance (${unitTitle})`,
            axis: {
              ...json.spec.encoding.x.axis,
              values: axisValues,
              labelExpr: `format(datum.value / ${unit}, '.0f')`
            }
          }
        }
      };

      setSpec(fullSpec);
    }

    loadChart();
  }, []);

  if (!spec) {
    return <div>Loading chart...</div>;
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 1200,
        minHeight: 420,
        background: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
        padding: 16,
      }}
    >
      <VegaEmbed spec={spec} options={{ actions: true }} />
    </div>
  );
}
