import { useState, useEffect, useCallback } from 'react';
import type { Hobby, WeatherForecast } from '../types';
import { recommendationService, type HobbyRecommendation, type RecommendationFilters } from '../services/recommendation.service';

// おすすめ機能の状態
interface UseRecommendationState {
  recommendations: HobbyRecommendation[]; // おすすめ一覧
  isLoading: boolean; // 読み込み中フラグ
  error: string | null; // エラーメッセージ
  filters: RecommendationFilters; // フィルター条件
}

// おすすめ機能のアクション
interface UseRecommendationActions {
  generateRecommendations: (hobbies: Hobby[], forecast: WeatherForecast, customFilters?: RecommendationFilters) => Promise<void>; // おすすめ生成
  updateFilters: (filters: Partial<RecommendationFilters>) => void; // フィルター更新
  clearFilters: () => void; // フィルタークリア
  getTopRecommendations: (limit?: number) => HobbyRecommendation[]; // トップおすすめ取得
  getRecommendationsForHobby: (hobbyId: string) => HobbyRecommendation | undefined; // 趣味別おすすめ取得
  refreshRecommendations: () => Promise<void>; // おすすめ再生成
  clearError: () => void; // エラークリア
}

export function useRecommendation(): UseRecommendationState & UseRecommendationActions {
  const [state, setState] = useState<UseRecommendationState>({
    recommendations: [],
    isLoading: false,
    error: null,
    filters: {}
  });

  const [lastParams, setLastParams] = useState<{
    hobbies: Hobby[];
    forecast: WeatherForecast;
  } | null>(null);

  /**
   * おすすめを生成
   */
  const generateRecommendations = useCallback(async (hobbies: Hobby[], forecast: WeatherForecast, customFilters?: RecommendationFilters) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const filtersToUse = customFilters || state.filters;
      const recommendations = await recommendationService.generateRecommendations(
        hobbies,
        forecast,
        filtersToUse
      );

      setState(prev => ({
        ...prev,
        recommendations,
        isLoading: false
      }));

      setLastParams({ hobbies, forecast });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '推薦の生成に失敗しました',
        isLoading: false
      }));
    }
  }, []); // 依存関係を削除してuseCallback内でstateを参照

  /**
   * フィルターを更新
   */
  const updateFilters = useCallback((newFilters: Partial<RecommendationFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters }
    }));
  }, []);

  /**
   * フィルターをクリア
   */
  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: {}
    }));
  }, []);

  /**
   * トップ推薦を取得
   */
  const getTopRecommendations = useCallback((limit: number = 5): HobbyRecommendation[] => {
    return state.recommendations
      .filter(rec => rec.recommendedDays.length > 0)
      .slice(0, limit);
  }, [state.recommendations]);

  /**
   * 特定の趣味の推薦を取得
   */
  const getRecommendationsForHobby = useCallback((hobbyId: string): HobbyRecommendation | undefined => {
    return state.recommendations.find(rec => rec.hobby.id === hobbyId);
  }, [state.recommendations]);

  /**
   * 推薦を再生成
   */
  const refreshRecommendations = useCallback(async () => {
    if (!lastParams) return;
    
    await generateRecommendations(lastParams.hobbies, lastParams.forecast, state.filters);
  }, [lastParams, state.filters]);

  /**
   * エラーをクリア
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // フィルター変更時に自動再生成
  useEffect(() => {
    if (lastParams && !state.isLoading) {
      generateRecommendations(lastParams.hobbies, lastParams.forecast, state.filters);
    }
  }, [state.filters]); // generateRecommendationsとlastParamsの依存関係を削除

  return {
    ...state,
    generateRecommendations,
    updateFilters,
    clearFilters,
    getTopRecommendations,
    getRecommendationsForHobby,
    refreshRecommendations,
    clearError
  };
}