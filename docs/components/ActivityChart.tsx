'use client';

import dynamic from 'next/dynamic';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ActivityChartProps {
  data: { date: string; stars: number; forks: number; openIssues: number }[];
}

function ActivityChartComponent({ data }: ActivityChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        データがありません
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="stars" stroke="#8884d8" name="スター数" />
        <Line type="monotone" dataKey="forks" stroke="#82ca9d" name="フォーク数" />
        <Line type="monotone" dataKey="openIssues" stroke="#ffc658" name="未解決Issue" />
      </LineChart>
    </ResponsiveContainer>
  );
}

// 動的インポートでSSRを無効化
export default dynamic(() => Promise.resolve(ActivityChartComponent), {
  ssr: false,
  loading: () => <div className="h-[300px] flex items-center justify-center text-gray-500">読み込み中...</div>
});

