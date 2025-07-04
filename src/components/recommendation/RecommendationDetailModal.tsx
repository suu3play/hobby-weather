import React from 'react';
import type { HobbyRecommendation } from '../../services/recommendation.service';
import { getWeatherConditionIcon, getWeatherConditionLabel } from '../../hooks/useHobby';

// おすすめ詳細モーダルのプロパティ
interface RecommendationDetailModalProps {
  recommendation: HobbyRecommendation; // おすすめ情報
  onClose: () => void; // 閉じるコールバック
}

export const RecommendationDetailModal: React.FC<RecommendationDetailModalProps> = ({
  recommendation,
  onClose
}) => {
  const { hobby, recommendedDays, overallScore } = recommendation;

  // スコアに基づく色分け
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
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
      weekday: 'long'
    }).format(date);
  };

  // 時刻のフォーマット

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{hobby.name}</h2>
              <p className="text-sm text-gray-600">詳細なおすすめ情報</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="sr-only">閉じる</span>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* 趣味情報 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-semibold text-gray-900">{hobby.name}</h3>
                  {hobby.isOutdoor && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      屋外活動
                    </span>
                  )}
                </div>
                {hobby.description && (
                  <p className="text-gray-600 mb-3">{hobby.description}</p>
                )}
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                  {Math.round(overallScore)}点
                </div>
                <p className="text-xs text-gray-600">総合スコア</p>
              </div>
            </div>

            {/* 趣味の設定 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">好適天気:</span>
                <div className="mt-1">
                  {hobby.preferredWeather && hobby.preferredWeather.length > 0 ? (
                    hobby.preferredWeather.map((weather, index) => (
                      <span key={index} className="inline-flex items-center mr-2">
                        {typeof weather === 'string' ? (
                          <>
                            {getWeatherConditionIcon(weather)}
                            <span className="ml-1">{getWeatherConditionLabel(weather)}</span>
                          </>
                        ) : (
                          <>
                            {getWeatherConditionIcon(weather.condition)}
                            <span className="ml-1">{getWeatherConditionLabel(weather.condition)}</span>
                          </>
                        )}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400">指定なし</span>
                  )}
                </div>
              </div>
              
              <div>
                <span className="text-gray-600">適温範囲:</span>
                <p className="mt-1 font-medium">
                  {hobby.minTemperature ?? '制限なし'}°C - {hobby.maxTemperature ?? '制限なし'}°C
                </p>
              </div>
              
              <div>
                <span className="text-gray-600">作成日:</span>
                <p className="mt-1 font-medium">
                  {new Intl.DateTimeFormat('ja-JP').format(new Date(hobby.createdAt))}
                </p>
              </div>
            </div>
          </div>

          {/* おすすめ日程 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              おすすめ日程 ({recommendedDays.length}日間)
            </h3>
            
            <div className="space-y-4">
              {recommendedDays.map((day, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {formatDate(day.date)}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Intl.DateTimeFormat('ja-JP', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }).format(day.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${getScoreColor(day.score)}`}>
                        {Math.round(day.score)}点
                      </div>
                      {index === 0 && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          最適日
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 天気情報 */}
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-3xl">
                          {getWeatherConditionIcon(day.forecast.weatherType)}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">
                            {day.forecast.weatherDescription}
                          </p>
                          <p className="text-sm text-gray-600">
                            {Math.round(day.forecast.temperature.max)}° / {Math.round(day.forecast.temperature.min)}°
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">降水確率</span>
                          <p className="font-medium">{Math.round(day.forecast.pop * 100)}%</p>
                        </div>
                        <div>
                          <span className="text-gray-600">湿度</span>
                          <p className="font-medium">{day.forecast.humidity}%</p>
                        </div>
                        <div>
                          <span className="text-gray-600">風速</span>
                          <p className="font-medium">{day.forecast.windSpeed.toFixed(1)} m/s</p>
                        </div>
                        {day.forecast.uvIndex > 0 && (
                          <div>
                            <span className="text-gray-600">UV指数</span>
                            <p className="font-medium">{day.forecast.uvIndex.toFixed(1)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 要因分析 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 良い条件 */}
                    {day.matchingFactors.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-green-700 mb-2">
                          ✓ 良い条件
                        </h5>
                        <ul className="space-y-1">
                          {day.matchingFactors.map((factor, factorIndex) => (
                            <li key={factorIndex} className="text-sm text-green-600">
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 注意事項 */}
                    {day.warningFactors.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-orange-700 mb-2">
                          ⚠ 注意事項
                        </h5>
                        <ul className="space-y-1">
                          {day.warningFactors.map((factor, factorIndex) => (
                            <li key={factorIndex} className="text-sm text-orange-600">
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};