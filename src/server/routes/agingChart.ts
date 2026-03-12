import fs from 'node:fs/promises';
import path from 'node:path';
import { clickhouse } from '../clickhouse/client';

export async function getAgingChart() {
  const sqlPath = path.resolve(
    process.cwd(),
    'domains/AR/packs/Receivable_item/queries/aging_by_bucket.sql'
  );

  const specPath = path.resolve(
    process.cwd(),
    'domains/AR/packs/Receivable_item/charts/aging_by_bucket.v1.json'
  );

  const sql = await fs.readFile(sqlPath, 'utf8');
  const specText = await fs.readFile(specPath, 'utf8');
  const spec = JSON.parse(specText);

  const resultSet = await clickhouse.query({
    query: sql,
    format: 'JSONEachRow',
  });

  const data = await resultSet.json();

  return {
    spec,
    data,
  };
}
