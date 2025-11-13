# Repo Observer Scripts

GitHubリポジトリ情報を取得・整形・出力するTypeScript/Node.jsスクリプトです。

## 🎯 機能

- **リポジトリ情報取得**: GitHub APIを使用して対象ユーザーの全リポジトリ情報を取得
- **ステータス判定**: 最終更新日から活動状況を5段階で自動判定
- **CSV出力**: 取得した情報をCSVファイルに出力
- **Issue同期**: リポジトリ情報をGitHub Issueとして同期
- **Project連動**: GitHub Projects (v2) と自動連携

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

### Issue同期

```bash
export GITHUB_TOKEN=your_github_token
export TARGET_USER=KenichiroArai
export REPOSITORY=owner/repo
export PROJECT_NUMBER=15

npm run sync-issues
# または
node dist/index.js sync-issues
```

## ⚙️ 環境変数

### 共通

| 変数名 | 説明 | 必須 | デフォルト値 |
|--------|------|------|-------------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | ✅ | - |
| `TARGET_USER` | 対象ユーザー名 | - | KenichiroArai |

### CSV出力用

| 変数名 | 説明 | 必須 | デフォルト値 |
|--------|------|------|-------------|
| `OUTPUT_PATH` | 出力先パス | - | ./output/repositories.csv |
| `INCLUDE_PRIVATE` | プライベートリポジトリを含める | - | false |
| `INCLUDE_ARCHIVED` | アーカイブ済みを含める | - | false |
| `EXPORT_SUMMARY` | サマリーCSVも出力 | - | false |

### Issue同期用

| 変数名 | 説明 | 必須 | デフォルト値 |
|--------|------|------|-------------|
| `REPOSITORY` | 同期先リポジトリ（owner/repo形式） | ✅ | - |
| `PROJECT_NUMBER` | Project番号 | - | - |
| `PROJECT_STATUS_FIELD` | ステータスフィールド名 | - | Status |
| `INCLUDE_PRIVATE` | プライベートリポジトリを含める | - | false |
| `INCLUDE_ARCHIVED` | アーカイブ済みを含める | - | false |

## 📁 ディレクトリ構成

```text
scripts/
├── src/
│   ├── index.ts              # エントリーポイント
│   ├── types.ts              # 型定義
│   ├── repo-fetcher.ts       # リポジトリ情報取得
│   ├── repo-formatter.ts     # データ整形
│   ├── status-calculator.ts  # ステータス判定
│   └── exporters/
│       ├── csv-exporter.ts   # CSV出力
│       └── issue-exporter.ts # Issue出力
├── dist/                     # ビルド成果物
├── output/                   # 出力ファイル
├── package.json
├── tsconfig.json
└── README.md
```

## ⚠️ レート制限への対応

このスクリプトはGitHub APIを使用するため、レート制限に注意が必要です。

### 実装済みの対策

#### 1. 自動リトライ機能

セカンダリレート制限エラー発生時、自動的に待機してリトライします：

- **初期待機時間**: 60秒（1分）
- **リトライ回数**: 最大5回
- **指数バックオフ**: 1分 → 2分 → 4分 → 8分 → 16分

```typescript
// セカンダリレート制限エラー時の自動リトライ例
⚠️ セカンダリレート制限に達しました。1.0分（60000ms）待機してリトライします... (1/6)
⚠️ セカンダリレート制限に達しました。2.0分（120000ms）待機してリトライします... (2/6)
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

1. **スクリプトは自動的にリトライします** - ログを確認して待機してください
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

### 型チェック

```bash
npx tsc --noEmit
```

## 📝 ライセンス

MIT License
