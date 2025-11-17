'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ActivityChartProps {
  data: { date: string; stars: number; forks: number; openIssues: number }[];
}

export default function ActivityChart({ data }: ActivityChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
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

