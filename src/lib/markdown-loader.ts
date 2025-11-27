export async function loadMarkdown(filePath: string): Promise<string> {
  try {
    // クライアントサイドではfetchを使用（静的エクスポートでは常にクライアントサイド）
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Markdownファイルの読み込みに失敗しました: ${filePath}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Markdown読み込みエラー:', error);
    return '';
  }
}

export async function loadReadme(): Promise<string> {
  return loadMarkdown('/README.md');
}

export async function loadManualDocs(): Promise<{ [key: string]: string }> {
  const docs: { [key: string]: string } = {};

  const docFiles = [
    { key: '構想', path: '/public/manual/構想.md' },
    { key: 'ワークフロー同期制御', path: '/public/manual/ワークフロー同期制御.md' },
  ];

  for (const doc of docFiles) {
    docs[doc.key] = await loadMarkdown(doc.path);
  }

  return docs;
}

