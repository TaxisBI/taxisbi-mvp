import { useCallback } from 'react';
import { useThemeBuilder } from '../../../theme/useThemeBuilder';
import type { ThemeBuilderContext, ThemeSaveDraft } from '../../../theme/types';

export function useThemeBuilderPageOrchestration(context: ThemeBuilderContext) {
  const builder = useThemeBuilder(context);

  const handleClearError = useCallback(() => {
    builder.setColorStudioError(null);
  }, [builder]);

  const handleUpdateThemeSaveDraft = useCallback(
    (patch: Partial<ThemeSaveDraft>) => {
      builder.setThemeSaveDraft((current) => ({
        ...current,
        ...patch,
      }));
    },
    [builder]
  );

  return {
    builder,
    handleClearError,
    handleUpdateThemeSaveDraft,
  };
}
