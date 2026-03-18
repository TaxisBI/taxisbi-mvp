import { useMemo } from 'react';
import { ColorStudioToken } from '../types';

type ThemeType = 'all' | 'monocolor' | 'adjacent' | 'diverging';
type ThemeTone = 'all' | 'light' | 'dark';

export type ThemeTokenFolder = {
  key: string;
  label: string;
  tokens: ColorStudioToken[];
};

export function useThemeBuilderTokenFolders(
  colorStudioTokens: ColorStudioToken[],
  themeType: ThemeType,
  themeTone: ThemeTone
) {
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

      if (themeTone !== 'all') {
        const hasLightWord = /\blight\b/.test(haystack);
        const hasDarkWord = /\bdark\b/.test(haystack);
        if (themeTone === 'light' && hasDarkWord && !hasLightWord) {
          return false;
        }
        if (themeTone === 'dark' && hasLightWord && !hasDarkWord) {
          return false;
        }
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

  return { filteredTokens, tokenFolders };
}
