import { useNotification } from '../../hooks/useNotification';

interface NotificationPermissionPromptProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  className?: string;
}

export function NotificationPermissionPrompt({ 
  onPermissionGranted, 
  onPermissionDenied,
  className = ""
}: NotificationPermissionPromptProps) {
  const { permission, isSupported, isLoading, requestPermission, sendTestNotification } = useNotification();

  const handleRequestPermission = async () => {
    const newPermission = await requestPermission();
    
    // 許可状態に応じてコールバックを実行
    if (newPermission?.granted) {
      onPermissionGranted?.();
    } else if (newPermission?.denied) {
      onPermissionDenied?.();
    }
  };

  const handleTestNotification = async () => {
    const success = await sendTestNotification();
    if (!success) {
      console.error('テスト通知の送信に失敗しました');
    }
  };

  if (!isSupported) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="text-yellow-600 mr-2">⚠️</div>
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              通知機能がサポートされていません
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              お使いのブラウザは通知機能をサポートしていません。
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (permission.granted) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-green-600 mr-2">✅</div>
            <div>
              <h3 className="text-sm font-medium text-green-800">
                通知が有効です
              </h3>
              <p className="text-sm text-green-700 mt-1">
                趣味に最適なタイミングで通知をお送りします。
              </p>
            </div>
          </div>
          <button
            onClick={handleTestNotification}
            className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >
            テスト送信
          </button>
        </div>
      </div>
    );
  }

  if (permission.denied) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="text-red-600 mr-2">🚫</div>
          <div>
            <h3 className="text-sm font-medium text-red-800">
              通知が無効になっています
            </h3>
            <p className="text-sm text-red-700 mt-1">
              ブラウザの設定から通知を許可してください。設定 → プライバシーとセキュリティ → 通知
            </p>
          </div>
        </div>
      </div>
    );
  }

  // デフォルト状態（許可要求可能）
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="text-blue-600 mr-2">🔔</div>
          <div>
            <h3 className="text-sm font-medium text-blue-800">
              通知を有効にしませんか？
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              天気に合わせた最適なタイミングで趣味活動をお知らせします。
            </p>
          </div>
        </div>
        <button
          onClick={handleRequestPermission}
          disabled={isLoading}
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? '確認中...' : '通知を許可'}
        </button>
      </div>
    </div>
  );
}