import { useState, useEffect, useCallback } from 'react';
import { useHobby } from './useHobby';
import { useWeather } from './useWeather';

export interface InitialSetupState {
  hasHobbies: boolean;
  hasLocation: boolean;
  hasApiKey: boolean;
  isCompleted: boolean;
  isLoading: boolean;
  currentStep: SetupStep;
}

export type SetupStep = 'api-key' | 'location' | 'hobbies' | 'completed';

export interface SetupStepInfo {
  step: SetupStep;
  title: string;
  description: string;
  isCompleted: boolean;
  isRequired: boolean;
}

export const useInitialSetup = () => {
  const { hobbies, isLoading: hobbiesLoading } = useHobby();
  const { location, isLoading: weatherLoading } = useWeather();
  
  const [setupState, setSetupState] = useState<InitialSetupState>({
    hasHobbies: false,
    hasLocation: false,
    hasApiKey: false,
    isCompleted: false,
    isLoading: true,
    currentStep: 'api-key'
  });

  // API Key設定状態を確認
  const checkApiKeySettings = (): boolean => {
    try {
      const savedSettings = localStorage.getItem('hobby-weather-api-settings');
      if (!savedSettings) return false;
      
      const parsed = JSON.parse(savedSettings);
      return !!(parsed.openWeatherApiKey && parsed.openWeatherApiKey.trim());
    } catch (error) {
      console.error('Failed to check API key settings:', error);
      return false;
    }
  };

  // 初期設定状態を更新
  const updateSetupState = useCallback(() => {
    const hasApiKey = checkApiKeySettings();
    const hasLocation = !!location;
    const hasHobbies = hobbies.length > 0;

    // ローカルストレージから完了状態を確認
    const setupCompleted = localStorage.getItem('hobby-weather-setup-completed') === 'true';

    // 完了状態の判定（API Keyと場所は必須、趣味は推奨）
    const isCompleted = setupCompleted || (hasApiKey && hasLocation);

    // 現在のステップを決定
    let currentStep: SetupStep = 'completed';
    if (isCompleted) {
      currentStep = 'completed';
    } else if (!hasApiKey) {
      currentStep = 'api-key';
    } else if (!hasLocation) {
      currentStep = 'location';
    } else if (!hasHobbies) {
      currentStep = 'hobbies';
    }

    setSetupState({
      hasHobbies,
      hasLocation,
      hasApiKey,
      isCompleted,
      isLoading: hobbiesLoading || weatherLoading,
      currentStep
    });
  }, [hobbies, location, hobbiesLoading, weatherLoading]);

  // 初期化時とデータ変更時に設定状態を更新
  useEffect(() => {
    if (!hobbiesLoading && !weatherLoading) {
      updateSetupState();
    }
  }, [hobbies, location, hobbiesLoading, weatherLoading, updateSetupState]);

  // ステップ情報を取得
  const getStepInfo = (): SetupStepInfo[] => {
    return [
      {
        step: 'api-key',
        title: 'API Key設定',
        description: '天気情報を取得するためのAPI Keyを設定してください',
        isCompleted: setupState.hasApiKey,
        isRequired: true
      },
      {
        step: 'location',
        title: '場所設定',
        description: '天気予報を取得する場所を設定してください',
        isCompleted: setupState.hasLocation,
        isRequired: true
      },
      {
        step: 'hobbies',
        title: '趣味登録',
        description: 'あなたの趣味を登録してパーソナライズされた推薦を受けましょう',
        isCompleted: setupState.hasHobbies,
        isRequired: false
      }
    ];
  };

  // 次のステップに進む
  const goToNextStep = () => {
    const steps: SetupStep[] = ['api-key', 'location', 'hobbies', 'completed'];
    const currentIndex = steps.indexOf(setupState.currentStep);
    
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      setSetupState(prev => ({ ...prev, currentStep: nextStep as SetupStep }));
    }
  };

  // 特定のステップに移動
  const goToStep = (step: SetupStep) => {
    setSetupState(prev => ({ ...prev, currentStep: step }));
  };

  // セットアップ完了をマーク
  const markAsCompleted = () => {
    // ローカルストレージに完了フラグを保存
    localStorage.setItem('hobby-weather-setup-completed', 'true');
    
    // 状態を強制的に更新
    setSetupState(prev => ({ 
      ...prev, 
      isCompleted: true,
      currentStep: 'completed'
    }));
  };

  // セットアップ状態を再確認
  const refreshSetupState = () => {
    updateSetupState();
  };

  // 必須ステップが完了しているかチェック
  const canProceed = (): boolean => {
    return setupState.hasApiKey && setupState.hasLocation;
  };

  return {
    setupState,
    stepInfo: getStepInfo(),
    goToNextStep,
    goToStep,
    markAsCompleted,
    refreshSetupState,
    canProceed
  };
};