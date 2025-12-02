'use client';

import dynamic from 'next/dynamic';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TimeSeriesData } from '../lib/csv-loader';

interface IssueTimeSeriesChartProps {
  data: TimeSeriesData[];
}

function IssueTimeSeriesChartComponent({ data }: IssueTimeSeriesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-gray-500">
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
        <YAxis
          label={{ value: 'Issue数', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          formatter={(value: number, name: string) => [value.toLocaleString(), name]}
          labelFormatter={(label) => `日付: ${label}`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="totalIssues"
          stroke="#8b5cf6"
          name="総Issue数"
          strokeWidth={3}
          dot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="totalOpenIssues"
          stroke="#ef4444"
          name="未解決Issue"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="totalClosedIssues"
          stroke="#10b981"
          name="クローズ済みIssue"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// 動的インポートでSSRを無効化
export default dynamic(() => Promise.resolve(IssueTimeSeriesChartComponent), {
  ssr: false,
  loading: () => <div className="h-[400px] flex items-center justify-center text-gray-500">読み込み中...</div>
});

