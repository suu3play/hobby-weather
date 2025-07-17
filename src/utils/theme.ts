import type { ThemeConfig, Theme } from '../types/theme';
import { defaultThemes } from '../constants/themes';

export const THEME_STORAGE_KEY = 'hobby-weather-theme-config';

export const getSystemPreference = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const getSystemReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const getSystemHighContrast = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
};

export const getDefaultThemeConfig = (): ThemeConfig => ({
  mode: 'system',
  highContrast: getSystemHighContrast(),
  reducedMotion: getSystemReducedMotion(),
  fontSize: 'medium',
});

export const loadThemeConfig = (): ThemeConfig => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...getDefaultThemeConfig(),
        ...parsed,
      };
    }
  } catch (error) {
    console.warn('Failed to load theme config from localStorage:', error);
  }
  return getDefaultThemeConfig();
};

export const saveThemeConfig = (config: ThemeConfig): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.warn('Failed to save theme config to localStorage:', error);
  }
};

export const resolveTheme = (
  config: ThemeConfig,
  systemPreference: 'light' | 'dark'
): Theme => {
  // カスタムテーマが設定されている場合はそれを使用
  if (config.customTheme) {
    return config.customTheme;
  }

  // 現在のモードを決定
  const currentMode = config.mode === 'system' ? systemPreference : config.mode;

  // 高コントラストモードの場合
  if (config.highContrast) {
    return currentMode === 'dark' 
      ? defaultThemes['high-contrast-dark'] 
      : defaultThemes['high-contrast-light'];
  }

  // 通常のテーマ
  return currentMode === 'dark' ? defaultThemes.dark : defaultThemes.light;
};

export const applyThemeToDocument = (theme: Theme, config: ThemeConfig): void => {
  const root = document.documentElement;

  // CSS変数を設定
  Object.entries(theme.colors).forEach(([key, value]) => {
    if (typeof value === 'string') {
      root.style.setProperty(`--color-${key}`, value);
    } else if (typeof value === 'object') {
      Object.entries(value).forEach(([subKey, subValue]) => {
        root.style.setProperty(`--color-${key}-${subKey}`, subValue as string);
      });
    }
  });

  // フォントサイズクラスを設定
  root.classList.remove('text-sm', 'text-base', 'text-lg');
  switch (config.fontSize) {
    case 'small':
      root.classList.add('text-sm');
      break;
    case 'large':
      root.classList.add('text-lg');
      break;
    default:
      root.classList.add('text-base');
  }

  // ダークモードクラスの設定
  if (theme.mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // アクセシビリティクラスの設定
  if (config.highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }

  if (config.reducedMotion) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }
};

export const createMediaQueryListener = (
  callback: (matches: boolean) => void,
  query: string
): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const mediaQuery = window.matchMedia(query);
  const handler = (e: MediaQueryListEvent) => callback(e.matches);
  
  mediaQuery.addEventListener('change', handler);
  
  return () => mediaQuery.removeEventListener('change', handler);
};