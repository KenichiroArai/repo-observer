export async function loadMarkdown(filePath: string, silent: boolean = false): Promise<string> {
  try {
    // クライアントサイドではfetchを使用（静的エクスポートでは常にクライアントサイド）
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Markdownファイルの読み込みに失敗しました: ${filePath}`);
    }
    return await response.text();
  } catch (error) {
    if (!silent) {
      console.error('Markdown読み込みエラー:', error);
    }
    return '';
  }
}

export async function loadReadme(): Promise<string> {
  return loadMarkdown('/README.md');
}

/**
 * manual配下の.mdファイルを自動的に検出して読み込む
 * ランタイムで動的にファイルを検出する
 * publicフォルダはビルド時にルートにコピーされるため、/manual/ からアクセス
 */
export async function loadManualDocs(basePath: string = ''): Promise<{ [key: string]: string }> {
  const docs: { [key: string]: string } = {};

  try {
    // 動的にファイルを検出
    const docFiles = await discoverManualFiles(basePath);

    // 各ファイルを並列で読み込み
    const loadPromises = docFiles.map(async (doc) => {
      try {
        const content = await loadMarkdown(`${basePath}${doc.path}`, true);
        if (content) {
          return { key: doc.key, content };
        }
      } catch (error) {
        // ファイルが存在しない場合は無視
      }
      return null;
    });

    const results = await Promise.all(loadPromises);

    // 読み込み成功したファイルのみを追加
    for (const result of results) {
      if (result) {
        docs[result.key] = result.content;
      }
    }
  } catch (error) {
    console.error('マニュアルドキュメント読み込みエラー:', error);
  }

  return docs;
}

/**
 * manual配下の.mdファイルを動的に検出
 * GitHub Pagesではディレクトリリストを取得できないため、
 * 既知の一般的なファイル名を試行する
 */
async function discoverManualFiles(basePath: string): Promise<Array<{ key: string; path: string; filename: string }>> {
  const discoveredFiles: Array<{ key: string; path: string; filename: string }> = [];

  // 一般的なマニュアルファイル名のリスト（実際のファイル名に合わせて調整）
  // 新しくファイルが追加された場合は、このリストに追加する必要がある
  const commonFileNames = [
    'DEPLOY.md',
    'DIRECTORY_STRUCTURE.md',
    'ワークフロー同期制御.md',
    '構想.md',
    // 必要に応じて追加のファイル名をここに追加
  ];

  // 各ファイル名について存在確認
  const checkPromises = commonFileNames.map(async (filename) => {
    const path = `/manual/${filename}`;
    try {
      const response = await fetch(`${basePath}${path}`, { method: 'HEAD' });
      if (response.ok || response.status === 404) {
        // 404の場合は存在しない（正常）
        if (response.ok) {
          // ファイル名からキーを生成（拡張子を除く）
          const key = filename.replace(/\.md$/, '');
          return {
            key,
            path,
            filename
          };
        }
      }
    } catch {
      // エラーは無視
    }
    return null;
  });

  const results = await Promise.all(checkPromises);

  // 存在するファイルのみを追加
  for (const result of results) {
    if (result) {
      discoveredFiles.push(result);
    }
  }

  // ファイル名でソート
  discoveredFiles.sort((a, b) => a.filename.localeCompare(b.filename));

  return discoveredFiles;
}

