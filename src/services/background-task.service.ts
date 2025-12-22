import { NotificationSchedulerService } from './notification-scheduler.service';
import { NotificationConfigService } from './notification-config.service';

export class BackgroundTaskService {
  private static instance: BackgroundTaskService;
  private scheduler = NotificationSchedulerService.getInstance();
  private configService = new NotificationConfigService();
  private isInitialized = false;

  constructor() {
    this.bindMethods();
  }

  static getInstance(): BackgroundTaskService {
    if (!BackgroundTaskService.instance) {
      BackgroundTaskService.instance = new BackgroundTaskService();
    }
    return BackgroundTaskService.instance;
  }

  private bindMethods() {
    this.handlePageVisibility = this.handlePageVisibility.bind(this);
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
    this.handleConfigUpdate = this.handleConfigUpdate.bind(this);
  }

  // バックグラウンドタスクサービスの初期化
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // デフォルト設定を作成
      await this.configService.createDefaultConfigs();

      // スケジューラーを開始
      await this.scheduler.start();

      // ページの可視性変更イベントをリスニング
      this.setupPageVisibilityHandling();

      // ページ終了時の処理
      this.setupBeforeUnloadHandling();

      // Service Workerの登録（利用可能な場合）
      await this.registerServiceWorker();

      this.isInitialized = true;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('バックグラウンドタスクサービスの初期化に失敗:', error);
      }
      throw error;
    }
  }

  // ページ可視性変更の処理
  private setupPageVisibilityHandling(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handlePageVisibility);
    }
  }

  private handlePageVisibility(): void {
    if (document.visibilityState === 'visible') {
      // ページが表示された時
      this.scheduler.start();
    } else {
      // ページが非表示になった時
      // ブラウザ環境ではスケジューラーは継続実行
    }
  }

  // ページ終了時の処理
  private setupBeforeUnloadHandling(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    }
  }

  private handleBeforeUnload(): void {
    // 必要に応じて最新の状態を保存
    // ここでは特に何もしないが、将来的に状態の永続化が必要な場合に使用
  }

  // 設定変更時の処理
  handleConfigUpdate(_configId: number): void {
    // スケジューラーにリロードを要求
    this.scheduler.start(); // 既存のタスクをクリアして再構築
  }

  // Service Workerの登録
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        // Service Workerファイルが存在する場合のみ登録
        // 現在はファイルが存在しないためコメントアウト
        /*
        const registration = await navigator.serviceWorker.register('/sw.js');

        // Service Workerからのメッセージを処理
        navigator.serviceWorker.addEventListener('message', (event) => {
          // 必要に応じてスケジューラーと連携
        });
        */
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Service Worker登録に失敗:', error);
        }
      }
    }
  }

  // バックグラウンドタスクの手動実行（デバッグ用）
  async runBackgroundTasks(): Promise<void> {
    try {
      // 期限切れのタスクをチェック
      const tasks = this.scheduler.getCurrentTasks();
      const now = new Date();
      const overdueTasks = tasks.filter(task => task.nextRun <= now);

      if (import.meta.env.DEV && overdueTasks.length > 0) {
        console.log(`${overdueTasks.length}個の期限切れタスクを発見`);
      }

    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('バックグラウンドタスクの実行中にエラー:', error);
      }
    }
  }

  // 統計情報の取得
  async getBackgroundTaskStats(): Promise<{
    schedulerRunning: boolean;
    taskCount: number;
    configCount: number;
    lastUpdate: Date;
  }> {
    const schedulerStatus = this.scheduler.getStatus();
    const configs = await this.configService.getAllNotificationConfigs();
    
    return {
      schedulerRunning: schedulerStatus.isRunning,
      taskCount: schedulerStatus.taskCount,
      configCount: configs.length,
      lastUpdate: new Date()
    };
  }

  // クリーンアップ
  cleanup(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handlePageVisibility);
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
    }

    this.scheduler.stop();
    this.isInitialized = false;
  }

  // 初期化状態の確認
  isReady(): boolean {
    return this.isInitialized;
  }
}