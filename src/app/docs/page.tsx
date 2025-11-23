'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function DocsPage() {
  const [readme, setReadme] = useState<string>('');
  const [manualDocs, setManualDocs] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [activeDoc, setActiveDoc] = useState<string>('readme');

  useEffect(() => {
    async function fetchDocs() {
      try {
        // basePathを取得
        // GitHub Pagesで /docs フォルダを公開する場合:
        // URL: https://username.github.io/repo-name/
        // docs/ フォルダの内容がルートとして公開される
        // Next.jsのbasePathは /repo-name に設定されている
        // したがって、basePathは /repo-name を返す（/docs は含めない）
        const getBasePath = () => {
          if (typeof window === 'undefined') return '';

          // 開発環境（localhost）ではbasePathは空文字列
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return '';
          }

          // 本番環境（GitHub Pages）では、URLからbasePathを取得
          const pathname = window.location.pathname;
          const parts = pathname.split('/').filter(Boolean);

          // リポジトリ名（最初のパスセグメント）を取得
          // 例: /repo-observer/docs → basePath = /repo-observer
          // ただし、/docs のような場合は空文字列を返す（開発環境の可能性）
          if (parts.length > 0 && parts[0] !== 'docs' && parts[0] !== 'dashboard' && parts[0] !== 'top' && parts[0] !== 'documents') {
            return '/' + parts[0];
          }

          return '';
        };

        const basePath = getBasePath();

        // README.mdを読み込む
        const readmeResponse = await fetch(`${basePath}/README.md`);
        if (readmeResponse.ok) {
          const readmeText = await readmeResponse.text();
          setReadme(readmeText);
        }

        // マニュアルドキュメントを読み込む
        const docs: { [key: string]: string } = {};

        const docFiles = [
          { key: '構想', path: '/manual/構想.md' },
          { key: 'ワークフロー同期制御', path: '/manual/ワークフロー同期制御.md' },
        ];

        for (const doc of docFiles) {
          try {
            const response = await fetch(`${basePath}${doc.path}`);
            if (response.ok) {
              docs[doc.key] = await response.text();
            }
          } catch (error) {
            console.error(`ドキュメント読み込みエラー (${doc.key}):`, error);
          }
        }

        setManualDocs(docs);
      } catch (error) {
        console.error('ドキュメント読み込みエラー:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchDocs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">ドキュメントを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  const getActiveContent = () => {
    if (activeDoc === 'readme') {
      return readme;
    }
    return manualDocs[activeDoc] || '';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">📚 ドキュメント</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">目次</h2>
            <nav className="space-y-2">
              <button
                onClick={() => setActiveDoc('readme')}
                className={`w-full text-left px-4 py-2 rounded-md transition ${
                  activeDoc === 'readme'
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                README
              </button>
              {Object.keys(manualDocs).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveDoc(key)}
                  className={`w-full text-left px-4 py-2 rounded-md transition ${
                    activeDoc === key
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {key}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-8">
            {getActiveContent() ? (
              <div className="prose max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {getActiveContent()}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                ドキュメントが見つかりませんでした。
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

