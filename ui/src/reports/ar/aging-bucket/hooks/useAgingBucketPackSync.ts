import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { AgingBucketDef, CanvasSizeMode } from '../types';
import { toDraft, type BucketCombinator, type BucketDraft, type BucketOperator } from '../bucketEditorEngine';

export function useAgingBucketPackSync(options: {
  metadataDefaultBuckets: AgingBucketDef[] | null;
  canvasSizeOptions: Array<{ value: CanvasSizeMode }>;
  canvasSizeMode: CanvasSizeMode;
  setCanvasSizeMode: Dispatch<SetStateAction<CanvasSizeMode>>;
  hasStoredBuckets: boolean;
  setDefaultBucketIds: (ids: string[]) => void;
  setBuckets: Dispatch<SetStateAction<AgingBucketDef[]>>;
  setBucketDraft: Dispatch<SetStateAction<BucketDraft[]>>;
  allowedOperatorSet: Set<BucketOperator>;
  allowedCombinatorSet: Set<BucketCombinator>;
  effectiveCombinatorOptions: BucketCombinator[];
}) {
  const {
    metadataDefaultBuckets,
    canvasSizeOptions,
    canvasSizeMode,
    setCanvasSizeMode,
    hasStoredBuckets,
    setDefaultBucketIds,
    setBuckets,
    setBucketDraft,
    allowedOperatorSet,
    allowedCombinatorSet,
    effectiveCombinatorOptions,
  } = options;

  useEffect(() => {
    if (!metadataDefaultBuckets) {
      return;
    }

    setDefaultBucketIds(metadataDefaultBuckets.map((bucket) => bucket.id));
  }, [metadataDefaultBuckets, setDefaultBucketIds]);

  useEffect(() => {
    if (!metadataDefaultBuckets || hasStoredBuckets) {
      return;
    }

    setBuckets(metadataDefaultBuckets);
    setBucketDraft(metadataDefaultBuckets.map(toDraft));
  }, [hasStoredBuckets, metadataDefaultBuckets, setBucketDraft, setBuckets]);

  useEffect(() => {
    if (canvasSizeOptions.length === 0) {
      return;
    }

    if (canvasSizeOptions.some((entry) => entry.value === canvasSizeMode)) {
      return;
    }

    setCanvasSizeMode(canvasSizeOptions[0].value);
  }, [canvasSizeMode, canvasSizeOptions, setCanvasSizeMode]);

  useEffect(() => {
    const fallbackOperator =
      (Array.from(allowedOperatorSet)[0] as BucketOperator | undefined) ??
      ('>=' as BucketOperator);
    const normalizeCombinator = (value: BucketCombinator) =>
      allowedCombinatorSet.has(value) ? value : effectiveCombinatorOptions[0] ?? 'AND';
    const normalizeOperator = (value: BucketOperator) =>
      allowedOperatorSet.has(value) ? value : fallbackOperator;

    const sanitizeBuckets = (input: AgingBucketDef[]) =>
      input.map((bucket) => ({
        ...bucket,
        combinator: normalizeCombinator(bucket.combinator),
        conditions: bucket.conditions
          .slice(0, 2)
          .map((condition) => ({
            ...condition,
            operator: normalizeOperator(condition.operator),
          })),
      }));

    setBuckets((current) => {
      const sanitized = sanitizeBuckets(current);
      if (sanitized.length === 0) {
        return current;
      }

      return JSON.stringify(sanitized) === JSON.stringify(current) ? current : sanitized;
    });

    setBucketDraft((current) => {
      const sanitizedDraft = current.map((bucket) => ({
        ...bucket,
        combinator: allowedCombinatorSet.has(bucket.combinator)
          ? bucket.combinator
          : effectiveCombinatorOptions[0] ?? 'AND',
        primary: {
          ...bucket.primary,
          operator: normalizeOperator(bucket.primary.operator),
        },
        secondary: {
          ...bucket.secondary,
          operator: normalizeOperator(bucket.secondary.operator),
        },
      }));

      return JSON.stringify(sanitizedDraft) === JSON.stringify(current) ? current : sanitizedDraft;
    });
  }, [
    allowedCombinatorSet,
    allowedOperatorSet,
    effectiveCombinatorOptions,
    setBucketDraft,
    setBuckets,
  ]);
}
