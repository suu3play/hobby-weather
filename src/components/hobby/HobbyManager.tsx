import React, { useState } from 'react';
import type { Hobby } from '../../types';
import { useHobby } from '../../hooks/useHobby';
import { useRecommendation } from '../../hooks/useRecommendation';
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
    clearError
  } = useHobby();

  const {
    filters,
    updateFilters,
    clearFilters
  } = useRecommendation();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingHobby, setEditingHobby] = useState<Hobby | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const handleCreate = async (hobbyData: Omit<Hobby, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createHobby(hobbyData);
    if (!error) {
      setViewMode('list');
    }
  };

  const handleUpdate = async (hobbyData: Omit<Hobby, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingHobby?.id) return;
    
    await updateHobby(editingHobby.id, hobbyData);
    if (!error) {
      setViewMode('list');
      setEditingHobby(null);
    }
  };

  const handleEdit = (hobby: Hobby) => {
    setEditingHobby(hobby);
    setViewMode('edit');
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">趣味管理</h1>
        <p className="text-gray-600">
          あなたの趣味と希望する天気条件を管理できます
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
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
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              + 新しい趣味を追加
            </button>
            
            <button
              onClick={refreshHobbies}
              disabled={isLoading}
              className="text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
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
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="showActiveOnly" className="text-sm text-gray-700">
                有効な趣味のみ表示
              </label>
            </div>

            <div className="text-sm text-gray-500">
              全 {hobbies.length} 件 | 有効 {activeHobbies.length} 件
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          {viewMode === 'list' && (
            <HobbyList
              hobbies={displayedHobbies}
              onEdit={handleEdit}
              onDelete={deleteHobby}
              onToggleActive={toggleHobbyActive}
              isLoading={isLoading}
            />
          )}

          {viewMode === 'create' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">新しい趣味を追加</h2>
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
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{hobbies.length}</div>
            <div className="text-sm text-blue-800">登録済み趣味</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{activeHobbies.length}</div>
            <div className="text-sm text-green-800">有効な趣味</div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {hobbies.reduce((total, hobby) => total + (hobby.preferredWeather?.length || 0), 0)}
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