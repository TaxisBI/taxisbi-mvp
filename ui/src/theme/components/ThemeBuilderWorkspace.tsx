import { useEffect, useMemo, useRef, useState } from 'react';
import { ColorStudioToken, StyleStudioToken, ThemeSaveDraft, ThemeBuilderUiTheme } from '../types';
import { hexToRgb, normalizeHexColor, rgbToHex } from '../utils';
import ThemePreviewChart from './ThemePreviewChart';

const FOLDER_STATE_STORAGE_KEY = 'taxisbi.themeBuilder.expandedFolders';

const FONT_FAMILY_OPTIONS = [
  { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica (Default)' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Segoe UI, Tahoma, sans-serif', label: 'Segoe UI' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, Times, serif', label: 'Times New Roman' },
  { value: 'Courier New, Courier, monospace', label: 'Courier New' },
  { value: 'Trebuchet MS, sans-serif', label: 'Trebuchet MS' },
];

const TYPOGRAPHY_OVERRIDE_SECTIONS = [
  {
    key: 'title',
    label: 'Chart Title',
    description: 'Overrides the main chart title above the preview.',
  },
  {
    key: 'legend',
    label: 'Legend',
    description: 'Overrides legend labels and the legend title.',
  },
  {
    key: 'axis',
    label: 'Axis',
    description: 'Overrides axis labels and axis titles.',
  },
  {
    key: 'barLabel',
    label: 'Bar Labels',
    description: 'Overrides the numeric labels drawn above the bars.',
  },
  {
    key: 'tooltip',
    label: 'Tooltip',
    description: 'Controls the preview tooltip card shown under the chart.',
  },
] as const;

const TYPOGRAPHY_BASE_SUFFIXES = [
  'FontFamily',
  'FontWeight',
  'FontStyle',
  'FontSize',
  'FontColor',
] as const;

const TYPOGRAPHY_SHARED_SUFFIXES = [
  ...TYPOGRAPHY_BASE_SUFFIXES,
  'TextRenderMode',
  'TextStrokeColor',
  'TextStrokeWidth',
] as const;

const TOOLTIP_SURFACE_SUFFIXES = [
  'BackgroundColor',
  'BorderColor',
  'BorderWidth',
  'Padding',
] as const;

type TypographySettings = {
  fontFamily: string;
  fontStyle: 'normal' | 'italic';
  fontWeight: 'normal' | 'bold';
  fontSize: number;
  fontColor: string;
  textRenderMode: 'fill' | 'hollow';
  textStrokeColor: string;
  textStrokeWidth: number;
};

function getTypographySettingKey(prefix: string | null, suffix: string) {
  return prefix ? `${prefix}${suffix}` : `${suffix.charAt(0).toLowerCase()}${suffix.slice(1)}`;
}

function getUiStringValue(
  editableThemeUi: Record<string, unknown> | null,
  key: string,
  fallback: string
) {
  const value = editableThemeUi?.[key];
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function getUiNumberValue(
  editableThemeUi: Record<string, unknown> | null,
  key: string,
  fallback: number
) {
  const value = editableThemeUi?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function getUiColorValue(
  editableThemeUi: Record<string, unknown> | null,
  key: string,
  fallback: string
) {
  const value = editableThemeUi?.[key];
  return typeof value === 'string' && normalizeHexColor(value) ? normalizeHexColor(value)! : fallback;
}

function resolveTypographySettings(
  editableThemeUi: Record<string, unknown> | null,
  prefix: string | null,
  fallback?: TypographySettings
): TypographySettings {
  return {
    fontFamily: getUiStringValue(
      editableThemeUi,
      getTypographySettingKey(prefix, 'FontFamily'),
      fallback?.fontFamily ?? 'Helvetica, Arial, sans-serif'
    ),
    fontStyle:
      getUiStringValue(
        editableThemeUi,
        getTypographySettingKey(prefix, 'FontStyle'),
        fallback?.fontStyle ?? 'normal'
      ) === 'italic'
        ? 'italic'
        : 'normal',
    fontWeight:
      getUiStringValue(
        editableThemeUi,
        getTypographySettingKey(prefix, 'FontWeight'),
        fallback?.fontWeight ?? 'normal'
      ) === 'bold'
        ? 'bold'
        : 'normal',
    fontSize: getUiNumberValue(
      editableThemeUi,
      getTypographySettingKey(prefix, 'FontSize'),
      fallback?.fontSize ?? 12
    ),
    fontColor: getUiColorValue(
      editableThemeUi,
      getTypographySettingKey(prefix, 'FontColor'),
      fallback?.fontColor ?? '#111827'
    ),
    textRenderMode:
      getUiStringValue(
        editableThemeUi,
        getTypographySettingKey(prefix, 'TextRenderMode'),
        fallback?.textRenderMode ?? 'fill'
      ) === 'hollow'
        ? 'hollow'
        : 'fill',
    textStrokeColor: getUiColorValue(
      editableThemeUi,
      getTypographySettingKey(prefix, 'TextStrokeColor'),
      fallback?.textStrokeColor ?? '#111827'
    ),
    textStrokeWidth: getUiNumberValue(
      editableThemeUi,
      getTypographySettingKey(prefix, 'TextStrokeWidth'),
      fallback?.textStrokeWidth ?? 1.2
    ),
  };
}

const MANAGED_TYPOGRAPHY_STYLE_KEYS = new Set<string>([
  ...TYPOGRAPHY_SHARED_SUFFIXES.map((suffix) => getTypographySettingKey(null, suffix)),
  ...TYPOGRAPHY_OVERRIDE_SECTIONS.flatMap((section) =>
    TYPOGRAPHY_BASE_SUFFIXES.map((suffix) => getTypographySettingKey(section.key, suffix))
  ),
]);

const MANAGED_WIDTH_STYLE_KEYS = new Set<string>([
  ...TOOLTIP_SURFACE_SUFFIXES.filter((suffix) => suffix === 'BorderWidth' || suffix === 'Padding').map(
    (suffix) => getTypographySettingKey('tooltip', suffix)
  ),
]);

type ThemeBuilderWorkspaceProps = {
  uiTheme: ThemeBuilderUiTheme;
  editableThemeUi: Record<string, unknown> | null;
  colorStudioTokens: ColorStudioToken[];
  styleStudioTokens: StyleStudioToken[];
  activeColorToken: string;
  colorDraftByToken: Record<string, string>;
  themeSaveDraft: ThemeSaveDraft;
  colorStudioError: string | null;
  isSavingTheme: boolean;
  onBackToLanding: () => void;
  onBackToReport: () => void;
  canBackToReport: boolean;
  onSelectToken: (tokenPath: string) => void;
  onClearError: () => void;
  onApplyHexForToken: (tokenPath: string, value: string) => void;
  onApplyStyleValueForToken: (tokenPath: string, value: string) => void;
  onApplyUiSetting: (key: string, value: unknown) => void;
  onClearUiSettings: (keys: string[]) => void;
  onSaveTheme: () => void;
  onUpdateThemeSaveDraft: (patch: Partial<ThemeSaveDraft>) => void;
  toThemeKeyCandidate: (input: string) => string;
};

export default function ThemeBuilderWorkspace({
  uiTheme,
  editableThemeUi,
  colorStudioTokens,
  styleStudioTokens,
  activeColorToken,
  colorDraftByToken,
  themeSaveDraft,
  colorStudioError,
  isSavingTheme,
  onBackToLanding,
  onBackToReport,
  canBackToReport,
  onSelectToken,
  onClearError,
  onApplyHexForToken,
  onApplyStyleValueForToken,
  onApplyUiSetting,
  onClearUiSettings,
  onSaveTheme,
  onUpdateThemeSaveDraft,
  toThemeKeyCandidate,
}: ThemeBuilderWorkspaceProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const wheelDialogRef = useRef<HTMLDivElement | null>(null);
  const saveDialogRef = useRef<HTMLDivElement | null>(null);
  const pickerAnchorRef = useRef<HTMLElement | null>(null);
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [pickerPosition, setPickerPosition] = useState<{
    top: number;
    left: number;
    placement: 'left' | 'right';
    verticalPlacement: 'above' | 'below';
    arrowTop: number;
  } | null>(null);
  const [editorTokenPath, setEditorTokenPath] = useState<string | null>(null);
  const [editorHexDraft, setEditorHexDraft] = useState('#000000');
  const [editorRgbDraft, setEditorRgbDraft] = useState({ r: '0', g: '0', b: '0' });
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') {
      return {};
    }

    try {
      const raw = window.localStorage.getItem(FOLDER_STATE_STORAGE_KEY);
      if (!raw) {
        return {};
      }

      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {};
      }

      return Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>).filter(
          (entry): entry is [string, boolean] => typeof entry[1] === 'boolean'
        )
      );
    } catch {
      return {};
    }
  });
  const [themeType, setThemeType] = useState<'all' | 'monocolor' | 'adjacent' | 'diverging'>('all');
  const [themeTone, setThemeTone] = useState<'light' | 'dark'>('light');
  const [isThemeElementsExpanded, setIsThemeElementsExpanded] = useState(true);
  const [isWidthsSectionExpanded, setIsWidthsSectionExpanded] = useState(true);
  const [isTypographySectionExpanded, setIsTypographySectionExpanded] = useState(true);
  const [isColorsSectionExpanded, setIsColorsSectionExpanded] = useState(true);
  const [expandedTypographyOverrides, setExpandedTypographyOverrides] = useState<Record<string, boolean>>({
    title: false,
    legend: false,
    axis: false,
    barLabel: false,
    tooltip: false,
  });
  const [styleDraftByToken, setStyleDraftByToken] = useState<Record<string, string>>({});

  const editorTokenEntry = useMemo(
    () => colorStudioTokens.find((token) => token.pathText === editorTokenPath),
    [colorStudioTokens, editorTokenPath]
  );

  const filteredTokens = useMemo(() => {
    const isCoreToken = (text: string) =>
      /page|card|button|text|background|border|hover|font|modal|shadow/.test(text);
    const isStatusToken = (text: string) => /status|danger|success|warning|error/.test(text);
    const isChartToken = (text: string) => /chart|bar|stroke|palette|overlap|tooltip/.test(text);

    return colorStudioTokens.filter((token) => {
      const haystack = `${token.pathText} ${token.label}`.toLowerCase();

      let typeMatch = true;
      if (themeType === 'monocolor') {
        typeMatch = isCoreToken(haystack) || /default color|hover color/.test(haystack);
      } else if (themeType === 'adjacent') {
        typeMatch = isCoreToken(haystack) || isChartToken(haystack);
      } else if (themeType === 'diverging') {
        typeMatch = isCoreToken(haystack) || isChartToken(haystack) || isStatusToken(haystack);
      }

      if (!typeMatch) {
        return false;
      }

      const hasLightWord = /\blight\b/.test(haystack);
      const hasDarkWord = /\bdark\b/.test(haystack);
      if (themeTone === 'light' && hasDarkWord && !hasLightWord) {
        return false;
      }
      if (themeTone === 'dark' && hasLightWord && !hasDarkWord) {
        return false;
      }

      return true;
    });
  }, [colorStudioTokens, themeType, themeTone]);

  const tokenFolders = useMemo(() => {
    const toLabel = (value: string) =>
      value
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^./, (char) => char.toUpperCase());

    const grouped = new Map<string, { label: string; tokens: ColorStudioToken[] }>();
    for (const token of filteredTokens) {
      const root = typeof token.path[0] === 'string' ? token.path[0] : 'misc';
      const existing = grouped.get(root);
      if (existing) {
        existing.tokens.push(token);
      } else {
        grouped.set(root, {
          label: toLabel(root),
          tokens: [token],
        });
      }
    }

    return Array.from(grouped.entries()).map(([key, value]) => ({
      key,
      label: value.label,
      tokens: value.tokens,
    }));
  }, [filteredTokens]);

  const widthStyleTokens = useMemo(
    () =>
      styleStudioTokens.filter(
        (token) => token.group === 'widths' && !MANAGED_WIDTH_STYLE_KEYS.has(token.pathText)
      ),
    [styleStudioTokens]
  );

  const typographyStyleTokens = useMemo(
    () => styleStudioTokens.filter((token) => token.group === 'typography'),
    [styleStudioTokens]
  );

  const sharedTypography = resolveTypographySettings(editableThemeUi, null, {
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontStyle: 'normal',
    fontWeight: 'normal',
    fontSize: 12,
    fontColor: normalizeHexColor(uiTheme.pageText) ?? '#111827',
    textRenderMode: 'fill',
    textStrokeColor: normalizeHexColor(uiTheme.pageText) ?? '#111827',
    textStrokeWidth: 1.2,
  });
  const titleTypography = resolveTypographySettings(editableThemeUi, 'title', sharedTypography);
  const legendTypography = resolveTypographySettings(editableThemeUi, 'legend', sharedTypography);
  const axisTypography = resolveTypographySettings(editableThemeUi, 'axis', sharedTypography);
  const barLabelTypography = resolveTypographySettings(editableThemeUi, 'barLabel', sharedTypography);
  const tooltipTypography = resolveTypographySettings(editableThemeUi, 'tooltip', sharedTypography);
  const tooltipSurfaceSettings = {
    backgroundColor: getUiColorValue(
      editableThemeUi,
      getTypographySettingKey('tooltip', 'BackgroundColor'),
      uiTheme.cardBackground
    ),
    borderColor: getUiColorValue(
      editableThemeUi,
      getTypographySettingKey('tooltip', 'BorderColor'),
      uiTheme.buttonBorder
    ),
    borderWidth: getUiNumberValue(
      editableThemeUi,
      getTypographySettingKey('tooltip', 'BorderWidth'),
      1
    ),
    padding: getUiNumberValue(
      editableThemeUi,
      getTypographySettingKey('tooltip', 'Padding'),
      12
    ),
  };

  const additionalTypographyStyleTokens = useMemo(
    () => typographyStyleTokens.filter((token) => !MANAGED_TYPOGRAPHY_STYLE_KEYS.has(token.pathText)),
    [typographyStyleTokens]
  );

  useEffect(() => {
    setExpandedFolders((current) => {
      const next: Record<string, boolean> = {};
      tokenFolders.forEach((folder) => {
        next[folder.key] = current[folder.key] ?? false;
      });
      return next;
    });
  }, [tokenFolders]);

  useEffect(() => {
    setStyleDraftByToken((current) => {
      const next = { ...current };
      for (const token of styleStudioTokens) {
        if (!(token.pathText in next)) {
          next[token.pathText] = String(token.value);
        }
      }

      for (const key of Object.keys(next)) {
        if (!styleStudioTokens.some((token) => token.pathText === key)) {
          delete next[key];
        }
      }

      return next;
    });
  }, [styleStudioTokens]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(FOLDER_STATE_STORAGE_KEY, JSON.stringify(expandedFolders));
    } catch {
      // Ignore storage failures (privacy mode/quota) and keep runtime behavior.
    }
  }, [expandedFolders]);

  useEffect(() => {
    if (filteredTokens.length === 0) {
      return;
    }
    const hasActive = filteredTokens.some((token) => token.pathText === activeColorToken);
    if (!hasActive) {
      onSelectToken(filteredTokens[0].pathText);
    }
  }, [filteredTokens, activeColorToken, onSelectToken]);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const closeColorPicker = () => {
    setIsWheelOpen(false);
    setPickerPosition(null);
    pickerAnchorRef.current = null;
  };

  const getPickerPositionFromAnchor = (anchor: HTMLElement) => {
    const rect = anchor.getBoundingClientRect();
    const estimatedWidth = 280;
    const estimatedHeight = 250;
    const minMargin = 8;
    const gap = 10;
    const placeOnRight = rect.right + gap + estimatedWidth <= window.innerWidth - minMargin;
    const left = placeOnRight
      ? rect.right + gap
      : Math.max(minMargin, rect.left - gap - estimatedWidth);

    const belowTop = rect.bottom + gap;
    const aboveTop = rect.top - gap - estimatedHeight;
    const canFitBelow = belowTop + estimatedHeight <= window.innerHeight - minMargin;
    const canFitAbove = aboveTop >= minMargin;
    const verticalPlacement: 'above' | 'below' = canFitBelow || !canFitAbove ? 'below' : 'above';
    const preferredTop = verticalPlacement === 'below' ? belowTop : aboveTop;
    const top = Math.min(
      Math.max(minMargin, preferredTop),
      Math.max(minMargin, window.innerHeight - estimatedHeight - minMargin)
    );

    const anchorMidY = rect.top + rect.height / 2;
    const arrowTop = Math.min(Math.max(10, anchorMidY - top - 6), estimatedHeight - 22);

    return {
      top,
      left,
      placement: placeOnRight ? 'right' : 'left' as 'left' | 'right',
      verticalPlacement,
      arrowTop,
    };
  };

  useEffect(() => {
    if (!isWheelOpen && !isSaveModalOpen) {
      return;
    }

    if (isWheelOpen) {
      wheelDialogRef.current?.focus();
    }
    if (isSaveModalOpen) {
      saveDialogRef.current?.focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isSaveModalOpen) {
          setIsSaveModalOpen(false);
          return;
        }
        if (isWheelOpen) {
          closeColorPicker();
        }
      }
    };

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (isWheelOpen && wheelDialogRef.current && !wheelDialogRef.current.contains(target)) {
        closeColorPicker();
      }
      if (isSaveModalOpen && saveDialogRef.current && !saveDialogRef.current.contains(target)) {
        setIsSaveModalOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onMouseDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onMouseDown);
    };
  }, [isSaveModalOpen, isWheelOpen]);

  useEffect(() => {
    if (!isWheelOpen) {
      return;
    }

    const updatePosition = () => {
      const anchor = pickerAnchorRef.current;
      if (!anchor || !document.body.contains(anchor)) {
        closeColorPicker();
        return;
      }
      const next = getPickerPositionFromAnchor(anchor);
      setPickerPosition((current) => {
        if (
          current &&
          current.top === next.top &&
          current.left === next.left &&
          current.placement === next.placement &&
          current.verticalPlacement === next.verticalPlacement &&
          current.arrowTop === next.arrowTop
        ) {
          return current;
        }
        return next;
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isWheelOpen]);

  const editorColor = normalizeHexColor(editorHexDraft) ?? '#000000';

  const setAllFoldersExpanded = (expanded: boolean) => {
    const next: Record<string, boolean> = {};
    tokenFolders.forEach((folder) => {
      next[folder.key] = expanded;
    });
    setExpandedFolders(next);
  };

  const openTokenColorEditor = (token: ColorStudioToken, anchor: HTMLElement) => {
    const raw = colorDraftByToken[token.pathText] ?? token.value;
    const normalized = normalizeHexColor(raw) ?? '#000000';
    const rgb = hexToRgb(normalized);
    pickerAnchorRef.current = anchor;

    setEditorTokenPath(token.pathText);
    setEditorHexDraft(normalized);
    setEditorRgbDraft({ r: String(rgb.r), g: String(rgb.g), b: String(rgb.b) });
    setPickerPosition(getPickerPositionFromAnchor(anchor));
    setIsWheelOpen(true);
  };

  const applyEditorHex = () => {
    if (!editorTokenPath) {
      return;
    }
    const normalized = normalizeHexColor(editorHexDraft);
    if (!normalized) {
      onClearError();
      return;
    }
    onSelectToken(editorTokenPath);
    onApplyHexForToken(editorTokenPath, normalized);
    closeColorPicker();
  };

  const hasTypographyOverride = (prefix: string) => {
    if (!editableThemeUi) {
      return false;
    }

    const suffixes =
      prefix === 'tooltip'
        ? [...TYPOGRAPHY_BASE_SUFFIXES, ...TOOLTIP_SURFACE_SUFFIXES]
        : TYPOGRAPHY_BASE_SUFFIXES;

    return suffixes.some((suffix) =>
      Object.prototype.hasOwnProperty.call(editableThemeUi, getTypographySettingKey(prefix, suffix))
    );
  };

  const renderTooltipSurfaceControls = () => {
    const fieldStyle = {
      display: 'grid',
      gap: 6,
      fontSize: 12,
      fontWeight: 600,
    } as const;
    const inputStyle = {
      border: '1px solid',
      borderColor: uiTheme.buttonBorder,
      borderRadius: 6,
      padding: '6px 8px',
      background: uiTheme.buttonBackground,
      color: uiTheme.buttonText,
      fontSize: 12,
      width: '100%',
      boxSizing: 'border-box',
    } as const;
    const colorInputStyle = {
      border: '1px solid',
      borderColor: uiTheme.buttonBorder,
      borderRadius: 6,
      padding: '2px',
      background: uiTheme.buttonBackground,
      height: 34,
      width: 48,
    } as const;
    const keyFor = (suffix: (typeof TOOLTIP_SURFACE_SUFFIXES)[number]) =>
      getTypographySettingKey('tooltip', suffix);

    return (
      <div style={{ display: 'grid', gap: 10 }}>
        <span style={{ fontSize: 11, opacity: 0.72 }}>
          These settings style the actual Vega hover tooltip container.
        </span>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 12,
            alignItems: 'end',
          }}
        >
          <label style={fieldStyle}>
            <span>Background</span>
            <input
              type="color"
              value={tooltipSurfaceSettings.backgroundColor}
              onChange={(event) => onApplyUiSetting(keyFor('BackgroundColor'), event.target.value)}
              style={colorInputStyle}
            />
          </label>
          <label style={fieldStyle}>
            <span>Border Color</span>
            <input
              type="color"
              value={tooltipSurfaceSettings.borderColor}
              onChange={(event) => onApplyUiSetting(keyFor('BorderColor'), event.target.value)}
              style={colorInputStyle}
            />
          </label>
          <label style={fieldStyle}>
            <span>Border Width</span>
            <input
              type="number"
              min={0}
              max={8}
              step={1}
              value={tooltipSurfaceSettings.borderWidth}
              onChange={(event) =>
                onApplyUiSetting(keyFor('BorderWidth'), Number.parseFloat(event.target.value) || 0)
              }
              style={inputStyle}
            />
          </label>
          <label style={fieldStyle}>
            <span>Padding</span>
            <input
              type="number"
              min={0}
              max={40}
              step={1}
              value={tooltipSurfaceSettings.padding}
              onChange={(event) =>
                onApplyUiSetting(keyFor('Padding'), Number.parseFloat(event.target.value) || 0)
              }
              style={inputStyle}
            />
          </label>
        </div>
      </div>
    );
  };

  const renderTypographyControls = ({
    prefix,
    settings,
    includeRenderControls,
  }: {
    prefix: string | null;
    settings: TypographySettings;
    includeRenderControls: boolean;
  }) => {
    const fieldStyle = {
      display: 'grid',
      gap: 6,
      fontSize: 12,
      fontWeight: 600,
    } as const;
    const inputStyle = {
      border: '1px solid',
      borderColor: uiTheme.buttonBorder,
      borderRadius: 6,
      padding: '6px 8px',
      background: uiTheme.buttonBackground,
      color: uiTheme.buttonText,
      fontSize: 12,
      width: '100%',
      boxSizing: 'border-box',
    } as const;
    const colorInputStyle = {
      border: '1px solid',
      borderColor: uiTheme.buttonBorder,
      borderRadius: 6,
      padding: '2px',
      background: uiTheme.buttonBackground,
      height: 34,
      width: 48,
    } as const;
    const keyFor = (suffix: string) => getTypographySettingKey(prefix, suffix);

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 12,
          alignItems: 'end',
        }}
      >
        <label style={fieldStyle}>
          <span>Font Family</span>
          <select
            value={settings.fontFamily}
            onChange={(event) => onApplyUiSetting(keyFor('FontFamily'), event.target.value)}
            style={inputStyle}
          >
            {FONT_FAMILY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label style={fieldStyle}>
          <span>Font Size</span>
          <input
            type="number"
            min={8}
            max={64}
            step={1}
            value={settings.fontSize}
            onChange={(event) =>
              onApplyUiSetting(keyFor('FontSize'), Number.parseFloat(event.target.value) || 12)
            }
            style={inputStyle}
          />
        </label>

        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            gridColumn: '1 / -1',
          }}
        >
          <label
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}
          >
            <input
              type="checkbox"
              checked={settings.fontWeight === 'bold'}
              onChange={(event) =>
                onApplyUiSetting(keyFor('FontWeight'), event.target.checked ? 'bold' : 'normal')
              }
            />
            <span>Bold</span>
          </label>
          <label
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}
          >
            <input
              type="checkbox"
              checked={settings.fontStyle === 'italic'}
              onChange={(event) =>
                onApplyUiSetting(keyFor('FontStyle'), event.target.checked ? 'italic' : 'normal')
              }
            />
            <span>Italic</span>
          </label>
        </div>

        <label style={fieldStyle}>
          <span>Font Color</span>
          <input
            type="color"
            value={settings.fontColor}
            onChange={(event) => onApplyUiSetting(keyFor('FontColor'), event.target.value)}
            style={colorInputStyle}
          />
        </label>

        {includeRenderControls ? (
          <label style={fieldStyle}>
            <span>Text Render</span>
            <select
              value={settings.textRenderMode}
              onChange={(event) => onApplyUiSetting(keyFor('TextRenderMode'), event.target.value)}
              style={inputStyle}
            >
              <option value="fill">Fill</option>
              <option value="hollow">Hollow (Stroke)</option>
            </select>
          </label>
        ) : (
          <div />
        )}

        {includeRenderControls && settings.textRenderMode === 'hollow' ? (
          <>
            <label style={fieldStyle}>
              <span>Text Stroke Color</span>
              <input
                type="color"
                value={settings.textStrokeColor}
                onChange={(event) => onApplyUiSetting(keyFor('TextStrokeColor'), event.target.value)}
                style={colorInputStyle}
              />
            </label>
            <label style={fieldStyle}>
              <span>Text Stroke Width</span>
              <input
                type="number"
                min={0.1}
                max={10}
                step={0.1}
                value={settings.textStrokeWidth}
                onChange={(event) =>
                  onApplyUiSetting(
                    keyFor('TextStrokeWidth'),
                    Number.parseFloat(event.target.value) || 1.2
                  )
                }
                style={inputStyle}
              />
            </label>
          </>
        ) : null}
      </div>
    );
  };

  return (
    <div
      role="region"
      aria-label="Theme Builder Workspace"
      style={{
        width: 'min(1360px, 100%)',
        minWidth: 0,
        margin: '0 auto',
        height: '100%',
        padding: '0 0 10px',
        boxSizing: 'border-box',
      }}
    >
      <style>{`
        .theme-builder-modal {
          width: 100%;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          border-radius: 14px;
          padding: 14px;
          box-sizing: border-box;
          display: grid;
          grid-template-rows: auto auto 1fr;
          gap: 14px;
        }

        .theme-builder-layout {
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(230px, 300px) minmax(0, 1fr);
          gap: 14px;
          align-items: stretch;
        }

        .theme-builder-card {
          border: 1px solid;
          border-radius: 10px;
          padding: 12px;
          min-width: 0;
          min-height: 0;
        }

        .theme-builder-token-list {
          display: grid;
          gap: 8px;
          height: auto;
          min-height: 0;
          max-height: 100%;
          overflow: auto;
          padding-right: 2px;
          align-content: start;
        }

        .theme-builder-folder {
          border: 1px solid;
          border-radius: 8px;
          overflow: clip;
        }

        .theme-builder-folder-header {
          width: 100%;
          border: none;
          cursor: pointer;
          user-select: none;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          text-align: left;
        }

        .theme-builder-folder-header:focus-visible {
          outline: 2px solid #0ea5e9;
          outline-offset: -2px;
        }

        .theme-builder-folder-body {
          border-top: 1px solid;
          padding: 8px;
          display: grid;
          gap: 8px;
        }

        .theme-builder-editor-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          align-items: end;
        }

        .theme-builder-rgb-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          align-items: end;
        }

        .theme-builder-rgb-row input,
        .theme-builder-editor-row input,
        .theme-builder-save-modal input,
        .theme-builder-save-modal select {
          width: 100%;
          box-sizing: border-box;
        }

        @media (max-width: 1140px) {
          .theme-builder-layout {
            grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
            align-items: start;
          }
        }

        @media (max-width: 880px) {
          .theme-builder-layout {
            grid-template-columns: 1fr;
          }

          .theme-builder-editor-row,
          .theme-builder-rgb-row {
            grid-template-columns: 1fr;
          }

          .theme-builder-token-list {
            height: min(40vh, 420px);
            max-height: min(40vh, 420px);
            min-height: 220px;
          }
        }
      `}</style>
      <div
        ref={dialogRef}
        className="theme-builder-modal"
        tabIndex={-1}
        style={{
          background: uiTheme.cardBackground,
          color: uiTheme.pageText,
          boxShadow: uiTheme.cardShadow,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 8 }}>Theme Builder</h2>
            <p style={{ marginTop: 0, marginBottom: 0, fontSize: 13, opacity: 0.85 }}>
              Global theme editing with color wheel, HEX, and RGB controls.
            </p>
          </div>
          <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onBackToLanding}
              style={{
                border: '1px solid',
                borderColor: uiTheme.buttonBorder,
                borderRadius: 8,
                padding: '8px 12px',
                background: uiTheme.buttonBackground,
                color: uiTheme.buttonText,
                cursor: 'pointer',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              Back to Landing
            </button>
            <button
              type="button"
              onClick={onBackToReport}
              disabled={!canBackToReport}
              title={canBackToReport ? 'Back to source report' : 'Open from a report to enable this'}
              style={{
                border: '1px solid',
                borderColor: uiTheme.buttonBorder,
                borderRadius: 8,
                padding: '8px 12px',
                background: uiTheme.buttonBackground,
                color: uiTheme.buttonText,
                cursor: canBackToReport ? 'pointer' : 'not-allowed',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                opacity: canBackToReport ? 1 : 0.45,
              }}
            >
              Back to Report
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
            gap: 10,
            flexWrap: 'wrap',
            border: '1px solid',
            borderColor: uiTheme.buttonBorder,
            borderRadius: 10,
            padding: '8px 10px',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.82 }}>Theme Type</span>
            <select
              value={themeType}
              onChange={(event) => setThemeType(event.target.value as typeof themeType)}
              style={{
                border: '1px solid',
                borderColor: uiTheme.buttonBorder,
                background: uiTheme.buttonBackground,
                color: uiTheme.buttonText,
                borderRadius: 8,
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <option value="all">All</option>
              <option value="monocolor">Monocolor</option>
              <option value="adjacent">Multicolor / Adjacent</option>
              <option value="diverging">Diverging</option>
            </select>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.82 }}>Tone</span>
            <select
              value={themeTone}
              onChange={(event) => setThemeTone(event.target.value as typeof themeTone)}
              style={{
                border: '1px solid',
                borderColor: uiTheme.buttonBorder,
                background: uiTheme.buttonBackground,
                color: uiTheme.buttonText,
                borderRadius: 8,
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsSaveModalOpen(true)}
            disabled={isSavingTheme || colorStudioTokens.length === 0}
            style={{
              border: '1px solid',
              borderColor: uiTheme.buttonText,
              borderRadius: 8,
              padding: '8px 12px',
              background: uiTheme.buttonText,
              color: uiTheme.buttonBackground,
              cursor: isSavingTheme ? 'wait' : 'pointer',
              fontWeight: 700,
              opacity: isSavingTheme ? 0.75 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            Save Theme
          </button>

          <span style={{ fontSize: 12, opacity: 0.75 }}>
            Showing {filteredTokens.length} of {colorStudioTokens.length} colors
          </span>
          {colorStudioError ? (
            <span style={{ fontSize: 12, color: uiTheme.statusDanger, fontWeight: 700 }}>
              {colorStudioError}
            </span>
          ) : null}
        </div>

        <div className="theme-builder-layout">
          <div
            className="theme-builder-card"
            style={{
              borderColor: uiTheme.buttonBorder,
              display: 'grid',
              gridTemplateRows: 'auto minmax(0, 1fr)',
              gap: 8,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <strong style={{ fontSize: 12, opacity: 0.85 }}>
                Theme Elements
              </strong>
              <span style={{ fontSize: 11, opacity: 0.7 }}>
                {colorStudioTokens.length + styleStudioTokens.length} items
              </span>
            </div>
            <div className="theme-builder-token-list">
              <div
                className="theme-builder-folder"
                style={{ borderColor: uiTheme.buttonBorder }}
              >
                <button
                  type="button"
                  className="theme-builder-folder-header"
                  onClick={() => setIsThemeElementsExpanded((current) => !current)}
                  aria-expanded={isThemeElementsExpanded}
                  style={{ background: uiTheme.buttonBackground, color: uiTheme.buttonText }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 9, opacity: 0.75, lineHeight: 1 }}>
                      {isThemeElementsExpanded ? '▾' : '▸'}
                    </span>
                    <span>Theme Elements</span>
                  </span>
                  <span style={{ opacity: 0.7 }}>{colorStudioTokens.length + styleStudioTokens.length}</span>
                </button>
                <div
                  className="theme-builder-folder-body"
                  style={{
                    borderColor: uiTheme.buttonBorder,
                    display: isThemeElementsExpanded ? 'grid' : 'none',
                  }}
                >
                  <div
                    className="theme-builder-folder"
                    style={{ borderColor: uiTheme.buttonBorder }}
                  >
                    <button
                      type="button"
                      className="theme-builder-folder-header"
                      onClick={() => setIsTypographySectionExpanded((current) => !current)}
                      aria-expanded={isTypographySectionExpanded}
                      style={{ background: uiTheme.buttonBackground, color: uiTheme.buttonText }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 9, opacity: 0.75, lineHeight: 1 }}>
                          {isTypographySectionExpanded ? '▾' : '▸'}
                        </span>
                        <span>Typography</span>
                      </span>
                      <span style={{ opacity: 0.7 }}>{typographyStyleTokens.length}</span>
                    </button>
                    <div
                      className="theme-builder-folder-body"
                      style={{
                        borderColor: uiTheme.buttonBorder,
                        display: isTypographySectionExpanded ? 'grid' : 'none',
                      }}
                    >
                      <span style={{ fontSize: 11, opacity: 0.7 }}>
                        Shared defaults apply everywhere unless one of the override groups below is customized.
                      </span>

                      {renderTypographyControls({
                        prefix: null,
                        settings: sharedTypography,
                        includeRenderControls: true,
                      })}

                      <div style={{ display: 'grid', gap: 8 }}>
                        {TYPOGRAPHY_OVERRIDE_SECTIONS.map((section) => {
                          const isExpanded = expandedTypographyOverrides[section.key] ?? false;
                          const isCustomized = hasTypographyOverride(section.key);
                          const sectionSettings =
                            section.key === 'title'
                              ? titleTypography
                              : section.key === 'legend'
                                ? legendTypography
                                : section.key === 'axis'
                                  ? axisTypography
                                  : section.key === 'barLabel'
                                    ? barLabelTypography
                                    : section.key === 'tooltip'
                                      ? tooltipTypography
                                      : sharedTypography;

                          return (
                            <div
                              key={section.key}
                              className="theme-builder-folder"
                              style={{ borderColor: uiTheme.buttonBorder }}
                            >
                              <button
                                type="button"
                                className="theme-builder-folder-header"
                                onClick={() =>
                                  setExpandedTypographyOverrides((current) => ({
                                    ...current,
                                    [section.key]: !current[section.key],
                                  }))
                                }
                                aria-expanded={isExpanded}
                                style={{
                                  background: uiTheme.buttonBackground,
                                  color: uiTheme.buttonText,
                                }}
                              >
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 9, opacity: 0.75, lineHeight: 1 }}>
                                    {isExpanded ? '▾' : '▸'}
                                  </span>
                                  <span>{section.label}</span>
                                </span>
                                <span style={{ opacity: 0.7, fontSize: 11 }}>
                                  {isCustomized ? 'custom' : 'shared'}
                                </span>
                              </button>
                              <div
                                className="theme-builder-folder-body"
                                style={{
                                  borderColor: uiTheme.buttonBorder,
                                  display: isExpanded ? 'grid' : 'none',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 8,
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <span style={{ fontSize: 11, opacity: 0.72 }}>{section.description}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onClearUiSettings(
                                          [
                                            ...TYPOGRAPHY_BASE_SUFFIXES.map((suffix) =>
                                              getTypographySettingKey(section.key, suffix)
                                            ),
                                            ...(section.key === 'tooltip'
                                              ? TOOLTIP_SURFACE_SUFFIXES.map((suffix) =>
                                                  getTypographySettingKey(section.key, suffix)
                                                )
                                              : []),
                                          ]
                                      )
                                    }
                                    disabled={!isCustomized}
                                    style={{
                                      border: '1px solid',
                                      borderColor: uiTheme.buttonBorder,
                                      borderRadius: 6,
                                      padding: '6px 10px',
                                      background: uiTheme.buttonBackground,
                                      color: uiTheme.buttonText,
                                      cursor: isCustomized ? 'pointer' : 'not-allowed',
                                      fontSize: 11,
                                      fontWeight: 600,
                                      opacity: isCustomized ? 1 : 0.45,
                                    }}
                                  >
                                    Reset to Shared
                                  </button>
                                </div>
                                {renderTypographyControls({
                                  prefix: section.key,
                                  settings: sectionSettings,
                                  includeRenderControls: false,
                                })}
                                {section.key === 'tooltip' ? renderTooltipSurfaceControls() : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {additionalTypographyStyleTokens.length > 0 ? (
                        <details>
                          <summary style={{ fontSize: 12, cursor: 'pointer', opacity: 0.8 }}>
                            Additional typography tokens ({additionalTypographyStyleTokens.length})
                          </summary>
                          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                            {additionalTypographyStyleTokens.map((token) => (
                              <label
                                key={token.pathText}
                                style={{
                                  display: 'grid',
                                  gap: 6,
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                <span>{token.label}</span>
                                <input
                                  type={token.valueType === 'number' ? 'number' : 'text'}
                                  step={token.valueType === 'number' ? '0.1' : undefined}
                                  value={styleDraftByToken[token.pathText] ?? String(token.value)}
                                  onChange={(event) =>
                                    setStyleDraftByToken((current) => ({
                                      ...current,
                                      [token.pathText]: event.target.value,
                                    }))
                                  }
                                  onBlur={() =>
                                    onApplyStyleValueForToken(
                                      token.pathText,
                                      styleDraftByToken[token.pathText] ?? String(token.value)
                                    )
                                  }
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                      event.currentTarget.blur();
                                    }
                                  }}
                                  style={{
                                    border: '1px solid',
                                    borderColor: uiTheme.buttonBorder,
                                    borderRadius: 6,
                                    padding: '6px 8px',
                                    background: uiTheme.buttonBackground,
                                    color: uiTheme.buttonText,
                                    fontSize: 12,
                                  }}
                                />
                              </label>
                            ))}
                          </div>
                        </details>
                      ) : null}
                    </div>
                  </div>

                  <div
                    className="theme-builder-folder"
                    style={{ borderColor: uiTheme.buttonBorder }}
                  >
                    <button
                      type="button"
                      className="theme-builder-folder-header"
                      onClick={() => setIsWidthsSectionExpanded((current) => !current)}
                      aria-expanded={isWidthsSectionExpanded}
                      style={{ background: uiTheme.buttonBackground, color: uiTheme.buttonText }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 9, opacity: 0.75, lineHeight: 1 }}>
                          {isWidthsSectionExpanded ? '▾' : '▸'}
                        </span>
                        <span>Visual Density</span>
                      </span>
                      <span style={{ opacity: 0.7 }}>{widthStyleTokens.length}</span>
                    </button>
                    <div
                      className="theme-builder-folder-body"
                      style={{
                        borderColor: uiTheme.buttonBorder,
                        display: isWidthsSectionExpanded ? 'grid' : 'none',
                      }}
                    >
                      {widthStyleTokens.length === 0 ? (
                        <span style={{ fontSize: 12, opacity: 0.7 }}>No width tokens found.</span>
                      ) : (
                        <>
                          <span style={{ fontSize: 11, opacity: 0.7 }}>
                            Stroke, border, line width, corner radius, and opacity controls.
                          </span>
                          {widthStyleTokens.map((token) => (
                            <label
                              key={token.pathText}
                              style={{
                                display: 'grid',
                                gap: 6,
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              <span>{token.label}</span>
                              <input
                                type={token.valueType === 'number' ? 'number' : 'text'}
                                step={token.valueType === 'number' ? '0.1' : undefined}
                                value={styleDraftByToken[token.pathText] ?? String(token.value)}
                                onChange={(event) =>
                                  setStyleDraftByToken((current) => ({
                                    ...current,
                                    [token.pathText]: event.target.value,
                                  }))
                                }
                                onBlur={() =>
                                  onApplyStyleValueForToken(
                                    token.pathText,
                                    styleDraftByToken[token.pathText] ?? String(token.value)
                                  )
                                }
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    event.currentTarget.blur();
                                  }
                                }}
                                style={{
                                  border: '1px solid',
                                  borderColor: uiTheme.buttonBorder,
                                  borderRadius: 6,
                                  padding: '6px 8px',
                                  background: uiTheme.buttonBackground,
                                  color: uiTheme.buttonText,
                                  fontSize: 12,
                                }}
                              />
                            </label>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  <div
                    className="theme-builder-folder"
                    style={{ borderColor: uiTheme.buttonBorder }}
                  >
                    <button
                      type="button"
                      className="theme-builder-folder-header"
                      onClick={() => setIsColorsSectionExpanded((current) => !current)}
                      aria-expanded={isColorsSectionExpanded}
                      style={{ background: uiTheme.buttonBackground, color: uiTheme.buttonText }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 9, opacity: 0.75, lineHeight: 1 }}>
                          {isColorsSectionExpanded ? '▾' : '▸'}
                        </span>
                        <span>Colors</span>
                      </span>
                      <span style={{ opacity: 0.7 }}>{colorStudioTokens.length}</span>
                    </button>
                    <div
                      className="theme-builder-folder-body"
                      style={{
                        borderColor: uiTheme.buttonBorder,
                        display: isColorsSectionExpanded ? 'grid' : 'none',
                      }}
                    >
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setAllFoldersExpanded(true)}
                          style={{
                            border: '1px solid',
                            borderColor: uiTheme.buttonBorder,
                            borderRadius: 6,
                            padding: '4px 8px',
                            background: uiTheme.buttonBackground,
                            color: uiTheme.buttonText,
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          Expand color groups
                        </button>
                        <button
                          type="button"
                          onClick={() => setAllFoldersExpanded(false)}
                          style={{
                            border: '1px solid',
                            borderColor: uiTheme.buttonBorder,
                            borderRadius: 6,
                            padding: '4px 8px',
                            background: uiTheme.buttonBackground,
                            color: uiTheme.buttonText,
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          Collapse color groups
                        </button>
                      </div>

                      {tokenFolders.length === 0 ? (
                        <div
                          style={{
                            border: '1px dashed',
                            borderColor: uiTheme.buttonBorder,
                            borderRadius: 8,
                            padding: 12,
                            fontSize: 12,
                            opacity: 0.75,
                          }}
                        >
                          No tokens match this filter.
                        </div>
                      ) : null}

                      {tokenFolders.map((folder) => {
                        const isExpanded = Boolean(expandedFolders[folder.key]);

                        return (
                          <div
                            key={folder.key}
                            className="theme-builder-folder"
                            style={{ borderColor: uiTheme.buttonBorder }}
                          >
                            <button
                              type="button"
                              className="theme-builder-folder-header"
                              onClick={() =>
                                setExpandedFolders((current) => ({
                                  ...current,
                                  [folder.key]: !Boolean(current[folder.key]),
                                }))
                              }
                              aria-expanded={isExpanded}
                              style={{ background: uiTheme.buttonBackground, color: uiTheme.buttonText }}
                            >
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 9, opacity: 0.75, lineHeight: 1 }}>
                                  {isExpanded ? '▾' : '▸'}
                                </span>
                                <span>{folder.label}</span>
                              </span>
                              <span style={{ opacity: 0.7 }}>{folder.tokens.length}</span>
                            </button>
                            <div
                              className="theme-builder-folder-body"
                              style={{
                                borderColor: uiTheme.buttonBorder,
                                display: isExpanded ? 'grid' : 'none',
                              }}
                            >
                              {folder.tokens.map((token) => {
                                const isActive = token.pathText === activeColorToken;
                                return (
                                  <div
                                    key={token.pathText}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => {
                                      onSelectToken(token.pathText);
                                      onClearError();
                                    }}
                                    onKeyDown={(event) => {
                                      if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        onSelectToken(token.pathText);
                                        onClearError();
                                      }
                                    }}
                                    style={{
                                      border: '1px solid',
                                      borderColor: isActive ? uiTheme.buttonText : uiTheme.buttonBorder,
                                      background: isActive ? uiTheme.buttonText : uiTheme.buttonBackground,
                                      color: isActive ? uiTheme.buttonBackground : uiTheme.buttonText,
                                      borderRadius: 8,
                                      padding: '8px 10px',
                                      cursor: 'pointer',
                                      fontSize: 12,
                                      fontWeight: 600,
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      gap: 10,
                                    }}
                                  >
                                    <span style={{ textAlign: 'left' }}>{token.label}</span>
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        openTokenColorEditor(token, event.currentTarget);
                                      }}
                                      aria-label={`Edit color for ${token.label}`}
                                      style={{
                                        width: 14,
                                        height: 14,
                                        borderRadius: 4,
                                        background: colorDraftByToken[token.pathText] ?? token.value,
                                        border: '1px solid',
                                        borderColor: isActive
                                          ? uiTheme.buttonBackground
                                          : uiTheme.buttonBorder,
                                        padding: 0,
                                        cursor: 'pointer',
                                      }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="theme-builder-card"
            style={{ borderColor: uiTheme.buttonBorder, display: 'grid', gap: 12 }}
          >
            <ThemePreviewChart
              uiTheme={uiTheme}
              editableThemeUi={editableThemeUi}
              colorDraftByToken={colorDraftByToken}
            />
          </div>
        </div>
      </div>

      {isWheelOpen && pickerPosition ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 95,
          }}
        >
          <div
            ref={wheelDialogRef}
            role="dialog"
            aria-modal="false"
            aria-label="Color Picker"
            tabIndex={-1}
            style={{
              position: 'fixed',
              top: pickerPosition.top,
              left: pickerPosition.left,
              width: 'min(280px, calc(100vw - 16px))',
              maxWidth: 'calc(100vw - 16px)',
              background: uiTheme.cardBackground,
              color: uiTheme.pageText,
              border: '1px solid',
              borderColor: uiTheme.buttonBorder,
              borderRadius: 12,
              boxShadow: uiTheme.cardShadow,
              padding: 10,
              display: 'grid',
              gap: 8,
              pointerEvents: 'auto',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: pickerPosition.arrowTop,
                [pickerPosition.placement === 'right' ? 'left' : 'right']: -7,
                width: 12,
                height: 12,
                background: uiTheme.cardBackground,
                borderTop: '1px solid',
                borderRight: '1px solid',
                borderColor: uiTheme.buttonBorder,
                transform: pickerPosition.placement === 'right' ? 'rotate(-135deg)' : 'rotate(45deg)',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <strong style={{ fontSize: 13 }}>{editorTokenEntry?.label ?? 'Edit Color'}</strong>
              <button
                type="button"
                onClick={closeColorPicker}
                aria-label="Close color picker"
                style={{
                  border: '1px solid',
                  borderColor: uiTheme.buttonBorder,
                  borderRadius: 8,
                  width: 28,
                  height: 28,
                  background: uiTheme.buttonBackground,
                  color: uiTheme.buttonText,
                  cursor: 'pointer',
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                X
              </button>
            </div>

            <input
              type="color"
              value={editorColor}
              onChange={(value) => {
                const normalized = normalizeHexColor(value.target.value) ?? '#000000';
                setEditorHexDraft(normalized);
                const rgb = hexToRgb(normalized);
                setEditorRgbDraft({ r: String(rgb.r), g: String(rgb.g), b: String(rgb.b) });
              }}
              aria-label="Pick a color"
              style={{ width: '100%', height: 34, border: 'none', background: 'transparent', cursor: 'pointer' }}
            />

            <div className="theme-builder-editor-row">
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.85 }}>HEX</span>
                <input
                  value={editorHexDraft}
                  onChange={(event) => {
                    const next = event.target.value;
                    setEditorHexDraft(next);
                    const normalized = normalizeHexColor(next);
                    if (normalized) {
                      const rgb = hexToRgb(normalized);
                      setEditorRgbDraft({ r: String(rgb.r), g: String(rgb.g), b: String(rgb.b) });
                    }
                  }}
                  aria-label="Hex color"
                  placeholder="#4f46e5"
                  style={{
                    border: '1px solid',
                    borderColor: uiTheme.buttonBorder,
                    borderRadius: 8,
                    padding: '8px 10px',
                    background: uiTheme.buttonBackground,
                    color: uiTheme.buttonText,
                    fontSize: 13,
                  }}
                />
              </label>
            </div>

            <div className="theme-builder-rgb-row">
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.85 }}>R</span>
                <input
                  value={editorRgbDraft.r}
                  onChange={(event) => {
                    setEditorRgbDraft((current) => {
                      const next = { ...current, r: event.target.value };
                      const r = Number.parseInt(next.r, 10);
                      const g = Number.parseInt(next.g, 10);
                      const b = Number.parseInt(next.b, 10);
                      if (![r, g, b].some((value) => Number.isNaN(value) || value < 0 || value > 255)) {
                        setEditorHexDraft(rgbToHex(r, g, b));
                      }
                      return next;
                    });
                  }}
                  inputMode="numeric"
                  style={{
                    border: '1px solid',
                    borderColor: uiTheme.buttonBorder,
                    borderRadius: 8,
                    padding: '8px 10px',
                    background: uiTheme.buttonBackground,
                    color: uiTheme.buttonText,
                    fontSize: 13,
                  }}
                />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.85 }}>G</span>
                <input
                  value={editorRgbDraft.g}
                  onChange={(event) => {
                    setEditorRgbDraft((current) => {
                      const next = { ...current, g: event.target.value };
                      const r = Number.parseInt(next.r, 10);
                      const g = Number.parseInt(next.g, 10);
                      const b = Number.parseInt(next.b, 10);
                      if (![r, g, b].some((value) => Number.isNaN(value) || value < 0 || value > 255)) {
                        setEditorHexDraft(rgbToHex(r, g, b));
                      }
                      return next;
                    });
                  }}
                  inputMode="numeric"
                  style={{
                    border: '1px solid',
                    borderColor: uiTheme.buttonBorder,
                    borderRadius: 8,
                    padding: '8px 10px',
                    background: uiTheme.buttonBackground,
                    color: uiTheme.buttonText,
                    fontSize: 13,
                  }}
                />
              </label>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.85 }}>B</span>
                <input
                  value={editorRgbDraft.b}
                  onChange={(event) => {
                    setEditorRgbDraft((current) => {
                      const next = { ...current, b: event.target.value };
                      const r = Number.parseInt(next.r, 10);
                      const g = Number.parseInt(next.g, 10);
                      const b = Number.parseInt(next.b, 10);
                      if (![r, g, b].some((value) => Number.isNaN(value) || value < 0 || value > 255)) {
                        setEditorHexDraft(rgbToHex(r, g, b));
                      }
                      return next;
                    });
                  }}
                  inputMode="numeric"
                  style={{
                    border: '1px solid',
                    borderColor: uiTheme.buttonBorder,
                    borderRadius: 8,
                    padding: '8px 10px',
                    background: uiTheme.buttonBackground,
                    color: uiTheme.buttonText,
                    fontSize: 13,
                  }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 12, opacity: 0.85 }}>{editorColor}</span>
              <div style={{ display: 'inline-flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsWheelOpen(false);
                    setPickerPosition(null);
                  }}
                  style={{
                    border: '1px solid',
                    borderColor: uiTheme.buttonBorder,
                    borderRadius: 8,
                    padding: '6px 10px',
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
                  onClick={applyEditorHex}
                  style={{
                    border: '1px solid',
                    borderColor: uiTheme.buttonText,
                    borderRadius: 8,
                    padding: '6px 10px',
                    background: uiTheme.buttonText,
                    color: uiTheme.buttonBackground,
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isSaveModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Save Theme"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 90,
          }}
        >
          <div
            ref={saveDialogRef}
            className="theme-builder-save-modal"
            tabIndex={-1}
            onMouseDown={(event) => event.stopPropagation()}
            style={{
              width: 'min(360px, 94vw)',
              background: uiTheme.cardBackground,
              color: uiTheme.pageText,
              border: '1px solid',
              borderColor: uiTheme.buttonBorder,
              borderRadius: 12,
              boxShadow: uiTheme.cardShadow,
              padding: 12,
              display: 'grid',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <strong style={{ fontSize: 14 }}>Save Theme</strong>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                aria-label="Close save dialog"
                style={{
                  border: '1px solid',
                  borderColor: uiTheme.buttonBorder,
                  borderRadius: 8,
                  width: 30,
                  height: 30,
                  background: uiTheme.buttonBackground,
                  color: uiTheme.buttonText,
                  cursor: 'pointer',
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                X
              </button>
            </div>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.85 }}>Theme Name</span>
              <input
                value={themeSaveDraft.label}
                onChange={(event) => {
                  const label = event.target.value;
                  onUpdateThemeSaveDraft({ label, key: toThemeKeyCandidate(label) });
                  onClearError();
                }}
                style={{
                  border: '1px solid',
                  borderColor: uiTheme.buttonBorder,
                  borderRadius: 8,
                  padding: '8px 10px',
                  background: uiTheme.buttonBackground,
                  color: uiTheme.buttonText,
                  fontSize: 13,
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.85 }}>Theme Key</span>
              <input
                value={themeSaveDraft.key}
                onChange={(event) => {
                  onUpdateThemeSaveDraft({ key: toThemeKeyCandidate(event.target.value) });
                  onClearError();
                }}
                style={{
                  border: '1px solid',
                  borderColor: uiTheme.buttonBorder,
                  borderRadius: 8,
                  padding: '8px 10px',
                  background: uiTheme.buttonBackground,
                  color: uiTheme.buttonText,
                  fontSize: 13,
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.85 }}>Theme Level</span>
              <select
                value={themeSaveDraft.scope}
                onChange={(event) =>
                  onUpdateThemeSaveDraft({
                    scope: event.target.value as 'global' | 'domain' | 'pack' | 'dashboard',
                  })
                }
                style={{
                  border: '1px solid',
                  borderColor: uiTheme.buttonBorder,
                  background: uiTheme.buttonBackground,
                  color: uiTheme.buttonText,
                  borderRadius: 8,
                  padding: '8px 10px',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                <option value="global">Global</option>
                <option value="domain">Domain</option>
                <option value="pack">Pack</option>
                <option value="dashboard">Dashboard</option>
              </select>
            </label>

            {colorStudioError ? (
              <div style={{ fontSize: 12, color: uiTheme.statusDanger, fontWeight: 700 }}>
                {colorStudioError}
              </div>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                style={{
                  border: '1px solid',
                  borderColor: uiTheme.buttonBorder,
                  borderRadius: 8,
                  padding: '7px 10px',
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
                onClick={onSaveTheme}
                disabled={isSavingTheme || colorStudioTokens.length === 0}
                style={{
                  border: '1px solid',
                  borderColor: uiTheme.buttonText,
                  borderRadius: 8,
                  padding: '7px 10px',
                  background: uiTheme.buttonText,
                  color: uiTheme.buttonBackground,
                  cursor: isSavingTheme ? 'wait' : 'pointer',
                  fontWeight: 700,
                  opacity: isSavingTheme ? 0.75 : 1,
                }}
              >
                {isSavingTheme ? 'Saving...' : 'Save and Apply'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
