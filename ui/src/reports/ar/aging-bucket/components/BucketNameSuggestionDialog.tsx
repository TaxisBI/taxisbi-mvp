import { ArrowLeftRegular, ArrowRightRegular, CheckmarkRegular } from '@fluentui/react-icons';
import type { BucketNameSuggestionDialogProps } from './agingBucketComponentProps.types';

export default function BucketNameSuggestionDialog({
  isOpen,
  nameSuggestionDialog,
  nameSuggestionDialogRef,
  uiTheme,
  validationSuggestionPosition,
  validationSuggestionCount,
  validationSuggestionIndex,
  bucketDraft,
  activeSuggestionBounds,
  nameSuggestionLabels,
  onNavigateNameSuggestion,
  onUpdateCustomNameDraft,
  onBackToNameChoices,
  onApplyCustomName,
  onAcceptSuggestedName,
  onKeepCurrentName,
  onStartEnterCustomName,
}: BucketNameSuggestionDialogProps) {
  if (!isOpen || !nameSuggestionDialog) {
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
        zIndex: 70,
      }}
    >
      <div
        ref={nameSuggestionDialogRef}
        onMouseDown={(event) => event.stopPropagation()}
        style={{
          width: 'min(520px, 100%)',
          borderRadius: 14,
          background: uiTheme.cardBackground,
          color: uiTheme.pageText,
          boxShadow: uiTheme.cardShadow,
          padding: 18,
          display: 'grid',
          gap: 10,
        }}
      >
        <h3 style={{ margin: 0 }}>{nameSuggestionLabels.title}</h3>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.86 }}>{nameSuggestionLabels.subtitle}</p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            border: '1px solid',
            borderColor: uiTheme.buttonBorder,
            borderRadius: 8,
            padding: '6px 8px',
            background: uiTheme.buttonBackground,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.85 }}>
            {validationSuggestionPosition} of {validationSuggestionCount} buckets
          </span>
          <div style={{ display: 'inline-flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => onNavigateNameSuggestion(-1)}
              disabled={validationSuggestionIndex <= 0}
              style={{
                border: '1px solid',
                borderColor: uiTheme.buttonBorder,
                borderRadius: 6,
                width: 28,
                height: 28,
                background: validationSuggestionIndex <= 0 ? uiTheme.cardBackground : uiTheme.buttonBackground,
                color: validationSuggestionIndex <= 0 ? uiTheme.buttonBorder : uiTheme.buttonText,
                cursor: validationSuggestionIndex <= 0 ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={nameSuggestionLabels.previousButtonTitle}
              title={nameSuggestionLabels.previousButtonTitle}
            >
              <ArrowLeftRegular fontSize={14} />
            </button>
            <button
              type="button"
              onClick={() => onNavigateNameSuggestion(1)}
              disabled={validationSuggestionIndex >= validationSuggestionCount - 1}
              style={{
                border: '1px solid',
                borderColor: uiTheme.buttonBorder,
                borderRadius: 6,
                width: 28,
                height: 28,
                background:
                  validationSuggestionIndex >= validationSuggestionCount - 1
                    ? uiTheme.cardBackground
                    : uiTheme.buttonBackground,
                color:
                  validationSuggestionIndex >= validationSuggestionCount - 1
                    ? uiTheme.buttonBorder
                    : uiTheme.buttonText,
                cursor: validationSuggestionIndex >= validationSuggestionCount - 1 ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={nameSuggestionLabels.nextButtonTitle}
              title={nameSuggestionLabels.nextButtonTitle}
            >
              <ArrowRightRegular fontSize={14} />
            </button>
          </div>
        </div>
        <div
          style={{
            border: '1px solid',
            borderColor: uiTheme.buttonBorder,
            borderRadius: 8,
            background: uiTheme.buttonBackground,
            padding: '8px 10px',
            fontSize: 12,
            display: 'grid',
            gap: 4,
          }}
        >
          <span>
            {nameSuggestionLabels.boundsLabel}: <strong>{activeSuggestionBounds}</strong>
          </span>
          <span>
            {nameSuggestionLabels.currentLabel}:{' '}
            {bucketDraft.find((entry) => entry.id === nameSuggestionDialog.bucketId)?.name ?? ''}
          </span>
          <span>
            {nameSuggestionLabels.suggestedLabel}: <strong>{nameSuggestionDialog.suggestedName}</strong>
          </span>
        </div>
        {nameSuggestionDialog.isCustomMode ? (
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.86 }}>{nameSuggestionLabels.customInputLabel}</span>
            <input
              value={nameSuggestionDialog.customNameDraft}
              onChange={(event) => onUpdateCustomNameDraft(event.target.value)}
              onMouseEnter={(event) => event.currentTarget.focus()}
              aria-label="Custom bucket name"
              style={{
                border: '1px solid',
                borderColor: uiTheme.buttonBorder,
                background: uiTheme.buttonBackground,
                color: uiTheme.buttonText,
                borderRadius: 8,
                padding: '8px 10px',
                minWidth: 0,
                fontSize: 13,
              }}
            />
          </label>
        ) : null}
        {nameSuggestionDialog.error ? (
          <p style={{ margin: 0, color: uiTheme.statusDanger, fontWeight: 600, fontSize: 12 }}>
            {nameSuggestionDialog.error}
          </p>
        ) : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
          {nameSuggestionDialog.isCustomMode ? (
            <>
              <button
                type="button"
                onClick={onBackToNameChoices}
                style={{
                  border: '1px solid',
                  borderColor: uiTheme.buttonBorder,
                  borderRadius: 8,
                  padding: '8px 10px',
                  background: uiTheme.buttonBackground,
                  color: uiTheme.buttonText,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                {nameSuggestionLabels.backButton}
              </button>
              <button
                type="button"
                onClick={onApplyCustomName}
                style={{
                  border: '1px solid',
                  borderColor: uiTheme.buttonText,
                  borderRadius: 8,
                  padding: '8px 10px',
                  background: uiTheme.buttonText,
                  color: uiTheme.buttonBackground,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <CheckmarkRegular fontSize={14} />
                {nameSuggestionLabels.applyCustomNameButton}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onAcceptSuggestedName(nameSuggestionDialog.bucketId)}
                style={{
                  border: '1px solid',
                  borderColor: uiTheme.buttonText,
                  borderRadius: 8,
                  padding: '8px 10px',
                  background: uiTheme.buttonText,
                  color: uiTheme.buttonBackground,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                {nameSuggestionLabels.useSuggestedButton}
              </button>
              <button
                type="button"
                onClick={() => onKeepCurrentName(nameSuggestionDialog.bucketId)}
                style={{
                  border: '1px solid',
                  borderColor: uiTheme.buttonBorder,
                  borderRadius: 8,
                  padding: '8px 10px',
                  background: uiTheme.buttonBackground,
                  color: uiTheme.buttonText,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                {nameSuggestionLabels.keepCurrentButton}
              </button>
              <button
                type="button"
                onClick={onStartEnterCustomName}
                style={{
                  border: '1px solid',
                  borderColor: uiTheme.buttonBorder,
                  borderRadius: 8,
                  padding: '8px 10px',
                  background: uiTheme.buttonBackground,
                  color: uiTheme.buttonText,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                {nameSuggestionLabels.enterNewNameButton}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
