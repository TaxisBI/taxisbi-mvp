import ThemeBuilderWorkspace from '../../theme/components/ThemeBuilderWorkspace';
import type { ThemeBuilderContext } from '../../theme/types';
import { useThemeBuilder } from '../../theme/useThemeBuilder';

type ThemeBuilderPageProps = {
  context: ThemeBuilderContext;
  onBackToLanding: () => void;
  onBackToReport: () => void;
  canBackToReport: boolean;
};

export default function ThemeBuilderPage({
  context,
  onBackToLanding,
  onBackToReport,
  canBackToReport,
}: ThemeBuilderPageProps) {
  const builder = useThemeBuilder(context);

  return (
    <div
      style={{
        minHeight: '100vh',
        height: '100vh',
        background: builder.uiTheme.pageBackground,
        color: builder.uiTheme.pageText,
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        gap: 10,
        padding: '10px 12px 12px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1360,
          margin: '0 auto',
          minWidth: 0,
          boxSizing: 'border-box',
          background: builder.uiTheme.cardBackground,
          border: '1px solid',
          borderColor: builder.uiTheme.buttonBorder,
          borderRadius: 12,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap',
          boxShadow: builder.uiTheme.cardShadow,
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
                minWidth: 0,
                width: 'min(280px, 100%)',
                maxWidth: '100%',
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

      <ThemeBuilderWorkspace
        uiTheme={builder.uiTheme}
        editableThemeUi={builder.editableThemeUi}
        colorStudioTokens={builder.colorStudioTokens}
        styleStudioTokens={builder.styleStudioTokens}
        activeColorToken={builder.activeColorToken}
        colorDraftByToken={builder.colorDraftByToken}
        themeSaveDraft={builder.themeSaveDraft}
        colorStudioError={builder.colorStudioError}
        isSavingTheme={builder.isSavingTheme}
        onBackToLanding={onBackToLanding}
        onBackToReport={onBackToReport}
        canBackToReport={canBackToReport}
        onSelectToken={builder.setActiveColorToken}
        onClearError={() => builder.setColorStudioError(null)}
        onApplyHexForToken={builder.applyHexToToken}
        onApplyStyleValueForToken={builder.applyStyleValueToToken}
        onApplyUiSetting={builder.applyUiSetting}
        onClearUiSettings={builder.clearUiSettings}
        onSaveTheme={builder.saveGeneratedTheme}
        onUpdateThemeSaveDraft={(patch) =>
          builder.setThemeSaveDraft((current) => ({
            ...current,
            ...patch,
          }))
        }
        toThemeKeyCandidate={builder.toThemeKeyCandidate}
      />
    </div>
  );
}
