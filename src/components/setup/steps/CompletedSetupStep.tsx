import React, { useEffect } from 'react';
import { useHobby } from '../../../hooks/useHobby';
import { useWeather } from '../../../hooks/useWeather';

interface CompletedSetupStepProps {
  onComplete?: () => void;
}

export const CompletedSetupStep: React.FC<CompletedSetupStepProps> = ({ onComplete }) => {
  const { hobbies } = useHobby();
  const { location, currentWeather, refreshWeather } = useWeather();

  useEffect(() => {
    // 天気データがない場合は取得を試行
    if (location && !currentWeather) {
      refreshWeather();
    }
  }, [location, currentWeather, refreshWeather]);

  const getLocationDisplayName = () => {
    if (!location) return '設定されていません';
    
    const parts = [location.name];
    if (location.state) parts.push(location.state);
    if (location.country) parts.push(location.country);
    
    return parts.join(', ');
  };

  const getWeatherSummary = () => {
    if (!currentWeather) return '取得中...';
    
    return `${Math.round(currentWeather.temperature)}°C, ${currentWeather.condition}`;
  };

  const handleStartUsing = () => {
    // 親コンポーネントの完了ハンドラーを呼び出す
    if (onComplete) {
      onComplete();
    }
    
    // 少し待ってから状態を更新（アニメーション効果）
    setTimeout(() => {
      // 完了状態を強制的に更新
      window.dispatchEvent(new CustomEvent('setup-completed'));
    }, 300);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">セットアップ完了</h2>
          <p className="text-gray-600">
            趣味予報をご利用いただく準備が整いました
          </p>
        </div>

        {/* Setup Summary */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6 mb-8">
          <h3 className="font-medium text-gray-900 mb-4 text-center">設定内容</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location */}
            <div className="bg-white rounded-md p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-blue-500">📍</span>
                <span className="font-medium text-gray-900">場所</span>
              </div>
              <p className="text-sm text-gray-600">{getLocationDisplayName()}</p>
              <p className="text-xs text-gray-500 mt-1">現在の天気: {getWeatherSummary()}</p>
            </div>

            {/* Hobbies */}
            <div className="bg-white rounded-md p-4">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-green-500">🎨</span>
                <span className="font-medium text-gray-900">趣味</span>
              </div>
              <p className="text-sm text-gray-600">
                {hobbies.length > 0 
                  ? `${hobbies.length}件の趣味が登録済み` 
                  : '未登録（後で追加可能）'
                }
              </p>
              {hobbies.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {hobbies.slice(0, 2).map(h => h.name).join(', ')}
                  {hobbies.length > 2 && ` 他${hobbies.length - 2}件`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mb-8">
          <h3 className="font-medium text-gray-900 mb-4 text-center">利用できる機能</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-md">
              <span className="text-blue-500 text-xl">🌤️</span>
              <div>
                <h4 className="font-medium text-blue-900">天気予報</h4>
                <p className="text-sm text-blue-700">7日間の詳細な天気予報</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-md">
              <span className="text-green-500 text-xl">🎯</span>
              <div>
                <h4 className="font-medium text-green-900">趣味推薦</h4>
                <p className="text-sm text-green-700">天気に応じた趣味の提案</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-md">
              <span className="text-purple-500 text-xl">🎨</span>
              <div>
                <h4 className="font-medium text-purple-900">趣味管理</h4>
                <p className="text-sm text-purple-700">趣味の追加・編集・管理</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-md">
              <span className="text-orange-500 text-xl">⚙️</span>
              <div>
                <h4 className="font-medium text-orange-900">詳細設定</h4>
                <p className="text-sm text-orange-700">API設定や個人設定</p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">次のステップ</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• 「おすすめ」タブで天気に応じた趣味の推薦をチェック</p>
            <p>• 「趣味管理」で追加の趣味を登録</p>
            <p>• 「設定」で詳細な環境設定を調整</p>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartUsing}
          className="w-full bg-gradient-to-r from-blue-600 to-green-600 dark:from-blue-500 dark:to-green-500 text-white py-3 px-4 rounded-md hover:from-blue-700 hover:to-green-700 dark:hover:from-blue-400 dark:hover:to-green-400 transition-all duration-200 font-medium text-lg"
        >
          趣味予報を始める
        </button>

        {/* Welcome Message */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            趣味予報をご利用いただき、ありがとうございます。
          </p>
          <p className="text-xs text-gray-500 mt-1">
            設定は後からいつでも変更できます
          </p>
        </div>
      </div>
    </div>
  );
};