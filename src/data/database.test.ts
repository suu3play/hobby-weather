import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HobbyWeatherDatabase } from './database';
import type { Hobby, Location } from '../types';

describe('Database', () => {
  let testDb: HobbyWeatherDatabase;

  beforeEach(async () => {
    // Create a test database instance
    testDb = new HobbyWeatherDatabase();
    await testDb.open();
    await testDb.initializeDefaultData();
  });

  afterEach(async () => {
    await testDb.delete();
    await testDb.close();
  });

  describe('Hobby operations', () => {
    it('should create and retrieve hobby', async () => {
      const hobby: Omit<Hobby, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'ランニング',
        preferredWeather: [
          { condition: 'clear', weight: 10 },
          { condition: 'clouds', weight: 8 }
        ],
        description: '晴れた日に走るのが好き',
        isActive: true
      };

      const id = await testDb.hobbies.add(hobby as Hobby);
      const retrieved = await testDb.hobbies.get(id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('ランニング');
      expect(retrieved?.preferredWeather).toHaveLength(2);
      expect(retrieved?.isActive).toBe(true);
      expect(retrieved?.createdAt).toBeInstanceOf(Date);
    });

    it('should update hobby updatedAt timestamp', async () => {
      const hobby: Omit<Hobby, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'サイクリング',
        preferredWeather: [{ condition: 'clear', weight: 9 }],
        isActive: true
      };

      const id = await testDb.hobbies.add(hobby as Hobby);
      const original = await testDb.hobbies.get(id);

      expect(original?.name).toBe('サイクリング');
      expect(original?.createdAt).toBeInstanceOf(Date);
      expect(original?.updatedAt).toBeInstanceOf(Date);

      // Update the hobby
      await testDb.hobbies.update(id, { name: 'マウンテンバイク' });
      const updated = await testDb.hobbies.get(id);

      expect(updated?.name).toBe('マウンテンバイク');
      expect(updated?.updatedAt?.getTime()).toBeGreaterThanOrEqual(original?.updatedAt?.getTime() || 0);
    });
  });

  describe('Location operations', () => {
    it('should create and retrieve location', async () => {
      const location: Omit<Location, 'id' | 'createdAt'> = {
        name: '東京',
        lat: 35.6762,
        lon: 139.6503,
        isDefault: true
      };

      const id = await testDb.locations.add(location as Location);
      const retrieved = await testDb.locations.get(id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('東京');
      expect(retrieved?.lat).toBe(35.6762);
      expect(retrieved?.isDefault).toBe(true);
      expect(retrieved?.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Settings operations', () => {
    it('should initialize default settings', async () => {
      const settings = await testDb.settings.toCollection().first();

      expect(settings).toBeDefined();
      expect(settings?.temperatureUnit).toBe('celsius');
      expect(settings?.language).toBe('ja');
      expect(settings?.notificationsEnabled).toBe(true);
    });
  });

  describe('Cache operations', () => {
    it('should clear expired cache', async () => {
      // Add old weather data
      const oldDate = new Date(Date.now() - 8 * 60 * 60 * 1000); // 8 hours ago
      
      await testDb.weatherData.add({
        lat: 35.6762,
        lon: 139.6503,
        datetime: oldDate,
        temperature: 25,
        feelsLike: 27,
        humidity: 60,
        pressure: 1013,
        visibility: 10000,
        windSpeed: 5,
        windDirection: 180,
        weatherType: 'clear',
        weatherDescription: '晴れ',
        condition: '晴れ',
        cloudiness: 0,
        uvIndex: 8,
        generatedAt: oldDate,
        cachedAt: oldDate
      });

      const countBefore = await testDb.weatherData.count();
      expect(countBefore).toBe(1);

      await testDb.clearExpiredCache();

      const countAfter = await testDb.weatherData.count();
      expect(countAfter).toBe(0);
    });
  });
});