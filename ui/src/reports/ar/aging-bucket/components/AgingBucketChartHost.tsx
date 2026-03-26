import ARAgingBucketChart from './ARAgingBucketChart';
import type {
  AgingBucketDef,
  CanvasSizeMode,
  ChartPackMetadata,
  ResolvedUiTheme,
  ThemeOption,
} from '../types';

type AgingBucketChartHostProps = {
  chartContext: { domain: string; rulebook: string; chart: string };
  theme: string;
  reportDate: string;
  buckets: AgingBucketDef[];
  canvasSizeMode: CanvasSizeMode;
  customCanvasSize: { width: number; height: number };
  onThemeCatalogResolved: (themes: ThemeOption[], defaultTheme: string) => void;
  onUiThemeResolved: (uiTheme: ResolvedUiTheme) => void;
  onPackMetadataResolved: (metadata: ChartPackMetadata) => void;
};

export default function AgingBucketChartHost(props: AgingBucketChartHostProps) {
  return <ARAgingBucketChart {...props} />;
}

