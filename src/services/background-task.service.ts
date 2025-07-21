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

    console.log('バックグラウンドタスクサービスを初期化中...');

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
      console.log('バックグラウンドタスクサービスの初期化完了');
    } catch (error) {
      console.error('バックグラウンドタスクサービスの初期化に失敗:', error);
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
      console.log('ページが表示されました - スケジューラーを再開');
      this.scheduler.start();
    } else {
      // ページが非表示になった時
      console.log('ページが非表示になりました - バックグラウンド処理継続');
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
    console.log('ページが終了されます - 設定を保存中');
    // 必要に応じて最新の状態を保存
    // ここでは特に何もしないが、将来的に状態の永続化が必要な場合に使用
  }

  // 設定変更時の処理
  handleConfigUpdate(configId: number): void {
    console.log(`設定が更新されました (ID: ${configId}) - スケジュールを再構築`);
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
        console.log('Service Worker登録成功:', registration);
        
        // Service Workerからのメッセージを処理
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('Service Workerからのメッセージ:', event.data);
          // 必要に応じてスケジューラーと連携
        });
        */
        console.log('Service Worker機能は利用可能ですが、現在は未実装です');
      } catch (error) {
        console.warn('Service Worker登録に失敗:', error);
      }
    } else {
      console.warn('Service Workerがサポートされていません');
    }
  }

  // バックグラウンドタスクの手動実行（デバッグ用）
  async runBackgroundTasks(): Promise<void> {
    console.log('バックグラウンドタスクを手動実行中...');
    
    try {
      // 有効な設定を取得
      const configs = await this.configService.getEnabledNotificationConfigs();
      console.log(`${configs.length}個の有効な通知設定を確認`);

      // スケジューラーの状態をログ出力
      const status = this.scheduler.getStatus();
      console.log('スケジューラー状態:', status);

      // 期限切れのタスクをチェック
      const tasks = this.scheduler.getCurrentTasks();
      const now = new Date();
      const overdueTasks = tasks.filter(task => task.nextRun <= now);
      
      if (overdueTasks.length > 0) {
        console.log(`${overdueTasks.length}個の期限切れタスクを発見`);
      }

    } catch (error) {
      console.error('バックグラウンドタスクの実行中にエラー:', error);
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
    
    console.log('バックグラウンドタスクサービスをクリーンアップしました');
  }

  // 初期化状態の確認
  isReady(): boolean {
    return this.isInitialized;
  }
}