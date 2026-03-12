import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AddRegular,
  ArrowLeftRegular,
  ArrowRightRegular,
  CalendarRegular,
  CheckmarkCircleRegular,
  CheckmarkRegular,
  DeleteRegular,
  ReOrderDotsVerticalRegular,
  SettingsRegular,
  SubtractRegular,
  WarningFilled,
} from '@fluentui/react-icons';
import ARAgingBucketChart, {
  AgingBucketDef,
  CanvasSizeMode,
  ResolvedUiTheme,
  ThemeOption,
} from './components/ARAgingBucketChart';

const THEME_STORAGE_KEY = 'taxisbi.ui.theme';
const REPORT_DATE_STORAGE_KEY = 'taxisbi.ui.reportDate';
const BUCKET_STORAGE_KEY = 'taxisbi.ui.agingBuckets';
const CANVAS_SIZE_STORAGE_KEY = 'taxisbi.ui.canvasSizeMode';
const CANVAS_CUSTOM_SIZE_STORAGE_KEY = 'taxisbi.ui.canvasCustomSize';

type BucketOperator = '=' | '<>' | '>=' | '<=' | '>' | '<';
type BucketCombinator = 'AND' | 'OR';

const OPERATOR_OPTIONS: BucketOperator[] = ['=', '<>', '>=', '<=', '>', '<'];
const COMBINATOR_OPTIONS: BucketCombinator[] = ['AND', 'OR'];

const OPERATOR_LABELS: Record<BucketOperator, string> = {
  '=': '=',
  '<>': '!=',
  '>=': '>=',
  '<=': '<=',
  '>': '>',
  '<': '<',
};

const DEFAULT_BUCKETS: AgingBucketDef[] = [
  {
    id: 'b1',
    name: 'Current',
    isSpecial: false,
    combinator: 'AND',
    conditions: [{ operator: '<=', value: 0 }],
  },
  {
    id: 'b2',
    name: '1-30',
    isSpecial: false,
    combinator: 'AND',
    conditions: [
      { operator: '>=', value: 1 },
      { operator: '<=', value: 30 },
    ],
  },
  {
    id: 'b3',
    name: '31-60',
    isSpecial: false,
    combinator: 'AND',
    conditions: [
      { operator: '>=', value: 31 },
      { operator: '<=', value: 60 },
    ],
  },
  {
    id: 'b4',
    name: '61-90',
    isSpecial: false,
    combinator: 'AND',
    conditions: [
      { operator: '>=', value: 61 },
      { operator: '<=', value: 90 },
    ],
  },
  {
    id: 'b5',
    name: '91+',
    isSpecial: false,
    combinator: 'AND',
    conditions: [{ operator: '>', value: 90 }],
  },
];

const DEFAULT_BUCKET_IDS = new Set(DEFAULT_BUCKETS.map((bucket) => bucket.id));

function isDefaultBucketId(id: string) {
  return DEFAULT_BUCKET_IDS.has(id);
}

const CANVAS_SIZE_OPTIONS: Array<{ value: CanvasSizeMode; label: string; displayOrder: number }> = [
  { value: 'fit-screen', label: 'Fit to Screen', displayOrder: 1 },
  { value: 'fit-width', label: 'Fit to Width', displayOrder: 2 },
  { value: 'fit-height', label: 'Fit to Height', displayOrder: 3 },
  { value: 'ratio-4-3', label: '4:3', displayOrder: 4 },
  { value: 'ratio-16-9', label: '16:9', displayOrder: 5 },
  { value: 'ratio-16-10', label: '16:10', displayOrder: 6 },
  { value: 'ratio-21-9', label: '21:9', displayOrder: 7 },
  { value: 'custom-pixels', label: 'Custom Pixels...', displayOrder: 8 },
];

const CANVAS_SIZE_OPTIONS_SORTED = [...CANVAS_SIZE_OPTIONS].sort(
  (left, right) => left.displayOrder - right.displayOrder
);

function getPageMaxWidthByCanvasMode(
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

function formatThemeOptionLabel(option: ThemeOption) {
  const scopeLabel = formatThemeScope(option.scope);
  const creator = option.createdBy ?? 'Unknown';
  return `${option.label} (${scopeLabel} - ${creator})`;
}

function isCanvasSizeMode(value: string): value is CanvasSizeMode {
  return CANVAS_SIZE_OPTIONS.some((entry) => entry.value === value);
}

function parsePositiveInt(input: string) {
  if (!/^\d+$/.test(input.trim())) {
    return null;
  }
  const parsed = Number(input);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function getCustomCanvasBounds() {
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

type BucketConditionDraft = {
  operator: BucketOperator;
  value: string;
  enabled: boolean;
};

type BucketDraft = {
  id: string;
  name: string;
  isSpecial: boolean;
  combinator: BucketCombinator;
  isNew: boolean;
  pendingSuggestedName: string | null;
  primary: BucketConditionDraft;
  secondary: BucketConditionDraft;
};

type NameSuggestionDialogState = {
  bucketId: string;
  suggestedName: string;
  customNameDraft: string;
  isCustomMode: boolean;
  error: string | null;
};

type ValidationSuggestionItem = {
  bucketId: string;
  suggestedName: string;
};

type OverlapColorToken = {
  border: string;
  background: string;
};

type OverlapMetadata = {
  overlapIds: Set<string>;
  colorByBucketId: Map<string, OverlapColorToken>;
};

function getTodayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.toISOString().slice(0, 10) === value;
}

type LocaleDateMeta = {
  order: Array<'day' | 'month' | 'year'>;
  placeholder: string;
};

function getLocaleDateMeta(): LocaleDateMeta {
  const formatter = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date(Date.UTC(2001, 10, 22)));
  const order = parts
    .filter((part) => part.type === 'day' || part.type === 'month' || part.type === 'year')
    .map((part) => part.type) as Array<'day' | 'month' | 'year'>;

  const placeholder = parts
    .map((part) => {
      if (part.type === 'day') {
        return 'dd';
      }
      if (part.type === 'month') {
        return 'mm';
      }
      if (part.type === 'year') {
        return 'yyyy';
      }
      return part.value;
    })
    .join('');

  return {
    order: order.length === 3 ? order : ['year', 'month', 'day'],
    placeholder,
  };
}

function formatIsoDateForLocale(isoDate: string) {
  if (!isValidIsoDate(isoDate)) {
    return isoDate;
  }

  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function parseLocaleDateToIso(input: string, meta: LocaleDateMeta): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  if (isValidIsoDate(trimmed)) {
    return trimmed;
  }

  const numbers = trimmed.match(/\d+/g);
  if (!numbers || numbers.length !== 3) {
    return null;
  }

  const map: Record<'day' | 'month' | 'year', number> = {
    day: 0,
    month: 0,
    year: 0,
  };

  meta.order.forEach((part, index) => {
    map[part] = Number(numbers[index]);
  });

  let year = map.year;
  if (year < 100) {
    year += 2000;
  }

  const month = map.month;
  const day = map.day;
  const iso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return isValidIsoDate(iso) ? iso : null;
}

function parseInteger(value: string): number | null {
  const trimmed = value.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isInteger(parsed) ? parsed : null;
}

function formatAutoBucketName(
  primary: { operator: BucketOperator; value: number },
  secondary?: { operator: BucketOperator; value: number }
) {
  if (!secondary) {
    if (primary.operator === '>' || primary.operator === '>=') {
      return `${primary.value}+`;
    }
    return String(primary.value);
  }

  return `${primary.value}-${secondary.value}`;
}

function buildConditionName(
  primary: { operator: BucketOperator; value: number },
  secondary?: { operator: BucketOperator; value: number },
  combinator: BucketCombinator = 'AND'
) {
  const autoBoundsName = formatAutoBucketName(primary, secondary);
  if (!secondary) {
    return autoBoundsName;
  }

  if (combinator === 'OR') {
    return autoBoundsName;
  }

  return autoBoundsName;
}

function isCondition(
  entry: { operator: BucketOperator; value: number } | undefined,
  operator: BucketOperator,
  value: number
) {
  return Boolean(entry && entry.operator === operator && entry.value === value);
}

function normalizeLegacyDefaultBucket(bucket: AgingBucketDef): AgingBucketDef {
  const [first, second] = bucket.conditions;
  const normalizedName = bucket.name.trim().toLowerCase();

  if (
    normalizedName === 'current' &&
    (isCondition(first, '<=', 0) ||
      (isCondition(first, '>=', -36500) && isCondition(second, '<=', 0)) ||
      (isCondition(first, '<=', 0) && isCondition(second, '>=', -36500)))
  ) {
    return {
      ...bucket,
      isSpecial: false,
      combinator: 'AND',
      conditions: [{ operator: '<=', value: 0 }],
    };
  }

  if (
    normalizedName === '91+' &&
    (isCondition(first, '>', 90) ||
      isCondition(first, '>=', 91) ||
      (isCondition(first, '>=', 91) && isCondition(second, '<=', 36500)) ||
      (isCondition(first, '<=', 36500) && isCondition(second, '>=', 91)))
  ) {
    return {
      ...bucket,
      isSpecial: false,
      combinator: 'AND',
      conditions: [{ operator: '>', value: 90 }],
    };
  }

  return bucket;
}

function reorderById<T extends { id: string }>(items: T[], sourceId: string, targetId: string): T[] {
  if (sourceId === targetId) {
    return items;
  }

  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  const targetIndex = items.findIndex((item) => item.id === targetId);

  if (sourceIndex < 0 || targetIndex < 0) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

function loadStoredBuckets(): AgingBucketDef[] {
  if (typeof window === 'undefined') {
    return DEFAULT_BUCKETS;
  }

  const raw = window.localStorage.getItem(BUCKET_STORAGE_KEY);
  if (!raw) {
    return DEFAULT_BUCKETS;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_BUCKETS;
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
              const raw = entry as Record<string, unknown>;
              if (!OPERATOR_OPTIONS.includes(raw.operator as BucketOperator)) {
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
            .filter(
              (value): value is { operator: BucketOperator; value: number } => value !== null
            );

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

    return buckets.length > 0 ? buckets : DEFAULT_BUCKETS;
  } catch {
    return DEFAULT_BUCKETS;
  }
}

function toDraft(bucket: AgingBucketDef): BucketDraft {
  const [first, second] = bucket.conditions;
  return {
    id: bucket.id,
    name: bucket.name,
    isSpecial: bucket.isSpecial ?? false,
    combinator: bucket.combinator ?? 'AND',
    isNew: false,
    pendingSuggestedName: null,
    primary: {
      operator: first?.operator ?? '>=',
      value: first ? String(first.value) : '',
      enabled: true,
    },
    secondary: {
      operator: second?.operator ?? '<=',
      value: second ? String(second.value) : '',
      enabled: Boolean(second),
    },
  };
}

function conditionMatches(
  days: number,
  condition: { operator: BucketOperator; value: number }
) {
  if (condition.operator === '=') {
    return days === condition.value;
  }
  if (condition.operator === '<>') {
    return days !== condition.value;
  }
  if (condition.operator === '>=') {
    return days >= condition.value;
  }
  if (condition.operator === '<=') {
    return days <= condition.value;
  }
  if (condition.operator === '>') {
    return days > condition.value;
  }
  return days < condition.value;
}

function bucketMatches(days: number, bucket: AgingBucketDef) {
  if (bucket.conditions.length <= 1) {
    return bucket.conditions.every((condition) => conditionMatches(days, condition));
  }

  const combinator = bucket.isSpecial ? bucket.combinator ?? 'AND' : 'AND';
  if (combinator === 'OR') {
    return bucket.conditions.some((condition) => conditionMatches(days, condition));
  }

  return bucket.conditions.every((condition) => conditionMatches(days, condition));
}

function detectOverlaps(
  buckets: AgingBucketDef[],
  colorPalette: OverlapColorToken[]
): OverlapMetadata {
  const overlapIds = new Set<string>();
  const adjacency = new Map<string, Set<string>>();
  const colorByBucketId = new Map<string, OverlapColorToken>();

  const points = new Set<number>([-36500, -365, -90, -1, 0, 1, 30, 31, 60, 61, 90, 91, 365, 36500]);
  buckets.forEach((bucket) => {
    bucket.conditions.forEach((condition) => {
      points.add(condition.value);
      points.add(condition.value - 1);
      points.add(condition.value + 1);
    });
  });

  const samplePoints = Array.from(points);

  for (let i = 0; i < buckets.length; i += 1) {
    for (let j = i + 1; j < buckets.length; j += 1) {
      const left = buckets[i];
      const right = buckets[j];
      const hasOverlap = samplePoints.some(
        (point) => bucketMatches(point, left) && bucketMatches(point, right)
      );
      if (hasOverlap) {
        overlapIds.add(left.id);
        overlapIds.add(right.id);
        if (!adjacency.has(left.id)) {
          adjacency.set(left.id, new Set());
        }
        if (!adjacency.has(right.id)) {
          adjacency.set(right.id, new Set());
        }
        adjacency.get(left.id)!.add(right.id);
        adjacency.get(right.id)!.add(left.id);
      }
    }
  }

  const visited = new Set<string>();
  const nodes = Array.from(adjacency.keys());

  nodes.forEach((startId, groupIndex) => {
    if (visited.has(startId)) {
      return;
    }

    const stack = [startId];
    const token = colorPalette[groupIndex % colorPalette.length];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);
      colorByBucketId.set(current, token);

      const neighbors = adjacency.get(current);
      if (!neighbors) {
        continue;
      }
      neighbors.forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      });
    }
  });

  return {
    overlapIds,
    colorByBucketId,
  };
}

export default function ARAgingBucketPage() {
  const reportDatePickerRef = useRef<HTMLInputElement | null>(null);
  const themePopoverRef = useRef<HTMLDivElement | null>(null);
  const themeButtonRef = useRef<HTMLButtonElement | null>(null);
  const bucketDialogRef = useRef<HTMLDivElement | null>(null);
  const canvasDialogRef = useRef<HTMLDivElement | null>(null);
  const nameSuggestionDialogRef = useRef<HTMLDivElement | null>(null);
  const suppressEditorCloseUntilRef = useRef(0);
  const localeDateMeta = useMemo(() => getLocaleDateMeta(), []);
  const customCanvasBounds = getCustomCanvasBounds();
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }
    return window.localStorage.getItem(THEME_STORAGE_KEY) ?? 'light';
  });
  const [themeOptions, setThemeOptions] = useState<ThemeOption[]>([
    { key: 'light', label: 'Light' },
    { key: 'dark', label: 'Dark' },
  ]);
  const [reportDate, setReportDate] = useState<string>(() => {
    const today = getTodayIsoDate();
    if (typeof window === 'undefined') {
      return today;
    }
    const stored = window.localStorage.getItem(REPORT_DATE_STORAGE_KEY);
    return stored && isValidIsoDate(stored) ? stored : today;
  });
  const [reportDateDraft, setReportDateDraft] = useState<string>(() =>
    formatIsoDateForLocale(reportDate)
  );
  const [canvasSizeMode, setCanvasSizeMode] = useState<CanvasSizeMode>(() => {
    if (typeof window === 'undefined') {
      return 'fit-screen';
    }
    const stored = window.localStorage.getItem(CANVAS_SIZE_STORAGE_KEY);
    return stored && isCanvasSizeMode(stored) ? stored : 'fit-screen';
  });
  const [customCanvasSize, setCustomCanvasSize] = useState<{ width: number; height: number }>(() => {
    if (typeof window === 'undefined') {
      return { width: 1366, height: 768 };
    }
    const raw = window.localStorage.getItem(CANVAS_CUSTOM_SIZE_STORAGE_KEY);
    if (!raw) {
      return { width: 1366, height: 768 };
    }
    try {
      const parsed = JSON.parse(raw) as { width?: unknown; height?: unknown };
      const width = Number(parsed.width);
      const height = Number(parsed.height);
      if (Number.isInteger(width) && width > 0 && Number.isInteger(height) && height > 0) {
        return { width, height };
      }
      return { width: 1366, height: 768 };
    } catch {
      return { width: 1366, height: 768 };
    }
  });
  const [isCanvasDialogOpen, setIsCanvasDialogOpen] = useState(false);
  const [customCanvasDraft, setCustomCanvasDraft] = useState<{ width: string; height: string }>(() => ({
    width: '1366',
    height: '768',
  }));
  const [canvasDialogError, setCanvasDialogError] = useState<string | null>(null);
  const [buckets, setBuckets] = useState<AgingBucketDef[]>(() => loadStoredBuckets());
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isThemePopoverOpen, setIsThemePopoverOpen] = useState(false);
  const [bucketDraft, setBucketDraft] = useState<BucketDraft[]>(() =>
    loadStoredBuckets().map(toDraft)
  );
  const [bucketError, setBucketError] = useState<string | null>(null);
  const [dragBucketId, setDragBucketId] = useState<string | null>(null);
  const [nameSuggestionDialog, setNameSuggestionDialog] =
    useState<NameSuggestionDialogState | null>(null);
  const [validationSuggestions, setValidationSuggestions] = useState<ValidationSuggestionItem[]>([]);
  const [validationSuggestionIndex, setValidationSuggestionIndex] = useState(0);
  const [validationPassed, setValidationPassed] = useState(false);
  const [validatedBucketIds, setValidatedBucketIds] = useState<Set<string>>(new Set());
  const [editorBaselineBuckets, setEditorBaselineBuckets] = useState<AgingBucketDef[]>([]);
  const [uiTheme, setUiTheme] = useState<ResolvedUiTheme>({
    pageBackground: '#f8fafc',
    pageText: '#0f172a',
    cardBackground: '#ffffff',
    cardShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
    buttonBackground: '#ffffff',
    buttonText: '#0f172a',
    buttonBorder: '#cbd5e1',
    hoverColor: '#22c55e',
    fontFamily: 'Helvetica, Arial, sans-serif',
    modalOverlayBackground: 'rgba(15, 23, 42, 0.45)',
    statusDanger: '#dc2626',
    statusSuccess: '#16a34a',
    overlapPalette: [
      { border: '#dc2626', background: '#fee2e2' },
      { border: '#d97706', background: '#ffedd5' },
      { border: '#0891b2', background: '#cffafe' },
      { border: '#7c3aed', background: '#ede9fe' },
      { border: '#16a34a', background: '#dcfce7' },
      { border: '#be185d', background: '#fce7f3' },
    ],
    tooltipTheme: 'light',
  });
  const pageMaxWidth = getPageMaxWidthByCanvasMode(canvasSizeMode, customCanvasSize);

  const handleThemeCatalogResolved = (catalog: ThemeOption[], defaultTheme: string) => {
    if (catalog.length > 0) {
      setThemeOptions(catalog);
      setTheme((currentTheme) => {
        const hasCurrent = catalog.some((entry) => entry.key === currentTheme);
        return hasCurrent ? currentTheme : defaultTheme;
      });
    }
  };

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(REPORT_DATE_STORAGE_KEY, reportDate);
  }, [reportDate]);

  useEffect(() => {
    setReportDateDraft(formatIsoDateForLocale(reportDate));
  }, [reportDate]);

  useEffect(() => {
    window.localStorage.setItem(BUCKET_STORAGE_KEY, JSON.stringify(buckets));
  }, [buckets]);

  useEffect(() => {
    window.localStorage.setItem(CANVAS_SIZE_STORAGE_KEY, canvasSizeMode);
  }, [canvasSizeMode]);

  useEffect(() => {
    window.localStorage.setItem(CANVAS_CUSTOM_SIZE_STORAGE_KEY, JSON.stringify(customCanvasSize));
  }, [customCanvasSize]);

  useEffect(() => {
    if (!isThemePopoverOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (themePopoverRef.current?.contains(target) || themeButtonRef.current?.contains(target)) {
        return;
      }
      setIsThemePopoverOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsThemePopoverOpen(false);
      }
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isThemePopoverOpen]);

  useEffect(() => {
    if (!isEditorOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (Date.now() < suppressEditorCloseUntilRef.current) {
        return;
      }
      if (nameSuggestionDialog) {
        return;
      }
      const target = event.target as Node;
      if (bucketDialogRef.current?.contains(target)) {
        return;
      }
      closeBucketEditor();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (Date.now() < suppressEditorCloseUntilRef.current) {
        return;
      }
      if (nameSuggestionDialog) {
        return;
      }
      if (event.key === 'Escape') {
        closeBucketEditor();
      }
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isEditorOpen, nameSuggestionDialog]);

  useEffect(() => {
    if (!isCanvasDialogOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (canvasDialogRef.current?.contains(target)) {
        return;
      }
      setIsCanvasDialogOpen(false);
      setCanvasDialogError(null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCanvasDialogOpen(false);
        setCanvasDialogError(null);
      }
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isCanvasDialogOpen]);

  useEffect(() => {
    if (!nameSuggestionDialog) {
      return;
    }

    return undefined;
  }, [nameSuggestionDialog]);

  const parseDraftBuckets = (draft: BucketDraft[]) => {
    const parsedBuckets = draft.map((bucket, index) => {
      const name = bucket.name.trim();
      const primaryValue = parseInteger(bucket.primary.value);
      const secondaryValue = parseInteger(bucket.secondary.value);

      if (!name) {
        throw new Error(`Bucket ${index + 1} name is required.`);
      }

      if (primaryValue === null) {
        throw new Error(`Bucket ${index + 1} primary condition value is required.`);
      }

      const conditions: Array<{ operator: BucketOperator; value: number }> = [
        {
          operator: bucket.primary.operator,
          value: primaryValue,
        },
      ];

      if (bucket.secondary.enabled) {
        if (secondaryValue === null) {
          throw new Error(`Bucket ${index + 1} secondary condition value is required.`);
        }

        conditions.push({
          operator: bucket.secondary.operator,
          value: secondaryValue,
        });
      }

      return {
        id: bucket.id,
        name,
        isSpecial: isDefaultBucketId(bucket.id) ? false : bucket.isSpecial,
        combinator:
          !isDefaultBucketId(bucket.id) && bucket.isSpecial ? bucket.combinator : 'AND',
        conditions,
      };
    });

    if (parsedBuckets.length === 0) {
      throw new Error('At least one bucket is required.');
    }

    return parsedBuckets;
  };

  let parsedDraftBuckets: AgingBucketDef[] = [];
  let overlapMeta: OverlapMetadata = {
    overlapIds: new Set<string>(),
    colorByBucketId: new Map<string, OverlapColorToken>(),
  };
  let draftValidationError: string | null = null;

  try {
    parsedDraftBuckets = parseDraftBuckets(bucketDraft);
    const overlapPalette =
      uiTheme.overlapPalette && uiTheme.overlapPalette.length > 0
        ? uiTheme.overlapPalette
        : [{ border: uiTheme.statusDanger, background: uiTheme.cardBackground }];
    overlapMeta = detectOverlaps(parsedDraftBuckets, overlapPalette);
  } catch (error) {
    draftValidationError = error instanceof Error ? error.message : 'Invalid buckets.';
  }

  const openBucketEditor = () => {
    const nextDraft = buckets.map(toDraft);
    setBucketDraft(nextDraft);
    setEditorBaselineBuckets(
      buckets.map((bucket) => ({
        ...bucket,
        conditions: bucket.conditions.map((condition) => ({ ...condition })),
      }))
    );
    setBucketError(null);
    setValidationPassed(false);
    setValidatedBucketIds(new Set());
    setValidationSuggestions([]);
    setValidationSuggestionIndex(0);
    setNameSuggestionDialog(null);
    setIsEditorOpen(true);
  };

  const closeBucketEditor = () => {
    setIsEditorOpen(false);
    setBucketError(null);
    setDragBucketId(null);
    setValidationSuggestions([]);
    setValidationSuggestionIndex(0);
    setValidationPassed(false);
    setValidatedBucketIds(new Set());
    setNameSuggestionDialog(null);
  };

  const applyBucketChanges = () => {
    if (!validationPassed) {
      setBucketError('Please validate bucket changes before applying.');
      return;
    }

    try {
      const parsed = parseDraftBuckets(bucketDraft);
      setBuckets(parsed);
      setBucketError(null);
      setIsEditorOpen(false);
    } catch (error) {
      setBucketError(error instanceof Error ? error.message : 'Failed to apply bucket changes.');
    }
  };

  const toConditionSignature = (bucket: AgingBucketDef) =>
    JSON.stringify(
      bucket.conditions.map((condition) => ({
        operator: condition.operator,
        value: condition.value,
      }))
    );

  const buildNameSuggestionFromBucket = (bucket: AgingBucketDef) => {
    const first = bucket.conditions[0];
    if (!first) {
      return null;
    }
    const second = bucket.conditions[1];
    return buildConditionName(first, second, bucket.combinator);
  };

  const openSuggestionAtIndex = (
    suggestions: ValidationSuggestionItem[],
    index: number,
    draftSource: BucketDraft[]
  ) => {
    if (suggestions.length === 0) {
      setNameSuggestionDialog(null);
      return;
    }

    const safeIndex = Math.min(Math.max(index, 0), suggestions.length - 1);
    const next = suggestions[safeIndex];
    const bucket = draftSource.find((entry) => entry.id === next.bucketId);
    setValidationSuggestionIndex(safeIndex);
    setNameSuggestionDialog({
      bucketId: next.bucketId,
      suggestedName: next.suggestedName,
      customNameDraft: bucket?.name ?? next.suggestedName,
      isCustomMode: false,
      error: null,
    });
  };

  const completeValidation = (draftSource: BucketDraft[]) => {
    setValidationPassed(true);
    setBucketError(null);
    setValidationSuggestions([]);
    setValidationSuggestionIndex(0);
    setNameSuggestionDialog(null);
    setValidatedBucketIds(new Set(draftSource.map((bucket) => bucket.id)));
  };

  const runValidation = () => {
    if (draftValidationError) {
      setBucketError(draftValidationError);
      setValidationPassed(false);
      setValidatedBucketIds(new Set());
      setValidationSuggestions([]);
      setNameSuggestionDialog(null);
      return;
    }

    if (overlapMeta.overlapIds.size > 0) {
      setBucketError('Validation failed: overlapping bucket bounds detected. Please adjust and retry.');
      setValidationPassed(false);
      setValidatedBucketIds(new Set());
      setValidationSuggestions([]);
      setNameSuggestionDialog(null);
      return;
    }

    const baselineById = new Map(editorBaselineBuckets.map((bucket) => [bucket.id, bucket]));
    const suggestions: ValidationSuggestionItem[] = [];

    for (const bucket of parsedDraftBuckets) {
      const baseline = baselineById.get(bucket.id);
      const changedBounds = !baseline || toConditionSignature(baseline) !== toConditionSignature(bucket);
      if (!changedBounds) {
        continue;
      }

      const suggestedName = buildNameSuggestionFromBucket(bucket);
      if (!suggestedName || suggestedName === bucket.name) {
        continue;
      }

      suggestions.push({
        bucketId: bucket.id,
        suggestedName,
      });
    }

    setBucketError(null);
    setValidationPassed(false);
    setValidatedBucketIds(new Set());

    if (suggestions.length === 0) {
      completeValidation(bucketDraft);
      return;
    }

    setValidationSuggestions(suggestions);
    openSuggestionAtIndex(suggestions, 0, bucketDraft);
  };

  const updateBucketDraftName = (id: string, value: string) => {
    setValidationPassed(false);
    setValidatedBucketIds(new Set());
    setBucketDraft((current) =>
      current.map((bucket) => {
        if (bucket.id !== id) {
          return bucket;
        }

        return {
          ...bucket,
          name: value,
          pendingSuggestedName: null,
        };
      })
    );
  };

  const updateBucketCondition = (
    id: string,
    slot: 'primary' | 'secondary',
    patch: Partial<BucketConditionDraft>
  ) => {
    setValidationPassed(false);
    setValidatedBucketIds(new Set());
    setBucketDraft((current) =>
      current.map((bucket) => {
        if (bucket.id !== id) {
          return bucket;
        }

        const nextDraft = {
          ...bucket,
          [slot]: {
            ...bucket[slot],
            ...patch,
          },
        };

        const firstValue = parseInteger(nextDraft.primary.value);
        const secondValue = parseInteger(nextDraft.secondary.value);

        if (firstValue !== null) {
          const first = {
            operator: nextDraft.primary.operator,
            value: firstValue,
          };
          const second =
            nextDraft.secondary.enabled && secondValue !== null
              ? {
                  operator: nextDraft.secondary.operator,
                  value: secondValue,
                }
              : undefined;
          const suggestedName = buildConditionName(first, second, nextDraft.combinator);
          if (suggestedName !== nextDraft.name) {
            nextDraft.pendingSuggestedName = suggestedName;
          } else {
            nextDraft.pendingSuggestedName = null;
          }
        }

        return nextDraft;
      })
    );
  };

  const addBucket = () => {
    setValidationPassed(false);
    setValidatedBucketIds(new Set());
    const nextId = `b${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setBucketDraft((current) => [
      ...current,
      {
        id: nextId,
        name: '',
        isSpecial: false,
        combinator: 'AND',
        isNew: true,
        pendingSuggestedName: null,
        primary: {
          operator: '>=',
          value: '',
          enabled: true,
        },
        secondary: {
          operator: '<=',
          value: '',
          enabled: false,
        },
      },
    ]);
  };

  const restoreDefaultBuckets = () => {
    setValidationPassed(false);
    setValidatedBucketIds(new Set());
    setBucketDraft(DEFAULT_BUCKETS.map(toDraft));
    setBucketError(null);
  };

  const deleteBucket = (id: string) => {
    setValidationPassed(false);
    setValidatedBucketIds(new Set());
    setBucketDraft((current) => current.filter((bucket) => bucket.id !== id));
  };

  const updateBucketCombinator = (id: string, combinator: BucketCombinator) => {
    setValidationPassed(false);
    setValidatedBucketIds(new Set());
    setBucketDraft((current) =>
      current.map((bucket) => {
        if (bucket.id !== id) {
          return bucket;
        }

        if (!bucket.isSpecial) {
          return {
            ...bucket,
            combinator: 'AND',
          };
        }

        const firstValue = parseInteger(bucket.primary.value);
        const secondValue = parseInteger(bucket.secondary.value);
        const next = { ...bucket, combinator };

        if (firstValue !== null) {
          const first = {
            operator: next.primary.operator,
            value: firstValue,
          };
          const second =
            next.secondary.enabled && secondValue !== null
              ? {
                  operator: next.secondary.operator,
                  value: secondValue,
                }
              : undefined;
          const suggestedName = buildConditionName(first, second, combinator);
          if (suggestedName !== next.name) {
            next.pendingSuggestedName = suggestedName;
          } else {
            next.pendingSuggestedName = null;
          }
        }

        return next;
      })
    );
  };

  const acceptSuggestedName = (id: string) => {
    let nextDraft = bucketDraft;
    setBucketDraft((current) => {
      nextDraft = current.map((bucket) => {
        if (bucket.id !== id || !bucket.pendingSuggestedName) {
          return bucket;
        }
        return {
          ...bucket,
          name: bucket.pendingSuggestedName,
          pendingSuggestedName: null,
          isNew: false,
        };
      });
      return nextDraft;
    });
    const currentIndex = validationSuggestionIndex;
    const nextSuggestions = validationSuggestions.filter((entry) => entry.bucketId !== id);

    suppressEditorCloseUntilRef.current = Date.now() + 250;
    if (nextSuggestions.length === 0) {
      completeValidation(nextDraft);
      return;
    }

    setValidationSuggestions(nextSuggestions);
    openSuggestionAtIndex(nextSuggestions, Math.min(currentIndex, nextSuggestions.length - 1), nextDraft);
  };

  const keepCurrentName = (id: string) => {
    let nextDraft = bucketDraft;
    setBucketDraft((current) => {
      nextDraft = current.map((bucket) => {
        if (bucket.id !== id) {
          return bucket;
        }
        return {
          ...bucket,
          pendingSuggestedName: null,
          isNew: false,
        };
      });
      return nextDraft;
    });
    const currentIndex = validationSuggestionIndex;
    const nextSuggestions = validationSuggestions.filter((entry) => entry.bucketId !== id);

    suppressEditorCloseUntilRef.current = Date.now() + 250;
    if (nextSuggestions.length === 0) {
      completeValidation(nextDraft);
      return;
    }

    setValidationSuggestions(nextSuggestions);
    openSuggestionAtIndex(nextSuggestions, Math.min(currentIndex, nextSuggestions.length - 1), nextDraft);
  };

  const navigateNameSuggestion = (delta: -1 | 1) => {
    if (validationSuggestions.length === 0) {
      return;
    }
    const nextIndex = Math.min(
      Math.max(validationSuggestionIndex + delta, 0),
      validationSuggestions.length - 1
    );
    openSuggestionAtIndex(validationSuggestions, nextIndex, bucketDraft);
  };

  const startEnterCustomName = () => {
    setNameSuggestionDialog((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        isCustomMode: true,
        error: null,
      };
    });
  };

  const backToNameChoices = () => {
    setNameSuggestionDialog((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        isCustomMode: false,
        error: null,
      };
    });
  };

  const updateCustomNameDraft = (value: string) => {
    setNameSuggestionDialog((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        customNameDraft: value,
        error: null,
      };
    });
  };

  const applyCustomName = () => {
    if (!nameSuggestionDialog) {
      return;
    }

    const customName = nameSuggestionDialog.customNameDraft.trim();
    if (!customName) {
      setNameSuggestionDialog((current) =>
        current
          ? {
              ...current,
              error: 'Custom name is required.',
            }
          : current
      );
      return;
    }

    let nextDraft = bucketDraft;
    setBucketDraft((current) => {
      nextDraft = current.map((bucket) => {
        if (bucket.id !== nameSuggestionDialog.bucketId) {
          return bucket;
        }

        return {
          ...bucket,
          name: customName,
          pendingSuggestedName: null,
          isNew: false,
        };
      });
      return nextDraft;
    });
    const currentIndex = validationSuggestionIndex;
    const nextSuggestions = validationSuggestions.filter(
      (entry) => entry.bucketId !== nameSuggestionDialog.bucketId
    );

    suppressEditorCloseUntilRef.current = Date.now() + 250;
    if (nextSuggestions.length === 0) {
      completeValidation(nextDraft);
      return;
    }

    setValidationSuggestions(nextSuggestions);
    openSuggestionAtIndex(nextSuggestions, Math.min(currentIndex, nextSuggestions.length - 1), nextDraft);
  };

  const updateBucketSpecial = (id: string, isSpecial: boolean) => {
    setValidationPassed(false);
    setValidatedBucketIds(new Set());
    setBucketDraft((current) =>
      current.map((bucket) => {
        if (bucket.id !== id) {
          return bucket;
        }

        const nextCombinator = isSpecial ? bucket.combinator : 'AND';
        const firstValue = parseInteger(bucket.primary.value);
        const secondValue = parseInteger(bucket.secondary.value);
        const next = {
          ...bucket,
          isSpecial,
          combinator: nextCombinator,
        };

        if (firstValue !== null) {
          const first = {
            operator: next.primary.operator,
            value: firstValue,
          };
          const second =
            next.secondary.enabled && secondValue !== null
              ? {
                  operator: next.secondary.operator,
                  value: secondValue,
                }
              : undefined;
          const suggestedName = buildConditionName(first, second, nextCombinator);
          if (suggestedName !== next.name) {
            next.pendingSuggestedName = suggestedName;
          } else {
            next.pendingSuggestedName = null;
          }
        }

        return next;
      })
    );
  };

  const handleDragStart = (id: string) => {
    setDragBucketId(id);
  };

  const openCustomCanvasDialog = () => {
    setCustomCanvasDraft({
      width: String(customCanvasSize.width),
      height: String(customCanvasSize.height),
    });
    setCanvasDialogError(null);
    setIsCanvasDialogOpen(true);
  };

  const closeCustomCanvasDialog = () => {
    setIsCanvasDialogOpen(false);
    setCanvasDialogError(null);
  };

  const applyCustomCanvasSize = () => {
    const width = parsePositiveInt(customCanvasDraft.width);
    const height = parsePositiveInt(customCanvasDraft.height);

    if (width === null || height === null) {
      setCanvasDialogError('Width and height must be positive whole numbers.');
      return;
    }

    if (width < customCanvasBounds.minWidth || height < customCanvasBounds.minHeight) {
      setCanvasDialogError(
        `Minimum size is ${customCanvasBounds.minWidth} x ${customCanvasBounds.minHeight}.`
      );
      return;
    }

    if (width > customCanvasBounds.maxWidth || height > customCanvasBounds.maxHeight) {
      setCanvasDialogError(
        `Maximum for your screen is ${customCanvasBounds.maxWidth} x ${customCanvasBounds.maxHeight}.`
      );
      return;
    }

    setCustomCanvasSize({ width, height });
    setCanvasSizeMode('custom-pixels');
    closeCustomCanvasDialog();
  };

  const handleCanvasSizeModeChange = (value: CanvasSizeMode) => {
    if (value === 'custom-pixels') {
      openCustomCanvasDialog();
      return;
    }
    setCanvasSizeMode(value);
  };

  const validationSuggestionCount = validationSuggestions.length;
  const validationSuggestionPosition =
    validationSuggestionCount > 0 ? validationSuggestionIndex + 1 : 0;
  const activeSuggestionBucket = nameSuggestionDialog
    ? bucketDraft.find((entry) => entry.id === nameSuggestionDialog.bucketId)
    : undefined;
  const activeSuggestionBounds = activeSuggestionBucket
    ? activeSuggestionBucket.secondary.enabled
      ? `${activeSuggestionBucket.primary.operator} ${activeSuggestionBucket.primary.value || '?'} ${activeSuggestionBucket.combinator} ${activeSuggestionBucket.secondary.operator} ${activeSuggestionBucket.secondary.value || '?'}`
      : `${activeSuggestionBucket.primary.operator} ${activeSuggestionBucket.primary.value || '?'}`
    : '-';

  return (
    <>
      <style>{`
        .date-picker-hidden-native {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
          pointer-events: none;
          border: 0;
          padding: 0;
          margin: 0;
        }
      `}</style>
      <div
        className="ar-aging-page"
        style={{
          boxSizing: 'border-box',
          padding: 'clamp(16px, 3vw, 32px)',
          width: '100%',
          maxWidth: pageMaxWidth,
          margin: '0 auto',
          minHeight: '100vh',
          background: uiTheme.pageBackground,
          color: uiTheme.pageText,
          fontFamily: uiTheme.fontFamily,
          transition: 'background-color 200ms ease, color 200ms ease',
        }}
      >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, marginBottom: 12 }}>
        <div style={{ position: 'relative' }}>
          <button
            ref={themeButtonRef}
            type="button"
            onClick={() => setIsThemePopoverOpen((open) => !open)}
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
                      onChange={(event) => {
                        setTheme(event.target.value);
                        setIsThemePopoverOpen(false);
                      }}
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
                      onChange={(event) =>
                        handleCanvasSizeModeChange(event.target.value as CanvasSizeMode)
                      }
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
                      {CANVAS_SIZE_OPTIONS_SORTED.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </section>
              </div>
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14 }}>
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
              onChange={(event) => {
                const next = event.target.value;
                setReportDateDraft(next);
                const parsedIso = parseLocaleDateToIso(next, localeDateMeta);
                if (parsedIso) {
                  setReportDate(parsedIso);
                }
              }}
              onBlur={() => {
                const parsedIso = parseLocaleDateToIso(reportDateDraft, localeDateMeta);
                if (!parsedIso) {
                  setReportDateDraft(formatIsoDateForLocale(reportDate));
                }
              }}
              aria-label="Select report date"
              placeholder={localeDateMeta.placeholder}
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
              onChange={(event) => {
                const picked = event.target.value;
                if (isValidIsoDate(picked)) {
                  setReportDate(picked);
                  setReportDateDraft(formatIsoDateForLocale(picked));
                }
              }}
              tabIndex={-1}
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => {
                const input = reportDatePickerRef.current;
                if (!input) {
                  return;
                }

                const pickerCapable = input as HTMLInputElement & { showPicker?: () => void };
                if (pickerCapable.showPicker) {
                  pickerCapable.showPicker();
                  return;
                }

                input.focus();
                input.click();
              }}
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
          <button
            type="button"
            onClick={openBucketEditor}
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
        </div>
      </div>
      <h1 style={{ marginTop: 0, marginBottom: 20, textAlign: 'center' }}>AR Aging</h1>
      <ARAgingBucketChart
        theme={theme}
        reportDate={reportDate}
        buckets={buckets}
        canvasSizeMode={canvasSizeMode}
        customCanvasSize={customCanvasSize}
        onThemeCatalogResolved={handleThemeCatalogResolved}
        onUiThemeResolved={setUiTheme}
      />
      {isCanvasDialogOpen ? (
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
            ref={canvasDialogRef}
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
              Allowed range: {customCanvasBounds.minWidth} x {customCanvasBounds.minHeight} to{' '}
              {customCanvasBounds.maxWidth} x {customCanvasBounds.maxHeight}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.85 }}>Width (px)</span>
                <input
                  value={customCanvasDraft.width}
                  onChange={(event) => {
                    setCustomCanvasDraft((current) => ({ ...current, width: event.target.value }));
                    setCanvasDialogError(null);
                  }}
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
                  value={customCanvasDraft.height}
                  onChange={(event) => {
                    setCustomCanvasDraft((current) => ({ ...current, height: event.target.value }));
                    setCanvasDialogError(null);
                  }}
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
            {canvasDialogError ? (
              <p style={{ marginTop: 10, marginBottom: 0, color: uiTheme.statusDanger, fontWeight: 600 }}>
                {canvasDialogError}
              </p>
            ) : null}
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={closeCustomCanvasDialog}
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
                onClick={applyCustomCanvasSize}
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
      ) : null}
      {isEditorOpen ? (
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
            <h2 style={{ marginTop: 0, marginBottom: 12 }}>Edit Aging Buckets</h2>
            <p style={{ marginTop: 0, marginBottom: 16, fontSize: 13, opacity: 0.85 }}>
              Buckets can be renamed, and you can adjust upper and lower bounds. Single-condition
              buckets are supported. For non-aged logic (for example retainage/escrow), create a new
              bucket and mark it as special to enable non days past due filters & OR conditions.
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
                      handleDragStart(bucket.id);
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
                      setValidationPassed(false);
                      setValidatedBucketIds(new Set());
                      setBucketDraft((current) => reorderById(current, sourceId, bucket.id));
                      setDragBucketId(null);
                    }}
                    onDragEnd={() => setDragBucketId(null)}
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
                        onChange={(event) => updateBucketDraftName(bucket.id, event.target.value)}
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
                            onChange={(event) => updateBucketSpecial(bucket.id, event.target.checked)}
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
                            updateBucketCondition(bucket.id, 'primary', {
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
                          {OPERATOR_OPTIONS.map((option) => (
                            <option key={`p-${bucket.id}-${option}`} value={option}>
                              {OPERATOR_LABELS[option]}
                            </option>
                          ))}
                        </select>
                        <input
                          value={bucket.primary.value}
                          onChange={(event) =>
                            updateBucketCondition(bucket.id, 'primary', { value: event.target.value })
                          }
                          onMouseEnter={(event) => event.currentTarget.focus()}
                          aria-label={`Bucket ${index + 1} primary value`}
                          style={{
                            border: '1px solid',
                            borderColor: overlapToken?.border ?? uiTheme.buttonBorder,
                            background: uiTheme.buttonBackground,
                            color: uiTheme.buttonText,
                            boxShadow: overlapToken
                              ? `inset 0 0 0 1px ${overlapToken.border}33`
                              : 'none',
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
                                updateBucketCombinator(bucket.id, event.target.value as BucketCombinator)
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
                              {COMBINATOR_OPTIONS.map((option) => (
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
                                updateBucketCondition(bucket.id, 'secondary', {
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
                              {OPERATOR_OPTIONS.map((option) => (
                                <option key={`s-${bucket.id}-${option}`} value={option}>
                                  {OPERATOR_LABELS[option]}
                                </option>
                              ))}
                            </select>
                            <input
                              value={bucket.secondary.value}
                              onChange={(event) =>
                                updateBucketCondition(bucket.id, 'secondary', { value: event.target.value })
                              }
                              onMouseEnter={(event) => event.currentTarget.focus()}
                              aria-label={`Bucket ${index + 1} secondary value`}
                              style={{
                                border: '1px solid',
                                borderColor: overlapToken?.border ?? uiTheme.buttonBorder,
                                background: uiTheme.buttonBackground,
                                color: uiTheme.buttonText,
                                boxShadow: overlapToken
                                  ? `inset 0 0 0 1px ${overlapToken.border}33`
                                  : 'none',
                                borderRadius: 8,
                                padding: '8px 8px',
                                fontSize: 13,
                              }}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateBucketCondition(bucket.id, 'secondary', {
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
                            updateBucketCondition(bucket.id, 'secondary', {
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
                              color: '#fff',
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
                      onClick={() => deleteBucket(bucket.id)}
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
                  onClick={addBucket}
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
                  Add Bucket
                </button>
                <button
                  type="button"
                  onClick={restoreDefaultBuckets}
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
                  Restore Defaults
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={runValidation}
                  disabled={draftValidationError !== null}
                  style={{
                    border: '1px solid',
                    borderColor: draftValidationError ? uiTheme.buttonBorder : uiTheme.buttonBorder,
                    borderRadius: 8,
                    padding: '8px 12px',
                    background: draftValidationError ? uiTheme.cardBackground : uiTheme.buttonBackground,
                    color: draftValidationError ? uiTheme.buttonBorder : uiTheme.buttonText,
                    cursor: draftValidationError ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Validate
                </button>
                <button
                  type="button"
                  onClick={closeBucketEditor}
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
                  onClick={applyBucketChanges}
                  disabled={draftValidationError !== null || !validationPassed}
                  style={{
                    border: '1px solid',
                    borderColor:
                      draftValidationError || !validationPassed ? uiTheme.buttonBorder : uiTheme.buttonBorder,
                    borderRadius: 8,
                    padding: '8px 12px',
                    background:
                      draftValidationError || !validationPassed ? uiTheme.cardBackground : uiTheme.buttonText,
                    color: draftValidationError || !validationPassed ? uiTheme.buttonBorder : uiTheme.buttonBackground,
                    cursor: draftValidationError || !validationPassed ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Apply
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
                Overlapping bucket conditions must be fixed before validation can pass.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      {isEditorOpen && nameSuggestionDialog ? (
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
            <h3 style={{ margin: 0 }}>Update Bucket Name?</h3>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.86 }}>
              Bounds changed, so an auto-generated name is available.
            </p>
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
                  onClick={() => navigateNameSuggestion(-1)}
                  disabled={validationSuggestionIndex <= 0}
                  style={{
                    border: '1px solid',
                    borderColor: uiTheme.buttonBorder,
                    borderRadius: 6,
                    width: 28,
                    height: 28,
                    background:
                      validationSuggestionIndex <= 0 ? uiTheme.cardBackground : uiTheme.buttonBackground,
                    color:
                      validationSuggestionIndex <= 0 ? uiTheme.buttonBorder : uiTheme.buttonText,
                    cursor: validationSuggestionIndex <= 0 ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Previous bucket"
                  title="Previous bucket"
                >
                  <ArrowLeftRegular fontSize={14} />
                </button>
                <button
                  type="button"
                  onClick={() => navigateNameSuggestion(1)}
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
                    cursor:
                      validationSuggestionIndex >= validationSuggestionCount - 1
                        ? 'not-allowed'
                        : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="Next bucket"
                  title="Next bucket"
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
                Bounds: <strong>{activeSuggestionBounds}</strong>
              </span>
              <span>Current: {bucketDraft.find((entry) => entry.id === nameSuggestionDialog.bucketId)?.name ?? ''}</span>
              <span>
                Suggested: <strong>{nameSuggestionDialog.suggestedName}</strong>
              </span>
            </div>
            {nameSuggestionDialog.isCustomMode ? (
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.86 }}>Enter Custom Name</span>
                <input
                  value={nameSuggestionDialog.customNameDraft}
                  onChange={(event) => updateCustomNameDraft(event.target.value)}
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
                    onClick={backToNameChoices}
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
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={applyCustomName}
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
                    Apply Name
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => acceptSuggestedName(nameSuggestionDialog.bucketId)}
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
                    Use Suggested
                  </button>
                  <button
                    type="button"
                    onClick={() => keepCurrentName(nameSuggestionDialog.bucketId)}
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
                    Keep Current
                  </button>
                  <button
                    type="button"
                    onClick={startEnterCustomName}
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
                    Enter New Name
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </>
  );
}
