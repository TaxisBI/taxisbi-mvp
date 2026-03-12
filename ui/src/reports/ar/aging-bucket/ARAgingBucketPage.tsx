import { useEffect, useState } from 'react';
import ARAgingBucketChart, {
  ResolvedUiTheme,
  ThemeOption,
} from './components/ARAgingBucketChart';

const THEME_STORAGE_KEY = 'taxisbi.ui.theme';
const REPORT_DATE_STORAGE_KEY = 'taxisbi.ui.reportDate';

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

export default function ARAgingBucketPage() {
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
  const [uiTheme, setUiTheme] = useState<ResolvedUiTheme>({
    pageBackground: '#f8fafc',
    pageText: '#0f172a',
    cardBackground: '#ffffff',
    cardShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
    buttonBackground: '#ffffff',
    buttonText: '#0f172a',
    buttonBorder: '#cbd5e1',
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

  return (
    <div
      style={{
        padding: '32px 40px',
        maxWidth: 1320,
        margin: '0 auto',
        minHeight: '100vh',
        background: uiTheme.pageBackground,
        color: uiTheme.pageText,
        transition: 'background-color 200ms ease, color 200ms ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, marginBottom: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Report Date</span>
          <input
            type="date"
            value={reportDate}
            onChange={(event) => setReportDate(event.target.value)}
            aria-label="Select report date"
            style={{
              border: '1px solid',
              borderColor: uiTheme.buttonBorder,
              background: uiTheme.buttonBackground,
              color: uiTheme.buttonText,
              colorScheme: uiTheme.tooltipTheme,
              borderRadius: 8,
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          />
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
      </div>
      <h1 style={{ marginTop: 0, marginBottom: 20, textAlign: 'center' }}>AR Aging</h1>
      <ARAgingBucketChart
        theme={theme}
        reportDate={reportDate}
        onThemeCatalogResolved={handleThemeCatalogResolved}
        onUiThemeResolved={setUiTheme}
      />
    </div>
  );
}
