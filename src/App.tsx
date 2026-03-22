import React, { useRef, useCallback, Suspense, lazy, Component } from 'react';
import type { ReactNode } from 'react';
import { InitialSetupFlow } from './components/setup/InitialSetupFlow';
import { useInitialSetup } from './hooks/useInitialSetup';
import { ThemeToggle } from './components/theme/ThemeToggle';
import { InstallPrompt } from './components/pwa/InstallPrompt';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import myLogo from './assets/hobbyWeather.png';

// 動的インポートによるコード分割
const HobbyManager = lazy(() => import('./components/hobby/HobbyManager').then(module => ({ default: module.HobbyManager })));
const WeatherDisplay = lazy(() => import('./components/weather/WeatherDisplay').then(module => ({ default: module.WeatherDisplay })));
const RecommendationDashboard = lazy(() => import('./components/recommendation/RecommendationDashboard').then(module => ({ default: module.RecommendationDashboard })));
const SettingsPage = lazy(() => import('./components/settings/SettingsPage').then(module => ({ default: module.SettingsPage })));

// コード分割失敗時のフォールバック用ErrorBoundary
class LazyErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <p className="text-text-secondary mb-2">コンテンツの読み込みに失敗しました</p>
                        <button
                            onClick={() => this.setState({ hasError: false })}
                            className="text-sm text-primary-500 underline"
                        >
                            再試行
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// アプリケーションのメインタブ
type TabType = 'weather' | 'hobbies' | 'recommendations' | 'settings';

// ローディングコンポーネント
const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mr-3"></div>
        <span className="text-text-secondary">読み込み中...</span>
    </div>
);

function App() {
    const [activeTab, setActiveTab] = React.useState<TabType>('recommendations');
    const { setupState } = useInitialSetup();
    const navRef = useRef<HTMLElement>(null);

    // setupState から直接導出することで useEffect の非同期遅延による初期描画ズレを防ぐ
    const showSetupFlow = setupState.isLoading || !setupState.isCompleted;

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

        const nextTab = tabs[nextIndex]; if (nextTab) { setActiveTab(nextTab.id); }
        
        // フォーカスを新しいタブに移動
        if (navRef.current && navRef.current.querySelectorAll('[role="tab"]')[nextIndex]) {
            const tabButton = navRef.current.querySelectorAll('[role="tab"]')[nextIndex] as HTMLButtonElement;
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
            {/* PWAコンポーネント */}
            <InstallPrompt />
            <OfflineIndicator />
            
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
                    {/* タブパネルはhiddenのみで制御しコンポーネントを保持する */}
                    <div
                        id="recommendations-panel"
                        role="tabpanel"
                        tabIndex={0}
                        aria-labelledby="recommendations-tab"
                        hidden={activeTab !== 'recommendations'}
                    >
                        <LazyErrorBoundary>
                            <Suspense fallback={<LoadingSpinner />}>
                                <RecommendationDashboard />
                            </Suspense>
                        </LazyErrorBoundary>
                    </div>
                    <div
                        id="weather-panel"
                        role="tabpanel"
                        tabIndex={0}
                        aria-labelledby="weather-tab"
                        hidden={activeTab !== 'weather'}
                    >
                        <LazyErrorBoundary>
                            <Suspense fallback={<LoadingSpinner />}>
                                <WeatherDisplay />
                            </Suspense>
                        </LazyErrorBoundary>
                    </div>
                    <div
                        id="hobbies-panel"
                        role="tabpanel"
                        tabIndex={0}
                        aria-labelledby="hobbies-tab"
                        hidden={activeTab !== 'hobbies'}
                    >
                        <LazyErrorBoundary>
                            <Suspense fallback={<LoadingSpinner />}>
                                <HobbyManager />
                            </Suspense>
                        </LazyErrorBoundary>
                    </div>
                    <div
                        id="settings-panel"
                        role="tabpanel"
                        tabIndex={0}
                        aria-labelledby="settings-tab"
                        hidden={activeTab !== 'settings'}
                    >
                        <LazyErrorBoundary>
                            <Suspense fallback={<LoadingSpinner />}>
                                <SettingsPage />
                            </Suspense>
                        </LazyErrorBoundary>
                    </div>
                </div>
            </main>

            {/* フッター */}
            <footer className="bg-surface-primary border-t border-border-primary mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-text-secondary">
                            © {new Date().getFullYear()} 趣味予報 - 天気に基づく趣味おすすめアプリ
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;