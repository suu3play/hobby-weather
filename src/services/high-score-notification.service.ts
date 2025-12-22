import { DatabaseService } from './database.service';
import { RecommendationService } from './recommendation.service';
import { WeatherService } from './weather.service';
import { NotificationConfigService } from './notification-config.service';
import type { 
  WeatherForecast,
  NotificationPayload,
  DailyForecast,
  Hobby
} from '../types';
// import type { HobbyRecommendation } from './recommendation.service'; // Unused import

export interface HighScoreThreshold {
  minScore: number; // 通知を送る最低スコア（デフォルト: 80）
  topN: number; // 上位N個の趣味を通知対象とする（デフォルト: 3）
  cooldownHours: number; // 同じ趣味の再通知までの時間（デフォルト: 6時間）
}

// 内部用のスコア付き趣味推薦
export interface ScoredRecommendation {
  hobby: Hobby;
  score: number;
  overallScore: number;
  date: Date;
  weather: DailyForecast;
  reasons: string[];
}

export interface HighScoreNotificationResult {
  notificationSent: boolean;
  recommendations: ScoredRecommendation[];
  reason?: string;
}

export class HighScoreNotificationService {
  private static instance: HighScoreNotificationService;
  private databaseService: DatabaseService;
  private recommendationService: RecommendationService;
  private weatherService: WeatherService;
  private configService: NotificationConfigService;

  constructor(
    databaseService?: DatabaseService,
    recommendationService?: RecommendationService,
    weatherService?: WeatherService,
    configService?: NotificationConfigService
  ) {
    this.databaseService = databaseService || new DatabaseService();
    this.recommendationService = recommendationService || new RecommendationService();
    this.weatherService = weatherService || new WeatherService();
    this.configService = configService || new NotificationConfigService();
  }

  static getInstance(): HighScoreNotificationService {
    if (!HighScoreNotificationService.instance) {
      HighScoreNotificationService.instance = new HighScoreNotificationService();
    }
    return HighScoreNotificationService.instance;
  }

  // 高スコア通知の評価とペイロード生成
  async evaluateAndCreateNotification(
    threshold: HighScoreThreshold = {
      minScore: 80,
      topN: 3,
      cooldownHours: 6
    }
  ): Promise<HighScoreNotificationResult> {
    try {
      // 現在の天気予報を取得
      const defaultLocation = { lat: 35.6762, lon: 139.6503 }; // Tokyo default
      const forecast = await this.weatherService.getWeatherForecast(defaultLocation.lat, defaultLocation.lon);
      if (!forecast) {
        return {
          notificationSent: false,
          recommendations: [],
          reason: '天気予報データが取得できませんでした'
        };
      }

      // アクティブな趣味を取得
      const hobbies = await this.databaseService.getActiveHobbies();
      if (hobbies.length === 0) {
        return {
          notificationSent: false,
          recommendations: [],
          reason: 'アクティブな趣味が登録されていません'
        };
      }

      // 推薦を生成
      const recommendations = await this.recommendationService.generateRecommendations(
        hobbies,
        forecast
      );

      // RecommendationServiceの形式をNotificationサービス用に変換
      const convertedRecommendations = recommendations.map(rec => ({
        hobby: rec.hobby,
        score: rec.overallScore,
        overallScore: rec.overallScore,
        date: new Date(),
        weather: forecast.forecasts?.[0] || {
          date: new Date(),
          temperature: { min: 18, max: 25, morning: 20, day: 22, evening: 21, night: 19 },
          feelsLike: { morning: 19, day: 21, evening: 20, night: 18 },
          humidity: forecast.current?.humidity || 60,
          pressure: forecast.current?.pressure || 1013,
          windSpeed: forecast.current?.windSpeed || 5,
          windDirection: forecast.current?.windDirection || 180,
          weatherType: forecast.current?.weatherType || 'clear',
          weatherDescription: forecast.current?.weatherDescription || '晴れ',
          cloudiness: forecast.current?.cloudiness || 10,
          uvIndex: forecast.current?.uvIndex || 6,
          pop: 10
        },
        reasons: rec.recommendedDays?.[0]?.matchingFactors || ['天気に基づいた推薦']
      }));

      // 高スコアの趣味をフィルタリング
      const highScoreRecommendations = convertedRecommendations
        .filter(rec => rec.overallScore >= threshold.minScore)
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, threshold.topN);

      if (highScoreRecommendations.length === 0) {
        return {
          notificationSent: false,
          recommendations: [],
          reason: `スコア${threshold.minScore}以上の趣味がありません`
        };
      }

      // クールダウンチェック
      const shouldNotify = await this.checkCooldown(
        highScoreRecommendations.map(rec => rec.hobby.id!),
        threshold.cooldownHours
      );

      if (!shouldNotify) {
        return {
          notificationSent: false,
          recommendations: highScoreRecommendations,
          reason: 'クールダウン期間中です'
        };
      }

      return {
        notificationSent: true,
        recommendations: highScoreRecommendations
      };

    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('高スコア通知の評価中にエラー:', error);
      }
      return {
        notificationSent: false,
        recommendations: [],
        reason: error instanceof Error ? error.message : '評価中にエラーが発生しました'
      };
    }
  }

  // 高スコア通知のペイロードを作成
  createHighScoreNotificationPayload(
    recommendations: ScoredRecommendation[],
    forecast: WeatherForecast
  ): NotificationPayload {
    const topHobby = recommendations[0];
    const currentWeather = forecast.current;
    const weatherCondition = this.getWeatherDescription(currentWeather?.weatherType || 'clear');
    const temperature = Math.round(currentWeather?.temperature || 20);

    // 複数の趣味がある場合
    if (recommendations.length > 1) {
      const hobbyNames = recommendations
        .slice(0, 3)
        .map(rec => rec.hobby.name)
        .join('、');

      return {
        type: 'high-score',
        title: `${recommendations.length}つの趣味が最適です！`,
        message: `${weatherCondition}で気温${temperature}°C。${hobbyNames}などがおすすめです。最高スコア: ${Math.round(topHobby?.overallScore ?? 0)}点`,
        icon: '⭐',
        data: {
          recommendations: recommendations.map(rec => ({
            name: rec.hobby.name,
            score: rec.overallScore
          })),
          weatherCondition,
          temperature
        }
      };
    }

    // 単一の趣味の場合
    return {
      type: 'high-score',
      title: `${topHobby?.hobby.name ?? '趣味活動'}が最適です！`,
      message: `${weatherCondition}で気温${temperature}°C。スコア${Math.round(topHobby?.overallScore ?? 0)}点の高評価です！`,
      icon: '🌟',
      data: {
        recommendations: [{
          name: topHobby?.hobby.name ?? '趣味活動',
          score: topHobby?.overallScore ?? 0
        }],
        weatherCondition,
        temperature
      }
    };
  }

  // クールダウン期間のチェック
  private async checkCooldown(
    hobbyIds: number[],
    cooldownHours: number
  ): Promise<boolean> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - cooldownHours);

      // 指定された趣味の最近の通知履歴を確認
      const recentNotifications = await this.configService.getNotificationHistory({
        type: 'high-score',
        since: cutoffTime
      });

      // いずれかの趣味が最近通知されていたらクールダウン中
      for (const notification of recentNotifications) {
        if (notification.data && notification.data['recommendations'] && Array.isArray(notification.data['recommendations'])) {
          const notifiedHobbyIds = (notification.data['recommendations'] as Array<{ hobbyId?: string; name?: string }>).map(
            (rec) => rec.hobbyId || rec.name
          );
          
          const hasOverlap = hobbyIds.some(id => notifiedHobbyIds.includes(String(id)));
          if (hasOverlap) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('クールダウンチェックエラー:', error);
      }
      // エラー時は通知を許可（安全側に倒す）
      return true;
    }
  }

  // 天気タイプの日本語説明を取得
  private getWeatherDescription(weatherType: string): string {
    const descriptions: Record<string, string> = {
      'clear': '晴れ',
      'clouds': '曇り',
      'rain': '雨',
      'drizzle': '小雨',
      'thunderstorm': '雷雨',
      'snow': '雪',
      'mist': '霧',
      'fog': '濃霧',
      'haze': 'もや',
      'dust': '砂埃'
    };
    
    return descriptions[weatherType] || weatherType;
  }

  // デバッグ用：強制的に高スコア通知を評価
  async forceEvaluateHighScore(): Promise<HighScoreNotificationResult> {
    const result = await this.evaluateAndCreateNotification({
      minScore: 60, // 閾値を下げてテスト
      topN: 5,
      cooldownHours: 0 // クールダウンを無効化
    });

    return result;
  }

  // 高スコア統計の取得
  async getHighScoreStatistics(): Promise<{
    totalHighScoreNotifications: number;
    averageScore: number;
    topHobby: { name: string; count: number } | null;
    lastNotificationTime: Date | null;
  }> {
    try {
      const history = await this.configService.getNotificationHistory({
        type: 'high-score'
      });

      if (history.length === 0) {
        return {
          totalHighScoreNotifications: 0,
          averageScore: 0,
          topHobby: null,
          lastNotificationTime: null
        };
      }

      // スコアの平均を計算
      interface RecommendationData {
        score: number;
        name?: string;
        hobbyName?: string;
      }

      const scores = history
        .map(h => {
          if (h.data && h.data['recommendations'] && Array.isArray(h.data['recommendations'])) {
            const firstRec = h.data['recommendations'][0];
            if (firstRec && typeof firstRec === 'object' && 'score' in firstRec) {
              return (firstRec as RecommendationData).score;
            }
          }
          return 0;
        })
        .filter(score => score > 0);
      
      const averageScore = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : 0;

      // 最も多く通知された趣味を特定
      const hobbyCount: Record<string, number> = {};
      history.forEach(h => {
        if (h.data && h.data['recommendations'] && Array.isArray(h.data['recommendations'])) {
          h.data['recommendations'].forEach((rec: unknown) => {
            if (rec && typeof rec === 'object' && ('name' in rec || 'hobbyName' in rec)) {
              const recData = rec as RecommendationData;
              const hobbyName = recData.name || recData.hobbyName; // コンパチビリティのため両方をサポート
              if (hobbyName) {
                hobbyCount[hobbyName] = (hobbyCount[hobbyName] || 0) + 1;
              }
            }
          });
        }
      });

      const topHobbyEntry = Object.entries(hobbyCount)
        .sort(([,a], [,b]) => b - a)[0];

      const topHobby = topHobbyEntry 
        ? { name: topHobbyEntry[0], count: topHobbyEntry[1] }
        : null;

      return {
        totalHighScoreNotifications: history.length,
        averageScore: Math.round(averageScore),
        topHobby,
        lastNotificationTime: history.length > 0 ? (history[0]?.sentAt ?? null) : null
      };

    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('高スコア統計の取得エラー:', error);
      }
      return {
        totalHighScoreNotifications: 0,
        averageScore: 0,
        topHobby: null,
        lastNotificationTime: null
      };
    }
  }
}