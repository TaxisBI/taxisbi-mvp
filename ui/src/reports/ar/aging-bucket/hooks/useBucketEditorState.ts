import { useState } from 'react';
import type { AgingBucketDef } from '../types';
import type { BucketDraft, ValidationSuggestionItem } from '../bucketEditorEngine';

export type NameSuggestionDialogState = {
  bucketId: string;
  suggestedName: string;
  customNameDraft: string;
  isCustomMode: boolean;
  error: string | null;
};

export function useBucketEditorState() {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [bucketDraft, setBucketDraft] = useState<BucketDraft[]>([]);
  const [bucketError, setBucketError] = useState<string | null>(null);
  const [dragBucketId, setDragBucketId] = useState<string | null>(null);
  const [nameSuggestionDialog, setNameSuggestionDialog] = useState<NameSuggestionDialogState | null>(null);
  const [validationSuggestions, setValidationSuggestions] = useState<ValidationSuggestionItem[]>([]);
  const [validationSuggestionIndex, setValidationSuggestionIndex] = useState(0);
  const [validationPassed, setValidationPassed] = useState(false);
  const [validatedBucketIds, setValidatedBucketIds] = useState<Set<string>>(new Set());
  const [editorBaselineBuckets, setEditorBaselineBuckets] = useState<AgingBucketDef[]>([]);

  const clearValidationState = () => {
    setValidationPassed(false);
    setValidatedBucketIds(new Set());
    setValidationSuggestions([]);
    setValidationSuggestionIndex(0);
    setNameSuggestionDialog(null);
  };

  const openBucketEditor = (buckets: AgingBucketDef[], toDraft: (bucket: AgingBucketDef) => BucketDraft) => {
    const nextDraft = buckets.map(toDraft);
    setBucketDraft(nextDraft);
    setEditorBaselineBuckets(
      buckets.map((bucket) => ({
        ...bucket,
        conditions: bucket.conditions.map((condition) => ({ ...condition })),
      }))
    );
    setBucketError(null);
    clearValidationState();
    setIsEditorOpen(true);
  };

  const closeBucketEditor = () => {
    setIsEditorOpen(false);
    setBucketError(null);
    setDragBucketId(null);
    clearValidationState();
  };

  return {
    isEditorOpen,
    setIsEditorOpen,
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
    setEditorBaselineBuckets,
    clearValidationState,
    openBucketEditor,
    closeBucketEditor,
  };
}
