export type BucketOperator = '=' | '<>' | '>=' | '<=' | '>' | '<';
export type BucketCombinator = 'AND' | 'OR';

export type AgingBucketConditionInput = {
  operator: BucketOperator;
  value: number;
};

export type AgingBucketInput = {
  name: string;
  isSpecial: boolean;
  combinator: BucketCombinator;
  conditions: AgingBucketConditionInput[];
};

function isBucketOperator(value: unknown): value is BucketOperator {
  return value === '=' || value === '<>' || value === '>=' || value === '<=' || value === '>' || value === '<';
}

function isBucketCombinator(value: unknown): value is BucketCombinator {
  return value === 'AND' || value === 'OR';
}

function escapeSqlString(value: string) {
  return value.replace(/'/g, "''");
}

export function parseAgingBuckets(input: unknown): AgingBucketInput[] | undefined {
  if (typeof input !== 'string' || !input.trim()) {
    return undefined;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error('Invalid buckets payload. Expected JSON array.');
  }

  return validateAgingBuckets(parsed);
}

export function validateAgingBuckets(input: unknown): AgingBucketInput[] {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error('Buckets must be a non-empty array.');
  }

  if (input.length > 30) {
    throw new Error('Too many buckets. Maximum is 30.');
  }

  return input.map((raw, index) => {
    if (!raw || typeof raw !== 'object') {
      throw new Error(`Bucket ${index + 1} is invalid.`);
    }

    const candidate = raw as Record<string, unknown>;
    const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';
    const isSpecial = candidate.isSpecial === true;
    const combinator = candidate.combinator === undefined ? 'AND' : candidate.combinator;
    const rawConditions = candidate.conditions;

    if (!name) {
      throw new Error(`Bucket ${index + 1} name is required.`);
    }

    if (name.length > 64) {
      throw new Error(`Bucket ${index + 1} name is too long (max 64).`);
    }

    if (!Array.isArray(rawConditions) || rawConditions.length === 0) {
      throw new Error(`Bucket ${index + 1} must include at least one condition.`);
    }

    if (!isBucketCombinator(combinator)) {
      throw new Error(`Bucket ${index + 1} has invalid combinator.`);
    }

    if (!isSpecial && combinator === 'OR') {
      throw new Error(`Bucket ${index + 1} can only use OR when marked as special.`);
    }

    if (rawConditions.length > 2) {
      throw new Error(`Bucket ${index + 1} supports up to two conditions.`);
    }

    const conditions = rawConditions.map((rawCondition, conditionIndex) => {
      if (!rawCondition || typeof rawCondition !== 'object') {
        throw new Error(`Bucket ${index + 1} condition ${conditionIndex + 1} is invalid.`);
      }

      const condition = rawCondition as Record<string, unknown>;
      if (!isBucketOperator(condition.operator)) {
        throw new Error(`Bucket ${index + 1} condition ${conditionIndex + 1} has invalid operator.`);
      }

      const value = Number(condition.value);
      if (!Number.isInteger(value)) {
        throw new Error(`Bucket ${index + 1} condition ${conditionIndex + 1} value must be an integer.`);
      }

      return {
        operator: condition.operator,
        value,
      };
    });

    return {
      name,
      isSpecial,
      combinator,
      conditions,
    };
  });
}

export function buildBucketExpressions(buckets: AgingBucketInput[]) {
  const labelParts: string[] = [];
  const orderParts: string[] = [];
  const dimensionRows: string[] = [];

  buckets.forEach((bucket, index) => {
    const conditionParts = bucket.conditions
      .map((entry) => `days_past_due ${entry.operator} ${entry.value}`)
      .map((entry) => `(${entry})`);
    const joiner = bucket.isSpecial && bucket.combinator === 'OR' ? ' OR ' : ' AND ';
    const condition = conditionParts.join(joiner);
    const label = `'${escapeSqlString(bucket.name)}'`;
    const order = String(index + 1);

    labelParts.push(condition, label);
    orderParts.push(condition, order);
    dimensionRows.push(`tuple(${order}, ${label})`);
  });

  return {
    agingBucketExpr: `multiIf(${labelParts.join(', ')}, 'Unbucketed')`,
    agingBucketOrderExpr: `multiIf(${orderParts.join(', ')}, 9999)`,
    agingBucketDimRows: dimensionRows.join(', '),
  };
}