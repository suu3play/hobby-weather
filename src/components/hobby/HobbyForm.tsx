import React, { useState, useEffect } from 'react';
import type { Hobby, WeatherCondition, TimeOfDay } from '../../types';
import { 
  WEATHER_CONDITIONS, 
  createWeatherCondition, 
  validateHobby,
  getWeatherConditionIcon,
  getWeatherConditionLabel
} from '../../hooks/useHobby';
import { HOBBY_CATEGORIES, TIME_OF_DAY_OPTIONS, type HobbySuggestion } from '../../data/hobbySuggestions';

interface HobbyFormProps {
  hobby?: Hobby;
  onSubmit: (hobby: Omit<Hobby, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const HobbyForm: React.FC<HobbyFormProps> = ({
  hobby,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    preferredWeather: [] as WeatherCondition[],
    preferredTimeOfDay: [] as TimeOfDay[],
    isActive: true,
    isOutdoor: true,
    minTemperature: undefined as number | undefined,
    maxTemperature: undefined as number | undefined
  });

  // 趣味候補選択の状態
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (hobby) {
      setFormData({
        name: hobby.name,
        description: hobby.description || '',
        preferredWeather: hobby.preferredWeather || [],
        preferredTimeOfDay: hobby.preferredTimeOfDay || [],
        isActive: hobby.isActive,
        isOutdoor: hobby.isOutdoor,
        minTemperature: hobby.minTemperature,
        maxTemperature: hobby.maxTemperature
      });
    }
  }, [hobby]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateHobby(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      preferredWeather: formData.preferredWeather,
      preferredTimeOfDay: formData.preferredTimeOfDay,
      isActive: formData.isActive,
      isOutdoor: formData.isOutdoor,
      minTemperature: formData.minTemperature,
      maxTemperature: formData.maxTemperature
    });
  };

  const addWeatherCondition = (type: string) => {
    const weatherType = type as any;
    const existing = formData.preferredWeather.find(w => w.condition === weatherType);
    
    if (existing) return;

    setFormData(prev => ({
      ...prev,
      preferredWeather: [...prev.preferredWeather, createWeatherCondition(weatherType, 5)]
    }));
  };

  const updateWeatherWeight = (index: number, weight: number) => {
    setFormData(prev => ({
      ...prev,
      preferredWeather: prev.preferredWeather.map((condition, i) =>
        i === index ? { ...condition, weight } : condition
      )
    }));
  };

  const removeWeatherCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      preferredWeather: prev.preferredWeather.filter((_, i) => i !== index)
    }));
  };

  // 趣味候補選択ハンドラー
  const selectHobbySuggestion = (suggestion: HobbySuggestion) => {
    setFormData(prev => ({
      ...prev,
      name: suggestion.name,
      isOutdoor: suggestion.isOutdoor,
      preferredWeather: suggestion.defaultWeather?.map(w => createWeatherCondition(w, 8)) || [],
      preferredTimeOfDay: suggestion.defaultTimeOfDay || [],
      description: suggestion.description || ''
    }));
    setShowSuggestions(false);
  };

  // 活動時間帯の切り替え
  const toggleTimeOfDay = (timeOfDay: TimeOfDay) => {
    setFormData(prev => ({
      ...prev,
      preferredTimeOfDay: prev.preferredTimeOfDay.includes(timeOfDay)
        ? prev.preferredTimeOfDay.filter(t => t !== timeOfDay)
        : [...prev.preferredTimeOfDay, timeOfDay]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                入力エラーがあります
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 趣味候補選択 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">趣味候補から選択</h3>
          <button
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            {showSuggestions ? '非表示' : '候補を表示'}
          </button>
        </div>

        {showSuggestions && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-600">カテゴリ選択:</label>
              <div className="flex space-x-2 mt-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    selectedCategory === '' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  すべて
                </button>
                {HOBBY_CATEGORIES.map(category => (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => setSelectedCategory(category.name)}
                    className={`px-3 py-1 text-xs rounded-full ${
                      selectedCategory === category.name 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category.icon} {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {HOBBY_CATEGORIES
                .filter(category => !selectedCategory || category.name === selectedCategory)
                .flatMap(category => category.hobbies)
                .map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectHobbySuggestion(suggestion)}
                    className="text-left p-2 rounded border hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="font-medium text-sm">{suggestion.name}</div>
                    <div className="text-xs text-gray-600 flex items-center space-x-1">
                      <span>{suggestion.categoryIcon}</span>
                      <span>{suggestion.category}</span>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          趣味名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="例: ランニング"
          maxLength={50}
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          説明
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="趣味の詳細や楽しみ方について..."
          maxLength={200}
        />
        <p className="mt-1 text-sm text-gray-500">
          {formData.description.length}/200文字
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          希望天気 <span className="text-red-500">*</span>
        </label>
        
        {/* Selected weather conditions */}
        {formData.preferredWeather.length > 0 && (
          <div className="mb-4 space-y-2">
            {formData.preferredWeather.map((condition, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <span className="text-lg">
                  {getWeatherConditionIcon(condition.condition)}
                </span>
                <span className="flex-1 text-sm font-medium">
                  {getWeatherConditionLabel(condition.condition)}
                </span>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">スコア:</label>
                  <select
                    value={condition.weight}
                    onChange={(e) => updateWeatherWeight(index, parseInt(e.target.value))}
                    className="rounded border-gray-300 text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeWeatherCondition(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add weather condition */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {WEATHER_CONDITIONS.map(({ type, label, icon }) => {
            const isSelected = formData.preferredWeather.some(w => w.condition === type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => addWeatherCondition(type)}
                disabled={isSelected}
                className={`p-3 text-center rounded-lg border-2 transition-colors ${
                  isSelected
                    ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                }`}
              >
                <div className="text-lg mb-1">{icon}</div>
                <div className="text-xs font-medium">{label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 活動時間帯選択 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          活動時間帯
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TIME_OF_DAY_OPTIONS.map((option) => {
            const isSelected = formData.preferredTimeOfDay.includes(option.key);
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => toggleTimeOfDay(option.key)}
                className={`p-3 text-center rounded-lg border-2 transition-colors ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                }`}
              >
                <div className="text-2xl mb-1">{option.icon}</div>
                <div className="text-sm font-medium">{option.label}</div>
                <div className="text-xs text-gray-600">{option.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center">
        <input
          id="isActive"
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
          この趣味を有効にする
        </label>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '保存中...' : (hobby ? '更新' : '作成')}
        </button>
      </div>
    </form>
  );
};