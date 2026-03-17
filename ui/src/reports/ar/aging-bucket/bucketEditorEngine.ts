import type { AgingBucketDef } from './components/ARAgingBucketChart';

export type BucketOperator = '=' | '<>' | '>=' | '<=' | '>' | '<';
export type BucketCombinator = 'AND' | 'OR';

export type BucketConditionDraft = {
  operator: BucketOperator;
  value: string;
  enabled: boolean;
};

export type BucketDraft = {
  id: string;
  name: string;
  isSpecial: boolean;
  combinator: BucketCombinator;
  isNew: boolean;
  pendingSuggestedName: string | null;
  primary: BucketConditionDraft;
  secondary: BucketConditionDraft;
};

export type ValidationSuggestionItem = {
  bucketId: string;
  suggestedName: string;
};

export type OverlapColorToken = {
  border: string;
  background: string;
};

export type OverlapMetadata = {
  overlapIds: Set<string>;
  colorByBucketId: Map<string, OverlapColorToken>;
};

export function isBucketOperator(value: unknown): value is BucketOperator {
  return value === '=' || value === '<>' || value === '>=' || value === '<=' || value === '>' || value === '<';
}

export function isBucketCombinator(value: unknown): value is BucketCombinator {
  return value === 'AND' || value === 'OR';
}

export function parseInteger(value: string): number | null {
  const trimmed = value.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isInteger(parsed) ? parsed : null;
}

function formatAutoBucketName(
  primary: { operator: BucketOperator; value: number },
  secondary?: { operator: BucketOperator; value: number }
) {
  if (!secondary) {
    if (primary.operator === '>' || primary.operator === '>=') {
      return `${primary.value}+`;
    }
    return String(primary.value);
  }

  return `${primary.value}-${secondary.value}`;
}

export function buildConditionName(
  primary: { operator: BucketOperator; value: number },
  secondary?: { operator: BucketOperator; value: number },
  combinator: BucketCombinator = 'AND'
) {
  const autoBoundsName = formatAutoBucketName(primary, secondary);
  if (!secondary) {
    return autoBoundsName;
  }

  if (combinator === 'OR') {
    return autoBoundsName;
  }

  return autoBoundsName;
}

function isCondition(
  entry: { operator: BucketOperator; value: number } | undefined,
  operator: BucketOperator,
  value: number
) {
  return Boolean(entry && entry.operator === operator && entry.value === value);
}

export function normalizeLegacyDefaultBucket(bucket: AgingBucketDef): AgingBucketDef {
  const [first, second] = bucket.conditions;
  const normalizedName = bucket.name.trim().toLowerCase();

  if (
    normalizedName === 'current' &&
    (isCondition(first, '<=', 0) ||
      (isCondition(first, '>=', -36500) && isCondition(second, '<=', 0)) ||
      (isCondition(first, '<=', 0) && isCondition(second, '>=', -36500)))
  ) {
    return {
      ...bucket,
      isSpecial: false,
      combinator: 'AND',
      conditions: [{ operator: '<=', value: 0 }],
    };
  }

  if (
    normalizedName === '91+' &&
    (isCondition(first, '>', 90) ||
      isCondition(first, '>=', 91) ||
      (isCondition(first, '>=', 91) && isCondition(second, '<=', 36500)) ||
      (isCondition(first, '<=', 36500) && isCondition(second, '>=', 91)))
  ) {
    return {
      ...bucket,
      isSpecial: false,
      combinator: 'AND',
      conditions: [{ operator: '>', value: 90 }],
    };
  }

  return bucket;
}

export function reorderById<T extends { id: string }>(items: T[], sourceId: string, targetId: string): T[] {
  if (sourceId === targetId) {
    return items;
  }

  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  const targetIndex = items.findIndex((item) => item.id === targetId);

  if (sourceIndex < 0 || targetIndex < 0) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

export function toDraft(bucket: AgingBucketDef): BucketDraft {
  const [first, second] = bucket.conditions;
  return {
    id: bucket.id,
    name: bucket.name,
    isSpecial: bucket.isSpecial ?? false,
    combinator: bucket.combinator ?? 'AND',
    isNew: false,
    pendingSuggestedName: null,
    primary: {
      operator: first?.operator ?? '>=',
      value: first ? String(first.value) : '',
      enabled: true,
    },
    secondary: {
      operator: second?.operator ?? '<=',
      value: second ? String(second.value) : '',
      enabled: Boolean(second),
    },
  };
}

function conditionMatches(days: number, condition: { operator: BucketOperator; value: number }) {
  if (condition.operator === '=') {
    return days === condition.value;
  }
  if (condition.operator === '<>') {
    return days !== condition.value;
  }
  if (condition.operator === '>=') {
    return days >= condition.value;
  }
  if (condition.operator === '<=') {
    return days <= condition.value;
  }
  if (condition.operator === '>') {
    return days > condition.value;
  }
  return days < condition.value;
}

function bucketMatches(days: number, bucket: AgingBucketDef) {
  if (bucket.conditions.length <= 1) {
    return bucket.conditions.every((condition) => conditionMatches(days, condition));
  }

  const combinator = bucket.isSpecial ? bucket.combinator ?? 'AND' : 'AND';
  if (combinator === 'OR') {
    return bucket.conditions.some((condition) => conditionMatches(days, condition));
  }

  return bucket.conditions.every((condition) => conditionMatches(days, condition));
}

export function detectOverlaps(
  buckets: AgingBucketDef[],
  colorPalette: OverlapColorToken[]
): OverlapMetadata {
  const overlapIds = new Set<string>();
  const adjacency = new Map<string, Set<string>>();
  const colorByBucketId = new Map<string, OverlapColorToken>();

  const points = new Set<number>([-36500, -365, -90, -1, 0, 1, 30, 31, 60, 61, 90, 91, 365, 36500]);
  buckets.forEach((bucket) => {
    bucket.conditions.forEach((condition) => {
      points.add(condition.value);
      points.add(condition.value - 1);
      points.add(condition.value + 1);
    });
  });

  const samplePoints = Array.from(points);

  for (let i = 0; i < buckets.length; i += 1) {
    for (let j = i + 1; j < buckets.length; j += 1) {
      const left = buckets[i];
      const right = buckets[j];
      const hasOverlap = samplePoints.some(
        (point) => bucketMatches(point, left) && bucketMatches(point, right)
      );
      if (hasOverlap) {
        overlapIds.add(left.id);
        overlapIds.add(right.id);
        if (!adjacency.has(left.id)) {
          adjacency.set(left.id, new Set());
        }
        if (!adjacency.has(right.id)) {
          adjacency.set(right.id, new Set());
        }
        adjacency.get(left.id)!.add(right.id);
        adjacency.get(right.id)!.add(left.id);
      }
    }
  }

  const visited = new Set<string>();
  const nodes = Array.from(adjacency.keys());

  nodes.forEach((startId, groupIndex) => {
    if (visited.has(startId)) {
      return;
    }

    const stack = [startId];
    const token = colorPalette[groupIndex % colorPalette.length];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);
      colorByBucketId.set(current, token);

      const neighbors = adjacency.get(current);
      if (!neighbors) {
        continue;
      }
      neighbors.forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      });
    }
  });

  return {
    overlapIds,
    colorByBucketId,
  };
}

export function parseDraftBuckets(
  draft: BucketDraft[],
  options: {
    allowedOperatorSet: Set<BucketOperator>;
    allowedCombinatorSet: Set<BucketCombinator>;
    effectiveCombinatorOptions: BucketCombinator[];
    isDefaultBucketId: (id: string) => boolean;
  }
): AgingBucketDef[] {
  const { allowedOperatorSet, allowedCombinatorSet, effectiveCombinatorOptions, isDefaultBucketId } = options;

  const parsedBuckets = draft.map((bucket, index) => {
    const name = bucket.name.trim();
    const primaryValue = parseInteger(bucket.primary.value);
    const secondaryValue = parseInteger(bucket.secondary.value);

    if (!name) {
      throw new Error(`Bucket ${index + 1} name is required.`);
    }

    if (primaryValue === null) {
      throw new Error(`Bucket ${index + 1} primary condition value is required.`);
    }

    if (!allowedOperatorSet.has(bucket.primary.operator)) {
      throw new Error(`Bucket ${index + 1} primary operator is not allowed by this pack.`);
    }

    const conditions: Array<{ operator: BucketOperator; value: number }> = [
      {
        operator: bucket.primary.operator,
        value: primaryValue,
      },
    ];

    if (bucket.secondary.enabled) {
      if (secondaryValue === null) {
        throw new Error(`Bucket ${index + 1} secondary condition value is required.`);
      }

      if (!allowedOperatorSet.has(bucket.secondary.operator)) {
        throw new Error(`Bucket ${index + 1} secondary operator is not allowed by this pack.`);
      }

      conditions.push({
        operator: bucket.secondary.operator,
        value: secondaryValue,
      });
    }

    return {
      id: bucket.id,
      name,
      isSpecial: isDefaultBucketId(bucket.id) ? false : bucket.isSpecial,
      combinator:
        !isDefaultBucketId(bucket.id) && bucket.isSpecial
          ? allowedCombinatorSet.has(bucket.combinator)
            ? bucket.combinator
            : effectiveCombinatorOptions[0] ?? 'AND'
          : 'AND',
      conditions,
    } satisfies AgingBucketDef;
  });

  if (parsedBuckets.length === 0) {
    throw new Error('At least one bucket is required.');
  }

  return parsedBuckets;
}

function toConditionSignature(bucket: AgingBucketDef) {
  return JSON.stringify(
    bucket.conditions.map((condition) => ({
      operator: condition.operator,
      value: condition.value,
    }))
  );
}

export function buildValidationSuggestions(
  parsedDraftBuckets: AgingBucketDef[],
  editorBaselineBuckets: AgingBucketDef[]
): ValidationSuggestionItem[] {
  const baselineById = new Map(editorBaselineBuckets.map((bucket) => [bucket.id, bucket]));
  const suggestions: ValidationSuggestionItem[] = [];

  for (const bucket of parsedDraftBuckets) {
    const baseline = baselineById.get(bucket.id);
    const changedBounds = !baseline || toConditionSignature(baseline) !== toConditionSignature(bucket);
    if (!changedBounds) {
      continue;
    }

    const first = bucket.conditions[0];
    if (!first) {
      continue;
    }
    const second = bucket.conditions[1];
    const suggestedName = buildConditionName(first, second, bucket.combinator);
    if (!suggestedName || suggestedName === bucket.name) {
      continue;
    }

    suggestions.push({
      bucketId: bucket.id,
      suggestedName,
    });
  }

  return suggestions;
}
