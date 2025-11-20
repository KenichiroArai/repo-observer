'use client';

import { useEffect, useState } from 'react';
import { loadLatestRepositories } from '@/lib/csv-loader';
import { RepositoryData } from '@/lib/csv-loader';
import StatusChart from '@/components/StatusChart';
import LanguageChart from '@/components/LanguageChart';
import ActivityChart from '@/components/ActivityChart';

export default function DashboardPage() {
  const [data, setData] = useState<RepositoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const repos = await loadLatestRepositories();
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
    .sort((a, b) => b.count - a.count);

  const activityData = data.map((repo) => ({
    date: repo.pushedDate.split('T')[0],
    stars: repo.stars,
    forks: repo.forks,
    openIssues: repo.openIssues,
  }));

  const totalRepos = data.length;
  const activeRepos = data.filter((repo) => repo.status === '頻繁に更新' || repo.status === '定期的に更新').length;
  const archivedRepos = data.filter((repo) => repo.archiveStatus === '✅ アーカイブ済み').length;

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
      <h1 className="text-4xl font-bold text-gray-900 mb-8">📈 ダッシュボード</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">総リポジトリ数</p>
          <p className="text-2xl font-semibold text-gray-900">{totalRepos}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">アクティブ</p>
          <p className="text-2xl font-semibold text-green-600">{activeRepos}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">アーカイブ済み</p>
          <p className="text-2xl font-semibold text-gray-600">{archivedRepos}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-500">使用言語数</p>
          <p className="text-2xl font-semibold text-gray-900">{Object.keys(languageCounts).length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">ステータス別リポジトリ数</h2>
          <StatusChart data={statusData} />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">言語別リポジトリ数</h2>
          <LanguageChart data={languageData} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">活動状況の推移</h2>
        <ActivityChart data={activityData} />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">ステータス別詳細</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  リポジトリ数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  割合
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statusData.map((item) => (
                <tr key={item.status}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.status}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {((item.count / totalRepos) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

