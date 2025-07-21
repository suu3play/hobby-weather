import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, type MockedFunction } from 'vitest';
import { useNotification } from './useNotification';
import { NotificationService } from '../services/notification.service';
import type { NotificationPermissionState, NotificationPayload } from '../types/notification';

// NotificationServiceのモック
vi.mock('../services/notification.service');

const MockedNotificationService = NotificationService as unknown as {
  getInstance: MockedFunction<() => {
    getPermissionState: MockedFunction<() => NotificationPermissionState>;
    requestPermission: MockedFunction<() => Promise<NotificationPermissionState>>;
    sendNotification: MockedFunction<(payload: NotificationPayload) => Promise<boolean>>;
    sendTestNotification: MockedFunction<() => Promise<boolean>>;
    isNotificationSupported: MockedFunction<() => boolean>;
  }>;
};

describe('useNotification', () => {
  const mockNotificationService = {
    getPermissionState: vi.fn(),
    requestPermission: vi.fn(),
    sendNotification: vi.fn(),
    sendTestNotification: vi.fn(),
    isNotificationSupported: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    MockedNotificationService.getInstance.mockReturnValue(mockNotificationService);
    
    // デフォルト値の設定
    mockNotificationService.getPermissionState.mockReturnValue({
      granted: false,
      denied: false,
      default: true
    });
    mockNotificationService.isNotificationSupported.mockReturnValue(true);
  });

  describe('初期化', () => {
    it('初期状態が正しく設定される', () => {
      const { result } = renderHook(() => useNotification());

      expect(result.current.permission).toEqual({
        granted: false,
        denied: false,
        default: true
      });
      expect(result.current.isSupported).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('NotificationServiceから許可状態を取得する', () => {
      renderHook(() => useNotification());

      expect(mockNotificationService.getPermissionState).toHaveBeenCalledOnce();
    });
  });

  describe('requestPermission', () => {
    it('通知許可要求が成功する', async () => {
      const newPermission: NotificationPermissionState = {
        granted: true,
        denied: false,
        default: false
      };
      mockNotificationService.requestPermission.mockResolvedValue(newPermission);

      const { result } = renderHook(() => useNotification());

      let returnedPermission: NotificationPermissionState | undefined;
      await act(async () => {
        returnedPermission = await result.current.requestPermission();
      });

      expect(mockNotificationService.requestPermission).toHaveBeenCalledOnce();
      expect(result.current.permission).toEqual(newPermission);
      expect(returnedPermission).toEqual(newPermission);
    });

    it('通知許可要求中はisLoadingがtrueになる', async () => {
      mockNotificationService.requestPermission.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() => useNotification());

      act(() => {
        result.current.requestPermission();
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('通知許可要求失敗時はエラーをログ出力する', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockNotificationService.requestPermission.mockRejectedValue(new Error('Permission denied'));

      const { result } = renderHook(() => useNotification());

      let returnedPermission: NotificationPermissionState | undefined;
      await act(async () => {
        returnedPermission = await result.current.requestPermission();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('通知許可要求エラー:', expect.any(Error));
      expect(result.current.isLoading).toBe(false);
      expect(returnedPermission).toBeUndefined();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('sendNotification', () => {
    it('通知送信が成功する', async () => {
      const payload: NotificationPayload = {
        type: 'high-score',
        title: 'テスト通知',
        message: 'これはテストです'
      };
      mockNotificationService.sendNotification.mockResolvedValue(true);

      const { result } = renderHook(() => useNotification());

      const success = await act(async () => {
        return await result.current.sendNotification(payload);
      });

      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(payload);
      expect(success).toBe(true);
    });

    it('通知送信が失敗する', async () => {
      const payload: NotificationPayload = {
        type: 'high-score',
        title: 'テスト通知',
        message: 'これはテストです'
      };
      mockNotificationService.sendNotification.mockResolvedValue(false);

      const { result } = renderHook(() => useNotification());

      const success = await act(async () => {
        return await result.current.sendNotification(payload);
      });

      expect(success).toBe(false);
    });
  });

  describe('sendTestNotification', () => {
    it('テスト通知送信が成功する', async () => {
      mockNotificationService.sendTestNotification.mockResolvedValue(true);

      const { result } = renderHook(() => useNotification());

      const success = await act(async () => {
        return await result.current.sendTestNotification();
      });

      expect(mockNotificationService.sendTestNotification).toHaveBeenCalledOnce();
      expect(success).toBe(true);
    });

    it('テスト通知送信が失敗する', async () => {
      mockNotificationService.sendTestNotification.mockResolvedValue(false);

      const { result } = renderHook(() => useNotification());

      const success = await act(async () => {
        return await result.current.sendTestNotification();
      });

      expect(success).toBe(false);
    });
  });

  describe('isSupported', () => {
    it('通知がサポートされている場合', () => {
      mockNotificationService.isNotificationSupported.mockReturnValue(true);

      const { result } = renderHook(() => useNotification());

      expect(result.current.isSupported).toBe(true);
    });

    it('通知がサポートされていない場合', () => {
      mockNotificationService.isNotificationSupported.mockReturnValue(false);

      const { result } = renderHook(() => useNotification());

      expect(result.current.isSupported).toBe(false);
    });
  });
});