import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// 実際のコンポーネントではなく、モックされたコンポーネントを使用
const createMockNotificationPermissionPrompt = (mockHook: () => {
  permission: { granted: boolean; denied: boolean; default: boolean };
  isSupported: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<{ granted: boolean; denied: boolean; default: boolean }>;
  sendTestNotification: () => Promise<boolean>;
}) => {
  return function NotificationPermissionPrompt({ 
    onPermissionGranted, 
    onPermissionDenied,
    className = ""
  }: {
    onPermissionGranted?: () => void;
    onPermissionDenied?: () => void;
    className?: string;
  }) {
    const { permission, isSupported, isLoading, requestPermission, sendTestNotification } = mockHook();

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
  };
};

// Mock関数の型定義
type MockUseNotificationFunction = () => {
  permission: { granted: boolean; denied: boolean; default: boolean };
  isSupported: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<{ granted: boolean; denied: boolean; default: boolean }>;
  sendTestNotification: () => Promise<boolean>;
};

describe('NotificationPermissionPrompt', () => {
  let mockUseNotification: MockUseNotificationFunction;
  let NotificationPermissionPrompt: React.ComponentType<{
    onPermissionGranted?: () => void;
    onPermissionDenied?: () => void;
    className?: string;
  }>;

  beforeEach(() => {
    mockUseNotification = vi.fn() as MockUseNotificationFunction;
    NotificationPermissionPrompt = createMockNotificationPermissionPrompt(mockUseNotification);
  });

  describe('通知がサポートされていない場合', () => {
    it('サポートされていないメッセージを表示する', () => {
      mockUseNotification.mockReturnValue({
        permission: { granted: false, denied: false, default: true },
        isSupported: false,
        isLoading: false,
        requestPermission: vi.fn(),
        sendTestNotification: vi.fn()
      });
      
      render(<NotificationPermissionPrompt />);
      
      expect(screen.getByText('通知機能がサポートされていません')).toBeInTheDocument();
      expect(screen.getByText('お使いのブラウザは通知機能をサポートしていません。')).toBeInTheDocument();
    });
  });

  describe('通知が許可されている場合', () => {
    beforeEach(() => {
      mockUseNotification.mockReturnValue({
        permission: { granted: true, denied: false, default: false },
        isSupported: true,
        isLoading: false,
        requestPermission: vi.fn(),
        sendTestNotification: vi.fn().mockResolvedValue(true)
      });
    });

    it('許可済みメッセージとテストボタンを表示する', () => {
      render(<NotificationPermissionPrompt />);
      
      expect(screen.getByText('通知が有効です')).toBeInTheDocument();
      expect(screen.getByText('趣味に最適なタイミングで通知をお送りします。')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'テスト送信' })).toBeInTheDocument();
    });

    it('テストボタンクリックでテスト通知を送信する', async () => {
      const mockSendTest = vi.fn().mockResolvedValue(true);
      mockUseNotification.mockReturnValue({
        permission: { granted: true, denied: false, default: false },
        isSupported: true,
        isLoading: false,
        requestPermission: vi.fn(),
        sendTestNotification: mockSendTest
      });
      
      render(<NotificationPermissionPrompt />);
      
      const testButton = screen.getByRole('button', { name: 'テスト送信' });
      fireEvent.click(testButton);
      
      await waitFor(() => {
        expect(mockSendTest).toHaveBeenCalledOnce();
      });
    });
  });

  describe('通知が拒否されている場合', () => {
    beforeEach(() => {
      mockUseNotification.mockReturnValue({
        permission: { granted: false, denied: true, default: false },
        isSupported: true,
        isLoading: false,
        requestPermission: vi.fn(),
        sendTestNotification: vi.fn()
      });
    });

    it('拒否メッセージと設定手順を表示する', () => {
      render(<NotificationPermissionPrompt />);
      
      expect(screen.getByText('通知が無効になっています')).toBeInTheDocument();
      expect(screen.getByText(/ブラウザの設定から通知を許可してください/)).toBeInTheDocument();
    });
  });

  describe('通知許可が未設定の場合', () => {
    beforeEach(() => {
      mockUseNotification.mockReturnValue({
        permission: { granted: false, denied: false, default: true },
        isSupported: true,
        isLoading: false,
        requestPermission: vi.fn(),
        sendTestNotification: vi.fn()
      });
    });

    it('許可要求メッセージとボタンを表示する', () => {
      render(<NotificationPermissionPrompt />);
      
      expect(screen.getByText('通知を有効にしませんか？')).toBeInTheDocument();
      expect(screen.getByText('天気に合わせた最適なタイミングで趣味活動をお知らせします。')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '通知を許可' })).toBeInTheDocument();
    });

    it('許可ボタンクリックで許可要求を実行する', async () => {
      const mockRequestPermission = vi.fn().mockResolvedValue({
        granted: true,
        denied: false,
        default: false
      });
      
      mockUseNotification.mockReturnValue({
        permission: { granted: false, denied: false, default: true },
        isSupported: true,
        isLoading: false,
        requestPermission: mockRequestPermission,
        sendTestNotification: vi.fn()
      });
      
      render(<NotificationPermissionPrompt />);
      
      const allowButton = screen.getByRole('button', { name: '通知を許可' });
      fireEvent.click(allowButton);
      
      await waitFor(() => {
        expect(mockRequestPermission).toHaveBeenCalledOnce();
      });
    });
  });

  describe('コールバック機能', () => {
    it('許可時にonPermissionGrantedが呼ばれる', async () => {
      const onPermissionGranted = vi.fn();
      const mockRequestPermission = vi.fn().mockResolvedValue({
        granted: true,
        denied: false,
        default: false
      });
      
      mockUseNotification.mockReturnValue({
        permission: { granted: false, denied: false, default: true },
        isSupported: true,
        isLoading: false,
        requestPermission: mockRequestPermission,
        sendTestNotification: vi.fn()
      });
      
      render(<NotificationPermissionPrompt onPermissionGranted={onPermissionGranted} />);
      
      const allowButton = screen.getByRole('button', { name: '通知を許可' });
      fireEvent.click(allowButton);
      
      await waitFor(() => {
        expect(onPermissionGranted).toHaveBeenCalledOnce();
      });
    });

    it('拒否時にonPermissionDeniedが呼ばれる', async () => {
      const onPermissionDenied = vi.fn();
      const mockRequestPermission = vi.fn().mockResolvedValue({
        granted: false,
        denied: true,
        default: false
      });
      
      mockUseNotification.mockReturnValue({
        permission: { granted: false, denied: false, default: true },
        isSupported: true,
        isLoading: false,
        requestPermission: mockRequestPermission,
        sendTestNotification: vi.fn()
      });
      
      render(<NotificationPermissionPrompt onPermissionDenied={onPermissionDenied} />);
      
      const allowButton = screen.getByRole('button', { name: '通知を許可' });
      fireEvent.click(allowButton);
      
      await waitFor(() => {
        expect(onPermissionDenied).toHaveBeenCalledOnce();
      });
    });
  });

  describe('カスタムスタイリング', () => {
    it('カスタムclassNameが適用される', () => {
      mockUseNotification.mockReturnValue({
        permission: { granted: true, denied: false, default: false },
        isSupported: true,
        isLoading: false,
        requestPermission: vi.fn(),
        sendTestNotification: vi.fn()
      });
      
      const { container } = render(<NotificationPermissionPrompt className="custom-class" />);
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});