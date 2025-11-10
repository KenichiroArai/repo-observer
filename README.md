# 📊 Repo Observer（リポジトリ・オブザーバー）

[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-automated-blue)](https://github.com/features/actions)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

GitHubリポジトリの活動状況を自動的に監視・管理し、GitHub Projectsで可視化するツールです。

## 🎯 概要

**Repo Observer** は、指定したGitHubユーザーの全リポジトリを自動取得し、各リポジトリの状態を1つのIssueとして管理します。GitHub Projectsと連携することで、リポジトリの活動状況を一目で把握できるダッシュボードを構築できます。

### 主な特徴

- 🔄 **自動同期**: 毎日自動的にリポジトリ情報を取得・更新（UTC 18:00 / JST 3:00）
- 📋 **Issue管理**: 各リポジトリを1つのIssueとして表現
- 📊 **5段階ステータス**: 活動状況を自動判定（頻繁に更新、定期的に更新、時々更新、更新が少ない、停滞中）
- 🎯 **Project連動**: GitHub Projects (v2) と自動連携
- 📈 **詳細な情報**: スター数、フォーク数、最終更新日、リリース情報など
- 🎛️ **柔軟な設定**: 手動実行時に対象ユーザーやProject番号を指定可能

## 📦 管理される情報

各リポジトリについて、以下の情報が自動的に収集・更新されます：

### 📝 説明・設定系

- 説明、使用言語、ライセンス、トピックス、ホームページURL

### 📊 活動指標系

- スター数、フォーク数、ウォッチャー数、未解決Issue数、リポジトリサイズ、活動ステータス

### ⏰ 日時系

- 作成日、最終更新日、最終Push日、Issue最終更新日、最新リリース

### 🔧 状態・設定系

- アーカイブ状態、公開状態、デフォルトブランチ、Issues/Wiki/Projects有効状態

## 🚀 使い方

### 1. リポジトリのセットアップ

このリポジトリをテンプレートとして使用するか、`.github/workflows/repo-status-sync.yml` をあなたの管理用リポジトリにコピーします。

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

### 4. ワークフローの実行

#### 自動実行

毎日 UTC 18:00（JST 3:00）に自動実行されます。

#### 手動実行

1. **Actions** タブを開く
2. **「リポジトリ状態をIssueに同期」** を選択
3. **Run workflow** をクリック
4. パラメータを入力（オプション）：

   - **対象ユーザー名**: 監視するリポジトリのユーザー名（デフォルト: `KenichiroArai`）
   - **Project番号**: 連動するProjectのID（未指定でProject連動なし）
   - **Projectのステータスフィールド名**: Projectで使用するフィールド名（デフォルト: `Status`）

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

```text
repo-observer/
├── .github/
│   └── workflows/
│       └── repo-status-sync.yml  # メインワークフロー
├── docs/
│   └── 構想.md                   # プロジェクトの構想・詳細設計
├── LICENSE                       # MITライセンス
└── README.md                     # このファイル
```

## 🎯 想定される使用例

### ダッシュボード表示イメージ

GitHub Projectでは以下のようなダッシュボードが構築されます：

| リポジトリ | Stars | Forks | Open Issues | 最終Push | ステータス |
|---------|-------|-------|-------------|---------|----------|
| repo-A | ⭐ 24 | 🍴 8 | 🐞 3 | ⏰ 2025-11-05 | 頻繁に更新 |
| repo-B | ⭐ 5 | 🍴 2 | 🐞 0 | ⏰ 2025-10-15 | 定期的に更新 |
| repo-C | ⭐ 12 | 🍴 3 | 🐞 1 | ⏰ 2025-08-20 | 時々更新 |
| repo-D | ⭐ 3 | 🍴 0 | 🐞 0 | ⏰ 2024-12-01 | 停滞中 |

## 💡 発展的な使い方

以下の機能は将来的な拡張として検討できます：

- **ラベル管理**: Issueに活動状況に応じたラベルを自動付与
- **変更通知**: Stars数の増減をSlack等に通知
- **フィルタリング**: 特定の条件に合うリポジトリのみを管理対象とする
- **複数ユーザー管理**: 複数のGitHubユーザーのリポジトリを一元管理

詳細な実装案については、[docs/構想.md](docs/構想.md) を参照してください。

## 🔧 技術スタック

- **GitHub Actions**: ワークフローの自動実行
- **GitHub REST API**: リポジトリ情報の取得
- **GitHub GraphQL API**: Project連携
- **gh CLI**: GitHub APIの操作
- **jq**: JSON処理

## 📝 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

## 🤝 コントリビューション

バグ報告や機能追加の提案は、Issueやプルリクエストでお気軽にどうぞ！

## 📚 参考資料

- [GitHub Actions ドキュメント](https://docs.github.com/ja/actions)
- [GitHub REST API](https://docs.github.com/ja/rest)
- [GitHub GraphQL API](https://docs.github.com/ja/graphql)
- [GitHub Projects (v2)](https://docs.github.com/ja/issues/planning-and-tracking-with-projects)

---

Made with ❤️ for better repository management
