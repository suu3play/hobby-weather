import { useState } from 'react';
import { HobbyManager } from './components/hobby/HobbyManager';
import { WeatherDisplay } from './components/weather/WeatherDisplay';
import { RecommendationDashboard } from './components/recommendation/RecommendationDashboard';
import { SettingsPage } from './components/settings/SettingsPage';

// アプリケーションのメインタブ
type TabType = 'weather' | 'hobbies' | 'recommendations' | 'settings';

function App() {
    const [activeTab, setActiveTab] = useState<TabType>('recommendations');

    // タブの設定
    const tabs = [
        { id: 'recommendations' as TabType, label: 'おすすめ', icon: '🎯' },
        { id: 'weather' as TabType, label: '天気', icon: '🌤️' },
        { id: 'hobbies' as TabType, label: '趣味管理', icon: '🎨' },
        { id: 'settings' as TabType, label: '設定', icon: '⚙️' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ヘッダー */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="text-2xl">🌈</div>
                            <h1 className="text-xl font-bold text-gray-900">
                                趣味予報
                            </h1>
                            <span className="text-sm text-gray-500">
                                hobby-weather
                            </span>
                        </div>

                        {/* ナビゲーションタブ */}
                        <nav className="flex space-x-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                                        activeTab === tab.id
                                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                                >
                                    <span>{tab.icon}</span>
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </nav>
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
            <footer className="bg-white border-t border-gray-200 mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                            © 2025 趣味予報 - 天気に基づく趣味おすすめアプリ
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;
