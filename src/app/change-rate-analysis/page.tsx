'use client';

import { useEffect, useState } from 'react';
import { loadTimeSeriesData } from '../../lib/csv-loader';
import { TimeSeriesData } from '../../lib/csv-loader';
import IssueTimeSeriesChart from '../../components/IssueTimeSeriesChart';
import IssueChangeRateChart, { IssueChangeRateData } from '../../components/IssueChangeRateChart';

export default function ChangeRateAnalysisPage() {
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [issueChangeRateData, setIssueChangeRateData] = useState<IssueChangeRateData[]>([]);
  const [timeSeriesLoading, setTimeSeriesLoading] = useState(true);

  useEffect(() => {
    async function fetchTimeSeriesData() {
      try {
        const timeSeries = await loadTimeSeriesData();
        setTimeSeriesData(timeSeries);

        // Issue変化率を計算
        const issueChangeRates: IssueChangeRateData[] = [];
        for (let i = 1; i < timeSeries.length; i++) {
          const current = timeSeries[i];
          const previous = timeSeries[i - 1];

          const totalIssuesChangeRate = previous.totalIssues > 0
            ? ((current.totalIssues - previous.totalIssues) / previous.totalIssues) * 100
            : 0;
          const openIssuesChangeRate = previous.totalOpenIssues > 0
            ? ((current.totalOpenIssues - previous.totalOpenIssues) / previous.totalOpenIssues) * 100
            : 0;
          const closedIssuesChangeRate = previous.totalClosedIssues > 0
            ? ((current.totalClosedIssues - previous.totalClosedIssues) / previous.totalClosedIssues) * 100
            : 0;

          issueChangeRates.push({
            date: current.date,
            totalIssuesChangeRate: parseFloat(totalIssuesChangeRate.toFixed(2)),
            openIssuesChangeRate: parseFloat(openIssuesChangeRate.toFixed(2)),
            closedIssuesChangeRate: parseFloat(closedIssuesChangeRate.toFixed(2)),
          });
        }
        setIssueChangeRateData(issueChangeRates);
      } catch (error) {
        console.error('時系列データ読み込みエラー:', error);
      } finally {
        setTimeSeriesLoading(false);
      }
    }
    fetchTimeSeriesData();
  }, []);

  // 最新データと前日比を計算
  const latestData = timeSeriesData.length > 0 ? timeSeriesData[timeSeriesData.length - 1] : null;
  const previousData = timeSeriesData.length > 1 ? timeSeriesData[timeSeriesData.length - 2] : null;

  const calculateChangeRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Issue関連の変化率
  const totalIssuesChangeRate = latestData && previousData
    ? calculateChangeRate(latestData.totalIssues, previousData.totalIssues)
    : 0;
  const openIssuesChangeRate = latestData && previousData
    ? calculateChangeRate(latestData.totalOpenIssues, previousData.totalOpenIssues)
    : 0;
  const closedIssuesChangeRate = latestData && previousData
    ? calculateChangeRate(latestData.totalClosedIssues, previousData.totalClosedIssues)
    : 0;

  // その他の指標の変化率
  const starsChangeRate = latestData && previousData
    ? calculateChangeRate(latestData.totalStars, previousData.totalStars)
    : 0;
  const forksChangeRate = latestData && previousData
    ? calculateChangeRate(latestData.totalForks, previousData.totalForks)
    : 0;
  const reposChangeRate = latestData && previousData
    ? calculateChangeRate(latestData.totalRepos, previousData.totalRepos)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">📊 Issue変化率分析</h1>
      <p className="text-lg text-gray-600 mb-8">
        Issue数を中心とした活動状況の時系列変化率を分析します。前日比による成長率や減少率を確認できます。
      </p>

      {/* Issue関連の指標 - 3カラムレイアウト */}
      {latestData && previousData && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🎯 Issue状況（前日比）</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 総Issue数 */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-lg p-6 border-2 border-purple-300">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">総Issue数</p>
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-3">{latestData.totalIssues.toLocaleString()}</p>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xl font-bold ${totalIssuesChangeRate >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {totalIssuesChangeRate >= 0 ? '↑' : '↓'} {Math.abs(totalIssuesChangeRate).toFixed(2)}%
                </span>
                <span className="text-sm text-gray-600">
                  ({totalIssuesChangeRate >= 0 ? '+' : ''}{(latestData.totalIssues - previousData.totalIssues).toLocaleString()})
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {previousData.totalIssues.toLocaleString()} → {latestData.totalIssues.toLocaleString()}
              </p>
            </div>

            {/* 未解決Issue */}
            <div className="bg-gradient-to-br from-red-50 to-pink-100 rounded-lg shadow-lg p-6 border-2 border-red-300">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">未解決Issue</p>
                <span className="text-2xl">🐞</span>
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-3">{latestData.totalOpenIssues.toLocaleString()}</p>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xl font-bold ${openIssuesChangeRate >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {openIssuesChangeRate >= 0 ? '↑' : '↓'} {Math.abs(openIssuesChangeRate).toFixed(2)}%
                </span>
                <span className="text-sm text-gray-600">
                  ({openIssuesChangeRate >= 0 ? '+' : ''}{(latestData.totalOpenIssues - previousData.totalOpenIssues).toLocaleString()})
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {previousData.totalOpenIssues.toLocaleString()} → {latestData.totalOpenIssues.toLocaleString()}
              </p>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full transition-all"
                    style={{ width: `${latestData.totalIssues > 0 ? (latestData.totalOpenIssues / latestData.totalIssues * 100) : 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  全体の {latestData.totalIssues > 0 ? ((latestData.totalOpenIssues / latestData.totalIssues) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            {/* クローズ済みIssue */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg shadow-lg p-6 border-2 border-green-300">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">クローズ済みIssue</p>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-4xl font-bold text-gray-900 mb-3">{latestData.totalClosedIssues.toLocaleString()}</p>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xl font-bold ${closedIssuesChangeRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {closedIssuesChangeRate >= 0 ? '↑' : '↓'} {Math.abs(closedIssuesChangeRate).toFixed(2)}%
                </span>
                <span className="text-sm text-gray-600">
                  ({closedIssuesChangeRate >= 0 ? '+' : ''}{(latestData.totalClosedIssues - previousData.totalClosedIssues).toLocaleString()})
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {previousData.totalClosedIssues.toLocaleString()} → {latestData.totalClosedIssues.toLocaleString()}
              </p>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${latestData.totalIssues > 0 ? (latestData.totalClosedIssues / latestData.totalIssues * 100) : 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  全体の {latestData.totalIssues > 0 ? ((latestData.totalClosedIssues / latestData.totalIssues) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            ※ 未解決Issueの増加は対応が必要な問題が増えていることを、クローズ済みIssueの増加は問題の解決が進んでいることを示します。
          </p>
        </div>
      )}

      {/* Issue時系列推移 */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">📈 Issue時系列推移</h2>
        <p className="text-sm text-gray-600 mb-4">
          Issue数の時系列推移を表示します。総Issue数、未解決Issue、クローズ済みIssueの日付ごとの変化を確認できます。
        </p>
        {timeSeriesLoading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">時系列データを読み込んでいます...</p>
            </div>
          </div>
        ) : (
          <IssueTimeSeriesChart data={timeSeriesData} />
        )}
        {timeSeriesData.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            <p>データ期間: {timeSeriesData[0]?.date} ～ {timeSeriesData[timeSeriesData.length - 1]?.date}</p>
            <p>最新データ取得日時: {timeSeriesData[timeSeriesData.length - 1]?.exportedAtJst}</p>
          </div>
        )}
      </div>

      {/* Issue変化率チャート */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">📊 Issue変化率の推移</h2>
        <p className="text-sm text-gray-600 mb-4">
          前日比によるIssue変化率を表示します。総Issue数、未解決Issue、クローズ済みIssueの成長率や減少率を確認できます。
        </p>
        {timeSeriesLoading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">変化率データを計算しています...</p>
            </div>
          </div>
        ) : (
          <IssueChangeRateChart data={issueChangeRateData} />
        )}
        {issueChangeRateData.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            <p>変化率計算期間: {issueChangeRateData[0]?.date} ～ {issueChangeRateData[issueChangeRateData.length - 1]?.date}</p>
            <p className="text-xs text-gray-500 mt-1">※ 変化率は前日比で計算されています</p>
          </div>
        )}
      </div>

      {/* Issue変化率詳細テーブル */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">📋 Issue変化率詳細一覧</h2>
        <p className="text-sm text-gray-600 mb-4">
          日付ごとのIssue変化率の詳細データを一覧表示します。各指標の具体的な数値と変化率を確認できます。
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日付
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  総Issue数
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  変化率
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  未解決Issue
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  変化率
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  クローズ済みIssue
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  変化率
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeSeriesData.slice().reverse().map((item, index) => {
                const changeRateItem = issueChangeRateData.slice().reverse().find(cr => cr.date === item.date);
                return (
                  <tr key={item.date} className={index === 0 ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.date}
                      {index === 0 && <span className="ml-2 text-xs text-blue-600 font-semibold">(最新)</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-semibold">
                      {item.totalIssues.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {changeRateItem ? (
                        <span className={`font-semibold ${changeRateItem.totalIssuesChangeRate >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {changeRateItem.totalIssuesChangeRate >= 0 ? '↑' : '↓'} {Math.abs(changeRateItem.totalIssuesChangeRate).toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-semibold">
                      {item.totalOpenIssues.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {changeRateItem ? (
                        <span className={`font-semibold ${changeRateItem.openIssuesChangeRate >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {changeRateItem.openIssuesChangeRate >= 0 ? '↑' : '↓'} {Math.abs(changeRateItem.openIssuesChangeRate).toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 font-semibold">
                      {item.totalClosedIssues.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {changeRateItem ? (
                        <span className={`font-semibold ${changeRateItem.closedIssuesChangeRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {changeRateItem.closedIssuesChangeRate >= 0 ? '↑' : '↓'} {Math.abs(changeRateItem.closedIssuesChangeRate).toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {timeSeriesData.length > 0 && (
          <div className="mt-4 text-xs text-gray-500">
            <p>※ 最新のデータが一番上に表示されます</p>
            <p>※ 変化率の色: 赤=増加、緑=減少（未解決Issueとクローズ済みIssueで意味が異なります）</p>
          </div>
        )}
      </div>

      {/* その他の指標 */}
      {latestData && previousData && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📈 その他の指標（前日比）</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <p className="text-sm font-medium text-gray-500 mb-2">総スター数</p>
              <p className="text-3xl font-semibold text-gray-900 mb-2">{latestData.totalStars.toLocaleString()}</p>
              <div className="flex items-center gap-2">
                <p className={`text-lg font-semibold ${starsChangeRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {starsChangeRate >= 0 ? '↑' : '↓'} {Math.abs(starsChangeRate).toFixed(2)}%
                </p>
                <p className="text-sm text-gray-500">
                  ({starsChangeRate >= 0 ? '+' : ''}{(latestData.totalStars - previousData.totalStars).toLocaleString()})
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <p className="text-sm font-medium text-gray-500 mb-2">総フォーク数</p>
              <p className="text-3xl font-semibold text-gray-900 mb-2">{latestData.totalForks.toLocaleString()}</p>
              <div className="flex items-center gap-2">
                <p className={`text-lg font-semibold ${forksChangeRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {forksChangeRate >= 0 ? '↑' : '↓'} {Math.abs(forksChangeRate).toFixed(2)}%
                </p>
                <p className="text-sm text-gray-500">
                  ({forksChangeRate >= 0 ? '+' : ''}{(latestData.totalForks - previousData.totalForks).toLocaleString()})
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <p className="text-sm font-medium text-gray-500 mb-2">リポジトリ数</p>
              <p className="text-3xl font-semibold text-gray-900 mb-2">{latestData.totalRepos.toLocaleString()}</p>
              <div className="flex items-center gap-2">
                <p className={`text-lg font-semibold ${reposChangeRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {reposChangeRate >= 0 ? '↑' : '↓'} {Math.abs(reposChangeRate).toFixed(2)}%
                </p>
                <p className="text-sm text-gray-500">
                  ({reposChangeRate >= 0 ? '+' : ''}{(latestData.totalRepos - previousData.totalRepos)})
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

