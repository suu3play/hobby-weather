import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { ThemeMode } from '../../types/theme';

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'button',
  className = '' 
}) => {
  const { config, setMode, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const modes = React.useMemo(() => ['light', 'dark', 'system'] as ThemeMode[], []);

  // ドロップダウンが開いたときに現在のモードにフォーカスを設定
  useEffect(() => {
    if (isOpen && variant === 'dropdown') {
      const currentModeIndex = modes.findIndex(mode => mode === config.mode);
      setFocusedIndex(currentModeIndex !== -1 ? currentModeIndex : 0);
      
      // 少し遅延してフォーカスを設定（アニメーション後）
      setTimeout(() => {
        const focusableElements = menuRef.current?.querySelectorAll('button');
        if (focusableElements && focusableElements[currentModeIndex !== -1 ? currentModeIndex : 0]) {
          (focusableElements[currentModeIndex !== -1 ? currentModeIndex : 0] as HTMLButtonElement).focus();
        }
      }, 100);
    }
  }, [isOpen, config.mode, variant, modes]);

  // キーボードナビゲーション用のハンドラー
  const handleKeyDown = useCallback((event: React.KeyboardEvent): void => {
    if (variant === 'button') {
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
        if (!isOpen) {
          event.preventDefault();
          setIsOpen(true);
        } else {
          event.preventDefault();
          const nextIndex = focusedIndex < modes.length - 1 ? focusedIndex + 1 : 0;
          setFocusedIndex(nextIndex);
          const focusableElements = menuRef.current?.querySelectorAll('button');
          if (focusableElements && focusableElements[nextIndex]) {
            (focusableElements[nextIndex] as HTMLButtonElement).focus();
          }
        }
        break;
      case 'ArrowUp':
        if (!isOpen) {
          event.preventDefault();
          setIsOpen(true);
        } else {
          event.preventDefault();
          const prevIndex = focusedIndex > 0 ? focusedIndex - 1 : modes.length - 1;
          setFocusedIndex(prevIndex);
          const focusableElements = menuRef.current?.querySelectorAll('button');
          if (focusableElements && focusableElements[prevIndex]) {
            (focusableElements[prevIndex] as HTMLButtonElement).focus();
          }
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const selectedMode = modes[focusedIndex];
          if (selectedMode) {
            setMode(selectedMode);
            setIsOpen(false);
            buttonRef.current?.focus();
          }
        }
        break;
      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
        }
        break;
    }
  }, [variant, isOpen, focusedIndex, modes, setMode]);

  // 外側クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [isOpen]);

  // 現在のテーマの説明テキスト
  const getCurrentThemeDescription = (): string => {
    switch (config.mode) {
      case 'dark':
        return 'ダークモード（現在選択中）';
      case 'light':
        return 'ライトモード（現在選択中）';
      case 'system':
        return 'システム設定（現在選択中）';
      default:
        return 'テーマ選択';
    }
  };

  if (variant === 'button') {
    return (
      <button
        ref={buttonRef}
        onClick={toggleTheme}
        className={`
          p-2 rounded-lg transition-colors duration-200
          bg-surface-secondary hover:bg-surface-elevated
          border border-border-primary
          text-text-primary
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-primary
          ${className}
        `}
        aria-label={`テーマを切り替え（${getCurrentThemeDescription()}）`}
        title="テーマを切り替え"
      >
        {config.mode === 'dark' ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : config.mode === 'light' ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    );
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="
          flex items-center gap-2 px-3 py-2 rounded-lg
          bg-surface-secondary hover:bg-surface-elevated
          border border-border-primary
          text-text-primary text-sm
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-primary
        "
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`テーマ選択メニュー（${getCurrentThemeDescription()}）`}
        id="theme-toggle-button"
      >
        <span className="flex items-center gap-2">
          {config.mode === 'dark' ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              ダークモード
            </>
          ) : config.mode === 'light' ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              ライトモード
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              システム設定
            </>
          )}
        </span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          ref={menuRef}
          className="
            absolute right-0 mt-2 w-48 z-20
            bg-surface-elevated border border-border-primary
            rounded-lg shadow-lg animate-scale-in
          "
          role="menu"
          aria-labelledby="theme-toggle-button"
        >
          {modes.map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setMode(mode);
                setIsOpen(false);
                buttonRef.current?.focus();
              }}
              onKeyDown={handleKeyDown}
              role="menuitem"
              aria-checked={config.mode === mode}
              className={`
                w-full flex items-center gap-3 px-4 py-3 text-left
                hover:bg-surface-secondary focus:bg-surface-secondary transition-colors duration-200
                first:rounded-t-lg last:rounded-b-lg
                focus:outline-none
                ${config.mode === mode ? 'bg-primary-50 text-primary-600' : 'text-text-primary'}
              `}
            >
              <span className="w-4 h-4 flex-shrink-0" aria-hidden="true">
                {mode === 'light' && (
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
                {mode === 'dark' && (
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
                {mode === 'system' && (
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                )}
              </span>
              <span className="text-sm">
                {mode === 'light' && 'ライトモード'}
                {mode === 'dark' && 'ダークモード'}
                {mode === 'system' && 'システム設定'}
              </span>
              {config.mode === mode && (
                <span className="ml-auto" aria-label="選択中">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};