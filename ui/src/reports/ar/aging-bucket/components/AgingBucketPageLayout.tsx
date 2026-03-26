import type { AgingBucketPageLayoutProps } from './agingBucketPageLayout.types';
import AgingBucketToolbar from './AgingBucketToolbar';
import CustomCanvasDialog from './CustomCanvasDialog';
import BucketEditorDialog from './BucketEditorDialog';
import BucketNameSuggestionDialog from './BucketNameSuggestionDialog';

export default function AgingBucketPageLayout({
  refs,
  shell,
  themeControls,
  reportDateControls,
  canvasControls,
  bucketEditor,
  nameSuggestion,
  chart,
}: AgingBucketPageLayoutProps) {
  const {
    themePopoverRef,
    themeButtonRef,
    reportDatePickerRef,
    bucketDialogRef,
    canvasDialogRef,
    nameSuggestionDialogRef,
  } = refs;

  const {
    uiTheme,
    pageMaxWidth,
    showReportDateControl,
    showBucketCustomizerControl,
    appliedBucketSummary,
  } = shell;

  const {
    theme,
    themeOptions,
    isThemePopoverOpen,
    onToggleThemePopover,
    onSelectTheme,
    onOpenThemeBuilder,
    formatThemeOptionLabel,
  } = themeControls;

  const {
    reportDate,
    reportDateDraft,
    reportDatePlaceholder,
    onReportDateDraftChange,
    onReportDateDraftBlur,
    onReportDatePickerChange,
    onOpenReportDatePicker,
  } = reportDateControls;

  const {
    canvasSizeMode,
    canvasSizeOptions,
    customCanvasBounds,
    isCanvasDialogOpen,
    customCanvasDraft,
    canvasDialogError,
    onCanvasSizeModeChange,
    onCanvasDraftChange,
    onCloseCustomCanvasDialog,
    onApplyCustomCanvasSize,
  } = canvasControls;

  const {
    isOpen: isEditorOpen,
    onOpenBucketEditor,
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
    onDragStart,
    onDropReorder,
    onDragEnd,
    onUpdateBucketDraftName,
    onUpdateBucketSpecial,
    onUpdateBucketCondition,
    onUpdateBucketCombinator,
    onDeleteBucket,
    onAddBucket,
    onRestoreDefaultBuckets,
    onRunValidation,
    onCancelBucketEditor,
    onApplyBucketChanges,
  } = bucketEditor;

  const {
    nameSuggestionDialog,
    validationSuggestionPosition,
    validationSuggestionCount,
    validationSuggestionIndex,
    activeSuggestionBounds,
    nameSuggestionLabels,
    onNavigateNameSuggestion,
    onUpdateCustomNameDraft,
    onBackToNameChoices,
    onApplyCustomName,
    onAcceptSuggestedName,
    onKeepCurrentName,
    onStartEnterCustomName,
  } = nameSuggestion;

  const { onRenderChart } = chart;

  return (
    <>
      <style>{`
        .date-picker-hidden-native {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
          pointer-events: none;
          border: 0;
          padding: 0;
          margin: 0;
        }
      `}</style>
      <div
        className="ar-aging-page"
        style={{
          boxSizing: 'border-box',
          padding: 'clamp(16px, 3vw, 32px)',
          width: '100%',
          maxWidth: pageMaxWidth,
          margin: '0 auto',
          minHeight: '100vh',
          background: uiTheme.pageBackground,
          color: uiTheme.pageText,
          fontFamily: uiTheme.fontFamily,
          transition: 'background-color 200ms ease, color 200ms ease',
        }}
      >
        <AgingBucketToolbar
          uiTheme={uiTheme}
          isThemePopoverOpen={isThemePopoverOpen}
          themeButtonRef={themeButtonRef}
          themePopoverRef={themePopoverRef}
          theme={theme}
          themeOptions={themeOptions}
          formatThemeOptionLabel={formatThemeOptionLabel}
          canvasSizeMode={canvasSizeMode}
          canvasSizeOptions={canvasSizeOptions}
          onToggleThemePopover={onToggleThemePopover}
          onSelectTheme={onSelectTheme}
          onCanvasSizeModeChange={onCanvasSizeModeChange}
          onOpenThemeBuilder={onOpenThemeBuilder}
          showReportDateControl={showReportDateControl}
          showBucketCustomizerControl={showBucketCustomizerControl}
          reportDateDraft={reportDateDraft}
          reportDate={reportDate}
          reportDatePlaceholder={reportDatePlaceholder}
          reportDatePickerRef={reportDatePickerRef}
          onReportDateDraftChange={onReportDateDraftChange}
          onReportDateDraftBlur={onReportDateDraftBlur}
          onReportDatePickerChange={onReportDatePickerChange}
          onOpenReportDatePicker={onOpenReportDatePicker}
          onOpenBucketEditor={onOpenBucketEditor}
        />
        <h1 style={{ marginTop: 0, marginBottom: 20, textAlign: 'center' }}>AR Aging</h1>
        {onRenderChart()}
        <div
          style={{
            marginTop: 10,
            marginBottom: 6,
            padding: '8px 10px',
            border: '1px solid',
            borderColor: uiTheme.buttonBorder,
            borderRadius: 8,
            background: uiTheme.cardBackground,
            color: uiTheme.pageText,
            fontSize: 12,
            lineHeight: 1.45,
            opacity: 0.95,
          }}
        >
          <strong>Applied bucket bounds:</strong> {appliedBucketSummary}
        </div>
        <CustomCanvasDialog
          isOpen={isCanvasDialogOpen}
          dialogRef={canvasDialogRef}
          uiTheme={uiTheme}
          bounds={customCanvasBounds}
          draft={customCanvasDraft}
          error={canvasDialogError}
          onDraftChange={onCanvasDraftChange}
          onClose={onCloseCustomCanvasDialog}
          onApply={onApplyCustomCanvasSize}
        />
        <BucketEditorDialog
          isOpen={isEditorOpen && showBucketCustomizerControl}
          bucketDialogRef={bucketDialogRef}
          uiTheme={uiTheme}
          bucketEditorLabels={bucketEditorLabels}
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
          onDragStart={onDragStart}
          onDropReorder={onDropReorder}
          onDragEnd={onDragEnd}
          onUpdateBucketDraftName={onUpdateBucketDraftName}
          onUpdateBucketSpecial={onUpdateBucketSpecial}
          onUpdateBucketCondition={onUpdateBucketCondition}
          onUpdateBucketCombinator={onUpdateBucketCombinator}
          onDeleteBucket={onDeleteBucket}
          onAddBucket={onAddBucket}
          onRestoreDefaultBuckets={onRestoreDefaultBuckets}
          onRunValidation={onRunValidation}
          onCancel={onCancelBucketEditor}
          onApply={onApplyBucketChanges}
        />
        <BucketNameSuggestionDialog
          isOpen={isEditorOpen}
          nameSuggestionDialog={nameSuggestionDialog}
          nameSuggestionDialogRef={nameSuggestionDialogRef}
          uiTheme={uiTheme}
          validationSuggestionPosition={validationSuggestionPosition}
          validationSuggestionCount={validationSuggestionCount}
          validationSuggestionIndex={validationSuggestionIndex}
          bucketDraft={bucketDraft}
          activeSuggestionBounds={activeSuggestionBounds}
          nameSuggestionLabels={nameSuggestionLabels}
          onNavigateNameSuggestion={onNavigateNameSuggestion}
          onUpdateCustomNameDraft={onUpdateCustomNameDraft}
          onBackToNameChoices={onBackToNameChoices}
          onApplyCustomName={onApplyCustomName}
          onAcceptSuggestedName={onAcceptSuggestedName}
          onKeepCurrentName={onKeepCurrentName}
          onStartEnterCustomName={onStartEnterCustomName}
        />
      </div>
    </>
  );
}
