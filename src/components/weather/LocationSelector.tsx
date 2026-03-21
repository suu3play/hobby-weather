import React, { useState, useEffect } from 'react';
import type { Location, LocationSearchResult, LocationType } from '../../types';
import { weatherService } from '../../services/weather.service';
import { databaseService } from '../../services/database.service';
import { useTheme } from '../../contexts/ThemeContext';

interface LocationSelectorProps {
  currentLocation: Location | null;
  onLocationSelect: (location: Location) => void;
  onCurrentLocationRequest: () => void;
  isLoading?: boolean;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  currentLocation,
  onLocationSelect,
  onCurrentLocationRequest,
  isLoading = false
}) => {
  const { currentTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([]);
  const [savedLocations, setSavedLocations] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadSavedLocations();
  }, []);

  const loadSavedLocations = async () => {
    try {
      const locations = await databaseService.getAllLocations();
      setSavedLocations(locations);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to load saved locations:', error);
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const results = await weatherService.searchLocation(searchQuery);
      setSearchResults(results);

      if (results.length === 0) {
        setSearchError('該当する場所が見つかりませんでした');
      }
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : '検索に失敗しました');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = async (searchResult: LocationSearchResult) => {
    try {
      // データベースに場所を保存
      const locationData: Omit<Location, 'id' | 'createdAt'> = {
        name: searchResult.name,
        lat: searchResult.lat,
        lon: searchResult.lon,
        isDefault: true,
        type: searchResult.type
      };

      // 存在する場合のみオプションプロパティを追加
      if (searchResult.address) {
        locationData.address = searchResult.address;
      }
      if (searchResult.category) {
        locationData.category = searchResult.category;
      }

      await databaseService.saveLocation(locationData);

      // IDを持つ保存された場所を取得
      const savedLocation = await databaseService.getDefaultLocation();

      if (savedLocation) {
        onLocationSelect(savedLocation);
        await loadSavedLocations();
      }

      // 検索をクリア
      setSearchQuery('');
      setSearchResults([]);
      setIsExpanded(false);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : '場所の保存に失敗しました');
    }
  };

  const handleSavedLocationSelect = async (location: Location) => {
    try {
      if (location.id) {
        await databaseService.updateLocation(location.id, { isDefault: true });
        onLocationSelect({ ...location, isDefault: true });
        setIsExpanded(false);
      } else {
        setSearchError('場所IDが見つかりません');
      }
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : '場所の選択に失敗しました');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 場所タイプのアイコンを取得
  const getLocationTypeIcon = (type: LocationType): string => {
    const icons: Record<LocationType, string> = {
      city: '🏙️',
      business: '🏪',
      landmark: '🗼',
      address: '📍'
    };
    return icons[type] ?? '📍';
  };

  // 場所タイプのラベルを取得
  const getLocationTypeLabel = (type: LocationType): string => {
    const labels: Record<LocationType, string> = {
      city: '都市',
      business: '店舗',
      landmark: 'ランドマーク',
      address: '住所'
    };
    return labels[type] ?? '場所';
  };


  return (
    <div className="rounded-lg shadow-md border p-6" style={{
      backgroundColor: currentTheme.colors.background.primary,
      borderColor: currentTheme.colors.border.primary
    }}>
      {/* 現在の場所表示 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1" style={{
            color: currentTheme.colors.text.primary
          }}>現在の場所</h3>
          {currentLocation ? (
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">📍</span>
              <span style={{
                color: currentTheme.colors.text.secondary
              }}>{currentLocation.name}</span>
              {currentLocation.isDefault && (
                <span className="text-xs px-2 py-1 rounded-full" style={{
                  backgroundColor: currentTheme.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgb(219, 234, 254)',
                  color: currentTheme.mode === 'dark' ? 'rgb(147, 197, 253)' : 'rgb(30, 64, 175)'
                }}>
                  デフォルト
                </span>
              )}
            </div>
          ) : (
            <p style={{
              color: currentTheme.colors.text.tertiary
            }}>場所が設定されていません</p>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={onCurrentLocationRequest}
            disabled={isLoading}
            className="bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="現在地を取得"
          >
            {isLoading ? '取得中...' : '📍 現在地'}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            {isExpanded ? '閉じる' : '場所を変更'}
          </button>
        </div>
      </div>

      {/* 展開された場所選択 */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-4">
          {/* 検索 */}
          <div className="mb-4">
            <label htmlFor="location-search" className="block text-sm font-medium text-gray-700 mb-2">
              場所を検索
            </label>
            <div className="flex space-x-2">
              <input
                id="location-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="場所を検索（都市名、店舗名、ランドマークなど）"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? '検索中...' : '検索'}
              </button>
            </div>
          </div>

          {/* 検索エラー */}
          {searchError && (
            <div className="mb-4 rounded-md p-3" style={{
              backgroundColor: currentTheme.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgb(254, 242, 242)',
              borderColor: currentTheme.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgb(254, 202, 202)',
              borderWidth: '1px'
            }}>
              <p className="text-sm text-red-700">{searchError}</p>
            </div>
          )}

          {/* 検索結果 */}
          {searchResults.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">検索結果</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleLocationSelect(result)}
                    className="w-full text-left p-3 border rounded-md transition-colors"
                    style={{
                      backgroundColor: currentTheme.colors.background.primary,
                      borderColor: currentTheme.colors.border.primary,
                      color: currentTheme.colors.text.primary
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = currentTheme.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgb(239, 246, 255)';
                      e.currentTarget.style.borderColor = currentTheme.mode === 'dark' ? 'rgba(59, 130, 246, 0.5)' : 'rgb(147, 197, 253)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = currentTheme.colors.background.primary;
                      e.currentTarget.style.borderColor = currentTheme.colors.border.primary;
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">
                        {getLocationTypeIcon(result.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900 truncate">{result.name}</p>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                            {getLocationTypeLabel(result.type)}
                          </span>
                        </div>

                        {result.category && (
                          <p className="text-xs text-blue-600 mt-1">{result.category}</p>
                        )}

                        {result.address && (
                          <p className="text-xs text-gray-500 mt-1 truncate">{result.address}</p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500">
                            {result.country ?? 'JP'} ({result.lat.toFixed(4)}, {result.lon.toFixed(4)})
                          </p>
                          <span className="text-xs text-gray-400">
                            {result.source === 'openweather' ? 'OpenWeather' : 'OpenStreetMap'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 保存済みの場所 */}
          {savedLocations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">保存済みの場所</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedLocations.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => handleSavedLocationSelect(location)}
                    className="w-full text-left p-3 border rounded-md transition-colors"
                    style={{
                      backgroundColor: currentLocation?.id === location.id
                        ? (currentTheme.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgb(239, 246, 255)')
                        : currentTheme.colors.background.primary,
                      borderColor: currentLocation?.id === location.id
                        ? (currentTheme.mode === 'dark' ? 'rgba(59, 130, 246, 0.5)' : 'rgb(147, 197, 253)')
                        : currentTheme.colors.border.primary,
                      color: currentTheme.colors.text.primary
                    }}
                    onMouseEnter={(e) => {
                      if (currentLocation?.id !== location.id) {
                        e.currentTarget.style.backgroundColor = currentTheme.mode === 'dark' ? 'rgba(107, 114, 128, 0.1)' : 'rgb(249, 250, 251)';
                        e.currentTarget.style.borderColor = currentTheme.mode === 'dark' ? 'rgba(107, 114, 128, 0.5)' : 'rgb(209, 213, 219)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentLocation?.id !== location.id) {
                        e.currentTarget.style.backgroundColor = currentTheme.colors.background.primary;
                        e.currentTarget.style.borderColor = currentTheme.colors.border.primary;
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-3">
                        <span className="text-lg flex-shrink-0 mt-0.5">
                          {location.type ? getLocationTypeIcon(location.type) : '📍'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium truncate" style={{
                              color: currentTheme.colors.text.primary
                            }}>{location.name}</p>
                            {location.type && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs" style={{
                                backgroundColor: currentTheme.mode === 'dark' ? 'rgba(107, 114, 128, 0.3)' : 'rgb(243, 244, 246)',
                                color: currentTheme.mode === 'dark' ? 'rgb(156, 163, 175)' : 'rgb(75, 85, 99)'
                              }}>
                                {getLocationTypeLabel(location.type)}
                              </span>
                            )}
                          </div>

                          {location.category && (
                            <p className="text-xs text-blue-600 mt-1">{location.category}</p>
                          )}

                          {location.address && (
                            <p className="text-xs text-gray-500 mt-1 truncate">{location.address}</p>
                          )}

                          <p className="text-xs text-gray-500 mt-1">
                            ({location.lat.toFixed(4)}, {location.lon.toFixed(4)})
                          </p>
                        </div>
                      </div>
                      {location.isDefault && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          デフォルト
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};