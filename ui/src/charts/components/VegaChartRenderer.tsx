import { Component, ReactNode, useEffect, useState } from 'react';
import { VegaEmbed } from 'react-vega';
import type { CanvasSizeMode } from '../../reports/ar/aging-bucket/components/ARAgingBucketChart';

type VegaTooltipStyle = {
  fillColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
};

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
  tooltipStyle?: VegaTooltipStyle;
  canvasSizeMode?: CanvasSizeMode;
  customCanvasSize?: { width: number; height: number };
};

export default function VegaChartRenderer({
  spec,
  tooltipTheme,
  cardBackground,
  cardShadow,
  tooltipStyle,
  canvasSizeMode = 'fit-width',
  customCanvasSize = { width: 1280, height: 720 },
}: VegaChartRendererProps) {
  const [embedErrorMessage, setEmbedErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setEmbedErrorMessage(null);
  }, [spec]);

  useEffect(() => {
    if (typeof document === 'undefined' || !tooltipStyle) {
      return;
    }

    const rootStyle = document.documentElement.style;
    const entries: Array<[string, string | undefined]> = [
      ['--taxisbi-vega-tooltip-font-family', tooltipStyle.fontFamily],
      [
        '--taxisbi-vega-tooltip-font-size',
        typeof tooltipStyle.fontSize === 'number' ? `${tooltipStyle.fontSize}px` : undefined,
      ],
      ['--taxisbi-vega-tooltip-font-weight', tooltipStyle.fontWeight],
      ['--taxisbi-vega-tooltip-font-style', tooltipStyle.fontStyle],
      ['--taxisbi-vega-tooltip-fill', tooltipStyle.fillColor],
      ['--taxisbi-vega-tooltip-text', tooltipStyle.textColor],
      ['--taxisbi-vega-tooltip-background', tooltipStyle.backgroundColor],
      ['--taxisbi-vega-tooltip-border-color', tooltipStyle.borderColor],
      [
        '--taxisbi-vega-tooltip-border-width',
        typeof tooltipStyle.borderWidth === 'number' ? `${tooltipStyle.borderWidth}px` : undefined,
      ],
      [
        '--taxisbi-vega-tooltip-border-radius',
        typeof tooltipStyle.borderRadius === 'number' ? `${tooltipStyle.borderRadius}px` : undefined,
      ],
      [
        '--taxisbi-vega-tooltip-padding',
        typeof tooltipStyle.padding === 'number' ? `${tooltipStyle.padding}px` : undefined,
      ],
    ];

    entries.forEach(([key, value]) => {
      if (value) {
        rootStyle.setProperty(key, value);
      } else {
        rootStyle.removeProperty(key);
      }
    });

    return () => {
      entries.forEach(([key]) => {
        rootStyle.removeProperty(key);
      });
    };
  }, [tooltipStyle]);

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
      <style>{`
        #vg-tooltip-element,
        #vg-tooltip-element.vg-tooltip,
        #vg-tooltip-element h2,
        #vg-tooltip-element table,
        #vg-tooltip-element thead,
        #vg-tooltip-element tbody,
        #vg-tooltip-element tr,
        #vg-tooltip-element th,
        #vg-tooltip-element td,
        #vg-tooltip-element span,
        #vg-tooltip-element div {
          font-family: var(--taxisbi-vega-tooltip-font-family, inherit) !important;
          font-size: var(--taxisbi-vega-tooltip-font-size, inherit) !important;
          font-weight: var(--taxisbi-vega-tooltip-font-weight, inherit) !important;
          font-style: var(--taxisbi-vega-tooltip-font-style, inherit) !important;
          color: var(--taxisbi-vega-tooltip-text, inherit) !important;
        }

        #vg-tooltip-element,
        #vg-tooltip-element.vg-tooltip {
          background: var(--taxisbi-vega-tooltip-background, unset) !important;
          border-color: var(--taxisbi-vega-tooltip-border-color, currentColor) !important;
          border-style: solid !important;
          border-width: var(--taxisbi-vega-tooltip-border-width, 1px) !important;
          border-radius: var(--taxisbi-vega-tooltip-border-radius, 8px) !important;
          padding: var(--taxisbi-vega-tooltip-padding, 8px) !important;
          box-sizing: border-box !important;
        }

        #vg-tooltip-element td.key,
        #vg-tooltip-element td.value,
        #vg-tooltip-element th {
          background: var(--taxisbi-vega-tooltip-fill, transparent) !important;
          border-radius: calc(var(--taxisbi-vega-tooltip-border-radius, 8px) - 2px) !important;
        }
      `}</style>
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
