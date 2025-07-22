export type ThemeMode = 'light' | 'dark' | 'system';

export type ColorVariant = 'primary' | 'secondary' | 'accent' | 'neutral' | 'success' | 'warning' | 'error';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  success: string;
  warning: string;
  error: string;
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  surface: {
    primary: string;
    secondary: string;
    elevated: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  border: {
    primary: string;
    secondary: string;
    focus: string;
  };
}

export interface Theme {
  name: string;
  mode: 'light' | 'dark';
  colors: ThemeColors;
}

export interface ThemeConfig {
  mode: ThemeMode;
  customTheme?: Theme;
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export interface ThemeContextType {
  config: ThemeConfig;
  currentTheme: Theme;
  systemPreference: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  setHighContrast: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  toggleTheme: () => void;
}