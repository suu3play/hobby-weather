import { describe, it, expect } from 'vitest';
import { HighScoreNotificationService } from '../high-score-notification.service';
import type { Hobby, WeatherForecast, DailyForecast } from '../../types';
import type { ScoredRecommendation } from '../high-score-notification.service';

const createMockHobby = (id: number, name: string, isActive = true): Hobby => ({
  id,
  name,
  isActive,
  preferredWeather: [{ condition: 'clear', weight: 8 }],
  minTemperature: 15,
  maxTemperature: 25,
  createdAt: new Date(),
  isOutdoor: true
});

const createMockWeatherForecast = (): WeatherForecast => ({
  lat: 35.6762,
  lon: 139.6503,
  current: {
    lat: 35.6762,
    lon: 139.6503,
    datetime: new Date(),
    temperature: 22,
    feelsLike: 20,
    humidity: 60,
    pressure: 1013,
    visibility: 10,
    windSpeed: 5,
    windDirection: 180,
    weatherType: 'clear',
    weatherDescription: '晴れ',
    condition: '晴れ',
    cloudiness: 10,
    uvIndex: 6,
    generatedAt: new Date(),
    cachedAt: new Date()
  },
  forecasts: [],
  generatedAt: new Date(),
  cachedAt: new Date()
});

const createMockRecommendation = (hobby: Hobby, score: number): ScoredRecommendation => ({
  hobby,
  score,
  overallScore: score,
  date: new Date(),
  weather: {
    date: new Date(),
    temperature: { min: 18, max: 25, morning: 20, day: 22, evening: 21, night: 19 },
    feelsLike: { morning: 19, day: 21, evening: 20, night: 18 },
    humidity: 60,
    pressure: 1013,
    windSpeed: 5,
    windDirection: 180,
    weatherType: 'clear',
    weatherDescription: '晴れ',
    cloudiness: 10,
    uvIndex: 6,
    pop: 10
  } as DailyForecast,
  reasons: ['天気が良好']
});

describe('HighScoreNotificationService - 基本機能', () => {
  describe('createHighScoreNotificationPayload', () => {
    it('単一の趣味の場合は適切なペイロードを作成する', () => {
      const service = HighScoreNotificationService.getInstance();
      const hobby = createMockHobby(1, 'テニス');
      const recommendations = [createMockRecommendation(hobby, 85)];
      const forecast = createMockWeatherForecast();

      const payload = service.createHighScoreNotificationPayload(recommendations, forecast);

      expect(payload.type).toBe('high-score');
      expect(payload.title).toBe('テニスが最適です！');
      expect(payload.message).toContain('晴れで気温22°C');
      expect(payload.message).toContain('スコア85点');
      expect(payload.icon).toBe('🌟');
      expect(payload.data?.recommendations).toHaveLength(1);
      expect(payload.data?.recommendations?.[0]?.name).toBe('テニス');
      expect(payload.data?.recommendations?.[0]?.score).toBe(85);
    });

    it('複数の趣味の場合は適切なペイロードを作成する', () => {
      const service = HighScoreNotificationService.getInstance();
      const hobbies = [
        createMockHobby(1, 'テニス'),
        createMockHobby(2, 'ジョギング'),
        createMockHobby(3, 'サイクリング')
      ];
      const recommendations = hobbies.map((hobby, index) => 
        createMockRecommendation(hobby, 85 - index * 2)
      );
      const forecast = createMockWeatherForecast();

      const payload = service.createHighScoreNotificationPayload(recommendations, forecast);

      expect(payload.type).toBe('high-score');
      expect(payload.title).toBe('3つの趣味が最適です！');
      expect(payload.message).toContain('テニス、ジョギング、サイクリング');
      expect(payload.message).toContain('最高スコア: 85点');
      expect(payload.icon).toBe('⭐');
      expect(payload.data?.recommendations).toHaveLength(3);
      expect(payload.data?.temperature).toBe(22);
      expect(payload.data && 'weatherCondition' in payload.data ? payload.data['weatherCondition'] : undefined).toBe('晴れ');
    });

    it('天気タイプが正しく日本語変換される', () => {
      const service = HighScoreNotificationService.getInstance();
      const hobby = createMockHobby(1, 'テニス');
      const recommendations = [createMockRecommendation(hobby, 90)];
      
      // 雨の天気予報
      const rainForecast: WeatherForecast = {
        lat: 35.6762,
        lon: 139.6503,
        current: {
          lat: 35.6762,
          lon: 139.6503,
          datetime: new Date(),
          temperature: 18,
          feelsLike: 16,
          humidity: 80,
          pressure: 1005,
          visibility: 8,
          windSpeed: 3,
          windDirection: 90,
          weatherType: 'rain',
          weatherDescription: 'rainy',
          condition: 'rainy',
          cloudiness: 90,
          uvIndex: 2,
          generatedAt: new Date(),
          cachedAt: new Date()
        },
        forecasts: [],
        generatedAt: new Date(),
        cachedAt: new Date()
      };

      const payload = service.createHighScoreNotificationPayload(recommendations, rainForecast);

      expect(payload.message).toContain('雨で気温18°C');
    });
  });

  describe('getWeatherDescription', () => {
    it('天気タイプが正しく日本語に変換される', () => {
      const service = HighScoreNotificationService.getInstance();
      
      // private method にアクセスするため
      const getWeatherDescription = (service as { getWeatherDescription: (weatherType: string) => string }).getWeatherDescription;
      
      expect(getWeatherDescription('clear')).toBe('晴れ');
      expect(getWeatherDescription('clouds')).toBe('曇り');
      expect(getWeatherDescription('rain')).toBe('雨');
      expect(getWeatherDescription('snow')).toBe('雪');
      expect(getWeatherDescription('unknown')).toBe('unknown');
    });
  });

  describe('サービスの基本機能', () => {
    it('シングルトンパターンで同一インスタンスを返す', () => {
      const instance1 = HighScoreNotificationService.getInstance();
      const instance2 = HighScoreNotificationService.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('forceEvaluateHighScore メソッドが存在する', () => {
      const service = HighScoreNotificationService.getInstance();
      
      expect(typeof service.forceEvaluateHighScore).toBe('function');
    });

    it('getHighScoreStatistics メソッドが存在する', () => {
      const service = HighScoreNotificationService.getInstance();
      
      expect(typeof service.getHighScoreStatistics).toBe('function');
    });
  });
});