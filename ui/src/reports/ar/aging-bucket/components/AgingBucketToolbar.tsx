import { CalendarRegular, SettingsRegular } from '@fluentui/react-icons';
import type { RefObject } from 'react';
import type { CanvasSizeMode, ResolvedUiTheme, ThemeOption } from '../types';

type CanvasSizeOption = { value: CanvasSizeMode; label: string; displayOrder: number };

type AgingBucketToolbarProps = {
  uiTheme: ResolvedUiTheme;
  isThemePopoverOpen: boolean;
  themeButtonRef: RefObject<HTMLButtonElement | null>;
  themePopoverRef: RefObject<HTMLDivElement | null>;
  theme: string;
  themeOptions: ThemeOption[];
  formatThemeOptionLabel: (option: ThemeOption) => string;
  canvasSizeMode: CanvasSizeMode;
  canvasSizeOptions: CanvasSizeOption[];
  onToggleThemePopover: () => void;
  onSelectTheme: (themeKey: string) => void;
  onCanvasSizeModeChange: (mode: CanvasSizeMode) => void;
  onOpenThemeBuilder: () => void;
  showReportDateControl: boolean;
  showBucketCustomizerControl: boolean;
  reportDateDraft: string;
  reportDate: string;
  reportDatePlaceholder: string;
  reportDatePickerRef: RefObject<HTMLInputElement | null>;
  onReportDateDraftChange: (value: string) => void;
  onReportDateDraftBlur: () => void;
  onReportDatePickerChange: (value: string) => void;
  onOpenReportDatePicker: () => void;
  onOpenBucketEditor: () => void;
};

export default function AgingBucketToolbar({
  uiTheme,
  isThemePopoverOpen,
  themeButtonRef,
  themePopoverRef,
  theme,
  themeOptions,
  formatThemeOptionLabel,
  canvasSizeMode,
  canvasSizeOptions,
  onToggleThemePopover,
  onSelectTheme,
  onCanvasSizeModeChange,
  onOpenThemeBuilder,
  showReportDateControl,
  showBucketCustomizerControl,
  reportDateDraft,
  reportDate,
  reportDatePlaceholder,
  reportDatePickerRef,
  onReportDateDraftChange,
  onReportDateDraftBlur,
  onReportDatePickerChange,
  onOpenReportDatePicker,
  onOpenBucketEditor,
}: AgingBucketToolbarProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, marginBottom: 12 }}>
      <div style={{ position: 'relative' }}>
        <button
          ref={themeButtonRef}
          type="button"
          onClick={onToggleThemePopover}
          aria-label="Open theme settings"
          aria-haspopup="dialog"
          aria-expanded={isThemePopoverOpen}
          title="Settings"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid',
            borderColor: uiTheme.buttonBorder,
            background: uiTheme.buttonBackground,
            color: uiTheme.buttonText,
            borderRadius: 8,
            width: 34,
            height: 34,
            cursor: 'pointer',
          }}
        >
          <SettingsRegular fontSize={16} />
        </button>
        {isThemePopoverOpen ? (
          <div
            ref={themePopoverRef}
            role="dialog"
            aria-label="Settings"
            style={{
              position: 'absolute',
              top: 40,
              left: 0,
              zIndex: 20,
              minWidth: 280,
              border: '1px solid',
              borderColor: uiTheme.buttonBorder,
              borderRadius: 10,
              background: uiTheme.cardBackground,
              boxShadow: uiTheme.cardShadow,
              padding: 12,
            }}
          >
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, opacity: 0.85 }}>Settings</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.7 }}>
                  Visual and interaction preferences.
                </p>
              </div>

              <section style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.8 }}>Appearance</span>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Theme (Type - Author)</span>
                  <select
                    value={theme}
                    onChange={(event) => onSelectTheme(event.target.value)}
                    aria-label="Select chart theme"
                    style={{
                      border: '1px solid',
                      borderColor: uiTheme.buttonBorder,
                      background: uiTheme.buttonBackground,
                      color: uiTheme.buttonText,
                      borderRadius: 8,
                      padding: '8px 10px',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {themeOptions.map((option) => (
                      <option key={option.key} value={option.key}>
                        {formatThemeOptionLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>
              </section>

              <section style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.8 }}>Canvas</span>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Render Size</span>
                  <select
                    value={canvasSizeMode}
                    onChange={(event) => onCanvasSizeModeChange(event.target.value as CanvasSizeMode)}
                    aria-label="Select canvas size"
                    style={{
                      border: '1px solid',
                      borderColor: uiTheme.buttonBorder,
                      background: uiTheme.buttonBackground,
                      color: uiTheme.buttonText,
                      borderRadius: 8,
                      padding: '8px 10px',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {canvasSizeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </section>

              <section style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.8 }}>Theme Tokens</span>
                <button
                  type="button"
                  onClick={onOpenThemeBuilder}
                  style={{
                    border: '1px solid',
                    borderColor: uiTheme.buttonBorder,
                    background: uiTheme.buttonBackground,
                    color: uiTheme.buttonText,
                    borderRadius: 8,
                    padding: '8px 10px',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: 'left',
                  }}
                >
                  Open Theme Builder
                </button>
              </section>
            </div>
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14 }}>
        {showReportDateControl ? (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Report Date</span>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                border: '1px solid',
                borderColor: uiTheme.buttonBorder,
                background: uiTheme.buttonBackground,
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <input
                type="text"
                value={reportDateDraft}
                onChange={(event) => onReportDateDraftChange(event.target.value)}
                onBlur={onReportDateDraftBlur}
                aria-label="Select report date"
                placeholder={reportDatePlaceholder}
                inputMode="numeric"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: uiTheme.buttonText,
                  padding: '8px 10px',
                  cursor: 'text',
                  fontSize: 13,
                  fontWeight: 600,
                  outline: 'none',
                  caretColor: uiTheme.buttonText,
                }}
              />
              <input
                ref={reportDatePickerRef}
                className="date-picker-hidden-native"
                type="date"
                value={reportDate}
                onChange={(event) => onReportDatePickerChange(event.target.value)}
                tabIndex={-1}
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={onOpenReportDatePicker}
                aria-label="Open calendar"
                title="Open calendar"
                style={{
                  border: 'none',
                  borderLeft: '1px solid',
                  borderColor: uiTheme.buttonBorder,
                  background: uiTheme.buttonBackground,
                  color: uiTheme.buttonText,
                  padding: '7px 8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CalendarRegular fontSize={16} />
              </button>
            </div>
          </label>
        ) : null}
        {showBucketCustomizerControl ? (
          <button
            type="button"
            onClick={onOpenBucketEditor}
            style={{
              border: '1px solid',
              borderColor: uiTheme.buttonBorder,
              background: uiTheme.buttonBackground,
              color: uiTheme.buttonText,
              borderRadius: 8,
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Edit Buckets
          </button>
        ) : null}
      </div>
    </div>
  );
}
