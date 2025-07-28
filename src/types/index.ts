export interface Hobby {
  id?: number;
  name: string;
  preferredWeather?: WeatherCondition[];
  preferredTimeOfDay?: TimeOfDay[]; // 活動時間帯
  description?: string;
  isActive: boolean;
  isOutdoor?: boolean;
  minTemperature?: number;
  maxTemperature?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface WeatherCondition {
  condition: WeatherType;
  weight: number; // 1-10のスコア
}

export type WeatherType = 
  | 'clear'
  | 'clouds'
  | 'rain'
  | 'drizzle'
  | 'thunderstorm'
  | 'snow'
  | 'mist'
  | 'fog'
  | 'haze'
  | 'dust';

export type TimeOfDay = 
  | 'morning'   // 朝 (6:00-11:59)
  | 'day'       // 昼 (12:00-17:59)
  | 'evening'   // 夕 (18:00-20:59)
  | 'night';    // 夜 (21:00-5:59)

export interface WeatherData {
  id?: number;
  lat: number;
  lon: number;
  datetime: Date;
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  visibility: number;
  windSpeed: number;
  windDirection: number;
  weatherType: WeatherType;
  weatherDescription: string;
  condition: string; // 天気状況の説明文
  cloudiness: number;
  uvIndex: number;
  generatedAt: Date;
  cachedAt: Date;
}

export interface WeatherForecast {
  id?: number;
  lat: number;
  lon: number;
  current?: WeatherData;
  forecasts: DailyForecast[];
  generatedAt: Date;
  cachedAt: Date;
}

export interface DailyForecast {
  date: Date;
  temperature: {
    min: number;
    max: number;
    morning: number;
    day: number;
    evening: number;
    night: number;
  };
  feelsLike: {
    morning: number;
    day: number;
    evening: number;
    night: number;
  };
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  weatherType: WeatherType;
  weatherDescription: string;
  cloudiness: number;
  uvIndex: number;
  pop: number; // 降水確率
}

export type LocationType = 'city' | 'landmark' | 'business' | 'address';

export interface Location {
  id?: number;
  name: string;
  lat: number;
  lon: number;
  isDefault: boolean;
  type?: LocationType;
  address?: string;
  category?: string; // 店舗カテゴリ（レストラン、公園、美術館など）
  state?: string; // 都道府県/州
  country?: string; // 国
  createdAt: Date;
}

export interface LocationSearchResult {
  name: string;
  lat: number;
  lon: number;
  type: LocationType;
  address?: string;
  category?: string;
  country?: string;
  source: 'openweather' | 'nominatim';
}

export interface HobbyRecommendation {
  hobby: Hobby;
  score: number;
  overallScore: number;
  date: Date;
  weather: DailyForecast;
  reasons: string[];
}

export interface AppSettings {
  id?: number;
  temperatureUnit: 'celsius' | 'fahrenheit';
  windSpeedUnit: 'kmh' | 'mph' | 'ms';
  language: 'ja' | 'en';
  notificationsEnabled: boolean;
  cacheExpiration: number; // 時間
  updatedAt: Date;
}

// 通知タイプの再エクスポート
export * from './notification';