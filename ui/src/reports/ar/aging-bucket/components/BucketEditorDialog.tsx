import {
  AddRegular,
  CheckmarkCircleRegular,
  DeleteRegular,
  ReOrderDotsVerticalRegular,
  SubtractRegular,
  WarningFilled,
} from '@fluentui/react-icons';
import type { RefObject } from 'react';
import type { ResolvedUiTheme } from './ARAgingBucketChart';
import type {
  BucketCombinator,
  BucketDraft,
  BucketOperator,
  OverlapMetadata,
} from '../bucketEditorEngine';

type BucketEditorLabels = {
  modalTitle: string;
  modalHelperText: string;
  addBucketButton: string;
  restoreDefaultsButton: string;
  validateButton: string;
  cancelButton: string;
  applyButton: string;
  overlapErrorText: string;
};

type BucketEditorDialogProps = {
  isOpen: boolean;
  bucketDialogRef: RefObject<HTMLDivElement | null>;
  uiTheme: ResolvedUiTheme;
  bucketEditorLabels: BucketEditorLabels;
  bucketDraft: BucketDraft[];
  overlapMeta: OverlapMetadata;
  dragBucketId: string | null;
  validationPassed: boolean;
  validatedBucketIds: Set<string>;
  draftValidationError: string | null;
  bucketError: string | null;
  isDefaultBucketId: (id: string) => boolean;
  effectiveOperatorOptions: BucketOperator[];
  effectiveCombinatorOptions: BucketCombinator[];
  operatorLabels: Record<BucketOperator, string>;
  onDragStart: (id: string) => void;
  onDropReorder: (sourceId: string, targetId: string) => void;
  onDragEnd: () => void;
  onUpdateBucketDraftName: (id: string, value: string) => void;
  onUpdateBucketSpecial: (id: string, isSpecial: boolean) => void;
  onUpdateBucketCondition: (
    id: string,
    slot: 'primary' | 'secondary',
    patch: Partial<{ operator: BucketOperator; value: string; enabled: boolean }>
  ) => void;
  onUpdateBucketCombinator: (id: string, combinator: BucketCombinator) => void;
  onDeleteBucket: (id: string) => void;
  onAddBucket: () => void;
  onRestoreDefaultBuckets: () => void;
  onRunValidation: () => void;
  onCancel: () => void;
  onApply: () => void;
};

export default function BucketEditorDialog({
  isOpen,
  bucketDialogRef,
  uiTheme,
  bucketEditorLabels,
  bucketDraft,
  overlapMeta,
  dragBucketId,
  validationPassed,
  validatedBucketIds,
  draftValidationError,
  bucketError,
  isDefaultBucketId,
  effectiveOperatorOptions,
  effectiveCombinatorOptions,
  operatorLabels,
  onDragStart,
  onDropReorder,
  onDragEnd,
  onUpdateBucketDraftName,
  onUpdateBucketSpecial,
  onUpdateBucketCondition,
  onUpdateBucketCombinator,
  onDeleteBucket,
  onAddBucket,
  onRestoreDefaultBuckets,
  onRunValidation,
  onCancel,
  onApply,
}: BucketEditorDialogProps) {
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
        zIndex: 50,
      }}
    >
      <div
        ref={bucketDialogRef}
        style={{
          width: 'min(1100px, 100%)',
          maxHeight: '90vh',
          overflow: 'auto',
          borderRadius: 14,
          background: uiTheme.cardBackground,
          color: uiTheme.pageText,
          boxShadow: uiTheme.cardShadow,
          padding: 20,
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>{bucketEditorLabels.modalTitle}</h2>
        <p style={{ marginTop: 0, marginBottom: 16, fontSize: 13, opacity: 0.85 }}>
          {bucketEditorLabels.modalHelperText}
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {bucketDraft.map((bucket, index) => {
            const hasOverlap = overlapMeta.overlapIds.has(bucket.id);
            const overlapToken = overlapMeta.colorByBucketId.get(bucket.id);
            const isDefaultBucket = isDefaultBucketId(bucket.id);
            return (
              <div
                key={bucket.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', bucket.id);
                  onDragStart(bucket.id);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const sourceId = event.dataTransfer.getData('text/plain') || dragBucketId;
                  if (!sourceId) {
                    return;
                  }
                  onDropReorder(sourceId, bucket.id);
                }}
                onDragEnd={onDragEnd}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 132px minmax(560px, 1fr) auto auto',
                  gap: 10,
                  alignItems: 'center',
                  border:
                    dragBucketId === bucket.id
                      ? `1px dashed ${uiTheme.buttonBorder}`
                      : '1px solid transparent',
                  borderRadius: 10,
                  padding: '8px 6px',
                }}
              >
                <button
                  type="button"
                  title="Drag to reorder"
                  aria-label={`Drag to reorder bucket ${index + 1}`}
                  style={{
                    border: '1px solid',
                    borderColor: uiTheme.buttonBorder,
                    borderRadius: 8,
                    background: uiTheme.buttonBackground,
                    color: uiTheme.buttonText,
                    padding: '7px 8px',
                    cursor: 'grab',
                    fontWeight: 700,
                  }}
                >
                  <ReOrderDotsVerticalRegular fontSize={16} />
                </button>
                <div style={{ display: 'grid', gap: 6 }}>
                  <input
                    value={bucket.name}
                    onChange={(event) => onUpdateBucketDraftName(bucket.id, event.target.value)}
                    onMouseEnter={(event) => event.currentTarget.focus()}
                    aria-label={`Bucket ${index + 1} name`}
                    style={{
                      border: '1px solid',
                      borderColor: uiTheme.buttonBorder,
                      borderRadius: 8,
                      padding: '8px 10px',
                      minWidth: 0,
                      fontSize: 13,
                    }}
                  />
                  {!isDefaultBucket ? (
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11,
                        opacity: 0.82,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={bucket.isSpecial}
                        onChange={(event) => onUpdateBucketSpecial(bucket.id, event.target.checked)}
                        aria-label={`Bucket ${index + 1} special bucket`}
                      />
                      Special bucket
                    </label>
                  ) : null}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '64px 104px', gap: 8 }}>
                    <select
                      value={bucket.primary.operator}
                      onChange={(event) =>
                        onUpdateBucketCondition(bucket.id, 'primary', {
                          operator: event.target.value as BucketOperator,
                        })
                      }
                      aria-label={`Bucket ${index + 1} primary operator`}
                      style={{
                        border: '1px solid',
                        borderColor: uiTheme.buttonBorder,
                        borderRadius: 8,
                        background: uiTheme.buttonBackground,
                        color: uiTheme.buttonText,
                        padding: '8px 8px',
                        fontWeight: 600,
                        fontSize: 14,
                        lineHeight: '18px',
                        letterSpacing: '0.01em',
                        fontFamily: uiTheme.fontFamily,
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale',
                        textRendering: 'optimizeLegibility',
                        cursor: 'pointer',
                        minWidth: 64,
                      }}
                    >
                      {effectiveOperatorOptions.map((option) => (
                        <option key={`p-${bucket.id}-${option}`} value={option}>
                          {operatorLabels[option]}
                        </option>
                      ))}
                    </select>
                    <input
                      value={bucket.primary.value}
                      onChange={(event) =>
                        onUpdateBucketCondition(bucket.id, 'primary', { value: event.target.value })
                      }
                      onMouseEnter={(event) => event.currentTarget.focus()}
                      aria-label={`Bucket ${index + 1} primary value`}
                      style={{
                        border: '1px solid',
                        borderColor: overlapToken?.border ?? uiTheme.buttonBorder,
                        background: uiTheme.buttonBackground,
                        color: uiTheme.buttonText,
                        boxShadow: overlapToken ? `inset 0 0 0 1px ${overlapToken.border}33` : 'none',
                        borderRadius: 8,
                        padding: '8px 8px',
                        fontSize: 13,
                      }}
                    />
                  </div>
                  {bucket.secondary.enabled ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {bucket.isSpecial ? (
                        <select
                          value={bucket.combinator}
                          onChange={(event) =>
                            onUpdateBucketCombinator(bucket.id, event.target.value as BucketCombinator)
                          }
                          aria-label={`Bucket ${index + 1} combinator`}
                          style={{
                            border: '1px solid',
                            borderColor: uiTheme.buttonBorder,
                            borderRadius: 8,
                            background: uiTheme.buttonBackground,
                            color: uiTheme.buttonText,
                            padding: '8px 8px',
                            fontWeight: 700,
                            fontSize: 12,
                            minWidth: 64,
                            cursor: 'pointer',
                          }}
                        >
                          {effectiveCombinatorOptions.map((option) => (
                            <option key={`${bucket.id}-${option}`} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.65 }}>AND</span>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '64px 104px 34px', gap: 8 }}>
                        <select
                          value={bucket.secondary.operator}
                          onChange={(event) =>
                            onUpdateBucketCondition(bucket.id, 'secondary', {
                              operator: event.target.value as BucketOperator,
                            })
                          }
                          aria-label={`Bucket ${index + 1} secondary operator`}
                          style={{
                            border: '1px solid',
                            borderColor: uiTheme.buttonBorder,
                            borderRadius: 8,
                            background: uiTheme.buttonBackground,
                            color: uiTheme.buttonText,
                            padding: '8px 8px',
                            fontWeight: 600,
                            fontSize: 14,
                            lineHeight: '18px',
                            letterSpacing: '0.01em',
                            fontFamily: uiTheme.fontFamily,
                            WebkitFontSmoothing: 'antialiased',
                            MozOsxFontSmoothing: 'grayscale',
                            textRendering: 'optimizeLegibility',
                            cursor: 'pointer',
                            minWidth: 64,
                          }}
                        >
                          {effectiveOperatorOptions.map((option) => (
                            <option key={`s-${bucket.id}-${option}`} value={option}>
                              {operatorLabels[option]}
                            </option>
                          ))}
                        </select>
                        <input
                          value={bucket.secondary.value}
                          onChange={(event) =>
                            onUpdateBucketCondition(bucket.id, 'secondary', { value: event.target.value })
                          }
                          onMouseEnter={(event) => event.currentTarget.focus()}
                          aria-label={`Bucket ${index + 1} secondary value`}
                          style={{
                            border: '1px solid',
                            borderColor: overlapToken?.border ?? uiTheme.buttonBorder,
                            background: uiTheme.buttonBackground,
                            color: uiTheme.buttonText,
                            boxShadow: overlapToken ? `inset 0 0 0 1px ${overlapToken.border}33` : 'none',
                            borderRadius: 8,
                            padding: '8px 8px',
                            fontSize: 13,
                          }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateBucketCondition(bucket.id, 'secondary', {
                              enabled: false,
                              value: '',
                            })
                          }
                          style={{
                            border: '1px solid',
                            borderColor: uiTheme.buttonBorder,
                            borderRadius: 8,
                            padding: '6px 0',
                            background: uiTheme.buttonBackground,
                            color: uiTheme.buttonText,
                            cursor: 'pointer',
                            fontWeight: 700,
                          }}
                          title="Remove AND condition"
                          aria-label={`Remove secondary condition for bucket ${index + 1}`}
                        >
                          <SubtractRegular fontSize={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateBucketCondition(bucket.id, 'secondary', {
                          enabled: true,
                        })
                      }
                      style={{
                        border: '1px solid',
                        borderColor: uiTheme.buttonBorder,
                        borderRadius: 8,
                        padding: '6px 8px',
                        background: uiTheme.buttonBackground,
                        color: uiTheme.buttonText,
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                      title="Add second condition"
                      aria-label={`Add secondary condition for bucket ${index + 1}`}
                    >
                      <AddRegular fontSize={14} />
                    </button>
                  )}
                </div>
                <div style={{ minHeight: 20, color: uiTheme.statusDanger, fontSize: 12, fontWeight: 700 }}>
                  {hasOverlap ? (
                    <span
                      title="This range overlaps another bucket"
                      style={{ color: overlapToken?.border ?? uiTheme.statusDanger }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          background: overlapToken?.border ?? uiTheme.statusDanger,
                          color: uiTheme.statusOnColor,
                          marginRight: 6,
                          fontSize: 11,
                        }}
                      >
                        <WarningFilled fontSize={12} />
                      </span>
                      Overlap
                    </span>
                  ) : validationPassed && validatedBucketIds.has(bucket.id) ? (
                    <span
                      style={{
                        color: uiTheme.statusSuccess,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <CheckmarkCircleRegular fontSize={14} />
                      Validated
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onDeleteBucket(bucket.id)}
                  style={{
                    border: '1px solid',
                    borderColor: uiTheme.buttonBorder,
                    borderRadius: 8,
                    padding: '6px 8px',
                    background: uiTheme.buttonBackground,
                    color: uiTheme.buttonText,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                  title="Delete bucket"
                  aria-label={`Delete bucket ${index + 1}`}
                >
                  <DeleteRegular fontSize={16} />
                </button>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onAddBucket}
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
              {bucketEditorLabels.addBucketButton}
            </button>
            <button
              type="button"
              onClick={onRestoreDefaultBuckets}
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
              {bucketEditorLabels.restoreDefaultsButton}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onRunValidation}
              disabled={draftValidationError !== null}
              style={{
                border: '1px solid',
                borderColor: uiTheme.buttonBorder,
                borderRadius: 8,
                padding: '8px 12px',
                background: draftValidationError ? uiTheme.cardBackground : uiTheme.buttonBackground,
                color: draftValidationError ? uiTheme.buttonBorder : uiTheme.buttonText,
                cursor: draftValidationError ? 'not-allowed' : 'pointer',
                fontWeight: 600,
              }}
            >
              {bucketEditorLabels.validateButton}
            </button>
            <button
              type="button"
              onClick={onCancel}
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
              {bucketEditorLabels.cancelButton}
            </button>
            <button
              type="button"
              onClick={onApply}
              disabled={draftValidationError !== null || !validationPassed}
              style={{
                border: '1px solid',
                borderColor: uiTheme.buttonBorder,
                borderRadius: 8,
                padding: '8px 12px',
                background:
                  draftValidationError || !validationPassed ? uiTheme.cardBackground : uiTheme.buttonText,
                color:
                  draftValidationError || !validationPassed ? uiTheme.buttonBorder : uiTheme.buttonBackground,
                cursor: draftValidationError || !validationPassed ? 'not-allowed' : 'pointer',
                fontWeight: 600,
              }}
            >
              {bucketEditorLabels.applyButton}
            </button>
          </div>
        </div>
        {draftValidationError || bucketError ? (
          <p style={{ marginTop: 10, marginBottom: 0, color: uiTheme.statusDanger, fontWeight: 600 }}>
            {bucketError ?? draftValidationError}
          </p>
        ) : null}
        {overlapMeta.overlapIds.size > 0 && draftValidationError === null ? (
          <p style={{ marginTop: 10, marginBottom: 0, color: uiTheme.statusDanger, fontWeight: 600 }}>
            {bucketEditorLabels.overlapErrorText}
          </p>
        ) : null}
      </div>
    </div>
  );
}
