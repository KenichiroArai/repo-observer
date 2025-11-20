'use client';

import { useEffect, useState } from 'react';

interface ChartWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Rechartsが正しく読み込まれるまで待機するラッパーコンポーネント
 * サーバーサイドレンダリングとクライアントサイドの不一致を防ぐ
 */
export default function ChartWrapper({ children, fallback }: ChartWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return fallback || <div className="h-[300px] flex items-center justify-center text-gray-500">読み込み中...</div>;
  }

  return <>{children}</>;
}

