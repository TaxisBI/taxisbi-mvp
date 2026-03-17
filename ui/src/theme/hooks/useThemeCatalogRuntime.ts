import { useEffect, useMemo, useState } from 'react';
import { fetchThemes } from '../api';
import type { ThemeBuilderContext, ThemeDefinition, ThemeOption } from '../types';

function fallbackThemeOrder(key: string) {
  if (key === 'light') {
    return 1;
  }
  if (key === 'dark') {
    return 2;
  }
  if (key === 'ember-dark') {
    return 3;
  }
  return 999;
}

export function useThemeCatalogRuntime(context: ThemeBuilderContext) {
  const [isLoadingThemes, setIsLoadingThemes] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [themeDefinitionsByKey, setThemeDefinitionsByKey] = useState<Record<string, ThemeDefinition>>({});
  const [selectedThemeKey, setSelectedThemeKey] = useState('light');

  const themeOptions = useMemo<ThemeOption[]>(() => {
    return Object.entries(themeDefinitionsByKey)
      .map(([key, value]) => ({
        key,
        label: value.label ?? key,
        scope: value.scope,
        createdBy: value.createdBy,
        displayOrder: value.displayOrder,
      }))
      .sort((left, right) => {
        const leftOrder = left.displayOrder ?? fallbackThemeOrder(left.key);
        const rightOrder = right.displayOrder ?? fallbackThemeOrder(right.key);
        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }
        return left.label.localeCompare(right.label);
      });
  }, [themeDefinitionsByKey]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoadingThemes(true);
      setLoadError(null);
      try {
        const payload = await fetchThemes(context);
        if (cancelled) {
          return;
        }
        setThemeDefinitionsByKey(payload.themes);
        const selected = payload.themes[payload.defaultTheme]
          ? payload.defaultTheme
          : Object.keys(payload.themes)[0] ?? 'light';
        setSelectedThemeKey(selected);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setLoadError(error instanceof Error ? error.message : 'Failed to load themes.');
      } finally {
        if (!cancelled) {
          setIsLoadingThemes(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [context]);

  const selectBaseTheme = (themeKey: string) => {
    if (!themeDefinitionsByKey[themeKey]) {
      return;
    }
    setSelectedThemeKey(themeKey);
  };

  return {
    isLoadingThemes,
    loadError,
    themeDefinitionsByKey,
    setThemeDefinitionsByKey,
    selectedThemeKey,
    setSelectedThemeKey,
    themeOptions,
    selectBaseTheme,
  };
}
