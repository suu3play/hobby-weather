import type { 
  NotificationConfig, 
  NotificationPayload, 
  NotificationPermissionState
} from '../types/notification';

export class NotificationService {
  private static instance: NotificationService;
  private isSupported: boolean;
  private permission: NotificationPermissionState;

  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    this.permission = this.getPermissionState();
    this.initializePWANotifications();
  }

  // PWA通知の初期化
  private async initializePWANotifications(): Promise<void> {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        await navigator.serviceWorker.ready;
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Service Worker初期化エラー:', error);
        }
      }
    }
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // 通知許可関連
  getPermissionState(): NotificationPermissionState {
    if (!this.isSupported) {
      return { granted: false, denied: true, default: false };
    }

    const permission = Notification.permission;
    return {
      granted: permission === 'granted',
      denied: permission === 'denied',
      default: permission === 'default'
    };
  }

  async requestPermission(): Promise<NotificationPermissionState> {
    if (!this.isSupported) {
      return { granted: false, denied: true, default: false };
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = {
        granted: permission === 'granted',
        denied: permission === 'denied',
        default: permission === 'default',
        requestedAt: new Date()
      };
      return this.permission;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('通知許可の取得に失敗:', error);
      }
      return { granted: false, denied: true, default: false };
    }
  }

  // 通知送信
  async sendNotification(payload: NotificationPayload): Promise<boolean> {
    if (!this.permission.granted) {
      if (import.meta.env.DEV) {
        console.warn('通知権限が許可されていません');
      }
      return false;
    }

    try {
      const notification = new Notification(payload.title, {
        body: payload.message,
        icon: payload.icon || '/hobbyWeather.svg',
        badge: payload.badge || '/hobbyWeather.svg',
        data: payload.data,
        tag: `${payload.type}-${Date.now()}`,
        requireInteraction: payload.type === 'weather-alert'
      });

      // 通知イベントの処理
      notification.onclick = () => {
        window.focus();
        if (payload.data?.url) {
          window.location.href = payload.data.url;
        }
        notification.close();
      };

      notification.onerror = (error) => {
        if (import.meta.env.DEV) {
          console.error('通知送信エラー:', error);
        }
      };

      return true;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('通知送信に失敗:', error);
      }
      return false;
    }
  }

  // 通知作成ヘルパー
  createHighScoreNotification(hobbyName: string, score: number, weatherDescription: string): NotificationPayload {
    return {
      type: 'high-score',
      title: `🌟 ${hobbyName}の高スコア！`,
      message: `スコア${score}点！${weatherDescription}で活動に最適です。`,
      data: {
        score,
        hobbyName
      }
    };
  }

  // 高スコア通知の詳細版（複数推薦対応）
  createDetailedHighScoreNotification(
    recommendations: Array<{name: string; score: number}>,
    weatherDescription: string,
    temperature: number
  ): NotificationPayload {
    const topRecommendation = recommendations[0];
    
    if (recommendations.length === 1) {
      return {
        type: 'high-score',
        title: `🌟 ${topRecommendation?.name ?? '趣味活動'}が最適！`,
        message: `${weatherDescription}で気温${temperature}°C。スコア${Math.round(topRecommendation?.score ?? 0)}点の高評価です！`,
        data: {
          recommendations,
          weatherDescription,
          temperature
        }
      };
    }

    const hobbyNames = recommendations
      .slice(0, 3)
      .map(rec => rec.name)
      .join('、');

    return {
      type: 'high-score',
      title: `⭐ ${recommendations.length}つの趣味が最適です！`,
      message: `${weatherDescription}で気温${temperature}°C。${hobbyNames}などがおすすめです。最高スコア: ${Math.round(topRecommendation?.score ?? 0)}点`,
      data: {
        recommendations,
        weatherDescription,
        temperature
      }
    };
  }

  createWeatherAlertNotification(alertType: string, message: string): NotificationPayload {
    const icons = {
      rain: '🌧️',
      storm: '⛈️', 
      wind: '💨',
      temperature: '🌡️'
    };

    return {
      type: 'weather-alert',
      title: `${icons[alertType as keyof typeof icons] || '⚠️'} 天気急変アラート`,
      message,
      data: {
        alertType
      }
    };
  }

  // 詳細な天気急変アラート（新機能対応）
  createDetailedWeatherAlertNotification(
    severity: 'low' | 'medium' | 'high' | 'urgent',
    alertType: string,
    message: string,
    details?: Record<string, unknown>
  ): NotificationPayload {
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
      title: `${severityIcons[severity]} ${severityTitles[severity]}`,
      message,
      icon: severityIcons[severity],
      data: {
        alertType,
        severity,
        details,
        timestamp: new Date().toISOString()
      }
    };
  }

  createRegularReportNotification(summary: string): NotificationPayload {
    return {
      type: 'regular-report',
      title: '📊 今日の趣味レポート',
      message: summary,
      data: {}
    };
  }

  // 詳細な定期レポート通知（新機能対応）
  createDetailedRegularReportNotification(
    summary: string,
    topHobbies: Array<{name: string; score: number}>,
    weatherSummary: string,
    actionItems: string[]
  ): NotificationPayload {
    const shortSummary = summary.length > 80 
      ? summary.substring(0, 77) + '...'
      : summary;

    return {
      type: 'regular-report',
      title: '📊 今日の趣味レポート',
      message: shortSummary,
      icon: '📊',
      data: {
        summary,
        topHobbies: topHobbies.slice(0, 3),
        weatherSummary,
        actionItems,
        timestamp: new Date().toISOString()
      }
    };
  }

  // 通知スケジューリング
  scheduleNotification(config: NotificationConfig, payload: NotificationPayload): void {
    // サービスワーカーを使用したバックグラウンド通知の実装
    // 現在は即座に送信（後でスケジューリング機能を追加）
    if (config.enabled) {
      this.sendNotification(payload);
    }
  }

  // 通知のテスト送信
  async sendTestNotification(): Promise<boolean> {
    const testPayload: NotificationPayload = {
      type: 'regular-report',
      title: '🧪 テスト通知',
      message: '通知機能が正常に動作しています。'
    };

    return await this.sendNotification(testPayload);
  }

  // 通知サポート状況確認
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  // サービスワーカー登録（後で実装）
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    try {
      // サービスワーカーファイルは後で作成
      const registration = await navigator.serviceWorker.register('/sw.js');
      return registration;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Service Worker registration failed:', error);
      }
      return null;
    }
  }
}