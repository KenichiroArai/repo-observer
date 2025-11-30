'use client';

import dynamic from 'next/dynamic';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TimeSeriesData } from '../lib/csv-loader';

interface TimeSeriesChartProps {
  data: TimeSeriesData[];
}

function TimeSeriesChartComponent({ data }: TimeSeriesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        データがありません
      </div>
    );
  }

  // 日付をフォーマット（MM/DD形式）
  const formattedData = data.map(item => ({
    ...item,
    dateLabel: new Date(item.date).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="dateLabel"
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name === '総スター数' || name === '総フォーク数' || name === '総Issue数') {
              return [value.toLocaleString(), name];
            }
            return [value, name];
          }}
          labelFormatter={(label) => `日付: ${label}`}
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="totalStars"
          stroke="#8884d8"
          name="総スター数"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="totalForks"
          stroke="#82ca9d"
          name="総フォーク数"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="totalIssues"
          stroke="#ffc658"
          name="総Issue数"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="totalRepos"
          stroke="#ff7300"
          name="リポジトリ数"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// 動的インポートでSSRを無効化
export default dynamic(() => Promise.resolve(TimeSeriesChartComponent), {
  ssr: false,
  loading: () => <div className="h-[400px] flex items-center justify-center text-gray-500">読み込み中...</div>
});

