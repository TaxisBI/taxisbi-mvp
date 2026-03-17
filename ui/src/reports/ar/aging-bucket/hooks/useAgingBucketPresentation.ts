import { useMemo } from 'react';
import { formatBucketRule } from '../agingBucketPageUtils';
import { createOperatorLabels, summarizeRules } from '../../../shared/chartPresentation';
import type { BucketOperator } from '../bucketEditorEngine';
import type { AgingBucketDef } from '../types';

export function useAgingBucketPresentation(options: {
  buckets: AgingBucketDef[];
  effectiveOperatorOptions: BucketOperator[];
}) {
  const { buckets, effectiveOperatorOptions } = options;

  const operatorLabels = useMemo(
    () =>
      createOperatorLabels(effectiveOperatorOptions, {
        overrides: {
          '<>': '!=',
        },
      }),
    [effectiveOperatorOptions]
  );

  const appliedBucketSummary = useMemo(() => summarizeRules(buckets, formatBucketRule), [buckets]);

  return {
    operatorLabels,
    appliedBucketSummary,
  };
}
