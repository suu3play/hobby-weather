import React from 'react';
import type { HobbyRecommendation } from '../../services/recommendation.service';
import { weatherService } from '../../services/weather.service';

// おすすめカードのプロパティ
interface RecommendationCardProps {
  recommendation: HobbyRecommendation; // おすすめ情報
  onViewDetails?: (recommendation: HobbyRecommendation) => void; // 詳細表示コールバック
  className?: string; // 追加のCSSクラス
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onViewDetails,
  className = ''
}) => {
  const { hobby, recommendedDays, overallScore, bestDayIndex } = recommendation;
  const bestDay = recommendedDays[bestDayIndex];

  if (!bestDay) return null;

  // スコアに基づく色分け
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  // スコアラベルの取得
  const getScoreLabel = (score: number): string => {
    if (score >= 80) return '最適';
    if (score >= 60) return '良好';
    if (score >= 40) return '普通';
    return '注意';
  };

  // 日付のフォーマット
  const formatDate = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return '今日';
    if (date.toDateString() === tomorrow.toDateString()) return '明日';

    return new Intl.DateTimeFormat('ja-JP', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    }).format(date);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{hobby.name}</h3>
            {hobby.isOutdoor && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                屋外
              </span>
            )}
          </div>
          {hobby.description && (
            <p className="text-sm text-gray-600">{hobby.description}</p>
          )}
        </div>

        <div className="text-right">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(overallScore)}`}>
            {Math.round(overallScore)}点 ({getScoreLabel(overallScore)})
          </div>
        </div>
      </div>

      {/* 最適日 */}
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-blue-900">最適な日</h4>
          <span className="text-sm font-medium text-blue-800">
            {formatDate(bestDay.date)}
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {/* 天気 */}
          <div className="flex items-center space-x-2">
            <span className="text-2xl">
              {weatherService.getWeatherIcon(bestDay.forecast.weatherType)}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {bestDay.forecast.weatherDescription}
              </p>
              <p className="text-xs text-gray-600">
                {Math.round(bestDay.forecast.temperature.max)}° / {Math.round(bestDay.forecast.temperature.min)}°
              </p>
            </div>
          </div>

          {/* スコア */}
          <div className="flex-1 text-right">
            <div className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${getScoreColor(bestDay.score)}`}>
              {Math.round(bestDay.score)}点
            </div>
          </div>
        </div>
      </div>

      {/* 良い条件 */}
      {bestDay.matchingFactors.length > 0 && (
        <div className="mb-4">
          <h5 className="text-xs font-medium text-green-700 mb-2">✓ 良い条件</h5>
          <div className="space-y-1">
            {bestDay.matchingFactors.slice(0, 2).map((factor, index) => (
              <p key={index} className="text-sm text-green-600">
                {factor}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* 注意事項 */}
      {bestDay.warningFactors.length > 0 && (
        <div className="mb-4">
          <h5 className="text-xs font-medium text-orange-700 mb-2">⚠ 注意事項</h5>
          <div className="space-y-1">
            {bestDay.warningFactors.slice(0, 2).map((factor, index) => (
              <p key={index} className="text-sm text-orange-600">
                {factor}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* その他の候補日 */}
      {recommendedDays.length > 1 && (
        <div className="mb-4">
          <h5 className="text-xs font-medium text-gray-700 mb-2">他の候補日</h5>
          <div className="flex space-x-2 overflow-x-auto">
            {recommendedDays.slice(1, 4).map((day, index) => (
              <div
                key={index}
                className="flex-shrink-0 bg-gray-50 rounded px-3 py-2 text-center"
              >
                <p className="text-xs text-gray-600">{formatDate(day.date)}</p>
                <p className="text-sm font-medium text-gray-900">
                  {Math.round(day.score)}点
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* アクション */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          {recommendedDays.length}日間の予測
        </div>
        
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(recommendation)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            詳細を見る →
          </button>
        )}
      </div>
    </div>
  );
};