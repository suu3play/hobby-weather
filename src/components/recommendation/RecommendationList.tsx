import React, { useState } from 'react';
import type { HobbyRecommendation } from '../../services/recommendation.service';
import { RecommendationCard } from './RecommendationCard';
import { RecommendationDetailModal } from './RecommendationDetailModal';

// おすすめリストのプロパティ
interface RecommendationListProps {
  recommendations: HobbyRecommendation[]; // おすすめ一覧
  isLoading?: boolean; // 読み込み中フラグ
  className?: string; // CSSクラス
}

export const RecommendationList: React.FC<RecommendationListProps> = ({
  recommendations,
  isLoading = false,
  className = ''
}) => {
  const [selectedRecommendation, setSelectedRecommendation] = useState<HobbyRecommendation | null>(null);

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
          現在の条件ではおすすめできる趣味がありません。<br />
          趣味を追加するか、条件を変更してください。
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-6 ${className}`}>
        {/* ヘッダー */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">趣味おすすめ</h2>
          <p className="text-gray-600">
            天気予報に基づいて最適な趣味とタイミングを提案します
          </p>
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

        {/* サマリー */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">おすすめサマリー</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {recommendations.length}
              </div>
              <div className="text-sm text-blue-700">おすすめ趣味数</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {recommendations.filter(r => r.overallScore >= 70).length}
              </div>
              <div className="text-sm text-green-700">高スコア趣味</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(
                  recommendations.reduce((sum, r) => sum + r.overallScore, 0) / 
                  recommendations.length || 0
                )}
              </div>
              <div className="text-sm text-orange-700">平均スコア</div>
            </div>
          </div>
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