import Dexie, { type Table } from 'dexie';
import type { 
  Hobby, 
  WeatherData, 
  WeatherForecast, 
  Location, 
  AppSettings,
  NotificationConfig,
  NotificationHistory,
  NotificationSettings
} from '../types';

export class HobbyWeatherDatabase extends Dexie {
  hobbies!: Table<Hobby>;
  weatherData!: Table<WeatherData>;
  weatherForecasts!: Table<WeatherForecast>;
  locations!: Table<Location>;
  settings!: Table<AppSettings>;
  notificationConfigs!: Table<NotificationConfig>;
  notificationHistory!: Table<NotificationHistory>;
  notificationSettings!: Table<NotificationSettings>;

  constructor() {
    super('HobbyWeatherDB');
    
    this.version(1).stores({
      hobbies: '++id, name, isActive, createdAt',
      weatherData: '++id, [lat+lon], datetime, weatherType, cachedAt',
      weatherForecasts: '++id, [lat+lon], cachedAt',
      locations: '++id, name, isDefault, createdAt',
      settings: '++id'
    });

    // Version 2で趣味に活動時間帯を追加
    this.version(2).stores({
      hobbies: '++id, name, isActive, createdAt',
      weatherData: '++id, [lat+lon], datetime, weatherType, cachedAt',
      weatherForecasts: '++id, [lat+lon], cachedAt',
      locations: '++id, name, isDefault, createdAt',
      settings: '++id'
    }).upgrade(async (trans) => {
      // 既存の趣味データに活動時間帯を追加
      await trans.table('hobbies').toCollection().modify((hobby) => {
        if (!hobby.preferredTimeOfDay) {
          hobby.preferredTimeOfDay = [];
        }
      });
    });

    // Version 3で天気データにgeneratedAtを追加
    this.version(3).stores({
      hobbies: '++id, name, isActive, createdAt',
      weatherData: '++id, [lat+lon], datetime, weatherType, generatedAt, cachedAt',
      weatherForecasts: '++id, [lat+lon], generatedAt, cachedAt',
      locations: '++id, name, isDefault, createdAt',
      settings: '++id'
    }).upgrade(async (trans) => {
      // 既存の天気データにgeneratedAtを追加
      await trans.table('weatherData').toCollection().modify((weatherData) => {
        if (!weatherData.generatedAt) {
          weatherData.generatedAt = weatherData.cachedAt || new Date();
        }
      });
      
      // 既存の天気予報データにgeneratedAtを追加
      await trans.table('weatherForecasts').toCollection().modify((forecast) => {
        if (!forecast.generatedAt) {
          forecast.generatedAt = forecast.cachedAt || new Date();
        }
      });
    });

    // Version 4で場所に種別・住所・カテゴリを追加
    this.version(4).stores({
      hobbies: '++id, name, isActive, createdAt',
      weatherData: '++id, [lat+lon], datetime, weatherType, generatedAt, cachedAt',
      weatherForecasts: '++id, [lat+lon], generatedAt, cachedAt',
      locations: '++id, name, isDefault, createdAt',
      settings: '++id'
    }).upgrade(async (trans) => {
      // 既存の場所データに新しいフィールドを追加
      await trans.table('locations').toCollection().modify((location) => {
        if (!location.type) {
          location.type = 'city'; // 既存の場所はデフォルトで都市とする
        }
        if (!location.address) {
          location.address = undefined;
        }
        if (!location.category) {
          location.category = undefined;
        }
      });
    });

    // Version 5で通知機能のテーブルを追加
    this.version(5).stores({
      hobbies: '++id, name, isActive, createdAt',
      weatherData: '++id, [lat+lon], datetime, weatherType, generatedAt, cachedAt',
      weatherForecasts: '++id, [lat+lon], generatedAt, cachedAt',
      locations: '++id, name, isDefault, createdAt',
      settings: '++id',
      notificationConfigs: '++id, type, enabled, createdAt',
      notificationHistory: '++id, configId, type, sentAt',
      notificationSettings: '++id'
    }).upgrade(async (trans) => {
      // デフォルトの通知設定を追加
      await trans.table('notificationSettings').add({
        globalEnabled: true,
        quietHours: null,
        maxDailyNotifications: 10,
        soundEnabled: true,
        vibrationEnabled: true,
        updatedAt: new Date()
      });
    });

    this.hobbies.hook('creating', (_, obj) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.hobbies.hook('updating', (modifications) => {
      (modifications as any).updatedAt = new Date();
    });

    this.locations.hook('creating', (_, obj) => {
      obj.createdAt = new Date();
    });

    this.settings.hook('creating', (_, obj) => {
      obj.updatedAt = new Date();
    });

    this.settings.hook('updating', (modifications) => {
      (modifications as any).updatedAt = new Date();
    });

    this.notificationConfigs.hook('creating', (_, obj) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.notificationConfigs.hook('updating', (modifications) => {
      (modifications as any).updatedAt = new Date();
    });

    this.notificationSettings.hook('creating', (_, obj) => {
      obj.updatedAt = new Date();
    });

    this.notificationSettings.hook('updating', (modifications) => {
      (modifications as any).updatedAt = new Date();
    });
  }

  async initializeDefaultData() {
    const settingsCount = await this.settings.count();
    if (settingsCount === 0) {
      await this.settings.add({
        temperatureUnit: 'celsius',
        windSpeedUnit: 'kmh',
        language: 'ja',
        notificationsEnabled: true,
        cacheExpiration: 6,
        updatedAt: new Date()
      });
    }

    // デフォルトの通知設定を初期化
    const notificationSettingsCount = await this.notificationSettings.count();
    if (notificationSettingsCount === 0) {
      await this.notificationSettings.add({
        globalEnabled: true,
        quietHours: null,
        maxDailyNotifications: 10,
        soundEnabled: true,
        vibrationEnabled: true,
        updatedAt: new Date()
      });
    }
  }

  async clearExpiredCache() {
    const now = new Date();
    const settings = await this.settings.toCollection().first();
    const expirationHours = settings?.cacheExpiration || 6;
    const expirationTime = new Date(now.getTime() - expirationHours * 60 * 60 * 1000);

    await this.weatherData.where('cachedAt').below(expirationTime).delete();
    await this.weatherForecasts.where('cachedAt').below(expirationTime).delete();
  }
}

export const db = new HobbyWeatherDatabase();