import React, { useState, useEffect } from 'react';
import type { Location, LocationSearchResult, LocationType } from '../../types';
import { weatherService } from '../../services/weather.service';
import { databaseService } from '../../services/database.service';

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
      console.error('Failed to load saved locations:', error);
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
      // Save location to database
      const locationData: Omit<Location, 'id' | 'createdAt'> = {
        name: searchResult.name,
        lat: searchResult.lat,
        lon: searchResult.lon,
        isDefault: true,
        type: searchResult.type
      };
      
      // Add optional properties only if they exist
      if (searchResult.address) {
        locationData.address = searchResult.address;
      }
      if (searchResult.category) {
        locationData.category = searchResult.category;
      }

      await databaseService.saveLocation(locationData);
      
      // Get the saved location with ID
      const savedLocation = await databaseService.getDefaultLocation();
      
      if (savedLocation) {
        onLocationSelect(savedLocation);
        await loadSavedLocations();
      }

      // Clear search
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
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* Current Location Display */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">現在の場所</h3>
          {currentLocation ? (
            <div className="flex items-center space-x-2">
              <span className="text-blue-600">📍</span>
              <span className="text-gray-700">{currentLocation.name}</span>
              {currentLocation.isDefault && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  デフォルト
                </span>
              )}
            </div>
          ) : (
            <p className="text-gray-500">場所が設定されていません</p>
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

      {/* Expanded Location Selector */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-4">
          {/* Search */}
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
                onKeyPress={handleKeyPress}
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

          {/* Search Error */}
          {searchError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-700">{searchError}</p>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">検索結果</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleLocationSelect(result)}
                    className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-blue-50 hover:border-blue-300 transition-colors"
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

          {/* Saved Locations */}
          {savedLocations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">保存済みの場所</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedLocations.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => handleSavedLocationSelect(location)}
                    className={`w-full text-left p-3 border rounded-md transition-colors ${
                      currentLocation?.id === location.id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-3">
                        <span className="text-lg flex-shrink-0 mt-0.5">
                          {location.type ? getLocationTypeIcon(location.type) : '📍'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900 truncate">{location.name}</p>
                            {location.type && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
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