import type { RefObject } from 'react';
import type {
  BucketCombinator,
  BucketDraft,
  BucketOperator,
  OverlapMetadata,
} from '../bucketEditorEngine';
import type { NameSuggestionDialogState } from '../hooks/useBucketEditorState';
import type { CanvasSizeMode, ResolvedUiTheme, ThemeOption } from '../types';

export type CanvasSizeOption = {
  value: CanvasSizeMode;
  label: string;
  displayOrder: number;
};

export type BucketEditorLabels = {
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

export type NameSuggestionLabels = {
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

export type AgingBucketToolbarProps = {
  uiTheme: ResolvedUiTheme;
  isThemePopoverOpen: boolean;
  themeButtonRef: RefObject<HTMLButtonElement | null>;
  themePopoverRef: RefObject<HTMLDivElement | null>;
  theme: string;
  themeOptions: ThemeOption[];
  formatThemeOptionLabel: (option: ThemeOption) => string;
  canvasSizeMode: CanvasSizeMode;
  canvasSizeOptions: CanvasSizeOption[];
  onToggleThemePopover: () => void;
  onSelectTheme: (themeKey: string) => void;
  onCanvasSizeModeChange: (mode: CanvasSizeMode) => void;
  onOpenThemeBuilder: () => void;
  showReportDateControl: boolean;
  showBucketCustomizerControl: boolean;
  reportDateDraft: string;
  reportDate: string;
  reportDatePlaceholder: string;
  reportDatePickerRef: RefObject<HTMLInputElement | null>;
  onReportDateDraftChange: (value: string) => void;
  onReportDateDraftBlur: () => void;
  onReportDatePickerChange: (value: string) => void;
  onOpenReportDatePicker: () => void;
  onOpenBucketEditor: () => void;
};

export type BucketEditorDialogProps = {
  isOpen: boolean;
  bucketDialogRef: RefObject<HTMLDivElement | null>;
  uiTheme: ResolvedUiTheme;
  bucketEditorLabels: BucketEditorLabels;
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
  onCancel: () => void;
  onApply: () => void;
};

export type BucketNameSuggestionDialogProps = {
  isOpen: boolean;
  nameSuggestionDialog: NameSuggestionDialogState | null;
  nameSuggestionDialogRef: RefObject<HTMLDivElement | null>;
  uiTheme: ResolvedUiTheme;
  validationSuggestionPosition: number;
  validationSuggestionCount: number;
  validationSuggestionIndex: number;
  bucketDraft: BucketDraft[];
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
