/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export const AppThemes = {
  dark: {
    mode: 'dark',
    background: '#0a0a0a',
    surface: '#1a1a1a',
    surfaceAlt: '#111111',
    selected: '#2b2200',
    text: '#ffffff',
    muted: '#aaa',
    subtle: '#666',
    border: '#333',
    primary: '#1DB954',
    primarySoft: '#0d2b1a',
    gold: '#FFD700',
    goldSoft: '#2b2200',
    danger: '#ff4444',
    dangerSoft: '#2b0d0d',
    info: '#4a9eff',
    infoSoft: '#1a3a5c',
    buttonText: '#000000',
  },
  light: {
    mode: 'light',
    background: '#f4f7f5',
    surface: '#ffffff',
    surfaceAlt: '#eef3ef',
    selected: '#fff6cc',
    text: '#162016',
    muted: '#53605a',
    subtle: '#7d887f',
    border: '#d9e2dc',
    primary: '#12883d',
    primarySoft: '#e4f6ea',
    gold: '#b38a00',
    goldSoft: '#fff3bf',
    danger: '#c62828',
    dangerSoft: '#fde7e7',
    info: '#1769aa',
    infoSoft: '#e4f1fb',
    buttonText: '#111111',
  },
} as const;

export type AppThemeMode = keyof typeof AppThemes;
export type AppTheme = typeof AppThemes.dark;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
