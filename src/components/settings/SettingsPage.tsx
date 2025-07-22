import React, { useState, useEffect } from 'react';
import { ApiKeyDiagnostics } from '../common/ApiKeyDiagnostics';
import { SetupStatusSection } from './SetupStatusSection';
import { SetupResetSection } from './SetupResetSection';
import { NotificationSettings } from '../notification/NotificationSettings';
import { ThemeSettings } from '../theme/ThemeSettings';

interface ApiKeySettings {
  openWeatherApiKey: string;
}

export const SettingsPage: React.FC = () => {
  const [apiSettings, setApiSettings] = useState<ApiKeySettings>({
    openWeatherApiKey: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ローカルストレージからAPI Key設定を読み込み
  useEffect(() => {
    const savedSettings = localStorage.getItem('hobby-weather-api-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setApiSettings(parsed);
      } catch (error) {
        console.error('Failed to parse saved API settings:', error);
      }
    }
  }, []);

  // API Key設定を保存
  const saveApiSettings = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      localStorage.setItem('hobby-weather-api-settings', JSON.stringify(apiSettings));
      
      // WeatherServiceインスタンスのAPI Keyを更新
      const { weatherService } = await import('../../services/weather.service');
      weatherService.refreshApiKey();
      
      setMessage({ type: 'success', text: 'API Key設定を保存しました。次回のAPI呼び出しから新しいキーが使用されます。' });
    } catch (error) {
      setMessage({ type: 'error', text: 'API Key設定の保存に失敗しました' });
    } finally {
      setIsLoading(false);
    }
  };

  // API Key設定をクリア
  const clearApiSettings = () => {
    setApiSettings({ openWeatherApiKey: '' });
    localStorage.removeItem('hobby-weather-api-settings');
    setMessage({ type: 'success', text: 'API Key設定をクリアしました' });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">設定</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            アプリケーションの動作設定を管理します
          </p>
        </div>

        <div className="p-6 space-y-8">
          {/* セットアップ状態セクション */}
          <SetupStatusSection />

          {/* テーマ設定セクション */}
          <ThemeSettings />

          {/* API Key設定セクション */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">API Key設定</h3>
              <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
                ローカル保存
              </span>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    API Key設定が必要です
                  </h3>
                  <p className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    天気データを取得するには、OpenWeatherMap API Keyの設定が必要です。
                    設定したAPI Keyはブラウザのローカルストレージに保存されます。
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  OpenWeatherMap API Key
                </label>
                <input
                  type="text"
                  id="api-key"
                  value={apiSettings.openWeatherApiKey}
                  onChange={(e) => setApiSettings({ ...apiSettings, openWeatherApiKey: e.target.value })}
                  placeholder="Your OpenWeatherMap API Key"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                           focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                           dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <a 
                    href="https://openweathermap.org/api" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                  >
                    https://openweathermap.org/api
                  </a>
                  でAPI Keyを取得してください（無料）
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={saveApiSettings}
                  disabled={isLoading || !apiSettings.openWeatherApiKey.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? '保存中...' : '保存'}
                </button>
                
                <button
                  onClick={clearApiSettings}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  クリア
                </button>
              </div>

              {message && (
                <div className={`p-3 rounded-md ${
                  message.type === 'success' 
                    ? 'bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700' 
                    : 'bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700'
                }`}>
                  {message.text}
                </div>
              )}
            </div>
          </section>

          {/* 通知設定セクション */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">通知設定</h3>
            <NotificationSettings />
          </section>

          {/* API診断セクション */}
          <section>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">API接続診断</h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <ApiKeyDiagnostics />
            </div>
          </section>

          {/* セットアップリセットセクション */}
          <SetupResetSection />
        </div>
      </div>
    </div>
  );
};