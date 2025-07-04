import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WeatherService } from './weather.service';
import type { OpenWeatherMapCurrentResponse, OpenWeatherMapOneCallResponse } from '../types/api';

// Mock database service
vi.mock('./database.service', () => ({
  databaseService: {
    getWeatherData: vi.fn(),
    saveWeatherData: vi.fn(),
    getWeatherForecast: vi.fn(),
    saveWeatherForecast: vi.fn(),
  }
}));

describe('WeatherService', () => {
  let service: WeatherService;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
    // Reset environment variable
    vi.unstubAllEnvs();
  });

  describe('mapWeatherCondition', () => {
    it('should map weather conditions correctly', () => {
      const service = new WeatherService();
      
      expect((service as any).mapWeatherCondition('Clear')).toBe('clear');
      expect((service as any).mapWeatherCondition('Clouds')).toBe('clouds');
      expect((service as any).mapWeatherCondition('Rain')).toBe('rain');
      expect((service as any).mapWeatherCondition('Drizzle')).toBe('drizzle');
      expect((service as any).mapWeatherCondition('Thunderstorm')).toBe('thunderstorm');
      expect((service as any).mapWeatherCondition('Snow')).toBe('snow');
      expect((service as any).mapWeatherCondition('Mist')).toBe('mist');
      expect((service as any).mapWeatherCondition('Unknown')).toBe('clear');
    });
  });

  describe('getCurrentWeather', () => {
    it('should fetch and parse current weather data', async () => {
      // Mock environment variable first
      vi.stubEnv('VITE_OPENWEATHER_API_KEY', 'test-api-key');
      service = new WeatherService();
      const mockResponse: OpenWeatherMapCurrentResponse = {
        coord: { lat: 35.6762, lon: 139.6503 },
        weather: [{ id: 800, main: 'Clear', description: '晴天', icon: '01d' }],
        base: 'stations',
        main: {
          temp: 25.5,
          feels_like: 27.2,
          temp_min: 24.0,
          temp_max: 27.0,
          pressure: 1013,
          humidity: 65
        },
        visibility: 10000,
        wind: { speed: 3.5, deg: 180 },
        clouds: { all: 0 },
        dt: 1640995200,
        sys: {
          type: 2,
          id: 2001249,
          country: 'JP',
          sunrise: 1640989800,
          sunset: 1641024600
        },
        timezone: 32400,
        id: 1850147,
        name: 'Tokyo',
        cod: 200
      };

      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });


      const result = await service.getCurrentWeather(35.6762, 139.6503, true);

      expect(result.temperature).toBe(25.5);
      expect(result.weatherType).toBe('clear');
      expect(result.weatherDescription).toBe('晴天');
      expect(result.lat).toBe(35.6762);
      expect(result.lon).toBe(139.6503);
    });

    it('should throw error when API key is missing', async () => {
      vi.stubEnv('VITE_OPENWEATHER_API_KEY', '');
      service = new WeatherService();

      await expect(service.getCurrentWeather(35.6762, 139.6503))
        .rejects.toThrow('API key not configured');
    });

    it('should handle API errors', async () => {
      vi.stubEnv('VITE_OPENWEATHER_API_KEY', 'invalid-key');
      service = new WeatherService();
      
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ cod: 401, message: 'Invalid API key' })
      });

      await expect(service.getCurrentWeather(35.6762, 139.6503, true))
        .rejects.toThrow('Weather API Error: Invalid API key (Code: 401)');
    });
  });

  describe('getWeatherForecast', () => {
    it('should fetch and parse forecast data', async () => {
      vi.stubEnv('VITE_OPENWEATHER_API_KEY', 'test-api-key');
      service = new WeatherService();
      const mockResponse: OpenWeatherMapOneCallResponse = {
        lat: 35.6762,
        lon: 139.6503,
        timezone: 'Asia/Tokyo',
        timezone_offset: 32400,
        current: {
          dt: 1640995200,
          sunrise: 1640989800,
          sunset: 1641024600,
          temp: 25.5,
          feels_like: 27.2,
          pressure: 1013,
          humidity: 65,
          dew_point: 18.5,
          uvi: 5.2,
          clouds: 0,
          visibility: 10000,
          wind_speed: 3.5,
          wind_deg: 180,
          weather: [{ id: 800, main: 'Clear', description: '晴天', icon: '01d' }]
        },
        daily: [
          {
            dt: 1640995200,
            sunrise: 1640989800,
            sunset: 1641024600,
            moonrise: 1641000000,
            moonset: 1641040000,
            moon_phase: 0.5,
            summary: '晴れの日',
            temp: {
              day: 25.5,
              min: 20.0,
              max: 28.0,
              night: 22.0,
              eve: 26.0,
              morn: 21.0
            },
            feels_like: {
              day: 27.2,
              night: 23.5,
              eve: 27.8,
              morn: 22.3
            },
            pressure: 1013,
            humidity: 65,
            dew_point: 18.5,
            wind_speed: 3.5,
            wind_deg: 180,
            weather: [{ id: 800, main: 'Clear', description: '晴天', icon: '01d' }],
            clouds: 0,
            pop: 0.1,
            uvi: 5.2
          }
        ]
      };

      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await service.getWeatherForecast(35.6762, 139.6503, true);

      expect(result.forecasts).toHaveLength(1);
      expect(result.forecasts[0].temperature.day).toBe(25.5);
      expect(result.forecasts[0].weatherType).toBe('clear');
      expect(result.lat).toBe(35.6762);
      expect(result.lon).toBe(139.6503);
    });
  });

  describe('searchLocation', () => {
    it('should search locations', async () => {
      vi.stubEnv('VITE_OPENWEATHER_API_KEY', 'test-api-key');
      service = new WeatherService();
      const mockResponse = [
        {
          name: 'Tokyo',
          lat: 35.6762,
          lon: 139.6503,
          country: 'JP'
        }
      ];

      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await service.searchLocation('Tokyo');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Tokyo');
      expect(result[0].lat).toBe(35.6762);
      expect(result[0].country).toBe('JP');
    });
  });

  describe('getLocationByCoords', () => {
    it('should get location name by coordinates', async () => {
      vi.stubEnv('VITE_OPENWEATHER_API_KEY', 'test-api-key');
      service = new WeatherService();
      const mockResponse = [
        {
          name: 'Tokyo',
          local_names: { ja: '東京' },
          lat: 35.6762,
          lon: 139.6503,
          country: 'JP'
        }
      ];

      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await service.getLocationByCoords(35.6762, 139.6503);

      expect(result).toBe('東京');
    });

    it('should return coordinates when no location found', async () => {
      vi.stubEnv('VITE_OPENWEATHER_API_KEY', 'test-api-key');
      service = new WeatherService();
      
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      const result = await service.getLocationByCoords(35.6762, 139.6503);

      expect(result).toBe('35.6762, 139.6503');
    });
  });

  describe('utility methods', () => {
    it('should return correct weather icons', () => {
      service = new WeatherService();
      expect(service.getWeatherIcon('clear')).toBe('☀️');
      expect(service.getWeatherIcon('rain')).toBe('🌧️');
      expect(service.getWeatherIcon('snow')).toBe('❄️');
    });

    it('should return correct weather descriptions', () => {
      service = new WeatherService();
      expect(service.getWeatherDescription('clear')).toBe('晴れ');
      expect(service.getWeatherDescription('rain')).toBe('雨');
      expect(service.getWeatherDescription('snow')).toBe('雪');
    });
  });
});