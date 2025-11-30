'use client';

import { useEffect, useState } from 'react';
import { loadLatestRepositories, loadTimeSeriesData } from '../../lib/csv-loader';
import { RepositoryData, TimeSeriesData } from '../../lib/csv-loader';
import StatusChart from '../../components/StatusChart';
import LanguageChart from '../../components/LanguageChart';
import TimeSeriesChart from '../../components/TimeSeriesChart';
import ChangeRateChart, { ChangeRateData } from '../../components/ChangeRateChart';

export default function ChangeRateAnalysisPage() {
  const [data, setData] = useState<RepositoryData[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [changeRateData, setChangeRateData] = useState<ChangeRateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeSeriesLoading, setTimeSeriesLoading] = useState(true);

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

  useEffect(() => {
    async function fetchTimeSeriesData() {
      try {
        const timeSeries = await loadTimeSeriesData();
        setTimeSeriesData(timeSeries);

        // 変化率を計算
        const changeRates: ChangeRateData[] = [];
        for (let i = 1; i < timeSeries.length; i++) {
          const current = timeSeries[i];
          const previous = timeSeries[i - 1];

          const starsChangeRate = previous.totalStars > 0
            ? ((current.totalStars - previous.totalStars) / previous.totalStars) * 100
            : 0;
          const forksChangeRate = previous.totalForks > 0
            ? ((current.totalForks - previous.totalForks) / previous.totalForks) * 100
            : 0;
          const issuesChangeRate = previous.totalIssues > 0
            ? ((current.totalIssues - previous.totalIssues) / previous.totalIssues) * 100
            : 0;
          const reposChangeRate = previous.totalRepos > 0
            ? ((current.totalRepos - previous.totalRepos) / previous.totalRepos) * 100
            : 0;

          changeRates.push({
            date: current.date,
            starsChangeRate: parseFloat(starsChangeRate.toFixed(2)),
            forksChangeRate: parseFloat(forksChangeRate.toFixed(2)),
            issuesChangeRate: parseFloat(issuesChangeRate.toFixed(2)),
            reposChangeRate: parseFloat(reposChangeRate.toFixed(2)),
          });
        }
        setChangeRateData(changeRates);
      } catch (error) {
        console.error('時系列データ読み込みエラー:', error);
      } finally {
        setTimeSeriesLoading(false);
      }
    }
    fetchTimeSeriesData();
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

  const totalRepos = data.length;
  const activeRepos = data.filter((repo) => repo.status === '頻繁に更新' || repo.status === '定期的に更新').length;
  const archivedRepos = data.filter((repo) => repo.archiveStatus === '✅ アーカイブ済み').length;

  // 最新データと前日比を計算
  const latestData = timeSeriesData.length > 0 ? timeSeriesData[timeSeriesData.length - 1] : null;
  const previousData = timeSeriesData.length > 1 ? timeSeriesData[timeSeriesData.length - 2] : null;

  const calculateChangeRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const starsChangeRate = latestData && previousData
    ? calculateChangeRate(latestData.totalStars, previousData.totalStars)
    : 0;
  const forksChangeRate = latestData && previousData
    ? calculateChangeRate(latestData.totalForks, previousData.totalForks)
    : 0;
  const issuesChangeRate = latestData && previousData
    ? calculateChangeRate(latestData.totalIssues, previousData.totalIssues)
    : 0;
  const reposChangeRate = latestData && previousData
    ? calculateChangeRate(latestData.totalRepos, previousData.totalRepos)
    : 0;

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
      <h1 className="text-4xl font-bold text-gray-900 mb-4">📊 変化率分析</h1>
      <p className="text-lg text-gray-600 mb-8">
        リポジトリの活動状況の時系列変化率を分析します。前日比や期間比による成長率を確認できます。
      </p>

      {/* 最新データと前日比 */}
      {latestData && previousData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">総スター数</p>
            <p className="text-2xl font-semibold text-gray-900">{latestData.totalStars.toLocaleString()}</p>
            <p className={`text-sm mt-2 ${starsChangeRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {starsChangeRate >= 0 ? '↑' : '↓'} {Math.abs(starsChangeRate).toFixed(2)}% (前日比)
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">総フォーク数</p>
            <p className="text-2xl font-semibold text-gray-900">{latestData.totalForks.toLocaleString()}</p>
            <p className={`text-sm mt-2 ${forksChangeRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {forksChangeRate >= 0 ? '↑' : '↓'} {Math.abs(forksChangeRate).toFixed(2)}% (前日比)
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">総Issue数</p>
            <p className="text-2xl font-semibold text-gray-900">{latestData.totalIssues.toLocaleString()}</p>
            <p className={`text-sm mt-2 ${issuesChangeRate >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {issuesChangeRate >= 0 ? '↑' : '↓'} {Math.abs(issuesChangeRate).toFixed(2)}% (前日比)
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm font-medium text-gray-500">リポジトリ数</p>
            <p className="text-2xl font-semibold text-gray-900">{latestData.totalRepos}</p>
            <p className={`text-sm mt-2 ${reposChangeRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {reposChangeRate >= 0 ? '↑' : '↓'} {Math.abs(reposChangeRate).toFixed(2)}% (前日比)
            </p>
          </div>
        </div>
      )}

      {/* 現在の状態サマリー */}
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

      {/* 時系列推移 */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">📈 時系列推移</h2>
        <p className="text-sm text-gray-600 mb-4">
          リポジトリの活動状況の時系列推移を表示します。日付ごとの総スター数、総フォーク数、総Issue数、リポジトリ数の変化を確認できます。
        </p>
        {timeSeriesLoading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">時系列データを読み込んでいます...</p>
            </div>
          </div>
        ) : (
          <TimeSeriesChart data={timeSeriesData} />
        )}
        {timeSeriesData.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            <p>データ期間: {timeSeriesData[0]?.date} ～ {timeSeriesData[timeSeriesData.length - 1]?.date}</p>
            <p>最新データ取得日時: {timeSeriesData[timeSeriesData.length - 1]?.exportedAtJst}</p>
          </div>
        )}
      </div>

      {/* 変化率チャート */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">📊 変化率の推移</h2>
        <p className="text-sm text-gray-600 mb-4">
          前日比による変化率を表示します。各指標の成長率や減少率を確認できます。
        </p>
        {timeSeriesLoading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">変化率データを計算しています...</p>
            </div>
          </div>
        ) : (
          <ChangeRateChart data={changeRateData} />
        )}
        {changeRateData.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            <p>変化率計算期間: {changeRateData[0]?.date} ～ {changeRateData[changeRateData.length - 1]?.date}</p>
            <p className="text-xs text-gray-500 mt-1">※ 変化率は前日比で計算されています</p>
          </div>
        )}
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

