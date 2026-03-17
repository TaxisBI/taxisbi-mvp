import { useMemo, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { AgingBucketDef, ResolvedUiTheme } from '../types';
import {
  buildConditionName,
  buildValidationSuggestions,
  detectOverlaps,
  parseDraftBuckets,
  parseInteger,
  reorderById,
  toDraft,
  type BucketCombinator,
  type BucketConditionDraft,
  type BucketDraft,
  type BucketOperator,
  type OverlapColorToken,
  type OverlapMetadata,
  type ValidationSuggestionItem,
} from '../bucketEditorEngine';
import type { NameSuggestionDialogState } from './useBucketEditorState';

type BucketEditorLabels = {
  validateBeforeApplyText: string;
};

type UseBucketEditorActionsParams = {
  buckets: AgingBucketDef[];
  setBuckets: Dispatch<SetStateAction<AgingBucketDef[]>>;
  bucketDraft: BucketDraft[];
  setBucketDraft: Dispatch<SetStateAction<BucketDraft[]>>;
  setBucketError: Dispatch<SetStateAction<string | null>>;
  validationPassed: boolean;
  setValidationPassed: Dispatch<SetStateAction<boolean>>;
  validatedBucketIds: Set<string>;
  setValidatedBucketIds: Dispatch<SetStateAction<Set<string>>>;
  validationSuggestions: ValidationSuggestionItem[];
  setValidationSuggestions: Dispatch<SetStateAction<ValidationSuggestionItem[]>>;
  validationSuggestionIndex: number;
  setValidationSuggestionIndex: Dispatch<SetStateAction<number>>;
  nameSuggestionDialog: NameSuggestionDialogState | null;
  setNameSuggestionDialog: Dispatch<SetStateAction<NameSuggestionDialogState | null>>;
  editorBaselineBuckets: AgingBucketDef[];
  clearValidationState: () => void;
  openBucketEditor: (buckets: AgingBucketDef[], toDraftFn: (bucket: AgingBucketDef) => BucketDraft) => void;
  closeBucketEditor: () => void;
  setDragBucketId: Dispatch<SetStateAction<string | null>>;
  metadataDefaultBuckets: AgingBucketDef[] | null;
  allowedOperatorSet: Set<BucketOperator>;
  allowedCombinatorSet: Set<BucketCombinator>;
  effectiveCombinatorOptions: BucketCombinator[];
  isDefaultBucketId: (id: string) => boolean;
  uiTheme: ResolvedUiTheme;
  bucketEditorLabels: BucketEditorLabels;
  suppressEditorCloseUntilRef: MutableRefObject<number>;
};

export function useBucketEditorActions({
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
}: UseBucketEditorActionsParams) {
  const parseDraftBucketsForPage = (draft: BucketDraft[]) =>
    parseDraftBuckets(draft, {
      allowedOperatorSet,
      allowedCombinatorSet,
      effectiveCombinatorOptions,
      isDefaultBucketId,
    });

  const { parsedDraftBuckets, overlapMeta, draftValidationError } = useMemo(() => {
    let parsed: AgingBucketDef[] = [];
    let overlaps: OverlapMetadata = {
      overlapIds: new Set<string>(),
      colorByBucketId: new Map<string, OverlapColorToken>(),
    };
    let errorMessage: string | null = null;

    try {
      parsed = parseDraftBucketsForPage(bucketDraft);
      const overlapPalette =
        uiTheme.overlapPalette && uiTheme.overlapPalette.length > 0
          ? uiTheme.overlapPalette
          : [{ border: uiTheme.statusDanger, background: uiTheme.cardBackground }];
      overlaps = detectOverlaps(parsed, overlapPalette);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Invalid buckets.';
    }

    return {
      parsedDraftBuckets: parsed,
      overlapMeta: overlaps,
      draftValidationError: errorMessage,
    };
  }, [
    allowedCombinatorSet,
    allowedOperatorSet,
    bucketDraft,
    effectiveCombinatorOptions,
    isDefaultBucketId,
    uiTheme.cardBackground,
    uiTheme.overlapPalette,
    uiTheme.statusDanger,
  ]);

  const openBucketEditorModal = () => {
    openBucketEditor(buckets, toDraft);
  };

  const applyBucketChanges = () => {
    if (!validationPassed) {
      setBucketError(bucketEditorLabels.validateBeforeApplyText);
      return;
    }

    try {
      const parsed = parseDraftBucketsForPage(bucketDraft);
      setBuckets(parsed);
      setBucketError(null);
      closeBucketEditor();
    } catch (error) {
      setBucketError(error instanceof Error ? error.message : 'Failed to apply bucket changes.');
    }
  };

  const openSuggestionAtIndex = (
    suggestions: ValidationSuggestionItem[],
    index: number,
    draftSource: BucketDraft[]
  ) => {
    if (suggestions.length === 0) {
      setNameSuggestionDialog(null);
      return;
    }

    const safeIndex = Math.min(Math.max(index, 0), suggestions.length - 1);
    const next = suggestions[safeIndex];
    const bucket = draftSource.find((entry) => entry.id === next.bucketId);
    setValidationSuggestionIndex(safeIndex);
    setNameSuggestionDialog({
      bucketId: next.bucketId,
      suggestedName: next.suggestedName,
      customNameDraft: bucket?.name ?? next.suggestedName,
      isCustomMode: false,
      error: null,
    });
  };

  const completeValidation = (draftSource: BucketDraft[]) => {
    setValidationPassed(true);
    setBucketError(null);
    setValidationSuggestions([]);
    setValidationSuggestionIndex(0);
    setNameSuggestionDialog(null);
    setValidatedBucketIds(new Set(draftSource.map((bucket) => bucket.id)));
  };

  const runValidation = () => {
    if (draftValidationError) {
      setBucketError(draftValidationError);
      clearValidationState();
      return;
    }

    if (overlapMeta.overlapIds.size > 0) {
      setBucketError('Validation failed: overlapping bucket bounds detected. Please adjust and retry.');
      clearValidationState();
      return;
    }

    const suggestions: ValidationSuggestionItem[] = buildValidationSuggestions(
      parsedDraftBuckets,
      editorBaselineBuckets
    );

    setBucketError(null);
    setValidationPassed(false);
    setValidatedBucketIds(new Set());

    if (suggestions.length === 0) {
      completeValidation(bucketDraft);
      return;
    }

    setValidationSuggestions(suggestions);
    openSuggestionAtIndex(suggestions, 0, bucketDraft);
  };

  const updateBucketDraftName = (id: string, value: string) => {
    setValidationPassed(false);
    setValidatedBucketIds(new Set());
    setBucketDraft((current) =>
      current.map((bucket) => {
        if (bucket.id !== id) {
          return bucket;
        }

        return {
          ...bucket,
          name: value,
          pendingSuggestedName: null,
        };
      })
    );
  };

  const updateBucketCondition = (
    id: string,
    slot: 'primary' | 'secondary',
    patch: Partial<BucketConditionDraft>
  ) => {
    setValidationPassed(false);
    setValidatedBucketIds(new Set());
    setBucketDraft((current) =>
      current.map((bucket) => {
        if (bucket.id !== id) {
          return bucket;
        }

        const nextDraft = {
          ...bucket,
          [slot]: {
            ...bucket[slot],
            ...patch,
          },
        };

        const firstValue = parseInteger(nextDraft.primary.value);
        const secondValue = parseInteger(nextDraft.secondary.value);

        if (firstValue !== null) {
          const first = {
            operator: nextDraft.primary.operator,
            value: firstValue,
          };
          const second =
            nextDraft.secondary.enabled && secondValue !== null
              ? {
                  operator: nextDraft.secondary.operator,
                  value: secondValue,
                }
              : undefined;
          const suggestedName = buildConditionName(first, second, nextDraft.combinator);
          if (suggestedName !== nextDraft.name) {
            nextDraft.pendingSuggestedName = suggestedName;
          } else {
            nextDraft.pendingSuggestedName = null;
          }
        }

        return nextDraft;
      })
    );
  };

  const addBucket = () => {
    setValidationPassed(false);
    setValidatedBucketIds(new Set());
    const nextId = `b${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setBucketDraft((current) => [
      ...current,
      {
        id: nextId,
        name: '',
        isSpecial: false,
        combinator: 'AND',
        isNew: true,
        pendingSuggestedName: null,
        primary: {
          operator: '>=',
          value: '',
          enabled: true,
        },
        secondary: {
          operator: '<=',
          value: '',
          enabled: false,
        },
      },
    ]);
  };

  const restoreDefaultBuckets = () => {
    setValidationPassed(false);
    setValidatedBucketIds(new Set());
    setBucketDraft((metadataDefaultBuckets ?? []).map(toDraft));
    setBucketError(null);
  };

  const deleteBucket = (id: string) => {
    setValidationPassed(false);
    setValidatedBucketIds(new Set());
    setBucketDraft((current) => current.filter((bucket) => bucket.id !== id));
  };

  const updateBucketCombinator = (id: string, combinator: BucketCombinator) => {
    setValidationPassed(false);
    setValidatedBucketIds(new Set());
    setBucketDraft((current) =>
      current.map((bucket) => {
        if (bucket.id !== id) {
          return bucket;
        }

        if (!bucket.isSpecial) {
          return {
            ...bucket,
            combinator: 'AND',
          };
        }

        const firstValue = parseInteger(bucket.primary.value);
        const secondValue = parseInteger(bucket.secondary.value);
        const next = { ...bucket, combinator };

        if (firstValue !== null) {
          const first = {
            operator: next.primary.operator,
            value: firstValue,
          };
          const second =
            next.secondary.enabled && secondValue !== null
              ? {
                  operator: next.secondary.operator,
                  value: secondValue,
                }
              : undefined;
          const suggestedName = buildConditionName(first, second, combinator);
          if (suggestedName !== next.name) {
            next.pendingSuggestedName = suggestedName;
          } else {
            next.pendingSuggestedName = null;
          }
        }

        return next;
      })
    );
  };

  const acceptSuggestedName = (id: string) => {
    const activeSuggestion = validationSuggestions.find((entry) => entry.bucketId === id);
    const suggestionFromDialog =
      nameSuggestionDialog && nameSuggestionDialog.bucketId === id
        ? nameSuggestionDialog.suggestedName
        : null;
    const suggestedName =
      suggestionFromDialog ?? (activeSuggestion ? activeSuggestion.suggestedName : null);

    if (!suggestedName) {
      return;
    }

    let nextDraft = bucketDraft;
    setBucketDraft((current) => {
      nextDraft = current.map((bucket) => {
        if (bucket.id !== id) {
          return bucket;
        }
        return {
          ...bucket,
          name: suggestedName,
          pendingSuggestedName: null,
          isNew: false,
        };
      });
      return nextDraft;
    });
    const currentIndex = validationSuggestionIndex;
    const nextSuggestions = validationSuggestions.filter((entry) => entry.bucketId !== id);

    suppressEditorCloseUntilRef.current = Date.now() + 250;
    if (nextSuggestions.length === 0) {
      completeValidation(nextDraft);
      return;
    }

    setValidationSuggestions(nextSuggestions);
    openSuggestionAtIndex(nextSuggestions, Math.min(currentIndex, nextSuggestions.length - 1), nextDraft);
  };

  const keepCurrentName = (id: string) => {
    let nextDraft = bucketDraft;
    setBucketDraft((current) => {
      nextDraft = current.map((bucket) => {
        if (bucket.id !== id) {
          return bucket;
        }
        return {
          ...bucket,
          pendingSuggestedName: null,
          isNew: false,
        };
      });
      return nextDraft;
    });
    const currentIndex = validationSuggestionIndex;
    const nextSuggestions = validationSuggestions.filter((entry) => entry.bucketId !== id);

    suppressEditorCloseUntilRef.current = Date.now() + 250;
    if (nextSuggestions.length === 0) {
      completeValidation(nextDraft);
      return;
    }

    setValidationSuggestions(nextSuggestions);
    openSuggestionAtIndex(nextSuggestions, Math.min(currentIndex, nextSuggestions.length - 1), nextDraft);
  };

  const navigateNameSuggestion = (delta: -1 | 1) => {
    if (validationSuggestions.length === 0) {
      return;
    }
    const nextIndex = Math.min(
      Math.max(validationSuggestionIndex + delta, 0),
      validationSuggestions.length - 1
    );
    openSuggestionAtIndex(validationSuggestions, nextIndex, bucketDraft);
  };

  const startEnterCustomName = () => {
    setNameSuggestionDialog((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        isCustomMode: true,
        error: null,
      };
    });
  };

  const backToNameChoices = () => {
    setNameSuggestionDialog((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        isCustomMode: false,
        error: null,
      };
    });
  };

  const updateCustomNameDraft = (value: string) => {
    setNameSuggestionDialog((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        customNameDraft: value,
        error: null,
      };
    });
  };

  const applyCustomName = () => {
    if (!nameSuggestionDialog) {
      return;
    }

    const customName = nameSuggestionDialog.customNameDraft.trim();
    if (!customName) {
      setNameSuggestionDialog((current) =>
        current
          ? {
              ...current,
              error: 'Custom name is required.',
            }
          : current
      );
      return;
    }

    let nextDraft = bucketDraft;
    setBucketDraft((current) => {
      nextDraft = current.map((bucket) => {
        if (bucket.id !== nameSuggestionDialog.bucketId) {
          return bucket;
        }

        return {
          ...bucket,
          name: customName,
          pendingSuggestedName: null,
          isNew: false,
        };
      });
      return nextDraft;
    });
    const currentIndex = validationSuggestionIndex;
    const nextSuggestions = validationSuggestions.filter(
      (entry) => entry.bucketId !== nameSuggestionDialog.bucketId
    );

    suppressEditorCloseUntilRef.current = Date.now() + 250;
    if (nextSuggestions.length === 0) {
      completeValidation(nextDraft);
      return;
    }

    setValidationSuggestions(nextSuggestions);
    openSuggestionAtIndex(nextSuggestions, Math.min(currentIndex, nextSuggestions.length - 1), nextDraft);
  };

  const updateBucketSpecial = (id: string, isSpecial: boolean) => {
    setValidationPassed(false);
    setValidatedBucketIds(new Set());
    setBucketDraft((current) =>
      current.map((bucket) => {
        if (bucket.id !== id) {
          return bucket;
        }

        const nextCombinator = isSpecial ? bucket.combinator : 'AND';
        const firstValue = parseInteger(bucket.primary.value);
        const secondValue = parseInteger(bucket.secondary.value);
        const next = {
          ...bucket,
          isSpecial,
          combinator: nextCombinator,
        };

        if (firstValue !== null) {
          const first = {
            operator: next.primary.operator,
            value: firstValue,
          };
          const second =
            next.secondary.enabled && secondValue !== null
              ? {
                  operator: next.secondary.operator,
                  value: secondValue,
                }
              : undefined;
          const suggestedName = buildConditionName(first, second, nextCombinator);
          if (suggestedName !== next.name) {
            next.pendingSuggestedName = suggestedName;
          } else {
            next.pendingSuggestedName = null;
          }
        }

        return next;
      })
    );
  };

  const handleDragStart = (id: string) => {
    setDragBucketId(id);
  };

  const handleDropReorder = (sourceId: string, targetId: string) => {
    setValidationPassed(false);
    setValidatedBucketIds(new Set());
    setBucketDraft((current) => reorderById(current, sourceId, targetId));
    setDragBucketId(null);
  };

  const validationSuggestionCount = validationSuggestions.length;
  const validationSuggestionPosition =
    validationSuggestionCount > 0 ? validationSuggestionIndex + 1 : 0;
  const activeSuggestionBucket = nameSuggestionDialog
    ? bucketDraft.find((entry) => entry.id === nameSuggestionDialog.bucketId)
    : undefined;
  const activeSuggestionBounds = activeSuggestionBucket
    ? activeSuggestionBucket.secondary.enabled
      ? `${activeSuggestionBucket.primary.operator} ${activeSuggestionBucket.primary.value || '?'} ${activeSuggestionBucket.combinator} ${activeSuggestionBucket.secondary.operator} ${activeSuggestionBucket.secondary.value || '?'}`
      : `${activeSuggestionBucket.primary.operator} ${activeSuggestionBucket.primary.value || '?'}`
    : '-';

  return {
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
  };
}
