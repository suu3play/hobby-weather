import React from 'react';
import type { DailyForecast } from '../../types';
import { weatherService } from '../../services/weather.service';

interface ForecastCardProps {
  forecast: DailyForecast;
  isToday?: boolean;
}

export const ForecastCard: React.FC<ForecastCardProps> = ({ forecast, isToday = false }) => {
  const formatDate = (date: Date) => {
    if (isToday) return '今日';
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) return '明日';
    
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    }).format(date);
  };


  const getPrecipitationColor = (pop: number): string => {
    if (pop === 0) return '';
    if (pop <= 20) return 'text-blue-400';
    if (pop <= 40) return 'text-blue-500';
    if (pop <= 60) return 'text-blue-600';
    if (pop <= 80) return 'text-blue-700';
    return 'text-blue-800';
  };

  return (
    <div className={`bg-white rounded-lg border-2 p-4 transition-all hover:shadow-md ${
      isToday ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
    }`}>
      {/* Date */}
      <div className="text-center mb-3">
        <h4 className={`font-semibold ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>
          {formatDate(forecast.date)}
        </h4>
        <p className="text-xs text-gray-600">
          {new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric' }).format(forecast.date)}
        </p>
      </div>

      {/* Weather Icon and Description */}
      <div className="text-center mb-3">
        <div className="text-3xl mb-2">
          {weatherService.getWeatherIcon(forecast.weatherType)}
        </div>
        <p className="text-sm text-gray-700 leading-tight">
          {forecast.weatherDescription}
        </p>
      </div>

      {/* Temperature */}
      <div className="text-center mb-3">
        <div className="flex justify-center items-baseline space-x-1">
          <span className="text-xl font-bold text-gray-900">
            {Math.round(forecast.temperature.max)}°
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(forecast.temperature.min)}°
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          最高/最低
        </p>
      </div>

      {/* Precipitation */}
      {forecast.pop > 0 && (
        <div className="text-center mb-3">
          <div className={`text-sm font-medium ${getPrecipitationColor(forecast.pop)}`}>
            {Math.round(forecast.pop * 100)}%
          </div>
          <p className="text-xs text-gray-600">
            降水確率
          </p>
        </div>
      )}

      {/* Additional Info */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-600">湿度</span>
          <span className="font-medium">{forecast.humidity}%</span>
        </div>
        
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-600">風速</span>
          <span className="font-medium">{forecast.windSpeed.toFixed(1)} m/s</span>
        </div>
        
        {forecast.uvIndex > 0 && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600">UV指数</span>
            <span className="font-medium">{forecast.uvIndex.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Time-specific temperatures */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="grid grid-cols-4 gap-1 text-xs">
          <div className="text-center">
            <p className="text-gray-600">朝</p>
            <p className="font-medium">{Math.round(forecast.temperature.morning)}°</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">昼</p>
            <p className="font-medium">{Math.round(forecast.temperature.day)}°</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">夕</p>
            <p className="font-medium">{Math.round(forecast.temperature.evening)}°</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">夜</p>
            <p className="font-medium">{Math.round(forecast.temperature.night)}°</p>
          </div>
        </div>
      </div>
    </div>
  );
};