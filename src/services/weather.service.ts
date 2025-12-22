import type { 
  OpenWeatherMapCurrentResponse, 
  OpenWeatherMapForecastResponse,
  WeatherApiError 
} from '../types/api';
import type { WeatherData, WeatherForecast, DailyForecast, WeatherType, LocationSearchResult, LocationType } from '../types';
import { databaseService } from './database.service';

export class WeatherService {
  private apiKey: string;
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor() {
    this.apiKey = this.getApiKey();
  }

  private getApiKey(): string {
    // ローカルストレージからAPI Keyを読み込み、なければ環境変数を使用
    const savedSettings = localStorage.getItem('hobby-weather-api-settings');
    let localApiKey = '';
    
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        localApiKey = parsed.openWeatherApiKey ?? '';
      } catch (error) {
        console.error('Failed to parse saved API settings:', error);
      }
    }
    
    const apiKey = localApiKey || (import.meta.env['VITE_OPENWEATHER_API_KEY'] ?? '');
    
    if (!apiKey) {
      console.warn('OpenWeatherMap API key not found. Please set it in Settings or VITE_OPENWEATHER_API_KEY environment variable.');
    }
    
    return apiKey;
  }

  // API Keyを動的に更新
  public refreshApiKey(): void {
    this.apiKey = this.getApiKey();
  }

  private mapWeatherCondition(condition: string): WeatherType {
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('clear')) return 'clear';
    if (conditionLower.includes('cloud')) return 'clouds';
    if (conditionLower.includes('rain')) return 'rain';
    if (conditionLower.includes('drizzle')) return 'drizzle';
    if (conditionLower.includes('thunderstorm')) return 'thunderstorm';
    if (conditionLower.includes('snow')) return 'snow';
    if (conditionLower.includes('mist')) return 'mist';
    if (conditionLower.includes('fog')) return 'fog';
    if (conditionLower.includes('haze')) return 'haze';
    if (conditionLower.includes('dust') || conditionLower.includes('sand')) return 'dust';
    
    return 'clear'; // Default fallback
  }

  /**
   * OpenWeatherMap APIへのリクエストを実行
   * 
   * API制限事項:
   * - 無料プラン: 1,000 calls/day, 60 calls/minute
   * - レートリミット超過時は429ステータスコードを返す
   * - キャッシュ機能でAPI呼び出しを最小化
   */
  private async makeRequest<T>(url: string): Promise<T> {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData: WeatherApiError = await response.json();
      throw new Error(`Weather API Error: ${errorData.message} (Code: ${errorData.cod})`);
    }

    return response.json();
  }

  /**
   * 現在の天気情報を取得
   * 
   * キャッシュ戦略:
   * - デフォルトでは6時間キャッシュを使用
   * - forceRefresh=trueでキャッシュをバイパスして最新データを取得
   * - API呼び出し回数を減らしてレートリミットを回避
   */
  async getCurrentWeather(lat: number, lon: number, forceRefresh = false): Promise<WeatherData> {
    // 強制更新でない限りまずキャッシュをチェック
    if (!forceRefresh) {
      const cached = await databaseService.getWeatherData(lat, lon);
      if (cached) {
        return cached;
      }
    }

    const url = `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=ja`;
    const response: OpenWeatherMapCurrentResponse = await this.makeRequest(url);

    const now = new Date();
    const weatherData: Omit<WeatherData, 'id'> = {
      lat,
      lon,
      datetime: new Date(response.dt * 1000),
      temperature: response.main.temp,
      feelsLike: response.main.feels_like,
      humidity: response.main.humidity,
      pressure: response.main.pressure,
      visibility: response.visibility,
      windSpeed: response.wind.speed,
      windDirection: response.wind?.deg ?? 0,
      weatherType: this.mapWeatherCondition(response.weather?.[0]?.main ?? 'clear'),
      weatherDescription: response.weather?.[0]?.description ?? 'unknown',
      condition: response.weather?.[0]?.description ?? 'unknown',
      cloudiness: response.clouds.all,
      uvIndex: 0, // Current weather API doesn't provide UV index
      generatedAt: now,
      cachedAt: now
    };

    // Save to cache
    await databaseService.saveWeatherData(weatherData);

    return weatherData as WeatherData;
  }

  async getWeatherForecast(lat: number, lon: number, forceRefresh = false): Promise<WeatherForecast> {
    // Check cache first unless forced refresh
    if (!forceRefresh) {
      const cached = await databaseService.getWeatherForecast(lat, lon);
      if (cached) {
        return cached;
      }
    }

    /**
     * OneCall APIは2023年6月から有料サービスに変更
     * 代わりに5日間予報APIを使用して日別データを集約
     * 3時間ごとのデータを日別にグループ化して処理
     */
    const url = `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=ja`;
    const response: OpenWeatherMapForecastResponse = await this.makeRequest(url);

    // Validate response structure
    if (!response.list || !Array.isArray(response.list)) {
      throw new Error('Invalid forecast response format');
    }

    /**
     * 3時間ごとの予報データを日別にグループ化
     * 最高最低気温、時間帯別気温、平均湿度などを計算
     */
    const dailyData = new Map<string, OpenWeatherMapForecastResponse['list']>();
    
    response.list.forEach((item) => {
      const date = new Date(item.dt * 1000).toDateString();
      if (!dailyData.has(date)) {
        dailyData.set(date, []);
      }
      const dayData = dailyData.get(date);
      if (dayData) {
        dayData.push(item);
      }
    });

    const dailyForecasts: DailyForecast[] = Array.from(dailyData.entries())
      .slice(0, 7)
      .map(([dateString, items]) => {
        const temps = items.map(item => item.main.temp);
        const feelsLike = items.map(item => item.main.feels_like);
        const humidities = items.map(item => item.main.humidity);
        const pressures = items.map(item => item.main.pressure);
        const winds = items.map(item => item.wind.speed);
        
        // 一日の中間時刻の天気情報を代表値として使用
        // より精度を高める場合は最頻値を使用することも可能
        const weather = items[Math.floor(items.length / 2)]?.weather?.[0];
        if (!weather) {
          throw new Error('Invalid weather data in forecast');
        }
        
        return {
          date: new Date(dateString),
          temperature: {
            min: Math.min(...temps),
            max: Math.max(...temps),
            morning: items.find(item => new Date(item.dt * 1000).getHours() === 6)?.main.temp ?? temps[0] ?? 0,
            day: items.find(item => new Date(item.dt * 1000).getHours() === 12)?.main.temp ?? temps[Math.floor(temps.length / 2)] ?? 0,
            evening: items.find(item => new Date(item.dt * 1000).getHours() === 18)?.main.temp ?? temps[temps.length - 1] ?? 0,
            night: items.find(item => new Date(item.dt * 1000).getHours() === 0)?.main.temp ?? temps[0] ?? 0
          },
          feelsLike: {
            morning: items.find(item => new Date(item.dt * 1000).getHours() === 6)?.main.feels_like ?? feelsLike[0] ?? 0,
            day: items.find(item => new Date(item.dt * 1000).getHours() === 12)?.main.feels_like ?? feelsLike[Math.floor(feelsLike.length / 2)] ?? 0,
            evening: items.find(item => new Date(item.dt * 1000).getHours() === 18)?.main.feels_like ?? feelsLike[feelsLike.length - 1] ?? 0,
            night: items.find(item => new Date(item.dt * 1000).getHours() === 0)?.main.feels_like ?? feelsLike[0] ?? 0
          },
          humidity: Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length),
          pressure: Math.round(pressures.reduce((a, b) => a + b, 0) / pressures.length),
          windSpeed: Math.round((winds.reduce((a, b) => a + b, 0) / winds.length) * 10) / 10,
          windDirection: items[Math.floor(items.length / 2)]?.wind?.deg ?? 0,
          weatherType: this.mapWeatherCondition(weather.main),
          weatherDescription: weather.description,
          cloudiness: items[Math.floor(items.length / 2)]?.clouds?.all ?? 0,
          uvIndex: 0, // 5-day forecast doesn't include UV index
          pop: Math.max(...items.map(item => item.pop ?? 0))
        };
      });

    const forecast: Omit<WeatherForecast, 'id'> = {
      lat,
      lon,
      forecasts: dailyForecasts,
      generatedAt: new Date(),
      cachedAt: new Date()
    };

    // Save to cache
    await databaseService.saveWeatherForecast(forecast);

    return forecast as WeatherForecast;
  }

  async searchLocation(query: string): Promise<LocationSearchResult[]> {
    const results: LocationSearchResult[] = [];

    // OpenWeatherMap Geocoding API（都市名検索）
    try {
      const owmResults = await this.searchLocationOpenWeather(query);
      results.push(...owmResults);
    } catch (error) {
      console.warn('OpenWeatherMap search failed:', error);
    }

    /**
     * Nominatim APIで店舗・ランドマーク検索
     * 
     * 特徴:
     * - OpenStreetMapデータベースを使用した無料サービス
     * - 店舗、レストラン、観光地などの詳細な場所検索が可能
     * - 使用ポリシー: 1秒に1リクエストまで
     */
    // Nominatim API（店舗・ランドマーク検索）
    try {
      const nominatimResults = await this.searchLocationNominatim(query);
      results.push(...nominatimResults);
    } catch (error) {
      console.warn('Nominatim search failed:', error);
    }

    /**
     * 複数のAPIからの結果を統合し重複を除去
     * 同じ座標や名前の結果をマージしてユーザーに提示
     */
    return this.deduplicateLocations(results);
  }

  /**
   * OpenWeatherMap Geocoding APIで都市名検索
   * 
   * 特徴:
   * - 主に都市、省、国名での検索に適している
   * - 結果は3件までに制限してAPI呼び出しを最小化
   * - 国コードや経緯度情報を含む結果を返す
   */
  private async searchLocationOpenWeather(query: string): Promise<LocationSearchResult[]> {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=3&appid=${this.apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenWeatherMap location search failed: ${response.statusText}`);
    }

    const locations = await response.json();
    
    // OpenWeatherMapのレスポンスを統一フォーマットに変換
    return locations.map((location: { name: string; lat: number; lon: number; country: string }) => ({
      name: location.name,
      lat: location.lat,
      lon: location.lon,
      type: 'city' as LocationType,
      country: location.country,
      source: 'openweather' as const
    }));
  }

  private async searchLocationNominatim(query: string): Promise<LocationSearchResult[]> {
    // 日本国内の検索に限定し、店舗・ランドマークを優先
    const url = `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query)}&` +
      `format=json&` +
      `limit=5&` +
      `countrycodes=jp&` +
      `addressdetails=1&` +
      `extratags=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'HobbyWeatherApp/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim search failed: ${response.statusText}`);
    }

    const locations = await response.json();

    return locations.map((location: { display_name: string; lat: string; lon: string; type?: string; class?: string }) => {
      const type = this.classifyLocationType(location);
      const category = this.extractLocationCategory(location);
      
      return {
        name: location.display_name.split(',')[0], // 最初の部分を名前として使用
        lat: parseFloat(location.lat),
        lon: parseFloat(location.lon),
        type,
        address: location.display_name,
        category,
        country: 'JP',
        source: 'nominatim' as const
      };
    });
  }

  private classifyLocationType(location: { type?: string; class?: string; category?: string }): LocationType {
    const placeType = location.type || location.class;
    const category = location.category;

    // 店舗・商業施設
    if (category === 'amenity' || category === 'shop' || category === 'tourism') {
      return 'business';
    }

    // ランドマーク・観光地
    if (category === 'tourism' || category === 'historic' || category === 'leisure') {
      return 'landmark';
    }

    // 住所
    if (category === 'place' && (placeType === 'house_number' || placeType === 'postcode')) {
      return 'address';
    }

    // 都市・地域
    if (category === 'place' && (placeType === 'city' || placeType === 'town' || placeType === 'village')) {
      return 'city';
    }

    // デフォルトは住所として扱う
    return 'address';
  }

  private extractLocationCategory(location: { type?: string; class?: string; amenity?: string; leisure?: string; tourism?: string }): string | undefined {
    const amenityTypes: Record<string, string> = {
      restaurant: 'レストラン',
      cafe: 'カフェ',
      bar: 'バー',
      fast_food: 'ファストフード',
      pub: '居酒屋',
      bank: '銀行',
      hospital: '病院',
      pharmacy: '薬局',
      school: '学校',
      university: '大学',
      library: '図書館',
      museum: '博物館',
      theatre: '劇場',
      cinema: '映画館',
      park: '公園',
      playground: '遊び場',
      swimming_pool: 'プール',
      gym: 'ジム',
      hotel: 'ホテル',
      fuel: 'ガソリンスタンド',
      parking: '駐車場',
      post_office: '郵便局',
      police: '警察署',
      fire_station: '消防署'
    };

    const shopTypes: Record<string, string> = {
      supermarket: 'スーパーマーケット',
      convenience: 'コンビニ',
      clothes: '服飾店',
      electronics: '電器店',
      books: '書店',
      bakery: 'パン屋',
      beauty: '美容院',
      hairdresser: '理容室',
      bicycle: '自転車店',
      car: '自動車販売店',
      mobile_phone: '携帯電話店'
    };

    interface LocationWithTags {
      type?: string;
      class?: string;
      amenity?: string;
      leisure?: string;
      tourism?: string;
      tags?: {
        amenity?: string;
        shop?: string;
        tourism?: string;
        leisure?: string;
      };
    }

    const tags = (location as LocationWithTags).tags;
    if (tags?.amenity) {
      return amenityTypes[tags.amenity] ?? tags.amenity;
    }

    if (tags?.shop) {
      return shopTypes[tags.shop] ?? tags.shop;
    }

    if (tags?.tourism) {
      return '観光地';
    }

    if (tags?.leisure) {
      return 'レジャー施設';
    }

    return undefined;
  }

  private deduplicateLocations(locations: LocationSearchResult[]): LocationSearchResult[] {
    const seen = new Set<string>();
    const deduplicated: LocationSearchResult[] = [];

    for (const location of locations) {
      // 座標が近い場所（100m以内）は重複とみなす
      const key = `${Math.round(location.lat * 1000)},${Math.round(location.lon * 1000)}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(location);
      }
    }

    // 結果を種別と関連度で並び替え
    return deduplicated.sort((a, b) => {
      // 店舗・ランドマークを優先
      const typeOrder = { business: 0, landmark: 1, city: 2, address: 3 };
      const aOrder = typeOrder[a.type] ?? 4;
      const bOrder = typeOrder[b.type] ?? 4;
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      // 同じ種別内では名前順
      return a.name.localeCompare(b.name, 'ja');
    });
  }

  async getLocationByCoords(lat: number, lon: number): Promise<string> {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${this.apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.statusText}`);
    }

    const locations = await response.json();
    
    if (locations.length === 0) {
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }

    const location = locations[0];
    if (location) {
      return location.local_names?.ja ?? location.name ?? `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }

  getWeatherIcon(weatherType: WeatherType): string {
    const iconMap: Record<WeatherType, string> = {
      clear: '☀️',
      clouds: '☁️',
      rain: '🌧️',
      drizzle: '🌦️',
      thunderstorm: '⛈️',
      snow: '❄️',
      mist: '🌫️',
      fog: '🌫️',
      haze: '🌫️',
      dust: '💨'
    };

    return iconMap[weatherType] ?? '❓';
  }

  getWeatherDescription(weatherType: WeatherType): string {
    const descriptionMap: Record<WeatherType, string> = {
      clear: '晴れ',
      clouds: '曇り',
      rain: '雨',
      drizzle: '小雨',
      thunderstorm: '雷雨',
      snow: '雪',
      mist: '霧',
      fog: '濃霧',
      haze: 'かすみ',
      dust: '砂埃'
    };

    return descriptionMap[weatherType] ?? '不明';
  }
}

export const weatherService = new WeatherService();