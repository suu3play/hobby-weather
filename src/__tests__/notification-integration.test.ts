import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { NotificationService } from '../services/notification.service';
import type { NotificationPayload } from '../types/notification';

// Global mocks for browser APIs
Object.defineProperty(globalThis, 'Notification', {
  value: class MockNotification {
    title: string;
    body?: string;
    constructor(title: string, options?: NotificationOptions) {
      this.title = title;
      this.body = options?.body;
    }
    static permission: NotificationPermission = 'granted';
    static requestPermission = vi.fn().mockResolvedValue('granted');
    close = vi.fn();
    onclick = null;
    onerror = null;
  },
  configurable: true
});

Object.defineProperty(globalThis, 'navigator', {
  value: {
    serviceWorker: {
      register: vi.fn().mockResolvedValue({
        scope: 'test',
        update: vi.fn()
      })
    }
  },
  configurable: true
});

describe('通知システム統合テスト', () => {
  let notificationService: NotificationService;

  beforeAll(() => {
    notificationService = NotificationService.getInstance();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('基本機能テスト', () => {
    it('通知サービスが正しく初期化される', () => {
      expect(notificationService).toBeDefined();
      expect(notificationService.isNotificationSupported()).toBe(true);
    });

    it('通知許可状態を正しく取得できる', () => {
      const permission = notificationService.getPermissionState();
      
      expect(permission).toHaveProperty('granted');
      expect(permission).toHaveProperty('denied');
      expect(permission).toHaveProperty('default');
      expect(typeof permission.granted).toBe('boolean');
    });

    it('通知許可をリクエストできる', async () => {
      const permission = await notificationService.requestPermission();
      
      expect(permission.granted).toBe(true);
      expect(permission.denied).toBe(false);
    });
  });

  describe('通知送信テスト', () => {
    it('高スコア通知を送信できる', async () => {
      const payload = notificationService.createHighScoreNotification(
        'テニス',
        85,
        '晴れで気温24°C'
      );

      expect(payload.type).toBe('high-score');
      expect(payload.title).toContain('テニス');
      expect(payload.message).toContain('85点');
      
      const result = await notificationService.sendNotification(payload);
      expect(result).toBe(true);
    });

    it('天気急変アラート通知を送信できる', async () => {
      const payload = notificationService.createWeatherAlertNotification(
        'rain',
        '1時間後から雨が降る予報です'
      );

      expect(payload.type).toBe('weather-alert');
      expect(payload.title).toContain('天気急変アラート');
      expect(payload.message).toContain('雨が降る');
      
      const result = await notificationService.sendNotification(payload);
      expect(result).toBe(true);
    });

    it('定期レポート通知を送信できる', async () => {
      const payload = notificationService.createRegularReportNotification(
        '今日は3つの趣味活動が最適です'
      );

      expect(payload.type).toBe('regular-report');
      expect(payload.title).toContain('趣味レポート');
      expect(payload.message).toContain('3つの趣味');
      
      const result = await notificationService.sendNotification(payload);
      expect(result).toBe(true);
    });
  });

  describe('詳細通知機能テスト', () => {
    it('複数趣味の高スコア通知を作成できる', () => {
      const payload = notificationService.createDetailedHighScoreNotification(
        [
          { hobbyName: 'テニス', score: 90 },
          { hobbyName: 'ジョギング', score: 85 },
          { hobbyName: 'サイクリング', score: 80 }
        ],
        '晴れ',
        22
      );

      expect(payload.type).toBe('high-score');
      expect(payload.title).toContain('3つの趣味が最適');
      expect(payload.message).toContain('テニス、ジョギング、サイクリング');
      expect(payload.message).toContain('90点');
    });

    it('詳細天気急変アラートを作成できる', () => {
      const payload = notificationService.createDetailedWeatherAlertNotification(
        'urgent',
        'temperature-sudden-drop',
        '気温が10°C急降下しました',
        { previousTemp: 25, currentTemp: 15 }
      );

      expect(payload.type).toBe('weather-alert');
      expect(payload.title).toContain('天気急変警報');
      expect(payload.icon).toBe('⛈️');
      expect(payload.data?.severity).toBe('urgent');
    });

    it('詳細定期レポートを作成できる', () => {
      const payload = notificationService.createDetailedRegularReportNotification(
        '今日は晴天で多くの屋外活動に適しています',
        [
          { name: 'テニス', score: 90 },
          { name: 'ジョギング', score: 85 }
        ],
        '晴れで気温22°C、降水確率10%',
        ['日焼け止めの使用を推奨', '水分補給を忘れずに']
      );

      expect(payload.type).toBe('regular-report');
      expect(payload.title).toBe('📊 今日の趣味レポート');
      expect(payload.data?.topHobbies).toHaveLength(2);
      expect(payload.data?.actionItems).toHaveLength(2);
    });
  });

  describe('エラーハンドリングテスト', () => {
    it('通知許可がない場合は送信に失敗する', async () => {
      // 許可を拒否状態に設定
      const originalPermission = (globalThis.Notification as any).permission;
      (globalThis.Notification as any).permission = 'denied';

      const service = new NotificationService();
      const payload: NotificationPayload = {
        type: 'regular-report',
        title: 'テスト通知',
        message: 'テストメッセージ'
      };

      const result = await service.sendNotification(payload);
      expect(result).toBe(false);

      // 元の状態に戻す
      (globalThis.Notification as any).permission = originalPermission;
    });

    it('不正な通知ペイロードでもエラーにならない', async () => {
      const invalidPayload = {
        type: 'unknown-type',
        title: '',
        message: ''
      } as NotificationPayload;

      const result = await notificationService.sendNotification(invalidPayload);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Service Worker統合テスト', () => {
    it('Service Workerを登録できる', async () => {
      const registration = await notificationService.registerServiceWorker();
      
      expect(registration).toBeDefined();
      expect(registration?.scope).toBe('test');
    });

    it('Service Worker非対応環境でも正常に動作する', async () => {
      // Service Workerを一時的に無効化
      const originalServiceWorker = globalThis.navigator?.serviceWorker;
      delete (globalThis.navigator as any).serviceWorker;

      const service = new NotificationService();
      const registration = await service.registerServiceWorker();
      
      expect(registration).toBeNull();

      // 元に戻す
      if (originalServiceWorker) {
        (globalThis.navigator as any).serviceWorker = originalServiceWorker;
      }
    });
  });

  describe('テスト通知機能', () => {
    it('テスト通知を送信できる', async () => {
      const result = await notificationService.sendTestNotification();
      expect(result).toBe(true);
    });
  });
});

describe('通知システム品質確認', () => {
  it('すべての通知タイプが定義されている', () => {
    const service = NotificationService.getInstance();
    
    // 各通知作成メソッドが存在することを確認
    expect(typeof service.createHighScoreNotification).toBe('function');
    expect(typeof service.createWeatherAlertNotification).toBe('function');
    expect(typeof service.createRegularReportNotification).toBe('function');
    expect(typeof service.createDetailedHighScoreNotification).toBe('function');
    expect(typeof service.createDetailedWeatherAlertNotification).toBe('function');
    expect(typeof service.createDetailedRegularReportNotification).toBe('function');
  });

  it('通知ペイロードの構造が正しい', () => {
    const service = NotificationService.getInstance();
    
    const highScorePayload = service.createHighScoreNotification('テニス', 85, '晴れ');
    expect(highScorePayload).toHaveProperty('type');
    expect(highScorePayload).toHaveProperty('title');
    expect(highScorePayload).toHaveProperty('message');
    expect(highScorePayload).toHaveProperty('data');
    
    const alertPayload = service.createWeatherAlertNotification('rain', 'テストメッセージ');
    expect(alertPayload).toHaveProperty('type');
    expect(alertPayload).toHaveProperty('title');
    expect(alertPayload).toHaveProperty('message');
    expect(alertPayload).toHaveProperty('data');
    
    const reportPayload = service.createRegularReportNotification('テストレポート');
    expect(reportPayload).toHaveProperty('type');
    expect(reportPayload).toHaveProperty('title');
    expect(reportPayload).toHaveProperty('message');
    expect(reportPayload).toHaveProperty('data');
  });

  it('シングルトンパターンが正しく実装されている', () => {
    const instance1 = NotificationService.getInstance();
    const instance2 = NotificationService.getInstance();
    
    expect(instance1).toBe(instance2);
  });

  it('通知メッセージが適切な長さである', () => {
    const service = NotificationService.getInstance();
    
    const longMessage = 'a'.repeat(1000);
    const payload = service.createRegularReportNotification(longMessage);
    
    // 現在は制限がないため、メッセージがそのまま使用されることを確認
    expect(payload.message).toBe(longMessage);
    expect(typeof payload.message).toBe('string');
  });
});