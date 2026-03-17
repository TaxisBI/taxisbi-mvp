import { useEffect, useMemo, useRef, useState } from 'react';
import ARAgingBucketChart, {
  AgingBucketDef,
  CanvasSizeMode,
  ChartPackMetadata,
  ResolvedUiTheme,
  ThemeOption,
} from './components/ARAgingBucketChart';
import AgingBucketToolbar from './components/AgingBucketToolbar';
import BucketEditorDialog from './components/BucketEditorDialog';
import BucketNameSuggestionDialog from './components/BucketNameSuggestionDialog';
import CustomCanvasDialog from './components/CustomCanvasDialog';
import {
  CANVAS_SIZE_OPTIONS_SORTED,
  COMBINATOR_OPTIONS,
  OPERATOR_OPTIONS,
  formatBucketRule,
  formatIsoDateForLocale,
  formatThemeOptionLabel,
  getCustomCanvasBounds,
  getLocaleDateMeta,
  getPageMaxWidthByCanvasMode,
  getTodayIsoDate,
  hasStoredBuckets,
  isCanvasSizeMode,
  isValidIsoDate,
  loadStoredBuckets,
  parseBucketDefaultsFromMetadata,
  parseCanvasSizeOptionsFromMetadata,
  parseLocaleDateToIso,
  parsePositiveInt,
  resolveRuntimeUiContracts,
} from './agingBucketPageUtils';
import {
  buildConditionName,
  buildValidationSuggestions,
  detectOverlaps,
  normalizeLegacyDefaultBucket,
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
} from './bucketEditorEngine';
import { useBucketEditorState, type NameSuggestionDialogState } from './hooks/useBucketEditorState';
import type { ThemeBuilderReportId } from '../../../theme/navigation';

const THEME_STORAGE_KEY = 'taxisbi.ui.theme';
const REPORT_DATE_STORAGE_KEY = 'taxisbi.ui.reportDate';
const BUCKET_STORAGE_KEY = 'taxisbi.ui.agingBuckets';
const CANVAS_SIZE_STORAGE_KEY = 'taxisbi.ui.canvasSizeMode';
const CANVAS_CUSTOM_SIZE_STORAGE_KEY = 'taxisbi.ui.canvasCustomSize';

const OPERATOR_LABELS: Record<BucketOperator, string> = {
  '=': '=',
  '<>': '!=',
  '>=': '>=',
  '<=': '<=',
  '>': '>',
  '<': '<',
};

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
  const chartContext = useMemo(
    () => ({
      domain: 'ar',
      pack: 'receivable_item',
      chart: 'aging_by_bucket',
    }),
    []
  );
  const reportDatePickerRef = useRef<HTMLInputElement | null>(null);
  const themePopoverRef = useRef<HTMLDivElement | null>(null);
  const themeButtonRef = useRef<HTMLButtonElement | null>(null);
  const bucketDialogRef = useRef<HTMLDivElement | null>(null);
  const canvasDialogRef = useRef<HTMLDivElement | null>(null);
  const nameSuggestionDialogRef = useRef<HTMLDivElement | null>(null);
  const suppressEditorCloseUntilRef = useRef(0);
  const localeDateMeta = useMemo(() => getLocaleDateMeta(), []);
  const customCanvasBounds = getCustomCanvasBounds();
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }
    return window.localStorage.getItem(THEME_STORAGE_KEY) ?? 'light';
  });
  const [themeOptions, setThemeOptions] = useState<ThemeOption[]>([
    { key: 'light', label: 'Light' },
    { key: 'dark', label: 'Dark' },
  ]);
  const [reportDate, setReportDate] = useState<string>(() => {
    const today = getTodayIsoDate();
    if (typeof window === 'undefined') {
      return today;
    }
    const stored = window.localStorage.getItem(REPORT_DATE_STORAGE_KEY);
    return stored && isValidIsoDate(stored) ? stored : today;
  });
  const [reportDateDraft, setReportDateDraft] = useState<string>(() =>
    formatIsoDateForLocale(reportDate)
  );
  const [canvasSizeMode, setCanvasSizeMode] = useState<CanvasSizeMode>(() => {
    if (typeof window === 'undefined') {
      return 'fit-screen';
    }
    const stored = window.localStorage.getItem(CANVAS_SIZE_STORAGE_KEY);
    return stored && isCanvasSizeMode(stored) ? stored : 'fit-screen';
  });
  const [customCanvasSize, setCustomCanvasSize] = useState<{ width: number; height: number }>(() => {
    if (typeof window === 'undefined') {
      return { width: 1366, height: 768 };
    }
    const raw = window.localStorage.getItem(CANVAS_CUSTOM_SIZE_STORAGE_KEY);
    if (!raw) {
      return { width: 1366, height: 768 };
    }
    try {
      const parsed = JSON.parse(raw) as { width?: unknown; height?: unknown };
      const width = Number(parsed.width);
      const height = Number(parsed.height);
      if (Number.isInteger(width) && width > 0 && Number.isInteger(height) && height > 0) {
        return { width, height };
      }
      return { width: 1366, height: 768 };
    } catch {
      return { width: 1366, height: 768 };
    }
  });
  const [isCanvasDialogOpen, setIsCanvasDialogOpen] = useState(false);
  const [customCanvasDraft, setCustomCanvasDraft] = useState<{ width: string; height: string }>(() => ({
    width: '1366',
    height: '768',
  }));
  const [canvasDialogError, setCanvasDialogError] = useState<string | null>(null);
  const [buckets, setBuckets] = useState<AgingBucketDef[]>(() =>
    loadStoredBuckets({
      storageKey: BUCKET_STORAGE_KEY,
      isDefaultBucketId,
      operatorOptions: OPERATOR_OPTIONS,
      normalizeLegacyDefaultBucket,
    })
  );
  const [isThemePopoverOpen, setIsThemePopoverOpen] = useState(false);
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
  const [uiTheme, setUiTheme] = useState<ResolvedUiTheme>({
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
  });
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

  useEffect(() => {
    if (!metadataDefaultBuckets) {
      return;
    }

    setDefaultBucketIds(metadataDefaultBuckets.map((bucket) => bucket.id));
  }, [metadataDefaultBuckets]);

  useEffect(() => {
    if (!metadataDefaultBuckets || hasStoredBuckets(BUCKET_STORAGE_KEY)) {
      return;
    }

    setBuckets(metadataDefaultBuckets);
    setBucketDraft(metadataDefaultBuckets.map(toDraft));
  }, [metadataDefaultBuckets]);

  useEffect(() => {
    if (canvasSizeOptions.length === 0) {
      return;
    }

    if (canvasSizeOptions.some((entry) => entry.value === canvasSizeMode)) {
      return;
    }

    setCanvasSizeMode(canvasSizeOptions[0].value);
  }, [canvasSizeMode, canvasSizeOptions]);

  useEffect(() => {
    const normalizeCombinator = (value: BucketCombinator) =>
      allowedCombinatorSet.has(value) ? value : effectiveCombinatorOptions[0] ?? 'AND';

    const sanitizeBuckets = (input: AgingBucketDef[]) =>
      input
        .map((bucket) => {
          const conditions = bucket.conditions
            .filter((condition) => allowedOperatorSet.has(condition.operator))
            .slice(0, 2);

          if (conditions.length === 0) {
            return null;
          }

          return {
            ...bucket,
            combinator: normalizeCombinator(bucket.combinator),
            conditions,
          } as AgingBucketDef;
        })
        .filter((value): value is AgingBucketDef => value !== null);

    setBuckets((current) => {
      const sanitized = sanitizeBuckets(current);
      if (sanitized.length === 0) {
        return current;
      }

      return JSON.stringify(sanitized) === JSON.stringify(current) ? current : sanitized;
    });

    setBucketDraft((current) => {
      const parsed = current
        .map((bucket) => {
          const parsedConditions = [bucket.primary, bucket.secondary]
            .filter((condition) => condition.enabled)
            .map((condition) => ({
              operator: condition.operator,
              value: parseInteger(condition.value),
            }))
            .filter(
              (condition): condition is { operator: BucketOperator; value: number } =>
                condition.value !== null
            )
            .filter((condition) => allowedOperatorSet.has(condition.operator));

          if (parsedConditions.length === 0) {
            return null;
          }

          return {
            id: bucket.id,
            name: bucket.name,
            isSpecial: bucket.isSpecial,
            combinator: allowedCombinatorSet.has(bucket.combinator)
              ? bucket.combinator
              : effectiveCombinatorOptions[0] ?? 'AND',
            conditions: parsedConditions,
          } satisfies AgingBucketDef;
        })
        .filter((value): value is AgingBucketDef => value !== null);

      if (parsed.length === 0) {
        return current;
      }

      const sanitizedDraft = parsed.map(toDraft);
      return JSON.stringify(sanitizedDraft) === JSON.stringify(current) ? current : sanitizedDraft;
    });
  }, [allowedCombinatorSet, allowedOperatorSet, effectiveCombinatorOptions]);

  const handleThemeCatalogResolved = (catalog: ThemeOption[], defaultTheme: string) => {
    if (catalog.length > 0) {
      setThemeOptions(catalog);
      setTheme((currentTheme) => {
        const hasCurrent = catalog.some((entry) => entry.key === currentTheme);
        return hasCurrent ? currentTheme : defaultTheme;
      });
    }
  };

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(REPORT_DATE_STORAGE_KEY, reportDate);
  }, [reportDate]);

  useEffect(() => {
    setReportDateDraft(formatIsoDateForLocale(reportDate));
  }, [reportDate]);

  useEffect(() => {
    window.localStorage.setItem(BUCKET_STORAGE_KEY, JSON.stringify(buckets));
  }, [buckets]);

  useEffect(() => {
    window.localStorage.setItem(CANVAS_SIZE_STORAGE_KEY, canvasSizeMode);
  }, [canvasSizeMode]);

  useEffect(() => {
    window.localStorage.setItem(CANVAS_CUSTOM_SIZE_STORAGE_KEY, JSON.stringify(customCanvasSize));
  }, [customCanvasSize]);

  useEffect(() => {
    if (!isThemePopoverOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (themePopoverRef.current?.contains(target) || themeButtonRef.current?.contains(target)) {
        return;
      }
      setIsThemePopoverOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsThemePopoverOpen(false);
      }
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isThemePopoverOpen]);

  useEffect(() => {
    if (!isEditorOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (Date.now() < suppressEditorCloseUntilRef.current) {
        return;
      }
      if (nameSuggestionDialog) {
        return;
      }
      const target = event.target as Node;
      if (bucketDialogRef.current?.contains(target)) {
        return;
      }
      closeBucketEditor();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (Date.now() < suppressEditorCloseUntilRef.current) {
        return;
      }
      if (nameSuggestionDialog) {
        return;
      }
      if (event.key === 'Escape') {
        closeBucketEditor();
      }
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isEditorOpen, nameSuggestionDialog]);

  useEffect(() => {
    if (!isCanvasDialogOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (canvasDialogRef.current?.contains(target)) {
        return;
      }
      setIsCanvasDialogOpen(false);
      setCanvasDialogError(null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCanvasDialogOpen(false);
        setCanvasDialogError(null);
      }
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isCanvasDialogOpen]);

  useEffect(() => {
    if (!nameSuggestionDialog) {
      return;
    }

    return undefined;
  }, [nameSuggestionDialog]);

  const parseDraftBucketsForPage = (draft: BucketDraft[]) =>
    parseDraftBuckets(draft, {
      allowedOperatorSet,
      allowedCombinatorSet,
      effectiveCombinatorOptions,
      isDefaultBucketId,
    });

  let parsedDraftBuckets: AgingBucketDef[] = [];
  let overlapMeta: OverlapMetadata = {
    overlapIds: new Set<string>(),
    colorByBucketId: new Map<string, OverlapColorToken>(),
  };
  let draftValidationError: string | null = null;

  try {
    parsedDraftBuckets = parseDraftBucketsForPage(bucketDraft);
    const overlapPalette =
      uiTheme.overlapPalette && uiTheme.overlapPalette.length > 0
        ? uiTheme.overlapPalette
        : [{ border: uiTheme.statusDanger, background: uiTheme.cardBackground }];
    overlapMeta = detectOverlaps(parsedDraftBuckets, overlapPalette);
  } catch (error) {
    draftValidationError = error instanceof Error ? error.message : 'Invalid buckets.';
  }

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

  const openCustomCanvasDialog = () => {
    setCustomCanvasDraft({
      width: String(customCanvasSize.width),
      height: String(customCanvasSize.height),
    });
    setCanvasDialogError(null);
    setIsCanvasDialogOpen(true);
  };

  const closeCustomCanvasDialog = () => {
    setIsCanvasDialogOpen(false);
    setCanvasDialogError(null);
  };

  const applyCustomCanvasSize = () => {
    const width = parsePositiveInt(customCanvasDraft.width);
    const height = parsePositiveInt(customCanvasDraft.height);

    if (width === null || height === null) {
      setCanvasDialogError('Width and height must be positive whole numbers.');
      return;
    }

    if (width < customCanvasBounds.minWidth || height < customCanvasBounds.minHeight) {
      setCanvasDialogError(
        `Minimum size is ${customCanvasBounds.minWidth} x ${customCanvasBounds.minHeight}.`
      );
      return;
    }

    if (width > customCanvasBounds.maxWidth || height > customCanvasBounds.maxHeight) {
      setCanvasDialogError(
        `Maximum for your screen is ${customCanvasBounds.maxWidth} x ${customCanvasBounds.maxHeight}.`
      );
      return;
    }

    setCustomCanvasSize({ width, height });
    setCanvasSizeMode('custom-pixels');
    closeCustomCanvasDialog();
  };

  const handleCanvasSizeModeChange = (value: CanvasSizeMode) => {
    if (value === 'custom-pixels') {
      openCustomCanvasDialog();
      return;
    }
    setCanvasSizeMode(value);
  };

  const toggleThemePopover = () => {
    setIsThemePopoverOpen((open) => !open);
  };

  const handleThemeSelection = (nextTheme: string) => {
    setTheme(nextTheme);
    setIsThemePopoverOpen(false);
  };

  const handleOpenThemeBuilder = () => {
    setIsThemePopoverOpen(false);
    onOpenThemeBuilder?.('ar-aging');
  };

  const handleReportDateDraftChange = (nextDraft: string) => {
    setReportDateDraft(nextDraft);
    const parsedIso = parseLocaleDateToIso(nextDraft, localeDateMeta);
    if (parsedIso) {
      setReportDate(parsedIso);
    }
  };

  const handleReportDateDraftBlur = () => {
    const parsedIso = parseLocaleDateToIso(reportDateDraft, localeDateMeta);
    if (!parsedIso) {
      setReportDateDraft(formatIsoDateForLocale(reportDate));
    }
  };

  const handleReportDatePickerChange = (picked: string) => {
    if (isValidIsoDate(picked)) {
      setReportDate(picked);
      setReportDateDraft(formatIsoDateForLocale(picked));
    }
  };

  const openReportDatePicker = () => {
    const input = reportDatePickerRef.current;
    if (!input) {
      return;
    }

    const pickerCapable = input as HTMLInputElement & { showPicker?: () => void };
    if (pickerCapable.showPicker) {
      pickerCapable.showPicker();
      return;
    }

    input.focus();
    input.click();
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
  const appliedBucketSummary = buckets.map(formatBucketRule).join(' | ');

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
        onToggleThemePopover={toggleThemePopover}
        onSelectTheme={handleThemeSelection}
        onCanvasSizeModeChange={handleCanvasSizeModeChange}
        onOpenThemeBuilder={handleOpenThemeBuilder}
        showReportDateControl={showReportDateControl}
        showBucketCustomizerControl={showBucketCustomizerControl}
        reportDateDraft={reportDateDraft}
        reportDate={reportDate}
        reportDatePlaceholder={localeDateMeta.placeholder}
        reportDatePickerRef={reportDatePickerRef}
        onReportDateDraftChange={handleReportDateDraftChange}
        onReportDateDraftBlur={handleReportDateDraftBlur}
        onReportDatePickerChange={handleReportDatePickerChange}
        onOpenReportDatePicker={openReportDatePicker}
        onOpenBucketEditor={openBucketEditorModal}
      />
      <h1 style={{ marginTop: 0, marginBottom: 20, textAlign: 'center' }}>AR Aging</h1>
      <ARAgingBucketChart
        chartContext={chartContext}
        theme={theme}
        reportDate={reportDate}
        buckets={buckets}
        canvasSizeMode={canvasSizeMode}
        customCanvasSize={customCanvasSize}
        onThemeCatalogResolved={handleThemeCatalogResolved}
        onUiThemeResolved={setUiTheme}
        onPackMetadataResolved={setPackMetadata}
      />
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
        onDraftChange={(patch) => {
          setCustomCanvasDraft((current) => ({ ...current, ...patch }));
          setCanvasDialogError(null);
        }}
        onClose={closeCustomCanvasDialog}
        onApply={applyCustomCanvasSize}
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
        operatorLabels={OPERATOR_LABELS}
        onDragStart={handleDragStart}
        onDropReorder={(sourceId, targetId) => {
          setValidationPassed(false);
          setValidatedBucketIds(new Set());
          setBucketDraft((current) => reorderById(current, sourceId, targetId));
          setDragBucketId(null);
        }}
        onDragEnd={() => setDragBucketId(null)}
        onUpdateBucketDraftName={updateBucketDraftName}
        onUpdateBucketSpecial={updateBucketSpecial}
        onUpdateBucketCondition={updateBucketCondition}
        onUpdateBucketCombinator={updateBucketCombinator}
        onDeleteBucket={deleteBucket}
        onAddBucket={addBucket}
        onRestoreDefaultBuckets={restoreDefaultBuckets}
        onRunValidation={runValidation}
        onCancel={closeBucketEditor}
        onApply={applyBucketChanges}
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
        onNavigateNameSuggestion={navigateNameSuggestion}
        onUpdateCustomNameDraft={updateCustomNameDraft}
        onBackToNameChoices={backToNameChoices}
        onApplyCustomName={applyCustomName}
        onAcceptSuggestedName={acceptSuggestedName}
        onKeepCurrentName={keepCurrentName}
        onStartEnterCustomName={startEnterCustomName}
      />
      </div>
    </>
  );
}
