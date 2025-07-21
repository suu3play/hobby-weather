import { db } from '../data/database';
import type { 
  NotificationConfig, 
  NotificationHistory, 
  NotificationSettings,
  NotificationType,
  TimeRange
} from '../types/notification';

export class NotificationConfigService {
  private db = db;

  // 通知設定の CRUD 操作
  async createNotificationConfig(config: Omit<NotificationConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    return await this.db.notificationConfigs.add({
      ...config,
      createdAt: new Date(),
      updatedAt: new Date()
    } as NotificationConfig);
  }

  async getNotificationConfig(id: number): Promise<NotificationConfig | undefined> {
    return await this.db.notificationConfigs.get(id);
  }

  async getAllNotificationConfigs(): Promise<NotificationConfig[]> {
    return await this.db.notificationConfigs.orderBy('createdAt').toArray();
  }

  async getNotificationConfigsByType(type: NotificationType): Promise<NotificationConfig[]> {
    return await this.db.notificationConfigs.where('type').equals(type).toArray();
  }

  async getEnabledNotificationConfigs(): Promise<NotificationConfig[]> {
    return await this.db.notificationConfigs.where('enabled').equals(1).toArray();
  }

  async updateNotificationConfig(id: number, changes: Partial<NotificationConfig>): Promise<number> {
    return await this.db.notificationConfigs.update(id, {
      ...changes,
      updatedAt: new Date()
    });
  }

  async deleteNotificationConfig(id: number): Promise<void> {
    await this.db.notificationConfigs.delete(id);
    // 関連する履歴も削除
    await this.db.notificationHistory.where('configId').equals(id).delete();
  }

  async toggleNotificationConfig(id: number): Promise<boolean> {
    const config = await this.getNotificationConfig(id);
    if (!config) return false;
    
    const newEnabled = !config.enabled;
    await this.updateNotificationConfig(id, { enabled: newEnabled });
    return newEnabled;
  }

  // 通知履歴の管理
  async addNotificationHistory(history: Omit<NotificationHistory, 'id'>): Promise<number> {
    return await this.db.notificationHistory.add(history as NotificationHistory);
  }

  async getNotificationHistorySimple(limit?: number): Promise<NotificationHistory[]> {
    const query = this.db.notificationHistory.orderBy('sentAt').reverse();
    return limit ? await query.limit(limit).toArray() : await query.toArray();
  }

  async getNotificationHistoryByType(type: NotificationType, limit?: number): Promise<NotificationHistory[]> {
    const query = this.db.notificationHistory.where('type').equals(type).reverse();
    return limit ? await query.limit(limit).toArray() : await query.toArray();
  }

  async getNotificationHistoryByConfig(configId: number, limit?: number): Promise<NotificationHistory[]> {
    const query = this.db.notificationHistory.where('configId').equals(configId).reverse();
    return limit ? await query.limit(limit).toArray() : await query.toArray();
  }

  async markNotificationClicked(historyId: number): Promise<void> {
    await this.db.notificationHistory.update(historyId, { clicked: true });
  }

  async markNotificationDismissed(historyId: number): Promise<void> {
    await this.db.notificationHistory.update(historyId, { dismissed: true });
  }

  // 通知設定の管理
  async getNotificationSettings(): Promise<NotificationSettings | undefined> {
    return await this.db.notificationSettings.toCollection().first();
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
    const existing = await this.getNotificationSettings();
    if (existing?.id) {
      await this.db.notificationSettings.update(existing.id, {
        ...settings,
        updatedAt: new Date()
      });
    } else {
      await this.db.notificationSettings.add({
        ...settings,
        updatedAt: new Date()
      } as NotificationSettings);
    }
  }

  // デフォルトの通知設定を作成するヘルパーメソッド
  async createDefaultConfigs(): Promise<void> {
    const existingConfigs = await this.getAllNotificationConfigs();
    if (existingConfigs.length > 0) return;

    // 高スコア通知の設定
    await this.createNotificationConfig({
      type: 'high-score',
      enabled: true,
      title: '高スコア通知',
      priority: 'medium',
      schedule: {
        timeOfDay: [{ start: '09:00', end: '18:00' }],
        daysOfWeek: [1, 2, 3, 4, 5], // 平日のみ
        frequency: 'custom',
        customInterval: 180 // 3時間間隔
      },
      conditions: {
        minScore: 80,
        scoreThreshold: 85
      }
    });

    // 天気急変アラートの設定
    await this.createNotificationConfig({
      type: 'weather-alert',
      enabled: true,
      title: '天気急変アラート',
      priority: 'high',
      schedule: {
        timeOfDay: [{ start: '06:00', end: '22:00' }],
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // 毎日
        frequency: 'immediate'
      },
      conditions: {
        precipitationThreshold: 70,
        temperatureChangeThreshold: 5,
        windSpeedThreshold: 10
      }
    });

    // 定期レポートの設定
    await this.createNotificationConfig({
      type: 'regular-report',
      enabled: true,
      title: '今日の趣味レポート',
      priority: 'low',
      schedule: {
        timeOfDay: [{ start: '08:00', end: '08:30' }],
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7], // 毎日
        frequency: 'daily'
      },
      conditions: {
        includePastDays: 1,
        includeUpcomingDays: 3
      }
    });
  }

  // 通知可能な時間帯かチェック
  async isNotificationTimeAllowed(config: NotificationConfig, now: Date = new Date()): Promise<boolean> {
    const settings = await this.getNotificationSettings();
    
    // グローバル通知が無効の場合
    if (!settings?.globalEnabled) return false;

    // 静寂時間のチェック
    if (settings.quietHours) {
      if (this.isInQuietHours(now, settings.quietHours)) return false;
    }

    // 設定が無効の場合
    if (!config.enabled) return false;

    // 曜日チェック
    const dayOfWeek = now.getDay();
    if (!config.schedule.daysOfWeek.includes(dayOfWeek)) return false;

    // 時間帯チェック
    const currentTime = this.formatTime(now);
    const isInTimeRange = config.schedule.timeOfDay.some(range => 
      this.isTimeInRange(currentTime, range)
    );
    
    return isInTimeRange;
  }

  // 1日の最大通知数チェック
  async hasReachedDailyLimit(type?: NotificationType): Promise<boolean> {
    const settings = await this.getNotificationSettings();
    const maxDaily = settings?.maxDailyNotifications || 10;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let query = this.db.notificationHistory
      .where('sentAt')
      .between(today, tomorrow, false, true);

    if (type) {
      const todayHistory = await query.toArray();
      const typeHistory = todayHistory.filter(h => h.type === type);
      return typeHistory.length >= maxDaily;
    }

    const todayCount = await query.count();
    return todayCount >= maxDaily;
  }

  // ユーティリティメソッド
  private isInQuietHours(time: Date, quietHours: TimeRange): boolean {
    const currentTime = this.formatTime(time);
    return this.isTimeInRange(currentTime, quietHours);
  }

  private isTimeInRange(time: string, range: TimeRange): boolean {
    // 時間範囲が日をまたぐ場合の処理も含む
    if (range.start <= range.end) {
      return time >= range.start && time <= range.end;
    } else {
      // 日をまたぐ場合（例: 22:00-06:00）
      return time >= range.start || time <= range.end;
    }
  }

  private formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5); // "HH:MM" format
  }

  // 統計情報の取得
  async getNotificationStats(days: number = 7): Promise<{
    totalSent: number;
    byType: Record<NotificationType, number>;
    clickRate: number;
    dismissRate: number;
  }> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const history = await this.db.notificationHistory
      .where('sentAt')
      .above(fromDate)
      .toArray();

    const totalSent = history.length;
    const clicked = history.filter(h => h.clicked).length;
    const dismissed = history.filter(h => h.dismissed).length;

    const byType = history.reduce((acc, h) => {
      acc[h.type] = (acc[h.type] || 0) + 1;
      return acc;
    }, {} as Record<NotificationType, number>);

    return {
      totalSent,
      byType,
      clickRate: totalSent > 0 ? clicked / totalSent : 0,
      dismissRate: totalSent > 0 ? dismissed / totalSent : 0
    };
  }

  // 通知履歴の取得（フィルタ対応）
  async getNotificationHistory(filter?: {
    type?: NotificationType;
    since?: Date;
    limit?: number;
  }): Promise<NotificationHistory[]> {
    const db = DatabaseService.getInstance().getDatabase();
    let query = db.notificationHistory.orderBy('sentAt').reverse();

    if (filter?.since) {
      query = query.where('sentAt').above(filter.since);
    }

    if (filter?.type) {
      query = query.where('type').equals(filter.type);
    }

    let results = await query.toArray();

    if (filter?.limit) {
      results = results.slice(0, filter.limit);
    }

    return results;
  }
}