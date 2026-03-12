import { VegaEmbed } from 'react-vega';
import { useEffect, useState } from 'react';

export default function VegaChart() {
  const [spec, setSpec] = useState<any>(null);

  useEffect(() => {
    async function loadChart() {
      const res = await fetch('/api/charts/aging-by-bucket');
      const json = await res.json();

      const fullSpec = {
        ...json.spec,
        data: { values: json.data }
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
      <VegaEmbed spec={spec} options={{ actions: false }} />
    </div>
  );
}
