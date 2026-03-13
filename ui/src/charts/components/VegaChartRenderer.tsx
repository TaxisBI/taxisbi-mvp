import { Component, ReactNode, useEffect, useState } from 'react';
import { VegaEmbed } from 'react-vega';
import type { CanvasSizeMode } from '../../reports/ar/aging-bucket/components/ARAgingBucketChart';

type ChartErrorBoundaryProps = {
  children: ReactNode;
};

type ChartErrorBoundaryState = {
  errorMessage: string | null;
};

class ChartErrorBoundary extends Component<ChartErrorBoundaryProps, ChartErrorBoundaryState> {
  state: ChartErrorBoundaryState = {
    errorMessage: null,
  };

  static getDerivedStateFromError(error: Error) {
    return {
      errorMessage: error?.message ?? 'Unknown Vega render error',
    };
  }

  componentDidCatch(error: Error) {
    console.error('[VegaChartRenderer] chart render failed:', error);
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <div
          style={{
            border: '1px solid #fecaca',
            background: '#fff1f2',
            color: '#881337',
            borderRadius: 8,
            padding: 12,
            fontSize: 13,
            lineHeight: 1.45,
            whiteSpace: 'pre-wrap',
          }}
        >
          {`Chart render error: ${this.state.errorMessage}`}
        </div>
      );
    }

    return this.props.children;
  }
}

type VegaChartRendererProps = {
  spec: any;
  tooltipTheme: 'light' | 'dark';
  cardBackground: string;
  cardShadow: string;
  canvasSizeMode?: CanvasSizeMode;
  customCanvasSize?: { width: number; height: number };
};

export default function VegaChartRenderer({
  spec,
  tooltipTheme,
  cardBackground,
  cardShadow,
  canvasSizeMode = 'fit-width',
  customCanvasSize = { width: 1280, height: 720 },
}: VegaChartRendererProps) {
  const [embedErrorMessage, setEmbedErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setEmbedErrorMessage(null);
  }, [spec]);

  const layoutByMode: Record<
    CanvasSizeMode,
    {
      width: string | number;
      minHeight: string | number;
      maxWidth?: string | number;
      maxHeight?: string | number;
      height?: string | number;
      aspectRatio?: string;
    }
  > = {
    'fit-width': { width: '100%', minHeight: 420 },
    'fit-height': { width: '100%', minHeight: '70vh' },
    'fit-screen': { width: '100%', minHeight: 'calc(100vh - 230px)' },
    'ratio-4-3': { width: '100%', minHeight: 420, aspectRatio: '4 / 3' },
    'ratio-16-9': { width: '100%', minHeight: 420, aspectRatio: '16 / 9' },
    'ratio-16-10': { width: '100%', minHeight: 420, aspectRatio: '16 / 10' },
    'ratio-21-9': { width: '100%', minHeight: 420, aspectRatio: '21 / 9' },
    'custom-pixels': {
      width: '100%',
      minHeight: 320,
      maxHeight: 'calc(100vh - 220px)',
      height: `min(calc(100vh - 220px), ${customCanvasSize.height + 32}px)`,
    },
  };

  const layout = layoutByMode[canvasSizeMode];

  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: layout.width,
        maxWidth: layout.maxWidth,
        maxHeight: layout.maxHeight,
        minHeight: layout.minHeight,
        height: layout.height,
        aspectRatio: layout.aspectRatio,
        background: cardBackground,
        borderRadius: 12,
        boxShadow: cardShadow,
        padding: 16,
        overflow: 'auto',
        transition: 'background-color 200ms ease, box-shadow 200ms ease',
      }}
    >
      {embedErrorMessage ? (
        <div
          style={{
            border: '1px solid #fecaca',
            background: '#fff1f2',
            color: '#881337',
            borderRadius: 8,
            padding: 12,
            fontSize: 13,
            lineHeight: 1.45,
            whiteSpace: 'pre-wrap',
          }}
        >
          {`Chart embed error: ${embedErrorMessage}`}
        </div>
      ) : null}
      <ChartErrorBoundary>
        <VegaEmbed
          spec={spec}
          options={{ actions: true, tooltip: { theme: tooltipTheme } }}
          onError={(error) => {
            const message = error instanceof Error ? error.message : String(error);
            console.error('[VegaChartRenderer] embed failed:', error);
            setEmbedErrorMessage(message);
          }}
        />
      </ChartErrorBoundary>
    </div>
  );
}
