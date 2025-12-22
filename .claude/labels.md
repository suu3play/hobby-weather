# GitHub Labels 標準定義

このファイルは、全プロジェクトで使用する標準的なGitHub Labelsを管理します。

## デフォルトラベル（GitHub標準）

| ラベル名 | 説明 | カラーコード |
|---------|------|------------|
| bug | Something isn't working | #d73a4a |
| documentation | Improvements or additions to documentation | #0075ca |
| duplicate | This issue or pull request already exists | #cfd3d7 |
| enhancement | New feature or request | #a2eeef |
| good first issue | Good for newcomers | #7057ff |
| help wanted | Extra attention is needed | #008672 |
| invalid | This doesn't seem right | #e4e669 |
| question | Further information is requested | #d876e3 |
| wontfix | This will not be worked on | #ffffff |

## カスタムラベル

### Type系ラベル

作業の種類を分類するためのラベルです。

| ラベル名 | 説明 | カラーコード |
|---------|------|------------|
| Type：ドキュメント更新 | ドキュメントの作成・修正・翻訳に関する作業。READMEや設計書の更新も含みます。 | #0075ca |
| Type：バグ | 不具合・バグ報告。想定外の挙動やエラーが対象です。 | #d73a4a |
| Type：リファクタリング | 機能に影響しないコードの改善や整理。可読性や保守性を向上させます。 | #cfd3d7 |
| Type：新機能・既存改修 | 新機能の追加、または既存機能の改善。ユーザー価値を向上させる開発です。 | #0e8a16 |
| Type：good first issue | 初級の開発者でも取り組みやすいとされる問題。具体的には、小さなバグの修正や機能には影響しないテキスト変更などが該当。 | #7057ff |
| Type：作業 | その他の一般的な作業項目。明確に分類できないタスクや調査などに使用します。 | #27cdee |
| Type：質問・相談 | 技術的な質問や開発に関する相談。疑問点や実装方法などについて議論したい内容です。 | #128A0C |

### Priority系ラベル

優先度を示すラベルです。

| ラベル名 | 説明 | カラーコード |
|---------|------|------------|
| Priority：最優先 | 即対応が必要な最優先事項。重大なバグや、納期直前の重要項目です。 | #b60205 |
| Priority：中 | 優先度は高いが緊急ではないタスク。リリースやマイルストーンに影響する可能性があります。 | #f66a0a |
| Priority：低 | 対応は必要だが、後回しにできる低優先のタスク。改善系や将来的な対応も含みます。 | #fbca04 |

### 緊急度系ラベル

質問・相談に対する回答の緊急度を示すラベルです。

| ラベル名 | 説明 | カラーコード |
|---------|------|------------|
| 緊急度：高 | 至急または高優先度で回答が必要な質問・相談。1-2日以内の対応を希望。 | #FF6B6B |
| 緊急度：中 | 中程度の優先度。1週間以内の回答を希望する質問・相談。 | #FFD93D |
| 緊急度：低 | 時間に余裕がある質問・相談。回答タイミングは柔軟で問題なし。 | #4ECDC4 |

## 使用方法

### 新しいプロジェクトへのラベル適用

```bash
# 単一プロジェクトへの適用
/copy-labels

# 全プロジェクトへの一括適用
/copy-labels all
```

### ラベルの更新

このファイルを編集後、以下のコマンドで全プロジェクトに反映できます：

```bash
/copy-labels all
```

## ラベル命名規則

- **Type系**: 作業内容の分類に使用
- **Priority系**: 優先度の設定に使用
- **緊急度系**: 質問・相談の回答期限に使用

各Issueには最低1つのType系ラベルと1つのPriority系ラベルを付けることを推奨します。
