'use client';

import dynamic from 'next/dynamic';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatusChartProps {
  data: { status: string; count: number }[];
}

function StatusChartComponent({ data }: StatusChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        データがありません
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="status"
          angle={-45}
          textAnchor="end"
          height={80}
          interval={0}
        />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="count" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// 動的インポートでSSRを無効化
export default dynamic(() => Promise.resolve(StatusChartComponent), {
  ssr: false,
  loading: () => <div className="h-[300px] flex items-center justify-center text-gray-500">読み込み中...</div>
});

