import { useEffect, useMemo, useRef } from 'react';
import { ColorStudioToken, ThemeSaveDraft, ThemeBuilderUiTheme } from '../types';

type ThemeBuilderModalProps = {
  uiTheme: ThemeBuilderUiTheme;
  colorStudioTokens: ColorStudioToken[];
  activeColorToken: string;
  colorDraftByToken: Record<string, string>;
  hexDraft: string;
  rgbDraft: { r: string; g: string; b: string };
  themeSaveDraft: ThemeSaveDraft;
  colorStudioError: string | null;
  isSavingTheme: boolean;
  onClose: () => void;
  onSelectToken: (tokenPath: string) => void;
  onClearError: () => void;
  onSetHexDraft: (value: string) => void;
  onSetRgbDraft: (draft: { r: string; g: string; b: string }) => void;
  onApplyHex: (value: string) => void;
  onApplyRgb: () => void;
  onSaveTheme: () => void;
  onUpdateThemeSaveDraft: (patch: Partial<ThemeSaveDraft>) => void;
  toThemeKeyCandidate: (input: string) => string;
};

export default function ThemeBuilderModal({
  uiTheme,
  colorStudioTokens,
  activeColorToken,
  colorDraftByToken,
  hexDraft,
  rgbDraft,
  themeSaveDraft,
  colorStudioError,
  isSavingTheme,
  onClose,
  onSelectToken,
  onClearError,
  onSetHexDraft,
  onSetRgbDraft,
  onApplyHex,
  onApplyRgb,
  onSaveTheme,
  onUpdateThemeSaveDraft,
  toThemeKeyCandidate,
}: ThemeBuilderModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const activeColorTokenEntry = useMemo(
    () => colorStudioTokens.find((token) => token.pathText === activeColorToken),
    [activeColorToken, colorStudioTokens]
  );

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const selectedColor = activeColorToken ? colorDraftByToken[activeColorToken] : '#000000';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Theme Builder"
      style={{
        position: 'fixed',
        inset: 0,
        background: uiTheme.modalOverlayBackground,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 65,
      }}
    >
      <style>{`
        .theme-builder-modal {
          width: min(1080px, 96vw);
          max-height: 92vh;
          overflow: auto;
          border-radius: 14px;
          padding: 20px;
          display: grid;
          gap: 14px;
        }

        .theme-builder-layout {
          display: grid;
          grid-template-columns: minmax(220px, 280px) minmax(0, 1fr) minmax(260px, 330px);
          gap: 14px;
          align-items: start;
        }

        .theme-builder-card {
          border: 1px solid;
          border-radius: 10px;
          padding: 12px;
          min-width: 0;
        }

        .theme-builder-token-list {
          display: grid;
          gap: 8px;
          max-height: 58vh;
          overflow: auto;
          padding-right: 2px;
        }

        .theme-builder-editor-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          align-items: end;
        }

        .theme-builder-rgb-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(72px, 1fr)) auto;
          gap: 8px;
          align-items: end;
        }

        @media (max-width: 1140px) {
          .theme-builder-layout {
            grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
          }

          .theme-builder-save-panel {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 880px) {
          .theme-builder-layout {
            grid-template-columns: 1fr;
          }

          .theme-builder-editor-row,
          .theme-builder-rgb-row {
            grid-template-columns: 1fr;
          }

          .theme-builder-token-list {
            max-height: 34vh;
          }
        }
      `}</style>
      <div
        ref={dialogRef}
        className="theme-builder-modal"
        tabIndex={-1}
        style={{
          background: uiTheme.cardBackground,
          color: uiTheme.pageText,
          boxShadow: uiTheme.cardShadow,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>Theme Builder</h2>
            <p style={{ marginTop: 0, marginBottom: 0, fontSize: 13, opacity: 0.85 }}>
              Global theme editing with color wheel, HEX, and RGB controls.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: '1px solid',
              borderColor: uiTheme.buttonBorder,
              borderRadius: 8,
              padding: '8px 12px',
              background: uiTheme.buttonBackground,
              color: uiTheme.buttonText,
              cursor: 'pointer',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            Back
          </button>
        </div>

        <div className="theme-builder-layout">
          <div
            className="theme-builder-card"
            style={{ borderColor: uiTheme.buttonBorder, display: 'grid', gap: 8, alignContent: 'start' }}
          >
            <strong style={{ fontSize: 12, opacity: 0.85 }}>Theme Colors ({colorStudioTokens.length})</strong>
            <div className="theme-builder-token-list">
              {colorStudioTokens.map((token) => {
                const isActive = token.pathText === activeColorToken;
                return (
                  <button
                    key={token.pathText}
                    type="button"
                    onClick={() => {
                      onSelectToken(token.pathText);
                      onClearError();
                    }}
                    style={{
                      border: '1px solid',
                      borderColor: isActive ? uiTheme.buttonText : uiTheme.buttonBorder,
                      background: isActive ? uiTheme.buttonText : uiTheme.buttonBackground,
                      color: isActive ? uiTheme.buttonBackground : uiTheme.buttonText,
                      borderRadius: 8,
                      padding: '8px 10px',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <span style={{ textAlign: 'left' }}>{token.label}</span>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 4,
                        background: colorDraftByToken[token.pathText] ?? token.value,
                        border: '1px solid',
                        borderColor: isActive ? uiTheme.buttonBackground : uiTheme.buttonBorder,
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="theme-builder-card"
            style={{ borderColor: uiTheme.buttonBorder, display: 'grid', gap: 12 }}
          >
            <div style={{ display: 'grid', gap: 6 }}>
              <strong style={{ fontSize: 13 }}>{activeColorTokenEntry?.label ?? 'No color token'}</strong>
              <span style={{ fontSize: 12, opacity: 0.8 }}>{activeColorTokenEntry?.pathText ?? ''}</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr',
                gap: 10,
                alignItems: 'center',
                minWidth: 0,
              }}
            >
              <div
                style={{
                  height: 70,
                  borderRadius: 8,
                  border: '1px solid',
                  borderColor: uiTheme.buttonBorder,
                  background: selectedColor,
                }}
              />
              <div style={{ fontSize: 12, opacity: 0.85, overflowWrap: 'anywhere' }}>
                Current: {selectedColor ?? '-'}
              </div>
            </div>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.85 }}>Color Wheel</span>
              <input
                type="color"
                value={selectedColor}
                onChange={(event) => onApplyHex(event.target.value)}
                style={{
                  width: 96,
                  height: 44,
                  border: '1px solid',
                  borderColor: uiTheme.buttonBorder,
                  borderRadius: 8,
                  background: uiTheme.buttonBackground,
                  cursor: 'pointer',
                }}
              />
            </label>

            <div className="theme-builder-editor-row">
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.85 }}>HEX</span>
                <input
                  value={hexDraft}
                  onChange={(event) => {
                    onSetHexDraft(event.target.value);
                    onClearError();
                  }}
                  aria-label="Hex color"
                  placeholder="#4f46e5"
                  style={{
                    border: '1px solid',
                    borderColor: uiTheme.buttonBorder,
                    borderRadius: 8,
                    padding: '8px 10px',
                    background: uiTheme.buttonBackground,
                    color: uiTheme.buttonText,
                    fontSize: 13,
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => onApplyHex(hexDraft)}
                style={{
                  border: '1px solid',
                  borderColor: uiTheme.buttonBorder,
                  borderRadius: 8,
                  padding: '8px 12px',
                  background: uiTheme.buttonBackground,
                  color: uiTheme.buttonText,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Apply HEX
              </button>
            </div>

            <div className="theme-builder-rgb-row">
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.85 }}>R</span>
                <input
                  value={rgbDraft.r}
                  onChange={(event) => {
                    onSetRgbDraft({ ...rgbDraft, r: event.target.value });
                    onClearError();
                  }}
                  inputMode="numeric"
                  style={{
                    border: '1px solid',
                    borderColor: uiTheme.buttonBorder,
                    borderRadius: 8,
                    padding: '8px 10px',
                    background: uiTheme.buttonBackground,
                    color: uiTheme.buttonText,
                    fontSize: 13,
                  }}
                />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.85 }}>G</span>
                <input
                  value={rgbDraft.g}
                  onChange={(event) => {
                    onSetRgbDraft({ ...rgbDraft, g: event.target.value });
                    onClearError();
                  }}
                  inputMode="numeric"
                  style={{
                    border: '1px solid',
                    borderColor: uiTheme.buttonBorder,
                    borderRadius: 8,
                    padding: '8px 10px',
                    background: uiTheme.buttonBackground,
                    color: uiTheme.buttonText,
                    fontSize: 13,
                  }}
                />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.85 }}>B</span>
                <input
                  value={rgbDraft.b}
                  onChange={(event) => {
                    onSetRgbDraft({ ...rgbDraft, b: event.target.value });
                    onClearError();
                  }}
                  inputMode="numeric"
                  style={{
                    border: '1px solid',
                    borderColor: uiTheme.buttonBorder,
                    borderRadius: 8,
                    padding: '8px 10px',
                    background: uiTheme.buttonBackground,
                    color: uiTheme.buttonText,
                    fontSize: 13,
                  }}
                />
              </label>
              <button
                type="button"
                onClick={onApplyRgb}
                style={{
                  border: '1px solid',
                  borderColor: uiTheme.buttonBorder,
                  borderRadius: 8,
                  padding: '8px 12px',
                  background: uiTheme.buttonBackground,
                  color: uiTheme.buttonText,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Apply RGB
              </button>
            </div>

            {colorStudioError ? (
              <p style={{ margin: 0, color: uiTheme.statusDanger, fontWeight: 700, fontSize: 12 }}>
                {colorStudioError}
              </p>
            ) : null}
          </div>

          <div
            className="theme-builder-card theme-builder-save-panel"
            style={{ borderColor: uiTheme.buttonBorder, display: 'grid', gap: 10, alignContent: 'start' }}
          >
            <strong style={{ fontSize: 12, opacity: 0.85 }}>Save As New Theme</strong>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.85 }}>Theme Name</span>
              <input
                value={themeSaveDraft.label}
                onChange={(event) => {
                  const label = event.target.value;
                  onUpdateThemeSaveDraft({ label, key: toThemeKeyCandidate(label) });
                  onClearError();
                }}
                style={{
                  border: '1px solid',
                  borderColor: uiTheme.buttonBorder,
                  borderRadius: 8,
                  padding: '8px 10px',
                  background: uiTheme.buttonBackground,
                  color: uiTheme.buttonText,
                  fontSize: 13,
                }}
              />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.85 }}>Theme Key (file name)</span>
              <input
                value={themeSaveDraft.key}
                onChange={(event) => {
                  onUpdateThemeSaveDraft({ key: toThemeKeyCandidate(event.target.value) });
                  onClearError();
                }}
                style={{
                  border: '1px solid',
                  borderColor: uiTheme.buttonBorder,
                  borderRadius: 8,
                  padding: '8px 10px',
                  background: uiTheme.buttonBackground,
                  color: uiTheme.buttonText,
                  fontSize: 13,
                }}
              />
            </label>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.85 }}>Theme Level</span>
              <select
                value={themeSaveDraft.scope}
                onChange={(event) =>
                  onUpdateThemeSaveDraft({
                    scope: event.target.value as 'global' | 'domain' | 'pack' | 'dashboard',
                  })
                }
                style={{
                  border: '1px solid',
                  borderColor: uiTheme.buttonBorder,
                  background: uiTheme.buttonBackground,
                  color: uiTheme.buttonText,
                  borderRadius: 8,
                  padding: '8px 10px',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                <option value="global">Global</option>
                <option value="domain">Domain</option>
                <option value="pack">Pack</option>
                <option value="dashboard">Dashboard</option>
              </select>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={onSaveTheme}
                disabled={isSavingTheme || colorStudioTokens.length === 0}
                style={{
                  border: '1px solid',
                  borderColor: uiTheme.buttonText,
                  borderRadius: 8,
                  padding: '8px 12px',
                  background: uiTheme.buttonText,
                  color: uiTheme.buttonBackground,
                  cursor: isSavingTheme ? 'wait' : 'pointer',
                  fontWeight: 600,
                  opacity: isSavingTheme ? 0.75 : 1,
                }}
              >
                {isSavingTheme ? 'Saving Theme...' : 'Save and Apply Theme'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
