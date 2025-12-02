import { db, HobbyWeatherDatabase } from '../data/database';
import type {
    Hobby,
    WeatherData,
    WeatherForecast,
    Location,
    AppSettings,
} from '../types';

export class DatabaseService {
    private db: HobbyWeatherDatabase;

    constructor(database?: HobbyWeatherDatabase) {
        this.db = database || db;
    }
    // 趣味関連操作
    async createHobby(
        hobby: Omit<Hobby, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<number> {
        return await this.db.hobbies.add(hobby as Hobby);
    }

    async getHobby(id: number): Promise<Hobby | undefined> {
        return await this.db.hobbies.get(id);
    }

    async getAllHobbies(): Promise<Hobby[]> {
        return await this.db.hobbies.orderBy('createdAt').toArray();
    }

    async getActiveHobbies(): Promise<Hobby[]> {
        return await this.db.hobbies
            .filter((hobby) => hobby.isActive === true)
            .toArray();
    }

    async updateHobby(id: number, changes: Partial<Hobby>): Promise<number> {
        return await this.db.hobbies.update(id, changes);
    }

    async deleteHobby(id: number): Promise<void> {
        await this.db.hobbies.delete(id);
    }

    // 天気データ操作
    async saveWeatherData(
        weatherData: Omit<WeatherData, 'id'>
    ): Promise<number> {
        return await this.db.weatherData.add(weatherData as WeatherData);
    }

    async getWeatherData(
        lat: number,
        lon: number,
        maxAge: number = 6
    ): Promise<WeatherData | undefined> {
        const cutoffTime = new Date(Date.now() - maxAge * 60 * 60 * 1000);

        return await this.db.weatherData
            .where('[lat+lon]')
            .equals([lat, lon])
            .and((item) => item.cachedAt > cutoffTime)
            .first();
    }

    async saveWeatherForecast(
        forecast: Omit<WeatherForecast, 'id'>
    ): Promise<number> {
        // 同じ場所の既存の予報を削除
        await this.db.weatherForecasts
            .where('[lat+lon]')
            .equals([forecast.lat, forecast.lon])
            .delete();
        return await this.db.weatherForecasts.add(forecast as WeatherForecast);
    }

    async getWeatherForecast(
        lat: number,
        lon: number,
        maxAge: number = 6
    ): Promise<WeatherForecast | undefined> {
        const cutoffTime = new Date(Date.now() - maxAge * 60 * 60 * 1000);

        return await this.db.weatherForecasts
            .where('[lat+lon]')
            .equals([lat, lon])
            .and((item) => item.cachedAt > cutoffTime)
            .first();
    }

    // 場所関連操作
    async saveLocation(
        location: Omit<Location, 'id' | 'createdAt'>
    ): Promise<number> {
        if (location.isDefault) {
            // 他のすべての場所を非デフォルトに設定
            await this.db.locations
                .filter((loc) => loc.isDefault === true)
                .modify({ isDefault: false });
        }
        return await this.db.locations.add(location as Location);
    }

    async getLocation(id: number): Promise<Location | undefined> {
        return await this.db.locations.get(id);
    }

    async getAllLocations(): Promise<Location[]> {
        return await this.db.locations.orderBy('createdAt').toArray();
    }

    async getDefaultLocation(): Promise<Location | undefined> {
        return await this.db.locations
            .filter((loc) => loc.isDefault === true)
            .first();
    }

    async updateLocation(
        id: number,
        changes: Partial<Location>
    ): Promise<number> {
        if (changes.isDefault) {
            // 他のすべての場所を非デフォルトに設定
            await this.db.locations
                .filter((loc) => loc.isDefault === true)
                .modify({ isDefault: false });
        }
        return await this.db.locations.update(id, changes);
    }

    async deleteLocation(id: number): Promise<void> {
        await this.db.locations.delete(id);
    }

    // 設定関連操作
    async getSettings(): Promise<AppSettings | undefined> {
        return await this.db.settings.toCollection().first();
    }

    async updateSettings(changes: Partial<AppSettings>): Promise<number> {
        const settings = await this.getSettings();
        if (settings && settings.id !== undefined) {
            return await this.db.settings.update(settings.id, changes);
        } else {
            return await this.db.settings.add({
                temperatureUnit: 'celsius',
                windSpeedUnit: 'kmh',
                language: 'ja',
                notificationsEnabled: true,
                cacheExpiration: 6,
                ...changes,
                updatedAt: new Date(),
            });
        }
    }

    // ユーティリティ操作
    async clearAllData(): Promise<void> {
        await this.db.hobbies.clear();
        await this.db.weatherData.clear();
        await this.db.weatherForecasts.clear();
        await this.db.locations.clear();
        await this.db.settings.clear();
    }

    async exportData(): Promise<string> {
        const hobbies = await this.getAllHobbies();
        const locations = await this.getAllLocations();
        const settings = await this.getSettings();

        return JSON.stringify(
            {
                hobbies,
                locations,
                settings,
                exportedAt: new Date().toISOString(),
            },
            null,
            2
        );
    }

    async importData(jsonData: string): Promise<void> {
        const data = JSON.parse(jsonData) as {
            hobbies?: Array<Hobby & { id?: number }>;
            locations?: Array<Location & { id?: number }>;
            settings?: AppSettings & { id?: number };
        };

        // 既存データをクリア
        await this.clearAllData();

        // 趣味をインポート
        if (data.hobbies && Array.isArray(data.hobbies)) {
            for (const hobby of data.hobbies) {
                const { id: _id, ...hobbyData } = hobby;
                await this.createHobby(hobbyData);
            }
        }

        // 場所をインポート
        if (data.locations && Array.isArray(data.locations)) {
            for (const location of data.locations) {
                const { id: _id, ...locationData } = location;
                await this.saveLocation(locationData);
            }
        }

        // 設定をインポート
        if (data.settings) {
            const { id: _id2, ...settingsData } = data.settings;
            await this.updateSettings(settingsData);
        }
    }
    public getDb() {
        return this.db;
    }
}

export const databaseService = new DatabaseService();
