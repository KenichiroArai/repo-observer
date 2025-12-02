# Repo Observer Scripts - 技術仕様

> このドキュメントは、Repo Observerのスクリプトの技術仕様とローカル実行方法を説明します。
> プロジェクトの概要については [README.md](../README.md) を参照してください。

GitHubリポジトリ情報を取得・整形・出力するTypeScript/Node.jsスクリプトです。

## 🎯 機能

- **リポジトリ情報取得**: GitHub REST APIを使用して対象ユーザーの全リポジトリ情報を取得
- **ステータス判定**: 最終更新日から活動状況を5段階で自動判定
- **CSV出力**: 取得した情報をCSVファイルに出力
- **Issue同期**: リポジトリ情報をGitHub Issueとして同期
- **CSV再利用**: Issue同期は直近のCSVファイルを読み込み、API呼び出しを最小化
- **Project連動**: GitHub Projects (v2) と自動連携（GraphQL API使用）

## 📦 セットアップ

### 1. 依存関係のインストール

```bash
cd scripts
npm install
```

### 2. TypeScriptのビルド

```bash
npm run build
```

## 🚀 使い方

### CSV出力

```bash
export GITHUB_TOKEN=your_github_token
export TARGET_USER=KenichiroArai
export OUTPUT_PATH=./output/repositories.csv

npm run export-csv
# または
node dist/index.js export-csv
```

> ℹ️ 出力CSVは既存ファイルの末尾へ追記され、各行には `エクスポート日時(UTC)` と `エクスポート日時(JST)` の2列が付与されます。日次・定期実行時も履歴が1つのファイルで管理できます。

#### 📁 日付・種類別ファイル構成

- `OUTPUT_PATH` に指定したパスを基準に、`public/data/<ファイル種類>/YYYY/MM/ファイル名-YYYY-MM-DD.csv` 形式でCSVを作成します。
- 例: `OUTPUT_PATH=./public/data/repositories.csv` かつ 2025年1月4日(JST)に実行した場合
  `./public/data/repositories/2025/01/repositories-2025-01-04.csv`
- 「ファイル種類」は `OUTPUT_PATH` のファイル名（拡張子除く）で自動判定されます。
- 同じ日付で再度実行すると同じファイルの末尾に追記されます。

### Issue同期

```bash
export GITHUB_TOKEN=your_github_token
export TARGET_USER=KenichiroArai
export REPOSITORY=owner/repo
export PROJECT_NUMBER=15
export CSV_INPUT_PATH=../docs/data/repositories.csv

npm run sync-issues
# または
node dist/index.js sync-issues
```

> ⚠️ 必ず事前に `export-csv` を実行し、最新のCSVファイルを生成してから `sync-issues` を実行してください。Issue同期はCSVの内容を再利用するため、APIから再取得は行いません。
>
> 🚨 **Project番号チェック**: `PROJECT_NUMBER` で指定したProjectが存在しない場合は `sync-issues` がエラーで即座に停止し、GitHub Actions上でも失敗ステータスになります。URL末尾の番号と対象ユーザーを再確認してから実行してください。

## ⚙️ 環境変数

### 共通

| 変数名 | 説明 | 必須 | デフォルト値 |
|--------|------|------|-------------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | ✅ | - |
| `TARGET_USER` | 対象ユーザー名 | - | KenichiroArai |

### CSV出力用

| 変数名 | 説明 | 必須 | デフォルト値 |
|--------|------|------|-------------|
| `OUTPUT_PATH` | 出力先パス（例: `./docs/data/repositories.csv`） | - | ./output/repositories.csv |
| `INCLUDE_PRIVATE` | プライベートリポジトリを含める | - | false |
| `INCLUDE_ARCHIVED` | アーカイブ済みを含める | - | false |
| `EXPORT_SUMMARY` | サマリーCSVも出力 | - | false |

CSVの各行には UTCとJSTのエクスポート日時が含まれ、同じファイルに追記されるため、任意のタイムゾーンでグラフや統計へ活用できます。

### Issue同期用

| 変数名 | 説明 | 必須 | デフォルト値 |
|--------|------|------|-------------|
| `REPOSITORY` | 同期先リポジトリ（owner/repo形式） | ✅ | - |
| `PROJECT_NUMBER` | Project番号 | - | - |
| `PROJECT_STATUS_FIELD` | ステータスフィールド名 | - | Status |
| `CSV_INPUT_PATH` | Issue同期で参照するCSVのベースパス | - | OUTPUT_PATHと同じ |
| `INCLUDE_PRIVATE` | プライベートリポジトリを含める | - | false |
| `INCLUDE_ARCHIVED` | アーカイブ済みを含める | - | false |

## 📁 ディレクトリ構成

```text
scripts/
├── src/
│   ├── index.ts               # エントリーポイント（コマンド処理）
│   ├── types.ts               # 型定義
│   ├── repo-fetcher.ts        # リポジトリ情報取得（GitHub REST API）
│   ├── repo-formatter.ts      # データ整形（Issue本文、CSV行）
│   ├── status-calculator.ts   # ステータス判定（5段階）
│   └── exporters/
│       ├── csv-exporter.ts    # CSV出力（csv-writer使用）
│       └── issue-exporter.ts  # Issue出力（Octokit + GraphQL API）
├── dist/                      # TypeScriptビルド成果物
├── output/                    # ローカル実行時の出力ファイル
├── package.json               # 依存関係定義
├── tsconfig.json              # TypeScript設定
└── README.md                  # このファイル
```

### アーキテクチャ

```text
index.ts (コマンドライン引数処理)
    ↓
repo-fetcher.ts (GitHub API → リポジトリデータ取得)
    ↓
status-calculator.ts (最終更新日 → 5段階ステータス)
    ↓
repo-formatter.ts (データ整形)
    ↓
    ├→ csv-exporter.ts (CSVファイル出力)
    └→ issue-exporter.ts (Issue作成/更新 + Project連動)
```

## ⚠️ レート制限への対応

このスクリプトはGitHub APIを使用するため、レート制限に注意が必要です。

### 実装済みの対策

#### 1. 自動リトライ機能

セカンダリレート制限エラー発生時、自動的に待機してリトライします：

- **初期待機時間**: 60秒（1分）
- **リトライ回数**: 最大6回（合計7回試行）
- **指数バックオフ**: 1分 → 2分 → 4分 → 8分 → 16分 → 32分 → 60分（上限1時間）

```typescript
// セカンダリレート制限エラー時の自動リトライ例
⚠️ セカンダリレート制限に達しました。1.0分（60000ms）待機してリトライします... (1/7)
⚠️ セカンダリレート制限に達しました。2.0分（120000ms）待機してリトライします... (2/7)
...
⚠️ セカンダリレート制限に達しました。60.0分（3600000ms）待機してリトライします... (7/7)
```

#### 2. API呼び出し間の待機

各API呼び出し間に適切な待機時間を設定しています：

- **リポジトリ処理間**: 3秒
- **Issueキャッシュページ間**: 2秒
- **その他のAPI呼び出し**: 適宜調整

#### 3. Issueキャッシュ機能

既存Issueを事前にキャッシュすることで、検索APIの呼び出し回数を削減：

```typescript
// 全Issueを一度にキャッシュ（リスト取得APIのみ使用）
await this.cacheExistingIssues(owner, repo);
// 以降はキャッシュから検索（APIリクエストなし）
const existingIssue = await this.findExistingIssue(owner, repo, title);
```

#### 4. エラーハンドリング

セカンダリレート制限エラー発生時の特別処理：

- 5分間待機して処理を続行
- 進捗状況を詳細にログ出力
- 処理済み件数とエラー件数を表示

### トラブルシューティング

#### セカンダリレート制限エラーが発生する場合

```text
Error: You have exceeded a secondary rate limit. Please wait a few minutes...
```

**対処方法**:

1. **スクリプトは自動的に最大6回リトライします** - ログを確認して待機してください
2. **処理対象を減らす** - `INCLUDE_PRIVATE=false` や `INCLUDE_ARCHIVED=false` を設定
3. **時間をずらす** - GitHub APIの利用が少ない時間帯に実行

#### プライマリレート制限エラーが発生する場合

```text
Error: API rate limit exceeded
```

**確認方法**:

```bash
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/rate_limit
```

**対処方法**:

- レート制限がリセットされるまで待機（通常1時間以内）
- 認証トークンが正しく設定されているか確認

## 🔧 開発

### ビルド

```bash
npm run build
```

ビルド成果物は `dist/` ディレクトリに生成されます。

### 型チェック

```bash
npx tsc --noEmit
```

### コマンド一覧

| コマンド | 説明 |
|---------|------|
| `npm run build` | TypeScriptをビルド |
| `npm run export-csv` | CSV出力を実行 |
| `npm run sync-issues` | Issue同期を実行 |

### 技術スタック

| カテゴリ | ライブラリ | 用途 |
|---------|-----------|------|
| **言語** | TypeScript | 型安全な実装 |
| **実行環境** | Node.js (v20) | スクリプト実行 |
| **API クライアント** | @octokit/rest | GitHub REST API |
| **GraphQL** | @octokit/graphql | GitHub GraphQL API (Project連動) |
| **CSV出力** | csv-writer | CSVファイル生成 |
| **日付処理** | date-fns | 日時計算・フォーマット |

## 📚 関連ドキュメント

- **[README.md](../../../README.md)** - プロジェクトの概要と基本的な使い方
- **[public/manual/ワークフロー同期制御.md](../../../public/manual/ワークフロー同期制御.md)** - ワークフローの詳細仕様と運用方法
- **[public/manual/構想.md](../../../public/manual/構想.md)** - プロジェクトの構想と背景

## 📝 ライセンス

MIT License
