import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AddRegular,
  CalendarRegular,
  DeleteRegular,
  ReOrderDotsVerticalRegular,
  SubtractRegular,
  WarningFilled,
} from '@fluentui/react-icons';
import ARAgingBucketChart, {
  AgingBucketDef,
  ResolvedUiTheme,
  ThemeOption,
} from './components/ARAgingBucketChart';

const THEME_STORAGE_KEY = 'taxisbi.ui.theme';
const REPORT_DATE_STORAGE_KEY = 'taxisbi.ui.reportDate';
const BUCKET_STORAGE_KEY = 'taxisbi.ui.agingBuckets';

type BucketOperator = '=' | '<>' | '>=' | '<=' | '>' | '<';

const OPERATOR_OPTIONS: BucketOperator[] = ['=', '<>', '>=', '<=', '>', '<'];

const OPERATOR_LABELS: Record<BucketOperator, string> = {
  '=': '=',
  '<>': '!=',
  '>=': '>=',
  '<=': '<=',
  '>': '>',
  '<': '<',
};

const DEFAULT_BUCKETS: AgingBucketDef[] = [
  { id: 'b1', name: 'Current', conditions: [{ operator: '<=', value: 0 }] },
  {
    id: 'b2',
    name: '1-30',
    conditions: [
      { operator: '>=', value: 1 },
      { operator: '<=', value: 30 },
    ],
  },
  {
    id: 'b3',
    name: '31-60',
    conditions: [
      { operator: '>=', value: 31 },
      { operator: '<=', value: 60 },
    ],
  },
  {
    id: 'b4',
    name: '61-90',
    conditions: [
      { operator: '>=', value: 61 },
      { operator: '<=', value: 90 },
    ],
  },
  { id: 'b5', name: '91+', conditions: [{ operator: '>', value: 90 }] },
];

type BucketConditionDraft = {
  operator: BucketOperator;
  value: string;
  enabled: boolean;
};

type BucketDraft = {
  id: string;
  name: string;
  primary: BucketConditionDraft;
  secondary: BucketConditionDraft;
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

function conditionLabel(condition: { operator: BucketOperator; value: number }) {
  return `${condition.operator} ${condition.value}`;
}

function buildConditionName(
  primary: { operator: BucketOperator; value: number },
  secondary?: { operator: BucketOperator; value: number }
) {
  if (!secondary) {
    return conditionLabel(primary);
  }

  return `${conditionLabel(primary)} and ${conditionLabel(secondary)}`;
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

          return {
            id: typeof candidate.id === 'string' ? candidate.id : `stored-${index}`,
            name,
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
  return bucket.conditions.every((condition) => conditionMatches(days, condition));
}

function detectOverlaps(buckets: AgingBucketDef[]) {
  const overlapIds = new Set<string>();

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
      }
    }
  }
  return overlapIds;
}

export default function ARAgingBucketPage() {
  const reportDatePickerRef = useRef<HTMLInputElement | null>(null);
  const localeDateMeta = useMemo(() => getLocaleDateMeta(), []);
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
  const [buckets, setBuckets] = useState<AgingBucketDef[]>(() => loadStoredBuckets());
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [bucketDraft, setBucketDraft] = useState<BucketDraft[]>(() =>
    loadStoredBuckets().map(toDraft)
  );
  const [bucketError, setBucketError] = useState<string | null>(null);
  const [dragBucketId, setDragBucketId] = useState<string | null>(null);
  const [uiTheme, setUiTheme] = useState<ResolvedUiTheme>({
    pageBackground: '#f8fafc',
    pageText: '#0f172a',
    cardBackground: '#ffffff',
    cardShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
    buttonBackground: '#ffffff',
    buttonText: '#0f172a',
    buttonBorder: '#cbd5e1',
    fontFamily: 'Helvetica, Arial, sans-serif',
    tooltipTheme: 'light',
  });

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
        conditions,
      };
    });

    if (parsedBuckets.length === 0) {
      throw new Error('At least one bucket is required.');
    }

    return parsedBuckets;
  };

  let parsedDraftBuckets: AgingBucketDef[] = [];
  let overlapBucketIds = new Set<string>();
  let draftValidationError: string | null = null;

  try {
    parsedDraftBuckets = parseDraftBuckets(bucketDraft);
    overlapBucketIds = detectOverlaps(parsedDraftBuckets);
  } catch (error) {
    draftValidationError = error instanceof Error ? error.message : 'Invalid buckets.';
  }

  const openBucketEditor = () => {
    setBucketDraft(buckets.map(toDraft));
    setBucketError(null);
    setIsEditorOpen(true);
  };

  const closeBucketEditor = () => {
    setIsEditorOpen(false);
    setBucketError(null);
    setDragBucketId(null);
  };

  const applyBucketChanges = () => {
    try {
      const parsed = parseDraftBuckets(bucketDraft);
      setBuckets(parsed);
      setBucketError(null);
      setIsEditorOpen(false);
    } catch (error) {
      setBucketError(error instanceof Error ? error.message : 'Failed to apply bucket changes.');
    }
  };

  const updateBucketDraftName = (id: string, value: string) => {
    setBucketDraft((current) =>
      current.map((bucket) => {
        if (bucket.id !== id) {
          return bucket;
        }

        return {
          ...bucket,
          name: value,
        };
      })
    );
  };

  const updateBucketCondition = (
    id: string,
    slot: 'primary' | 'secondary',
    patch: Partial<BucketConditionDraft>
  ) => {
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
          nextDraft.name = buildConditionName(first, second);
        }

        return nextDraft;
      })
    );
  };

  const addBucket = () => {
    const nextId = `b${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setBucketDraft((current) => [
      ...current,
      {
        id: nextId,
        name: '',
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
    setBucketDraft(DEFAULT_BUCKETS.map(toDraft));
    setBucketError(null);
  };

  const deleteBucket = (id: string) => {
    setBucketDraft((current) => current.filter((bucket) => bucket.id !== id));
  };

  const handleDragStart = (id: string) => {
    setDragBucketId(id);
  };

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
          padding: '32px 40px',
          maxWidth: 1320,
          margin: '0 auto',
          minHeight: '100vh',
          background: uiTheme.pageBackground,
          color: uiTheme.pageText,
          fontFamily: uiTheme.fontFamily,
          transition: 'background-color 200ms ease, color 200ms ease',
        }}
      >
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, marginBottom: 12 }}>
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
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Theme</span>
          <select
            value={theme}
            onChange={(event) => setTheme(event.target.value)}
            aria-label="Select chart theme"
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
            {themeOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
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
      <h1 style={{ marginTop: 0, marginBottom: 20, textAlign: 'center' }}>AR Aging</h1>
      <ARAgingBucketChart
        theme={theme}
        reportDate={reportDate}
        buckets={buckets}
        onThemeCatalogResolved={handleThemeCatalogResolved}
        onUiThemeResolved={setUiTheme}
      />
      {isEditorOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: 'min(1100px, 100%)',
              maxHeight: '90vh',
              overflow: 'auto',
              borderRadius: 14,
              background: uiTheme.cardBackground,
              boxShadow: uiTheme.cardShadow,
              padding: 20,
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 12 }}>Edit Aging Buckets</h2>
            <p style={{ marginTop: 0, marginBottom: 16, fontSize: 13, opacity: 0.85 }}>
              Use one or two AND conditions per bucket. You can set open-ended buckets like {'>='} 90
              with a single condition.
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              {bucketDraft.map((bucket, index) => {
                const hasOverlap = overlapBucketIds.has(bucket.id);
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
                      setBucketDraft((current) => reorderById(current, sourceId, bucket.id));
                      setDragBucketId(null);
                    }}
                    onDragEnd={() => setDragBucketId(null)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '40px 132px minmax(560px, 1fr) auto auto',
                      gap: 10,
                      alignItems: 'center',
                      border: dragBucketId === bucket.id ? '1px dashed #64748b' : '1px solid transparent',
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
                    <input
                      value={bucket.name}
                      onChange={(event) => updateBucketDraftName(bucket.id, event.target.value)}
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
                            borderColor: '#94a3b8',
                            borderRadius: 8,
                            background: '#e2e8f0',
                            color: '#0f172a',
                            padding: '8px 8px',
                            fontWeight: 600,
                            fontSize: 14,
                            lineHeight: '18px',
                            letterSpacing: '0.01em',
                            fontFamily: 'Segoe UI, system-ui, sans-serif',
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
                          aria-label={`Bucket ${index + 1} primary value`}
                          style={{
                            border: '1px solid',
                            borderColor: uiTheme.buttonBorder,
                            borderRadius: 8,
                            padding: '8px 8px',
                            fontSize: 13,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.65 }}>AND</span>
                      {bucket.secondary.enabled ? (
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
                              borderColor: '#94a3b8',
                              borderRadius: 8,
                              background: '#e2e8f0',
                              color: '#0f172a',
                              padding: '8px 8px',
                              fontWeight: 600,
                              fontSize: 14,
                              lineHeight: '18px',
                              letterSpacing: '0.01em',
                              fontFamily: 'Segoe UI, system-ui, sans-serif',
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
                            aria-label={`Bucket ${index + 1} secondary value`}
                            style={{
                              border: '1px solid',
                              borderColor: uiTheme.buttonBorder,
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
                          title="Add AND condition"
                          aria-label={`Add secondary condition for bucket ${index + 1}`}
                        >
                          <AddRegular fontSize={14} />
                        </button>
                      )}
                    </div>
                    <div style={{ minHeight: 20, color: '#dc2626', fontSize: 12, fontWeight: 700 }}>
                      {hasOverlap ? (
                        <span title="This range overlaps another bucket">
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              background: '#dc2626',
                              color: '#fff',
                              marginRight: 6,
                              fontSize: 11,
                            }}
                          >
                            <WarningFilled fontSize={12} />
                          </span>
                          Overlap
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
                    background: '#f1f5f9',
                    color: '#0f172a',
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
                  disabled={draftValidationError !== null}
                  style={{
                    border: '1px solid',
                    borderColor: draftValidationError ? '#94a3b8' : '#0f172a',
                    borderRadius: 8,
                    padding: '8px 12px',
                    background: draftValidationError ? '#e2e8f0' : '#0f172a',
                    color: draftValidationError ? '#64748b' : '#ffffff',
                    cursor: draftValidationError ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
            {draftValidationError || bucketError ? (
              <p style={{ marginTop: 10, marginBottom: 0, color: '#dc2626', fontWeight: 600 }}>
                {bucketError ?? draftValidationError}
              </p>
            ) : null}
            {overlapBucketIds.size > 0 && draftValidationError === null ? (
              <p style={{ marginTop: 10, marginBottom: 0, color: '#dc2626', fontWeight: 600 }}>
                Warning: overlapping bucket conditions are allowed, and first matching bucket wins.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      </div>
    </>
  );
}
