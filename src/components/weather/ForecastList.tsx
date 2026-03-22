import React from 'react';
import type { WeatherForecast } from '../../types';
import { ForecastCard } from './ForecastCard';
import { useTheme } from '../../contexts/ThemeContext';

interface ForecastListProps {
    forecast: WeatherForecast;
    className?: string;
}

export const ForecastList: React.FC<ForecastListProps> = ({
    forecast,
    className = '',
}) => {
    const { currentTheme } = useTheme();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const formatCacheTime = (date: Date | string | null | undefined): string => {
        if (date == null) return '不明';
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return '不明';
        return new Intl.DateTimeFormat('ja-JP', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(d);
    };

    return (
        <div
            className={`rounded-lg shadow-md border ${className}`}
            style={{
                backgroundColor: currentTheme.colors.background.primary,
                borderColor: currentTheme.colors.border.primary,
            }}
        >
            {/* Header */}
            <div
                className="px-6 py-4 border-b"
                style={{
                    borderColor: currentTheme.colors.border.primary,
                }}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h3
                            className="text-lg font-semibold"
                            style={{
                                color: currentTheme.colors.text.primary,
                            }}
                        >
                            7日間の天気予報
                        </h3>
                        <p
                            className="text-sm"
                            style={{
                                color: currentTheme.colors.text.secondary,
                            }}
                        >
                            {forecast.forecasts.length}日間の詳細予報
                        </p>
                    </div>
                    <div className="text-right">
                        <p
                            className="text-xs"
                            style={{
                                color: currentTheme.colors.text.tertiary,
                            }}
                        >
                            更新: {formatCacheTime(forecast.cachedAt)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Forecast Grid */}
            <div className="p-6">
                {forecast.forecasts.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-gray-400 text-4xl mb-4">🌤️</div>
                        <h3
                            className="text-lg font-medium mb-2"
                            style={{
                                color: currentTheme.colors.text.primary,
                            }}
                        >
                            予報データがありません
                        </h3>
                        <p
                            style={{
                                color: currentTheme.colors.text.secondary,
                            }}
                        >
                            天気予報を取得できませんでした。
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                        {forecast.forecasts.map((dailyForecast) => {
                            const forecastDate = new Date(dailyForecast.date);
                            forecastDate.setHours(0, 0, 0, 0);
                            const isToday =
                                forecastDate.getTime() === today.getTime();

                            return (
                                <ForecastCard
                                    key={dailyForecast.date instanceof Date ? dailyForecast.date.toISOString() : String(dailyForecast.date)}
                                    forecast={dailyForecast}
                                    isToday={isToday}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Summary Statistics */}
            {forecast.forecasts.length > 0 && (
                <div
                    className="px-6 py-4 border-t rounded-b-lg"
                    style={{
                        backgroundColor:
                            currentTheme.mode === 'dark'
                                ? 'rgba(107, 114, 128, 0.1)'
                                : 'rgb(249, 250, 251)',
                        borderColor: currentTheme.colors.border.primary,
                    }}
                >
                    <h4
                        className="text-sm font-medium mb-3"
                        style={{
                            color: currentTheme.colors.text.primary,
                        }}
                    >
                        週間サマリー
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p
                                style={{
                                    color: currentTheme.colors.text.primary,
                                }}
                            >
                                最高気温
                            </p>
                            <p className="font-semibold text-red-600">
                                {Math.max(
                                    ...forecast.forecasts.map(
                                        (f) => f.temperature.max
                                    )
                                ).toFixed(1)}
                                °C
                            </p>
                        </div>
                        <div>
                            <p
                                style={{
                                    color: currentTheme.colors.text.primary,
                                }}
                            >
                                最低気温
                            </p>
                            <p className="font-semibold text-blue-600">
                                {Math.min(
                                    ...forecast.forecasts.map(
                                        (f) => f.temperature.min
                                    )
                                ).toFixed(1)}
                                °C
                            </p>
                        </div>
                        <div>
                            <p
                                style={{
                                    color: currentTheme.colors.text.primary,
                                }}
                            >
                                平均湿度
                            </p>
                            <p className="font-semibold text-gray-700">
                                {Math.round(
                                    forecast.forecasts.reduce(
                                        (sum, f) => sum + f.humidity,
                                        0
                                    ) / forecast.forecasts.length
                                )}
                                %
                            </p>
                        </div>
                        <div>
                            <p
                                style={{
                                    color: currentTheme.colors.text.primary,
                                }}
                            >
                                降水日数
                            </p>
                            <p className="font-semibold text-blue-700">
                                {
                                    forecast.forecasts.filter(
                                        (f) => f.pop > 0.3
                                    ).length
                                }
                                日
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
