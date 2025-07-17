import React, { useState } from 'react';
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
    const tabs = [
        { id: 'recommendations' as TabType, label: 'おすすめ', icon: '🎯' },
        { id: 'weather' as TabType, label: '天気', icon: '🌤️' },
        { id: 'hobbies' as TabType, label: '趣味管理', icon: '🎨' },
        { id: 'settings' as TabType, label: '設定', icon: '⚙️' },
    ];

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
            <header className="bg-surface-primary shadow-sm border-b border-border-primary">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <img
                                src={myLogo}
                                alt="ロゴ"
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
                            <nav className="flex space-x-1">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                                            activeTab === tab.id
                                                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                                                : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                                        }`}
                                    >
                                        <span>{tab.icon}</span>
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>
            </header>

            {/* メインコンテンツ */}
            <main className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {activeTab === 'recommendations' && (
                        <RecommendationDashboard />
                    )}
                    {activeTab === 'weather' && <WeatherDisplay />}
                    {activeTab === 'hobbies' && <HobbyManager />}
                    {activeTab === 'settings' && <SettingsPage />}
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
