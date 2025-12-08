'use client';

import dynamic from 'next/dynamic';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface CommitChangeRateData {
  date: string;
  commitsChange: number;
}

interface CommitChangeRateChartProps {
  data: CommitChangeRateData[];
}

function CommitChangeRateChartComponent({ data }: CommitChangeRateChartProps) {
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
          label={{ value: '差分', angle: -90, position: 'insideLeft' }}
        />
        <Tooltip
          formatter={(value: number) => {
            const sign = value >= 0 ? '+' : '';
            return [`${sign}${value.toLocaleString()}`, ''];
          }}
          labelFormatter={(label) => `日付: ${label}`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="commitsChange"
          stroke="#3b82f6"
          name="コミット数差分"
          strokeWidth={3}
          dot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// 動的インポートでSSRを無効化
export default dynamic(() => Promise.resolve(CommitChangeRateChartComponent), {
  ssr: false,
  loading: () => <div className="h-[400px] flex items-center justify-center text-gray-500">読み込み中...</div>
});

