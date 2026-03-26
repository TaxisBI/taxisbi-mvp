export function createOperatorLabels<T extends string>(
  operators: readonly T[],
  options?: {
    overrides?: Partial<Record<T, string>>;
    fallback?: (operator: T) => string;
  }
): Record<T, string> {
  const overrides = (options?.overrides ?? {}) as Partial<Record<T, string>>;
  const fallback = options?.fallback ?? ((operator: T) => operator);

  return operators.reduce(
    (result, operator) => {
      result[operator] = overrides[operator] ?? fallback(operator);
      return result;
    },
    {} as Record<T, string>
  );
}

export function summarizeRules<T>(
  items: readonly T[],
  formatter: (item: T) => string,
  separator = ' | '
) {
  return items.map(formatter).join(separator);
}
