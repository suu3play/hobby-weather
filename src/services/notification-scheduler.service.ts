import { NotificationService } from './notification.service';
import { NotificationConfigService } from './notification-config.service';
import { HighScoreNotificationService } from './high-score-notification.service';
import { WeatherAlertNotificationService } from './weather-alert-notification.service';
import { RegularReportNotificationService } from './regular-report-notification.service';
import type {
    NotificationConfig,
    NotificationPayload,
} from '../types/notification';

interface ScheduledTask {
    id: string;
    configId: number;
    nextRun: Date;
    lastRun?: Date;
    config: NotificationConfig;
    payload: NotificationPayload;
}

export class NotificationSchedulerService {
    private static instance: NotificationSchedulerService;
    private tasks: Map<string, ScheduledTask> = new Map();
    private timers: Map<string, number> = new Map();
    private isRunning = false;
    private checkInterval = 60000; // 1分間隔でチェック

    private notificationService = NotificationService.getInstance();
    private configService = new NotificationConfigService();
    private highScoreService = HighScoreNotificationService.getInstance();
    private weatherAlertService = WeatherAlertNotificationService.getInstance();
    private regularReportService =
        RegularReportNotificationService.getInstance();

    constructor() {
        this.bindMethods();
    }

    static getInstance(): NotificationSchedulerService {
        if (!NotificationSchedulerService.instance) {
            NotificationSchedulerService.instance =
                new NotificationSchedulerService();
        }
        return NotificationSchedulerService.instance;
    }

    private bindMethods() {
        this.scheduleTask = this.scheduleTask.bind(this);
        this.unscheduleTask = this.unscheduleTask.bind(this);
        this.processScheduledTasks = this.processScheduledTasks.bind(this);
    }

    // スケジューラーの開始
    async start(): Promise<void> {
        if (this.isRunning) return;

        this.isRunning = true;

        // 既存の設定からタスクを復元
        await this.loadExistingConfigs();

        // 定期チェックタイマーを開始
        this.startPeriodicCheck();
    }

    // スケジューラーの停止
    stop(): void {
        if (!this.isRunning) return;

        this.isRunning = false;

        // すべてのタイマーをクリア
        this.timers.forEach((timer) => clearTimeout(timer));
        this.timers.clear();
        this.tasks.clear();
    }

    // 既存の設定をロードしてタスクを作成
    private async loadExistingConfigs(): Promise<void> {
        try {
            const configs =
                await this.configService.getEnabledNotificationConfigs();

            for (const config of configs) {
                if (config.id) {
                    await this.scheduleConfigTasks(config);
                }
            }
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error('既存設定の読み込みに失敗:', error);
            }
        }
    }

    // 設定に基づいてタスクをスケジュール
    async scheduleConfigTasks(config: NotificationConfig): Promise<void> {
        if (!config.id || !config.enabled) return;

        // 既存のタスクを削除
        this.unscheduleConfigTasks(config.id);

        // 新しいタスクを作成
        const nextRuns = this.calculateNextRuns(config);

        for (const nextRun of nextRuns.slice(0, 3)) {
            // 最大3つまで
            const task: ScheduledTask = {
                id: `${config.id}-${nextRun.getTime()}`,
                configId: config.id,
                nextRun,
                config,
                payload: await this.createPayloadForConfig(config),
            };

            this.tasks.set(task.id, task);
            this.scheduleTask(task);
        }
    }

    // 設定のタスクを削除
    unscheduleConfigTasks(configId: number): void {
        const tasksToRemove: string[] = [];

        this.tasks.forEach((task, taskId) => {
            if (task.configId === configId) {
                tasksToRemove.push(taskId);
            }
        });

        tasksToRemove.forEach((taskId) => {
            this.unscheduleTask(taskId);
        });
    }

    // 個別タスクのスケジュール
    private scheduleTask(task: ScheduledTask): void {
        const now = new Date();
        const delay = task.nextRun.getTime() - now.getTime();

        if (delay <= 0) {
            // 既に実行時刻を過ぎている場合は即座に実行
            this.executeTask(task);
            return;
        }

        // ブラウザのsetTimeoutは約24日が上限なので、長期間の場合は分割
        const maxDelay = 2147483647; // 約24日
        const actualDelay = Math.min(delay, maxDelay);

        const timer = window.setTimeout(() => {
            if (actualDelay < delay) {
                // 分割実行の場合は再スケジュール
                task.nextRun = new Date(now.getTime() + (delay - actualDelay));
                this.scheduleTask(task);
            } else {
                this.executeTask(task);
            }
        }, actualDelay);

        this.timers.set(task.id, timer);
    }

    // タスクのスケジュール削除
    private unscheduleTask(taskId: string): void {
        const timer = this.timers.get(taskId);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(taskId);
        }
        this.tasks.delete(taskId);
    }

    // タスクの実行
    private async executeTask(task: ScheduledTask): Promise<void> {
        try {
            // 通知可能かチェック
            const canNotify =
                await this.configService.isNotificationTimeAllowed(task.config);
            const hasReachedLimit =
                await this.configService.hasReachedDailyLimit(task.config.type);

            if (!canNotify || hasReachedLimit) {
                // 通知スキップ
            } else {
                // 通知を送信
                const success = await this.notificationService.sendNotification(
                    task.payload
                );

                if (success && task.configId) {
                    // 履歴に記録
                    await this.configService.addNotificationHistory({
                        configId: task.configId,
                        type: task.config.type,
                        title: task.payload.title,
                        message: task.payload.message,
                        sentAt: new Date(),
                    });
                }
            }

            // 次回実行をスケジュール
            await this.scheduleNextRun(task);
        } catch (error) {
            if (import.meta.env.DEV) {
                console.error(`タスク実行エラー: ${task.config.title}`, error);
            }
        } finally {
            // 現在のタスクを削除
            this.unscheduleTask(task.id);
        }
    }

    // 次回実行のスケジュール
    private async scheduleNextRun(task: ScheduledTask): Promise<void> {
        const config = task.config;
        const nextRuns = this.calculateNextRuns(config, task.nextRun);

        if (nextRuns.length > 0) {
            const nextTask: ScheduledTask = {
                ...task,
                id: `${config.id!}-${nextRuns[0]!.getTime()}`,
                nextRun: nextRuns[0]!,
                lastRun: task.nextRun,
                payload: await this.createPayloadForConfig(config),
            };

            this.tasks.set(nextTask.id, nextTask);
            this.scheduleTask(nextTask);
        }
    }

    // 次回実行時刻の計算
    private calculateNextRuns(
        config: NotificationConfig,
        fromDate?: Date
    ): Date[] {
        const now = fromDate || new Date();
        const nextRuns: Date[] = [];
        const schedule = config.schedule;

        switch (schedule.frequency) {
            case 'immediate':
                // 即座に実行（天気急変アラート用）
                nextRuns.push(new Date(now.getTime() + 1000)); // 1秒後
                break;

            case 'daily':
                // 毎日指定時刻
                for (const timeRange of schedule.timeOfDay) {
                    const nextRun = this.getNextDailyRun(
                        now,
                        timeRange.start,
                        schedule.daysOfWeek
                    );
                    if (nextRun) nextRuns.push(nextRun);
                }
                break;

            case 'weekly':
                // 週次
                for (const dayOfWeek of schedule.daysOfWeek) {
                    for (const timeRange of schedule.timeOfDay) {
                        const nextRun = this.getNextWeeklyRun(
                            now,
                            dayOfWeek,
                            timeRange.start
                        );
                        if (nextRun) nextRuns.push(nextRun);
                    }
                }
                break;

            case 'custom':
                // カスタム間隔
                if (schedule.customInterval) {
                    const interval = schedule.customInterval * 60 * 1000; // 分をミリ秒に変換
                    nextRuns.push(new Date(now.getTime() + interval));
                }
                break;
        }

        return nextRuns.sort((a, b) => a.getTime() - b.getTime());
    }

    // 毎日の次回実行時刻を計算
    private getNextDailyRun(
        from: Date,
        time: string,
        allowedDays: number[]
    ): Date | null {
        const [hours, minutes] = time.split(':').map(Number);
        const nextRun = new Date(from);

        nextRun.setHours(hours ?? 0, minutes ?? 0, 0, 0);

        // 今日の指定時刻が過ぎている場合は明日
        if (nextRun <= from) {
            nextRun.setDate(nextRun.getDate() + 1);
        }

        // 許可された曜日まで進める
        while (!allowedDays.includes(nextRun.getDay())) {
            nextRun.setDate(nextRun.getDate() + 1);
        }

        return nextRun;
    }

    // 週次の次回実行時刻を計算
    private getNextWeeklyRun(
        from: Date,
        dayOfWeek: number,
        time: string
    ): Date | null {
        const [hours, minutes] = time.split(':').map(Number);
        const nextRun = new Date(from);

        // 指定曜日まで進める
        const currentDayOfWeek = nextRun.getDay();
        let daysUntilTarget = dayOfWeek - currentDayOfWeek;

        if (daysUntilTarget < 0) {
            daysUntilTarget += 7;
        } else if (daysUntilTarget === 0) {
            // 今日が指定曜日の場合、時刻をチェック
            nextRun.setHours(hours ?? 0, minutes ?? 0, 0, 0);
            if (nextRun <= from) {
                daysUntilTarget = 7; // 来週
            }
        }

        nextRun.setDate(nextRun.getDate() + daysUntilTarget);
        nextRun.setHours(hours ?? 0, minutes ?? 0, 0, 0);

        return nextRun;
    }

    // 設定に応じたペイロード作成
    private async createPayloadForConfig(
        config: NotificationConfig
    ): Promise<NotificationPayload> {
        // 基本的なペイロード
        let payload: NotificationPayload = {
            type: config.type,
            title: config.title,
            message: '通知メッセージ',
        };

        // タイプ別のペイロード生成
        switch (config.type) {
            case 'high-score': {
                // 高スコア通知の動的評価
                const highScoreResult =
                    await this.highScoreService.evaluateAndCreateNotification();
                if (
                    highScoreResult.notificationSent &&
                    highScoreResult.recommendations.length > 0
                ) {
                    const recommendations = highScoreResult.recommendations.map(
                        (rec) => ({
                            hobbyName: rec.hobby.name,
                            score: rec.overallScore,
                        })
                    );

                    // 現在の天気情報を取得してペイロードを作成
                    try {
                        const weatherService = await import(
                            './weather.service'
                        );
                        const forecast =
                            await new weatherService.WeatherService().getWeatherForecast(
                                35.6762,
                                139.6503
                            );
                        if (forecast) {
                            const weatherDescription =
                                this.getWeatherDescription(
                                    forecast.current?.weatherType || 'clear'
                                );
                            const temperature = Math.round(
                                forecast.current?.temperature ?? 20
                            );

                            payload =
                                this.notificationService.createDetailedHighScoreNotification(
                                    recommendations.map((r) => ({
                                        name: r.hobbyName,
                                        score: r.score,
                                    })),
                                    weatherDescription,
                                    temperature
                                );
                        } else {
                            // フォールバック: 天気情報が取得できない場合
                            payload =
                                this.notificationService.createHighScoreNotification(
                                    recommendations[0]?.hobbyName ?? '趣味活動',
                                    recommendations[0]?.score ?? 80,
                                    '現在の天気'
                                );
                        }
                    } catch (error) {
                        if (import.meta.env.DEV) {
                            console.error(
                                '天気情報の取得に失敗、フォールバック通知を使用:',
                                error
                            );
                        }
                        payload =
                            this.notificationService.createHighScoreNotification(
                                '趣味活動',
                                85,
                                '現在の天気条件'
                            );
                    }
                } else {
                    // 高スコアの趣味がない場合はダミーまたはスキップ
                    payload = {
                        type: 'high-score',
                        title: '趣味チェック完了',
                        message:
                            highScoreResult.reason ||
                            '現在、高スコアの趣味はありません',
                    };
                }
                break;
            }

            case 'weather-alert': {
                // 天気急変アラートの動的評価
                const weatherAlerts =
                    await this.weatherAlertService.evaluateWeatherAlerts();
                const activeAlert = weatherAlerts.find(
                    (alert) => alert.alertTriggered
                );

                if (activeAlert) {
                    payload =
                        this.notificationService.createDetailedWeatherAlertNotification(
                            activeAlert.severity,
                            activeAlert.alertType,
                            activeAlert.message,
                            activeAlert.details.length > 0
                                ? { items: activeAlert.details } as Record<string, unknown>
                                : undefined
                        );
                } else {
                    // アクティブなアラートがない場合はダミーまたはスキップ
                    payload = {
                        type: 'weather-alert',
                        title: '天気監視中',
                        message: '現在、注意すべき天気の変化はありません',
                    };
                }
                break;
            }

            case 'regular-report': {
                // 定期レポートの動的生成
                const reportResult =
                    await this.regularReportService.generateRegularReport();

                if (
                    reportResult.reportGenerated &&
                    reportResult.reportContent
                ) {
                    const content = reportResult.reportContent;
                    const topHobbies = content.topRecommendations
                        .slice(0, 3)
                        .map((rec) => ({
                            name: rec.hobby.name,
                            score: rec.overallScore,
                        }));

                    payload =
                        this.notificationService.createDetailedRegularReportNotification(
                            content.summary,
                            topHobbies,
                            content.weatherSummary,
                            content.actionItems
                        );
                } else {
                    // レポート生成失敗時のフォールバック
                    payload = {
                        type: 'regular-report',
                        title: '📊 趣味レポート',
                        message:
                            reportResult.reason ||
                            'レポートを生成できませんでした',
                    };
                }
                break;
            }
        }

        return payload;
    }

    // 天気タイプの日本語説明を取得
    private getWeatherDescription(weatherType: string): string {
        const descriptions: Record<string, string> = {
            clear: '晴れ',
            clouds: '曇り',
            rain: '雨',
            drizzle: '小雨',
            thunderstorm: '雷雨',
            snow: '雪',
            mist: '霧',
            fog: '濃霧',
            haze: 'もや',
            dust: '砂埃',
        };

        return descriptions[weatherType] || weatherType;
    }

    // 定期チェックの開始
    private startPeriodicCheck(): void {
        const checkTimer = window.setInterval(() => {
            if (!this.isRunning) {
                clearInterval(checkTimer);
                return;
            }
            this.processScheduledTasks();
        }, this.checkInterval);
    }

    // スケジュールされたタスクの処理
    private processScheduledTasks(): void {
        const now = new Date();
        const tasksToExecute: ScheduledTask[] = [];

        this.tasks.forEach((task) => {
            if (task.nextRun <= now) {
                tasksToExecute.push(task);
            }
        });

        tasksToExecute.forEach((task) => {
            this.executeTask(task);
        });
    }

    // デバッグ用：現在のタスク一覧を取得
    getCurrentTasks(): ScheduledTask[] {
        return Array.from(this.tasks.values()).sort(
            (a, b) => a.nextRun.getTime() - b.nextRun.getTime()
        );
    }

    // デバッグ用：スケジューラーの状態を取得
    getStatus(): {
        isRunning: boolean;
        taskCount: number;
        nextTask?: ScheduledTask | undefined;
    } {
        const tasks = this.getCurrentTasks();
        return {
            isRunning: this.isRunning,
            taskCount: tasks.length,
            nextTask: tasks.length > 0 ? tasks[0] : undefined,
        };
    }
}
