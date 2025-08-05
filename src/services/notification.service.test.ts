import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from './notification.service';
import type { NotificationPayload } from '../types/notification';

// ブラウザAPIのモック
const mockNotification = vi.fn();
const mockServiceWorker = {
  register: vi.fn()
};

// グローバルオブジェクトのモック
Object.defineProperty(globalThis, 'Notification', {
  value: mockNotification,
  writable: true,
  configurable: true
});

Object.defineProperty(globalThis, 'window', {
  value: {
    Notification: mockNotification,
    focus: vi.fn(),
    location: { href: '' }
  },
  writable: true,
  configurable: true
});

Object.defineProperty(globalThis, 'navigator', {
  value: {
    serviceWorker: mockServiceWorker
  },
  writable: true,
  configurable: true
});

describe('NotificationService', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Notificationコンストラクタのモック
    mockNotification.mockImplementation((title: string, options: NotificationOptions) => ({
      title,
      ...options,
      onclick: null,
      onerror: null,
      close: vi.fn()
    }));
    
    // Notification.permissionのモック
    Object.defineProperty(mockNotification, 'permission', {
      value: 'default',
      writable: true,
      configurable: true
    });
    
    // Notification.requestPermissionのモック
    Object.defineProperty(mockNotification, 'requestPermission', {
      value: vi.fn().mockResolvedValue('granted'),
      writable: true,
      configurable: true
    });
    
    notificationService = NotificationService.getInstance();
  });

  describe('シングルトンパターン', () => {
    it('同じインスタンスを返す', () => {
      const instance1 = NotificationService.getInstance();
      const instance2 = NotificationService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('通知サポート確認', () => {
    it('通知がサポートされている場合', () => {
      expect(notificationService.isNotificationSupported()).toBe(true);
    });

    it('Notificationがない場合はサポートされていない', () => {
      delete (globalThis as Record<string, unknown>)['Notification'];
      delete (globalThis.window as Record<string, unknown>)['Notification'];
      const service = new NotificationService();
      
      expect(service.isNotificationSupported()).toBe(false);
      
      // 元に戻す
      (globalThis as Record<string, unknown>)['Notification'] = mockNotification;
      (globalThis.window as Record<string, unknown>)['Notification'] = mockNotification;
    });

    it('serviceWorkerがない場合はサポートされていない', () => {
      delete (globalThis.navigator as Record<string, unknown>)['serviceWorker'];
      const service = new NotificationService();
      
      expect(service.isNotificationSupported()).toBe(false);
      
      // 元に戻す
      (globalThis.navigator as Record<string, unknown>)['serviceWorker'] = mockServiceWorker;
    });
  });

  describe('getPermissionState', () => {
    it('granted状態を正しく返す', () => {
      Object.defineProperty(mockNotification, 'permission', {
        value: 'granted',
        writable: true,
        configurable: true
      });
      
      const permission = notificationService.getPermissionState();
      
      expect(permission).toEqual({
        granted: true,
        denied: false,
        default: false
      });
    });

    it('denied状態を正しく返す', () => {
      Object.defineProperty(mockNotification, 'permission', {
        value: 'denied',
        writable: true,
        configurable: true
      });
      
      const permission = notificationService.getPermissionState();
      
      expect(permission).toEqual({
        granted: false,
        denied: true,
        default: false
      });
    });

    it('default状態を正しく返す', () => {
      Object.defineProperty(mockNotification, 'permission', {
        value: 'default',
        writable: true,
        configurable: true
      });
      
      const permission = notificationService.getPermissionState();
      
      expect(permission).toEqual({
        granted: false,
        denied: false,
        default: true
      });
    });
  });

  describe('requestPermission', () => {
    it('許可要求が成功する', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('granted');
      Object.defineProperty(mockNotification, 'requestPermission', {
        value: mockRequestPermission,
        writable: true,
        configurable: true
      });
      
      const permission = await notificationService.requestPermission();
      
      expect(mockRequestPermission).toHaveBeenCalledOnce();
      expect(permission.granted).toBe(true);
      expect(permission.requestedAt).toBeDefined();
    });

    it('許可要求が拒否される', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue('denied');
      Object.defineProperty(mockNotification, 'requestPermission', {
        value: mockRequestPermission,
        writable: true,
        configurable: true
      });
      
      const permission = await notificationService.requestPermission();
      
      expect(permission.denied).toBe(true);
    });

    it('サポートされていない場合は失敗を返す', async () => {
      delete (globalThis as Record<string, unknown>)['Notification'];
      delete (globalThis.window as Record<string, unknown>)['Notification'];
      const service = new NotificationService();
      
      const permission = await service.requestPermission();
      
      expect(permission).toEqual({
        granted: false,
        denied: true,
        default: false
      });
      
      // 元に戻す
      (globalThis as Record<string, unknown>)['Notification'] = mockNotification;
      (globalThis.window as Record<string, unknown>)['Notification'] = mockNotification;
    });

    it('エラー時は適切に処理される', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockRequestPermission = vi.fn().mockRejectedValue(new Error('Request failed'));
      Object.defineProperty(mockNotification, 'requestPermission', {
        value: mockRequestPermission,
        writable: true,
        configurable: true
      });
      
      const permission = await notificationService.requestPermission();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('通知許可の取得に失敗:', expect.any(Error));
      expect(permission.denied).toBe(true);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('sendNotification', () => {
    beforeEach(() => {
      // 許可状態に設定
      Object.defineProperty(mockNotification, 'permission', {
        value: 'granted',
        writable: true,
        configurable: true
      });
      notificationService = new NotificationService();
    });

    it('通知が正常に送信される', async () => {
      const payload: NotificationPayload = {
        type: 'high-score',
        title: 'テスト通知',
        message: 'これはテストメッセージです',
        icon: '/test-icon.png'
      };
      
      const result = await notificationService.sendNotification(payload);
      
      expect(mockNotification).toHaveBeenCalledWith('テスト通知', {
        body: 'これはテストメッセージです',
        icon: '/test-icon.png',
        badge: '/hobbyWeather.svg',
        data: payload.data,
        tag: expect.stringMatching(/^high-score-\d+$/),
        requireInteraction: false
      });
      expect(result).toBe(true);
    });

    it('天気アラート通知は操作を要求する', async () => {
      const payload: NotificationPayload = {
        type: 'weather-alert',
        title: '天気アラート',
        message: '雨が降りそうです'
      };
      
      await notificationService.sendNotification(payload);
      
      expect(mockNotification).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          requireInteraction: true
        })
      );
    });

    it('許可されていない場合は送信失敗', async () => {
      Object.defineProperty(mockNotification, 'permission', {
        value: 'denied',
        writable: true,
        configurable: true
      });
      const service = new NotificationService();
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const payload: NotificationPayload = {
        type: 'high-score',
        title: 'テスト',
        message: 'テスト'
      };
      
      const result = await service.sendNotification(payload);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('通知権限が許可されていません');
      expect(result).toBe(false);
      
      consoleWarnSpy.mockRestore();
    });

    it('送信エラー時は適切に処理される', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockNotification.mockImplementation(() => {
        throw new Error('Notification failed');
      });
      
      const payload: NotificationPayload = {
        type: 'high-score',
        title: 'テスト',
        message: 'テスト'
      };
      
      const result = await notificationService.sendNotification(payload);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('通知送信に失敗:', expect.any(Error));
      expect(result).toBe(false);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('通知作成ヘルパー', () => {
    describe('createHighScoreNotification', () => {
      it('高スコア通知を正しく作成する', () => {
        const notification = notificationService.createHighScoreNotification(
          'ランニング',
          85,
          '晴れで気温20°C'
        );
        
        expect(notification).toEqual({
          type: 'high-score',
          title: '🌟 ランニングの高スコア！',
          message: 'スコア85点！晴れで気温20°Cで活動に最適です。',
          data: {
            score: 85,
            hobbyName: 'ランニング'
          }
        });
      });
    });

    describe('createWeatherAlertNotification', () => {
      it('雨の天気アラートを正しく作成する', () => {
        const notification = notificationService.createWeatherAlertNotification(
          'rain',
          '1時間後から雨が降る予報です'
        );
        
        expect(notification).toEqual({
          type: 'weather-alert',
          title: '🌧️ 天気急変アラート',
          message: '1時間後から雨が降る予報です',
          data: {
            alertType: 'rain'
          }
        });
      });

      it('不明なアラートタイプは警告アイコンを使用する', () => {
        const notification = notificationService.createWeatherAlertNotification(
          'unknown',
          'テストメッセージ'
        );
        
        expect(notification.title).toBe('⚠️ 天気急変アラート');
      });
    });

    describe('createRegularReportNotification', () => {
      it('定期レポート通知を正しく作成する', () => {
        const notification = notificationService.createRegularReportNotification(
          '今日は3つの趣味活動が最適です'
        );
        
        expect(notification).toEqual({
          type: 'regular-report',
          title: '📊 今日の趣味レポート',
          message: '今日は3つの趣味活動が最適です',
          data: {}
        });
      });
    });
  });

  describe('sendTestNotification', () => {
    beforeEach(() => {
      Object.defineProperty(mockNotification, 'permission', {
        value: 'granted',
        writable: true,
        configurable: true
      });
      notificationService = new NotificationService();
    });

    it('テスト通知が正常に送信される', async () => {
      const result = await notificationService.sendTestNotification();
      
      expect(mockNotification).toHaveBeenCalledWith('🧪 テスト通知', expect.objectContaining({
        body: '通知機能が正常に動作しています。',
        icon: '/hobbyWeather.svg',
        badge: '/hobbyWeather.svg',
        requireInteraction: false
      }));
      expect(result).toBe(true);
    });
  });

  describe('Service Worker登録', () => {
    it('Service Workerが正常に登録される', async () => {
      const mockRegistration = { scope: '/test' };
      mockServiceWorker.register.mockResolvedValue(mockRegistration);
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const registration = await notificationService.registerServiceWorker();
      
      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js');
      expect(consoleLogSpy).toHaveBeenCalledWith('Service Worker registered:', mockRegistration);
      expect(registration).toBe(mockRegistration);
      
      consoleLogSpy.mockRestore();
    });

    it('Service Workerがサポートされていない場合', async () => {
      delete (globalThis.navigator as Record<string, unknown>)['serviceWorker'];
      
      const registration = await notificationService.registerServiceWorker();
      
      expect(registration).toBe(null);
      
      // 元に戻す
      (globalThis.navigator as Record<string, unknown>)['serviceWorker'] = mockServiceWorker;
    });

    it('Service Worker登録が失敗する', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockServiceWorker.register.mockRejectedValue(new Error('Registration failed'));
      
      const registration = await notificationService.registerServiceWorker();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Service Worker registration failed:', expect.any(Error));
      expect(registration).toBe(null);
      
      consoleErrorSpy.mockRestore();
    });
  });
});