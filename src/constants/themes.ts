import type { Theme } from '../types/theme';

export const lightTheme: Theme = {
  name: 'light',
  mode: 'light',
  colors: {
    primary: '#3b82f6',
    secondary: '#6366f1',
    accent: '#8b5cf6',
    neutral: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
    },
    surface: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      elevated: '#ffffff',
    },
    text: {
      primary: '#1f2937',
      secondary: '#4b5563',
      tertiary: '#6b7280',
      inverse: '#ffffff',
    },
    border: {
      primary: '#e5e7eb',
      secondary: '#d1d5db',
      focus: '#3b82f6',
    },
  },
};

export const darkTheme: Theme = {
  name: 'dark',
  mode: 'dark',
  colors: {
    primary: '#60a5fa',
    secondary: '#818cf8',
    accent: '#a78bfa',
    neutral: '#9ca3af',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    background: {
      primary: '#1f2937',
      secondary: '#111827',
      tertiary: '#0f172a',
    },
    surface: {
      primary: '#374151',
      secondary: '#4b5563',
      elevated: '#475569',
    },
    text: {
      primary: '#f9fafb',
      secondary: '#d1d5db',
      tertiary: '#9ca3af',
      inverse: '#1f2937',
    },
    border: {
      primary: '#4b5563',
      secondary: '#6b7280',
      focus: '#60a5fa',
    },
  },
};

export const highContrastLightTheme: Theme = {
  name: 'high-contrast-light',
  mode: 'light',
  colors: {
    primary: '#0066cc',
    secondary: '#4d4d4d',
    accent: '#7a00cc',
    neutral: '#333333',
    success: '#008800',
    warning: '#cc6600',
    error: '#cc0000',
    background: {
      primary: '#ffffff',
      secondary: '#f5f5f5',
      tertiary: '#eeeeee',
    },
    surface: {
      primary: '#ffffff',
      secondary: '#f5f5f5',
      elevated: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#333333',
      tertiary: '#4d4d4d',
      inverse: '#ffffff',
    },
    border: {
      primary: '#000000',
      secondary: '#333333',
      focus: '#0066cc',
    },
  },
};

export const highContrastDarkTheme: Theme = {
  name: 'high-contrast-dark',
  mode: 'dark',
  colors: {
    primary: '#66b3ff',
    secondary: '#b3b3b3',
    accent: '#b366ff',
    neutral: '#cccccc',
    success: '#66ff66',
    warning: '#ffcc66',
    error: '#ff6666',
    background: {
      primary: '#000000',
      secondary: '#1a1a1a',
      tertiary: '#0d0d0d',
    },
    surface: {
      primary: '#333333',
      secondary: '#4d4d4d',
      elevated: '#404040',
    },
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
      tertiary: '#b3b3b3',
      inverse: '#000000',
    },
    border: {
      primary: '#ffffff',
      secondary: '#cccccc',
      focus: '#66b3ff',
    },
  },
};

export const defaultThemes = {
  light: lightTheme,
  dark: darkTheme,
  'high-contrast-light': highContrastLightTheme,
  'high-contrast-dark': highContrastDarkTheme,
} as const;