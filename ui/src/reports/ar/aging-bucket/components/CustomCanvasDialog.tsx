import type { RefObject } from 'react';
import type { ResolvedUiTheme } from '../types';

type Bounds = {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
};

type DraftSize = {
  width: string;
  height: string;
};

type CustomCanvasDialogProps = {
  isOpen: boolean;
  dialogRef: RefObject<HTMLDivElement | null>;
  uiTheme: ResolvedUiTheme;
  bounds: Bounds;
  draft: DraftSize;
  error: string | null;
  onDraftChange: (patch: Partial<DraftSize>) => void;
  onClose: () => void;
  onApply: () => void;
};

export default function CustomCanvasDialog({
  isOpen,
  dialogRef,
  uiTheme,
  bounds,
  draft,
  error,
  onDraftChange,
  onClose,
  onApply,
}: CustomCanvasDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: uiTheme.modalOverlayBackground,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 60,
      }}
    >
      <div
        ref={dialogRef}
        style={{
          width: 'min(420px, 100%)',
          borderRadius: 14,
          background: uiTheme.cardBackground,
          boxShadow: uiTheme.cardShadow,
          padding: 18,
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>Custom Canvas Size</h2>
        <p style={{ marginTop: 0, marginBottom: 14, fontSize: 13, opacity: 0.85 }}>
          Set exact pixel dimensions for chart rendering.
        </p>
        <p style={{ marginTop: 0, marginBottom: 12, fontSize: 12, opacity: 0.75 }}>
          Allowed range: {bounds.minWidth} x {bounds.minHeight} to {bounds.maxWidth} x {bounds.maxHeight}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.85 }}>Width (px)</span>
            <input
              value={draft.width}
              onChange={(event) => onDraftChange({ width: event.target.value })}
              inputMode="numeric"
              aria-label="Custom canvas width in pixels"
              style={{
                border: '1px solid',
                borderColor: uiTheme.buttonBorder,
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 13,
              }}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.85 }}>Height (px)</span>
            <input
              value={draft.height}
              onChange={(event) => onDraftChange({ height: event.target.value })}
              inputMode="numeric"
              aria-label="Custom canvas height in pixels"
              style={{
                border: '1px solid',
                borderColor: uiTheme.buttonBorder,
                borderRadius: 8,
                padding: '8px 10px',
                fontSize: 13,
              }}
            />
          </label>
        </div>
        {error ? (
          <p style={{ marginTop: 10, marginBottom: 0, color: uiTheme.statusDanger, fontWeight: 600 }}>
            {error}
          </p>
        ) : null}
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
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
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApply}
            style={{
              border: '1px solid',
              borderColor: uiTheme.buttonText,
              borderRadius: 8,
              padding: '8px 12px',
              background: uiTheme.buttonText,
              color: uiTheme.buttonBackground,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
