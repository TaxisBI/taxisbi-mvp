import { useEffect, useMemo, useState, type MutableRefObject } from 'react';

export type LocaleDateMeta = {
  order: Array<'day' | 'month' | 'year'>;
  placeholder: string;
};

export function getLocaleDateMeta(): LocaleDateMeta {
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

export function getTodayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed.toISOString().slice(0, 10) === value;
}

export function formatIsoDateForLocale(isoDate: string) {
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

export function parseLocaleDateToIso(input: string, meta: LocaleDateMeta): string | null {
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

export function useLocalizedDateInput(options: {
  storageKey: string;
  datePickerRef: MutableRefObject<HTMLInputElement | null>;
  defaultIsoDate?: string;
}) {
  const { storageKey, datePickerRef, defaultIsoDate = getTodayIsoDate() } = options;
  const localeDateMeta = useMemo(() => getLocaleDateMeta(), []);

  const [isoDate, setIsoDate] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return defaultIsoDate;
    }
    const stored = window.localStorage.getItem(storageKey);
    return stored && isValidIsoDate(stored) ? stored : defaultIsoDate;
  });
  const [dateDraft, setDateDraft] = useState<string>(() => formatIsoDateForLocale(isoDate));

  useEffect(() => {
    window.localStorage.setItem(storageKey, isoDate);
  }, [isoDate, storageKey]);

  useEffect(() => {
    setDateDraft(formatIsoDateForLocale(isoDate));
  }, [isoDate]);

  const handleDateDraftChange = (nextDraft: string) => {
    setDateDraft(nextDraft);
    const parsedIso = parseLocaleDateToIso(nextDraft, localeDateMeta);
    if (parsedIso) {
      setIsoDate(parsedIso);
    }
  };

  const handleDateDraftBlur = () => {
    const parsedIso = parseLocaleDateToIso(dateDraft, localeDateMeta);
    if (!parsedIso) {
      setDateDraft(formatIsoDateForLocale(isoDate));
    }
  };

  const handleDatePickerChange = (picked: string) => {
    if (isValidIsoDate(picked)) {
      setIsoDate(picked);
      setDateDraft(formatIsoDateForLocale(picked));
    }
  };

  const openDatePicker = () => {
    const input = datePickerRef.current;
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
  };

  return {
    localeDateMeta,
    isoDate,
    dateDraft,
    setIsoDate,
    setDateDraft,
    handleDateDraftChange,
    handleDateDraftBlur,
    handleDatePickerChange,
    openDatePicker,
  };
}
