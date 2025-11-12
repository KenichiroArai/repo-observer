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

```
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

