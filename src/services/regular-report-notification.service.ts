import { DatabaseService } from './database.service';
import { WeatherService } from './weather.service';
import { RecommendationService } from './recommendation.service';
import { NotificationConfigService } from './notification-config.service';
import type { 
  WeatherForecast,
  NotificationPayload 
} from '../types';
import type { HobbyRecommendation } from './recommendation.service';

export interface ReportPeriod {
  type: 'daily' | 'weekly' | 'monthly';
  includePastDays: number;
  includeUpcomingDays: number;
}

export interface ReportContent {
  summary: string;
  topRecommendations: HobbyRecommendation[];
  weatherSummary: string;
  statisticsSummary: string;
  actionItems: string[];
}

export interface RegularReportResult {
  reportGenerated: boolean;
  reportContent?: ReportContent;
  reason?: string;
}

export class RegularReportNotificationService {
  private static instance: RegularReportNotificationService;
  private databaseService = new DatabaseService();
  private weatherService = new WeatherService();
  private recommendationService = new RecommendationService();
  private configService = new NotificationConfigService();

  static getInstance(): RegularReportNotificationService {
    if (!RegularReportNotificationService.instance) {
      RegularReportNotificationService.instance = new RegularReportNotificationService();
    }
    return RegularReportNotificationService.instance;
  }

  // 定期レポートの生成と評価
  async generateRegularReport(
    period: ReportPeriod = {
      type: 'daily',
      includePastDays: 1,
      includeUpcomingDays: 3
    }
  ): Promise<RegularReportResult> {
    try {
      // 現在の天気予報を取得
      const defaultLocation = { lat: 35.6762, lon: 139.6503 }; // Tokyo default
      const forecast = await this.weatherService.getWeatherForecast(defaultLocation.lat, defaultLocation.lon);
      if (!forecast) {
        return {
          reportGenerated: false,
          reason: '天気予報データが取得できませんでした'
        };
      }

      // アクティブな趣味を取得
      const hobbies = await this.databaseService.getActiveHobbies();
      if (hobbies.length === 0) {
        return {
          reportGenerated: false,
          reason: 'アクティブな趣味が登録されていません'
        };
      }

      // 推薦を生成
      const recommendations = await this.recommendationService.generateRecommendations(
        hobbies,
        forecast
      );

      if (recommendations.length === 0) {
        return {
          reportGenerated: false,
          reason: '推薦データを生成できませんでした'
        };
      }

      // レポートコンテンツを生成
      const reportContent = await this.createReportContent(
        recommendations,
        forecast,
        period
      );

      return {
        reportGenerated: true,
        reportContent
      };

    } catch (error) {
      console.error('定期レポートの生成中にエラー:', error);
      return {
        reportGenerated: false,
        reason: error instanceof Error ? error.message : '定期レポートの生成中にエラーが発生しました'
      };
    }
  }

  // レポートコンテンツの作成
  private async createReportContent(
    recommendations: HobbyRecommendation[],
    forecast: WeatherForecast,
    period: ReportPeriod
  ): Promise<ReportContent> {
    // 上位推薦を取得（スコア順）
    const topRecommendations = recommendations
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 5);

    // 概要の生成
    const summary = this.generateSummary(topRecommendations, period);

    // 天気概要の生成
    const weatherSummary = this.generateWeatherSummary(forecast, period);

    // 統計概要の生成
    const statisticsSummary = await this.generateStatisticsSummary(recommendations);

    // アクション項目の生成
    const actionItems = this.generateActionItems(topRecommendations, forecast);

    return {
      summary,
      topRecommendations,
      weatherSummary,
      statisticsSummary,
      actionItems
    };
  }

  // サマリーの生成
  private generateSummary(recommendations: HobbyRecommendation[], period: ReportPeriod): string {
    const periodText = {
      daily: '今日',
      weekly: '今週',
      monthly: '今月'
    };

    const highScoreCount = recommendations.filter(rec => rec.overallScore >= 80).length;
    const topHobby = recommendations[0];

    if (highScoreCount === 0) {
      return `${periodText[period.type]}は天気条件がやや厳しく、${recommendations.length}つの趣味活動を確認しましたが高スコアの活動は少なめです。`;
    }

    if (highScoreCount === 1) {
      return `${periodText[period.type]}は${topHobby?.hobby.name ?? '趣味活動'}が特に最適です（スコア${Math.round(topHobby?.overallScore ?? 0)}点）。`;
    }

    const hobbyNames = recommendations
      .slice(0, 3)
      .map(rec => rec.hobby.name)
      .join('、');

    return `${periodText[period.type]}は${highScoreCount}つの趣味活動が好条件です。特に${hobbyNames}がおすすめです。`;
  }

  // 天気概要の生成
  private generateWeatherSummary(forecast: WeatherForecast, _period: ReportPeriod): string {
    const currentWeather = forecast.current;
    const weatherDescription = this.getWeatherDescription(currentWeather?.weatherType || 'clear');
    
    let summary = `現在は${weatherDescription}で気温${Math.round(currentWeather?.temperature ?? 20)}°C、`;
    
    const precipProb = 30; // デフォルト値 - precipitationProbability は WeatherData に存在しない
    if (precipProb > 60) {
      summary += `降水確率${precipProb}%と雨の可能性が高めです。`;
    } else if (precipProb > 30) {
      summary += `降水確率${precipProb}%と変化しやすい天候です。`;
    } else {
      summary += `降水確率${precipProb}%と安定した天候です。`;
    }

    // 風速情報を追加
    if ((currentWeather?.windSpeed ?? 0) > 10) {
      summary += ` 風が強めです（${currentWeather?.windSpeed ?? 0}m/s）。`;
    }

    // UV指数情報を追加
    if ((currentWeather?.uvIndex ?? 0) > 6) {
      summary += ` UV指数が高いため日焼け対策をお勧めします（UV指数${currentWeather?.uvIndex ?? 0}）。`;
    }

    return summary;
  }

  // 統計概要の生成
  private async generateStatisticsSummary(recommendations: HobbyRecommendation[]): Promise<string> {
    try {
      // 過去の通知履歴から統計を取得
      const history = await this.configService.getNotificationHistory({
        type: 'regular-report',
        limit: 30
      });

      const avgScore = recommendations.length > 0
        ? Math.round(recommendations.reduce((sum, rec) => sum + rec.overallScore, 0) / recommendations.length)
        : 0;

      const outdoorCount = recommendations.filter(rec => rec.hobby.isOutdoor).length;
      const indoorCount = recommendations.length - outdoorCount;

      let summary = `平均適性スコア: ${avgScore}点`;

      if (outdoorCount > 0 && indoorCount > 0) {
        summary += `（屋外${outdoorCount}件、屋内${indoorCount}件）`;
      } else if (outdoorCount > 0) {
        summary += `（屋外活動中心）`;
      } else {
        summary += `（屋内活動中心）`;
      }

      if (history.length > 0) {
        summary += `。過去30日間で${history.length}回のレポートを送信済みです。`;
      }

      return summary;

    } catch (error) {
      console.error('統計概要の生成エラー:', error);
      return '統計データを取得できませんでした。';
    }
  }

  // アクション項目の生成
  private generateActionItems(
    recommendations: HobbyRecommendation[],
    forecast: WeatherForecast
  ): string[] {
    const actions: string[] = [];

    // 高スコア活動のアクション
    const highScoreRecs = recommendations.filter(rec => rec.overallScore >= 80);
    if (highScoreRecs.length > 0) {
      const topHobby = highScoreRecs[0];
      actions.push(`${topHobby?.hobby.name ?? '趣味活動'}を今日実行するのに最適です`);
    }

    // 天気に基づくアクション
    const current = forecast.current;
    const precipProb = 30; // デフォルト値
    if (precipProb > 60) {
      actions.push('雨の準備をして屋内活動を優先しましょう');
    } else if (precipProb > 30) {
      actions.push('折りたたみ傘を持参して屋外活動を楽しみましょう');
    }

    if ((current?.uvIndex ?? 0) > 6) {
      actions.push('日焼け止めと帽子で紫外線対策をしましょう');
    }

    if ((current?.windSpeed ?? 0) > 10) {
      actions.push('風が強いため屋外活動時は注意が必要です');
    }

    // 温度に基づくアクション
    if ((current?.temperature ?? 20) < 10) {
      actions.push('防寒対策をしっかりと行いましょう');
    } else if ((current?.temperature ?? 20) > 25) {
      actions.push('水分補給と熱中症対策を忘れずに');
    }

    // 推薦に基づくアクション
    const lowScoreRecs = recommendations.filter(rec => rec.overallScore < 60);
    if (lowScoreRecs.length === recommendations.length) {
      actions.push('今日は趣味活動より休息日として過ごすのも良いでしょう');
    }

    return actions.slice(0, 4); // 最大4つまで
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

  // 定期レポート通知のペイロード作成
  createRegularReportNotificationPayload(reportContent: ReportContent): NotificationPayload {
    // 簡潔なメッセージを作成
    const shortSummary = reportContent.summary.length > 80 
      ? reportContent.summary.substring(0, 77) + '...'
      : reportContent.summary;

    // const topHobbyName = reportContent.topRecommendations.length > 0
    //   ? reportContent.topRecommendations[0].hobby.name
    //   : '趣味活動';

    return {
      type: 'regular-report',
      title: '📊 今日の趣味レポート',
      message: shortSummary,
      icon: '📊',
      data: {
        summary: reportContent.summary,
        topHobbies: reportContent.topRecommendations.slice(0, 3).map(rec => ({
          name: rec.hobby.name,
          score: rec.overallScore
        })),
        weatherSummary: reportContent.weatherSummary,
        actionItems: reportContent.actionItems,
        timestamp: new Date().toISOString()
      }
    };
  }

  // デバッグ用：強制的にレポートを生成
  async forceGenerateReport(): Promise<RegularReportResult> {
    console.log('定期レポートを強制生成中...');
    const result = await this.generateRegularReport();
    console.log('生成結果:', result);
    return result;
  }

  // 定期レポート統計の取得
  async getRegularReportStatistics(): Promise<{
    totalReports: number;
    averageScore: number;
    mostFrequentHobby: { name: string; count: number } | null;
    lastReportTime: Date | null;
  }> {
    try {
      const history = await this.configService.getNotificationHistory({
        type: 'regular-report'
      });

      if (history.length === 0) {
        return {
          totalReports: 0,
          averageScore: 0,
          mostFrequentHobby: null,
          lastReportTime: null
        };
      }

      // 平均スコアを計算
      const scores = history
        .map(h => (h.data && h.data['topHobbies'] && Array.isArray(h.data['topHobbies']) && h.data['topHobbies'][0] && typeof h.data['topHobbies'][0] === 'object' && 'score' in h.data['topHobbies'][0]) ? (h.data['topHobbies'][0] as any).score : 0)
        .filter(score => score > 0);
      
      const averageScore = scores.length > 0 
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : 0;

      // 最も頻繁に登場する趣味を特定
      const hobbyCount: Record<string, number> = {};
      history.forEach(h => {
        if (h.data && h.data['topHobbies'] && Array.isArray(h.data['topHobbies'])) {
          (h.data['topHobbies'] as any[]).forEach((hobby: any) => {
            if (hobby && typeof hobby === 'object' && 'name' in hobby) {
              hobbyCount[hobby.name] = (hobbyCount[hobby.name] || 0) + 1;
            }
          });
        }
      });

      const mostFrequentEntry = Object.entries(hobbyCount)
        .sort(([,a], [,b]) => b - a)[0];

      const mostFrequentHobby = mostFrequentEntry 
        ? { name: mostFrequentEntry[0], count: mostFrequentEntry[1] }
        : null;

      return {
        totalReports: history.length,
        averageScore,
        mostFrequentHobby,
        lastReportTime: history.length > 0 ? (history[0]?.sentAt ?? null) : null
      };

    } catch (error) {
      console.error('定期レポート統計の取得エラー:', error);
      return {
        totalReports: 0,
        averageScore: 0,
        mostFrequentHobby: null,
        lastReportTime: null
      };
    }
  }
}