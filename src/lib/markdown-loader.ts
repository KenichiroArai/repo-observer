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
 * ビルド時に生成された manual-list.json からファイル一覧を取得
 * publicフォルダはビルド時にルートにコピーされるため、/manual/ からアクセス
 */
export async function loadManualDocs(): Promise<{ [key: string]: string }> {
  const docs: { [key: string]: string } = {};

  try {
    // ビルド時に自動生成されたファイル一覧を読み込む
    const listResponse = await fetch('/manual-list.json');
    if (!listResponse.ok) {
      console.warn('manual-list.jsonが見つかりません。ビルド時に自動生成されます。');
      return docs;
    }

    const docFiles: Array<{ key: string; path: string; filename: string }> = await listResponse.json();

    // 各ファイルを並列で読み込み
    const loadPromises = docFiles.map(async (doc) => {
      try {
        const content = await loadMarkdown(doc.path);
        if (content) {
          return { key: doc.key, content };
        }
      } catch (error) {
        console.error(`ドキュメント読み込みエラー (${doc.key}):`, error);
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
    console.error('manual-list.jsonの読み込みエラー:', error);
  }

  return docs;
}

