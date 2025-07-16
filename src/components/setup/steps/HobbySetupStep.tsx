import React, { useState, useEffect } from 'react';
import { useHobby } from '../../../hooks/useHobby';
import { HobbyForm } from '../../hobby/HobbyForm';
import type { Hobby } from '../../../types';

interface HobbySetupStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const HobbySetupStep: React.FC<HobbySetupStepProps> = ({ onComplete, onSkip }) => {
  const { hobbies, createHobby, isLoading, error, clearError } = useHobby();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // Update completed count when hobbies change
  }, [hobbies]);

  const handleCreateHobby = async (hobbyData: Omit<Hobby, 'id' | 'createdAt' | 'updatedAt'>) => {
    await createHobby(hobbyData);
    if (!error) {
      setShowForm(false);
    }
  };

  const handleAddAnother = () => {
    setShowForm(true);
    clearError();
  };

  const handleCompleteSetup = () => {
    onComplete();
  };

  const handleSkipStep = () => {
    onSkip();
  };

  const renderHobbyList = () => {
    if (hobbies.length === 0) return null;

    return (
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-3">登録済みの趣味</h3>
        <div className="space-y-2">
          {hobbies.map((hobby) => (
            <div key={hobby.id} className="flex items-center justify-between bg-white p-3 rounded-md">
              <div>
                <span className="font-medium text-gray-900">{hobby.name}</span>
                <p className="text-sm text-gray-600">{hobby.description}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  hobby.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {hobby.isActive ? '有効' : '無効'}
                </span>
                <span className="text-sm text-gray-500">
                  {hobby.preferredWeather?.length || 0} 天気条件
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎨</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">趣味登録</h2>
          <p className="text-gray-600">
            あなたの趣味を登録して、パーソナライズされた推薦を受けましょう
          </p>
        </div>

        {/* Optional Badge */}
        <div className="flex justify-center mb-6">
          <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
            オプション（後で追加可能）
          </span>
        </div>

        {/* Progress */}
        {hobbies.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <span className="text-green-400 text-xl mr-2">✅</span>
              <span className="font-medium text-green-800">
                {hobbies.length}件の趣味が登録されました
              </span>
            </div>
            <div className="text-center text-sm text-green-600">
              推薦機能がより正確になります
            </div>
          </div>
        )}

        {/* Hobby List */}
        {renderHobbyList()}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <span className="text-red-400 mr-2">⚠️</span>
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Form or Actions */}
        {!showForm ? (
          <div className="space-y-4">
            {/* Add Hobby Button */}
            <button
              onClick={handleAddAnother}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>+</span>
              <span>
                {hobbies.length === 0 ? '最初の趣味を追加' : '別の趣味を追加'}
              </span>
            </button>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleSkipStep}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                {hobbies.length === 0 ? 'スキップ' : '後で追加'}
              </button>
              
              <button
                onClick={handleCompleteSetup}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                {hobbies.length === 0 ? 'セットアップ完了' : '次へ'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">新しい趣味を追加</h3>
            <HobbyForm
              onSubmit={handleCreateHobby}
              onCancel={() => setShowForm(false)}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Benefits */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">趣味登録のメリット</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start space-x-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600">天気に応じた趣味の推薦</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600">個人の好みに合わせた提案</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600">天気条件による絞り込み</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600">季節やイベントに応じた提案</span>
            </div>
          </div>
        </div>

        {/* Help */}
        <div className="mt-6">
          <details className="text-sm text-gray-600">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
              趣味登録について
            </summary>
            <div className="mt-2 space-y-2">
              <p>• 趣味は後からいつでも追加・編集できます</p>
              <p>• 天気条件を設定すると、より正確な推薦が受けられます</p>
              <p>• 趣味が多いほど、推薦の精度が向上します</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};