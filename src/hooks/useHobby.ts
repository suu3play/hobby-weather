import { useState, useEffect, useCallback } from 'react';
import { databaseService } from '../services/database.service';
import type { Hobby, WeatherCondition, WeatherType } from '../types';

interface UseHobbyState {
  hobbies: Hobby[];
  activeHobbies: Hobby[];
  isLoading: boolean;
  error: string | null;
}

interface UseHobbyReturn extends UseHobbyState {
  createHobby: (hobby: Omit<Hobby, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateHobby: (id: number, changes: Partial<Hobby>) => Promise<void>;
  deleteHobby: (id: number) => Promise<void>;
  toggleHobbyActive: (id: number) => Promise<void>;
  refreshHobbies: () => Promise<void>;
  clearError: () => void;
}

export const useHobby = (): UseHobbyReturn => {
  const [state, setState] = useState<UseHobbyState>({
    hobbies: [],
    activeHobbies: [],
    isLoading: false,
    error: null,
  });

  const updateState = useCallback((updates: Partial<UseHobbyState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const loadHobbies = useCallback(async () => {
    updateState({ isLoading: true, error: null });

    try {
      const [allHobbies, activeHobbies] = await Promise.all([
        databaseService.getAllHobbies(),
        databaseService.getActiveHobbies()
      ]);

      updateState({
        hobbies: allHobbies,
        activeHobbies,
        isLoading: false
      });
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : '趣味の読み込みに失敗しました',
        isLoading: false
      });
    }
  }, [updateState]);

  const createHobby = useCallback(async (hobbyData: Omit<Hobby, 'id' | 'createdAt' | 'updatedAt'>) => {
    updateState({ isLoading: true, error: null });

    try {
      await databaseService.createHobby(hobbyData);
      await loadHobbies();
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : '趣味の作成に失敗しました',
      });
    } finally {
      updateState({ isLoading: false });
    }
  }, [updateState, loadHobbies]);

  const updateHobby = useCallback(async (id: number, changes: Partial<Hobby>) => {
    updateState({ isLoading: true, error: null });

    try {
      await databaseService.updateHobby(id, changes);
      await loadHobbies();
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : '趣味の更新に失敗しました',
      });
    } finally {
      updateState({ isLoading: false });
    }
  }, [updateState, loadHobbies]);

  const deleteHobby = useCallback(async (id: number) => {
    updateState({ isLoading: true, error: null });

    try {
      await databaseService.deleteHobby(id);
      await loadHobbies();
    } catch (error) {
      updateState({
        error: error instanceof Error ? error.message : '趣味の削除に失敗しました',
      });
    } finally {
      updateState({ isLoading: false });
    }
  }, [updateState, loadHobbies]);

  const toggleHobbyActive = useCallback(async (id: number) => {
    let hobby: Hobby | undefined;
    setState(prev => {
      hobby = prev.hobbies.find(h => h.id === id);
      return prev;
    });

    if (!hobby) {
      updateState({ error: '趣味が見つかりません' });
      return;
    }

    await updateHobby(id, { isActive: !hobby.isActive });
  }, [updateHobby, updateState]);

  const refreshHobbies = useCallback(async () => {
    await loadHobbies();
  }, [loadHobbies]);

  // Load hobbies on mount
  useEffect(() => {
    loadHobbies();
  }, [loadHobbies]);

  return {
    ...state,
    createHobby,
    updateHobby,
    deleteHobby,
    toggleHobbyActive,
    refreshHobbies,
    clearError
  };
};

// Weather condition utilities
export const WEATHER_CONDITIONS: Array<{ type: WeatherType; label: string; icon: string }> = [
  { type: 'clear', label: '晴れ', icon: '☀️' },
  { type: 'clouds', label: '曇り', icon: '☁️' },
  { type: 'rain', label: '雨', icon: '🌧️' },
  { type: 'drizzle', label: '小雨', icon: '🌦️' },
  { type: 'thunderstorm', label: '雷雨', icon: '⛈️' },
  { type: 'snow', label: '雪', icon: '❄️' },
  { type: 'mist', label: '霧', icon: '🌫️' },
  { type: 'fog', label: '濃霧', icon: '🌫️' },
  { type: 'haze', label: 'かすみ', icon: '🌫️' },
  { type: 'dust', label: '砂埃', icon: '💨' }
];

export const createWeatherCondition = (type: WeatherType, weight: number = 5): WeatherCondition => ({
  condition: type,
  weight: Math.max(1, Math.min(10, weight)) // Ensure weight is between 1-10
});

export const getWeatherConditionLabel = (type: WeatherType): string => {
  return WEATHER_CONDITIONS.find(c => c.type === type)?.label || type;
};

export const getWeatherConditionIcon = (type: WeatherType): string => {
  return WEATHER_CONDITIONS.find(c => c.type === type)?.icon || '❓';
};

export const validateHobby = (hobby: Partial<Hobby>): string[] => {
  const errors: string[] = [];

  if (!hobby.name || hobby.name.trim().length === 0) {
    errors.push('趣味名は必須です');
  }

  if (hobby.name && hobby.name.trim().length > 50) {
    errors.push('趣味名は50文字以内で入力してください');
  }

  if (hobby.description && hobby.description.length > 200) {
    errors.push('説明は200文字以内で入力してください');
  }

  if (!hobby.preferredWeather || hobby.preferredWeather.length === 0) {
    errors.push('希望天気を少なくとも1つ選択してください');
  }

  if (hobby.preferredWeather) {
    hobby.preferredWeather.forEach((condition, index) => {
      if (typeof condition === 'object' && (condition.weight < 1 || condition.weight > 10)) {
        errors.push(`天気条件${index + 1}のスコアは1-10の範囲で設定してください`);
      }
    });
  }

  return errors;
};