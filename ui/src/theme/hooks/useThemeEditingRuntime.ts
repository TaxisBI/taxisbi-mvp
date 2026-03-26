import { useCallback, useMemo, useState } from 'react';
import {
  collectColorStudioTokens,
  collectStyleStudioTokens,
  createDefaultThemeSaveDraft,
  hexToRgb,
  isRecord,
  normalizeHexColor,
  resolveThemeBuilderUiTheme,
  rgbToHex,
  setValueAtPath,
  toThemeKeyCandidate,
} from '../utils';
import type {
  ColorStudioToken,
  StyleStudioToken,
  ThemeBuilderContext,
  ThemeDefinition,
  ThemeSaveDraft,
} from '../types';

export function useThemeEditingRuntime(options: {
  context: ThemeBuilderContext;
  themeDefinitionsByKey: Record<string, ThemeDefinition>;
  selectedThemeKey: string;
}) {
  const { context, themeDefinitionsByKey, selectedThemeKey } = options;

  const [activeColorToken, setActiveColorToken] = useState('');
  const [colorStudioTokens, setColorStudioTokens] = useState<ColorStudioToken[]>([]);
  const [styleStudioTokens, setStyleStudioTokens] = useState<StyleStudioToken[]>([]);
  const [editableThemeUi, setEditableThemeUi] = useState<Record<string, unknown> | null>(null);
  const [colorDraftByToken, setColorDraftByToken] = useState<Record<string, string>>({});
  const [themeSaveDraft, setThemeSaveDraft] = useState<ThemeSaveDraft>(() =>
    createDefaultThemeSaveDraft(context)
  );
  const [hexDraft, setHexDraft] = useState('#000000');
  const [rgbDraft, setRgbDraft] = useState({ r: '0', g: '0', b: '0' });
  const [colorStudioError, setColorStudioError] = useState<string | null>(null);

  const selectedTheme = themeDefinitionsByKey[selectedThemeKey];
  const selectedUi = isRecord(selectedTheme?.ui) ? selectedTheme.ui : {};
  const uiTheme = useMemo(() => resolveThemeBuilderUiTheme(selectedUi), [selectedUi]);

  const hydrateFromTheme = useCallback((themeKey: string, map: Record<string, ThemeDefinition>) => {
    const sourceTheme = map[themeKey];
    const uiSource = isRecord(sourceTheme?.ui) ? sourceTheme.ui : {};
    const editableUi = JSON.parse(JSON.stringify(uiSource)) as Record<string, unknown>;
    const tokens = collectColorStudioTokens(editableUi);
    const styleTokens = collectStyleStudioTokens(editableUi);
    const draftMap = Object.fromEntries(tokens.map((token) => [token.pathText, token.value]));

    setEditableThemeUi(editableUi);
    setColorStudioTokens(tokens);
    setStyleStudioTokens(styleTokens);
    setColorDraftByToken(draftMap);

    const firstToken = tokens[0]?.pathText ?? '';
    setActiveColorToken(firstToken);
    const firstHex = firstToken ? draftMap[firstToken] : '#000000';
    setHexDraft(firstHex);
    const rgb = hexToRgb(firstHex);
    setRgbDraft({ r: String(rgb.r), g: String(rgb.g), b: String(rgb.b) });

    const baseLabel = sourceTheme?.label ?? 'Custom Theme';
    const defaultLabel = `${baseLabel} Copy`;
    setThemeSaveDraft((current) => ({
      ...current,
      label: defaultLabel,
      key: toThemeKeyCandidate(defaultLabel),
    }));
    setColorStudioError(null);
  }, []);

  const applyHexToActiveToken = (rawHex: string) => {
    const normalized = normalizeHexColor(rawHex);
    if (!normalized) {
      setColorStudioError('Enter a valid HEX color such as #4f46e5.');
      return;
    }

    if (!activeColorToken) {
      setColorStudioError('Select a color token first.');
      return;
    }

    const token = colorStudioTokens.find((entry) => entry.pathText === activeColorToken);
    if (!token || !editableThemeUi) {
      setColorStudioError('No editable color token selected.');
      return;
    }

    setColorStudioError(null);
    setColorDraftByToken((current) => ({ ...current, [activeColorToken]: normalized }));
    setEditableThemeUi((current) => (current ? setValueAtPath(current, token.path, normalized) : current));
    setColorStudioTokens((current) =>
      current.map((entry) =>
        entry.pathText === activeColorToken ? { ...entry, value: normalized } : entry
      )
    );
    setHexDraft(normalized);
    const rgb = hexToRgb(normalized);
    setRgbDraft({ r: String(rgb.r), g: String(rgb.g), b: String(rgb.b) });
  };

  const applyHexToToken = (tokenPath: string, rawHex: string) => {
    const normalized = normalizeHexColor(rawHex);
    if (!normalized) {
      setColorStudioError('Enter a valid HEX color such as #4f46e5.');
      return;
    }

    const token = colorStudioTokens.find((entry) => entry.pathText === tokenPath);
    if (!token || !editableThemeUi) {
      setColorStudioError('No editable color token selected.');
      return;
    }

    setColorStudioError(null);
    setColorDraftByToken((current) => ({ ...current, [tokenPath]: normalized }));
    setEditableThemeUi((current) => (current ? setValueAtPath(current, token.path, normalized) : current));
    setColorStudioTokens((current) =>
      current.map((entry) => (entry.pathText === tokenPath ? { ...entry, value: normalized } : entry))
    );
    setActiveColorToken(tokenPath);
    setHexDraft(normalized);
    const rgb = hexToRgb(normalized);
    setRgbDraft({ r: String(rgb.r), g: String(rgb.g), b: String(rgb.b) });
  };

  const applyRgbToActiveToken = () => {
    const r = Number.parseInt(rgbDraft.r, 10);
    const g = Number.parseInt(rgbDraft.g, 10);
    const b = Number.parseInt(rgbDraft.b, 10);
    if ([r, g, b].some((value) => Number.isNaN(value) || value < 0 || value > 255)) {
      setColorStudioError('RGB values must be whole numbers between 0 and 255.');
      return;
    }

    applyHexToActiveToken(rgbToHex(r, g, b));
  };

  const applyStyleValueToToken = (tokenPath: string, rawValue: string) => {
    const token = styleStudioTokens.find((entry) => entry.pathText === tokenPath);
    if (!token || !editableThemeUi) {
      setColorStudioError('No editable style token selected.');
      return;
    }

    const nextValue = token.valueType === 'number' ? Number.parseFloat(rawValue) : rawValue;

    if (token.valueType === 'number' && !Number.isFinite(nextValue)) {
      setColorStudioError('Enter a valid number for this style setting.');
      return;
    }

    setColorStudioError(null);
    setEditableThemeUi((current) => (current ? setValueAtPath(current, token.path, nextValue) : current));
    setStyleStudioTokens((current) =>
      current.map((entry) => (entry.pathText === tokenPath ? { ...entry, value: nextValue } : entry))
    );
  };

  const applyUiSetting = (key: string, value: unknown) => {
    setEditableThemeUi((current) => {
      const next = {
        ...(current ?? {}),
        [key]: value,
      };

      const nextColorTokens = collectColorStudioTokens(next);
      const nextStyleTokens = collectStyleStudioTokens(next);
      const nextDraftMap = Object.fromEntries(nextColorTokens.map((token) => [token.pathText, token.value]));

      setColorStudioTokens(nextColorTokens);
      setStyleStudioTokens(nextStyleTokens);
      setColorDraftByToken(nextDraftMap);
      setActiveColorToken((previous) =>
        nextColorTokens.some((token) => token.pathText === previous)
          ? previous
          : nextColorTokens[0]?.pathText ?? ''
      );

      return next;
    });
    setColorStudioError(null);
  };

  const clearUiSettings = (keys: string[]) => {
    setEditableThemeUi((current) => {
      const next = { ...(current ?? {}) };
      keys.forEach((key) => {
        delete next[key];
      });

      const nextColorTokens = collectColorStudioTokens(next);
      const nextStyleTokens = collectStyleStudioTokens(next);
      const nextDraftMap = Object.fromEntries(nextColorTokens.map((token) => [token.pathText, token.value]));

      setColorStudioTokens(nextColorTokens);
      setStyleStudioTokens(nextStyleTokens);
      setColorDraftByToken(nextDraftMap);
      setActiveColorToken((previous) =>
        nextColorTokens.some((token) => token.pathText === previous)
          ? previous
          : nextColorTokens[0]?.pathText ?? ''
      );

      return next;
    });
    setColorStudioError(null);
  };

  return {
    uiTheme,
    activeColorToken,
    colorStudioTokens,
    styleStudioTokens,
    editableThemeUi,
    colorDraftByToken,
    themeSaveDraft,
    setThemeSaveDraft,
    setActiveColorToken,
    hexDraft,
    setHexDraft,
    rgbDraft,
    setRgbDraft,
    colorStudioError,
    setColorStudioError,
    hydrateFromTheme,
    applyHexToActiveToken,
    applyHexToToken,
    applyRgbToActiveToken,
    applyStyleValueToToken,
    applyUiSetting,
    clearUiSettings,
  };
}
