import ThemeBuilderModal from '../../theme/components/ThemeBuilderModal';
import type { ThemeBuilderContext } from '../../theme/types';
import { useThemeBuilder } from '../../theme/useThemeBuilder';

type ThemeBuilderPageProps = {
  context: ThemeBuilderContext;
  onBack: () => void;
};

export default function ThemeBuilderPage({ context, onBack }: ThemeBuilderPageProps) {
  const builder = useThemeBuilder(context);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 80,
          background: '#ffffff',
          border: '1px solid #d0d7e2',
          borderRadius: 12,
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
        }}
      >
        {builder.isLoadingThemes ? <span style={{ fontSize: 13 }}>Loading themes...</span> : null}
        {builder.loadError ? (
          <span style={{ fontSize: 13, color: '#b91c1c' }}>Failed: {builder.loadError}</span>
        ) : null}
        {!builder.isLoadingThemes && !builder.loadError ? (
          <>
            <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.75 }}>Base Theme</span>
            <select
              value={builder.selectedThemeKey}
              onChange={(event) => {
                builder.selectBaseTheme(event.target.value);
              }}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                background: '#ffffff',
                padding: '6px 10px',
                fontSize: 13,
                minWidth: 220,
              }}
            >
              {builder.themeOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </>
        ) : null}
      </div>

      <ThemeBuilderModal
        uiTheme={builder.uiTheme}
        colorStudioTokens={builder.colorStudioTokens}
        activeColorToken={builder.activeColorToken}
        colorDraftByToken={builder.colorDraftByToken}
        hexDraft={builder.hexDraft}
        rgbDraft={builder.rgbDraft}
        themeSaveDraft={builder.themeSaveDraft}
        colorStudioError={builder.colorStudioError}
        isSavingTheme={builder.isSavingTheme}
        onClose={onBack}
        onSelectToken={builder.setActiveColorToken}
        onClearError={() => builder.setColorStudioError(null)}
        onSetHexDraft={builder.setHexDraft}
        onSetRgbDraft={builder.setRgbDraft}
        onApplyHex={builder.applyHexToActiveToken}
        onApplyRgb={builder.applyRgbToActiveToken}
        onSaveTheme={builder.saveGeneratedTheme}
        onUpdateThemeSaveDraft={(patch) =>
          builder.setThemeSaveDraft((current) => ({
            ...current,
            ...patch,
          }))
        }
        toThemeKeyCandidate={builder.toThemeKeyCandidate}
      />
    </>
  );
}
