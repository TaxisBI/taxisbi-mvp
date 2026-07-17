function parsePositiveIntEnv(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export const CLICKHOUSE_QUERY_GUARDS = {
  maxExecutionTimeSeconds: parsePositiveIntEnv(process.env.CLICKHOUSE_MAX_EXECUTION_TIME_SECONDS, 20),
  maxResultRows: parsePositiveIntEnv(process.env.CLICKHOUSE_MAX_RESULT_ROWS, 100000),
} as const;

export function getClickHouseQuerySettings() {
  return {
    max_execution_time: CLICKHOUSE_QUERY_GUARDS.maxExecutionTimeSeconds,
    timeout_overflow_mode: 'throw',
    max_result_rows: CLICKHOUSE_QUERY_GUARDS.maxResultRows,
    result_overflow_mode: 'throw',
  };
}