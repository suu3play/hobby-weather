import React, {
    useEffect,
    useState,
    useCallback,
} from 'react';
import { ThemeContext } from './ThemeContext';
import type {
    ThemeContextType,
    ThemeConfig,
    Theme,
    ThemeMode,
} from '../types/theme';
import {
    getSystemPreference,
    loadThemeConfig,
    saveThemeConfig,
    resolveTheme,
    applyThemeToDocument,
    createMediaQueryListener,
} from '../utils/theme';

interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [config, setConfig] = useState<ThemeConfig>(() => loadThemeConfig());
    const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>(
        () => getSystemPreference()
    );
    const [currentTheme, setCurrentTheme] = useState<Theme>(() =>
        resolveTheme(loadThemeConfig(), getSystemPreference())
    );

    // システム設定の変更を監視
    useEffect(() => {
        const unsubscribeColorScheme = createMediaQueryListener(
            (matches) => setSystemPreference(matches ? 'dark' : 'light'),
            '(prefers-color-scheme: dark)'
        );

        const unsubscribeReducedMotion = createMediaQueryListener((matches) => {
            setConfig((prev) => {
                const newConfig = { ...prev, reducedMotion: matches };
                saveThemeConfig(newConfig);
                return newConfig;
            });
        }, '(prefers-reduced-motion: reduce)');

        const unsubscribeHighContrast = createMediaQueryListener((matches) => {
            setConfig((prev) => {
                const newConfig = { ...prev, highContrast: matches };
                saveThemeConfig(newConfig);
                return newConfig;
            });
        }, '(prefers-contrast: high)');

        return () => {
            unsubscribeColorScheme();
            unsubscribeReducedMotion();
            unsubscribeHighContrast();
        };
    }, []);

    // テーマの解決とドキュメントへの適用
    useEffect(() => {
        const newTheme = resolveTheme(config, systemPreference);
        setCurrentTheme(newTheme);
        applyThemeToDocument(newTheme, config);
    }, [config, systemPreference]);

    // 設定変更時の保存
    useEffect(() => {
        saveThemeConfig(config);
    }, [config]);

    const setMode = useCallback((mode: ThemeMode) => {
        setConfig((prev) => ({ ...prev, mode }));
    }, []);

    const setHighContrast = useCallback((enabled: boolean) => {
        setConfig((prev) => ({ ...prev, highContrast: enabled }));
    }, []);

    const setReducedMotion = useCallback((enabled: boolean) => {
        setConfig((prev) => ({ ...prev, reducedMotion: enabled }));
    }, []);

    const setFontSize = useCallback((size: 'small' | 'medium' | 'large') => {
        setConfig((prev) => ({ ...prev, fontSize: size }));
    }, []);

    const toggleTheme = useCallback(() => {
        setConfig((prev) => {
            if (prev.mode === 'system') {
                // システム設定から明示的にライトモードに切り替え
                return { ...prev, mode: 'light' };
            } else if (prev.mode === 'light') {
                // ライトモードからダークモードに切り替え
                return { ...prev, mode: 'dark' };
            } else {
                // ダークモードからシステム設定に戻す
                return { ...prev, mode: 'system' };
            }
        });
    }, []);

    const value: ThemeContextType = {
        config,
        currentTheme,
        systemPreference,
        setMode,
        setHighContrast,
        setReducedMotion,
        setFontSize,
        toggleTheme,
    };

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
};

