const fs = require('fs');
const path = require('path');

// docs/out の内容を docs/ にコピーするスクリプト
const outDir = path.join(__dirname, '..', 'out');
const docsDir = path.join(__dirname, '..');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`Source directory does not exist: ${src}`);
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // .git, node_modules, .next などのディレクトリはスキップ
    if (entry.isDirectory()) {
      if (['.git', 'node_modules', '.next', 'out', 'scripts'].includes(entry.name)) {
        continue;
      }
      copyRecursive(srcPath, destPath);
    } else {
      // 既存のファイルは上書き
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${entry.name}`);
    }
  }
}

// .nojekyll ファイルを作成（Jekyllを無効化）
const nojekyllPath = path.join(docsDir, '.nojekyll');
if (!fs.existsSync(nojekyllPath)) {
  fs.writeFileSync(nojekyllPath, '');
  console.log('Created .nojekyll file');
}

console.log('Copying build output to docs directory...');
copyRecursive(outDir, docsDir);
console.log('Done!');

