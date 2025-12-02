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

function generateCsvFileList() {
  const dataDir = path.join(__dirname, 'public', 'data');
  const outputFile = path.join(__dirname, 'public', 'csv-file-list.json');

  try {
    const result = {
      repositories: [],
      'repositories-summary': []
    };

    // repositories と repositories-summary の両方を処理
    ['repositories', 'repositories-summary'].forEach(type => {
      const typeDir = path.join(dataDir, type);
      if (!fs.existsSync(typeDir)) {
        return;
      }

      // 年/月/ファイルの構造を再帰的に探索
      function scanDirectory(dir, year = null, month = null) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        entries.forEach(entry => {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            // 年または月のディレクトリ
            if (!year) {
              // 年のディレクトリ
              scanDirectory(fullPath, entry.name, null);
            } else if (!month) {
              // 月のディレクトリ
              scanDirectory(fullPath, year, entry.name);
            }
          } else if (entry.isFile() && entry.name.endsWith('.csv')) {
            // CSVファイルから日付を抽出
            // 形式: repositories-2025-11-29.csv または repositories-summary-2025-11-29.csv
            const match = entry.name.match(/(\d{4}-\d{2}-\d{2})\.csv$/);
            if (match) {
              const dateStr = match[1];
              result[type].push({
                date: dateStr,
                year: year,
                month: month,
                filename: entry.name,
                path: `/data/${type}/${year}/${month}/${entry.name}`
              });
            }
          }
        });
      }

      scanDirectory(typeDir);

      // 日付でソート（新しい順）
      result[type].sort((a, b) => b.date.localeCompare(a.date));
    });

    // JSONファイルとして出力
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf-8');
    const totalFiles = result.repositories.length + result['repositories-summary'].length;
    console.log(`✅ CSVファイル一覧を自動生成: repositories=${result.repositories.length}, repositories-summary=${result['repositories-summary'].length}, 合計=${totalFiles}ファイル`);
  } catch (error) {
    console.error('❌ csv-file-list.json生成エラー:', error);
    // エラー時も空のオブジェクトを出力（ビルドを継続させるため）
    fs.writeFileSync(outputFile, JSON.stringify({ repositories: [], 'repositories-summary': [] }, null, 2));
  }
}

// ビルド開始時にファイル一覧を生成
generateManualList();
generateCsvFileList();

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

