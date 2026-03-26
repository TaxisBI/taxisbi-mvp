import { ThemeBuilderContext, ThemeDefinition } from './types';

export async function fetchThemes(context: ThemeBuilderContext): Promise<{
  themes: Record<string, ThemeDefinition>;
  defaultTheme: string;
}> {
  const params = new URLSearchParams({
    domain: context.domain,
    rulebook: context.rulebook,
    chart: context.chart,
    dashboard: context.dashboard,
  });

  const response = await fetch(`/api/themes?${params.toString()}`);
  const payload = (await response.json()) as {
    themes?: Record<string, ThemeDefinition>;
    defaultTheme?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? 'Failed to load themes.');
  }

  return {
    themes: payload.themes ?? {},
    defaultTheme: payload.defaultTheme ?? 'light',
  };
}

export async function saveTheme(payload: {
  key: string;
  label: string;
  scope: 'global' | 'domain' | 'rulebook' | 'dashboard';
  extends: string;
  createdBy: string;
  ui: Record<string, unknown>;
  spec: Record<string, unknown>;
  context: ThemeBuilderContext;
}) {
  const response = await fetch('/api/themes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json()) as {
    theme?: ThemeDefinition;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(body.error ?? 'Failed to save theme file.');
  }

  return body.theme;
}

