import React, { useEffect } from 'react';
import { useRecommendation } from '../../hooks/useRecommendation';
import { useHobby } from '../../hooks/useHobby';
import { useWeather } from '../../hooks/useWeather';
import { RecommendationList } from './RecommendationList';

export const RecommendationDashboard: React.FC = () => {
    const { hobbies } = useHobby();
    const { forecast, location } = useWeather();
    const {
        recommendations,
        isLoading,
        error,
        generateRecommendations,
        clearError,
    } = useRecommendation();

    // 趣味と天気予報が揃ったら自動でおすすめを生成
    useEffect(() => {
        if (hobbies.length > 0 && forecast) {
            generateRecommendations(hobbies, forecast);
        }
    }, [hobbies, forecast, generateRecommendations]);

    const handleRefresh = () => {
        if (hobbies.length > 0 && forecast) {
            generateRecommendations(hobbies, forecast);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <span className="text-red-400">⚠️</span>
                        </div>
                        <div className="ml-3 flex-1">
                            <h3 className="text-sm font-medium text-red-800">
                                推薦の生成に失敗しました
                            </h3>
                            <div className="mt-1 text-sm text-red-700">
                                {error}
                            </div>
                            <div className="mt-2 flex space-x-2">
                                <button
                                    onClick={clearError}
                                    className="text-sm underline text-red-700 hover:text-red-600"
                                >
                                    エラーを閉じる
                                </button>
                                <button
                                    onClick={handleRefresh}
                                    className="text-sm underline text-red-700 hover:text-red-600"
                                >
                                    再試行
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Prerequisites Check */}
            {(!location || !forecast || hobbies.length === 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <span className="text-yellow-400">ℹ️</span>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                                推薦を生成するための準備
                            </h3>
                            <div className="mt-1 text-sm text-yellow-700">
                                <ul className="list-disc list-inside space-y-1">
                                    {!location && (
                                        <li>場所を選択してください</li>
                                    )}
                                    {!forecast && (
                                        <li>天気予報を取得してください</li>
                                    )}
                                    {hobbies.length === 0 && (
                                        <li>趣味を登録してください</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recommendations */}
            <RecommendationList
                recommendations={recommendations}
                isLoading={isLoading}
            />

            {/* Help Section */}
            {recommendations.length === 0 &&
                !isLoading &&
                location &&
                forecast &&
                hobbies.length > 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-6xl mb-4">💡</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            推薦のヒント
                        </h3>
                        <div className="text-gray-600 space-y-2 max-w-md mx-auto">
                            <p>・趣味の天気設定や気温範囲を確認してください</p>
                            <p>・フィルター条件が厳しすぎる可能性があります</p>
                            <p>・予報期間中に適した条件がないかもしれません</p>
                        </div>
                    </div>
                )}
        </div>
    );
};
