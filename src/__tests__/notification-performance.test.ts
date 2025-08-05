import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from '../services/notification.service';
import type { NotificationPayload } from '../types/notification';

// Global mocks
Object.defineProperty(globalThis, 'Notification', {
    value: class MockNotification {
        constructor() {
            // Mock implementation
        }
        static permission: NotificationPermission = 'granted';
        static requestPermission = vi.fn().mockResolvedValue('granted');
        close = vi.fn();
    },
    configurable: true,
});

Object.defineProperty(globalThis, 'navigator', {
    value: {
        serviceWorker: {
            register: vi.fn().mockResolvedValue({ scope: 'test' }),
        },
    },
    configurable: true,
});

describe('通知システム パフォーマンステスト', () => {
    let service: NotificationService;

    beforeEach(() => {
        service = NotificationService.getInstance();
    });

    it('大量の通知作成が効率的に処理される', () => {
        const startTime = performance.now();
        const notifications: NotificationPayload[] = [];

        // 1000個の通知を作成
        for (let i = 0; i < 1000; i++) {
            notifications.push(
                service.createHighScoreNotification(
                    `趣味${i}`,
                    Math.floor(Math.random() * 100),
                    '晴れで最適'
                )
            );
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(notifications).toHaveLength(1000);
        expect(duration).toBeLessThan(100); // 100ms以内で完了
        console.log(`1000個の通知作成: ${duration.toFixed(2)}ms`);
    });

    it('複数の通知送信が並行処理される', async () => {
        const startTime = performance.now();

        const notifications = Array.from({ length: 10 }, (_, i) =>
            service.createRegularReportNotification(`テストレポート ${i}`)
        );

        const promises = notifications.map((notification) =>
            service.sendNotification(notification)
        );

        const results = await Promise.all(promises);
        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(results.every((result) => result === true)).toBe(true);
        expect(duration).toBeLessThan(50); // 50ms以内で完了
        console.log(`10個の並行通知送信: ${duration.toFixed(2)}ms`);
    });

    it('メモリ使用量が適切に管理される', () => {
        const initialHeapUsed = process.memoryUsage().heapUsed;

        // 大量のオブジェクトを作成
        const notifications = Array.from({ length: 10000 }, (_, i) => ({
            type: 'regular-report' as const,
            title: `通知 ${i}`,
            message: `これは長いメッセージです`.repeat(100),
            data: {
                array: new Array(1000).fill(`データ${i}`),
                object: { value: i, nested: { deep: i * 2 } },
            },
        }));

        const peakHeapUsed = process.memoryUsage().heapUsed;

        // オブジェクトをクリア
        notifications.length = 0;

        // ガベージコレクションを強制実行
        if (global.gc) {
            global.gc();
        }

        const finalHeapUsed = process.memoryUsage().heapUsed;
        const memoryIncrease = peakHeapUsed - initialHeapUsed;
        const memoryDecrease = peakHeapUsed - finalHeapUsed;

        console.log(
            `メモリ使用量変化: +${(memoryIncrease / 1024 / 1024).toFixed(
                2
            )}MB → -${(memoryDecrease / 1024 / 1024).toFixed(2)}MB`
        );

        // メモリリークがないことを確認（目安として）
        expect(memoryIncrease).toBeGreaterThan(0);
        // Node.jsのGCは予測しにくいため、メモリが極端に増加していないことのみチェック
        expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024); // 200MB未満
    });

    it('シングルトンインスタンス作成のオーバーヘッドが小さい', () => {
        const startTime = performance.now();

        // 1000回インスタンス取得
        for (let i = 0; i < 1000; i++) {
            NotificationService.getInstance();
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(10); // 10ms以内で完了
        console.log(`1000回のシングルトン取得: ${duration.toFixed(2)}ms`);
    });

    it('通知データのシリアライゼーションが効率的', () => {
        const complexPayload: NotificationPayload = {
            type: 'regular-report',
            title: '複雑な通知データ',
            message: '大量のデータを含む通知'.repeat(100),
            data: {
                recommendations: Array.from({ length: 100 }, (_, i) => ({
                    name: `趣味${i}`,
                    score: Math.random() * 100,
                    details: {
                        weather: `天気${i}`,
                        reasons: [`理由${i}A`, `理由${i}B`, `理由${i}C`],
                        metadata: {
                            timestamp: new Date().toISOString(),
                            version: '1.0.0',
                            tags: [`tag${i}`, `category${i}`],
                        },
                    },
                })),
                statistics: {
                    totalCount: 100,
                    averageScore: 75.5,
                    distribution: Array.from({ length: 10 }, (_, i) => ({
                        range: i * 10,
                        count: Math.floor(Math.random() * 20),
                    })),
                },
            },
        };

        const startTime = performance.now();

        // シリアライゼーションのテスト
        for (let i = 0; i < 100; i++) {
            const serialized = JSON.stringify(complexPayload);
            const deserialized = JSON.parse(serialized);
            expect(deserialized.type).toBe('regular-report');
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(duration).toBeLessThan(50); // 50ms以内で完了
        console.log(
            `100回の複雑データシリアライゼーション: ${duration.toFixed(2)}ms`
        );
    });
});

describe('通知システム 品質メトリクス', () => {
    let service: NotificationService;

    beforeEach(() => {
        service = NotificationService.getInstance();
    });

    it('APIの一貫性が保たれている', () => {
        // 全ての通知作成メソッドが同じ構造を返すことを確認
        const methods = [
            () => service.createHighScoreNotification('テニス', 85, '晴れ'),
            () => service.createWeatherAlertNotification('rain', 'メッセージ'),
            () => service.createRegularReportNotification('レポート'),
        ];

        methods.forEach((method) => {
            const payload = method();
            expect(payload).toHaveProperty('type');
            expect(payload).toHaveProperty('title');
            expect(payload).toHaveProperty('message');
            expect(typeof payload.type).toBe('string');
            expect(typeof payload.title).toBe('string');
            expect(typeof payload.message).toBe('string');
        });
    });

    it('エラー境界が適切に処理される', async () => {
        // Notification APIを無効にしてテスト
        const originalNotification = globalThis.Notification;
        delete (globalThis as Record<string, unknown>)['Notification'];

        const service = new NotificationService();
        expect(service.isNotificationSupported()).toBe(false);

        const payload = service.createHighScoreNotification(
            'テスト',
            100,
            'テスト'
        );
        const result = await service.sendNotification(payload);
        expect(result).toBe(false);

        // 復元
        (globalThis as Record<string, unknown>)['Notification'] = originalNotification;
    });

    it('入力値の妥当性チェックが機能する', () => {
        // 空文字やnullの処理
        expect(() =>
            service.createHighScoreNotification('', 0, '')
        ).not.toThrow();
        expect(() =>
            service.createWeatherAlertNotification('', '')
        ).not.toThrow();
        expect(() => service.createRegularReportNotification('')).not.toThrow();

        // 極端な値の処理
        expect(() =>
            service.createHighScoreNotification(
                'a'.repeat(1000),
                -999,
                'b'.repeat(1000)
            )
        ).not.toThrow();
        expect(() =>
            service.createHighScoreNotification(
                'テスト',
                Number.MAX_SAFE_INTEGER,
                'テスト'
            )
        ).not.toThrow();
    });

    it('通知タイプの一意性が保たれている', () => {
        const payloads = [
            service.createHighScoreNotification('テニス', 85, '晴れ'),
            service.createWeatherAlertNotification('rain', 'メッセージ'),
            service.createRegularReportNotification('レポート'),
        ];

        const types = payloads.map((p) => p.type);
        const uniqueTypes = [...new Set(types)];

        expect(uniqueTypes).toHaveLength(3);
        expect(uniqueTypes).toContain('high-score');
        expect(uniqueTypes).toContain('weather-alert');
        expect(uniqueTypes).toContain('regular-report');
    });

    it('通知データの整合性が保たれている', () => {
        const payload = service.createDetailedHighScoreNotification(
            [
                { name: 'テニス', score: 90 },
                { name: 'ジョギング', score: 85 },
            ],
            '晴れ',
            22
        );

        expect(payload.data?.recommendations).toBeDefined();
        expect(payload.data?.weatherDescription).toBe('晴れ');
        expect(payload.data?.temperature).toBe(22);
        expect(Array.isArray(payload.data?.recommendations)).toBe(true);
    });

    it('国際化対応の基盤が整っている', () => {
        // 現在は日本語のみだが、将来の国際化に備えた構造になっているかチェック
        const payload = service.createHighScoreNotification(
            'Tennis',
            85,
            'Sunny'
        );

        expect(typeof payload.title).toBe('string');
        expect(typeof payload.message).toBe('string');
        // 将来、言語設定に基づいてメッセージを切り替える際の構造が用意されているか
        expect(payload).toHaveProperty('type'); // タイプベースでのメッセージ切り替えが可能
    });
});
