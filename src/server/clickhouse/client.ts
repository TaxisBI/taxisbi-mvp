import { createClient } from '@clickhouse/client';

export const clickhouse = createClient({
  url: process.env.CLICKHOUSE_URL ?? 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USER ?? 'taxisbi',
  password: process.env.CLICKHOUSE_PASSWORD ?? 'ajaxiscool',
  database: process.env.CLICKHOUSE_DATABASE ?? 'taxisbi',
});
