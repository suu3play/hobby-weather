import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getSystemPreference,
  getSystemReducedMotion,
  getSystemHighContrast,
  getDefaultThemeConfig,
  loadThemeConfig,
  saveThemeConfig,
  resolveTheme,
  applyThemeToDocument,
  createMediaQueryListener,
  THEME_STORAGE_KEY,
} from './theme';
import { defaultThemes } from '../constants/themes';

// matchMedia のモック
const createMatchMediaMock = (matches: boolean) => ({
  matches,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});

// localStorage のモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

describe('theme utilities', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSystemPreference', () => {
    it('ダークモードが有効な場合はdarkを返す', () => {
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn(() => createMatchMediaMock(true)),
      });

      expect(getSystemPreference()).toBe('dark');
    });

    it('ダークモードが無効な場合はlightを返す', () => {
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn(() => createMatchMediaMock(false)),
      });

      expect(getSystemPreference()).toBe('light');
    });

    it('windowが未定義の場合はlightを返す', () => {
      const originalWindow = global.window;
      // @ts-expect-error - テスト用にwindowを削除
      delete global.window;

      expect(getSystemPreference()).toBe('light');

      global.window = originalWindow;
    });
  });

  describe('getSystemReducedMotion', () => {
    it('動きの軽減が有効な場合はtrueを返す', () => {
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn(() => createMatchMediaMock(true)),
      });

      expect(getSystemReducedMotion()).toBe(true);
    });

    it('動きの軽減が無効な場合はfalseを返す', () => {
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn(() => createMatchMediaMock(false)),
      });

      expect(getSystemReducedMotion()).toBe(false);
    });
  });

  describe('getSystemHighContrast', () => {
    it('高コントラストが有効な場合はtrueを返す', () => {
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn(() => createMatchMediaMock(true)),
      });

      expect(getSystemHighContrast()).toBe(true);
    });

    it('高コントラストが無効な場合はfalseを返す', () => {
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn(() => createMatchMediaMock(false)),
      });

      expect(getSystemHighContrast()).toBe(false);
    });
  });

  describe('getDefaultThemeConfig', () => {
    it('デフォルト設定を返す', () => {
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn(() => createMatchMediaMock(false)),
      });

      const config = getDefaultThemeConfig();
      
      expect(config).toEqual({
        mode: 'system',
        highContrast: false,
        reducedMotion: false,
        fontSize: 'medium',
      });
    });
  });

  describe('loadThemeConfig', () => {
    it('保存された設定を読み込む', () => {
      const savedConfig = {
        mode: 'dark',
        highContrast: true,
        reducedMotion: false,
        fontSize: 'large',
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedConfig));

      const config = loadThemeConfig();
      
      expect(config.mode).toBe('dark');
      expect(config.highContrast).toBe(true);
      expect(config.fontSize).toBe('large');
    });

    it('無効なJSONの場合はデフォルト設定を返す', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const config = loadThemeConfig();
      
      expect(config.mode).toBe('system');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load theme config from localStorage:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('設定が存在しない場合はデフォルト設定を返す', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const config = loadThemeConfig();
      
      expect(config.mode).toBe('system');
    });
  });

  describe('saveThemeConfig', () => {
    it('設定をlocalStorageに保存する', () => {
      const config = {
        mode: 'dark' as const,
        highContrast: true,
        reducedMotion: false,
        fontSize: 'large' as const,
      };
      
      saveThemeConfig(config);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        THEME_STORAGE_KEY,
        JSON.stringify(config)
      );
    });

    it('保存エラーの場合は警告を出力する', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const config = {
        mode: 'dark' as const,
        highContrast: false,
        reducedMotion: false,
        fontSize: 'medium' as const,
      };
      
      saveThemeConfig(config);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save theme config to localStorage:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('resolveTheme', () => {
    it('カスタムテーマが設定されている場合はそれを返す', () => {
      const customTheme = defaultThemes.light;
      const config = {
        mode: 'system' as const,
        customTheme,
        highContrast: false,
        reducedMotion: false,
        fontSize: 'medium' as const,
      };
      
      const theme = resolveTheme(config, 'dark');
      
      expect(theme).toBe(customTheme);
    });

    it('高コントラストモードが有効な場合は高コントラストテーマを返す', () => {
      const config = {
        mode: 'system' as const,
        highContrast: true,
        reducedMotion: false,
        fontSize: 'medium' as const,
      };
      
      const darkTheme = resolveTheme(config, 'dark');
      const lightTheme = resolveTheme(config, 'light');
      
      expect(darkTheme).toBe(defaultThemes['high-contrast-dark']);
      expect(lightTheme).toBe(defaultThemes['high-contrast-light']);
    });

    it('システム設定に従う場合はシステム設定に基づいてテーマを返す', () => {
      const config = {
        mode: 'system' as const,
        highContrast: false,
        reducedMotion: false,
        fontSize: 'medium' as const,
      };
      
      const darkTheme = resolveTheme(config, 'dark');
      const lightTheme = resolveTheme(config, 'light');
      
      expect(darkTheme).toBe(defaultThemes.dark);
      expect(lightTheme).toBe(defaultThemes.light);
    });

    it('明示的なモードが設定されている場合はそれに従う', () => {
      const config = {
        mode: 'dark' as const,
        highContrast: false,
        reducedMotion: false,
        fontSize: 'medium' as const,
      };
      
      const theme = resolveTheme(config, 'light'); // システム設定はライトだが、ダークモードを指定
      
      expect(theme).toBe(defaultThemes.dark);
    });
  });

  describe('applyThemeToDocument', () => {
    let mockRoot: {
      style: { setProperty: ReturnType<typeof vi.fn> };
      classList: { add: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> };
    };

    beforeEach(() => {
      mockRoot = {
        style: { setProperty: vi.fn() },
        classList: { add: vi.fn(), remove: vi.fn() },
      };
      
      Object.defineProperty(document, 'documentElement', {
        value: mockRoot,
        configurable: true,
      });
    });

    it('テーマの色をCSS変数として設定する', () => {
      const theme = defaultThemes.light;
      const config = {
        mode: 'light' as const,
        highContrast: false,
        reducedMotion: false,
        fontSize: 'medium' as const,
      };
      
      applyThemeToDocument(theme, config);
      
      expect(mockRoot.style.setProperty).toHaveBeenCalledWith('--color-primary', theme.colors.primary);
      expect(mockRoot.style.setProperty).toHaveBeenCalledWith('--color-background-primary', theme.colors.background.primary);
    });

    it('ダークモードクラスを適切に設定する', () => {
      const darkTheme = defaultThemes.dark;
      const lightTheme = defaultThemes.light;
      const config = {
        mode: 'dark' as const,
        highContrast: false,
        reducedMotion: false,
        fontSize: 'medium' as const,
      };
      
      applyThemeToDocument(darkTheme, config);
      expect(mockRoot.classList.add).toHaveBeenCalledWith('dark');
      
      vi.clearAllMocks();
      
      applyThemeToDocument(lightTheme, config);
      expect(mockRoot.classList.remove).toHaveBeenCalledWith('dark');
    });

    it('アクセシビリティクラスを適切に設定する', () => {
      const theme = defaultThemes.light;
      const config = {
        mode: 'light' as const,
        highContrast: true,
        reducedMotion: true,
        fontSize: 'medium' as const,
      };
      
      applyThemeToDocument(theme, config);
      
      expect(mockRoot.classList.add).toHaveBeenCalledWith('high-contrast');
      expect(mockRoot.classList.add).toHaveBeenCalledWith('reduce-motion');
    });

    it('フォントサイズクラスを適切に設定する', () => {
      const theme = defaultThemes.light;
      const config = {
        mode: 'light' as const,
        highContrast: false,
        reducedMotion: false,
        fontSize: 'large' as const,
      };
      
      applyThemeToDocument(theme, config);
      
      expect(mockRoot.classList.remove).toHaveBeenCalledWith('text-sm', 'text-base', 'text-lg');
      expect(mockRoot.classList.add).toHaveBeenCalledWith('text-lg');
    });
  });

  describe('createMediaQueryListener', () => {
    it('メディアクエリの変更を監視する', () => {
      const mockMediaQuery = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn(() => mockMediaQuery),
      });
      
      const callback = vi.fn();
      const cleanup = createMediaQueryListener(callback, '(prefers-color-scheme: dark)');
      
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
      
      cleanup();
      
      expect(mockMediaQuery.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('windowが未定義の場合は空の関数を返す', () => {
      const originalWindow = global.window;
      // @ts-expect-error - テスト用にwindowを削除
      delete global.window;
      
      const callback = vi.fn();
      const cleanup = createMediaQueryListener(callback, '(prefers-color-scheme: dark)');
      
      expect(typeof cleanup).toBe('function');
      expect(() => cleanup()).not.toThrow();
      
      global.window = originalWindow;
    });
  });
});