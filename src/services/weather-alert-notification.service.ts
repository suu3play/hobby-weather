import { WeatherService } from './weather.service';
import { NotificationConfigService } from './notification-config.service';
import type { 
  WeatherForecast,
  NotificationPayload 
} from '../types';

export interface WeatherAlertCondition {
  type: 'precipitation' | 'temperature' | 'wind' | 'uv' | 'visibility';
  threshold: number;
  comparison: 'above' | 'below' | 'change';
  changeThreshold?: number; // 急変アラート用（1時間の変化量）
}

export interface WeatherAlertConfig {
  conditions: WeatherAlertCondition[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  cooldownMinutes: number; // 同種アラートの再通知間隔
}

export interface WeatherAlertResult {
  alertTriggered: boolean;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
  details: {
    currentValue: number;
    threshold: number;
    condition: WeatherAlertCondition;
  }[];
  reason?: string;
}

export class WeatherAlertNotificationService {
  private static instance: WeatherAlertNotificationService;
  private weatherService = new WeatherService();
  private configService = new NotificationConfigService();
  private lastWeatherData: WeatherForecast | null = null;
  private checkIntervalMs = 15 * 60 * 1000; // 15分間隔でチェック

  // デフォルトアラート設定
  private defaultAlertConfigs: Map<string, WeatherAlertConfig> = new Map([
    ['rain-warning', {
      conditions: [
        { type: 'precipitation', threshold: 50, comparison: 'above' }
      ],
      priority: 'medium',
      cooldownMinutes: 60
    }],
    ['temperature-drop', {
      conditions: [
        { type: 'temperature', threshold: -5, comparison: 'change', changeThreshold: 60 }
      ],
      priority: 'high',
      cooldownMinutes: 120
    }],
    ['high-wind', {
      conditions: [
        { type: 'wind', threshold: 15, comparison: 'above' }
      ],
      priority: 'medium',
      cooldownMinutes: 180
    }],
    ['poor-visibility', {
      conditions: [
        { type: 'visibility', threshold: 2, comparison: 'below' }
      ],
      priority: 'high',
      cooldownMinutes: 120
    }],
    ['extreme-uv', {
      conditions: [
        { type: 'uv', threshold: 8, comparison: 'above' }
      ],
      priority: 'medium',
      cooldownMinutes: 240
    }]
  ]);

  static getInstance(): WeatherAlertNotificationService {
    if (!WeatherAlertNotificationService.instance) {
      WeatherAlertNotificationService.instance = new WeatherAlertNotificationService();
    }
    return WeatherAlertNotificationService.instance;
  }

  // 天気急変アラートの評価
  async evaluateWeatherAlerts(): Promise<WeatherAlertResult[]> {
    try {
      const defaultLocation = { lat: 35.6762, lon: 139.6503 }; // Tokyo default
      const currentForecast = await this.weatherService.getWeatherForecast(defaultLocation.lat, defaultLocation.lon);
      if (!currentForecast) {
        return [{
          alertTriggered: false,
          alertType: 'system-error',
          severity: 'low',
          message: '天気データの取得に失敗しました',
          details: [],
          reason: '天気予報データが取得できませんでした'
        }];
      }

      const alerts: WeatherAlertResult[] = [];
      
      // 各アラート設定を評価
      for (const [alertType, config] of this.defaultAlertConfigs) {
        const alert = await this.evaluateAlertConfig(alertType, config, currentForecast);
        if (alert.alertTriggered) {
          alerts.push(alert);
        }
      }

      // 前回データとの比較による急変チェック
      if (this.lastWeatherData) {
        const changeAlerts = this.detectWeatherChanges(this.lastWeatherData, currentForecast);
        alerts.push(...changeAlerts);
      }

      // 現在のデータを保存
      this.lastWeatherData = currentForecast;

      return alerts;

    } catch (error) {
      console.error('天気急変アラートの評価中にエラー:', error);
      return [{
        alertTriggered: false,
        alertType: 'system-error',
        severity: 'low',
        message: '天気アラートの評価中にエラーが発生しました',
        details: [],
        reason: error instanceof Error ? error.message : '不明なエラー'
      }];
    }
  }

  // 特定のアラート設定を評価
  private async evaluateAlertConfig(
    alertType: string,
    config: WeatherAlertConfig,
    forecast: WeatherForecast
  ): Promise<WeatherAlertResult> {
    const details: WeatherAlertResult['details'] = [];
    let triggeredConditions = 0;

    // クールダウンチェック
    if (await this.isInCooldown(alertType, config.cooldownMinutes)) {
      return {
        alertTriggered: false,
        alertType,
        severity: config.priority,
        message: 'クールダウン期間中',
        details: [],
        reason: 'クールダウン期間中のためアラートをスキップ'
      };
    }

    // 各条件をチェック
    for (const condition of config.conditions) {
      const result = this.checkCondition(condition, forecast);
      details.push(result);
      
      if (this.isConditionMet(result)) {
        triggeredConditions++;
      }
    }

    // すべての条件が満たされた場合にアラートを発動
    const alertTriggered = triggeredConditions === config.conditions.length;
    
    return {
      alertTriggered,
      alertType,
      severity: config.priority,
      message: alertTriggered ? this.generateAlertMessage(alertType, details) : 'アラート条件未達',
      details
    };
  }

  // 単一条件のチェック
  private checkCondition(
    condition: WeatherAlertCondition,
    forecast: WeatherForecast
  ): WeatherAlertResult['details'][0] {
    let currentValue: number;

    switch (condition.type) {
      case 'precipitation':
        currentValue = forecast.forecasts[0]?.pop ?? 0;
        break;
      case 'temperature':
        currentValue = forecast.forecasts[0]?.temperature.day ?? 0;
        break;
      case 'wind':
        currentValue = forecast.forecasts[0]?.windSpeed ?? 0;
        break;
      case 'uv':
        currentValue = forecast.forecasts[0]?.uvIndex ?? 0;
        break;
      case 'visibility':
        currentValue = 10000; // visibility not available in forecast data
        break;
      default:
        currentValue = 0;
    }

    return {
      currentValue,
      threshold: condition.threshold,
      condition
    };
  }

  // 条件が満たされているかチェック
  private isConditionMet(detail: WeatherAlertResult['details'][0]): boolean {
    const { currentValue, threshold, condition } = detail;

    switch (condition.comparison) {
      case 'above':
        return currentValue > threshold;
      case 'below':
        return currentValue < threshold;
      case 'change':
        // 急変は別途detectWeatherChangesで処理
        return false;
      default:
        return false;
    }
  }

  // 天気の急変を検出
  private detectWeatherChanges(
    previousForecast: WeatherForecast,
    currentForecast: WeatherForecast
  ): WeatherAlertResult[] {
    const alerts: WeatherAlertResult[] = [];
    const timeDiff = (currentForecast.generatedAt.getTime() - 
                     previousForecast.generatedAt.getTime()) / (1000 * 60); // 分

    // 1時間以内の変化のみを急変として扱う
    if (timeDiff > 60) return alerts;

    // 気温の急変チェック
    const tempChange = (currentForecast.forecasts[0]?.temperature.day ?? 0) - (previousForecast.forecasts[0]?.temperature.day ?? 0);
    if (Math.abs(tempChange) >= 5) {
      alerts.push({
        alertTriggered: true,
        alertType: tempChange > 0 ? 'temperature-sudden-rise' : 'temperature-sudden-drop',
        severity: Math.abs(tempChange) >= 10 ? 'urgent' : 'high',
        message: `気温が${Math.abs(tempChange)}°C${tempChange > 0 ? '上昇' : '下降'}しました`,
        details: [{
          currentValue: currentForecast.forecasts[0]?.temperature.day ?? 0,
          threshold: previousForecast.forecasts[0]?.temperature.day ?? 0,
          condition: { type: 'temperature', threshold: 5, comparison: 'change' }
        }]
      });
    }

    // 降水確率の急変チェック
    const precipChange = (currentForecast.forecasts[0]?.pop ?? 0) - 
                        (previousForecast.forecasts[0]?.pop ?? 0);
    if (precipChange >= 30) {
      alerts.push({
        alertTriggered: true,
        alertType: 'precipitation-sudden-increase',
        severity: precipChange >= 50 ? 'urgent' : 'high',
        message: `降水確率が${precipChange}%上昇しました`,
        details: [{
          currentValue: currentForecast.forecasts[0]?.pop ?? 0,
          threshold: previousForecast.forecasts[0]?.pop ?? 0,
          condition: { type: 'precipitation', threshold: 30, comparison: 'change' }
        }]
      });
    }

    // 風速の急変チェック
    const windChange = (currentForecast.forecasts[0]?.windSpeed ?? 0) - (previousForecast.forecasts[0]?.windSpeed ?? 0);
    if (windChange >= 10) {
      alerts.push({
        alertTriggered: true,
        alertType: 'wind-sudden-increase',
        severity: windChange >= 15 ? 'urgent' : 'high',
        message: `風速が${windChange}m/s増加しました`,
        details: [{
          currentValue: currentForecast.forecasts[0]?.windSpeed ?? 0,
          threshold: previousForecast.forecasts[0]?.windSpeed ?? 0,
          condition: { type: 'wind', threshold: 10, comparison: 'change' }
        }]
      });
    }

    return alerts;
  }

  // アラートメッセージの生成
  private generateAlertMessage(alertType: string, details: WeatherAlertResult['details']): string {
    const primaryDetail = details[0];
    if (!primaryDetail) return `天気急変アラート: ${alertType}`;
    const value = Math.round(primaryDetail.currentValue * 10) / 10;

    switch (alertType) {
      case 'rain-warning':
        return `雨が降る可能性が高くなりました（降水確率${value}%）`;
      case 'temperature-drop':
        return `気温が大幅に下がる予報です（${value}°C）`;
      case 'high-wind':
        return `強い風の予報です（風速${value}m/s）`;
      case 'poor-visibility':
        return `視界が悪くなる予報です（視界${value}km）`;
      case 'extreme-uv':
        return `UV指数が非常に高くなっています（UV指数${value}）`;
      default:
        return `天気急変アラート: ${alertType}`;
    }
  }

  // クールダウン期間のチェック
  private async isInCooldown(alertType: string, cooldownMinutes: number): Promise<boolean> {
    try {
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - cooldownMinutes);

      const recentAlerts = await this.configService.getNotificationHistory({
        type: 'weather-alert',
        since: cutoffTime
      });

      interface AlertData {
        alertType: string;
      }

      return recentAlerts.some(alert => 
        alert.data && (alert.data as AlertData).alertType === alertType
      );
    } catch (error) {
      console.error('クールダウンチェックエラー:', error);
      return false; // エラー時は通知を許可
    }
  }

  // 天気急変アラートの通知ペイロード作成
  createWeatherAlertNotificationPayload(alert: WeatherAlertResult): NotificationPayload {
    const severityIcons = {
      low: '🌤️',
      medium: '⚠️',
      high: '🌧️',
      urgent: '⛈️'
    };

    const severityTitles = {
      low: '天気情報',
      medium: '天気注意報',
      high: '天気警報',
      urgent: '天気急変警報'
    };

    return {
      type: 'weather-alert',
      title: `${severityIcons[alert.severity]} ${severityTitles[alert.severity]}`,
      message: alert.message,
      icon: severityIcons[alert.severity],
      data: {
        alertType: alert.alertType,
        severity: alert.severity,
        details: alert.details,
        timestamp: new Date().toISOString()
      }
    };
  }

  // 定期的な天気監視の開始
  startWeatherMonitoring(): void {
    setInterval(async () => {
      const alerts = await this.evaluateWeatherAlerts();
      
      for (const alert of alerts) {
        if (alert.alertTriggered) {
          console.log('天気急変アラート検出:', alert);
          // ここで実際の通知送信処理を呼び出す
          // this.notificationService.sendNotification(payload);
        }
      }
    }, this.checkIntervalMs);
  }

  // デバッグ用：強制的にアラートを評価
  async forceEvaluateWeatherAlerts(): Promise<WeatherAlertResult[]> {
    console.log('天気急変アラートを強制評価中...');
    const alerts = await this.evaluateWeatherAlerts();
    console.log('評価結果:', alerts);
    return alerts;
  }

  // 天気アラート統計の取得
  async getWeatherAlertStatistics(): Promise<{
    totalAlerts: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    lastAlertTime: Date | null;
  }> {
    try {
      const history = await this.configService.getNotificationHistory({
        type: 'weather-alert'
      });

      const byType: Record<string, number> = {};
      const bySeverity: Record<string, number> = {};

      history.forEach(alert => {
        if (alert.data?.alertType) {
          byType[alert.data.alertType] = (byType[alert.data.alertType] || 0) + 1;
        }
        if (alert.data?.severity) {
          bySeverity[alert.data.severity] = (bySeverity[alert.data.severity] || 0) + 1;
        }
      });

      return {
        totalAlerts: history.length,
        byType,
        bySeverity,
        lastAlertTime: history.length > 0 ? (history[0]?.sentAt ?? null) : null
      };

    } catch (error) {
      console.error('天気アラート統計の取得エラー:', error);
      return {
        totalAlerts: 0,
        byType: {},
        bySeverity: {},
        lastAlertTime: null
      };
    }
  }
}