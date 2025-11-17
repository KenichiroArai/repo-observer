# Repo Observer Docs - Next.js ダッシュボード

このディレクトリには、Repo Observerのデータを可視化するNext.jsアプリケーションが含まれています。

## セットアップ

### 依存関係のインストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認できます。

### ビルド

```bash
npm run build
```

ビルドされたファイルは `out` ディレクトリに出力されます。

## GitHub Pagesへのデプロイ

このアプリケーションはGitHub Pages用に設定されています。

### 設定

`next.config.js` の `basePath` をリポジトリ名に合わせて調整してください：

```javascript
basePath: process.env.NODE_ENV === 'production' ? '/your-repo-name' : '',
```

### デプロイ手順

1. リポジトリの Settings → Pages を開く
2. Source を "GitHub Actions" に設定
3. ワークフローを作成（`.github/workflows/deploy.yml` を参照）

または、手動でデプロイする場合：

```bash
npm run build
# out ディレクトリの内容を GitHub Pages のブランチにプッシュ
```

## ディレクトリ構成

```
docs/
├── app/              # Next.js App Router のページ
│   ├── page.tsx     # トップページ
│   ├── dashboard/   # ダッシュボードページ
│   ├── repositories/# リポジトリ一覧ページ
│   └── docs/        # ドキュメントページ
├── components/      # React コンポーネント
├── lib/             # ユーティリティ関数
├── public/          # 静的ファイル（CSV、Markdown等）
└── data/            # CSVデータ（publicにコピーされる）
```

## 機能

- 📊 **ダッシュボード**: リポジトリの統計情報をグラフで表示
- 📋 **リポジトリ一覧**: 全リポジトリの詳細情報を一覧表示
- 📚 **ドキュメント**: READMEやマニュアルをMarkdown形式で表示
- 🔍 **検索・フィルタ**: リポジトリの検索とステータスでのフィルタリング

## 技術スタック

- **Next.js 14**: React フレームワーク
- **TypeScript**: 型安全性
- **Tailwind CSS**: スタイリング
- **Recharts**: グラフ表示
- **React Markdown**: Markdown表示
- **PapaParse**: CSV解析

