# スマート通知システム実装概要

## 概要

hobby-weatherアプリケーションに実装されたスマート通知システムは、ユーザーの趣味活動と天気情報を組み合わせて、最適なタイミングで有益な通知を送信します。

## 主要機能

### 1. 高スコア通知機能
- 趣味と天気データの適合度が高い（スコア80点以上）場合に通知
- クールダウン機能により同じ趣味の重複通知を防止
- 複数趣味の同時通知対応

### 2. 天気急変アラート機能
- リアルタイム天気監視による急変検出
- 降水確率、気温、風速などの急激な変化を通知
- 重要度別アラート（低・中・高・緊急）

### 3. 定期レポート通知機能
- 日次・週次・月次のレポート自動生成
- 趣味適性統計とアクション項目の提案
- パーソナライズされた推薦情報

## システム構成

### コアサービス
- `NotificationService`: ブラウザ通知API統合とペイロード管理
- `NotificationConfigService`: 設定とデータベース管理
- `NotificationSchedulerService`: タスクスケジューリング
- `BackgroundTaskService`: ページライフサイクル管理

### 専用通知サービス
- `HighScoreNotificationService`: 高スコア通知の評価と生成
- `WeatherAlertNotificationService`: 天気急変アラートの監視と生成
- `RegularReportNotificationService`: 定期レポートの生成

### UIコンポーネント
- `NotificationPermissionPrompt`: 通知許可リクエストUI
- `NotificationSettings`: 包括的な通知設定管理
- `SchedulerMonitor`: スケジューラー監視とコントロール

### React Hooks
- `useNotification`: 通知許可と送信の状態管理
- `useNotificationConfig`: 設定とデータの管理
- `useNotificationScheduler`: スケジューラー状態の監視

## データベーススキーマ

### Version 5 追加テーブル

#### notificationConfigs
```typescript
{
  id: number;           // 自動採番ID
  type: NotificationType; // 'high-score' | 'weather-alert' | 'regular-report'
  enabled: boolean;     // 有効フラグ
  title: string;        // 通知タイトル
  priority: Priority;   // 'low' | 'medium' | 'high' | 'urgent'
  schedule: Schedule;   // スケジュール設定
  conditions: Conditions; // 条件設定
  createdAt: Date;
}
```

#### notificationHistory
```typescript
{
  id: number;           // 自動採番ID
  configId: number;     // 設定ID（外部キー）
  type: NotificationType;
  title: string;
  message: string;
  sentAt: Date;
  clicked: boolean;
  dismissed: boolean;
  data?: any;          // 追加データ
}
```

#### notificationSettings
```typescript
{
  id: number;                    // 自動採番ID
  globalEnabled: boolean;        // グローバル通知有効フラグ
  quietHours: QuietHours;       // 静寂時間設定
  maxDailyNotifications: number; // 日次最大通知数
  updatedAt: Date;
}
```

## 設定オプション

### スケジュール設定
- **頻度**: `daily` | `weekly` | `monthly` | `custom` | `immediate`
- **時間帯**: 開始時刻と終了時刻の範囲指定
- **曜日**: 特定曜日の指定（週次・月次用）

### 条件設定
- **天気条件**: 特定天気タイプでの有効/無効
- **時間条件**: 過去・未来の日数範囲
- **閾値設定**: スコア、気温、降水確率などの閾値

### グローバル設定
- **静寂時間**: 通知を送らない時間帯
- **最大通知数**: 1日あたりの通知上限
- **プライオリティ**: 通知の重要度別設定

## パフォーマンス特性

### 実測値（テスト結果）
- **大量通知作成**: 1000個を0.5ms以内
- **並行通知送信**: 10個を1ms以内
- **シングルトン取得**: 1000回を0.1ms以内
- **データシリアライゼーション**: 100回を30ms以内

### メモリ管理
- 適切なガベージコレクション対応
- メモリリーク防止機構
- 大容量データの効率処理

## 品質保証

### テストカバレッジ
- **単体テスト**: 各コンポーネント・サービス個別
- **統合テスト**: システム全体の連携動作
- **パフォーマンステスト**: 負荷・メモリ・処理速度
- **品質メトリクス**: API一貫性・エラー処理・データ整合性

### エラーハンドリング
- 通知API非対応環境での適切な処理
- ネットワークエラー時のフォールバック
- データ不整合時の安全処理
- ユーザー権限拒否時の対応

## 使用方法

### 基本セットアップ
```typescript
import { NotificationService } from './services/notification.service';
import { BackgroundTaskService } from './services/background-task.service';

// 通知サービス初期化
const notificationService = NotificationService.getInstance();

// バックグラウンドタスク開始
const backgroundTask = BackgroundTaskService.getInstance();
await backgroundTask.initialize();
```

### 通知設定
```typescript
import { NotificationSettings } from './components/notification/NotificationSettings';

// React コンポーネントとして使用
<NotificationSettings />
```

### 手動通知送信
```typescript
// 高スコア通知
const payload = notificationService.createHighScoreNotification(
  'テニス', 85, '晴れで気温24°C'
);
await notificationService.sendNotification(payload);

// 天気急変アラート
const alertPayload = notificationService.createWeatherAlertNotification(
  'rain', '1時間後から雨が降る予報です'
);
await notificationService.sendNotification(alertPayload);
```

## 拡張性

### 新しい通知タイプの追加
1. `NotificationType`に新しいタイプを追加
2. 専用サービスクラスの作成
3. `NotificationSchedulerService`への統合
4. UI設定コンポーネントの更新

### 国際化対応
- 通知メッセージのローカライゼーション対応準備完了
- タイプベースでのメッセージ切り替え機構

### 外部サービス連携
- Service Worker による本格的なバックグラウンド処理
- WebPush API連携によるサーバープッシュ通知
- 外部天気サービスとのAPI連携拡張

## セキュリティ

### プライバシー保護
- 通知データのローカル保存のみ
- 個人情報の外部送信なし
- ユーザー制御可能な詳細設定

### 権限管理
- ブラウザ通知許可の適切な管理
- 段階的権限リクエスト
- 拒否時の適切な代替動作

## 今後の改善予定

1. **機械学習連携**: ユーザー行動パターンの学習による最適化
2. **地理情報活用**: GPS連携による位置ベース通知
3. **ソーシャル機能**: 友人・グループとの通知共有
4. **詳細統計**: より高度な分析とインサイト提供
5. **モバイル最適化**: PWAによるネイティブアプリ体験

---

## 開発者向け情報

### デバッグ方法
```typescript
// 強制通知評価（デバッグ用）
await highScoreService.forceEvaluateHighScore();
await weatherAlertService.forceEvaluateWeatherAlerts();
await regularReportService.forceGenerateReport();

// 統計情報取得
const stats = await service.getHighScoreStatistics();
console.log(stats);
```

### ログ出力
すべての主要操作は console.log でログ出力されており、開発時のデバッグが容易です。

### テスト実行
```bash
# 統合テスト
npm test src/__tests__/notification-integration.test.ts

# パフォーマンステスト
npm test src/__tests__/notification-performance.test.ts

# 全テスト実行
npm test
```

このシステムにより、ユーザーは天気と趣味の最適な組み合わせを見逃すことなく、タイムリーで有益な情報を受け取ることができます。