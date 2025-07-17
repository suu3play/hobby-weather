import React, { useState } from 'react';
import type { HobbyRecommendation } from '../../services/recommendation.service';
import { RecommendationCard } from './RecommendationCard';
import { RecommendationDetailModal } from './RecommendationDetailModal';

// おすすめリストのプロパティ
interface RecommendationListProps {
    recommendations: HobbyRecommendation[]; // おすすめ一覧
    isLoading?: boolean; // 読み込み中フラグ
    className?: string; // CSSクラス
    onRefresh?: () => void; // 追加
    canRefresh?: boolean; // 追加
}

export const RecommendationList: React.FC<RecommendationListProps> = ({
    recommendations,
    isLoading = false,
    className = '',
    onRefresh,
    canRefresh = true,
}) => {
    const [selectedRecommendation, setSelectedRecommendation] =
        useState<HobbyRecommendation | null>(null);

    const handleViewDetails = (recommendation: HobbyRecommendation) => {
        setSelectedRecommendation(recommendation);
    };

    const handleCloseModal = () => {
        setSelectedRecommendation(null);
    };

    if (isLoading) {
        return (
            <div className={`space-y-6 ${className}`}>
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">おすすめを計算中...</p>
                </div>
            </div>
        );
    }

    if (recommendations.length === 0) {
        return (
            <div className={`text-center py-12 ${className}`}>
                <div className="text-gray-400 text-6xl mb-4">🎯</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    おすすめがありません
                </h3>
                <p className="text-gray-600 mb-4">
                    現在の条件ではおすすめできる趣味がありません。
                    <br />
                    趣味を追加するか、条件を変更してください。
                </p>
            </div>
        );
    }

    return (
        <>
            <div className={`space-y-6 ${className}`}>
                {/* ヘッダー */}
                <div className="relative mb-2">
                    {/* 推薦更新ボタン（右上） */}
                    {canRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={isLoading}
                            className="absolute right-0 top-0 bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
                        >
                            <span className="text-xs">🔄</span>
                            <span>
                                {isLoading ? '生成中...' : '推薦を更新'}
                            </span>
                        </button>
                    )}
                    {/* タイトル・説明文（中央寄せ） */}
                    <div className="flex flex-col items-center">
                        <h2 className="text-2xl font-bold text-text-primary">
                            趣味おすすめ日
                        </h2>
                        <p className="text-text-secondary">
                            天気予報に基づいて最適な趣味とタイミングを提案します。
                        </p>
                    </div>
                </div>

                {/* おすすめ一覧 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations.map((recommendation, index) => (
                        <RecommendationCard
                            key={`${recommendation.hobby.id}-${index}`}
                            recommendation={recommendation}
                            onViewDetails={handleViewDetails}
                        />
                    ))}
                </div>
            </div>

            {/* 詳細モーダル */}
            {selectedRecommendation && (
                <RecommendationDetailModal
                    recommendation={selectedRecommendation}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};
