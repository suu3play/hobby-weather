import React from 'react';
import type { WeatherData } from '../../types';
import { weatherService } from '../../services/weather.service';

interface WeatherCardProps {
  weather: WeatherData;
  className?: string;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({ weather, className = '' }) => {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    }).format(date);
  };

  const getWindDirection = (degrees: number): string => {
    const directions = ['北', '北東', '東', '南東', '南', '南西', '西', '北西'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index] ?? '不明';
  };

  const getUVLevel = (uvIndex: number): { level: string; color: string } => {
    if (uvIndex <= 2) return { level: '弱い', color: 'text-green-600' };
    if (uvIndex <= 5) return { level: '中程度', color: 'text-yellow-600' };
    if (uvIndex <= 7) return { level: '強い', color: 'text-orange-600' };
    if (uvIndex <= 10) return { level: '非常に強い', color: 'text-red-600' };
    return { level: '極端', color: 'text-purple-600' };
  };

  const uvInfo = getUVLevel(weather.uvIndex);

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">現在の天気</h3>
          <p className="text-sm text-gray-500">
            {formatDate(weather.datetime)} {formatTime(weather.datetime)}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl mb-1">
            {weatherService.getWeatherIcon(weather.weatherType)}
          </div>
          <p className="text-sm text-gray-600">{weather.weatherDescription}</p>
        </div>
      </div>

      {/* Temperature */}
      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-4xl font-bold text-gray-900">
            {Math.round(weather.temperature)}
          </span>
          <span className="text-xl text-gray-500 ml-1">°C</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          体感温度 {Math.round(weather.feelsLike)}°C
        </p>
      </div>

      {/* Weather Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600">💧</span>
            <div>
              <p className="text-sm font-medium text-blue-900">湿度</p>
              <p className="text-lg font-semibold text-blue-700">{weather.humidity}%</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">🌬️</span>
            <div>
              <p className="text-sm font-medium text-gray-900">風速</p>
              <p className="text-lg font-semibold text-gray-700">
                {weather.windSpeed.toFixed(1)} m/s
              </p>
              <p className="text-xs text-gray-600">
                {getWindDirection(weather.windDirection)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <span className="text-indigo-600">🌡️</span>
            <div>
              <p className="text-sm font-medium text-indigo-900">気圧</p>
              <p className="text-lg font-semibold text-indigo-700">
                {weather.pressure} hPa
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <span className="text-purple-600">👁️</span>
            <div>
              <p className="text-sm font-medium text-purple-900">視界</p>
              <p className="text-lg font-semibold text-purple-700">
                {(weather.visibility / 1000).toFixed(1)} km
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600">☁️</span>
            <div>
              <p className="text-sm font-medium text-yellow-900">雲量</p>
              <p className="text-lg font-semibold text-yellow-700">{weather.cloudiness}%</p>
            </div>
          </div>
        </div>

        {weather.uvIndex > 0 && (
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <span className="text-orange-600">☀️</span>
              <div>
                <p className="text-sm font-medium text-orange-900">UV指数</p>
                <p className="text-lg font-semibold text-orange-700">{weather.uvIndex}</p>
                <p className={`text-xs font-medium ${uvInfo.color}`}>
                  {uvInfo.level}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cache Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          データ取得時刻: {formatTime(weather.cachedAt)}
        </p>
      </div>
    </div>
  );
};