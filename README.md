# 📊 Repo Observer（リポジトリ・オブザーバー）

[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-automated-blue)](https://github.com/features/actions)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

GitHubリポジトリの活動状況を自動的に監視・管理し、GitHub ProjectsやCSVファイルで可視化するツールです。

## 🎯 概要

**Repo Observer** は、指定したGitHubユーザーの全リポジトリを自動取得し、以下の形式で出力できます：

1. **Issue管理**: 各リポジトリを1つのIssueとして表現し、GitHub Projectsで可視化
2. **CSV出力**: 全リポジトリ情報をCSVファイルとして出力し、Excel等で分析

### 主な特徴

- 🔄 **自動同期**: 毎日自動的にリポジトリ情報を取得・更新（UTC 18:00 / JST 3:00）
- 📋 **Issue管理**: 各リポジトリを1つのIssueとして表現
- 📄 **CSV出力**: リポジトリ情報をCSVファイルに出力（毎日自動実行）
- 📊 **5段階ステータス**: 活動状況を自動判定（頻繁に更新、定期的に更新、時々更新、更新が少ない、停滞中）
- 🎯 **Project連動**: GitHub Projects (v2) と自動連携
- 📈 **詳細な情報**: スター数、フォーク数、最終更新日、リリース情報など
- 🎛️ **柔軟な設定**: 手動実行時に対象ユーザーやProject番号を指定可能
- 💻 **TypeScript/Node.js**: 共通化されたスクリプトで保守性向上

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

### 4. 依存関係のインストール

初回のみ、スクリプトの依存関係をインストールします：

```bash
cd scripts
npm install
npm run build
```

### 5. ワークフローの実行

#### 🎯 リポジトリ情報同期ワークフロー

CSV出力とIssue同期を1回の実行で完了します。

**自動実行**: 毎日 UTC 18:00（JST 3:00）に自動実行されます。

**手動実行**:

1. **Actions** タブを開く
2. **「リポジトリ情報同期」** を選択
3. **Run workflow** をクリック
4. パラメータを入力（オプション）：

   - **対象ユーザー名**: 監視するリポジトリのユーザー名（デフォルト: `KenichiroArai`）
   - **Project番号**: 連動するProjectのID（未指定でProject連動なし）
   - **Projectのステータスフィールド名**: Projectで使用するフィールド名（デフォルト: `Status`）
   - **プライベートリポジトリを含める**: プライベートリポジトリも対象にする
   - **アーカイブ済みリポジトリを含める**: アーカイブ済みも対象にする
   - **サマリーCSVも出力する**: 主要項目のみのサマリーCSVも生成
   - **CSV出力をスキップ**: Issue同期のみ実行したい場合
   - **Issue同期をスキップ**: CSV出力のみ実行したい場合

**実行パターン**:

| パターン | 設定 | 実行内容 |
|---------|------|---------|
| 両方実行（通常） | デフォルト | CSV出力 + Issue同期 |
| Issue同期のみ | `skip_csv: true` | Issue同期のみ |
| CSV出力のみ | `skip_issues: true` | CSV出力のみ |

**特徴**:
- ✅ **効率的**: ビルドを1回に集約し、成果物を再利用
- ✅ **安全**: 順次実行でデータの一貫性を保証
- ✅ **高速**: ビルド済みスクリプトを後続ジョブで再利用
- ✅ **柔軟**: スキップオプションで片方だけの実行も可能

**出力ファイルの取得**:

ワークフロー実行後、**Actions** タブから該当の実行結果を開き、**Artifacts** セクションから CSVファイルをダウンロードできます

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
│       └── repo-full-sync.yml     # リポジトリ情報同期（毎日 18:00 UTC）
├── scripts/                        # TypeScript/Node.jsスクリプト
│   ├── src/
│   │   ├── index.ts               # エントリーポイント
│   │   ├── types.ts               # 型定義
│   │   ├── repo-fetcher.ts        # リポジトリ情報取得
│   │   ├── repo-formatter.ts      # データ整形
│   │   ├── status-calculator.ts   # ステータス判定
│   │   └── exporters/
│   │       ├── csv-exporter.ts    # CSV出力
│   │       └── issue-exporter.ts  # Issue出力
│   ├── dist/                      # ビルド成果物
│   ├── output/                    # 出力ファイル
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── docs/
│   └── 構想.md                    # プロジェクトの構想・詳細設計
├── LICENSE                        # MITライセンス
└── README.md                      # このファイル
```

### アーキテクチャ

```
GitHub API
    ↓
repo-fetcher.ts (リポジトリ情報取得)
    ↓
status-calculator.ts (ステータス判定)
    ↓
repo-formatter.ts (データ整形)
    ↓
    ├→ csv-exporter.ts (CSV出力) → CSVファイル
    └→ issue-exporter.ts (Issue出力) → GitHub Issues + Projects
```

**共通化のメリット**:

- ✅ **保守性向上**: ロジックの重複を排除し、修正箇所を一箇所に集約
- ✅ **型安全性**: TypeScriptによる静的型チェックでバグを事前に防止
- ✅ **拡張性**: 新しい出力形式（JSON、Markdownなど）を容易に追加可能
- ✅ **テスト容易性**: モジュール化により単体テストが書きやすい

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

GitHub Actions以外に、ローカル環境でスクリプトを実行することも可能です。

### CSV出力

```bash
cd scripts
export GITHUB_TOKEN=your_github_token
export TARGET_USER=KenichiroArai
export OUTPUT_PATH=./output/repositories.csv
npm run export-csv
```

### Issue同期

```bash
cd scripts
export GITHUB_TOKEN=your_github_token
export TARGET_USER=KenichiroArai
export REPOSITORY=owner/repo
export PROJECT_NUMBER=15
npm run sync-issues
```

詳細は [scripts/README.md](scripts/README.md) を参照してください。

## 💡 発展的な使い方

以下の機能は将来的な拡張として検討できます：

- **ラベル管理**: Issueに活動状況に応じたラベルを自動付与
- **変更通知**: Stars数の増減をSlack等に通知
- **フィルタリング**: 特定の条件に合うリポジトリのみを管理対象とする
- **複数ユーザー管理**: 複数のGitHubユーザーのリポジトリを一元管理
- **JSON出力**: API連携用のJSON形式での出力
- **Markdown出力**: レポート用のMarkdownドキュメント生成

詳細な実装案については、[docs/構想.md](docs/構想.md) を参照してください。

## ⚠️ 制限事項とトラブルシューティング

### GitHub APIレート制限

このツールはGitHub APIを使用するため、以下のレート制限があります：

#### プライマリレート制限

- **認証済みリクエスト**: 1時間あたり5,000リクエスト
- **GitHub Actions**: より高い制限（通常は十分）

#### セカンダリレート制限

大量のリポジトリを処理する場合、セカンダリレート制限に達する可能性があります。本ツールでは以下の対策を実装しています：

**自動リトライ機能**
- セカンダリレート制限エラー検出時、自動的に待機してリトライ
- 指数バックオフ方式: 1分 → 2分 → 4分 → 8分 → 16分（最大5回）
- リトライ中は進捗状況をログに出力

**待機時間の設定**
- 各リポジトリ処理間に3秒待機
- Issueキャッシュのページ取得間に2秒待機
- Project更新などのAPI呼び出し間に適切な間隔を設定

**推奨事項**
- 大量のリポジトリ（100以上）を処理する場合は、処理完了に時間がかかる可能性があります
- GitHub Actions の実行ログで進捗状況を確認できます
- エラーが発生した場合でも、次回実行時に続きから処理されます

### ワークフロー実行時間制限

GitHub Actionsの無料プランでは、ワークフローの実行時間が制限されています：

- **パブリックリポジトリ**: 実質的に無制限
- **プライベートリポジトリ**: 月あたりの実行時間に制限あり

大量のリポジトリを処理する場合は、実行時間にご注意ください。

## 🔧 技術スタック

### ワークフロー

- **GitHub Actions**: ワークフローの自動実行

### スクリプト

- **TypeScript**: 型安全な実装
- **Node.js**: 実行環境
- **Octokit**: GitHub REST API クライアント
- **@octokit/graphql**: GitHub GraphQL API クライアント
- **csv-writer**: CSV出力
- **date-fns**: 日付処理

### API

- **GitHub REST API**: リポジトリ情報の取得
- **GitHub GraphQL API**: Project連携

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
