import React from 'react';
import type { Hobby } from '../../types';
import {
    getWeatherConditionIcon,
    getWeatherConditionLabel,
} from '../../hooks/useHobby';
import { useTheme } from '../../contexts/ThemeContext';

interface HobbyListProps {
    hobbies: Hobby[];
    onEdit: (hobby: Hobby) => void;
    onDelete: (id: number) => void;
    onToggleActive: (id: number) => void;
    isLoading?: boolean;
}

export const HobbyList: React.FC<HobbyListProps> = ({
    hobbies,
    onEdit,
    onDelete,
    onToggleActive,
    isLoading = false,
}) => {
    const { currentTheme } = useTheme();
    if (isLoading) {
        return (
            <div className="text-center py-8">
                <div
                    className="inline-block animate-spin rounded-full h-8 w-8 border-b-2"
                    style={{ borderColor: currentTheme.colors.primary }}
                ></div>
                <p
                    className="mt-2"
                    style={{ color: currentTheme.colors.text.secondary }}
                >
                    読み込み中...
                </p>
            </div>
        );
    }

    if (hobbies.length === 0) {
        return (
            <div className="text-center py-8">
                <div
                    className="text-6xl mb-4"
                    style={{ color: currentTheme.colors.text.tertiary }}
                >
                    🎯
                </div>
                <h3
                    className="text-lg font-medium mb-2"
                    style={{ color: currentTheme.colors.text.primary }}
                >
                    まだ趣味が登録されていません
                </h3>
                <p style={{ color: currentTheme.colors.text.secondary }}>
                    最初の趣味を追加して天気予報を楽しみましょう！
                </p>
            </div>
        );
    }

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(date);
    };

    return (
        <div className="space-y-4">
            {hobbies.map((hobby) => (
                <div
                    key={hobby.id}
                    className={`rounded-lg shadow-sm border-2 transition-all ${
                        hobby.isActive ? '' : 'opacity-60'
                    }`}
                    style={{
                        backgroundColor: currentTheme.colors.surface.primary,
                        borderColor: hobby.isActive
                            ? currentTheme.colors.primary
                            : currentTheme.colors.border.primary,
                    }}
                >
                    <div className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                    <h3
                                        className="text-lg font-semibold"
                                        style={{
                                            color: currentTheme.colors.text
                                                .primary,
                                        }}
                                    >
                                        {hobby.name}
                                    </h3>
                                    <span
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                        style={{
                                            backgroundColor: hobby.isActive
                                                ? currentTheme.mode === 'dark'
                                                    ? 'rgba(34, 197, 94, 0.1)'
                                                    : 'rgb(220, 252, 231)'
                                                : currentTheme.colors.surface
                                                      .secondary,
                                            color: hobby.isActive
                                                ? currentTheme.colors.success
                                                : currentTheme.colors.text
                                                      .tertiary,
                                        }}
                                    >
                                        {hobby.isActive ? '有効' : '無効'}
                                    </span>
                                </div>

                                {hobby.description && (
                                    <p
                                        className="mb-3"
                                        style={{
                                            color: currentTheme.colors.text
                                                .secondary,
                                        }}
                                    >
                                        {hobby.description}
                                    </p>
                                )}

                                <div className="mb-3">
                                    <h4
                                        className="text-sm font-medium mb-2"
                                        style={{
                                            color: currentTheme.colors.text
                                                .secondary,
                                        }}
                                    >
                                        希望天気:
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {hobby.preferredWeather?.map(
                                            (condition, index) => (
                                                <div
                                                    key={index}
                                                    className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-sm"
                                                    style={{
                                                        backgroundColor:
                                                            currentTheme.mode ===
                                                            'dark'
                                                                ? 'rgba(59, 130, 246, 0.1)'
                                                                : 'rgb(239, 246, 255)',
                                                        color: currentTheme
                                                            .colors.primary,
                                                    }}
                                                >
                                                    <span>
                                                        {getWeatherConditionIcon(
                                                            condition.condition
                                                        )}
                                                    </span>
                                                    <span>
                                                        {getWeatherConditionLabel(
                                                            condition.condition
                                                        )}
                                                    </span>
                                                    <span
                                                        className="text-xs px-1 rounded"
                                                        style={{
                                                            backgroundColor:
                                                                currentTheme.mode ===
                                                                'dark'
                                                                    ? 'rgba(59, 130, 246, 0.2)'
                                                                    : 'rgb(219, 234, 254)',
                                                            color: currentTheme
                                                                .colors.primary,
                                                        }}
                                                    >
                                                        {condition.weight}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                <div
                                    className="text-xs"
                                    style={{
                                        color: currentTheme.colors.text
                                            .tertiary,
                                    }}
                                >
                                    作成日: {formatDate(hobby.createdAt)}
                                    {hobby.updatedAt &&
                                        hobby.updatedAt.getTime() !==
                                            hobby.createdAt.getTime() && (
                                            <span>
                                                {' '}
                                                | 更新日:{' '}
                                                {formatDate(hobby.updatedAt)}
                                            </span>
                                        )}
                                </div>
                            </div>

                            <div className="flex flex-col space-y-2 ml-4">
                                <button
                                    onClick={() => onToggleActive(hobby.id!)}
                                    className="px-3 py-1 text-xs font-medium rounded-md transition-opacity hover:opacity-80"
                                    style={{
                                        backgroundColor: hobby.isActive
                                            ? currentTheme.mode === 'dark'
                                                ? 'rgba(245, 158, 11, 0.1)'
                                                : 'rgb(254, 243, 199)'
                                            : 'transparent',
                                        color: hobby.isActive
                                            ? currentTheme.colors.warning
                                            : currentTheme.colors.success,
                                    }}
                                >
                                    {hobby.isActive ? '無効化' : '有効化'}
                                </button>

                                <button
                                    onClick={() => onEdit(hobby)}
                                    className="px-3 py-1 text-xs font-medium rounded-md transition-opacity hover:opacity-80"
                                    style={{
                                        backgroundColor:
                                            currentTheme.mode === 'dark'
                                                ? 'rgba(59, 130, 246, 0.1)'
                                                : 'rgb(239, 246, 255)',
                                        color: currentTheme.colors.primary,
                                    }}
                                >
                                    編集
                                </button>

                                <button
                                    onClick={() => {
                                        if (
                                            window.confirm(
                                                `「${hobby.name}」を削除しますか？この操作は取り消せません。`
                                            )
                                        ) {
                                            onDelete(hobby.id!);
                                        }
                                    }}
                                    className="px-3 py-1 text-xs font-medium rounded-md transition-opacity hover:opacity-80"
                                    style={{
                                        backgroundColor:
                                            currentTheme.mode === 'dark'
                                                ? 'rgba(239, 68, 68, 0.1)'
                                                : 'rgb(254, 226, 226)',
                                        color: currentTheme.colors.error,
                                    }}
                                >
                                    削除
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
