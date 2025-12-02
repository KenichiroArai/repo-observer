# 📊 Repo Observer（リポジトリ・オブザーバー）

[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-automated-blue)](https://github.com/features/actions)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 📋 リポジトリ・オブザーバー・プロジェクト

GitHub Projectsのカンバンボードで、全リポジトリの状況を視覚的に管理：

**🎯 [repo-observer-project](https://github.com/users/KenichiroArai/projects/15)**

このカンバンボードでは、各リポジトリをカード形式で表示し、ステータス別（頻繁に更新/定期的に更新/時々更新/更新が少ない/停滞中）に整理して、活動状況を一目で把握できます。

---

GitHubリポジトリの活動状況を自動的に監視・管理し、GitHub ProjectsやCSVファイルで可視化するツールです。

## 🎯 概要

**Repo Observer** は、指定したGitHubユーザーの全リポジトリを自動取得し、以下の形式で出力できます：

- **Issue管理**: 各リポジトリを1つのIssueとして表現し、GitHub Projectsで可視化
- **CSV出力**: 全リポジトリ情報をCSVファイルとして出力し、Excel等で分析

### 主な特徴

- 🔄 **自動同期**: 毎日自動的にリポジトリ情報を取得・更新（UTC 18:00 / JST 3:00）
- 📊 **5段階ステータス**: 活動状況を自動判定（頻繁に更新 / 定期的に更新 / 時々更新 / 更新が少ない / 停滞中）
- 🎯 **Project連動**: GitHub Projects (v2) と自動連携
- 📈 **詳細な情報**: スター数、フォーク数、最終更新日、リリース情報など
- 🎛️ **柔軟な実行**: CSV出力のみ、またはCSV出力＋Issue同期を選択可能（Issue同期は常に最新CSVを参照）
- 💻 **TypeScript/Node.js**: 共通化されたスクリプトで保守性向上

## 📦 管理される情報

各リポジトリについて、以下のような情報が自動的に収集・更新されます：

- **基本情報**: 説明、使用言語、ライセンス、トピックス、ホームページURL
- **活動指標**: スター数、フォーク数、ウォッチャー数、未解決Issue数、リポジトリサイズ
- **日時情報**: 作成日、最終更新日、最終Push日、最新リリース
- **状態・設定**: アーカイブ状態、公開状態、デフォルトブランチ、Issues/Wiki/Projects有効状態

詳細なプロジェクト構想については [public/manual/構想.md](public/manual/構想.md) を参照してください。

## 🚀 使い方

### 1. リポジトリのセットアップ

このリポジトリをテンプレートとして使用するか、`.github/workflows/repo-full-sync.yml` をあなたの管理用リポジトリにコピーします。

### 2. シークレットの設定（オプション）

**基本的には不要です。** ワークフローは自動的に提供される `GITHUB_TOKEN` を使用します。

ただし、**GitHub Project連動を利用する場合** は、以下の設定を推奨します：

1. **Personal Access Token (Classic) を作成**

   - Settings → Developer settings → Personal access tokens → Tokens (classic)
   - 必要な権限：`repo`, `project` (read:projectも含む)

2. **リポジトリのSecretsに登録**

   - リポジトリの Settings → Secrets and variables → Actions
   - New repository secret をクリック
   - Name: `PROJECT_TOKEN`
   - Secret: 作成したPersonal Access Token

### 3. GitHub Projectの準備（オプション）

Project連動を使用する場合：

1. **Projects** → **New project** → **Table view** を選択
2. ステータスフィールド「Status」を追加し、以下のオプションを設定：

   - 頻繁に更新（7日以内）
   - 定期的に更新（8-30日）
   - 時々更新（31-180日）
   - 更新が少ない（181-365日）
   - 停滞中（366日以上）

3. Project番号（URL末尾の数字）をメモ
   - ✅ **注意**: 存在しない番号を入力すると `sync-issues` ジョブが即座に失敗し、完了通知でも失敗扱いになります。手動実行前に必ず正しい番号を確認してください。

### 4. 依存関係のインストール

初回のみ、スクリプトの依存関係をインストールします：

```bash
cd .github/scripts/repo-full-sync
npm install
npm run build
```

### 5. ワークフローの実行

#### 自動実行

毎日 UTC 18:00（JST 3:00）に自動実行されます。

#### 手動実行

1. **Actions** タブを開く
2. **「リポジトリ情報同期」** を選択
3. **Run workflow** をクリック
4. 必要に応じてパラメータを調整：

| パラメータ | デフォルト | 説明 |
|-----------|-----------|------|
| 対象ユーザー名 | `KenichiroArai` | 監視するリポジトリのユーザー名 |
| Project番号 | `15` | 連動するProjectのID（未指定でProject連動なし） |
| Projectのステータスフィールド名 | `Status` | Projectで使用するフィールド名 |
| プライベートリポジトリを含める | `true` | プライベートリポジトリも対象にする |
| アーカイブ済みリポジトリを含める | `true` | アーカイブ済みも対象にする |
| サマリーCSVも出力する | `true` | 主要項目のみのサマリーCSVも生成 |
| Issue同期を実行 | `true` | `false` にするとIssue同期ジョブをスキップ |

#### 実行パターン

| パターン | 設定 | 実行内容 |
|---------|------|---------|
| **両方実行**（デフォルト） | そのまま実行 | CSV出力 + Issue同期 |
| **CSV出力のみ** | `run_issue_sync=false` | CSV出力のみ |

> ℹ️ Issue同期はCSVファイルを入力として使用するため、単体実行はできません。必ず直前にCSV出力ステップを実行してください。

#### 出力ファイルの取得

ワークフロー実行後、**Actions** タブから実行結果を開き、**Artifacts** セクションからCSVファイルをダウンロードできます。

### CSVファイルの配置と保存ポリシー

- スクリプトで生成されたCSVは `public/data/<ファイル名>/<YYYY>/<MM>/<ファイル名>-YYYY-MM-DD.csv` というディレクトリ構成で保存され、日付ごとに履歴管理されます。
- Next.jsビルド時に `public/data/` は `out/data/` にコピーされ、デプロイ時に `docs/data/` に配置されます。
- ワークフローは `public/data` ディレクトリ全体をコミット対象とし、日付フォルダ単位の新規ファイルも確実に追跡します。
- Artifactには実行中に更新・追加された最新のCSVファイル（標準出力とサマリーの両方）が添付されるため、不要な過去ファイルを繰り返しアップロードしません。

詳細なワークフロー仕様については [public/manual/ワークフロー同期制御.md](public/manual/ワークフロー同期制御.md) を参照してください。

## 📊 ステータス判定ロジック

リポジトリの活動状況は、以下の基準で自動判定されます：

| ステータス | 経過日数 | 説明 |
|---------|---------|------|
| 頻繁に更新 | 7日以内 | 非常に活発なリポジトリ |
| 定期的に更新 | 8-30日 | 定期的に保守されているリポジトリ |
| 時々更新 | 31-180日 | たまに更新されるリポジトリ |
| 更新が少ない | 181-365日 | 更新頻度が低いリポジトリ |
| 停滞中 | 366日以上 | 長期間更新されていないリポジトリ |

※ 最終Push日とIssue最終更新日の両方を考慮し、より新しい方を基準に判定します。

## 🧩 構成

### ディレクトリ構成

```text
repo-observer/
├── .github/
│   ├── workflows/                    # GitHub Actionsワークフローファイル
│   │   ├── repo-full-sync.yml        # リポジトリ情報同期ワークフロー
│   │   └── deploy-docs.yml           # GitHub Pagesデプロイワークフロー
│   └── scripts/                      # ワークフロー用スクリプト
│       └── repo-full-sync/           # repo-full-syncワークフロー専用スクリプト
│           ├── src/                  # TypeScriptソースコード
│           │   ├── exporters/       # CSV/Issue出力モジュール
│           │   └── ...               # その他のモジュール
│           └── README.md             # スクリプト詳細仕様
├── src/                              # ソースコード（Next.js 13+ App Router）
│   ├── app/                          # ページとレイアウト
│   │   ├── change-rate-analysis/      # 変化率分析ページ
│   │   ├── repositories/             # リポジトリ一覧ページ
│   │   └── ...
│   ├── components/                   # React コンポーネント
│   └── lib/                          # ユーティリティ関数
├── public/                           # 静的ファイル（ビルド時に out/ にコピー）
│   ├── data/                         # CSVデータ（ワークフローで生成）
│   └── manual/                       # ドキュメント
│       ├── 構想.md                   # プロジェクトの構想
│       ├── ワークフロー同期制御.md   # ワークフロー詳細仕様
│       ├── DEPLOY.md                 # GitHub Pagesデプロイガイド
│       ├── DIRECTORY_STRUCTURE.md    # ディレクトリ構成の説明
│       └── LICENSE                   # ライセンス
├── out/                              # Next.jsビルド出力（.gitignore対象）
│   └── ...                           # ビルドされたHTML/CSS/JS等
├── docs/                             # GitHub Pagesデプロイ用（Git管理対象）
│   └── ...                           # deploy-docs.ymlがout/からコピー
└── README.md                         # このファイル
```

### アーキテクチャ

```text
GitHub API
    ↓
repo-fetcher (リポジトリ情報取得)
    ↓
status-calculator (ステータス判定)
    ↓
repo-formatter (データ整形)
    ↓
    ├→ csv-exporter → CSVファイル
    └→ issue-exporter → GitHub Issues + Projects
```

詳細な技術仕様については [.github/scripts/repo-full-sync/README.md](.github/scripts/repo-full-sync/README.md) を参照してください。

## 🎯 想定される使用例

### ダッシュボード表示イメージ

GitHub Projectでは以下のようなダッシュボードが構築されます：

| リポジトリ | Stars | Forks | Open Issues | 最終Push | ステータス |
|---------|-------|-------|-------------|---------|----------|
| repo-A | ⭐ 24 | 🍴 8 | 🐞 3 | ⏰ 2025-11-05 | 頻繁に更新 |
| repo-B | ⭐ 5 | 🍴 2 | 🐞 0 | ⏰ 2025-10-15 | 定期的に更新 |
| repo-C | ⭐ 12 | 🍴 3 | 🐞 1 | ⏰ 2025-08-20 | 時々更新 |
| repo-D | ⭐ 3 | 🍴 0 | 🐞 0 | ⏰ 2024-12-01 | 停滞中 |

## 💻 ローカルでの実行

GitHub Actions以外に、ローカル環境でスクリプトを直接実行することも可能です。

詳細な実行方法、環境変数の設定、トラブルシューティングについては [.github/scripts/repo-full-sync/README.md](.github/scripts/repo-full-sync/README.md) を参照してください。

## ⚠️ 制限事項

### GitHub APIレート制限

- **認証済みリクエスト**: 1時間あたり5,000リクエスト
- **セカンダリレート制限**: 大量のリポジトリ処理時に発生する可能性あり

本ツールでは、セカンダリレート制限に対して自動リトライ機能（指数バックオフ方式）を実装しています。

### ワークフロー実行時間

大量のリポジトリ（100以上）を処理する場合、処理完了に時間がかかる可能性があります。

詳細なトラブルシューティングについては [.github/scripts/repo-full-sync/README.md](.github/scripts/repo-full-sync/README.md) および [public/manual/ワークフロー同期制御.md](public/manual/ワークフロー同期制御.md) を参照してください。

## 🔧 技術スタック

- **ワークフロー**: GitHub Actions
- **スクリプト**: TypeScript + Node.js + Octokit
- **API**: GitHub REST API + GraphQL API

詳細な技術仕様については [.github/scripts/repo-full-sync/README.md](.github/scripts/repo-full-sync/README.md) を参照してください。

## 📚 関連ドキュメント

- **[public/manual/構想.md](public/manual/構想.md)** - プロジェクトの構想と背景
- **[public/manual/ワークフロー同期制御.md](public/manual/ワークフロー同期制御.md)** - ワークフローの詳細仕様と運用方法
- **[.github/scripts/repo-full-sync/README.md](.github/scripts/repo-full-sync/README.md)** - スクリプトの技術仕様とローカル実行方法
- **[public/manual/DEPLOY.md](public/manual/DEPLOY.md)** - GitHub Pagesデプロイガイド
- **[public/manual/DIRECTORY_STRUCTURE.md](public/manual/DIRECTORY_STRUCTURE.md)** - ディレクトリ構成の説明

> **注**: ビルド後は `out/manual/` にコピーされ、GitHub Pagesデプロイ時に `docs/manual/` からアクセス可能です。

## 📝 ライセンス

このプロジェクトは [MIT License](public/manual/LICENSE) の下で公開されています。

## 🤝 コントリビューション

バグ報告や機能追加の提案は、Issueやプルリクエストでお気軽にどうぞ！

---

Made with ❤️ for better repository management
