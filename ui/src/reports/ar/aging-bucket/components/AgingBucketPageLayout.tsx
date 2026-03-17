import type { ReactNode, RefObject } from 'react';
import type { BucketCombinator, BucketDraft, BucketOperator, OverlapMetadata } from '../bucketEditorEngine';
import type { NameSuggestionDialogState } from '../hooks/useBucketEditorState';
import type { CanvasSizeMode, ResolvedUiTheme, ThemeOption } from '../types';
import AgingBucketToolbar from './AgingBucketToolbar';
import CustomCanvasDialog from './CustomCanvasDialog';
import BucketEditorDialog from './BucketEditorDialog';
import BucketNameSuggestionDialog from './BucketNameSuggestionDialog';

type AgingBucketPageLayoutProps = {
  uiTheme: ResolvedUiTheme;
  pageMaxWidth: string | number;
  themePopoverRef: RefObject<HTMLDivElement | null>;
  themeButtonRef: RefObject<HTMLButtonElement | null>;
  reportDatePickerRef: RefObject<HTMLInputElement | null>;
  bucketDialogRef: RefObject<HTMLDivElement | null>;
  canvasDialogRef: RefObject<HTMLDivElement | null>;
  nameSuggestionDialogRef: RefObject<HTMLDivElement | null>;
  theme: string;
  themeOptions: ThemeOption[];
  reportDate: string;
  reportDateDraft: string;
  reportDatePlaceholder: string;
  canvasSizeMode: CanvasSizeMode;
  canvasSizeOptions: Array<{ value: CanvasSizeMode; label: string; displayOrder: number }>;
  customCanvasSize: { width: number; height: number };
  customCanvasBounds: { minWidth: number; minHeight: number; maxWidth: number; maxHeight: number };
  isThemePopoverOpen: boolean;
  showReportDateControl: boolean;
  showBucketCustomizerControl: boolean;
  onToggleThemePopover: () => void;
  onSelectTheme: (themeKey: string) => void;
  onCanvasSizeModeChange: (mode: CanvasSizeMode) => void;
  onOpenThemeBuilder: () => void;
  onReportDateDraftChange: (value: string) => void;
  onReportDateDraftBlur: () => void;
  onReportDatePickerChange: (value: string) => void;
  onOpenReportDatePicker: () => void;
  onOpenBucketEditor: () => void;
  formatThemeOptionLabel: (option: ThemeOption) => string;
  appliedBucketSummary: string;
  isCanvasDialogOpen: boolean;
  customCanvasDraft: { width: string; height: string };
  canvasDialogError: string | null;
  onCanvasDraftChange: (patch: Partial<{ width: string; height: string }>) => void;
  onCloseCustomCanvasDialog: () => void;
  onApplyCustomCanvasSize: () => void;
  isEditorOpen: boolean;
  bucketDraft: BucketDraft[];
  overlapMeta: OverlapMetadata;
  dragBucketId: string | null;
  validationPassed: boolean;
  validatedBucketIds: Set<string>;
  draftValidationError: string | null;
  bucketError: string | null;
  isDefaultBucketId: (id: string) => boolean;
  effectiveOperatorOptions: BucketOperator[];
  effectiveCombinatorOptions: BucketCombinator[];
  operatorLabels: Record<BucketOperator, string>;
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
  onDragStart: (id: string) => void;
  onDropReorder: (sourceId: string, targetId: string) => void;
  onDragEnd: () => void;
  onUpdateBucketDraftName: (id: string, value: string) => void;
  onUpdateBucketSpecial: (id: string, isSpecial: boolean) => void;
  onUpdateBucketCondition: (
    id: string,
    slot: 'primary' | 'secondary',
    patch: Partial<{ operator: BucketOperator; value: string; enabled: boolean }>
  ) => void;
  onUpdateBucketCombinator: (id: string, combinator: BucketCombinator) => void;
  onDeleteBucket: (id: string) => void;
  onAddBucket: () => void;
  onRestoreDefaultBuckets: () => void;
  onRunValidation: () => void;
  onCancelBucketEditor: () => void;
  onApplyBucketChanges: () => void;
  nameSuggestionDialog: NameSuggestionDialogState | null;
  validationSuggestionPosition: number;
  validationSuggestionCount: number;
  validationSuggestionIndex: number;
  activeSuggestionBounds: string;
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
  onNavigateNameSuggestion: (delta: -1 | 1) => void;
  onUpdateCustomNameDraft: (value: string) => void;
  onBackToNameChoices: () => void;
  onApplyCustomName: () => void;
  onAcceptSuggestedName: (id: string) => void;
  onKeepCurrentName: (id: string) => void;
  onStartEnterCustomName: () => void;
  onRenderChart: () => ReactNode;
};

export default function AgingBucketPageLayout(props: AgingBucketPageLayoutProps) {
  const {
    uiTheme,
    pageMaxWidth,
    themePopoverRef,
    themeButtonRef,
    reportDatePickerRef,
    bucketDialogRef,
    canvasDialogRef,
    nameSuggestionDialogRef,
    theme,
    themeOptions,
    reportDate,
    reportDateDraft,
    reportDatePlaceholder,
    canvasSizeMode,
    canvasSizeOptions,
    customCanvasBounds,
    isThemePopoverOpen,
    showReportDateControl,
    showBucketCustomizerControl,
    onToggleThemePopover,
    onSelectTheme,
    onCanvasSizeModeChange,
    onOpenThemeBuilder,
    onReportDateDraftChange,
    onReportDateDraftBlur,
    onReportDatePickerChange,
    onOpenReportDatePicker,
    onOpenBucketEditor,
    formatThemeOptionLabel,
    appliedBucketSummary,
    isCanvasDialogOpen,
    customCanvasDraft,
    canvasDialogError,
    onCanvasDraftChange,
    onCloseCustomCanvasDialog,
    onApplyCustomCanvasSize,
    isEditorOpen,
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
    onRenderChart,
  } = props;

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
