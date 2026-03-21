import React, { useState, useEffect } from 'react';
import { useWeather } from '../../../hooks/useWeather';

interface LocationSetupStepProps {
  onComplete: () => void;
}

export const LocationSetupStep: React.FC<LocationSetupStepProps> = ({ onComplete }) => {
  const {
    location,
    isLocationLoading,
    locationError,
    getCurrentLocation,
    setLocation,
    clearError
  } = useWeather();

  const [manualLocation, setManualLocation] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // 既に場所が設定されている場合の処理
  useEffect(() => {
    if (location) {
      // 少し待ってから次のステップに進む
      const timer = setTimeout(() => {
        onComplete();
      }, 1500);
      return () => clearTimeout(timer);
    }
    // location が null の場合は何もしない
    return undefined;
  }, [location, onComplete]);

  const handleGetCurrentLocation = async () => {
    clearError();
    setSearchError(null);
    await getCurrentLocation();
  };

  const handleManualLocationSubmit = async () => {
    if (!manualLocation.trim()) {
      setSearchError('場所を入力してください');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // OpenWeatherMap Geocoding APIを使用して場所を検索
      const savedSettings = localStorage.getItem('hobby-weather-api-settings');
      if (!savedSettings) {
        throw new Error('API Keyが設定されていません');
      }

      const settings = JSON.parse(savedSettings);
      const apiKey = settings.openWeatherApiKey;

      if (!apiKey) {
        throw new Error('API Keyが設定されていません');
      }

      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(manualLocation.trim())}&limit=1&appid=${apiKey}`
      );

      if (!response.ok) {
        throw new Error('場所の検索に失敗しました');
      }

      const data = await response.json();
      if (!data || data.length === 0) {
        throw new Error('指定された場所が見つかりません');
      }

      const locationData = data[0];
      await setLocation({
        lat: locationData.lat,
        lon: locationData.lon,
        name: locationData.name,
        state: locationData.state,
        country: locationData.country,
        isDefault: true,
        createdAt: new Date()
      });

    } catch (error) {
      setSearchError(error instanceof Error ? error.message : '場所の設定に失敗しました');
    } finally {
      setIsSearching(false);
    }
  };

  const getLocationDisplayName = () => {
    if (!location) return '';
    
    const parts = [location.name];
    if (location.state) parts.push(location.state);
    if (location.country) parts.push(location.country);
    
    return parts.join(', ');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">場所設定</h2>
          <p className="text-gray-600">
            天気予報を取得する場所を設定します
          </p>
        </div>

        {/* Location Set Success */}
        {location && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center mb-4">
              <span className="text-green-400 text-2xl mr-2">✅</span>
              <span className="text-lg font-medium text-green-800">場所が設定されました</span>
            </div>
            <div className="text-center">
              <p className="text-green-700 font-medium text-lg">{getLocationDisplayName()}</p>
              <p className="text-sm text-green-600 mt-1">
                緯度: {location.lat.toFixed(4)}, 経度: {location.lon.toFixed(4)}
              </p>
            </div>
            <div className="text-center mt-4">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
              <span className="text-sm text-green-700">次のステップに進んでいます...</span>
            </div>
          </div>
        )}

        {/* Location Setup Options */}
        {!location && (
          <div className="space-y-6">
            {/* Current Location Option */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-gray-900">現在地を使用</h3>
                  <p className="text-sm text-gray-600">GPSを使用して現在の位置を取得します</p>
                </div>
                <button
                  onClick={handleGetCurrentLocation}
                  disabled={isLocationLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLocationLoading ? '取得中...' : '現在地を取得'}
                </button>
              </div>

              {locationError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex items-center">
                    <span className="text-red-400 mr-2">⚠️</span>
                    <span className="text-sm text-red-700">{locationError}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Location Option */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-gray-900">手動で場所を指定</h3>
                  <p className="text-sm text-gray-600">都市名や地域名を入力してください</p>
                </div>
                <button
                  onClick={() => setIsManualMode(!isManualMode)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {isManualMode ? '閉じる' : '手動入力'}
                </button>
              </div>

              {isManualMode && (
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={manualLocation}
                      onChange={(e) => {
                        setManualLocation(e.target.value);
                        setSearchError(null);
                      }}
                      placeholder="例: 東京, Tokyo, New York"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isSearching}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleManualLocationSubmit();
                        }
                      }}
                    />
                  </div>

                  {searchError && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <div className="flex items-center">
                        <span className="text-red-400 mr-2">⚠️</span>
                        <span className="text-sm text-red-700">{searchError}</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleManualLocationSubmit}
                    disabled={isSearching || !manualLocation.trim()}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSearching ? '検索中...' : '場所を設定'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <details className="text-sm text-gray-600">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
              場所設定について
            </summary>
            <div className="mt-2 space-y-2">
              <p>• 現在地取得にはブラウザの位置情報許可が必要です</p>
              <p>• 手動入力では都市名、地域名、国名で検索できます</p>
              <p>• 設定した場所は後で変更することができます</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};