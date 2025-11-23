import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import XShareButton from "../../components/XShareButton";

export const metadata: Metadata = {
  title: "Repo Observer - リポジトリ可視化ダッシュボード",
  description: "GitHubリポジトリの活動状況を可視化するダッシュボード",
  openGraph: {
    title: "Repo Observer - リポジトリ可視化ダッシュボード",
    description: "GitHubリポジトリの活動状況を可視化するダッシュボード",
    type: "website",
    siteName: "Repo Observer",
  },
  twitter: {
    card: "summary_large_image",
    title: "Repo Observer - リポジトリ可視化ダッシュボード",
    description: "GitHubリポジトリの活動状況を可視化するダッシュボード",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                    📊 Repo Observer
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    href="/"
                    className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    トップ
                  </Link>
                  <Link
                    href="/dashboard"
                    className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    ダッシュボード
                  </Link>
                  <Link
                    href="/repositories"
                    className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    リポジトリ一覧
                  </Link>
                  <Link
                    href="/docs"
                    className="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    ドキュメント
                  </Link>
                </div>
              </div>
              <div className="flex items-center">
                <XShareButton />
              </div>
            </div>
          </div>
        </nav>
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-12">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Made with ❤️ for better repository management
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

