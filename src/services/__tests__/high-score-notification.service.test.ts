import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HighScoreNotificationService } from '../high-score-notification.service';
import { DatabaseService } from '../database.service';
import { recommendationService, RecommendationService } from '../recommendation.service';
import { WeatherService } from '../weather.service';
import { NotificationConfigService } from '../notification-config.service';
import type { Hobby, WeatherForecast, HobbyRecommendation } from '../../types';

// モック設定
vi.mock('../database.service', () => ({
  DatabaseService: {
    getInstance: vi.fn()
  }
}));
vi.mock('../recommendation.service', () => ({
  RecommendationService: vi.fn()
}));
vi.mock('../weather.service', () => ({
  WeatherService: vi.fn()
}));
vi.mock('../notification-config.service', () => ({
  NotificationConfigService: vi.fn()
}));

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
  location: { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  current: {
    temperature: 22,
    humidity: 60,
    windSpeed: 5,
    uvIndex: 6,
    pressure: 1013,
    visibility: 10,
    weatherType: 'clear',
    description: '晴れ',
    precipitationProbability: 10,
    lastUpdated: new Date()
  },
  daily: []
});

const createMockRecommendation = (hobby: Hobby, score: number): HobbyRecommendation => ({
  hobby,
  overallScore: score,
  bestDayIndex: 0,
  reasons: ['天気が良好'],
  warnings: [],
  dailyScores: [score, score - 10, score - 20]
});

describe('HighScoreNotificationService', () => {
  let service: HighScoreNotificationService;
  let mockDatabaseService: any;
  let mockRecommendationService: any;
  let mockWeatherService: any;
  let mockConfigService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // シングルトンインスタンスをリセット
    (HighScoreNotificationService as any).instance = undefined;
    
    // DatabaseService のモック
    mockDatabaseService = {
      getActiveHobbies: vi.fn()
    };
    vi.mocked(DatabaseService.getInstance).mockReturnValue(mockDatabaseService);

    // RecommendationService のモック
    mockRecommendationService = {
      generateRecommendations: vi.fn()
    };
    vi.mocked(RecommendationService).mockImplementation(() => mockRecommendationService);

    // WeatherService のモック
    mockWeatherService = {
      getCurrentForecast: vi.fn()
    };
    vi.mocked(WeatherService).mockImplementation(() => mockWeatherService);

    // NotificationConfigService のモック
    mockConfigService = {
      getNotificationHistory: vi.fn().mockResolvedValue([])
    };
    vi.mocked(NotificationConfigService).mockImplementation(() => mockConfigService);

    service = HighScoreNotificationService.getInstance();
  });

  afterEach(() => {
    // シングルトンインスタンスをクリーンアップ
    (HighScoreNotificationService as any).instance = undefined;
  });

  describe('evaluateAndCreateNotification', () => {
    it('天気予報が取得できない場合は通知しない', async () => {
      mockWeatherService.getCurrentForecast.mockResolvedValue(null);

      const result = await service.evaluateAndCreateNotification();

      expect(result.notificationSent).toBe(false);
      expect(result.reason).toBe('天気予報データが取得できませんでした');
    });

    it('アクティブな趣味がない場合は通知しない', async () => {
      mockWeatherService.getCurrentForecast.mockResolvedValue(createMockWeatherForecast());
      mockDatabaseService.getActiveHobbies.mockResolvedValue([]);

      const result = await service.evaluateAndCreateNotification();

      expect(result.notificationSent).toBe(false);
      expect(result.reason).toBe('アクティブな趣味が登録されていません');
    });

    it('高スコアの趣味がない場合は通知しない', async () => {
      const hobbies = [createMockHobby(1, 'テニス')];
      const forecast = createMockWeatherForecast();
      const lowScoreRecommendations = [createMockRecommendation(hobbies[0], 60)];

      mockWeatherService.getCurrentForecast.mockResolvedValue(forecast);
      mockDatabaseService.getActiveHobbies.mockResolvedValue(hobbies);
      mockRecommendationService.generateRecommendations.mockResolvedValue(lowScoreRecommendations);

      const result = await service.evaluateAndCreateNotification();

      expect(result.notificationSent).toBe(false);
      expect(result.reason).toBe('スコア80以上の趣味がありません');
    });

    it('高スコアの趣味がある場合は通知する', async () => {
      const hobbies = [createMockHobby(1, 'テニス')];
      const forecast = createMockWeatherForecast();
      const highScoreRecommendations = [createMockRecommendation(hobbies[0], 85)];

      mockWeatherService.getCurrentForecast.mockResolvedValue(forecast);
      mockDatabaseService.getActiveHobbies.mockResolvedValue(hobbies);
      mockRecommendationService.generateRecommendations.mockResolvedValue(highScoreRecommendations);

      const result = await service.evaluateAndCreateNotification();

      expect(result.notificationSent).toBe(true);
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].overallScore).toBe(85);
    });

    it('クールダウン期間中は通知しない', async () => {
      const hobbies = [createMockHobby(1, 'テニス')];
      const forecast = createMockWeatherForecast();
      const highScoreRecommendations = [createMockRecommendation(hobbies[0], 85)];

      // 最近の通知履歴を設定（クールダウン期間内）
      const recentNotification = {
        id: 1,
        configId: 1,
        type: 'high-score' as const,
        title: 'テスト通知',
        message: 'テストメッセージ',
        sentAt: new Date(),
        data: {
          recommendations: [{ hobbyId: 1, hobbyName: 'テニス', score: 85 }]
        }
      };

      mockWeatherService.getCurrentForecast.mockResolvedValue(forecast);
      mockDatabaseService.getActiveHobbies.mockResolvedValue(hobbies);
      mockRecommendationService.generateRecommendations.mockResolvedValue(highScoreRecommendations);
      mockConfigService.getNotificationHistory.mockResolvedValue([recentNotification]);

      const result = await service.evaluateAndCreateNotification();

      expect(result.notificationSent).toBe(false);
      expect(result.reason).toBe('クールダウン期間中です');
    });

    it('複数の高スコア趣味を上位N個まで制限する', async () => {
      const hobbies = [
        createMockHobby(1, 'テニス'),
        createMockHobby(2, 'ジョギング'),
        createMockHobby(3, 'サイクリング'),
        createMockHobby(4, 'ハイキング'),
        createMockHobby(5, 'キャンプ')
      ];
      const forecast = createMockWeatherForecast();
      const recommendations = hobbies.map((hobby, index) => 
        createMockRecommendation(hobby, 90 - index * 2) // 90, 88, 86, 84, 82
      );

      mockWeatherService.getCurrentForecast.mockResolvedValue(forecast);
      mockDatabaseService.getActiveHobbies.mockResolvedValue(hobbies);
      mockRecommendationService.generateRecommendations.mockResolvedValue(recommendations);

      const result = await service.evaluateAndCreateNotification({
        minScore: 80,
        topN: 3,
        cooldownHours: 6
      });

      expect(result.notificationSent).toBe(true);
      expect(result.recommendations).toHaveLength(3);
      expect(result.recommendations[0].hobby.name).toBe('テニス');
      expect(result.recommendations[0].overallScore).toBe(90);
    });
  });

  describe('createHighScoreNotificationPayload', () => {
    it('単一の趣味の場合は適切なペイロードを作成する', () => {
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
    });

    it('複数の趣味の場合は適切なペイロードを作成する', () => {
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
    });
  });

  describe('forceEvaluateHighScore', () => {
    it('強制評価では閾値とクールダウンを調整する', async () => {
      const hobbies = [createMockHobby(1, 'テニス')];
      const forecast = createMockWeatherForecast();
      const recommendations = [createMockRecommendation(hobbies[0], 65)];

      mockWeatherService.getCurrentForecast.mockResolvedValue(forecast);
      mockDatabaseService.getActiveHobbies.mockResolvedValue(hobbies);
      mockRecommendationService.generateRecommendations.mockResolvedValue(recommendations);

      const result = await service.forceEvaluateHighScore();

      expect(result.notificationSent).toBe(true);
      expect(result.recommendations[0].overallScore).toBe(65);
    });
  });

  describe('getHighScoreStatistics', () => {
    it('通知履歴から統計を計算する', async () => {
      const mockHistory = [
        {
          id: 1,
          configId: 1,
          type: 'high-score' as const,
          title: 'テニス高スコア',
          message: 'テストメッセージ',
          sentAt: new Date('2024-01-02'),
          data: {
            recommendations: [{ hobbyId: 1, hobbyName: 'テニス', score: 85 }]
          }
        },
        {
          id: 2,
          configId: 1,
          type: 'high-score' as const,
          title: 'ジョギング高スコア',
          message: 'テストメッセージ',
          sentAt: new Date('2024-01-01'),
          data: {
            recommendations: [{ hobbyId: 2, hobbyName: 'ジョギング', score: 90 }]
          }
        },
        {
          id: 3,
          configId: 1,
          type: 'high-score' as const,
          title: 'テニス高スコア',
          message: 'テストメッセージ',
          sentAt: new Date('2024-01-03'),
          data: {
            recommendations: [{ hobbyId: 1, hobbyName: 'テニス', score: 80 }]
          }
        }
      ];

      mockConfigService.getNotificationHistory.mockResolvedValue(mockHistory);

      const stats = await service.getHighScoreStatistics();

      expect(stats.totalHighScoreNotifications).toBe(3);
      expect(stats.averageScore).toBe(85); // (85 + 90 + 80) / 3
      expect(stats.topHobby?.name).toBe('テニス');
      expect(stats.topHobby?.count).toBe(2);
      expect(stats.lastNotificationTime).toEqual(new Date('2024-01-02'));
    });

    it('履歴がない場合はデフォルト値を返す', async () => {
      mockConfigService.getNotificationHistory.mockResolvedValue([]);

      const stats = await service.getHighScoreStatistics();

      expect(stats.totalHighScoreNotifications).toBe(0);
      expect(stats.averageScore).toBe(0);
      expect(stats.topHobby).toBeNull();
      expect(stats.lastNotificationTime).toBeNull();
    });
  });
});