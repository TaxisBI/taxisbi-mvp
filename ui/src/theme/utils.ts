import { ColorStudioToken, ThemePathSegment, ThemeSaveDraft, ThemeBuilderUiTheme } from './types';

export function normalizeHexColor(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const prefixed = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  const match = prefixed.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!match) {
    return null;
  }

  const value = match[1];
  if (value.length === 3) {
    return (`#${value[0]}${value[0]}${value[1]}${value[1]}${value[2]}${value[2]}`).toLowerCase();
  }

  return (`#${value}`).toLowerCase();
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHexColor(hex) ?? '#000000';
  const value = normalized.slice(1);
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function clampRgb(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function rgbToHex(r: number, g: number, b: number) {
  return `#${clampRgb(r).toString(16).padStart(2, '0')}${clampRgb(g)
    .toString(16)
    .padStart(2, '0')}${clampRgb(b).toString(16).padStart(2, '0')}`;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function toThemeKeyCandidate(input: string) {
  const normalized = input.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
  return normalized.slice(0, 63);
}

function formatThemePath(path: ThemePathSegment[]) {
  return path
    .map((segment, index) => {
      if (typeof segment === 'number') {
        return `[${segment}]`;
      }
      if (index === 0) {
        return segment;
      }
      return `.${segment}`;
    })
    .join('');
}

function formatColorTokenLabel(path: ThemePathSegment[]) {
  if (path.length === 0) {
    return 'Color Token';
  }
  const last = path[path.length - 1];
  if (typeof last === 'number') {
    return `Palette Index ${last + 1}`;
  }
  return last
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^./, (char) => char.toUpperCase());
}

export function collectColorStudioTokens(value: unknown, path: ThemePathSegment[] = []): ColorStudioToken[] {
  if (typeof value === 'string') {
    const normalized = normalizeHexColor(value);
    if (!normalized) {
      return [];
    }

    return [
      {
        path,
        pathText: formatThemePath(path),
        label: formatColorTokenLabel(path),
        value: normalized,
      },
    ];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectColorStudioTokens(entry, [...path, index]));
  }

  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, nested]) =>
      collectColorStudioTokens(nested, [...path, key])
    );
  }

  return [];
}

export function setValueAtPath(
  root: Record<string, unknown>,
  path: ThemePathSegment[],
  nextValue: string
): Record<string, unknown> {
  const draft: Record<string, unknown> = { ...root };
  if (path.length === 0) {
    return draft;
  }

  let cursor: Record<string, unknown> | unknown[] = draft;
  for (let index = 0; index < path.length - 1; index += 1) {
    const segment = path[index];
    const nextSegment = path[index + 1];
    const key = String(segment);
    const currentValue: unknown = Array.isArray(cursor) ? cursor[Number(segment)] : cursor[key];

    let cloned: Record<string, unknown> | unknown[];
    if (Array.isArray(currentValue)) {
      cloned = [...currentValue];
    } else if (isRecord(currentValue)) {
      cloned = { ...currentValue };
    } else {
      cloned = typeof nextSegment === 'number' ? [] : {};
    }

    if (Array.isArray(cursor)) {
      cursor[Number(segment)] = cloned;
    } else {
      cursor[key] = cloned;
    }
    cursor = cloned;
  }

  const last = path[path.length - 1];
  if (Array.isArray(cursor)) {
    cursor[Number(last)] = nextValue;
  } else {
    cursor[String(last)] = nextValue;
  }

  return draft;
}

export function createDefaultThemeSaveDraft(context: {
  domain: string;
  pack: string;
  chart: string;
  dashboard: string;
}): ThemeSaveDraft {
  return {
    label: '',
    key: '',
    scope: 'pack',
    domain: context.domain,
    pack: context.pack,
    chart: context.chart,
    dashboard: context.dashboard,
  };
}

export function resolveThemeBuilderUiTheme(selectedUi: Record<string, unknown>): ThemeBuilderUiTheme {
  return {
    pageBackground: String(selectedUi.pageBackground ?? '#f5f7fb'),
    pageText: String(selectedUi.pageText ?? '#101828'),
    cardBackground: String(selectedUi.cardBackground ?? '#ffffff'),
    cardShadow: String(selectedUi.cardShadow ?? '0 12px 40px rgba(15, 23, 42, 0.15)'),
    buttonBackground: String(selectedUi.buttonBackground ?? '#ffffff'),
    buttonText: String(selectedUi.buttonText ?? '#0f172a'),
    buttonBorder: String(selectedUi.buttonBorder ?? '#cbd5e1'),
    modalOverlayBackground: 'rgba(15, 23, 42, 0.45)',
    statusDanger: String(selectedUi.statusDanger ?? '#dc2626'),
  };
}
