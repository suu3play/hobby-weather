import { useState, useEffect, useCallback } from 'react';
import { NotificationSchedulerService } from '../services/notification-scheduler.service';

interface ScheduledTask {
  id: string;
  configId: number;
  nextRun: Date;
  lastRun: Date | undefined;
  title: string;
  type: string;
}

interface UseNotificationSchedulerReturn {
  isRunning: boolean;
  taskCount: number;
  nextTask: ScheduledTask | null;
  allTasks: ScheduledTask[];
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
  refresh: () => void;
}

export function useNotificationScheduler(): UseNotificationSchedulerReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [taskCount, setTaskCount] = useState(0);
  const [nextTask, setNextTask] = useState<ScheduledTask | null>(null);
  const [allTasks, setAllTasks] = useState<ScheduledTask[]>([]);
  const [error, setError] = useState<string | null>(null);

  const scheduler = NotificationSchedulerService.getInstance();

  // スケジューラー状態の更新
  const updateStatus = useCallback(() => {
    try {
      const status = scheduler.getStatus();
      setIsRunning(status.isRunning);
      setTaskCount(status.taskCount);
      
      if (status.nextTask) {
        setNextTask({
          id: status.nextTask.id,
          configId: status.nextTask.configId,
          nextRun: status.nextTask.nextRun,
          lastRun: status.nextTask.lastRun ?? undefined,
          title: status.nextTask.config.title,
          type: status.nextTask.config.type
        });
      } else {
        setNextTask(null);
      }

      const currentTasks = scheduler.getCurrentTasks();
      setAllTasks(currentTasks.map(task => ({
        id: task.id,
        configId: task.configId,
        nextRun: task.nextRun,
        lastRun: task.lastRun ?? undefined,
        title: task.config.title,
        type: task.config.type
      })));

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'スケジューラー状態の取得に失敗');
    }
  }, [scheduler]);

  // スケジューラーの開始
  const start = useCallback(async () => {
    try {
      setError(null);
      await scheduler.start();
      updateStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'スケジューラーの開始に失敗');
    }
  }, [scheduler, updateStatus]);

  // スケジューラーの停止
  const stop = useCallback(() => {
    try {
      setError(null);
      scheduler.stop();
      updateStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'スケジューラーの停止に失敗');
    }
  }, [scheduler, updateStatus]);

  // 状態の再読み込み
  const refresh = useCallback(() => {
    updateStatus();
  }, [updateStatus]);

  // 定期的な状態更新
  useEffect(() => {
    updateStatus();
    
    const interval = setInterval(() => {
      updateStatus();
    }, 5000); // 5秒間隔で更新

    return () => clearInterval(interval);
  }, [updateStatus]);

  return {
    isRunning,
    taskCount,
    nextTask,
    allTasks,
    error,
    start,
    stop,
    refresh
  };
}