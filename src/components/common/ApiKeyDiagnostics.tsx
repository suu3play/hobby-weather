import React, { useState, useEffect } from 'react';
import { 
  runDiagnostics 
} from '../../services/api-key-test';

// 診断結果の型定義
interface DiagnosticResults {
  environment: {
    hasApiKey: boolean;
    apiKeyLength: number;
    apiKeyPreview: string;
  };
  weatherService: {
    hasApiKey: boolean;
    apiKeyLength: number;
    apiKeyPreview: string;
    error?: string;
  };
  apiConnection: {
    success: boolean;
    data?: any;
    status?: number;
    error?: string;
  };
  recommendations: string[];
}

export const ApiKeyDiagnostics: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // 診断実行
  const handleRunDiagnostics = async () => {
    setIsLoading(true);
    try {
      const diagnosticResults = await runDiagnostics();
      setResults(diagnosticResults);
    } catch (error) {
      console.error('診断実行エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // コンポーネントマウント時に自動実行
  useEffect(() => {
    handleRunDiagnostics();
  }, []);

  const getStatusIcon = (success: boolean) => {
    return success ? '✅' : '❌';
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            🔍 API Key診断
          </h3>
          <p className="text-sm text-gray-600">
            OpenWeatherMap APIの設定状況を確認
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleRunDiagnostics}
            disabled={isLoading}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? '診断中...' : '再診断'}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200 transition-colors"
          >
            {isExpanded ? '詳細を隠す' : '詳細表示'}
          </button>
        </div>
      </div>

      {/* 読み込み中 */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">診断実行中...</p>
        </div>
      )}

      {/* 結果表示 */}
      {results && !isLoading && (
        <div className="space-y-4">
          {/* サマリー */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {getStatusIcon(results.environment.hasApiKey)}
                </span>
                <div>
                  <p className="font-medium">環境変数</p>
                  <p className={`text-sm ${getStatusColor(results.environment.hasApiKey)}`}>
                    {results.environment.hasApiKey ? '設定済み' : '未設定'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {getStatusIcon(results.weatherService.hasApiKey)}
                </span>
                <div>
                  <p className="font-medium">サービス読み込み</p>
                  <p className={`text-sm ${getStatusColor(results.weatherService.hasApiKey)}`}>
                    {results.weatherService.hasApiKey ? '正常' : 'エラー'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {getStatusIcon(results.apiConnection.success)}
                </span>
                <div>
                  <p className="font-medium">API接続</p>
                  <p className={`text-sm ${getStatusColor(results.apiConnection.success)}`}>
                    {results.apiConnection.success ? '接続OK' : '接続失敗'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 推奨事項 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">📋 推奨事項</h4>
            <ul className="space-y-1">
              {results.recommendations.map((rec, index) => (
                <li key={index} className="text-sm text-blue-800">
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          {/* 詳細情報 */}
          {isExpanded && (
            <div className="space-y-4 border-t pt-4">
              {/* 環境変数詳細 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">🔧 環境変数詳細</h4>
                <div className="bg-gray-100 rounded p-3 text-sm font-mono">
                  <p>設定状況: {results.environment.hasApiKey ? '✅ 設定済み' : '❌ 未設定'}</p>
                  <p>キー長: {results.environment.apiKeyLength}文字</p>
                  <p>プレビュー: {results.environment.apiKeyPreview}</p>
                </div>
              </div>

              {/* WeatherService詳細 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">⚙️ WeatherService詳細</h4>
                <div className="bg-gray-100 rounded p-3 text-sm font-mono">
                  <p>読み込み状況: {results.weatherService.hasApiKey ? '✅ 正常' : '❌ エラー'}</p>
                  <p>キー長: {results.weatherService.apiKeyLength}文字</p>
                  <p>プレビュー: {results.weatherService.apiKeyPreview}</p>
                  {results.weatherService.error && (
                    <p className="text-red-600">エラー: {results.weatherService.error}</p>
                  )}
                </div>
              </div>

              {/* API接続詳細 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">🌐 API接続詳細</h4>
                <div className="bg-gray-100 rounded p-3 text-sm font-mono">
                  <p>接続状況: {results.apiConnection.success ? '✅ 成功' : '❌ 失敗'}</p>
                  {results.apiConnection.status && (
                    <p>HTTPステータス: {results.apiConnection.status}</p>
                  )}
                  {results.apiConnection.success && results.apiConnection.data && (
                    <div>
                      <p>テストデータ:</p>
                      <p className="ml-2">都市: {results.apiConnection.data.city}</p>
                      <p className="ml-2">天気: {results.apiConnection.data.weather}</p>
                      <p className="ml-2">気温: {results.apiConnection.data.temperature}°C</p>
                    </div>
                  )}
                  {results.apiConnection.error && (
                    <p className="text-red-600">エラー: {results.apiConnection.error}</p>
                  )}
                </div>
              </div>

              {/* 設定手順 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">📝 設定手順</h4>
                <div className="bg-yellow-50 rounded p-3 text-sm">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>プロジェクトルートに <code className="bg-gray-200 px-1 rounded">.env.local</code> ファイルを作成</li>
                    <li>以下の内容を記述:</li>
                    <li className="ml-4">
                      <code className="bg-gray-200 px-1 rounded">
                        VITE_OPENWEATHER_API_KEY=your_api_key_here
                      </code>
                    </li>
                    <li>開発サーバーを再起動: <code className="bg-gray-200 px-1 rounded">npm run dev</code></li>
                    <li>再診断ボタンで確認</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};