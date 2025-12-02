'use client';

import dynamic from 'next/dynamic';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface ChangeRateData {
  date: string;
  starsChangeRate: number;
  forksChangeRate: number;
  issuesChangeRate: number;
  reposChangeRate: number;
}

interface ChangeRateChartProps {
  data: ChangeRateData[];
}

function ChangeRateChartComponent({ data }: ChangeRateChartProps) {
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
          label={{ value: '変化率 (%)', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          formatter={(value: number) => {
            const sign = value >= 0 ? '+' : '';
            return [`${sign}${value.toFixed(2)}%`, ''];
          }}
          labelFormatter={(label) => `日付: ${label}`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="starsChangeRate"
          stroke="#8884d8"
          name="スター数変化率"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="forksChangeRate"
          stroke="#82ca9d"
          name="フォーク数変化率"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="issuesChangeRate"
          stroke="#ffc658"
          name="Issue数変化率"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="reposChangeRate"
          stroke="#ff7300"
          name="リポジトリ数変化率"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// 動的インポートでSSRを無効化
export default dynamic(() => Promise.resolve(ChangeRateChartComponent), {
  ssr: false,
  loading: () => <div className="h-[400px] flex items-center justify-center text-gray-500">読み込み中...</div>
});

