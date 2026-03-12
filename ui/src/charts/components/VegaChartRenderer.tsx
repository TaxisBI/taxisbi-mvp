import { VegaEmbed } from 'react-vega';

type VegaChartRendererProps = {
  spec: any;
  tooltipTheme: 'light' | 'dark';
  cardBackground: string;
  cardShadow: string;
};

export default function VegaChartRenderer({
  spec,
  tooltipTheme,
  cardBackground,
  cardShadow,
}: VegaChartRendererProps) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 1200,
        minHeight: 420,
        background: cardBackground,
        borderRadius: 12,
        boxShadow: cardShadow,
        padding: 16,
        transition: 'background-color 200ms ease, box-shadow 200ms ease',
      }}
    >
      <VegaEmbed spec={spec} options={{ actions: true, tooltip: { theme: tooltipTheme } }} />
    </div>
  );
}
