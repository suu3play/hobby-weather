import React from 'react';
import { useWeather } from '../../hooks/useWeather';
import { WeatherCard } from './WeatherCard';
import { ForecastList } from './ForecastList';
import { LocationSelector } from './LocationSelector';

export const WeatherDisplay: React.FC = () => {
  const {
    currentWeather,
    forecast,
    location,
    isLoading,
    error,
    isLocationLoading,
    locationError,
    refreshWeather,
    getCurrentLocation,
    setLocation,
    clearError
  } = useWeather();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">天気予報</h1>
        <p className="text-gray-600">現在の天気と7日間の予報をチェック</p>
      </div>

      {/* Error Display */}
      {(error || locationError) && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                エラーが発生しました
              </h3>
              <div className="mt-1 text-sm text-red-700">
                {error || locationError}
              </div>
              <div className="mt-2">
                <button
                  onClick={clearError}
                  className="text-sm underline text-red-700 hover:text-red-600"
                >
                  エラーを閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Selector */}
      <LocationSelector
        currentLocation={location}
        onLocationSelect={setLocation}
        onCurrentLocationRequest={getCurrentLocation}
        isLoading={isLocationLoading}
      />

      {/* Weather Content */}
      {location ? (
        <>
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">天気データを取得中...</p>
            </div>
          )}

          {/* Weather Data */}
          {!isLoading && (
            <div className="space-y-6">
              {/* Refresh Button */}
              <div className="flex justify-center">
                <button
                  onClick={refreshWeather}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <span>🔄</span>
                  <span>{isLoading ? '更新中...' : '天気を更新'}</span>
                </button>
              </div>

              {/* Current Weather */}
              {currentWeather && (
                <WeatherCard weather={currentWeather} />
              )}

              {/* Forecast */}
              {forecast && (
                <ForecastList forecast={forecast} />
              )}

              {/* No Data Message */}
              {!currentWeather && !forecast && !isLoading && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🌤️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    天気データがありません
                  </h3>
                  <p className="text-gray-600 mb-4">
                    天気データを取得できませんでした。再度お試しください。
                  </p>
                  <button
                    onClick={refreshWeather}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    再試行
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* No Location Selected */
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            場所を選択してください
          </h3>
          <p className="text-gray-600 mb-4">
            天気予報を表示するには、まず場所を選択または現在地を取得してください。
          </p>
          <button
            onClick={getCurrentLocation}
            disabled={isLocationLoading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLocationLoading ? '取得中...' : '現在地を取得'}
          </button>
        </div>
      )}

      {/* Stats */}
      {currentWeather && forecast && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">統計情報</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(currentWeather.temperature)}°C
              </div>
              <div className="text-sm text-gray-600">現在気温</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {Math.max(...forecast.forecasts.map(f => f.temperature.max)).toFixed(0)}°C
              </div>
              <div className="text-sm text-gray-600">週間最高</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.min(...forecast.forecasts.map(f => f.temperature.min)).toFixed(0)}°C
              </div>
              <div className="text-sm text-gray-600">週間最低</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {forecast.forecasts.filter(f => f.pop < 0.3).length}
              </div>
              <div className="text-sm text-gray-600">晴れ予想日</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};