import React, { useState } from 'react';
import { useInitialSetup } from '../../hooks/useInitialSetup';
import { useTheme } from '../../hooks/useTheme';

export const SetupResetSection: React.FC = () => {
    const { refreshSetupState } = useInitialSetup();
    const { currentTheme } = useTheme();
    const [isResetting, setIsResetting] = useState(false);
    const [resetMessage, setResetMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    // セットアップ情報をリセット
    const resetSetupInfo = async () => {
        setIsResetting(true);
        setResetMessage(null);

        try {
            // 確認ダイアログを表示
            const confirmed = window.confirm(
                'セットアップ情報をリセットしますか？\n\n' +
                    '以下の設定が削除されます：\n' +
                    '• 初期セットアップ完了フラグ\n' +
                    '• API Key設定\n' +
                    '• 場所設定\n' +
                    '• 趣味データ\n\n' +
                    '次回起動時に初期セットアップから開始されます。'
            );

            if (!confirmed) {
                setIsResetting(false);
                return;
            }

            // ローカルストレージの設定をクリア
            localStorage.removeItem('hobby-weather-setup-completed');
            localStorage.removeItem('hobby-weather-api-settings');

            // IndexedDBのデータをクリア
            const { db } = await import('../../data/database');
            await db.hobbies.clear();
            await db.locations.clear();
            await db.weatherData.clear();
            await db.weatherForecasts.clear();

            setResetMessage({
                type: 'success',
                text: 'セットアップ情報をリセットしました。ページを再読み込みすると初期セットアップが開始されます。',
            });

            // 状態を更新
            refreshSetupState();
        } catch (error) {
            console.error('Failed to reset setup info:', error);
            setResetMessage({
                type: 'error',
                text: 'セットアップ情報のリセットに失敗しました。',
            });
        } finally {
            setIsResetting(false);
        }
    };

    // ページをリロードして初期セットアップに戻る
    const reloadToSetup = () => {
        window.location.reload();
    };

    return (
        <section>
            <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-lg font-medium text-text-primary">
                    セットアップリセット
                </h3>
                <span className="text-xs px-2 py-1 rounded-full" style={{
                    backgroundColor: currentTheme.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgb(254, 242, 242)',
                    color: currentTheme.mode === 'dark' ? 'rgb(248, 113, 113)' : 'rgb(153, 27, 27)'
                }}>
                    危険操作
                </span>
            </div>

            {/* リセット機能 */}
            <div className="rounded-lg p-4 mb-4" style={{
                backgroundColor: currentTheme.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgb(254, 242, 242)',
                borderColor: currentTheme.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgb(254, 202, 202)',
                borderWidth: '1px'
            }}>
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <span className="text-red-400 text-lg">⚠️</span>
                    </div>
                    <div className="ml-3 flex-1">
                        <h4 className="text-sm font-medium text-red-800">
                            セットアップ情報のリセット
                        </h4>
                        <div className="mt-2 text-sm text-red-700">
                            <p>
                                全ての設定と登録データを削除し、初期セットアップからやり直すことができます。
                            </p>
                            <p className="mt-1 font-medium">削除される内容：</p>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>API Key設定</li>
                                <li>場所設定</li>
                                <li>登録済みの趣味</li>
                                <li>天気データキャッシュ</li>
                                <li>初期セットアップ完了フラグ</li>
                            </ul>
                        </div>
                        <div className="mt-4 flex space-x-3">
                            <button
                                onClick={resetSetupInfo}
                                disabled={isResetting}
                                className="text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                                style={{
                                    backgroundColor: currentTheme.mode === 'dark' ? '#dc2626' : '#dc2626'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isResetting) {
                                        e.currentTarget.style.backgroundColor = '#b91c1c';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isResetting) {
                                        e.currentTarget.style.backgroundColor = '#dc2626';
                                    }
                                }}
                            >
                                {isResetting
                                    ? 'リセット中...'
                                    : 'セットアップをリセット'}
                            </button>

                            {resetMessage?.type === 'success' && (
                                <button
                                    onClick={reloadToSetup}
                                    className="text-white px-4 py-2 rounded-md transition-colors text-sm"
                                    style={{
                                        backgroundColor: currentTheme.mode === 'dark' ? currentTheme.colors.primary : '#2563eb'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = currentTheme.mode === 'dark' ? '#3b82f6' : '#1d4ed8';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = currentTheme.mode === 'dark' ? currentTheme.colors.primary : '#2563eb';
                                    }}
                                >
                                    初期セットアップに戻る
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* リセット結果メッセージ */}
            {resetMessage && (
                <div
                    className="p-3 rounded-md"
                    style={{
                        backgroundColor: resetMessage.type === 'success'
                            ? (currentTheme.mode === 'dark' ? 'rgba(34, 197, 94, 0.1)' : 'rgb(240, 253, 244)')
                            : (currentTheme.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgb(254, 242, 242)'),
                        color: resetMessage.type === 'success'
                            ? (currentTheme.mode === 'dark' ? 'rgb(134, 239, 172)' : 'rgb(22, 101, 52)')
                            : (currentTheme.mode === 'dark' ? 'rgb(248, 113, 113)' : 'rgb(153, 27, 27)'),
                        borderColor: resetMessage.type === 'success'
                            ? (currentTheme.mode === 'dark' ? 'rgba(34, 197, 94, 0.2)' : 'rgb(187, 247, 208)')
                            : (currentTheme.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgb(254, 202, 202)'),
                        borderWidth: '1px'
                    }}
                >
                    {resetMessage.text}
                </div>
            )}
        </section>
    );
};
