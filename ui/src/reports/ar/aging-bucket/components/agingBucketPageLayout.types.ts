import type { ReactNode, RefObject } from 'react';
import type { BucketCombinator, BucketDraft, BucketOperator, OverlapMetadata } from '../bucketEditorEngine';
import type { NameSuggestionDialogState } from '../hooks/useBucketEditorState';
import type { CanvasSizeMode, ResolvedUiTheme, ThemeOption } from '../types';
import type {
  BucketEditorLabels,
  CanvasSizeOption,
  NameSuggestionLabels,
} from './agingBucketComponentProps.types';

export type AgingBucketLayoutRefs = {
  themePopoverRef: RefObject<HTMLDivElement | null>;
  themeButtonRef: RefObject<HTMLButtonElement | null>;
  reportDatePickerRef: RefObject<HTMLInputElement | null>;
  bucketDialogRef: RefObject<HTMLDivElement | null>;
  canvasDialogRef: RefObject<HTMLDivElement | null>;
  nameSuggestionDialogRef: RefObject<HTMLDivElement | null>;
};

export type AgingBucketLayoutShell = {
  uiTheme: ResolvedUiTheme;
  pageMaxWidth: string | number;
  showReportDateControl: boolean;
  showBucketCustomizerControl: boolean;
  appliedBucketSummary: string;
};

export type AgingBucketThemeControls = {
  theme: string;
  themeOptions: ThemeOption[];
  isThemePopoverOpen: boolean;
  onToggleThemePopover: () => void;
  onSelectTheme: (themeKey: string) => void;
  onOpenThemeBuilder: () => void;
  formatThemeOptionLabel: (option: ThemeOption) => string;
};

export type AgingBucketReportDateControls = {
  reportDate: string;
  reportDateDraft: string;
  reportDatePlaceholder: string;
  onReportDateDraftChange: (value: string) => void;
  onReportDateDraftBlur: () => void;
  onReportDatePickerChange: (value: string) => void;
  onOpenReportDatePicker: () => void;
};

export type AgingBucketCanvasControls = {
  canvasSizeMode: CanvasSizeMode;
  canvasSizeOptions: CanvasSizeOption[];
  customCanvasBounds: { minWidth: number; minHeight: number; maxWidth: number; maxHeight: number };
  isCanvasDialogOpen: boolean;
  customCanvasDraft: { width: string; height: string };
  canvasDialogError: string | null;
  onCanvasSizeModeChange: (mode: CanvasSizeMode) => void;
  onCanvasDraftChange: (patch: Partial<{ width: string; height: string }>) => void;
  onCloseCustomCanvasDialog: () => void;
  onApplyCustomCanvasSize: () => void;
};

export type AgingBucketBucketEditorModel = {
  isOpen: boolean;
  onOpenBucketEditor: () => void;
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
  bucketEditorLabels: BucketEditorLabels;
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
};

export type AgingBucketNameSuggestionModel = {
  nameSuggestionDialog: NameSuggestionDialogState | null;
  validationSuggestionPosition: number;
  validationSuggestionCount: number;
  validationSuggestionIndex: number;
  activeSuggestionBounds: string;
  nameSuggestionLabels: NameSuggestionLabels;
  onNavigateNameSuggestion: (delta: -1 | 1) => void;
  onUpdateCustomNameDraft: (value: string) => void;
  onBackToNameChoices: () => void;
  onApplyCustomName: () => void;
  onAcceptSuggestedName: (id: string) => void;
  onKeepCurrentName: (id: string) => void;
  onStartEnterCustomName: () => void;
};

export type AgingBucketChartModel = {
  onRenderChart: () => ReactNode;
};

export type AgingBucketPageLayoutProps = {
  refs: AgingBucketLayoutRefs;
  shell: AgingBucketLayoutShell;
  themeControls: AgingBucketThemeControls;
  reportDateControls: AgingBucketReportDateControls;
  canvasControls: AgingBucketCanvasControls;
  bucketEditor: AgingBucketBucketEditorModel;
  nameSuggestion: AgingBucketNameSuggestionModel;
  chart: AgingBucketChartModel;
};
