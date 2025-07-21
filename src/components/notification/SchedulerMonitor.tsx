import { useState } from 'react';
import { useNotificationScheduler } from '../../hooks/useNotificationScheduler';

interface SchedulerMonitorProps {
  className?: string;
}

export function SchedulerMonitor({ className = "" }: SchedulerMonitorProps) {
  const {
    isRunning,
    taskCount,
    nextTask,
    allTasks,
    error,
    start,
    stop,
    refresh
  } = useNotificationScheduler();

  const [showAllTasks, setShowAllTasks] = useState(false);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff < 0) {
      return '期限切れ';
    }
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}日後`;
    } else if (hours > 0) {
      return `${hours}時間後`;
    } else if (minutes > 0) {
      return `${minutes}分後`;
    } else {
      return '間もなく';
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'high-score': return '🌟';
      case 'weather-alert': return '🌧️';
      case 'regular-report': return '📊';
      default: return '🔔';
    }
  };

  const getStatusColor = (isRunning: boolean) => {
    return isRunning ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">🕒 スケジューラー監視</h2>
        <button
          onClick={refresh}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          更新
        </button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <div className="text-red-600 mr-2">❌</div>
            <div>
              <h4 className="text-sm font-medium text-red-800">エラー</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* スケジューラー状態 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className={`text-2xl font-bold ${getStatusColor(isRunning)}`}>
            {isRunning ? '動作中' : '停止中'}
          </div>
          <div className="text-sm text-gray-500">ステータス</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{taskCount}</div>
          <div className="text-sm text-gray-500">スケジュール済み</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {nextTask ? formatRelativeTime(nextTask.nextRun) : '－'}
          </div>
          <div className="text-sm text-gray-500">次回実行</div>
        </div>
      </div>

      {/* 制御ボタン */}
      <div className="flex space-x-3 mb-6">
        {!isRunning ? (
          <button
            onClick={start}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            スケジューラー開始
          </button>
        ) : (
          <button
            onClick={stop}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            スケジューラー停止
          </button>
        )}
      </div>

      {/* 次回タスク */}
      {nextTask && (
        <div className="border-t pt-4 mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">次回実行予定</h3>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getTaskTypeIcon(nextTask.type)}</span>
                <div>
                  <div className="text-sm font-medium text-gray-900">{nextTask.title}</div>
                  <div className="text-xs text-gray-500">ID: {nextTask.configId}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-blue-600">
                  {formatDate(nextTask.nextRun)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatRelativeTime(nextTask.nextRun)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 全タスク表示 */}
      {allTasks.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">
              スケジュール済みタスク ({allTasks.length})
            </h3>
            <button
              onClick={() => setShowAllTasks(!showAllTasks)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showAllTasks ? '非表示' : '表示'}
            </button>
          </div>

          {showAllTasks && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{getTaskTypeIcon(task.type)}</span>
                    <div>
                      <div className="text-xs font-medium text-gray-900">{task.title}</div>
                      <div className="text-xs text-gray-500">ID: {task.configId}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600">
                      {formatDate(task.nextRun)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatRelativeTime(task.nextRun)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* タスクなしの場合 */}
      {taskCount === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📭</div>
          <div className="text-sm">スケジュール済みのタスクがありません</div>
          <div className="text-xs mt-1">通知設定を有効にするとタスクが表示されます</div>
        </div>
      )}
    </div>
  );
}