import fs from 'node:fs/promises';
import path from 'node:path';
import { clickhouse } from '../clickhouse/client';

type ThemeDef = {
  key: string;
  label: string;
  extends?: string;
  scope?: 'global' | 'domain' | 'pack' | 'dashboard';
  appliesTo?: {
    domain?: string[];
    pack?: string[];
    chart?: string[];
    dashboard?: string[];
  };
  ui: Record<string, unknown>;
  spec: Record<string, unknown>;
};

type ThemeContext = {
  domain: string;
  pack: string;
  chart: string;
  dashboard?: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<T>(base: T, override: unknown): T {
  if (override === undefined) {
    return base;
  }

  if (Array.isArray(base) && Array.isArray(override)) {
    const maxLength = Math.max(base.length, override.length);
    const merged = Array.from({ length: maxLength }, (_, index) => {
      if (index in override) {
        return deepMerge((base as unknown[])[index], override[index]);
      }
      return (base as unknown[])[index];
    });
    return merged as T;
  }

  if (isObject(base) && isObject(override)) {
    const result: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(override)) {
      result[key] = key in result ? deepMerge(result[key], value) : value;
    }
    return result as T;
  }

  return override as T;
}

async function collectJsonFilesRecursively(dirPath: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await collectJsonFilesRecursively(fullPath)));
      } else if (
        entry.isFile() &&
        entry.name.endsWith('.json') &&
        !entry.name.includes('.schema.')
      ) {
        files.push(fullPath);
      }
    }
  } catch {
    // Optional theme folder.
  }

  return files;
}

function matchesApplyList(list: string[] | undefined, value: string | undefined) {
  if (!list || list.length === 0) {
    return true;
  }
  if (!value) {
    return false;
  }
  return list.includes(value);
}

function themeAppliesToContext(theme: ThemeDef, context: ThemeContext) {
  const appliesTo = theme.appliesTo;
  if (!appliesTo) {
    return true;
  }

  return (
    matchesApplyList(appliesTo.domain, context.domain) &&
    matchesApplyList(appliesTo.pack, context.pack) &&
    matchesApplyList(appliesTo.chart, context.chart) &&
    matchesApplyList(appliesTo.dashboard, context.dashboard)
  );
}

function resolveTheme(
  themeKey: string,
  themeMap: Record<string, ThemeDef>,
  resolving: Set<string>
): ThemeDef | null {
  const theme = themeMap[themeKey];
  if (!theme) {
    return null;
  }

  if (!theme.extends) {
    return theme;
  }

  if (resolving.has(themeKey)) {
    return null;
  }

  resolving.add(themeKey);
  const parent = resolveTheme(theme.extends, themeMap, resolving);
  resolving.delete(themeKey);

  if (!parent) {
    return theme;
  }

  return {
    ...theme,
    ui: deepMerge(parent.ui, theme.ui),
    spec: deepMerge(parent.spec, theme.spec),
  };
}

async function loadBuiltInThemes(themeRootPath: string, context: ThemeContext) {
  const allThemeFiles = await collectJsonFilesRecursively(themeRootPath);
  const rawThemeMap: Record<string, ThemeDef> = {};

  for (const themeFilePath of allThemeFiles) {
    const themeText = await fs.readFile(themeFilePath, 'utf8');
    const parsed = JSON.parse(themeText) as Partial<ThemeDef>;

    if (
      typeof parsed.key !== 'string' ||
      !parsed.key.trim() ||
      typeof parsed.label !== 'string' ||
      !isObject(parsed.ui) ||
      !isObject(parsed.spec)
    ) {
      continue;
    }

    rawThemeMap[parsed.key.trim()] = {
      key: parsed.key.trim(),
      label: parsed.label,
      extends: parsed.extends,
      scope: parsed.scope,
      appliesTo: parsed.appliesTo,
      ui: parsed.ui,
      spec: parsed.spec,
    };
  }

  const resolved: Record<string, ThemeDef> = {};
  for (const key of Object.keys(rawThemeMap)) {
    const hydrated = resolveTheme(key, rawThemeMap, new Set<string>());
    if (hydrated && themeAppliesToContext(hydrated, context)) {
      resolved[key] = hydrated;
    }
  }

  return resolved;
}

export async function getAgingChart() {
  const themeContext: ThemeContext = {
    domain: 'AR',
    pack: 'Receivable_item',
    chart: 'aging_by_bucket',
  };

  const sqlPath = path.resolve(
    process.cwd(),
    'domains/AR/packs/Receivable_item/queries/aging_by_bucket.sql'
  );

  const specPath = path.resolve(
    process.cwd(),
    'domains/AR/packs/Receivable_item/charts/aging_by_bucket.v1.json'
  );
  const themeRootPath = path.resolve(process.cwd(), 'themes');

  const sql = await fs.readFile(sqlPath, 'utf8');
  const specText = await fs.readFile(specPath, 'utf8');
  const spec = JSON.parse(specText);
  const themes = await loadBuiltInThemes(themeRootPath, themeContext);
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
