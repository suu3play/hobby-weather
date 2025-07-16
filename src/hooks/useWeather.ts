import { useState, useEffect, useCallback } from 'react';
import { weatherService } from '../services/weather.service';
import { geolocationService } from '../services/geolocation.service';
import { databaseService } from '../services/database.service';
import type { WeatherData, WeatherForecast, Location } from '../types';
import type { GeolocationPosition } from '../services/geolocation.service';

interface UseWeatherState {
  currentWeather: WeatherData | null;
  forecast: WeatherForecast | null;
  location: Location | null;
  isLoading: boolean;
  error: string | null;
  isLocationLoading: boolean;
  locationError: string | null;
}

interface UseWeatherReturn extends UseWeatherState {
  refreshWeather: () => Promise<void>;
  getCurrentLocation: () => Promise<void>;
  setLocation: (location: Location) => Promise<void>;
  clearError: () => void;
}

export const useWeather = (): UseWeatherReturn => {
  const [state, setState] = useState<UseWeatherState>({
    currentWeather: null,
    forecast: null,
    location: null,
    isLoading: false,
    error: null,
    isLocationLoading: false,
    locationError: null,
  });

  const updateState = useCallback((updates: Partial<UseWeatherState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearError = useCallback(() => {
    updateState({ error: null, locationError: null });
  }, [updateState]);

  const loadDefaultLocation = useCallback(async () => {
    try {
      const defaultLocation = await databaseService.getDefaultLocation();
      if (defaultLocation) {
        updateState({ location: defaultLocation });
        return defaultLocation;
      }
    } catch (error) {
      console.warn('Failed to load default location:', error);
    }
    return null;
  }, [updateState]);

  const fetchWeatherData = useCallback(async (lat: number, lon: number, forceRefresh = false) => {
    updateState({ isLoading: true, error: null });

    try {
      const [currentWeather, forecast] = await Promise.all([
        weatherService.getCurrentWeather(lat, lon, forceRefresh),
        weatherService.getWeatherForecast(lat, lon, forceRefresh)
      ]);

      updateState({
        currentWeather,
        forecast,
        isLoading: false
      });
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : '天気情報の取得に失敗しました',
        isLoading: false
      });
    }
  }, [updateState]);

  const getCurrentLocation = useCallback(async () => {
    updateState({ isLocationLoading: true, locationError: null });

    try {
      const position: GeolocationPosition = await geolocationService.getCurrentPosition();
      
      // Get location name
      const locationName = await weatherService.getLocationByCoords(position.lat, position.lon);
      
      const location: Omit<Location, 'id' | 'createdAt'> = {
        name: locationName,
        lat: position.lat,
        lon: position.lon,
        isDefault: true
      };

      // Save as default location
      await databaseService.saveLocation(location);
      
      const savedLocation = await databaseService.getDefaultLocation();
      
      updateState({
        location: savedLocation ?? null,
        isLocationLoading: false
      });

      // Fetch weather for current location
      if (savedLocation) {
        await fetchWeatherData(savedLocation.lat, savedLocation.lon, true);
      }
    } catch (error) {
      updateState({
        locationError: error instanceof Error ? error.message : '位置情報の取得に失敗しました',
        isLocationLoading: false
      });
    }
  }, [updateState, fetchWeatherData]);

  const setLocation = useCallback(async (location: Location) => {
    updateState({ location });
    
    // Update as default location if not already set
    if (!location.isDefault && location.id) {
      await databaseService.updateLocation(location.id, { isDefault: true });
    }

    // Fetch weather for the new location
    await fetchWeatherData(location.lat, location.lon, true);
  }, [updateState, fetchWeatherData]);

  const refreshWeather = useCallback(async () => {
    if (state.location) {
      await fetchWeatherData(state.location.lat, state.location.lon, true);
    }
  }, [state.location, fetchWeatherData]);

  // Initialize with default location
  useEffect(() => {
    const initialize = async () => {
      const defaultLocation = await loadDefaultLocation();
      if (defaultLocation) {
        await fetchWeatherData(defaultLocation.lat, defaultLocation.lon);
      }
    };

    initialize();
  }, [loadDefaultLocation, fetchWeatherData]);

  return {
    ...state,
    refreshWeather,
    getCurrentLocation,
    setLocation,
    clearError
  };
};