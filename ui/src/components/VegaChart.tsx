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

  return <VegaEmbed spec={spec} />;
}
