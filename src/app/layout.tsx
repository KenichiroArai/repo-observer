import type { Metadata } from "next";
import "./globals.css";
import Navigation from "../components/Navigation";

export const metadata: Metadata = {
  title: "リポジトリ・オブザーバー - リポジトリ可視化ダッシュボード",
  description: "GitHubリポジトリの活動状況を可視化するダッシュボード",
  openGraph: {
    title: "リポジトリ・オブザーバー - リポジトリ可視化ダッシュボード",
    description: "GitHubリポジトリの活動状況を可視化するダッシュボード",
    type: "website",
    siteName: "リポジトリ・オブザーバー",
  },
  twitter: {
    card: "summary_large_image",
    title: "リポジトリ・オブザーバー - リポジトリ可視化ダッシュボード",
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
        <Navigation />
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

