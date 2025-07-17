import React, { useState, useEffect } from 'react';
import { ApiKeyDiagnostics } from '../common/ApiKeyDiagnostics';
import { SetupStatusSection } from './SetupStatusSection';
import { SetupResetSection } from './SetupResetSection';
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
      <div className="bg-surface-primary rounded-lg shadow-sm border border-border-primary">
        <div className="px-6 py-4 border-b border-border-primary">
          <h2 className="text-xl font-semibold text-text-primary">設定</h2>
          <p className="text-sm text-text-secondary mt-1">
            アプリケーションの動作設定を管理します
          </p>
        </div>

        <div className="p-6 space-y-8">
          {/* テーマ設定セクション */}
          <section>
            <ThemeSettings />
          </section>

          {/* セットアップ状態セクション */}
          <SetupStatusSection />

          {/* API Key設定セクション */}
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <h3 className="text-lg font-medium text-text-primary">API Key設定</h3>
              <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                ローカル保存
              </span>
            </div>
            
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-warning-600 text-lg">⚠️</span>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-warning-800">
                    重要な注意事項
                  </h4>
                  <div className="mt-2 text-sm text-warning-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>API Keyはブラウザのローカルストレージに保存されます</li>
                      <li>ブラウザのデータをクリアすると設定が失われます</li>
                      <li>共有PCでの使用時は設定クリアを忘れずに</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="openWeatherApiKey" className="block text-sm font-medium text-text-primary">
                  OpenWeatherMap API Key
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    id="openWeatherApiKey"
                    className="block w-full rounded-md border-border-primary bg-surface-primary text-text-primary shadow-sm focus:border-border-focus focus:ring-border-focus"
                    placeholder="API Keyを入力してください"
                    value={apiSettings.openWeatherApiKey}
                    onChange={(e) => setApiSettings(prev => ({ ...prev, openWeatherApiKey: e.target.value }))}
                  />
                </div>
                <p className="mt-1 text-sm text-text-tertiary">
                  <a 
                    href="https://openweathermap.org/api" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-500"
                  >
                    OpenWeatherMap
                  </a>
                  でAPI Keyを取得してください（無料）
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={saveApiSettings}
                  disabled={isLoading || !apiSettings.openWeatherApiKey.trim()}
                  className="bg-primary-600 text-text-inverse px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? '保存中...' : '保存'}
                </button>
                
                <button
                  onClick={clearApiSettings}
                  className="bg-neutral-600 text-text-inverse px-4 py-2 rounded-md hover:bg-neutral-700 transition-colors"
                >
                  クリア
                </button>
              </div>

              {message && (
                <div className={`p-3 rounded-md ${
                  message.type === 'success' 
                    ? 'bg-success-50 text-success-800 border border-success-200' 
                    : 'bg-error-50 text-error-800 border border-error-200'
                }`}>
                  {message.text}
                </div>
              )}
            </div>
          </section>

          {/* API診断セクション */}
          <section>
            <h3 className="text-lg font-medium text-text-primary mb-4">API接続診断</h3>
            <div className="bg-surface-secondary rounded-lg p-4">
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