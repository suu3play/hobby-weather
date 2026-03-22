import React, { useState } from 'react';
import type { Hobby } from '../../types';
import { useHobby } from '../../hooks/useHobby';
import { useRecommendation } from '../../hooks/useRecommendation';
import { useTheme } from '../../contexts/ThemeContext';
import { HobbyForm } from './HobbyForm';
import { HobbyList } from './HobbyList';
import { RecommendationFilters } from '../recommendation/RecommendationFilters';

type ViewMode = 'list' | 'create' | 'edit';

export const HobbyManager: React.FC = () => {
    const {
        hobbies,
        activeHobbies,
        isLoading,
        error,
        createHobby,
        updateHobby,
        deleteHobby,
        toggleHobbyActive,
        refreshHobbies,
        clearError,
    } = useHobby();

    const { filters, updateFilters, clearFilters } = useRecommendation();
    const { currentTheme } = useTheme();

    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [editingHobby, setEditingHobby] = useState<Hobby | null>(null);
    const [showActiveOnly, setShowActiveOnly] = useState(false);

    const handleCreate = async (
        hobbyData: Omit<Hobby, 'id' | 'createdAt' | 'updatedAt'>
    ) => {
        const success = await createHobby(hobbyData);
        if (success) {
            setViewMode('list');
        }
    };

    const handleUpdate = async (
        hobbyData: Omit<Hobby, 'id' | 'createdAt' | 'updatedAt'>
    ) => {
        if (!editingHobby?.id) return;

        const success = await updateHobby(editingHobby.id, hobbyData);
        if (success) {
            setViewMode('list');
            setEditingHobby(null);
        }
    };

    const handleEdit = (hobby: Hobby) => {
        setEditingHobby(hobby);
        setViewMode('edit');
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteHobby(id);
        } catch {
            // deleteHobby がエラーを useHobby の error state にセットするため、
            // ここでは再スローせず UI のエラー表示に委ねる
        }
    };

    const handleCancel = () => {
        setViewMode('list');
        setEditingHobby(null);
        clearError();
    };

    const displayedHobbies = showActiveOnly ? activeHobbies : hobbies;

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-primary mb-2">
                    趣味管理
                </h1>
                <p className="text-text-secondary">
                    あなたの趣味と希望する天気条件を管理できます
                </p>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-6 rounded-md p-4" style={{
                    backgroundColor: currentTheme.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgb(254, 242, 242)',
                    borderColor: currentTheme.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgb(254, 202, 202)',
                    borderWidth: '1px'
                }}>
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <span className="text-red-400">⚠️</span>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                エラーが発生しました
                            </h3>
                            <div className="mt-1 text-sm text-red-700">
                                {error}
                            </div>
                            <div className="mt-2">
                                <button
                                    onClick={clearError}
                                    className="text-sm underline text-red-700 hover:text-red-600"
                                >
                                    エラーを閉じる
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            {viewMode === 'list' && (
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setViewMode('create')}
                            className="text-white px-4 py-2 rounded-md transition-colors"
                            style={{
                                backgroundColor: currentTheme.mode === 'dark' ? currentTheme.colors.primary : '#2563eb'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = currentTheme.mode === 'dark' ? '#3b82f6' : '#1d4ed8';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = currentTheme.mode === 'dark' ? currentTheme.colors.primary : '#2563eb';
                            }}
                        >
                            + 新しい趣味を追加
                        </button>

                        <button
                            onClick={refreshHobbies}
                            disabled={isLoading}
                            className="text-text-tertiary hover:text-gray-800 transition-colors disabled:opacity-50"
                        >
                            🔄 更新
                        </button>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <input
                                id="showActiveOnly"
                                type="checkbox"
                                checked={showActiveOnly}
                                onChange={(e) =>
                                    setShowActiveOnly(e.target.checked)
                                }
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label
                                htmlFor="showActiveOnly"
                                className="text-sm text-text-tertiary"
                            >
                                有効な趣味のみ表示
                            </label>
                        </div>

                        <div className="text-sm text-text-tertiary">
                            全 {hobbies.length} 件 | 有効 {activeHobbies.length}{' '}
                            件
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="rounded-lg shadow-sm border" style={{
                backgroundColor: currentTheme.colors.background.primary,
                borderColor: currentTheme.mode === 'dark' ? 'rgba(75, 85, 99, 0.3)' : 'rgb(229, 231, 235)'
            }}>
                <div className="p-6">
                    {viewMode === 'list' && (
                        <HobbyList
                            hobbies={displayedHobbies}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onToggleActive={toggleHobbyActive}
                            isLoading={isLoading}
                        />
                    )}

                    {viewMode === 'create' && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">
                                新しい趣味を追加
                            </h2>
                            <HobbyForm
                                onSubmit={handleCreate}
                                onCancel={handleCancel}
                                isLoading={isLoading}
                            />
                        </div>
                    )}

                    {viewMode === 'edit' && editingHobby && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">
                                「{editingHobby.name}」を編集
                            </h2>
                            <HobbyForm
                                hobby={editingHobby}
                                onSubmit={handleUpdate}
                                onCancel={handleCancel}
                                isLoading={isLoading}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Stats */}
            {viewMode === 'list' && hobbies.length > 0 && (
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg" style={{
                        backgroundColor: currentTheme.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgb(239, 246, 255)'
                    }}>
                        <div className="text-2xl font-bold text-blue-600">
                            {hobbies.length}
                        </div>
                        <div className="text-sm text-blue-800">
                            登録済み趣味
                        </div>
                    </div>

                    <div className="p-4 rounded-lg" style={{
                        backgroundColor: currentTheme.mode === 'dark' ? 'rgba(34, 197, 94, 0.1)' : 'rgb(240, 253, 244)'
                    }}>
                        <div className="text-2xl font-bold text-green-600">
                            {activeHobbies.length}
                        </div>
                        <div className="text-sm text-green-800">有効な趣味</div>
                    </div>

                    <div className="p-4 rounded-lg" style={{
                        backgroundColor: currentTheme.mode === 'dark' ? 'rgba(107, 114, 128, 0.1)' : 'rgb(249, 250, 251)'
                    }}>
                        <div className="text-2xl font-bold text-gray-600">
                            {hobbies.reduce(
                                (total, hobby) =>
                                    total +
                                    (hobby.preferredWeather?.length || 0),
                                0
                            )}
                        </div>
                        <div className="text-sm text-gray-800">天気条件数</div>
                    </div>
                </div>
            )}

            {/* Recommendation Filters */}
            {viewMode === 'list' && hobbies.length > 0 && (
                <div className="mt-6">
                    <RecommendationFilters
                        filters={filters}
                        onFiltersChange={updateFilters}
                        onClearFilters={clearFilters}
                    />
                </div>
            )}
        </div>
    );
};
