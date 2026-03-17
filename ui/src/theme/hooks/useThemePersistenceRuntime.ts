import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { saveTheme } from '../api';
import { isRecord, toThemeKeyCandidate } from '../utils';
import type { ThemeDefinition, ThemeSaveDraft } from '../types';

export function useThemePersistenceRuntime(options: {
  editableThemeUi: Record<string, unknown> | null;
  themeSaveDraft: ThemeSaveDraft;
  selectedThemeKey: string;
  themeDefinitionsByKey: Record<string, ThemeDefinition>;
  setThemeDefinitionsByKey: Dispatch<SetStateAction<Record<string, ThemeDefinition>>>;
  setSelectedThemeKey: Dispatch<SetStateAction<string>>;
  setColorStudioError: Dispatch<SetStateAction<string | null>>;
}) {
  const {
    editableThemeUi,
    themeSaveDraft,
    selectedThemeKey,
    themeDefinitionsByKey,
    setThemeDefinitionsByKey,
    setSelectedThemeKey,
    setColorStudioError,
  } = options;

  const [isSavingTheme, setIsSavingTheme] = useState(false);

  const saveGeneratedTheme = async () => {
    if (!editableThemeUi) {
      setColorStudioError('No editable theme data was found.');
      return;
    }

    const label = themeSaveDraft.label.trim();
    const key = toThemeKeyCandidate(themeSaveDraft.key || themeSaveDraft.label);
    if (!label) {
      setColorStudioError('Theme name is required.');
      return;
    }
    if (!key || !/^[a-z0-9][a-z0-9-_]{1,62}$/.test(key)) {
      setColorStudioError('Theme key must be 2-63 chars, lowercase letters/numbers, dash or underscore.');
      return;
    }

    const baseTheme = themeDefinitionsByKey[selectedThemeKey];
    const spec = isRecord(baseTheme?.spec) ? baseTheme.spec : {};

    setIsSavingTheme(true);
    setColorStudioError(null);

    try {
      const created = await saveTheme({
        key,
        label,
        scope: themeSaveDraft.scope,
        extends: selectedThemeKey,
        createdBy: 'Theme Builder',
        ui: editableThemeUi,
        spec,
        context: {
          domain: themeSaveDraft.domain,
          pack: themeSaveDraft.pack,
          chart: themeSaveDraft.chart,
          dashboard: themeSaveDraft.dashboard,
        },
      });

      if (created) {
        setThemeDefinitionsByKey((current) => ({ ...current, [key]: { ...created, key } }));
      }
      setSelectedThemeKey(key);
      setColorStudioError('Theme saved and selected.');
    } catch (error) {
      setColorStudioError(error instanceof Error ? error.message : 'Failed to save theme file.');
    } finally {
      setIsSavingTheme(false);
    }
  };

  return {
    isSavingTheme,
    saveGeneratedTheme,
  };
}
