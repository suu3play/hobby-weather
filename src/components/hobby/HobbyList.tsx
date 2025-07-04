import React from 'react';
import type { Hobby } from '../../types';
import { getWeatherConditionIcon, getWeatherConditionLabel } from '../../hooks/useHobby';

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
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (hobbies.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 text-6xl mb-4">🎯</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">まだ趣味が登録されていません</h3>
        <p className="text-gray-600">最初の趣味を追加して天気予報を楽しみましょう！</p>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-4">
      {hobbies.map((hobby) => (
        <div
          key={hobby.id}
          className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
            hobby.isActive ? 'border-blue-200' : 'border-gray-200 opacity-60'
          }`}
        >
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {hobby.name}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      hobby.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {hobby.isActive ? '有効' : '無効'}
                  </span>
                </div>

                {hobby.description && (
                  <p className="text-gray-600 mb-3">{hobby.description}</p>
                )}

                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">希望天気:</h4>
                  <div className="flex flex-wrap gap-2">
                    {hobby.preferredWeather?.map((condition, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center space-x-1 bg-blue-50 text-blue-800 px-2 py-1 rounded-md text-sm"
                      >
                        <span>{getWeatherConditionIcon(condition.condition)}</span>
                        <span>{getWeatherConditionLabel(condition.condition)}</span>
                        <span className="text-xs bg-blue-200 px-1 rounded">
                          {condition.weight}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  作成日: {formatDate(hobby.createdAt)}
                  {hobby.updatedAt && hobby.updatedAt.getTime() !== hobby.createdAt.getTime() && (
                    <span> | 更新日: {formatDate(hobby.updatedAt)}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={() => onToggleActive(hobby.id!)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    hobby.isActive
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {hobby.isActive ? '無効化' : '有効化'}
                </button>
                
                <button
                  onClick={() => onEdit(hobby)}
                  className="px-3 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                >
                  編集
                </button>
                
                <button
                  onClick={() => {
                    if (window.confirm(`「${hobby.name}」を削除しますか？この操作は取り消せません。`)) {
                      onDelete(hobby.id!);
                    }
                  }}
                  className="px-3 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
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