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

export function useTheme() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? 'dark' : 'light';

  return Colors[theme];
}

function normalizeTheme(value: string | null): AppThemeMode {
  return value === 'light' ? 'light' : 'dark';
}

function getInitialThemeMode(): AppThemeMode {
  if (process.env.EXPO_OS === 'web' && typeof window !== 'undefined') {
    return normalizeTheme(window.localStorage.getItem(THEME_KEY));
  }
  return 'dark';
}

export async function setAppThemeMode(mode: AppThemeMode) {
  await setStoredValue(THEME_KEY, mode);
  listeners.forEach((listener) => listener(mode));
}

export function useAppTheme() {
  const [mode, setModeState] = useState<AppThemeMode>(getInitialThemeMode);

  useEffect(() => {
    let active = true;
    getStoredValue(THEME_KEY).then((value) => {
      if (active) setModeState(normalizeTheme(value));
    });
    const listener = (nextMode: AppThemeMode) => setModeState(nextMode);
    listeners.add(listener);
    return () => {
      active = false;
      listeners.delete(listener);
    };
  }, []);

  return {
    mode,
    theme: AppThemes[mode],
    setThemeMode: setAppThemeMode,
    toggleThemeMode: async () => {
      const current = normalizeTheme(await getStoredValue(THEME_KEY));
      await setAppThemeMode(current === 'dark' ? 'light' : 'dark');
    },
  };
}
