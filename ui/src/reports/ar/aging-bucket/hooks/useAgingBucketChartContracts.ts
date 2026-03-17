import { useMemo, useState } from 'react';
import type {
  AgingBucketDef,
  CanvasSizeMode,
  ChartPackMetadata,
  ResolvedUiTheme,
} from '../types';
import {
  COMBINATOR_OPTIONS,
  OPERATOR_OPTIONS,
  getPageMaxWidthByCanvasMode,
  parseBucketDefaultsFromMetadata,
  parseCanvasSizeOptionsFromMetadata,
  resolveRuntimeUiContracts,
} from '../agingBucketPageUtils';
import type { BucketCombinator, BucketOperator } from '../bucketEditorEngine';

const DEFAULT_UI_THEME: ResolvedUiTheme = {
  pageBackground: '',
  pageText: '',
  cardBackground: '',
  cardShadow: '',
  buttonBackground: '',
  buttonText: '',
  buttonBorder: '',
  hoverColor: '',
  fontFamily: 'inherit',
  modalOverlayBackground: '',
  statusDanger: '',
  statusSuccess: '',
  statusOnColor: '',
  chartBarDefaultColor: '',
  chartBarHoverColor: '',
  chartBarDefaultOpacity: 0.72,
  chartBarHoverOpacity: 1,
  chartBarDefaultStrokeColor: '',
  chartBarHoverStrokeColor: '',
  chartBarDefaultStrokeOpacity: 1,
  chartBarHoverStrokeOpacity: 1,
  chartBarDefaultStrokeWidth: 2,
  chartBarHoverStrokeWidth: 3,
  chartCardBorderRadius: 12,
  chartViewCornerRadius: 0,
  chartBarCornerRadius: 4,
  chartRectCornerRadius: 4,
  chartLegendCornerRadius: 4,
  chartBarBandPaddingInner: 0.15,
  chartBarBandPaddingOuter: 0.1,
  chartBandPaddingInner: 0.15,
  chartBandPaddingOuter: 0.1,
  chartBarDiscreteBandSize: 20,
  chartBarContinuousBandSize: 5,
  chartLineStrokeColor: '#4f46e5',
  chartLineFillColor: '#4f46e5',
  chartLineStrokeWidth: 2,
  chartLinePointFillColor: '#4f46e5',
  chartLinePointStrokeColor: '#ffffff',
  chartLinePointStrokeWidth: 1,
  titleFontFamily: 'inherit',
  titleFontSize: 18,
  titleFontWeight: '600',
  titleFontStyle: 'normal',
  titleFontColor: '',
  axisTickCount: 6,
  axisGridDashStyle: 'solid',
  axisDomainDashStyle: 'solid',
  axisTickDashStyle: 'solid',
  axisGridWidth: 1,
  axisTickWidth: 1,
  axisDomainWidth: 1,
  overlapPalette: [],
  tooltipTheme: 'light',
  tooltipStyle: {
    fillColor: '',
    backgroundColor: '',
    textColor: '',
    fontFamily: 'inherit',
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'normal',
    borderColor: '',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
};

export function useAgingBucketChartContracts(options: {
  canvasSizeMode: CanvasSizeMode;
  customCanvasSize: { width: number; height: number };
}) {
  const { canvasSizeMode, customCanvasSize } = options;
  const chartContext = useMemo(
    () => ({
      domain: 'ar',
      pack: 'receivable_item',
      chart: 'aging_by_bucket',
    }),
    []
  );
  const [uiTheme, setUiTheme] = useState<ResolvedUiTheme>(DEFAULT_UI_THEME);
  const [packMetadata, setPackMetadata] = useState<ChartPackMetadata | null>(null);

  const metadataDefaultBuckets = useMemo(
    () => parseBucketDefaultsFromMetadata(packMetadata, OPERATOR_OPTIONS),
    [packMetadata]
  );
  const canvasSizeOptions = useMemo(
    () => parseCanvasSizeOptionsFromMetadata(packMetadata),
    [packMetadata]
  );
  const pageMaxWidth = getPageMaxWidthByCanvasMode(canvasSizeMode, customCanvasSize);

  const {
    showReportDateControl,
    showBucketCustomizerControl,
    effectiveOperatorOptions,
    effectiveCombinatorOptions,
    bucketEditorLabels,
    nameSuggestionLabels,
  } = resolveRuntimeUiContracts({
    metadata: packMetadata,
    operatorDefaults: OPERATOR_OPTIONS,
    combinatorDefaults: COMBINATOR_OPTIONS,
  });

  const allowedOperatorSet = useMemo(
    () => new Set<BucketOperator>(effectiveOperatorOptions),
    [effectiveOperatorOptions]
  );
  const allowedCombinatorSet = useMemo(
    () => new Set<BucketCombinator>(effectiveCombinatorOptions),
    [effectiveCombinatorOptions]
  );

  return {
    chartContext,
    uiTheme,
    metadataDefaultBuckets,
    canvasSizeOptions,
    pageMaxWidth,
    showReportDateControl,
    showBucketCustomizerControl,
    effectiveOperatorOptions,
    effectiveCombinatorOptions,
    bucketEditorLabels,
    nameSuggestionLabels,
    allowedOperatorSet,
    allowedCombinatorSet,
    handleUiThemeResolved: setUiTheme,
    handlePackMetadataResolved: setPackMetadata,
  } satisfies {
    chartContext: { domain: string; pack: string; chart: string };
    uiTheme: ResolvedUiTheme;
    metadataDefaultBuckets: AgingBucketDef[] | null;
    canvasSizeOptions: Array<{ value: CanvasSizeMode; label: string; displayOrder: number }>;
    pageMaxWidth: string | number;
    showReportDateControl: boolean;
    showBucketCustomizerControl: boolean;
    effectiveOperatorOptions: BucketOperator[];
    effectiveCombinatorOptions: BucketCombinator[];
    bucketEditorLabels: {
      modalTitle: string;
      modalHelperText: string;
      addBucketButton: string;
      restoreDefaultsButton: string;
      validateButton: string;
      cancelButton: string;
      applyButton: string;
      overlapErrorText: string;
      validateBeforeApplyText: string;
    };
    nameSuggestionLabels: {
      title: string;
      subtitle: string;
      boundsLabel: string;
      currentLabel: string;
      suggestedLabel: string;
      customInputLabel: string;
      backButton: string;
      applyCustomNameButton: string;
      useSuggestedButton: string;
      keepCurrentButton: string;
      enterNewNameButton: string;
      previousButtonTitle: string;
      nextButtonTitle: string;
    };
    allowedOperatorSet: Set<BucketOperator>;
    allowedCombinatorSet: Set<BucketCombinator>;
    handleUiThemeResolved: (theme: ResolvedUiTheme) => void;
    handlePackMetadataResolved: (metadata: ChartPackMetadata) => void;
  };
}
