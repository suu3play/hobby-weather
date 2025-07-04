import React, { useEffect } from 'react';
import { useRecommendation } from '../../hooks/useRecommendation';
import { useHobby } from '../../hooks/useHobby';
import { useWeather } from '../../hooks/useWeather';
import { RecommendationList } from './RecommendationList';
import { RecommendationFilters } from './RecommendationFilters';

export const RecommendationDashboard: React.FC = () => {
  const { hobbies } = useHobby();
  const { forecast, location } = useWeather();
  const {
    recommendations,
    isLoading,
    error,
    filters,
    generateRecommendations,
    updateFilters,
    clearFilters,
    clearError
  } = useRecommendation();

  // 趣味と天気予報が揃ったら自動でおすすめを生成
  useEffect(() => {
    if (hobbies.length > 0 && forecast) {
      generateRecommendations(hobbies, forecast);
    }
  }, [hobbies, forecast, generateRecommendations]);

  const handleRefresh = () => {
    if (hobbies.length > 0 && forecast) {
      generateRecommendations(hobbies, forecast);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">趣味おすすめダッシュボード</h1>
        <p className="text-gray-600">
          天気予報に基づいて、あなたの趣味に最適なタイミングを提案します
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                推薦の生成に失敗しました
              </h3>
              <div className="mt-1 text-sm text-red-700">
                {error}
              </div>
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={clearError}
                  className="text-sm underline text-red-700 hover:text-red-600"
                >
                  エラーを閉じる
                </button>
                <button
                  onClick={handleRefresh}
                  className="text-sm underline text-red-700 hover:text-red-600"
                >
                  再試行
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prerequisites Check */}
      {(!location || !forecast || hobbies.length === 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400">ℹ️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                推薦を生成するための準備
              </h3>
              <div className="mt-1 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {!location && <li>場所を選択してください</li>}
                  {!forecast && <li>天気予報を取得してください</li>}
                  {hobbies.length === 0 && <li>趣味を登録してください</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Summary */}
      {location && forecast && hobbies.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">推薦データ</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {location.name}
              </div>
              <div className="text-sm text-blue-700">対象地域</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {hobbies.length}
              </div>
              <div className="text-sm text-green-700">登録趣味数</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {forecast.forecasts.length}
              </div>
              <div className="text-sm text-purple-700">予報日数</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {recommendations.length}
              </div>
              <div className="text-sm text-orange-700">推薦数</div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {location && forecast && hobbies.length > 0 && (
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>{isLoading ? '生成中...' : '推薦を更新'}</span>
          </button>
        </div>
      )}

      {/* Filters */}
      {recommendations.length > 0 && (
        <RecommendationFilters
          filters={filters}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
        />
      )}

      {/* Recommendations */}
      <RecommendationList
        recommendations={recommendations}
        isLoading={isLoading}
      />

      {/* Help Section */}
      {recommendations.length === 0 && !isLoading && location && forecast && hobbies.length > 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">💡</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            推薦のヒント
          </h3>
          <div className="text-gray-600 space-y-2 max-w-md mx-auto">
            <p>・趣味の天気設定や気温範囲を確認してください</p>
            <p>・フィルター条件が厳しすぎる可能性があります</p>
            <p>・予報期間中に適した条件がないかもしれません</p>
          </div>
        </div>
      )}
    </div>
  );
};