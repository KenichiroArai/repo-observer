# セットアップガイド

## 初回セットアップ

### 1. 依存関係のインストール

```bash
cd docs
npm install
```

### 2. データファイルの準備

CSVファイルとMarkdownファイルは既に `public` フォルダにコピーされています。
新しいデータが追加された場合は、以下のコマンドでコピーしてください：

```bash
# Windows (コマンドプロンプト)
xcopy /E /I /Y data public\data
xcopy /E /I /Y manual public\manual

# Linux/Mac
cp -r data/* public/data/
cp -r manual/* public/manual/
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認できます。

## ビルドとデプロイ

### ローカルビルド

```bash
npm run build
```

ビルドされたファイルは `out` ディレクトリに出力されます。

### GitHub Pagesへのデプロイ

1. リポジトリの Settings → Pages を開く
2. Source を "GitHub Actions" に設定
3. `.github/workflows/deploy-docs.yml` が自動的に実行されます

または、手動でデプロイする場合：

```bash
npm run build
# out ディレクトリの内容を GitHub Pages のブランチにプッシュ
```

## 環境変数

`next.config.js` で以下の環境変数を使用できます：

- `GITHUB_REPOSITORY`: リポジトリ名（自動設定）
- `NODE_ENV`: 実行環境（`production` または `development`）

## トラブルシューティング

### CSVファイルが読み込めない

- `public/data` フォルダにCSVファイルが存在するか確認
- ブラウザの開発者ツールでネットワークエラーを確認

### グラフが表示されない

- ブラウザのコンソールでエラーを確認
- Rechartsが正しくインストールされているか確認: `npm list recharts`

### ドキュメントが表示されない

- `public/manual` フォルダにMarkdownファイルが存在するか確認
- `public/README.md` が存在するか確認

