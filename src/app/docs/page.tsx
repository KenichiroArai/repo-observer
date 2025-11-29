'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function DocsPage() {
  const [manualDocs, setManualDocs] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [activeDoc, setActiveDoc] = useState<string>('');

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

        // マニュアルドキュメントを自動的に読み込む
        // ビルド時に自動生成された manual-list.json からファイル一覧を取得
        const docs: { [key: string]: string } = {};

        try {
          // ビルド時に自動生成されたファイル一覧を読み込む
          const listResponse = await fetch(`${basePath}/manual-list.json`);
          if (!listResponse.ok) {
            console.warn('manual-list.jsonが見つかりません。ビルド時に自動生成されます。');
            setManualDocs(docs);
            return;
          }

          const docFiles: Array<{ key: string; path: string; filename: string }> = await listResponse.json();

          // 各ファイルを並列で読み込み
          const loadPromises = docFiles.map(async (doc) => {
            try {
              const response = await fetch(`${basePath}${doc.path}`);
              if (response.ok) {
                const content = await response.text();
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

          // 最初のドキュメントをアクティブに設定
          const firstKey = Object.keys(docs)[0];
          if (firstKey) {
            setActiveDoc(firstKey);
          }
        } catch (error) {
          console.error('manual-list.jsonの読み込みエラー:', error);
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
              <div className="prose prose-slate max-w-none
                prose-headings:font-bold prose-headings:text-gray-900
                prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8
                prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-6
                prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-4
                prose-p:text-gray-700 prose-p:leading-relaxed
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:text-blue-800 hover:prose-a:underline
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-code:text-sm prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-gray-800 prose-code:font-mono
                prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:p-4 prose-pre:overflow-x-auto
                prose-pre code:bg-transparent prose-pre code:text-gray-100 prose-pre code:p-0
                prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700
                prose-ul:list-disc prose-ul:pl-6 prose-ul:my-4
                prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-4
                prose-li:my-2 prose-li:text-gray-700
                prose-table:w-full prose-table:border-collapse prose-table:my-4
                prose-th:border prose-th:border-gray-300 prose-th:bg-gray-100 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold
                prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2
                prose-img:rounded-lg prose-img:shadow-md prose-img:my-4
                prose-hr:border-gray-300 prose-hr:my-8">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      if (inline) {
                        return (
                          <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                            {children}
                          </code>
                        );
                      }
                      return (
                        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      );
                    },
                    table({ children }: any) {
                      return (
                        <div className="overflow-x-auto my-4">
                          <table className="min-w-full border-collapse border border-gray-300">
                            {children}
                          </table>
                        </div>
                      );
                    },
                    thead({ children }: any) {
                      return <thead className="bg-gray-100">{children}</thead>;
                    },
                    th({ children }: any) {
                      return (
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">
                          {children}
                        </th>
                      );
                    },
                    td({ children }: any) {
                      return (
                        <td className="border border-gray-300 px-4 py-2 text-gray-700">
                          {children}
                        </td>
                      );
                    },
                    blockquote({ children }: any) {
                      return (
                        <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-4">
                          {children}
                        </blockquote>
                      );
                    },
                    a({ href, children }: any) {
                      return (
                        <a
                          href={href}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                          target={href?.startsWith('http') ? '_blank' : undefined}
                          rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                        >
                          {children}
                        </a>
                      );
                    },
                    img({ src, alt }: any) {
                      return (
                        <img
                          src={src}
                          alt={alt}
                          className="rounded-lg shadow-md my-4 max-w-full h-auto"
                        />
                      );
                    },
                  }}
                >
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

