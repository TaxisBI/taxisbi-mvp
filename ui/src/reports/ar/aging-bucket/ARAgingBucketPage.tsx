import { useCallback, useEffect, useRef, useState } from 'react';
import type { AgingBucketDef } from './types';
import AgingBucketPageLayout from './components/AgingBucketPageLayout';
import {
  OPERATOR_OPTIONS,
  formatThemeOptionLabel,
  getCustomCanvasBounds,
  hasStoredBuckets,
  loadStoredBuckets,
} from './agingBucketPageUtils';
import { normalizeLegacyDefaultBucket } from './bucketEditorEngine';
import { useBucketEditorState } from './hooks/useBucketEditorState';
import { useBucketEditorActions } from './hooks/useBucketEditorActions';
import { useAgingBucketUiState } from './hooks/useAgingBucketUiState';
import { useDismissLayer } from './hooks/useDismissLayer';
import { useAgingBucketPackSync } from './hooks/useAgingBucketPackSync';
import { useAgingBucketChartContracts } from './hooks/useAgingBucketChartContracts';
import { useAgingBucketChartRender } from './hooks/useAgingBucketChartRender';
import { useAgingBucketPresentation } from './hooks/useAgingBucketPresentation';
import type { ThemeBuilderReportId } from '../../../theme/navigation';

const BUCKET_STORAGE_KEY = 'taxisbi.ui.agingBuckets';
const AGING_REPORT_ID = 'ar-aging' as const;

type ARAgingBucketPageProps = {
  onOpenThemeBuilder?: (reportId: ThemeBuilderReportId) => void;
};

export default function ARAgingBucketPage({ onOpenThemeBuilder }: ARAgingBucketPageProps) {
  const reportDatePickerRef = useRef<HTMLInputElement | null>(null);
  const themePopoverRef = useRef<HTMLDivElement | null>(null);
  const themeButtonRef = useRef<HTMLButtonElement | null>(null);
  const bucketDialogRef = useRef<HTMLDivElement | null>(null);
  const canvasDialogRef = useRef<HTMLDivElement | null>(null);
  const nameSuggestionDialogRef = useRef<HTMLDivElement | null>(null);
  const suppressEditorCloseUntilRef = useRef(0);
  const defaultBucketIdsRef = useRef<Set<string>>(new Set());
  const customCanvasBounds = getCustomCanvasBounds();

  const setDefaultBucketIds = useCallback((ids: string[]) => {
    defaultBucketIdsRef.current = new Set(ids);
  }, []);

  const isDefaultBucketId = useCallback((id: string) => {
    return defaultBucketIdsRef.current.has(id);
  }, []);

  const onOpenAgingThemeBuilder = useCallback(
    (reportId: typeof AGING_REPORT_ID) => {
      onOpenThemeBuilder?.(reportId);
    },
    [onOpenThemeBuilder]
  );

  const {
    theme,
    themeOptions,
    reportDate,
    reportDateDraft,
    reportDatePlaceholder,
    canvasSizeMode,
    customCanvasSize,
    isCanvasDialogOpen,
    customCanvasDraft,
    canvasDialogError,
    isThemePopoverOpen,
    setCanvasSizeMode,
    setCustomCanvasDraft,
    setCanvasDialogError,
    setIsCanvasDialogOpen,
    setIsThemePopoverOpen,
    handleThemeCatalogResolved,
    closeCustomCanvasDialog,
    applyCustomCanvasSize,
    handleCanvasSizeModeChange,
    toggleThemePopover,
    handleThemeSelection,
    handleOpenThemeBuilder,
    handleReportDateDraftChange,
    handleReportDateDraftBlur,
    handleReportDatePickerChange,
    openReportDatePicker,
  } = useAgingBucketUiState({
    customCanvasBounds,
    onOpenThemeBuilder: onOpenAgingThemeBuilder,
    reportDatePickerRef,
  });

  const [buckets, setBuckets] = useState<AgingBucketDef[]>(() =>
    loadStoredBuckets({
      storageKey: BUCKET_STORAGE_KEY,
      isDefaultBucketId,
      operatorOptions: OPERATOR_OPTIONS,
      normalizeLegacyDefaultBucket,
    })
  );

  const {
    isEditorOpen,
    bucketDraft,
    setBucketDraft,
    bucketError,
    setBucketError,
    dragBucketId,
    setDragBucketId,
    nameSuggestionDialog,
    setNameSuggestionDialog,
    validationSuggestions,
    setValidationSuggestions,
    validationSuggestionIndex,
    setValidationSuggestionIndex,
    validationPassed,
    setValidationPassed,
    validatedBucketIds,
    setValidatedBucketIds,
    editorBaselineBuckets,
    clearValidationState,
    openBucketEditor,
    closeBucketEditor,
  } = useBucketEditorState();

  const {
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
    handleUiThemeResolved,
    handlePackMetadataResolved,
  } = useAgingBucketChartContracts({
    canvasSizeMode,
    customCanvasSize,
  });

  const renderChart = useAgingBucketChartRender({
    chartContext,
    theme,
    reportDate,
    buckets,
    canvasSizeMode,
    customCanvasSize,
    onThemeCatalogResolved: handleThemeCatalogResolved,
    onUiThemeResolved: handleUiThemeResolved,
    onPackMetadataResolved: handlePackMetadataResolved,
  });

  const { operatorLabels, appliedBucketSummary } = useAgingBucketPresentation({
    buckets,
    effectiveOperatorOptions,
  });

  useAgingBucketPackSync({
    metadataDefaultBuckets,
    canvasSizeOptions,
    canvasSizeMode,
    setCanvasSizeMode,
    hasStoredBuckets: hasStoredBuckets(BUCKET_STORAGE_KEY),
    setDefaultBucketIds,
    setBuckets,
    setBucketDraft,
    allowedOperatorSet,
    allowedCombinatorSet,
    effectiveCombinatorOptions,
  });

  useEffect(() => {
    window.localStorage.setItem(BUCKET_STORAGE_KEY, JSON.stringify(buckets));
  }, [buckets]);

  useDismissLayer({
    isOpen: isThemePopoverOpen,
    refs: [themePopoverRef, themeButtonRef],
    onClose: () => setIsThemePopoverOpen(false),
  });

  useDismissLayer({
    isOpen: isEditorOpen,
    refs: [bucketDialogRef],
    onClose: closeBucketEditor,
    canClose: () => Date.now() >= suppressEditorCloseUntilRef.current && !nameSuggestionDialog,
  });

  useDismissLayer({
    isOpen: isCanvasDialogOpen,
    refs: [canvasDialogRef],
    onClose: () => {
      setIsCanvasDialogOpen(false);
      setCanvasDialogError(null);
    },
  });

  const {
    overlapMeta,
    draftValidationError,
    openBucketEditorModal,
    applyBucketChanges,
    runValidation,
    updateBucketDraftName,
    updateBucketCondition,
    addBucket,
    restoreDefaultBuckets,
    deleteBucket,
    updateBucketCombinator,
    acceptSuggestedName,
    keepCurrentName,
    navigateNameSuggestion,
    startEnterCustomName,
    backToNameChoices,
    updateCustomNameDraft,
    applyCustomName,
    updateBucketSpecial,
    handleDragStart,
    handleDropReorder,
    validationSuggestionCount,
    validationSuggestionPosition,
    activeSuggestionBounds,
  } = useBucketEditorActions({
    buckets,
    setBuckets,
    bucketDraft,
    setBucketDraft,
    setBucketError,
    validationPassed,
    setValidationPassed,
    validatedBucketIds,
    setValidatedBucketIds,
    validationSuggestions,
    setValidationSuggestions,
    validationSuggestionIndex,
    setValidationSuggestionIndex,
    nameSuggestionDialog,
    setNameSuggestionDialog,
    editorBaselineBuckets,
    clearValidationState,
    openBucketEditor,
    closeBucketEditor,
    setDragBucketId,
    metadataDefaultBuckets,
    allowedOperatorSet,
    allowedCombinatorSet,
    effectiveCombinatorOptions,
    isDefaultBucketId,
    uiTheme,
    bucketEditorLabels,
    suppressEditorCloseUntilRef,
  });

  return (
    <AgingBucketPageLayout
      refs={{
        themePopoverRef,
        themeButtonRef,
        reportDatePickerRef,
        bucketDialogRef,
        canvasDialogRef,
        nameSuggestionDialogRef,
      }}
      shell={{
        uiTheme,
        pageMaxWidth,
        showReportDateControl,
        showBucketCustomizerControl,
        appliedBucketSummary,
      }}
      themeControls={{
        theme,
        themeOptions,
        isThemePopoverOpen,
        onToggleThemePopover: toggleThemePopover,
        onSelectTheme: handleThemeSelection,
        onOpenThemeBuilder: handleOpenThemeBuilder,
        formatThemeOptionLabel,
      }}
      reportDateControls={{
        reportDate,
        reportDateDraft,
        reportDatePlaceholder,
        onReportDateDraftChange: handleReportDateDraftChange,
        onReportDateDraftBlur: handleReportDateDraftBlur,
        onReportDatePickerChange: handleReportDatePickerChange,
        onOpenReportDatePicker: openReportDatePicker,
      }}
      canvasControls={{
        canvasSizeMode,
        canvasSizeOptions,
        customCanvasBounds,
        isCanvasDialogOpen,
        customCanvasDraft,
        canvasDialogError,
        onCanvasSizeModeChange: handleCanvasSizeModeChange,
        onCanvasDraftChange: (patch) => {
          setCustomCanvasDraft((current) => ({ ...current, ...patch }));
          setCanvasDialogError(null);
        },
        onCloseCustomCanvasDialog: closeCustomCanvasDialog,
        onApplyCustomCanvasSize: applyCustomCanvasSize,
      }}
      bucketEditor={{
        isOpen: isEditorOpen,
        onOpenBucketEditor: openBucketEditorModal,
        bucketDraft,
        overlapMeta,
        dragBucketId,
        validationPassed,
        validatedBucketIds,
        draftValidationError,
        bucketError,
        isDefaultBucketId,
        effectiveOperatorOptions,
        effectiveCombinatorOptions,
        operatorLabels,
        bucketEditorLabels,
        onDragStart: handleDragStart,
        onDropReorder: handleDropReorder,
        onDragEnd: () => setDragBucketId(null),
        onUpdateBucketDraftName: updateBucketDraftName,
        onUpdateBucketSpecial: updateBucketSpecial,
        onUpdateBucketCondition: updateBucketCondition,
        onUpdateBucketCombinator: updateBucketCombinator,
        onDeleteBucket: deleteBucket,
        onAddBucket: addBucket,
        onRestoreDefaultBuckets: restoreDefaultBuckets,
        onRunValidation: runValidation,
        onCancelBucketEditor: closeBucketEditor,
        onApplyBucketChanges: applyBucketChanges,
      }}
      nameSuggestion={{
        nameSuggestionDialog,
        validationSuggestionPosition,
        validationSuggestionCount,
        validationSuggestionIndex,
        activeSuggestionBounds,
        nameSuggestionLabels,
        onNavigateNameSuggestion: navigateNameSuggestion,
        onUpdateCustomNameDraft: updateCustomNameDraft,
        onBackToNameChoices: backToNameChoices,
        onApplyCustomName: applyCustomName,
        onAcceptSuggestedName: acceptSuggestedName,
        onKeepCurrentName: keepCurrentName,
        onStartEnterCustomName: startEnterCustomName,
      }}
      chart={{
        onRenderChart: renderChart,
      }}
    />
  );
}
