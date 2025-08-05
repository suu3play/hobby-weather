import React from 'react';
import type { DailyForecast } from '../../types';
import { weatherService } from '../../services/weather.service';
import { useTheme } from '../../hooks/useTheme';

interface ForecastCardProps {
    forecast: DailyForecast;
    isToday?: boolean;
}

export const ForecastCard: React.FC<ForecastCardProps> = ({
    forecast,
    isToday = false,
}) => {
    const { currentTheme } = useTheme();
    const formatDate = (date: Date) => {
        if (isToday) return '今日';

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (date.toDateString() === tomorrow.toDateString()) return '明日';

        return new Intl.DateTimeFormat('ja-JP', {
            month: 'short',
            day: 'numeric',
            weekday: 'short',
        }).format(date);
    };

    const getPrecipitationColor = (pop: number): string => {
        if (pop === 0) return '';
        if (pop <= 20) return 'text-blue-400';
        if (pop <= 40) return 'text-blue-500';
        if (pop <= 60) return 'text-blue-600';
        if (pop <= 80) return 'text-blue-700';
        return 'text-blue-800';
    };

    return (
        <div
            className="rounded-lg border-2 p-4 transition-all hover:shadow-md"
            style={{
                backgroundColor: isToday
                    ? currentTheme.mode === 'dark'
                        ? 'rgba(59, 130, 246, 0.1)'
                        : 'rgb(239, 246, 255)'
                    : currentTheme.colors.background.primary,
                borderColor: isToday
                    ? currentTheme.mode === 'dark'
                        ? 'rgba(59, 130, 246, 0.5)'
                        : 'rgb(147, 197, 253)'
                    : currentTheme.colors.border.primary,
                color: currentTheme.colors.text.primary,
            }}
        >
            {/* Date */}
            <div className="text-center mb-3">
                <h4
                    className="font-semibold"
                    style={{ color: currentTheme.colors.text.primary }}
                >
                    {formatDate(forecast.date)}
                </h4>
                <p
                    className="text-xs "
                    style={{ color: currentTheme.colors.text.secondary }}
                >
                    {new Intl.DateTimeFormat('ja-JP', {
                        month: 'numeric',
                        day: 'numeric',
                    }).format(forecast.date)}
                </p>
            </div>

            {/* Weather Icon and Description */}
            <div className="text-center mb-3">
                <div className="text-3xl mb-2">
                    {weatherService.getWeatherIcon(forecast.weatherType)}
                </div>
                <p
                    className="text-sm leading-tight"
                    style={{ color: currentTheme.colors.text.secondary }}
                >
                    {forecast.weatherDescription}
                </p>
            </div>

            {/* Temperature */}
            <div className="text-center mb-3 ">
                <div className="flex justify-center items-baseline space-x-1">
                    <span
                        className="text-xl font-bold"
                        style={{ color: currentTheme.colors.text.primary }}
                    >
                        {Math.round(forecast.temperature.max)}°
                    </span>
                    <span
                        className="text-sm "
                        style={{ color: currentTheme.colors.text.secondary }}
                    >
                        {Math.round(forecast.temperature.min)}°
                    </span>
                </div>
                <p
                    className="text-xs  mt-1"
                    style={{ color: currentTheme.colors.text.secondary }}
                >
                    最高/最低
                </p>
            </div>

            {/* Precipitation */}
            {forecast.pop > 0 && (
                <div className="text-center mb-3">
                    <div
                        className={`text-sm font-medium ${getPrecipitationColor(
                            forecast.pop
                        )}`}
                    >
                        {Math.round(forecast.pop * 100)}%
                    </div>
                    <p
                        className="text-xs "
                        style={{ color: currentTheme.colors.text.secondary }}
                    >
                        降水確率
                    </p>
                </div>
            )}

            {/* Additional Info */}
            <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                    <span style={{ color: currentTheme.colors.text.secondary }}>
                        湿度
                    </span>
                    <span className="font-medium">{forecast.humidity}%</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                    <span style={{ color: currentTheme.colors.text.secondary }}>
                        風速
                    </span>
                    <span className="font-medium">
                        {forecast.windSpeed.toFixed(1)} m/s
                    </span>
                </div>

                {forecast.uvIndex > 0 && (
                    <div className="flex justify-between items-center text-xs">
                        <span
                            style={{
                                color: currentTheme.colors.text.secondary,
                            }}
                        >
                            UV指数
                        </span>
                        <span className="font-medium">
                            {forecast.uvIndex.toFixed(1)}
                        </span>
                    </div>
                )}
            </div>

            {/* Time-specific temperatures */}
            <div
                className="mt-3 pt-3 border-t"
                style={{
                    borderColor: currentTheme.colors.border.primary,
                }}
            >
                <div className="grid grid-cols-4 gap-1 text-xs">
                    <div className="text-center">
                        <p
                            style={{
                                color: currentTheme.colors.text.secondary,
                            }}
                        >
                            朝
                        </p>
                        <p className="font-medium">
                            {Math.round(forecast.temperature.morning)}°
                        </p>
                    </div>
                    <div className="text-center">
                        <p
                            style={{
                                color: currentTheme.colors.text.secondary,
                            }}
                        >
                            昼
                        </p>
                        <p className="font-medium">
                            {Math.round(forecast.temperature.day)}°
                        </p>
                    </div>
                    <div className="text-center">
                        <p
                            style={{
                                color: currentTheme.colors.text.secondary,
                            }}
                        >
                            夕
                        </p>
                        <p className="font-medium">
                            {Math.round(forecast.temperature.evening)}°
                        </p>
                    </div>
                    <div className="text-center">
                        <p
                            style={{
                                color: currentTheme.colors.text.secondary,
                            }}
                        >
                            夜
                        </p>
                        <p className="font-medium">
                            {Math.round(forecast.temperature.night)}°
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
