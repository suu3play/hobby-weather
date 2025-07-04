# OpenWeatherMap API アップグレードガイド

## 現在の問題

OpenWeatherMapのOneCall API (3.0) は2023年6月から有料サービスになりました。
無料プランでは以下のAPIのみ利用可能です：

### 無料API (1000回/月まで)
- Current Weather Data (`/weather`)
- 5-day Weather Forecast (`/forecast`) 
- Geocoding API (`/geo`)

### 有料API
- One Call API 3.0 (`/onecall`) - 月額課金が必要

## 修正内容

1. **OneCall APIから5-day Forecast APIに変更**
   - `getWeatherForecast`メソッドを修正
   - 3時間ごとのデータを日次データに集約
   - UV指数は利用不可（5-day APIには含まれない）

2. **制限事項**
   - 予報期間：7日間 → 5日間
   - UV指数：利用不可
   - データ精度：3時間間隔のデータから算出

## 有料プランにアップグレードする場合

### OneCall API 3.0を使用する場合：
1. [OpenWeatherMap pricing](https://openweathermap.org/price)で有料プランを選択
2. 支払い情報を設定
3. `weather.service.ts`のエンドポイントを戻す：
   ```typescript
   const url = `${this.baseUrl}/onecall?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=ja&exclude=minutely,hourly,alerts`;
   ```

### 料金プラン例：
- **Developer**: $40/月 (100万回まで)
- **Startup**: $125/月 (500万回まで)
- **Developer Pro**: $600/月 (2500万回まで)

## 推奨事項

現在のアプリケーション用途では無料APIで十分です。
有料化を検討する場合は以下の条件時：

- 月間API呼び出しが1000回を超える
- UV指数が必須機能
- 7日間を超える予報が必要