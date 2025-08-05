import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWeather } from './useWeather';

// Mock services
vi.mock('../services/weather.service', () => ({
  weatherService: {
    getCurrentWeather: vi.fn(),
    getWeatherForecast: vi.fn(),
    getLocationByCoords: vi.fn(),
  }
}));

vi.mock('../services/geolocation.service', () => ({
  geolocationService: {
    getCurrentPosition: vi.fn(),
  }
}));

vi.mock('../services/database.service', () => ({
  databaseService: {
    getDefaultLocation: vi.fn(),
    saveLocation: vi.fn(),
    updateLocation: vi.fn(),
  }
}));

import { weatherService } from '../services/weather.service';
import { geolocationService } from '../services/geolocation.service';
import { databaseService } from '../services/database.service';

describe('useWeather', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', async () => {
    const { result } = renderHook(() => useWeather());

    expect(result.current.currentWeather).toBeNull();
    expect(result.current.forecast).toBeNull();
    expect(result.current.location).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isLocationLoading).toBe(false);
    expect(result.current.locationError).toBeNull();
    
    // Wait for the useEffect to complete to avoid act warnings
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
  });

  it('should load default location on mount', async () => {
    const mockLocation = {
      id: 1,
      name: '東京',
      lat: 35.6762,
      lon: 139.6503,
      isDefault: true,
      createdAt: new Date()
    };

    const mockWeather = {
      id: 1,
      lat: 35.6762,
      lon: 139.6503,
      datetime: new Date(),
      temperature: 25,
      feelsLike: 27,
      humidity: 60,
      pressure: 1013,
      visibility: 10000,
      windSpeed: 5,
      windDirection: 180,
      weatherType: 'clear' as const,
      weatherDescription: '晴れ',
      cloudiness: 0,
      uvIndex: 5,
      cachedAt: new Date()
    };

    const mockForecast = {
      id: 1,
      lat: 35.6762,
      lon: 139.6503,
      forecasts: [],
      cachedAt: new Date()
    };

    vi.mocked(databaseService.getDefaultLocation).mockResolvedValue(mockLocation);
    vi.mocked(weatherService.getCurrentWeather).mockResolvedValue(mockWeather);
    vi.mocked(weatherService.getWeatherForecast).mockResolvedValue(mockForecast);

    const { result } = renderHook(() => useWeather());

    // Wait for async initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.location).toEqual(mockLocation);
    expect(result.current.currentWeather).toEqual(mockWeather);
    expect(result.current.forecast).toEqual(mockForecast);
  });

  it('should get current location', async () => {
    const mockPosition = {
      lat: 35.6762,
      lon: 139.6503,
      accuracy: 10
    };

    const mockLocationName = '東京';
    const mockSavedLocation = {
      id: 1,
      name: '東京',
      lat: 35.6762,
      lon: 139.6503,
      isDefault: true,
      createdAt: new Date()
    };

    vi.mocked(geolocationService.getCurrentPosition).mockResolvedValue(mockPosition);
    vi.mocked(weatherService.getLocationByCoords).mockResolvedValue(mockLocationName);
    vi.mocked(databaseService.saveLocation).mockResolvedValue(1);
    vi.mocked(databaseService.getDefaultLocation).mockResolvedValue(mockSavedLocation);
    vi.mocked(weatherService.getCurrentWeather).mockResolvedValue({});
    vi.mocked(weatherService.getWeatherForecast).mockResolvedValue({});

    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.getCurrentLocation();
    });

    expect(result.current.location).toEqual(mockSavedLocation);
    expect(result.current.isLocationLoading).toBe(false);
    expect(result.current.locationError).toBeNull();
  });

  it('should handle geolocation error', async () => {
    const mockError = new Error('位置情報の取得に失敗しました');
    vi.mocked(geolocationService.getCurrentPosition).mockRejectedValue(mockError);

    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.getCurrentLocation();
    });

    expect(result.current.locationError).toBe('位置情報の取得に失敗しました');
    expect(result.current.isLocationLoading).toBe(false);
  });

  it('should refresh weather data', async () => {
    const mockLocation = {
      id: 1,
      name: '東京',
      lat: 35.6762,
      lon: 139.6503,
      isDefault: true,
      createdAt: new Date()
    };

    vi.mocked(databaseService.getDefaultLocation).mockResolvedValue(mockLocation);
    vi.mocked(weatherService.getCurrentWeather).mockResolvedValue({});
    vi.mocked(weatherService.getWeatherForecast).mockResolvedValue({});

    const { result } = renderHook(() => useWeather());

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.refreshWeather();
    });

    expect(weatherService.getCurrentWeather).toHaveBeenCalledWith(35.6762, 139.6503, true);
    expect(weatherService.getWeatherForecast).toHaveBeenCalledWith(35.6762, 139.6503, true);
  });

  it('should clear errors', async () => {
    const { result } = renderHook(() => useWeather());

    // Wait for initial load to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.locationError).toBeNull();
  });

  it('should handle weather fetch error', async () => {
    const mockLocation = {
      id: 1,
      name: '東京',
      lat: 35.6762,
      lon: 139.6503,
      isDefault: true,
      createdAt: new Date()
    };

    const mockError = new Error('API error');

    vi.mocked(databaseService.getDefaultLocation).mockResolvedValue(mockLocation);
    vi.mocked(weatherService.getCurrentWeather).mockRejectedValue(mockError);

    const { result } = renderHook(() => useWeather());

    // Wait for async initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe('API error');
    expect(result.current.isLoading).toBe(false);
  });
});