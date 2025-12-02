# GitHub Pages デプロイガイド

## 現在のアクセス方法

現在、GitHub Pagesの設定で `/docs` フォルダを公開するように設定されている場合、以下のURLでアクセスできます：

```text
https://<ユーザー名>.github.io/<リポジトリ名>/
```

例: `https://kenichiroarai.github.io/repo-observer/`

> **注意**: ソースコードはルートディレクトリ（`/`）に配置され、ビルド結果のみが `/docs` フォルダに配置されます。

## 自動デプロイの設定

### 1. GitHub Pagesの設定

1. リポジトリの **Settings** → **Pages** を開く
2. **Source** を **"GitHub Actions"** に設定
3. 保存

### 2. ワークフローの動作

`.github/workflows/deploy-docs.yml` が以下のタイミングで自動実行されます：

- ソースコード（`app/`, `components/`, `lib/`など）が変更されたとき
- 設定ファイル（`next.config.js`, `package.json`など）が変更されたとき
- 手動実行時（Actions タブから実行可能）

### 3. デプロイの流れ

1. ルートディレクトリでNext.jsアプリをビルド
2. `out/` フォルダにビルド結果を出力（`next.config.js` の `distDir: 'out'` 設定により）
3. `out/` の内容を `docs/` フォルダにコピー
4. `.nojekyll` ファイルを作成（Jekyllを無効化）
5. GitHub Pagesにデプロイ

## 手動デプロイ

ローカルでビルドしてデプロイする場合：

```bash
# ルートディレクトリで実行
npm install
npm run build
npm run deploy
```

その後、変更をコミット・プッシュ：

```bash
git add docs/
git commit -m "Update docs"
git push
```

> **注意**: ソースコードはコミット対象に含めないでください。`docs/` フォルダのみをコミットします。

## トラブルシューティング

### README.mdが表示される

- ワークフローが正常に実行されているか確認（Actions タブ）
- `out/` フォルダが正常にビルドされているか確認
- `docs/` フォルダのルートに `index.html` が存在するか確認
- `.nojekyll` ファイルが存在するか確認

### 404エラーが表示される

- `next.config.js` の `basePath` が正しく設定されているか確認
- リポジトリ名と `basePath` が一致しているか確認

### アセット（画像、CSS等）が読み込めない

- ブラウザの開発者ツールでネットワークエラーを確認
- `assetPrefix` が正しく設定されているか確認

## 確認方法

デプロイが成功したら、以下のURLでサイトにアクセスできます：

```text
https://<ユーザー名>.github.io/<リポジトリ名>/
```

または、リポジトリの Settings → Pages に表示されているURLを使用してください。

## プロジェクト構造

```text
repo-observer/
├── src/              # ソースコード（Next.js 13+ App Router）
│   ├── app/          # ページとレイアウト
│   ├── components/   # React コンポーネント
│   └── lib/          # ユーティリティ関数
├── public/           # 静的ファイル（CSV、Markdown等）
│   ├── data/         # CSVデータ（ワークフローで生成）
│   └── manual/       # ドキュメント
├── out/              # Next.jsビルド出力（.gitignore対象）
│   └── ...           # ビルドされたHTML/CSS/JS等
├── docs/             # GitHub Pagesデプロイ用（out/からコピー、Git管理対象）
│   ├── index.html
│   └── ...
└── .github/          # GitHub Actions設定
    ├── workflows/    # ワークフローファイル
    └── scripts/      # ワークフロー用スクリプト
```
