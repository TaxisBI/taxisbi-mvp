import fs from 'node:fs/promises';
import path from 'node:path';
import { clickhouse } from '../clickhouse/client';

async function loadBuiltInThemes(themeDirPath: string) {
  const themes: Record<string, any> = {};

  try {
    const entries = await fs.readdir(themeDirPath, { withFileTypes: true });
    const themeFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.json'));

    for (const file of themeFiles) {
      const themeText = await fs.readFile(path.join(themeDirPath, file.name), 'utf8');
      const theme = JSON.parse(themeText);
      const fallbackKey = file.name.split('.')[0];
      const themeKey = typeof theme.key === 'string' && theme.key.trim() ? theme.key : fallbackKey;
      themes[themeKey] = theme;
    }
  } catch {
    // Theme directory is optional for now; route still works without custom themes.
  }

  return themes;
}

export async function getAgingChart() {
  const sqlPath = path.resolve(
    process.cwd(),
    'domains/AR/packs/Receivable_item/queries/aging_by_bucket.sql'
  );

  const specPath = path.resolve(
    process.cwd(),
    'domains/AR/packs/Receivable_item/charts/aging_by_bucket.v1.json'
  );
  const themeDirPath = path.resolve(
    process.cwd(),
    'domains/AR/packs/Receivable_item/themes'
  );

  const sql = await fs.readFile(sqlPath, 'utf8');
  const specText = await fs.readFile(specPath, 'utf8');
  const spec = JSON.parse(specText);
  const themes = await loadBuiltInThemes(themeDirPath);
  const defaultTheme = themes.light ? 'light' : Object.keys(themes)[0] ?? 'light';

  const resultSet = await clickhouse.query({
    query: sql,
    format: 'JSONEachRow',
  });

  const data = await resultSet.json();

  return {
    spec,
    data,
    themes,
    defaultTheme,
  };
}
