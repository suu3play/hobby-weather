import type { Hobby, WeatherForecast, DailyForecast, WeatherType } from '../types';
import { weatherService } from './weather.service';

// 趣味のおすすめ情報
export interface HobbyRecommendation {
  hobby: Hobby; // 対象の趣味
  recommendedDays: RecommendedDay[]; // おすすめ日程
  overallScore: number; // 総合スコア
  bestDayIndex: number; // 最適日のインデックス
}

// おすすめ日の詳細情報
export interface RecommendedDay {
  date: Date; // 日付
  score: number; // スコア
  matchingFactors: string[]; // 良い条件
  warningFactors: string[]; // 注意事項
  forecast: DailyForecast; // 天気予報
}

// おすすめのフィルター条件
export interface RecommendationFilters {
  minScore?: number; // 最小スコア
  dateRange?: {
    start: Date; // 開始日
    end: Date; // 終了日
  };
  weatherTypes?: WeatherType[]; // 天気タイプ
  excludeWeekends?: boolean; // 週末を除外
  excludeWeekdays?: boolean; // 平日を除外
}

export class RecommendationService {
  /**
   * 趣味に基づいて天気予報からおすすめを生成
   */
  async generateRecommendations(
    hobbies: Hobby[],
    forecast: WeatherForecast,
    filters?: RecommendationFilters
  ): Promise<HobbyRecommendation[]> {
    const recommendations: HobbyRecommendation[] = [];

    for (const hobby of hobbies) {
      const recommendedDays = this.calculateDailyScores(hobby, forecast.forecasts, filters);
      
      if (recommendedDays.length === 0) continue;

      const overallScore = this.calculateOverallScore(recommendedDays);
      const bestDayIndex = this.findBestDayIndex(recommendedDays);

      recommendations.push({
        hobby,
        recommendedDays,
        overallScore,
        bestDayIndex
      });
    }

    // スコア順でソート
    return recommendations.sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * 各日のスコアを計算
   */
  private calculateDailyScores(
    hobby: Hobby,
    forecasts: DailyForecast[],
    filters?: RecommendationFilters
  ): RecommendedDay[] {
    const recommendedDays: RecommendedDay[] = [];

    for (const forecast of forecasts) {
      // フィルター適用
      if (!this.passesFilters(forecast, filters)) continue;

      const dayScore = this.calculateDayScore(hobby, forecast);
      const { matchingFactors, warningFactors } = this.analyzeFactors(hobby, forecast);

      // 最小スコアフィルター
      if (filters?.minScore && dayScore.score < filters.minScore) continue;

      recommendedDays.push({
        date: forecast.date,
        score: dayScore.score,
        matchingFactors,
        warningFactors,
        forecast
      });
    }

    return recommendedDays.sort((a, b) => b.score - a.score);
  }

  /**
   * 趣味に対する1日のスコアを算出（0-100点）
   * 
   * スコア構成要素と重み付け:
   * - 天気タイプ: 40% （最も重要な要素、趣味の適性に直結）
   * - 気温: 25% （体感に大きく影響、活動の快適性を左右）
   * - 降水確率: 20% （屋外活動に重要、屋内活動には影響少）
   * - 風速: 10% （一部の活動に影響、スポーツ系で重要）
   * - UV指数: 5% （長時間屋外活動時のみ考慮）
   * 
   * 重み付けは実際の利用パターンやフィードバックに基づいて調整可能
   */
  private calculateDayScore(hobby: Hobby, forecast: DailyForecast): { score: number; breakdown: Record<string, number> } {
    let score = 0;
    const breakdown: Record<string, number> = {};

    // 天気タイプスコア (40%) - 趣味の適性に最も重要
    const weatherScore = this.calculateWeatherScore(hobby, forecast);
    score += weatherScore * 0.4;
    breakdown['weather'] = weatherScore;

    // 気温スコア (25%) - 快適性に大きく影響
    const temperatureScore = this.calculateTemperatureScore(hobby, forecast);
    score += temperatureScore * 0.25;
    breakdown['temperature'] = temperatureScore;

    // 降水確率スコア (20%) - 屋外活動の実行可能性を判断
    const precipitationScore = this.calculatePrecipitationScore(hobby, forecast);
    score += precipitationScore * 0.2;
    breakdown['precipitation'] = precipitationScore;

    // 風速スコア (10%) - 一部活動への影響を考慮
    const windScore = this.calculateWindScore(hobby, forecast);
    score += windScore * 0.1;
    breakdown['wind'] = windScore;

    // UV指数スコア (5%)
    const uvScore = this.calculateUVScore(hobby, forecast);
    score += uvScore * 0.05;
    breakdown['uv'] = uvScore;

    return { score: Math.max(0, Math.min(100, score)), breakdown };
  }

  /**
   * 天気タイプスコア計算
   */
  private calculateWeatherScore(hobby: Hobby, forecast: DailyForecast): number {
    if (!hobby.preferredWeather || hobby.preferredWeather.length === 0) return 50;

    // 天気条件配列の場合の処理
    const weatherConditions = hobby.preferredWeather;
    const matchingCondition = weatherConditions.find(w => w.condition === forecast.weatherType);
    
    if (matchingCondition) {
      // 重み付きスコア計算 (重み1-10を0-100に変換)
      return Math.min(100, matchingCondition.weight * 10);
    }

    /**
     * 天気タイプ間の互換性マッピング
     * 
     * 設計思想:
     * - 'clouds'（曇り）の趣味は'clear'（晴れ）でも部分的に適用可能
     * - 'drizzle'（霧雨）は'rain'（雨）の軽い版として扱う
     * - 'mist'系の天気は視界に影響するが部分的に互換性あり
     * 
     * この互換性により、完全一致しない場合でも部分スコア（60点）を付与
     * 完全不適合でも最低限のスコア（20点）を保証してユーザビリティを向上
     */
    const compatibleWeather: Record<WeatherType, WeatherType[]> = {
      clear: ['clear'],
      clouds: ['clouds', 'clear'],
      rain: ['rain'],
      snow: ['snow'],
      thunderstorm: ['thunderstorm'],
      drizzle: ['drizzle', 'rain'],
      mist: ['mist', 'clouds'],
      fog: ['fog', 'mist'],
      haze: ['haze', 'mist'],
      dust: ['dust']
    };

    const compatible = compatibleWeather[forecast.weatherType] || [];
    const hasCompatible = weatherConditions.some(weather => compatible.includes(weather.condition));

    return hasCompatible ? 60 : 20;
  }

  /**
   * 気温スコア計算
   * 
   * アルゴリズム:
   * 1. 趣味の活動時間帯（朝/昼/夕/夜）に応じて対象気温を選択
   * 2. 趣味に設定された適温範囲（デフォルト10-30℃）と比較
   * 3. 範囲内なら100点、範囲外なら距離に応じて5点/℃で減点
   * 
   * 例: 散歩（15-25℃設定）で気温30℃の場合
   * → 距離5℃ × 5点 = 25点減点 → 75点
   */
  private calculateTemperatureScore(hobby: Hobby, forecast: DailyForecast): number {
    // 活動時間帯に基づいた気温を使用
    const targetTemp = this.getTargetTemperature(hobby, forecast);
    
    // デフォルト範囲: 10-30度（一般的な屋外活動に適した範囲）
    const minTemp = hobby.minTemperature ?? 10;
    const maxTemp = hobby.maxTemperature ?? 30;

    if (targetTemp >= minTemp && targetTemp <= maxTemp) return 100;

    // 範囲外の場合は距離に応じて減点（1℃あたり5点減点）
    const distance = Math.min(
      Math.abs(targetTemp - minTemp),
      Math.abs(targetTemp - maxTemp)
    );

    return Math.max(0, 100 - (distance * 5));
  }

  /**
   * 降水確率スコア計算
   * 
   * 屋外活動と屋内活動で異なる評価基準を適用:
   * 
   * 屋外活動（散歩、スポーツ等）:
   * - 10%以下: 100点（安心して活動可能）
   * - 30%以下: 70点（注意すれば可能）
   * - 50%以下: 40点（リスクあり）
   * - 50%超: 10点（推奨しない）
   * 
   * 屋内活動（読書、料理等）:
   * - より雨に寛容な評価
   * - 移動時の影響のみ考慮
   */
  private calculatePrecipitationScore(hobby: Hobby, forecast: DailyForecast): number {
    const popPercent = forecast.pop * 100;

    // 屋外活動は雨に敏感
    if (hobby.isOutdoor) {
      if (popPercent <= 10) return 100;
      if (popPercent <= 30) return 70;
      if (popPercent <= 50) return 40;
      return 10;
    }

    // 屋内活動は雨の影響が少ない（移動時の影響のみ）
    if (popPercent <= 20) return 100;
    if (popPercent <= 50) return 80;
    if (popPercent <= 80) return 60;
    return 40;
  }

  /**
   * 風速スコア計算
   */
  private calculateWindScore(hobby: Hobby, forecast: DailyForecast): number {
    const windSpeed = forecast.windSpeed;

    // 屋外活動は風の影響を受けやすい
    if (hobby.isOutdoor) {
      if (windSpeed <= 2) return 100;
      if (windSpeed <= 5) return 80;
      if (windSpeed <= 8) return 60;
      if (windSpeed <= 12) return 30;
      return 10;
    }

    // 屋内活動は風の影響が少ない
    return windSpeed <= 15 ? 100 : 80;
  }

  /**
   * UVスコア計算
   */
  private calculateUVScore(hobby: Hobby, forecast: DailyForecast): number {
    const uvIndex = forecast.uvIndex;

    if (!hobby.isOutdoor) return 100; // 屋内は UV の影響なし

    // 屋外活動のUV評価
    if (uvIndex <= 2) return 100; // 弱い
    if (uvIndex <= 5) return 90;  // 中程度
    if (uvIndex <= 7) return 70;  // 強い
    if (uvIndex <= 10) return 50; // 非常に強い
    return 30; // 極端
  }

  /**
   * マッチング要因と警告要因を分析
   */
  private analyzeFactors(hobby: Hobby, forecast: DailyForecast): {
    matchingFactors: string[];
    warningFactors: string[];
  } {
    const matchingFactors: string[] = [];
    const warningFactors: string[] = [];

    // 天気チェック
    const matchingWeather = hobby.preferredWeather?.find(w => w.condition === forecast.weatherType);
    if (matchingWeather) {
      matchingFactors.push(`好適な天気: ${weatherService.getWeatherIcon(forecast.weatherType)} ${forecast.weatherDescription} (重み: ${matchingWeather.weight})`);
    }

    // 気温チェック
    const targetTemp = this.getTargetTemperature(hobby, forecast);
    const minTemp = hobby.minTemperature ?? 10;
    const maxTemp = hobby.maxTemperature ?? 30;

    if (targetTemp >= minTemp && targetTemp <= maxTemp) {
      matchingFactors.push(`適温: ${targetTemp.toFixed(1)}°C`);
    } else if (targetTemp < minTemp) {
      warningFactors.push(`低温注意: ${targetTemp.toFixed(1)}°C (推奨: ${minTemp}°C以上)`);
    } else {
      warningFactors.push(`高温注意: ${targetTemp.toFixed(1)}°C (推奨: ${maxTemp}°C以下)`);
    }

    // 降水確率チェック
    const popPercent = forecast.pop * 100;
    if (hobby.isOutdoor && popPercent > 30) {
      warningFactors.push(`降水確率: ${popPercent.toFixed(0)}%`);
    } else if (popPercent <= 10) {
      matchingFactors.push(`晴天: 降水確率 ${popPercent.toFixed(0)}%`);
    }

    // 風速チェック
    if (hobby.isOutdoor && forecast.windSpeed > 8) {
      warningFactors.push(`強風注意: ${forecast.windSpeed.toFixed(1)} m/s`);
    } else if (forecast.windSpeed <= 3) {
      matchingFactors.push(`穏やかな風: ${forecast.windSpeed.toFixed(1)} m/s`);
    }

    // UV指数チェック
    if (hobby.isOutdoor && forecast.uvIndex > 7) {
      warningFactors.push(`強いUV: 指数 ${forecast.uvIndex.toFixed(1)}`);
    }

    return { matchingFactors, warningFactors };
  }

  /**
   * 全体スコア計算
   */
  private calculateOverallScore(recommendedDays: RecommendedDay[]): number {
    if (recommendedDays.length === 0) return 0;

    // 上位3日の平均スコア
    const topDays = recommendedDays.slice(0, 3);
    return topDays.reduce((sum, day) => sum + day.score, 0) / topDays.length;
  }

  /**
   * 最適日のインデックスを取得
   */
  private findBestDayIndex(recommendedDays: RecommendedDay[]): number {
    if (recommendedDays.length === 0) return -1;
    
    let bestIndex = 0;
    let bestScore = recommendedDays[0]?.score || 0;

    for (let i = 1; i < recommendedDays.length; i++) {
      const currentScore = recommendedDays[i]?.score || 0;
      if (currentScore > bestScore) {
        bestScore = currentScore;
        bestIndex = i;
      }
    }

    return bestIndex;
  }

  /**
   * フィルター適用チェック
   */
  private passesFilters(forecast: DailyForecast, filters?: RecommendationFilters): boolean {
    if (!filters) return true;

    // 日付範囲フィルター
    if (filters.dateRange) {
      const forecastDate = forecast.date;
      if (forecastDate < filters.dateRange.start || forecastDate > filters.dateRange.end) {
        return false;
      }
    }

    // 天気タイプフィルター
    if (filters.weatherTypes && !filters.weatherTypes.includes(forecast.weatherType)) {
      return false;
    }

    // 曜日フィルター
    const dayOfWeek = forecast.date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (filters.excludeWeekends && isWeekend) return false;
    if (filters.excludeWeekdays && !isWeekend) return false;

    return true;
  }

  /**
   * 活動時間帯に基づいた気温を取得
   */
  private getTargetTemperature(hobby: Hobby, forecast: DailyForecast): number {
    // 活動時間帯が指定されていない場合は平均気温を使用
    if (!hobby.preferredTimeOfDay || hobby.preferredTimeOfDay.length === 0) {
      return (forecast.temperature.max + forecast.temperature.min) / 2;
    }

    // 複数の時間帯が指定されている場合は最も温度が適している時間帯を選択
    const timeTemps = hobby.preferredTimeOfDay.map(timeOfDay => {
      switch (timeOfDay) {
        case 'morning':
          return forecast.temperature.morning;
        case 'day':
          return forecast.temperature.day;
        case 'evening':
          return forecast.temperature.evening;
        case 'night':
          return forecast.temperature.night;
        default:
          return forecast.temperature.day;
      }
    });

    // 指定された時間帯の平均気温を使用
    return timeTemps.reduce((sum, temp) => sum + temp, 0) / timeTemps.length;
  }

  /**
   * トップおすすめを取得
   */
  async getTopRecommendations(
    hobbies: Hobby[],
    forecast: WeatherForecast,
    limit: number = 5
  ): Promise<HobbyRecommendation[]> {
    const recommendations = await this.generateRecommendations(hobbies, forecast);
    return recommendations.slice(0, limit);
  }

  /**
   * 特定の日のおすすめを取得
   */
  async getRecommendationsForDate(
    hobbies: Hobby[],
    forecast: WeatherForecast,
    targetDate: Date
  ): Promise<HobbyRecommendation[]> {
    const dateStr = targetDate.toDateString();
    const recommendations = await this.generateRecommendations(hobbies, forecast);

    return recommendations.map(rec => ({
      ...rec,
      recommendedDays: rec.recommendedDays.filter(day => 
        day.date.toDateString() === dateStr
      )
    })).filter(rec => rec.recommendedDays.length > 0);
  }
}

export const recommendationService = new RecommendationService();