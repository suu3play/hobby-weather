import React, { useState, useRef, useCallback } from 'react';
import { HobbyManager } from './components/hobby/HobbyManager';
import { WeatherDisplay } from './components/weather/WeatherDisplay';
import { RecommendationDashboard } from './components/recommendation/RecommendationDashboard';
import { SettingsPage } from './components/settings/SettingsPage';
import { InitialSetupFlow } from './components/setup/InitialSetupFlow';
import { useInitialSetup } from './hooks/useInitialSetup';
import { ThemeToggle } from './components/theme/ThemeToggle';
import myLogo from './assets/hobbyWeather.png';

// アプリケーションのメインタブ
type TabType = 'weather' | 'hobbies' | 'recommendations' | 'settings';

function App() {
    const [activeTab, setActiveTab] = useState<TabType>('recommendations');
    const { setupState } = useInitialSetup();
    const [showSetupFlow, setShowSetupFlow] = useState(false);
    const navRef = useRef<HTMLElement>(null);

    // セットアップ完了状態の監視
    React.useEffect(() => {
        setShowSetupFlow(!setupState.isCompleted && !setupState.isLoading);
    }, [setupState.isCompleted, setupState.isLoading]);

    // カスタムイベントでセットアップ完了を監視
    React.useEffect(() => {
        const handleSetupCompleted = () => {
            setShowSetupFlow(false);
        };

        window.addEventListener('setup-completed', handleSetupCompleted);
        return () =>
            window.removeEventListener('setup-completed', handleSetupCompleted);
    }, []);

    // タブの設定
    const tabs = React.useMemo(() => [
        { id: 'recommendations' as TabType, label: 'おすすめ', icon: '🎯' },
        { id: 'weather' as TabType, label: '天気', icon: '🌤️' },
        { id: 'hobbies' as TabType, label: '趣味管理', icon: '🎨' },
        { id: 'settings' as TabType, label: '設定', icon: '⚙️' },
    ], []);

    // キーボードナビゲーション用のハンドラー
    const handleKeyboardNavigation = useCallback((event: React.KeyboardEvent) => {
        if (!navRef.current) return;

        const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
        let nextIndex = currentIndex;

        switch (event.key) {
            case 'ArrowLeft':
                event.preventDefault();
                nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
                break;
            case 'ArrowRight':
                event.preventDefault();
                nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
                break;
            case 'Home':
                event.preventDefault();
                nextIndex = 0;
                break;
            case 'End':
                event.preventDefault();
                nextIndex = tabs.length - 1;
                break;
            default:
                return;
        }

        setActiveTab(tabs[nextIndex].id);
        
        // フォーカスを新しいタブに移動
        if (navRef.current && navRef.current.children[nextIndex]) {
            const tabButton = navRef.current.children[nextIndex] as HTMLButtonElement;
            tabButton.focus();
        }
    }, [activeTab, tabs]);

    // 初期セットアップが完了していない場合、セットアップフローを表示
    if (showSetupFlow) {
        return <InitialSetupFlow />;
    }

    // 初期化中の場合、ローディング画面を表示
    if (setupState.isLoading) {
        return (
            <div className="min-h-screen bg-background-primary flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
                    <p className="text-text-secondary">
                        アプリケーションを初期化中...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-primary">
            {/* ヘッダー */}
            <header className="fixed top-0 left-0 right-0 bg-surface-primary shadow-sm border-b border-border-primary z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <img
                                src={myLogo}
                                alt="趣味予報アプリのロゴ"
                                className="w-12 h-12"
                            />
                            <h1 className="text-xl font-bold text-text-primary">
                                趣味予報
                            </h1>
                            <span className="text-sm text-text-tertiary">
                                hobby-weather
                            </span>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* テーマ切り替えボタン */}
                            <ThemeToggle variant="button" />

                            {/* ナビゲーションタブ */}
                            <nav 
                                ref={navRef}
                                className="flex space-x-1" 
                                role="tablist" 
                                aria-label="メインナビゲーション"
                                onKeyDown={handleKeyboardNavigation}
                            >
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        role="tab"
                                        aria-selected={activeTab === tab.id}
                                        aria-controls={`${tab.id}-panel`}
                                        id={`${tab.id}-tab`}
                                        tabIndex={activeTab === tab.id ? 0 : -1}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface-primary ${
                                            activeTab === tab.id
                                                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                                                : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                                        }`}
                                        aria-label={`${tab.label}を表示`}
                                    >
                                        <span aria-hidden="true">{tab.icon}</span>
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>
            </header>

            {/* メインコンテンツ */}
            <main className="pt-16 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div 
                        id="recommendations-panel" 
                        role="tabpanel" 
                        tabIndex={0} 
                        aria-labelledby="recommendations-tab"
                        hidden={activeTab !== 'recommendations'}
                    >
                        {activeTab === 'recommendations' && (
                            <RecommendationDashboard />
                        )}
                    </div>
                    <div 
                        id="weather-panel" 
                        role="tabpanel" 
                        tabIndex={0} 
                        aria-labelledby="weather-tab"
                        hidden={activeTab !== 'weather'}
                    >
                        {activeTab === 'weather' && <WeatherDisplay />}
                    </div>
                    <div 
                        id="hobbies-panel" 
                        role="tabpanel" 
                        tabIndex={0} 
                        aria-labelledby="hobbies-tab"
                        hidden={activeTab !== 'hobbies'}
                    >
                        {activeTab === 'hobbies' && <HobbyManager />}
                    </div>
                    <div 
                        id="settings-panel" 
                        role="tabpanel" 
                        tabIndex={0} 
                        aria-labelledby="settings-tab"
                        hidden={activeTab !== 'settings'}
                    >
                        {activeTab === 'settings' && <SettingsPage />}
                    </div>
                </div>
            </main>

            {/* フッター */}
            <footer className="bg-surface-primary border-t border-border-primary mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-text-secondary">
                            © 2025 趣味予報 - 天気に基づく趣味おすすめアプリ
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;