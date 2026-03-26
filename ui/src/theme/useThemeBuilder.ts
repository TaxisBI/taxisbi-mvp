import { useEffect } from 'react';
import { toThemeKeyCandidate } from './utils';
import type { ThemeBuilderContext } from './types';
import { useThemeCatalogRuntime } from './hooks/useThemeCatalogRuntime';
import { useThemeEditingRuntime } from './hooks/useThemeEditingRuntime';
import { useThemePersistenceRuntime } from './hooks/useThemePersistenceRuntime';

export function useThemeBuilder(context: ThemeBuilderContext) {
  const catalog = useThemeCatalogRuntime(context);
  const editing = useThemeEditingRuntime({
    context,
    themeDefinitionsByKey: catalog.themeDefinitionsByKey,
    selectedThemeKey: catalog.selectedThemeKey,
  });
  const persistence = useThemePersistenceRuntime({
    editableThemeUi: editing.editableThemeUi,
    themeSaveDraft: editing.themeSaveDraft,
    selectedThemeKey: catalog.selectedThemeKey,
    themeDefinitionsByKey: catalog.themeDefinitionsByKey,
    setThemeDefinitionsByKey: catalog.setThemeDefinitionsByKey,
    setSelectedThemeKey: catalog.setSelectedThemeKey,
    setColorStudioError: editing.setColorStudioError,
  });

  useEffect(() => {
    if (!catalog.selectedThemeKey || Object.keys(catalog.themeDefinitionsByKey).length === 0) {
      return;
    }
    editing.hydrateFromTheme(catalog.selectedThemeKey, catalog.themeDefinitionsByKey);
  }, [catalog.selectedThemeKey, catalog.themeDefinitionsByKey, editing.hydrateFromTheme]);

  return {
    isLoadingThemes: catalog.isLoadingThemes,
    loadError: catalog.loadError,
    themeOptions: catalog.themeOptions,
    selectedThemeKey: catalog.selectedThemeKey,
    selectBaseTheme: catalog.selectBaseTheme,
    uiTheme: editing.uiTheme,
    editableThemeUi: editing.editableThemeUi,
    colorStudioTokens: editing.colorStudioTokens,
    styleStudioTokens: editing.styleStudioTokens,
    activeColorToken: editing.activeColorToken,
    colorDraftByToken: editing.colorDraftByToken,
    hexDraft: editing.hexDraft,
    rgbDraft: editing.rgbDraft,
    themeSaveDraft: editing.themeSaveDraft,
    colorStudioError: editing.colorStudioError,
    isSavingTheme: persistence.isSavingTheme,
    setActiveColorToken: editing.setActiveColorToken,
    setHexDraft: editing.setHexDraft,
    setRgbDraft: editing.setRgbDraft,
    setThemeSaveDraft: editing.setThemeSaveDraft,
    setColorStudioError: editing.setColorStudioError,
    applyHexToActiveToken: editing.applyHexToActiveToken,
    applyHexToToken: editing.applyHexToToken,
    applyRgbToActiveToken: editing.applyRgbToActiveToken,
    applyStyleValueToToken: editing.applyStyleValueToToken,
    applyUiSetting: editing.applyUiSetting,
    clearUiSettings: editing.clearUiSettings,
    saveGeneratedTheme: persistence.saveGeneratedTheme,
    toThemeKeyCandidate,
  };
}

export type ThemeBuilderController = ReturnType<typeof useThemeBuilder>;
