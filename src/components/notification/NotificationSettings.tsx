import { useState, useEffect } from 'react';
import { useNotificationConfig } from '../../hooks/useNotificationConfig';
import { useNotification } from '../../hooks/useNotification';
import { NotificationPermissionPrompt } from './NotificationPermissionPrompt';
import { useTheme } from '../../contexts/ThemeContext';
import type { NotificationConfig, TimeRange } from '../../types/notification';

interface NotificationSettingsProps {
  className?: string;
}

export function NotificationSettings({ className = "" }: NotificationSettingsProps) {
  const { currentTheme } = useTheme();
  const { permission } = useNotification();
  const { 
    configs, 
    settings, 
    isLoading, 
    error, 
    toggleConfig, 
    updateSettings,
    getStats 
  } = useNotificationConfig();
  
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<{
    totalSent: number;
    clickRate: number;
    dismissRate: number;
  } | null>(null);

  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');

  // 設定の初期化
  useEffect(() => {
    if (settings?.quietHours) {
      setQuietHoursEnabled(true);
      setQuietStart(settings.quietHours.start);
      setQuietEnd(settings.quietHours.end);
    }
  }, [settings]);

  // 統計情報の読み込み
  const loadStats = async () => {
    try {
      const statsData = await getStats(7);
      setStats(statsData);
      setShowStats(true);
    } catch (error) {
      console.error('統計情報の読み込みに失敗:', error);
    }
  };

  // グローバル設定の更新
  const handleGlobalToggle = async (enabled: boolean) => {
    await updateSettings({ globalEnabled: enabled });
  };

  // 静寂時間の更新
  const handleQuietHoursChange = async () => {
    const quietHours: TimeRange | null = quietHoursEnabled 
      ? { start: quietStart, end: quietEnd }
      : null;
    
    await updateSettings({ quietHours });
  };

  // 最大通知数の更新
  const handleMaxNotificationsChange = async (max: number) => {
    await updateSettings({ maxDailyNotifications: max });
  };

  // 音・振動設定の更新
  const handleSoundToggle = async (enabled: boolean) => {
    await updateSettings({ soundEnabled: enabled });
  };

  const handleVibrationToggle = async (enabled: boolean) => {
    await updateSettings({ vibrationEnabled: enabled });
  };

  if (isLoading) {
    return (
      <div 
        className={`rounded-lg shadow p-6 ${className}`}
        style={{ backgroundColor: currentTheme.colors.surface.primary }}
      >
        <div className="animate-pulse">
          <div 
            className="h-6 rounded mb-4"
            style={{ backgroundColor: currentTheme.colors.surface.secondary }}
          ></div>
          <div className="space-y-3">
            <div 
              className="h-4 rounded"
              style={{ backgroundColor: currentTheme.colors.surface.secondary }}
            ></div>
            <div 
              className="h-4 rounded"
              style={{ backgroundColor: currentTheme.colors.surface.secondary }}
            ></div>
            <div 
              className="h-4 rounded"
              style={{ backgroundColor: currentTheme.colors.surface.secondary }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={`border rounded-lg p-4 ${className}`}
        style={{
          backgroundColor: currentTheme.mode === 'dark' 
            ? 'rgba(239, 68, 68, 0.1)' 
            : 'rgb(254, 242, 242)',
          borderColor: currentTheme.colors.error
        }}
      >
        <div className="flex items-center">
          <div 
            className="mr-2"
            style={{ color: currentTheme.colors.error }}
          >
            ❌
          </div>
          <div>
            <h3 
              className="text-sm font-medium"
              style={{ color: currentTheme.colors.error }}
            >
              エラーが発生しました
            </h3>
            <p 
              className="text-sm mt-1"
              style={{ color: currentTheme.colors.error }}
            >
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 通知許可プロンプト */}
      <NotificationPermissionPrompt />

      {/* グローバル設定 */}
      <div 
        className="rounded-lg shadow p-6"
        style={{ backgroundColor: currentTheme.colors.surface.primary }}
      >
        <h2 
          className="text-lg font-semibold mb-4"
          style={{ color: currentTheme.colors.text.primary }}
        >
          🔔 通知設定
        </h2>
        
        <div className="space-y-4">
          {/* 全体の有効/無効 */}
          <div className="flex items-center justify-between">
            <div>
              <h3 
                className="text-sm font-medium"
                style={{ color: currentTheme.colors.text.primary }}
              >
                通知機能
              </h3>
              <p 
                className="text-sm"
                style={{ color: currentTheme.colors.text.tertiary }}
              >
                すべての通知の有効/無効を切り替え
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.globalEnabled || false}
                onChange={(e) => handleGlobalToggle(e.target.checked)}
                className="sr-only peer"
                disabled={!permission.granted}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* 静寂時間 */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 
                  className="text-sm font-medium"
                  style={{ color: currentTheme.colors.text.primary }}
                >
                  静寂時間
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: currentTheme.colors.text.tertiary }}
                >
                  指定した時間は通知を送信しません
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={quietHoursEnabled}
                  onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {quietHoursEnabled && (
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                  onBlur={handleQuietHoursChange}
                  className="rounded px-2 py-1 text-sm"
                  style={{
                    backgroundColor: currentTheme.colors.surface.secondary,
                    borderColor: currentTheme.colors.border.primary,
                    color: currentTheme.colors.text.primary,
                    border: `1px solid ${currentTheme.colors.border.primary}`
                  }}
                />
                <span 
                  className="text-sm"
                  style={{ color: currentTheme.colors.text.tertiary }}
                >
                  から
                </span>
                <input
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                  onBlur={handleQuietHoursChange}
                  className="rounded px-2 py-1 text-sm"
                  style={{
                    backgroundColor: currentTheme.colors.surface.secondary,
                    borderColor: currentTheme.colors.border.primary,
                    color: currentTheme.colors.text.primary,
                    border: `1px solid ${currentTheme.colors.border.primary}`
                  }}
                />
                <span 
                  className="text-sm"
                  style={{ color: currentTheme.colors.text.tertiary }}
                >
                  まで
                </span>
              </div>
            )}
          </div>

          {/* 1日の最大通知数 */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 
                  className="text-sm font-medium"
                  style={{ color: currentTheme.colors.text.primary }}
                >
                  1日の最大通知数
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: currentTheme.colors.text.tertiary }}
                >
                  1日に送信する通知の上限数
                </p>
              </div>
              <select
                value={settings?.maxDailyNotifications || 10}
                onChange={(e) => handleMaxNotificationsChange(Number(e.target.value))}
                className="rounded px-2 py-1 text-sm"
                style={{
                  backgroundColor: currentTheme.colors.surface.secondary,
                  borderColor: currentTheme.colors.border.primary,
                  color: currentTheme.colors.text.primary,
                  border: `1px solid ${currentTheme.colors.border.primary}`
                }}
              >
                <option value={5}>5回</option>
                <option value={10}>10回</option>
                <option value={20}>20回</option>
                <option value={50}>50回</option>
              </select>
            </div>
          </div>

          {/* 音・振動設定 */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 
                  className="text-sm font-medium"
                  style={{ color: currentTheme.colors.text.primary }}
                >
                  通知音
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: currentTheme.colors.text.tertiary }}
                >
                  通知時に音を再生
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings?.soundEnabled || false}
                  onChange={(e) => handleSoundToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 
                  className="text-sm font-medium"
                  style={{ color: currentTheme.colors.text.primary }}
                >
                  バイブレーション
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: currentTheme.colors.text.tertiary }}
                >
                  通知時に振動（対応デバイスのみ）
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings?.vibrationEnabled || false}
                  onChange={(e) => handleVibrationToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 通知タイプ別設定 */}
      <div 
        className="rounded-lg shadow p-6"
        style={{ backgroundColor: currentTheme.colors.surface.primary }}
      >
        <h2 
          className="text-lg font-semibold mb-4"
          style={{ color: currentTheme.colors.text.primary }}
        >
          📋 通知タイプ設定
        </h2>
        
        <div className="space-y-4">
          {configs.map((config) => (
            <NotificationConfigItem
              key={config.id}
              config={config}
              onToggle={toggleConfig}
            />
          ))}
          
          {configs.length === 0 && (
            <p 
              className="text-sm text-center py-4"
              style={{ color: currentTheme.colors.text.tertiary }}
            >
              通知設定がありません
            </p>
          )}
        </div>
      </div>

      {/* 統計情報 */}
      <div 
        className="rounded-lg shadow p-6"
        style={{ backgroundColor: currentTheme.colors.surface.primary }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 
            className="text-lg font-semibold"
            style={{ color: currentTheme.colors.text.primary }}
          >
            📊 通知統計
          </h2>
          <button
            onClick={loadStats}
            className="text-sm hover:opacity-80 transition-opacity"
            style={{ color: currentTheme.colors.primary }}
          >
            {showStats ? '再読み込み' : '統計を表示'}
          </button>
        </div>
        
        {showStats && stats && (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div 
                className="text-2xl font-bold"
                style={{ color: currentTheme.colors.primary }}
              >
                {stats.totalSent}
              </div>
              <div 
                className="text-sm"
                style={{ color: currentTheme.colors.text.tertiary }}
              >
                総送信数
              </div>
            </div>
            <div>
              <div 
                className="text-2xl font-bold"
                style={{ color: currentTheme.colors.success }}
              >
                {(stats.clickRate * 100).toFixed(1)}%
              </div>
              <div 
                className="text-sm"
                style={{ color: currentTheme.colors.text.tertiary }}
              >
                クリック率
              </div>
            </div>
            <div>
              <div 
                className="text-2xl font-bold"
                style={{ color: currentTheme.colors.warning }}
              >
                {(stats.dismissRate * 100).toFixed(1)}%
              </div>
              <div 
                className="text-sm"
                style={{ color: currentTheme.colors.text.tertiary }}
              >
                非表示率
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 個別の通知設定項目コンポーネント
function NotificationConfigItem({ 
  config, 
  onToggle 
}: { 
  config: NotificationConfig; 
  onToggle: (id: number) => Promise<void>; 
}) {
  const { currentTheme } = useTheme();
  const getConfigIcon = (type: string) => {
    switch (type) {
      case 'high-score': return '🌟';
      case 'weather-alert': return '🌧️';
      case 'regular-report': return '📊';
      default: return '🔔';
    }
  };

  const getConfigDescription = (type: string) => {
    switch (type) {
      case 'high-score': return '趣味活動の高スコア通知';
      case 'weather-alert': return '天気急変アラート';
      case 'regular-report': return '定期的な趣味レポート';
      default: return '通知';
    }
  };

  const handleToggle = async () => {
    if (config.id) {
      await onToggle(config.id);
    }
  };

  return (
    <div 
      className="flex items-center justify-between p-3 rounded-lg"
      style={{
        backgroundColor: currentTheme.colors.surface.secondary,
        borderColor: currentTheme.colors.border.primary,
        border: `1px solid ${currentTheme.colors.border.primary}`
      }}
    >
      <div className="flex items-center space-x-3">
        <span className="text-xl">{getConfigIcon(config.type)}</span>
        <div>
          <h4 
            className="text-sm font-medium"
            style={{ color: currentTheme.colors.text.primary }}
          >
            {config.title}
          </h4>
          <p 
            className="text-sm"
            style={{ color: currentTheme.colors.text.tertiary }}
          >
            {getConfigDescription(config.type)}
          </p>
        </div>
      </div>
      
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={handleToggle}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  );
}