import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '../../contexts/ThemeContext.tsx';
import { useTheme } from '../../hooks/useTheme';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// テスト用コンポーネント
const TestComponent = () => {
  const {
    config,
    currentTheme,
    systemPreference,
    setMode,
    setHighContrast,
    setReducedMotion,
    setFontSize,
    toggleTheme,
  } = useTheme();

  return (
    <div>
      <div data-testid="current-mode">{config.mode}</div>
      <div data-testid="current-theme-name">{currentTheme.name}</div>
      <div data-testid="system-preference">{systemPreference}</div>
      <div data-testid="high-contrast">{config.highContrast.toString()}</div>
      <div data-testid="reduced-motion">{config.reducedMotion.toString()}</div>
      <div data-testid="font-size">{config.fontSize}</div>
      
      <button onClick={() => setMode('dark')} data-testid="set-dark">
        Set Dark
      </button>
      <button onClick={() => setMode('light')} data-testid="set-light">
        Set Light
      </button>
      <button onClick={() => setMode('system')} data-testid="set-system">
        Set System
      </button>
      <button onClick={() => setHighContrast(true)} data-testid="set-high-contrast">
        Set High Contrast
      </button>
      <button onClick={() => setReducedMotion(true)} data-testid="set-reduced-motion">
        Set Reduced Motion
      </button>
      <button onClick={() => setFontSize('large')} data-testid="set-large-font">
        Set Large Font
      </button>
      <button onClick={toggleTheme} data-testid="toggle-theme">
        Toggle Theme
      </button>
    </div>
  );
};

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

// matchMedia のモック
const matchMediaMock = vi.fn((query: string) => ({
  matches: query.includes('dark'),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}));

describe('ThemeContext', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });
    Object.defineProperty(window, 'matchMedia', {
      value: matchMediaMock,
    });
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('デフォルト設定で初期化される', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-mode')).toHaveTextContent('system');
    expect(screen.getByTestId('font-size')).toHaveTextContent('medium');
    expect(screen.getByTestId('high-contrast')).toHaveTextContent('false');
    expect(screen.getByTestId('reduced-motion')).toHaveTextContent('false');
  });

  it('テーマモードを変更できる', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('set-dark'));
    
    await waitFor(() => {
      expect(screen.getByTestId('current-mode')).toHaveTextContent('dark');
      expect(screen.getByTestId('current-theme-name')).toHaveTextContent('dark');
    });

    fireEvent.click(screen.getByTestId('set-light'));
    
    await waitFor(() => {
      expect(screen.getByTestId('current-mode')).toHaveTextContent('light');
      expect(screen.getByTestId('current-theme-name')).toHaveTextContent('light');
    });
  });

  it('高コントラストモードを切り替えできる', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('set-high-contrast'));
    
    await waitFor(() => {
      expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
    });
  });

  it('動きの軽減を切り替えできる', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('set-reduced-motion'));
    
    await waitFor(() => {
      expect(screen.getByTestId('reduced-motion')).toHaveTextContent('true');
    });
  });

  it('フォントサイズを変更できる', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('set-large-font'));
    
    await waitFor(() => {
      expect(screen.getByTestId('font-size')).toHaveTextContent('large');
    });
  });

  it('toggleTheme が正しく動作する', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // system -> light
    fireEvent.click(screen.getByTestId('toggle-theme'));
    await waitFor(() => {
      expect(screen.getByTestId('current-mode')).toHaveTextContent('light');
    });

    // light -> dark
    fireEvent.click(screen.getByTestId('toggle-theme'));
    await waitFor(() => {
      expect(screen.getByTestId('current-mode')).toHaveTextContent('dark');
    });

    // dark -> system
    fireEvent.click(screen.getByTestId('toggle-theme'));
    await waitFor(() => {
      expect(screen.getByTestId('current-mode')).toHaveTextContent('system');
    });
  });

  it('設定がlocalStorageに保存される', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByTestId('set-dark'));
    fireEvent.click(screen.getByTestId('set-high-contrast'));
    
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'hobby-weather-theme-config',
        expect.stringContaining('"mode":"dark"')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'hobby-weather-theme-config',
        expect.stringContaining('"highContrast":true')
      );
    });
  });

  it('localStorageから設定が復元される', () => {
    const savedConfig = {
      mode: 'dark',
      highContrast: true,
      reducedMotion: false,
      fontSize: 'large',
    };
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedConfig));

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-mode')).toHaveTextContent('dark');
    expect(screen.getByTestId('high-contrast')).toHaveTextContent('true');
    expect(screen.getByTestId('font-size')).toHaveTextContent('large');
  });

  it('無効なlocalStorageデータでもエラーにならない', () => {
    localStorageMock.getItem.mockReturnValue('invalid json');

    expect(() => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );
    }).not.toThrow();

    expect(screen.getByTestId('current-mode')).toHaveTextContent('system');
  });

  it('useTheme をプロバイダー外で使用するとエラーになる', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');
    
    consoleErrorSpy.mockRestore();
  });
});