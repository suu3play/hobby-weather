import React, { useState } from 'react';
import type { RecommendationFilters as RecommendationFiltersType } from '../../services/recommendation.service';
import type { WeatherType } from '../../types';
import { useTheme } from '../../hooks/useTheme';

interface RecommendationFiltersProps {
    filters: RecommendationFiltersType;
    onFiltersChange: (filters: Partial<RecommendationFiltersType>) => void;
    onClearFilters: () => void;
    className?: string;
}

const WEATHER_TYPE_OPTIONS: {
    value: WeatherType;
    label: string;
    icon: string;
}[] = [
    { value: 'clear', label: '晴れ', icon: '☀️' },
    { value: 'clouds', label: '曇り', icon: '☁️' },
    { value: 'rain', label: '雨', icon: '🌧️' },
    { value: 'snow', label: '雪', icon: '❄️' },
    { value: 'drizzle', label: '小雨', icon: '🌦️' },
    { value: 'thunderstorm', label: '雷雨', icon: '⛈️' },
    { value: 'mist', label: '霧', icon: '🌫️' },
    { value: 'fog', label: '濃霧', icon: '🌫️' },
];

export const RecommendationFilters: React.FC<RecommendationFiltersProps> = ({
    filters,
    onFiltersChange,
    onClearFilters,
    className = '',
}) => {
    const { currentTheme } = useTheme();
    const [isExpanded, setIsExpanded] = useState(false);

    const handleMinScoreChange = (value: string) => {
        const minScore = value ? parseFloat(value) : undefined;
        const update: Partial<RecommendationFiltersType> = {};
        if (minScore !== undefined) {
            update.minScore = minScore;
        }
        onFiltersChange(update);
    };

    const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
        if (!value) {
            if (field === 'start') {
                const update: Partial<RecommendationFiltersType> = {};
                if (filters.dateRange?.end) {
                    update.dateRange = {
                        start: new Date(),
                        end: filters.dateRange.end,
                    };
                }
                onFiltersChange(update);
            } else {
                const update: Partial<RecommendationFiltersType> = {};
                if (filters.dateRange?.start) {
                    update.dateRange = {
                        start: filters.dateRange.start,
                        end: new Date(),
                    };
                }
                onFiltersChange(update);
            }
            return;
        }

        const date = new Date(value);
        const currentRange = filters.dateRange || {
            start: new Date(),
            end: new Date(),
        };

        onFiltersChange({
            dateRange: {
                ...currentRange,
                [field]: date,
            },
        });
    };

    const handleWeatherTypeToggle = (weatherType: WeatherType) => {
        const currentTypes = filters.weatherTypes ?? [];
        const newTypes = currentTypes.includes(weatherType)
            ? currentTypes.filter((type) => type !== weatherType)
            : [...currentTypes, weatherType];

        const update: Partial<RecommendationFiltersType> = {};
        if (newTypes.length > 0) {
            update.weatherTypes = newTypes;
        }
        onFiltersChange(update);
    };

    const handleDayFilterChange = (
        filter: 'excludeWeekends' | 'excludeWeekdays'
    ) => {
        onFiltersChange({
            [filter]: !filters[filter],
        });
    };

    const hasActiveFilters = Object.keys(filters).length > 0;

    const formatDateForInput = (date?: Date): string => {
        if (!date) return '';
        const isoString = date.toISOString();
        return isoString.split('T')[0] ?? '';
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
                    <div className="flex items-center space-x-2">
                        <h3
                            className="text-lg font-semibold"
                            style={{
                                color: currentTheme.colors.text.primary,
                            }}
                        >
                            フィルター
                        </h3>
                        {hasActiveFilters && (
                            <span
                                className="text-xs px-2 py-1 rounded-full"
                                style={{
                                    backgroundColor:
                                        currentTheme.mode === 'dark'
                                            ? 'rgba(59, 130, 246, 0.2)'
                                            : 'rgb(219, 234, 254)',
                                    color:
                                        currentTheme.mode === 'dark'
                                            ? 'rgb(147, 197, 253)'
                                            : 'rgb(30, 64, 175)',
                                }}
                            >
                                適用中
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        {hasActiveFilters && (
                            <button
                                onClick={onClearFilters}
                                className="text-sm underline transition-colors"
                                style={{
                                    color: currentTheme.colors.text.secondary,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color =
                                        currentTheme.colors.text.primary;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color =
                                        currentTheme.colors.text.secondary;
                                }}
                            >
                                クリア
                            </button>
                        )}
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                            {isExpanded ? '閉じる' : '詳細設定'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Filters */}
            <div className="px-6 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Min Score */}
                    <div>
                        <label
                            htmlFor="min-score"
                            className="block text-sm font-medium mb-1"
                            style={{
                                color: currentTheme.colors.text.secondary,
                            }}
                        >
                            最小スコア
                        </label>
                        <select
                            id="min-score"
                            value={filters.minScore || ''}
                            onChange={(e) =>
                                handleMinScoreChange(e.target.value)
                            }
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        >
                            <option value="">すべて</option>
                            <option value="70">70点以上</option>
                            <option value="60">60点以上</option>
                            <option value="50">50点以上</option>
                            <option value="40">40点以上</option>
                        </select>
                    </div>

                    {/* Weather Type Quick Filter */}
                    <div>
                        <label
                            className="block text-sm font-medium mb-1"
                            style={{
                                color: currentTheme.colors.text.secondary,
                            }}
                        >
                            天気
                        </label>
                        <div className="flex flex-wrap gap-1">
                            {WEATHER_TYPE_OPTIONS.slice(0, 3).map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() =>
                                        handleWeatherTypeToggle(option.value)
                                    }
                                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                                        filters.weatherTypes?.includes(
                                            option.value
                                        )
                                            ? 'bg-blue-100 border-blue-300 text-blue-800'
                                            : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    {option.icon} {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Day Type Filter */}
                    <div>
                        <label
                            className="block text-sm font-medium mb-1"
                            style={{
                                color: currentTheme.colors.text.secondary,
                            }}
                        >
                            曜日
                        </label>
                        <div className="space-y-1">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={!!filters.excludeWeekends}
                                    onChange={() =>
                                        handleDayFilterChange('excludeWeekends')
                                    }
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span
                                    className="ml-2 text-sm"
                                    style={{
                                        color: currentTheme.colors.text
                                            .secondary,
                                    }}
                                >
                                    週末を除外
                                </span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={!!filters.excludeWeekdays}
                                    onChange={() =>
                                        handleDayFilterChange('excludeWeekdays')
                                    }
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span
                                    className="ml-2 text-sm"
                                    style={{
                                        color: currentTheme.colors.text
                                            .secondary,
                                    }}
                                >
                                    平日を除外
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Active Filters Count */}
                    <div className="flex items-center justify-center">
                        <div className="text-center">
                            <div
                                className="text-2xl font-bold"
                                style={{
                                    color: currentTheme.colors.text.secondary,
                                }}
                            >
                                {Object.keys(filters).length}
                            </div>
                            <div
                                className="text-xs"
                                style={{
                                    color: currentTheme.colors.text.secondary,
                                }}
                            >
                                適用中
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded Filters */}
            {isExpanded && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="space-y-6">
                        {/* Date Range */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3">
                                期間設定
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label
                                        htmlFor="start-date"
                                        className="block text-sm text-gray-700 mb-1"
                                    >
                                        開始日
                                    </label>
                                    <input
                                        id="start-date"
                                        type="date"
                                        value={formatDateForInput(
                                            filters.dateRange?.start
                                        )}
                                        onChange={(e) =>
                                            handleDateRangeChange(
                                                'start',
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="end-date"
                                        className="block text-sm text-gray-700 mb-1"
                                    >
                                        終了日
                                    </label>
                                    <input
                                        id="end-date"
                                        type="date"
                                        value={formatDateForInput(
                                            filters.dateRange?.end
                                        )}
                                        onChange={(e) =>
                                            handleDateRangeChange(
                                                'end',
                                                e.target.value
                                            )
                                        }
                                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* All Weather Types */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-3">
                                天気条件
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {WEATHER_TYPE_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() =>
                                            handleWeatherTypeToggle(
                                                option.value
                                            )
                                        }
                                        className={`text-sm px-3 py-2 rounded border transition-colors ${
                                            filters.weatherTypes?.includes(
                                                option.value
                                            )
                                                ? 'bg-blue-100 border-blue-300 text-blue-800'
                                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <span className="mr-2">
                                            {option.icon}
                                        </span>
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
