import type {
  AgingBucketDef,
  CanvasSizeMode,
  ChartPackMetadata,
  ThemeOption,
} from './types';
import type { BucketCombinator, BucketOperator } from './bucketEditorEngine';

export const OPERATOR_OPTIONS: BucketOperator[] = ['=', '<>', '>=', '<=', '>', '<'];
export const COMBINATOR_OPTIONS: Array<'AND' | 'OR'> = ['AND', 'OR'];

export const CANVAS_SIZE_OPTIONS: Array<{ value: CanvasSizeMode; label: string; displayOrder: number }> = [
  { value: 'fit-screen', label: 'Fit to Screen', displayOrder: 1 },
  { value: 'fit-width', label: 'Fit to Width', displayOrder: 2 },
  { value: 'fit-height', label: 'Fit to Height', displayOrder: 3 },
  { value: 'ratio-4-3', label: '4:3', displayOrder: 4 },
  { value: 'ratio-16-9', label: '16:9', displayOrder: 5 },
  { value: 'ratio-16-10', label: '16:10', displayOrder: 6 },
  { value: 'ratio-21-9', label: '21:9', displayOrder: 7 },
  { value: 'custom-pixels', label: 'Custom Pixels...', displayOrder: 8 },
];

export const CANVAS_SIZE_OPTIONS_SORTED = [...CANVAS_SIZE_OPTIONS].sort(
  (left, right) => left.displayOrder - right.displayOrder
);

export type CanvasSizeOption = { value: CanvasSizeMode; label: string; displayOrder: number };

export function getPageMaxWidthByCanvasMode(
  mode: CanvasSizeMode,
  customCanvasSize: { width: number; height: number }
) {
  if (mode === 'fit-width' || mode === 'fit-height') {
    return 1320;
  }
  if (mode === 'fit-screen') {
    return 'min(96vw, 1800px)';
  }
  if (mode === 'ratio-4-3') {
    return 'min(94vw, 1400px)';
  }
  if (mode === 'ratio-16-9') {
    return 'min(94vw, 1600px)';
  }
  if (mode === 'ratio-16-10') {
    return 'min(94vw, 1500px)';
  }
  if (mode === 'ratio-21-9') {
    return 'min(96vw, 1800px)';
  }
  return `min(96vw, ${customCanvasSize.width + 80}px)`;
}

function formatThemeScope(scope?: ThemeOption['scope']) {
  if (scope === 'global') {
    return 'Global';
  }
  if (scope === 'domain') {
    return 'Domain';
  }
  if (scope === 'pack') {
    return 'Pack';
  }
  if (scope === 'dashboard') {
    return 'Dashboard';
  }
  return 'Theme';
}

export function formatThemeOptionLabel(option: ThemeOption) {
  const scopeLabel = formatThemeScope(option.scope);
  const creator = option.createdBy ?? 'Unknown';
  return `${option.label} (${scopeLabel} - ${creator})`;
}

export function isCanvasSizeMode(value: string): value is CanvasSizeMode {
  return CANVAS_SIZE_OPTIONS.some((entry) => entry.value === value);
}

export function parsePositiveInt(input: string) {
  if (!/^\d+$/.test(input.trim())) {
    return null;
  }
  const parsed = Number(input);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

export function getCustomCanvasBounds() {
  if (typeof window === 'undefined') {
    return {
      minWidth: 320,
      minHeight: 240,
      maxWidth: 1920,
      maxHeight: 1080,
    };
  }

  const maxWidth = Math.max(320, Math.floor(window.innerWidth * 0.94) - 32);
  const maxHeight = Math.max(240, Math.floor(window.innerHeight) - 280);

  return {
    minWidth: 320,
    minHeight: 240,
    maxWidth,
    maxHeight,
  };
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readRuntimeLabel(source: Record<string, unknown>, key: string, fallback: string) {
  const value = source[key];
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export function parseBucketDefaultsFromMetadata(
  metadata: ChartPackMetadata | null,
  operatorOptions: BucketOperator[]
): AgingBucketDef[] | null {
  if (!metadata || !isObject(metadata.parameters)) {
    return null;
  }

  const rawBucketsParam = metadata.parameters.buckets;
  if (!isObject(rawBucketsParam) || !Array.isArray(rawBucketsParam.default)) {
    return null;
  }

  const parsed = rawBucketsParam.default
    .map((entry, index) => {
      if (!isObject(entry)) {
        return null;
      }

      const name = typeof entry.name === 'string' ? entry.name.trim() : '';
      if (!name) {
        return null;
      }

      const id = typeof entry.id === 'string' && entry.id.trim() ? entry.id : `pack-default-${index}`;
      const combinator = entry.combinator === 'OR' ? 'OR' : 'AND';
      const isSpecial = entry.isSpecial === true;

      const conditions = Array.isArray(entry.conditions)
        ? entry.conditions
            .map((raw) => {
              if (!isObject(raw) || !operatorOptions.includes(raw.operator as BucketOperator)) {
                return null;
              }
              const value = Number(raw.value);
              if (!Number.isInteger(value)) {
                return null;
              }
              return {
                operator: raw.operator as BucketOperator,
                value,
              };
            })
            .filter((value): value is { operator: BucketOperator; value: number } => value !== null)
        : [];

      if (conditions.length === 0) {
        return null;
      }

      return {
        id,
        name,
        isSpecial,
        combinator,
        conditions: conditions.slice(0, 2),
      } satisfies AgingBucketDef;
    })
    .filter((value): value is AgingBucketDef => value !== null);

  return parsed.length > 0 ? parsed : null;
}

export function hasStoredBuckets(storageKey: string) {
  if (typeof window === 'undefined') {
    return false;
  }
  const raw = window.localStorage.getItem(storageKey);
  return Boolean(raw && raw.trim());
}

export function parseCanvasSizeOptionsFromMetadata(metadata: ChartPackMetadata | null): CanvasSizeOption[] {
  if (!metadata || !isObject(metadata.runtime)) {
    return [];
  }

  const controls = isObject(metadata.runtime.controls) ? metadata.runtime.controls : null;
  const options = controls && Array.isArray(controls.canvasSizeOptions) ? controls.canvasSizeOptions : null;

  if (!options) {
    return [];
  }

  const parsed = options
    .map((entry) => {
      if (!isObject(entry) || typeof entry.value !== 'string' || !isCanvasSizeMode(entry.value)) {
        return null;
      }

      return {
        value: entry.value,
        label: typeof entry.label === 'string' && entry.label.trim() ? entry.label : entry.value,
        displayOrder: typeof entry.displayOrder === 'number' ? entry.displayOrder : 999,
      } as CanvasSizeOption;
    })
    .filter((value): value is CanvasSizeOption => value !== null)
    .sort((left, right) => left.displayOrder - right.displayOrder);

  return parsed;
}

export function formatBucketRule(bucket: AgingBucketDef) {
  const conditionText = bucket.conditions
    .map((condition) => `${condition.operator} ${condition.value}`)
    .join(` ${bucket.combinator} `);
  return `${bucket.name}: ${conditionText}`;
}

export function loadStoredBuckets(options: {
  storageKey: string;
  isDefaultBucketId: (id: string) => boolean;
  operatorOptions: BucketOperator[];
  normalizeLegacyDefaultBucket: (bucket: AgingBucketDef) => AgingBucketDef;
}): AgingBucketDef[] {
  const { storageKey, isDefaultBucketId, operatorOptions, normalizeLegacyDefaultBucket } = options;

  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [];
    }

    const buckets = parsed
      .map((item, index) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const candidate = item as Record<string, unknown>;
        const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';

        if (!name) {
          return null;
        }

        if (Array.isArray(candidate.conditions)) {
          const parsedConditions = candidate.conditions
            .map((entry) => {
              if (!entry || typeof entry !== 'object') {
                return null;
              }
              const rawCondition = entry as Record<string, unknown>;
              if (!operatorOptions.includes(rawCondition.operator as BucketOperator)) {
                return null;
              }
              const value = Number(rawCondition.value);
              if (!Number.isInteger(value)) {
                return null;
              }

              return {
                operator: rawCondition.operator as BucketOperator,
                value,
              };
            })
            .filter((value): value is { operator: BucketOperator; value: number } => value !== null);

          if (parsedConditions.length === 0) {
            return null;
          }

          const id = typeof candidate.id === 'string' ? candidate.id : `stored-${index}`;
          const isDefault = isDefaultBucketId(id);

          return {
            id,
            name,
            isSpecial: isDefault ? false : candidate.isSpecial === true,
            combinator:
              !isDefault && candidate.isSpecial === true && candidate.combinator === 'OR'
                ? 'OR'
                : 'AND',
            conditions: parsedConditions.slice(0, 2),
          };
        }

        const minDays = Number(candidate.minDays);
        const maxDays = Number(candidate.maxDays);
        if (!Number.isInteger(minDays) || !Number.isInteger(maxDays)) {
          return null;
        }

        return {
          id: typeof candidate.id === 'string' ? candidate.id : `stored-${index}`,
          name,
          isSpecial: false,
          combinator: 'AND',
          conditions: [
            { operator: '>=', value: minDays },
            { operator: '<=', value: maxDays },
          ],
        };
      })
      .filter((value): value is AgingBucketDef => value !== null)
      .map((bucket) => normalizeLegacyDefaultBucket(bucket));

    return buckets;
  } catch {
    return [];
  }
}

export function resolveRuntimeUiContracts(options: {
  metadata: ChartPackMetadata | null;
  operatorDefaults: BucketOperator[];
  combinatorDefaults: BucketCombinator[];
}) {
  const { metadata, operatorDefaults, combinatorDefaults } = options;
  const runtime = isObject(metadata?.runtime) ? metadata.runtime : {};
  const runtimeControls = isObject(runtime.controls) ? runtime.controls : {};
  const runtimeBucketEditor = isObject(runtimeControls.bucketEditor) ? runtimeControls.bucketEditor : {};
  const runtimeBucketEditorLabels = isObject(runtimeBucketEditor.labels) ? runtimeBucketEditor.labels : {};
  const runtimeNameSuggestionLabels = isObject(runtimeBucketEditor.nameSuggestion)
    ? runtimeBucketEditor.nameSuggestion
    : {};
  const parameters = isObject(metadata?.parameters) ? metadata.parameters : {};
  const hasDatePickerParam = Object.values(parameters).some(
    (entry) => isObject(entry) && entry.uiControl === 'date_picker'
  );
  const hasBucketCustomizerParam = Object.values(parameters).some(
    (entry) => isObject(entry) && entry.uiControl === 'bucket_customizer'
  );

  const showReportDateControl =
    typeof runtimeControls.reportDate === 'boolean'
      ? runtimeControls.reportDate
      : hasDatePickerParam;
  const showBucketCustomizerControl =
    typeof runtimeControls.bucketCustomizer === 'boolean'
      ? runtimeControls.bucketCustomizer
      : hasBucketCustomizerParam;

  const bucketOperatorOptions = Array.isArray(runtimeBucketEditor.operatorOptions)
    ? runtimeBucketEditor.operatorOptions.filter(
        (value): value is BucketOperator => operatorDefaults.includes(value as BucketOperator)
      )
    : operatorDefaults;
  const bucketCombinatorOptions = Array.isArray(runtimeBucketEditor.combinatorOptions)
    ? runtimeBucketEditor.combinatorOptions.filter(
        (value): value is BucketCombinator => combinatorDefaults.includes(value as BucketCombinator)
      )
    : combinatorDefaults;

  const effectiveOperatorOptions =
    bucketOperatorOptions.length > 0 ? bucketOperatorOptions : operatorDefaults;
  const effectiveCombinatorOptions =
    bucketCombinatorOptions.length > 0 ? bucketCombinatorOptions : combinatorDefaults;

  return {
    showReportDateControl,
    showBucketCustomizerControl,
    effectiveOperatorOptions,
    effectiveCombinatorOptions,
    bucketEditorLabels: {
      modalTitle: readRuntimeLabel(runtimeBucketEditorLabels, 'modalTitle', 'Edit Aging Buckets'),
      modalHelperText: readRuntimeLabel(
        runtimeBucketEditorLabels,
        'modalHelperText',
        'Buckets can be renamed, and you can adjust upper and lower bounds. Single-condition buckets are supported. For non-aged logic (for example retainage/escrow), create a new bucket and mark it as special to enable no days past due filters & OR conditions.'
      ),
      addBucketButton: readRuntimeLabel(runtimeBucketEditorLabels, 'addBucketButton', 'Add Bucket'),
      restoreDefaultsButton: readRuntimeLabel(
        runtimeBucketEditorLabels,
        'restoreDefaultsButton',
        'Restore Defaults'
      ),
      validateButton: readRuntimeLabel(runtimeBucketEditorLabels, 'validateButton', 'Validate'),
      cancelButton: readRuntimeLabel(runtimeBucketEditorLabels, 'cancelButton', 'Cancel'),
      applyButton: readRuntimeLabel(runtimeBucketEditorLabels, 'applyButton', 'Apply'),
      overlapErrorText: readRuntimeLabel(
        runtimeBucketEditorLabels,
        'overlapErrorText',
        'Overlapping bucket conditions must be fixed before validation can pass.'
      ),
      validateBeforeApplyText: readRuntimeLabel(
        runtimeBucketEditorLabels,
        'validateBeforeApplyText',
        'Please validate bucket changes before applying.'
      ),
    },
    nameSuggestionLabels: {
      title: readRuntimeLabel(runtimeNameSuggestionLabels, 'title', 'Update Bucket Name?'),
      subtitle: readRuntimeLabel(
        runtimeNameSuggestionLabels,
        'subtitle',
        'Bounds changed, so an auto-generated name is available.'
      ),
      boundsLabel: readRuntimeLabel(runtimeNameSuggestionLabels, 'boundsLabel', 'Bounds'),
      currentLabel: readRuntimeLabel(runtimeNameSuggestionLabels, 'currentLabel', 'Current'),
      suggestedLabel: readRuntimeLabel(runtimeNameSuggestionLabels, 'suggestedLabel', 'Suggested'),
      customInputLabel: readRuntimeLabel(
        runtimeNameSuggestionLabels,
        'customInputLabel',
        'Enter Custom Name'
      ),
      backButton: readRuntimeLabel(runtimeNameSuggestionLabels, 'backButton', 'Back'),
      applyCustomNameButton: readRuntimeLabel(
        runtimeNameSuggestionLabels,
        'applyCustomNameButton',
        'Apply Name'
      ),
      useSuggestedButton: readRuntimeLabel(
        runtimeNameSuggestionLabels,
        'useSuggestedButton',
        'Use Suggested'
      ),
      keepCurrentButton: readRuntimeLabel(runtimeNameSuggestionLabels, 'keepCurrentButton', 'Keep Current'),
      enterNewNameButton: readRuntimeLabel(
        runtimeNameSuggestionLabels,
        'enterNewNameButton',
        'Enter New Name'
      ),
      previousButtonTitle: readRuntimeLabel(
        runtimeNameSuggestionLabels,
        'previousButtonTitle',
        'Previous bucket'
      ),
      nextButtonTitle: readRuntimeLabel(runtimeNameSuggestionLabels, 'nextButtonTitle', 'Next bucket'),
    },
  };
}
