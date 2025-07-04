import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from './database.service';
import { HobbyWeatherDatabase } from '../data/database';
import type { Hobby, Location } from '../types';

describe('DatabaseService', () => {
  let service: DatabaseService;
  let testDb: HobbyWeatherDatabase;
  let testDbName: string;

  beforeEach(async () => {
    // Create unique database name for each test
    testDbName = `HobbyWeatherDB_Test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Create test database with unique name
    class TestDatabase extends HobbyWeatherDatabase {
      constructor(name: string) {
        super();
        // @ts-ignore - temporary workaround for readonly property
        this.name = name;
      }
    }
    
    testDb = new TestDatabase(testDbName);
    await testDb.open();
    
    // Clear any existing data first
    await testDb.hobbies.clear();
    await testDb.locations.clear();
    await testDb.settings.clear();
    await testDb.weatherData.clear();
    await testDb.weatherForecasts.clear();
    
    await testDb.initializeDefaultData();
    
    // Create service with test database
    service = new DatabaseService(testDb);
  });

  afterEach(async () => {
    try {
      await testDb.close();
      await testDb.delete();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Hobby management', () => {
    it('should create and retrieve hobby', async () => {
      const hobby: Omit<Hobby, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'ハイキング',
        preferredWeather: [
          { condition: 'clear', weight: 10 },
          { condition: 'clouds', weight: 7 }
        ],
        description: '自然の中を歩くのが好き',
        isActive: true
      };

      const id = await service.createHobby(hobby);
      const retrieved = await service.getHobby(id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('ハイキング');
      expect(retrieved?.preferredWeather).toHaveLength(2);
    });

    it('should get only active hobbies', async () => {
      await service.createHobby({
        name: 'アクティブ趣味',
        preferredWeather: [{ condition: 'clear', weight: 8 }],
        isActive: true
      });

      await service.createHobby({
        name: '非アクティブ趣味',
        preferredWeather: [{ condition: 'rain', weight: 6 }],
        isActive: false
      });

      const activeHobbies = await service.getActiveHobbies();
      const allHobbies = await service.getAllHobbies();

      expect(activeHobbies).toHaveLength(1);
      expect(allHobbies).toHaveLength(2);
      expect(activeHobbies[0].name).toBe('アクティブ趣味');
    });

    it('should update hobby', async () => {
      const id = await service.createHobby({
        name: '釣り',
        preferredWeather: [{ condition: 'clouds', weight: 8 }],
        isActive: true
      });

      await service.updateHobby(id, { name: '海釣り', isActive: false });
      const updated = await service.getHobby(id);

      expect(updated?.name).toBe('海釣り');
      expect(updated?.isActive).toBe(false);
    });

    it('should delete hobby', async () => {
      const id = await service.createHobby({
        name: '削除予定',
        preferredWeather: [{ condition: 'clear', weight: 5 }],
        isActive: true
      });

      await service.deleteHobby(id);
      const deleted = await service.getHobby(id);

      expect(deleted).toBeUndefined();
    });
  });

  describe('Location management', () => {
    it('should create and retrieve location', async () => {
      const location: Omit<Location, 'id' | 'createdAt'> = {
        name: '大阪',
        lat: 34.6937,
        lon: 135.5023,
        isDefault: false
      };

      const id = await service.saveLocation(location);
      const retrieved = await service.getLocation(id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('大阪');
      expect(retrieved?.lat).toBe(34.6937);
    });

    it('should set default location correctly', async () => {
      const loc1Id = await service.saveLocation({
        name: '東京',
        lat: 35.6762,
        lon: 139.6503,
        isDefault: true
      });

      const loc2Id = await service.saveLocation({
        name: '京都',
        lat: 35.0116,
        lon: 135.7681,
        isDefault: true // This should make Tokyo non-default
      });

      const tokyo = await service.getLocation(loc1Id);
      const kyoto = await service.getLocation(loc2Id);
      const defaultLocation = await service.getDefaultLocation();

      expect(tokyo?.isDefault).toBe(false);
      expect(kyoto?.isDefault).toBe(true);
      expect(defaultLocation?.name).toBe('京都');
    });
  });

  describe('Settings management', () => {
    it('should get and update settings', async () => {
      // Wait a bit for initialization to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const settings = await service.getSettings();
      expect(settings).toBeDefined();
      expect(settings?.language).toBe('ja');

      await service.updateSettings({ 
        language: 'en',
        temperatureUnit: 'fahrenheit'
      });

      const updated = await service.getSettings();
      expect(updated?.language).toBe('en');
      expect(updated?.temperatureUnit).toBe('fahrenheit');
    });
  });

  describe('Data export/import', () => {
    it('should export and import data', async () => {
      // Create test data
      await service.createHobby({
        name: 'テスト趣味',
        preferredWeather: [{ condition: 'clear', weight: 9 }],
        isActive: true
      });

      await service.saveLocation({
        name: 'テスト場所',
        lat: 35.0,
        lon: 139.0,
        isDefault: true
      });

      // Export data
      const exportedData = await service.exportData();
      const parsed = JSON.parse(exportedData);

      expect(parsed.hobbies).toHaveLength(1);
      expect(parsed.locations).toHaveLength(1);
      expect(parsed.hobbies[0].name).toBe('テスト趣味');

      // Clear and import
      await service.clearAllData();
      
      // Verify data is cleared
      const clearedHobbies = await service.getAllHobbies();
      const clearedLocations = await service.getAllLocations();
      expect(clearedHobbies).toHaveLength(0);
      expect(clearedLocations).toHaveLength(0);
      
      await service.importData(exportedData);

      const hobbies = await service.getAllHobbies();
      const locations = await service.getAllLocations();

      expect(hobbies).toHaveLength(1);
      expect(locations).toHaveLength(1);
      expect(hobbies[0].name).toBe('テスト趣味');
    });
  });
});