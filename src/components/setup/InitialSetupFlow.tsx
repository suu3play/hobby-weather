import React, { useState } from 'react';
import { useInitialSetup } from '../../hooks/useInitialSetup';
import { ApiKeySetupStep } from './steps/ApiKeySetupStep';
import { LocationSetupStep } from './steps/LocationSetupStep';
import { HobbySetupStep } from './steps/HobbySetupStep';
import { CompletedSetupStep } from './steps/CompletedSetupStep';
import myLogo from '../../assets/hobbyWeather.png';

export const InitialSetupFlow: React.FC = () => {
  const { setupState, stepInfo, goToNextStep, markAsCompleted, canProceed } = useInitialSetup();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleStepComplete = () => {
    setIsAnimating(true);
    setTimeout(() => {
      goToNextStep();
      setIsAnimating(false);
    }, 300);
  };

  const handleSkipToApp = () => {
    if (canProceed()) {
      markAsCompleted();
    }
  };

  const renderCurrentStep = () => {
    switch (setupState.currentStep) {
      case 'api-key':
        return <ApiKeySetupStep onComplete={handleStepComplete} />;
      case 'location':
        return <LocationSetupStep onComplete={handleStepComplete} />;
      case 'hobbies':
        return <HobbySetupStep onComplete={handleStepComplete} onSkip={handleSkipToApp} />;
      case 'completed':
        return <CompletedSetupStep onComplete={markAsCompleted} />;
      default:
        return null;
    }
  };

  const getCurrentStepIndex = () => {
    const steps = ['api-key', 'location', 'hobbies'];
    return steps.indexOf(setupState.currentStep);
  };

  if (setupState.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">初期化中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img src={myLogo} alt="ロゴ" className="w-10 h-10" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">趣味予報</h1>
                <p className="text-sm text-gray-500">初期セットアップ</p>
              </div>
            </div>
            
            {/* Skip Button (only if can proceed) */}
            {canProceed() && setupState.currentStep !== 'completed' && (
              <button
                onClick={handleSkipToApp}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                セットアップをスキップ
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-700">セットアップ進捗</h2>
            <span className="text-sm text-gray-500">
              {setupState.currentStep === 'completed' ? stepInfo.length : getCurrentStepIndex() + 1} / {stepInfo.length}
            </span>
          </div>
          
          <div className="flex space-x-2">
            {stepInfo.map((step, index) => (
              <div key={step.step} className="flex-1">
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className={`h-2 rounded-full transition-all duration-300 ${
                      step.isCompleted || setupState.currentStep === 'completed'
                        ? 'bg-green-500' 
                        : setupState.currentStep === step.step
                        ? 'bg-blue-500'
                        : 'bg-gray-200'
                    }`} />
                  </div>
                  
                  {index < stepInfo.length - 1 && (
                    <div className="w-2 h-2 rounded-full mx-1 transition-all duration-300 bg-gray-300" />
                  )}
                </div>
                
                <div className="mt-2 text-center">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    step.isCompleted
                      ? 'bg-green-100 text-green-800'
                      : setupState.currentStep === step.step
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {step.isCompleted && '✓ '}
                    {step.title}
                    {step.isRequired && !step.isCompleted && ' *'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`transition-all duration-300 ${
          isAnimating ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
        }`}>
          {renderCurrentStep()}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © 2025 趣味予報 - 天気に基づく趣味おすすめアプリ
            </p>
            <p className="text-xs text-gray-500 mt-1">
              * 必須項目を完了すると、アプリをご利用いただけます
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};