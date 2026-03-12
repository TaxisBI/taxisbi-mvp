import { createClient } from '@clickhouse/client';

export const clickhouse = createClient({
  host: 'http://localhost:8123',
  username: 'taxisbi',
  password: 'ajaxiscool',
  database: 'taxisbi',
});
