import React, { useState, useEffect, useRef } from 'react';

interface ApiKeySetupStepProps {
  onComplete: () => void;
}

export const ApiKeySetupStep: React.FC<ApiKeySetupStepProps> = ({ onComplete }) => {
  const [apiKey, setApiKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [testPassed, setTestPassed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // 既存のAPI Key設定を読み込み
  useEffect(() => {
    const savedSettings = localStorage.getItem('hobby-weather-api-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.openWeatherApiKey) {
          setApiKey(parsed.openWeatherApiKey);
          setSuccess(true);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to parse saved API settings:', error);
        }
      }
    }
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setError('API Keyを入力してください');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // APIキーを保存
      const settings = { openWeatherApiKey: apiKey.trim() };
      localStorage.setItem('hobby-weather-api-settings', JSON.stringify(settings));

      // WeatherServiceのAPIキーを更新
      const { weatherService } = await import('../../../services/weather.service');
      weatherService.refreshApiKey();

      setSuccess(true);

      // 少し待ってから次のステップに進む
      timerRef.current = setTimeout(() => {
        onComplete();
      }, 1000);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('API Key保存エラー:', error);
      }
      setError('API Keyの保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      setError('API Keyを入力してください');
      return;
    }

    setIsTesting(true);
    setError(null);

    try {
      // テスト用のAPI呼び出し（東京の天気を取得）
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=Tokyo&appid=${apiKey.trim()}&units=metric`
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('API Keyが無効です。正しいキーを入力してください。');
        } else {
          throw new Error('API接続に失敗しました。しばらく時間をおいてから再度お試しください。');
        }
      }

      setTestPassed(true);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'API接続テストに失敗しました');
      setTestPassed(false);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔑</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">API Key設定</h2>
          <p className="text-gray-600">
            天気情報を取得するためのAPI Keyを設定します
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">📋 API Key取得手順</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>
              <a 
                href="https://openweathermap.org/api" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                OpenWeatherMap
              </a>
              にアクセス
            </li>
            <li>「Get API key」をクリックして無料アカウントを作成</li>
            <li>メール確認後、API Keyを取得</li>
            <li>取得したキーを下記に入力</li>
          </ol>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
              OpenWeatherMap API Key
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError(null);
                setSuccess(false);
                setTestPassed(false);
              }}
              placeholder="API Keyを入力してください"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isTesting || isSaving}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center">
                <span className="text-red-400 mr-2">⚠️</span>
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Test Success Message */}
          {testPassed && !success && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center">
                <span className="text-blue-400 mr-2">✅</span>
                <span className="text-sm text-blue-700">API接続テスト成功。「保存して次へ」を押して設定を保存してください。</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-center">
                <span className="text-green-400 mr-2">✅</span>
                <span className="text-sm text-green-700">API Keyが正常に保存されました</span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleTestApiKey}
              disabled={isTesting || isSaving || !apiKey.trim()}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? 'テスト中...' : 'API接続テスト'}
            </button>

            <button
              onClick={handleSaveApiKey}
              disabled={isTesting || isSaving || !apiKey.trim()}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? '保存中...' : '保存して次へ'}
            </button>
          </div>
        </div>

        {/* Help */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <details className="text-sm text-gray-600">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
              API Keyについて
            </summary>
            <div className="mt-2 space-y-2">
              <p>• OpenWeatherMapの無料プランでは1日1,000回まで呼び出し可能</p>
              <p>• API Keyはブラウザのローカルストレージに安全に保存されます</p>
              <p>• 共有PCでの使用後は設定をクリアすることをおすすめします</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};