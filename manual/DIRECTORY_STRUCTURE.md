# ディレクトリ構成の説明

このプロジェクトは、Next.js + TypeScript で GitHub Pages に公開する構成になっています。

## 📁 ディレクトリ構成

```text
repo-observer/
├─ src/                    # ソースコード（Next.js 13+ App Router）
│  ├─ app/                 # ページとレイアウト
│  ├─ components/          # React コンポーネント
│  └─ lib/                 # ユーティリティ関数
│
├─ public/                 # 静的ファイル（ビルド時に docs/ にコピーされる）
│  ├─ data/                # CSVデータファイル
│  └─ manual/              # Markdownドキュメント
│
├─ docs/                   # GitHub Pages の公開ディレクトリ（ビルド出力先）
│  ├─ data/                # ビルド時に public/data/ からコピーされる
│  └─ .nojekyll            # Jekyll無効化ファイル
│
├─ .github/
│  ├─ workflows/           # GitHub Actionsワークフロー
│  └─ scripts/             # データ取得スクリプト（GitHub Actions用）
├─ tool/                   # ビルドツール（現在は未使用）
├─ manual/                 # マニュアルドキュメント（ソース）
│
├─ next.config.js          # Next.js設定（distDir: 'docs'）
├─ tsconfig.json           # TypeScript設定（@/* → ./src/*）
└─ package.json            # 依存関係とスクリプト
```

## 🔧 重要な設定

### 1. `next.config.js`

- `distDir: 'docs'` - ビルド出力を直接 `docs/` に生成
- `output: 'export'` - 静的HTMLを生成
- `basePath` - GitHub Pages用のベースパス

### 2. `tsconfig.json`

- `paths: { "@/*": ["./src/*"] }` - インポートエイリアス設定

### 3. `package.json`

- `npm run build` - ビルドを実行（出力先: `docs/`）
- `npm run dev` - 開発サーバー起動

## 📦 ビルドプロセス

1. **開発時**

   ```bash
   npm run dev
   ```

   - 開発サーバーが起動（`localhost:3000`）

2. **ビルド時**

   ```bash
   npm run build
   ```

   - `src/` 配下のコードをコンパイル
   - `public/` 配下のファイルを `docs/` にコピー
   - 静的HTMLを `docs/` に生成

3. **GitHub Actions でのデプロイ**
   - `.github/workflows/deploy-docs.yml` が自動実行
   - ビルド後に `docs/` をGitHub Pagesにデプロイ

## 🔄 データファイルの管理

- **元データ**: `docs/data/` または `public/data/` に配置
- **ビルド時**: `public/data/` の内容が自動的に `docs/data/` にコピーされる
- **Git管理**: `docs/data/**/*.csv` は追跡対象

## 📝 変更履歴

- 2025-11-23: `app/`, `components/`, `lib/` を `src/` 配下に移動
- `distDir: 'docs'` を設定してビルド出力を直接 `docs/` に生成
- `copy-build-to-docs.js` は不要になったため削除
