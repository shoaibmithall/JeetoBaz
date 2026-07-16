/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { AppThemes, Colors, type AppThemeMode } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useState } from 'react';
import { getStoredValue, setStoredValue } from '@/lib/storage';

const THEME_KEY = 'appThemeMode';
const listeners = new Set<(mode: AppThemeMode) => void>();
let resolvedMode: AppThemeMode | null = null;

export function useTheme() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? 'dark' : 'light';

  return Colors[theme];
}

function normalizeTheme(value: string | null): AppThemeMode {
  return value === 'light' ? 'light' : 'dark';
}

export async function setAppThemeMode(mode: AppThemeMode) {
  resolvedMode = mode;
  await setStoredValue(THEME_KEY, mode);
  listeners.forEach((listener) => listener(mode));
}

export function useAppTheme() {
  const [mode, setModeState] = useState<AppThemeMode>(() => resolvedMode || 'dark');
  const [ready, setReady] = useState(resolvedMode !== null);

  useEffect(() => {
    let active = true;
    const listener = (nextMode: AppThemeMode) => {
      setModeState(nextMode);
      setReady(true);
    };
    listeners.add(listener);

    if (resolvedMode) {
      setModeState(resolvedMode);
      setReady(true);
    } else {
      getStoredValue(THEME_KEY).then((value) => {
        if (!active) return;
        resolvedMode = normalizeTheme(value);
        listeners.forEach((themeListener) => themeListener(resolvedMode!));
      });
    }

    return () => {
      active = false;
      listeners.delete(listener);
    };
  }, []);

  return {
    mode,
    ready,
    theme: AppThemes[mode],
    setThemeMode: setAppThemeMode,
    toggleThemeMode: async () => {
      const current = normalizeTheme(await getStoredValue(THEME_KEY));
      await setAppThemeMode(current === 'dark' ? 'light' : 'dark');
    },
  };
}
