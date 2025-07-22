export type NotificationType = 
  | 'high-score'        // 高スコア通知
  | 'weather-alert'     // 天気急変アラート
  | 'regular-report';   // 定期レポート

export type NotificationFrequency = 
  | 'daily' 
  | 'weekly' 
  | 'custom'
  | 'immediate';

export interface TimeRange {
  start: string; // "HH:mm" format
  end: string;   // "HH:mm" format
}

export interface NotificationSchedule {
  timeOfDay: TimeRange[];
  daysOfWeek: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  frequency: NotificationFrequency;
  customInterval?: number; // minutes for custom frequency
}

export interface NotificationConditions {
  // 高スコア通知用
  minScore?: number;
  scoreThreshold?: number;
  
  // 天気急変アラート用
  precipitationThreshold?: number; // 降水確率閾値 (%)
  temperatureChangeThreshold?: number; // 気温変化閾値 (°C)
  windSpeedThreshold?: number; // 風速閾値 (m/s)
  
  // 定期レポート用
  includePastDays?: number; // 過去何日分を含めるか
  includeUpcomingDays?: number; // 今後何日分を含めるか
}

export interface NotificationConfig {
  id?: number;
  type: NotificationType;
  enabled: boolean;
  schedule: NotificationSchedule;
  conditions: NotificationConditions;
  title: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  updatedAt?: Date;
}

export interface NotificationHistory {
  id?: number;
  configId: number;
  type: NotificationType;
  title: string;
  message: string;
  sentAt: Date;
  clicked?: boolean;
  dismissed?: boolean;
  data?: {
    severity?: 'low' | 'medium' | 'high' | 'urgent';
    alertType?: string;
    hobbyId?: number;
    hobbyName?: string;
    score?: number;
    weatherData?: unknown;
    url?: string;
    [key: string]: unknown;
  };
}

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  badge?: string;
  data?: {
    hobbyId?: number;
    hobbyName?: string;
    score?: number;
    weatherData?: unknown;
    alertType?: string;
    url?: string;
    severity?: 'low' | 'medium' | 'high' | 'urgent';
    topHobbies?: Array<{ name: string; score: number }>;
    actionItems?: string[];
    recommendations?: Array<{ name: string; score: number }>;
    weatherDescription?: string;
    temperature?: number;
    [key: string]: unknown;
  };
}

export interface NotificationPermissionState {
  granted: boolean;
  denied: boolean;
  default: boolean;
  requestedAt?: Date;
}

export interface NotificationSettings {
  id?: number;
  globalEnabled: boolean;
  quietHours: TimeRange | null;
  maxDailyNotifications: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  updatedAt: Date;
}