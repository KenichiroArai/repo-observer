/** @type {import('next').NextConfig} */
// GitHub Pagesで /docs フォルダを公開する場合、basePathは /repo-name になる
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'repo-observer';
const basePath = process.env.NODE_ENV === 'production' ? `/${repoName}` : '';

// ビルド時に manual 配下のファイル一覧を自動生成
const fs = require('fs');
const path = require('path');

function generateManualList() {
  const manualDir = path.join(__dirname, 'public', 'manual');
  const outputFile = path.join(__dirname, 'public', 'manual-list.json');

  try {
    if (!fs.existsSync(manualDir)) {
      // ディレクトリが存在しない場合は空の配列を出力
      fs.writeFileSync(outputFile, JSON.stringify([], null, 2));
      return;
    }

    // .md ファイルを取得
    const files = fs.readdirSync(manualDir)
      .filter(file => file.endsWith('.md'))
      .map(file => {
        return {
          key: path.basename(file, '.md'), // 拡張子を除いたファイル名をキーとして使用
          path: `/manual/${file}`, // パス（publicフォルダはビルド時にルートにコピーされるため、/public/は不要）
          filename: file
        };
      })
      .sort((a, b) => a.filename.localeCompare(b.filename)); // ファイル名でソート

    // JSONファイルとして出力
    fs.writeFileSync(outputFile, JSON.stringify(files, null, 2), 'utf-8');
    console.log(`✅ manualファイル一覧を自動生成: ${files.length}ファイル検出`);
  } catch (error) {
    console.error('❌ manual-list.json生成エラー:', error);
    // エラー時も空の配列を出力（ビルドを継続させるため）
    fs.writeFileSync(outputFile, JSON.stringify([], null, 2));
  }
}

// ビルド開始時にファイル一覧を生成
generateManualList();

const nextConfig = {
  output: 'export',
  distDir: 'out',
  basePath: basePath,
  assetPrefix: basePath,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig

