import { useState, useEffect, useCallback } from 'react';
import { NotificationService } from '../services/notification.service';
import type { 
  NotificationPermissionState, 
  NotificationPayload
} from '../types/notification';

interface UseNotificationReturn {
  permission: NotificationPermissionState;
  isSupported: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<NotificationPermissionState | undefined>;
  sendNotification: (payload: NotificationPayload) => Promise<boolean>;
  sendTestNotification: () => Promise<boolean>;
}

export function useNotification(): UseNotificationReturn {
  const [permission, setPermission] = useState<NotificationPermissionState>({
    granted: false,
    denied: false,
    default: true
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const notificationService = NotificationService.getInstance();

  // 初期化時に現在の許可状態を取得
  useEffect(() => {
    const currentPermission = notificationService.getPermissionState();
    setPermission(currentPermission);
  }, [notificationService]);

  // 通知許可を要求
  const requestPermission = useCallback(async (): Promise<NotificationPermissionState | undefined> => {
    setIsLoading(true);
    try {
      const newPermission = await notificationService.requestPermission();
      setPermission(newPermission);
      return newPermission;
    } catch (error) {
      console.error('通知許可要求エラー:', error);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, [notificationService]);

  // 通知送信
  const sendNotification = useCallback(async (payload: NotificationPayload): Promise<boolean> => {
    return await notificationService.sendNotification(payload);
  }, [notificationService]);

  // テスト通知送信
  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    return await notificationService.sendTestNotification();
  }, [notificationService]);

  return {
    permission,
    isSupported: notificationService.isNotificationSupported(),
    isLoading,
    requestPermission,
    sendNotification,
    sendTestNotification
  };
}