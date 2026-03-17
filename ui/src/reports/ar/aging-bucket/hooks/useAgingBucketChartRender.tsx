import { useCallback } from 'react';
import AgingBucketChartHost from '../components/AgingBucketChartHost';
import type { AgingBucketDef, CanvasSizeMode, ChartContext, ChartPackMetadata, ResolvedUiTheme, ThemeOption } from '../types';

export function useAgingBucketChartRender(options: {
  chartContext: ChartContext;
  theme: string;
  reportDate: string;
  buckets: AgingBucketDef[];
  canvasSizeMode: CanvasSizeMode;
  customCanvasSize: { width: number; height: number };
  onThemeCatalogResolved: (themes: ThemeOption[], defaultTheme: string) => void;
  onUiThemeResolved: (uiTheme: ResolvedUiTheme) => void;
  onPackMetadataResolved: (metadata: ChartPackMetadata) => void;
}) {
  const {
    chartContext,
    theme,
    reportDate,
    buckets,
    canvasSizeMode,
    customCanvasSize,
    onThemeCatalogResolved,
    onUiThemeResolved,
    onPackMetadataResolved,
  } = options;

  return useCallback(
    () => (
      <AgingBucketChartHost
        chartContext={chartContext}
        theme={theme}
        reportDate={reportDate}
        buckets={buckets}
        canvasSizeMode={canvasSizeMode}
        customCanvasSize={customCanvasSize}
        onThemeCatalogResolved={onThemeCatalogResolved}
        onUiThemeResolved={onUiThemeResolved}
        onPackMetadataResolved={onPackMetadataResolved}
      />
    ),
    [
      buckets,
      canvasSizeMode,
      chartContext,
      customCanvasSize,
      onPackMetadataResolved,
      onThemeCatalogResolved,
      onUiThemeResolved,
      reportDate,
      theme,
    ]
  );
}
