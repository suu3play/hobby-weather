import React from 'react';
import type { WeatherData } from '../../types';
import { weatherService } from '../../services/weather.service';
import { useTheme } from '../../contexts/ThemeContext';

interface WeatherCardProps {
    weather: WeatherData;
    className?: string;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
    weather,
    className = '',
}) => {
    const { currentTheme } = useTheme();
    const formatTime = (date: Date | string) => {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return '--:--';
        return new Intl.DateTimeFormat('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(d);
    };

    const formatDate = (date: Date | string) => {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return '日付不明';
        return new Intl.DateTimeFormat('ja-JP', {
            month: 'short',
            day: 'numeric',
            weekday: 'short',
        }).format(d);
    };

    const getWindDirection = (degrees: number): string => {
        const directions = [
            '北',
            '北東',
            '東',
            '南東',
            '南',
            '南西',
            '西',
            '北西',
        ];
        const index = Math.round(degrees / 45) % 8;
        return directions[index] ?? '不明';
    };

    const getUVLevel = (uvIndex: number): { level: string; color: string } => {
        if (uvIndex <= 2) return { level: '弱い', color: 'text-green-600' };
        if (uvIndex <= 5) return { level: '中程度', color: 'text-yellow-600' };
        if (uvIndex <= 7) return { level: '強い', color: 'text-orange-600' };
        if (uvIndex <= 10)
            return { level: '非常に強い', color: 'text-red-600' };
        return { level: '極端', color: 'text-purple-600' };
    };

    const uvInfo = getUVLevel(weather.uvIndex);

    return (
        <div
            className={`rounded-lg shadow-md border p-6 ${className}`}
            style={{
                backgroundColor: currentTheme.colors.surface.primary,
                borderColor: currentTheme.colors.border.primary,
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3
                        className="text-lg font-semibold"
                        style={{ color: currentTheme.colors.text.primary }}
                    >
                        現在の天気
                    </h3>
                    <p
                        className="text-sm"
                        style={{ color: currentTheme.colors.text.tertiary }}
                    >
                        {formatDate(weather.datetime)}{' '}
                        {formatTime(weather.datetime)}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-3xl mb-1">
                        {weatherService.getWeatherIcon(weather.weatherType)}
                    </div>
                    <p
                        className="text-sm"
                        style={{ color: currentTheme.colors.text.secondary }}
                    >
                        {weather.weatherDescription}
                    </p>
                </div>
            </div>

            {/* Temperature */}
            <div className="mb-6">
                <div className="flex items-baseline">
                    <span
                        className="text-4xl font-bold"
                        style={{ color: currentTheme.colors.text.primary }}
                    >
                        {Math.round(weather.temperature)}
                    </span>
                    <span
                        className="text-xl ml-1"
                        style={{ color: currentTheme.colors.text.tertiary }}
                    >
                        °C
                    </span>
                </div>
                <p
                    className="text-sm mt-1"
                    style={{ color: currentTheme.colors.text.secondary }}
                >
                    体感温度 {Math.round(weather.feelsLike)}°C
                </p>
            </div>

            {/* Weather Details Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div
                    className="rounded-lg p-3"
                    style={{
                        backgroundColor:
                            currentTheme.mode === 'dark'
                                ? 'rgba(59, 130, 246, 0.1)'
                                : 'rgb(239, 246, 255)',
                    }}
                >
                    <div className="flex items-center space-x-2">
                        <span className="text-blue-600">💧</span>
                        <div>
                            <p
                                className="text-sm font-medium"
                                style={{
                                    color: currentTheme.colors.text.primary,
                                }}
                            >
                                湿度
                            </p>
                            <p className="text-lg font-semibold text-blue-700">
                                {weather.humidity}%
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    className="rounded-lg p-3"
                    style={{
                        backgroundColor:
                            currentTheme.mode === 'dark'
                                ? 'rgba(107, 114, 128, 0.1)'
                                : 'rgb(249, 250, 251)',
                    }}
                >
                    <div className="flex items-center space-x-2">
                        <span className="text-gray-600">🌬️</span>
                        <div>
                            <p
                                className="text-sm font-medium"
                                style={{
                                    color: currentTheme.colors.text.primary,
                                }}
                            >
                                風速
                            </p>
                            <p
                                className="text-lg font-semibold"
                                style={{
                                    color: currentTheme.colors.text.secondary,
                                }}
                            >
                                {weather.windSpeed.toFixed(1)} m/s
                            </p>
                            <p
                                className="text-xs"
                                style={{
                                    color: currentTheme.colors.text.tertiary,
                                }}
                            >
                                {getWindDirection(weather.windDirection)}
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    className="rounded-lg p-3"
                    style={{
                        backgroundColor:
                            currentTheme.mode === 'dark'
                                ? 'rgba(99, 102, 241, 0.1)'
                                : 'rgb(238, 242, 255)',
                    }}
                >
                    <div className="flex items-center space-x-2">
                        <span className="text-indigo-600">🌡️</span>
                        <div>
                            <p
                                className="text-sm font-medium"
                                style={{
                                    color: currentTheme.colors.text.primary,
                                }}
                            >
                                気圧
                            </p>
                            <p className="text-lg font-semibold text-indigo-700">
                                {weather.pressure} hPa
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    className="rounded-lg p-3"
                    style={{
                        backgroundColor:
                            currentTheme.mode === 'dark'
                                ? 'rgba(139, 92, 246, 0.1)'
                                : 'rgb(245, 243, 255)',
                    }}
                >
                    <div className="flex items-center space-x-2">
                        <span className="text-purple-600">👁️</span>
                        <div>
                            <p
                                className="text-sm font-medium"
                                style={{
                                    color: currentTheme.colors.text.primary,
                                }}
                            >
                                視界
                            </p>
                            <p className="text-lg font-semibold text-purple-700">
                                {weather.visibility == null || weather.visibility <= 0 ? 'データなし' : `${(weather.visibility / 1000).toFixed(1)} km`}
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    className="rounded-lg p-3"
                    style={{
                        backgroundColor:
                            currentTheme.mode === 'dark'
                                ? 'rgba(245, 158, 11, 0.1)'
                                : 'rgb(254, 252, 232)',
                    }}
                >
                    <div className="flex items-center space-x-2">
                        <span className="text-yellow-600">☁️</span>
                        <div>
                            <p
                                className="text-sm font-medium"
                                style={{
                                    color: currentTheme.colors.text.primary,
                                }}
                            >
                                雲量
                            </p>
                            <p className="text-lg font-semibold text-yellow-700">
                                {weather.cloudiness}%
                            </p>
                        </div>
                    </div>
                </div>

                {weather.uvIndex > 0 && (
                    <div
                        className="rounded-lg p-3"
                        style={{
                            backgroundColor:
                                currentTheme.mode === 'dark'
                                    ? 'rgba(249, 115, 22, 0.1)'
                                    : 'rgb(255, 247, 237)',
                        }}
                    >
                        <div className="flex items-center space-x-2">
                            <span className="text-orange-600">☀️</span>
                            <div>
                                <p
                                    className="text-sm font-medium"
                                    style={{
                                        color: currentTheme.colors.text.primary,
                                    }}
                                >
                                    UV指数
                                </p>
                                <p className="text-lg font-semibold text-orange-700">
                                    {weather.uvIndex}
                                </p>
                                <p
                                    className={`text-xs font-medium ${uvInfo.color}`}
                                >
                                    {uvInfo.level}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Cache Info */}
            <div
                className="mt-4 pt-4 border-t"
                style={{ borderColor: currentTheme.colors.border.secondary }}
            >
                <p
                    className="text-xs text-center"
                    style={{ color: currentTheme.colors.text.tertiary }}
                >
                    データ取得時刻: {formatTime(weather.cachedAt)}
                </p>
            </div>
        </div>
    );
};
