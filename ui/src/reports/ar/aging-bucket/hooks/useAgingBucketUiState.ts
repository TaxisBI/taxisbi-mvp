import { useEffect, useState, type MutableRefObject } from 'react';
import type { CanvasSizeMode, ThemeOption } from '../types';
import { useLocalizedDateInput } from '../../../shared/localizedDateInput';
import {
  isCanvasSizeMode,
  parsePositiveInt,
} from '../agingBucketPageUtils';

type CanvasBounds = {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
};

const THEME_STORAGE_KEY = 'taxisbi.ui.theme';
const REPORT_DATE_STORAGE_KEY = 'taxisbi.ui.reportDate';
const CANVAS_SIZE_STORAGE_KEY = 'taxisbi.ui.canvasSizeMode';
const CANVAS_CUSTOM_SIZE_STORAGE_KEY = 'taxisbi.ui.canvasCustomSize';

export function useAgingBucketUiState(options: {
  customCanvasBounds: CanvasBounds;
  onOpenThemeBuilder?: (reportId: 'ar-aging') => void;
  reportDatePickerRef: MutableRefObject<HTMLInputElement | null>;
}) {
  const { customCanvasBounds, onOpenThemeBuilder, reportDatePickerRef } = options;

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
  const {
    localeDateMeta,
    isoDate: reportDate,
    dateDraft: reportDateDraft,
    handleDateDraftChange: handleReportDateDraftChange,
    handleDateDraftBlur: handleReportDateDraftBlur,
    handleDatePickerChange: handleReportDatePickerChange,
    openDatePicker: openReportDatePicker,
  } = useLocalizedDateInput({
    storageKey: REPORT_DATE_STORAGE_KEY,
    datePickerRef: reportDatePickerRef,
  });
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
  const [isThemePopoverOpen, setIsThemePopoverOpen] = useState(false);

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
    window.localStorage.setItem(CANVAS_SIZE_STORAGE_KEY, canvasSizeMode);
  }, [canvasSizeMode]);

  useEffect(() => {
    window.localStorage.setItem(CANVAS_CUSTOM_SIZE_STORAGE_KEY, JSON.stringify(customCanvasSize));
  }, [customCanvasSize]);

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

  const toggleThemePopover = () => {
    setIsThemePopoverOpen((open) => !open);
  };

  const handleThemeSelection = (nextTheme: string) => {
    setTheme(nextTheme);
    setIsThemePopoverOpen(false);
  };

  const handleOpenThemeBuilder = () => {
    setIsThemePopoverOpen(false);
    onOpenThemeBuilder?.('ar-aging');
  };

  return {
    theme,
    themeOptions,
    reportDate,
    reportDateDraft,
    reportDatePlaceholder: localeDateMeta.placeholder,
    canvasSizeMode,
    customCanvasSize,
    isCanvasDialogOpen,
    customCanvasDraft,
    canvasDialogError,
    isThemePopoverOpen,
    setCanvasSizeMode,
    setCustomCanvasDraft,
    setCanvasDialogError,
    setIsCanvasDialogOpen,
    setIsThemePopoverOpen,
    handleThemeCatalogResolved,
    closeCustomCanvasDialog,
    applyCustomCanvasSize,
    handleCanvasSizeModeChange,
    toggleThemePopover,
    handleThemeSelection,
    handleOpenThemeBuilder,
    handleReportDateDraftChange,
    handleReportDateDraftBlur,
    handleReportDatePickerChange,
    openReportDatePicker,
  };
}
