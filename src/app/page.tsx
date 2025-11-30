'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadLatestSummary } from '../lib/csv-loader';
import { RepositorySummary } from '../lib/csv-loader';
import StatusChart from '../components/StatusChart';
import LanguageChart from '../components/LanguageChart';

export default function Home() {
  const [data, setData] = useState<RepositorySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const repos = await loadLatestSummary();
        setData(repos);
      } catch (error) {
        console.error('データ読み込みエラー:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statusCounts = data.reduce((acc, repo) => {
    acc[repo.status] = (acc[repo.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));

  const languageCounts = data.reduce((acc, repo) => {
    const lang = repo.language || '不明';
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const languageData = Object.entries(languageCounts)
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalStars = data.reduce((sum, repo) => sum + (Number(repo.stars) || 0), 0);
  const totalForks = data.reduce((sum, repo) => sum + (Number(repo.forks) || 0), 0);
  const totalOpenIssues = data.reduce((sum, repo) => sum + (Number(repo.openIssues) || 0), 0);
  const totalClosedIssues = data.reduce((sum, repo) => sum + (Number(repo.closedIssues) || 0), 0);
  const totalIssues = totalOpenIssues + totalClosedIssues;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">データを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          📊 Repo Observer
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          GitHubリポジトリの活動状況を自動的に監視・管理し、可視化するダッシュボードです。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-3xl">⭐</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">総スター数</p>
              <p className="text-2xl font-semibold text-gray-900">{totalStars.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-3xl">🍴</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">総フォーク数</p>
              <p className="text-2xl font-semibold text-gray-900">{totalForks.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-3xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">総Issue数</p>
              <p className="text-2xl font-semibold text-gray-900">{totalIssues.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-3xl">🐞</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">未解決Issue</p>
              <p className="text-2xl font-semibold text-gray-900">{totalOpenIssues.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-3xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">クローズしたIssue</p>
              <p className="text-2xl font-semibold text-gray-900">{totalClosedIssues.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">ステータス別リポジトリ数</h2>
          <StatusChart data={statusData} />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">言語別リポジトリ数（上位10）</h2>
          <LanguageChart data={languageData} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">クイックアクセス</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/change-rate-analysis"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <h3 className="font-semibold text-gray-900 mb-2">📊 変化率分析</h3>
            <p className="text-sm text-gray-600">時系列による変化率と成長率を分析</p>
          </Link>
          <Link
            href="/repositories"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <h3 className="font-semibold text-gray-900 mb-2">📋 リポジトリ一覧</h3>
            <p className="text-sm text-gray-600">全リポジトリの詳細情報を一覧表示</p>
          </Link>
          <Link
            href="/docs"
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <h3 className="font-semibold text-gray-900 mb-2">📚 ドキュメント</h3>
            <p className="text-sm text-gray-600">プロジェクトのドキュメントを閲覧</p>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">最新のリポジトリ（上位5件）</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  リポジトリ名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  言語
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  スター数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最終Push
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.slice(0, 5).map((repo) => (
                <tr key={repo.name}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {repo.name}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {repo.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {repo.language || '不明'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ⭐ {repo.stars}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {repo.pushedDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-center">
          <Link
            href="/repositories"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            すべてのリポジトリを見る →
          </Link>
        </div>
      </div>
    </div>
  );
}

