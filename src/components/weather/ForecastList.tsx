import React from 'react';
import type { WeatherForecast } from '../../types';
import { ForecastCard } from './ForecastCard';

interface ForecastListProps {
  forecast: WeatherForecast;
  className?: string;
}

export const ForecastList: React.FC<ForecastListProps> = ({ forecast, className = '' }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatCacheTime = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">7日間の天気予報</h3>
            <p className="text-sm text-gray-600">
              {forecast.forecasts.length}日間の詳細予報
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">
              更新: {formatCacheTime(forecast.cachedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Forecast Grid */}
      <div className="p-6">
        {forecast.forecasts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">🌤️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">予報データがありません</h3>
            <p className="text-gray-600">天気予報を取得できませんでした。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {forecast.forecasts.map((dailyForecast, index) => {
              const forecastDate = new Date(dailyForecast.date);
              forecastDate.setHours(0, 0, 0, 0);
              const isToday = forecastDate.getTime() === today.getTime();
              
              return (
                <ForecastCard
                  key={index}
                  forecast={dailyForecast}
                  isToday={isToday}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      {forecast.forecasts.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">週間サマリー</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">最高気温</p>
              <p className="font-semibold text-red-600">
                {Math.max(...forecast.forecasts.map(f => f.temperature.max)).toFixed(1)}°C
              </p>
            </div>
            <div>
              <p className="text-gray-600">最低気温</p>
              <p className="font-semibold text-blue-600">
                {Math.min(...forecast.forecasts.map(f => f.temperature.min)).toFixed(1)}°C
              </p>
            </div>
            <div>
              <p className="text-gray-600">平均湿度</p>
              <p className="font-semibold text-gray-700">
                {Math.round(forecast.forecasts.reduce((sum, f) => sum + f.humidity, 0) / forecast.forecasts.length)}%
              </p>
            </div>
            <div>
              <p className="text-gray-600">降水日数</p>
              <p className="font-semibold text-blue-700">
                {forecast.forecasts.filter(f => f.pop > 0.3).length}日
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};