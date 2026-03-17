import { useEffect, useMemo, useRef, useState } from 'react';
import type { AgingBucketDef } from './types';
import AgingBucketPageLayout from './components/AgingBucketPageLayout';
import {
  OPERATOR_OPTIONS,
  formatThemeOptionLabel,
  getCustomCanvasBounds,
  hasStoredBuckets,
  loadStoredBuckets,
} from './agingBucketPageUtils';
import {
  normalizeLegacyDefaultBucket,
  type BucketCombinator,
  type BucketOperator,
} from './bucketEditorEngine';
import { useBucketEditorState, type NameSuggestionDialogState } from './hooks/useBucketEditorState';
import { useBucketEditorActions } from './hooks/useBucketEditorActions';
import { useAgingBucketUiState } from './hooks/useAgingBucketUiState';
import { useDismissLayer } from './hooks/useDismissLayer';
import { useAgingBucketPackSync } from './hooks/useAgingBucketPackSync';
import { useAgingBucketChartContracts } from './hooks/useAgingBucketChartContracts';
import { useAgingBucketChartRender } from './hooks/useAgingBucketChartRender';
import { useAgingBucketPresentation } from './hooks/useAgingBucketPresentation';
import type { ThemeBuilderReportId } from '../../../theme/navigation';

const BUCKET_STORAGE_KEY = 'taxisbi.ui.agingBuckets';

let defaultBucketIds = new Set<string>();

function setDefaultBucketIds(ids: string[]) {
  defaultBucketIds = new Set(ids);
}

function isDefaultBucketId(id: string) {
  return defaultBucketIds.has(id);
}

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
  const customCanvasBounds = getCustomCanvasBounds();
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
    onOpenThemeBuilder: onOpenThemeBuilder as ((reportId: 'ar-aging') => void) | undefined,
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
      uiTheme={uiTheme}
      pageMaxWidth={pageMaxWidth}
      themePopoverRef={themePopoverRef}
      themeButtonRef={themeButtonRef}
      reportDatePickerRef={reportDatePickerRef}
      bucketDialogRef={bucketDialogRef}
      canvasDialogRef={canvasDialogRef}
      nameSuggestionDialogRef={nameSuggestionDialogRef}
      theme={theme}
      themeOptions={themeOptions}
      reportDate={reportDate}
      reportDateDraft={reportDateDraft}
      reportDatePlaceholder={reportDatePlaceholder}
      canvasSizeMode={canvasSizeMode}
      canvasSizeOptions={canvasSizeOptions}
      customCanvasSize={customCanvasSize}
      customCanvasBounds={customCanvasBounds}
      isThemePopoverOpen={isThemePopoverOpen}
      showReportDateControl={showReportDateControl}
      showBucketCustomizerControl={showBucketCustomizerControl}
      onToggleThemePopover={toggleThemePopover}
      onSelectTheme={handleThemeSelection}
      onCanvasSizeModeChange={handleCanvasSizeModeChange}
      onOpenThemeBuilder={handleOpenThemeBuilder}
      onReportDateDraftChange={handleReportDateDraftChange}
      onReportDateDraftBlur={handleReportDateDraftBlur}
      onReportDatePickerChange={handleReportDatePickerChange}
      onOpenReportDatePicker={openReportDatePicker}
      onOpenBucketEditor={openBucketEditorModal}
      formatThemeOptionLabel={formatThemeOptionLabel}
      appliedBucketSummary={appliedBucketSummary}
      isCanvasDialogOpen={isCanvasDialogOpen}
      customCanvasDraft={customCanvasDraft}
      canvasDialogError={canvasDialogError}
      onCanvasDraftChange={(patch) => {
        setCustomCanvasDraft((current) => ({ ...current, ...patch }));
        setCanvasDialogError(null);
      }}
      onCloseCustomCanvasDialog={closeCustomCanvasDialog}
      onApplyCustomCanvasSize={applyCustomCanvasSize}
      isEditorOpen={isEditorOpen}
      bucketDraft={bucketDraft}
      overlapMeta={overlapMeta}
      dragBucketId={dragBucketId}
      validationPassed={validationPassed}
      validatedBucketIds={validatedBucketIds}
      draftValidationError={draftValidationError}
      bucketError={bucketError}
      isDefaultBucketId={isDefaultBucketId}
      effectiveOperatorOptions={effectiveOperatorOptions}
      effectiveCombinatorOptions={effectiveCombinatorOptions}
      operatorLabels={operatorLabels}
      bucketEditorLabels={bucketEditorLabels}
      onDragStart={handleDragStart}
      onDropReorder={handleDropReorder}
      onDragEnd={() => setDragBucketId(null)}
      onUpdateBucketDraftName={updateBucketDraftName}
      onUpdateBucketSpecial={updateBucketSpecial}
      onUpdateBucketCondition={updateBucketCondition}
      onUpdateBucketCombinator={updateBucketCombinator}
      onDeleteBucket={deleteBucket}
      onAddBucket={addBucket}
      onRestoreDefaultBuckets={restoreDefaultBuckets}
      onRunValidation={runValidation}
      onCancelBucketEditor={closeBucketEditor}
      onApplyBucketChanges={applyBucketChanges}
      nameSuggestionDialog={nameSuggestionDialog}
      validationSuggestionPosition={validationSuggestionPosition}
      validationSuggestionCount={validationSuggestionCount}
      validationSuggestionIndex={validationSuggestionIndex}
      activeSuggestionBounds={activeSuggestionBounds}
      nameSuggestionLabels={nameSuggestionLabels}
      onNavigateNameSuggestion={navigateNameSuggestion}
      onUpdateCustomNameDraft={updateCustomNameDraft}
      onBackToNameChoices={backToNameChoices}
      onApplyCustomName={applyCustomName}
      onAcceptSuggestedName={acceptSuggestedName}
      onKeepCurrentName={keepCurrentName}
      onStartEnterCustomName={startEnterCustomName}
      onRenderChart={renderChart}
    />
  );
}
