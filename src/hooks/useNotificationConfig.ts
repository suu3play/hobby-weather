import { useState, useEffect, useCallback } from 'react';
import { NotificationConfigService } from '../services/notification-config.service';
import type { 
  NotificationConfig, 
  NotificationSettings, 
  NotificationType,
  NotificationHistory
} from '../types/notification';

interface UseNotificationConfigReturn {
  configs: NotificationConfig[];
  settings: NotificationSettings | null;
  history: NotificationHistory[];
  isLoading: boolean;
  error: string | null;
  createConfig: (config: Omit<NotificationConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateConfig: (id: number, changes: Partial<NotificationConfig>) => Promise<void>;
  deleteConfig: (id: number) => Promise<void>;
  toggleConfig: (id: number) => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  refreshConfigs: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  getStats: (days?: number) => Promise<{
    totalSent: number;
    byType: Record<NotificationType, number>;
    clickRate: number;
    dismissRate: number;
  }>;
}

export function useNotificationConfig(): UseNotificationConfigReturn {
  const [configs, setConfigs] = useState<NotificationConfig[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const configService = new NotificationConfigService();

  // 初期データの読み込み
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [configsData, settingsData, historyData] = await Promise.all([
        configService.getAllNotificationConfigs(),
        configService.getNotificationSettings(),
        configService.getNotificationHistory({ limit: 50 }) // 最新50件
      ]);
      
      setConfigs(configsData);
      setSettings(settingsData || null);
      setHistory(historyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '通知設定の読み込みに失敗しました');
      console.error('通知設定読み込みエラー:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 設定の作成
  const createConfig = useCallback(async (config: Omit<NotificationConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      await configService.createNotificationConfig(config);
      await loadData(); // データを再読み込み
    } catch (err) {
      setError(err instanceof Error ? err.message : '通知設定の作成に失敗しました');
      console.error('通知設定作成エラー:', err);
    }
  }, [loadData]);

  // 設定の更新
  const updateConfig = useCallback(async (id: number, changes: Partial<NotificationConfig>) => {
    try {
      setError(null);
      await configService.updateNotificationConfig(id, changes);
      await loadData(); // データを再読み込み
    } catch (err) {
      setError(err instanceof Error ? err.message : '通知設定の更新に失敗しました');
      console.error('通知設定更新エラー:', err);
    }
  }, [loadData]);

  // 設定の削除
  const deleteConfig = useCallback(async (id: number) => {
    try {
      setError(null);
      await configService.deleteNotificationConfig(id);
      await loadData(); // データを再読み込み
    } catch (err) {
      setError(err instanceof Error ? err.message : '通知設定の削除に失敗しました');
      console.error('通知設定削除エラー:', err);
    }
  }, [loadData]);

  // 設定の有効/無効切り替え
  const toggleConfig = useCallback(async (id: number) => {
    try {
      setError(null);
      await configService.toggleNotificationConfig(id);
      await loadData(); // データを再読み込み
    } catch (err) {
      setError(err instanceof Error ? err.message : '通知設定の切り替えに失敗しました');
      console.error('通知設定切り替えエラー:', err);
    }
  }, [loadData]);

  // グローバル設定の更新
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    try {
      setError(null);
      await configService.updateNotificationSettings(newSettings);
      await loadData(); // データを再読み込み
    } catch (err) {
      setError(err instanceof Error ? err.message : 'グローバル設定の更新に失敗しました');
      console.error('グローバル設定更新エラー:', err);
    }
  }, [loadData]);

  // 設定一覧の再読み込み
  const refreshConfigs = useCallback(async () => {
    try {
      setError(null);
      const configsData = await configService.getAllNotificationConfigs();
      setConfigs(configsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '通知設定の再読み込みに失敗しました');
      console.error('通知設定再読み込みエラー:', err);
    }
  }, []);

  // 履歴の再読み込み
  const refreshHistory = useCallback(async () => {
    try {
      setError(null);
      const historyData = await configService.getNotificationHistory({ limit: 50 });
      setHistory(historyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '通知履歴の再読み込みに失敗しました');
      console.error('通知履歴再読み込みエラー:', err);
    }
  }, []);

  // 統計情報の取得
  const getStats = useCallback(async (days: number = 7) => {
    return await configService.getNotificationStats(days);
  }, []);

  // 初回読み込み
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    configs,
    settings,
    history,
    isLoading,
    error,
    createConfig,
    updateConfig,
    deleteConfig,
    toggleConfig,
    updateSettings,
    refreshConfigs,
    refreshHistory,
    getStats
  };
}