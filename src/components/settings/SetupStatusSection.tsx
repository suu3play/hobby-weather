import React from 'react';
import { useInitialSetup } from '../../hooks/useInitialSetup';
import { useHobby } from '../../hooks/useHobby';
import { useWeather } from '../../hooks/useWeather';
import { useTheme } from '../../contexts/ThemeContext';

export const SetupStatusSection: React.FC = () => {
    const { setupState } = useInitialSetup();
    const { hobbies } = useHobby();
    const { location } = useWeather();
    const { currentTheme } = useTheme();

    if (!setupState) return null;

    // 場所の表示名を取得
    const getLocationDisplayName = () => {
        if (!location) return '未設定';

        const parts = [location.name];
        if (location.state) parts.push(location.state);
        if (location.country) parts.push(location.country);

        return parts.join(', ');
    };

    return (
        <>
            {/* セットアップ状態表示 */}
            <section>
                <div className="flex items-center space-x-2 mb-4">
                    <h3 className="text-lg font-medium text-text-primary">
                        セットアップ状態
                    </h3>
                    <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                            backgroundColor:
                                currentTheme.mode === 'dark'
                                    ? 'rgba(147, 51, 234, 0.2)'
                                    : 'rgb(243, 232, 255)',
                            color:
                                currentTheme.mode === 'dark'
                                    ? 'rgb(196, 181, 253)'
                                    : 'rgb(107, 33, 168)',
                        }}
                    >
                        初期設定
                    </span>
                </div>

                <div
                    className="rounded-lg p-4"
                    style={{
                        backgroundColor:
                            currentTheme.mode === 'dark'
                                ? 'rgba(107, 114, 128, 0.1)'
                                : 'rgb(249, 250, 251)',
                    }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* API Key状態 */}
                        <div
                            className="rounded-md p-3"
                            style={{
                                backgroundColor:
                                    currentTheme.colors.background.primary,
                            }}
                        >
                            <div className="flex items-center space-x-2 mb-2">
                                <span className="text-lg">🔑</span>
                                <span className="font-medium text-gray-900">
                                    API Key
                                </span>
                            </div>
                            <div
                                className={`text-sm ${
                                    setupState.hasApiKey
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                }`}
                            >
                                {setupState.hasApiKey
                                    ? '✓ 設定済み'
                                    : '✗ 未設定'}
                            </div>
                        </div>

                        {/* 場所設定状態 */}
                        <div
                            className="rounded-md p-3"
                            style={{
                                backgroundColor:
                                    currentTheme.colors.background.primary,
                            }}
                        >
                            <div className="flex items-center space-x-2 mb-2">
                                <span className="text-lg">📍</span>
                                <span className="font-medium text-gray-900">
                                    場所
                                </span>
                            </div>
                            <div
                                className={`text-sm ${
                                    setupState.hasLocation
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                }`}
                            >
                                {setupState.hasLocation
                                    ? '✓ 設定済み'
                                    : '✗ 未設定'}
                            </div>
                            {setupState.hasLocation && (
                                <div className="text-xs text-gray-500 mt-1">
                                    {getLocationDisplayName()}
                                </div>
                            )}
                        </div>

                        {/* 趣味登録状態 */}
                        <div
                            className="rounded-md p-3"
                            style={{
                                backgroundColor:
                                    currentTheme.colors.background.primary,
                            }}
                        >
                            <div className="flex items-center space-x-2 mb-2">
                                <span className="text-lg">🎨</span>
                                <span className="font-medium text-gray-900">
                                    趣味
                                </span>
                            </div>
                            <div
                                className={`text-sm ${
                                    setupState.hasHobbies
                                        ? 'text-green-600'
                                        : 'text-orange-600'
                                }`}
                            >
                                {setupState.hasHobbies
                                    ? `✓ ${hobbies.length}件登録済み`
                                    : '- 未登録（任意）'}
                            </div>
                        </div>
                    </div>

                    {/* 全体の状態 */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-sm font-medium text-gray-700">
                                    初期セットアップ状態:
                                </span>
                                <span
                                    className={`ml-2 text-sm ${
                                        setupState.isCompleted
                                            ? 'text-green-600'
                                            : 'text-orange-600'
                                    }`}
                                >
                                    {setupState.isCompleted
                                        ? '✓ 完了'
                                        : '⚠ 未完了'}
                                </span>
                            </div>

                            <div className="text-xs text-gray-500">
                                必須: API Key, 場所 | 任意: 趣味
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};
