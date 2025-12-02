'use client';

import { useEffect, useState } from 'react';

export default function XShareButton() {
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    // クライアントサイドでのみURLを取得
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);

  const handleShare = () => {
    const text = encodeURIComponent('📊 リポジトリ・オブザーバー - リポジトリ可視化ダッシュボード');
    const url = encodeURIComponent(shareUrl || window.location.href);
    const xUrl = `https://x.com/intent/post?text=${text}&url=${url}`;
    window.open(xUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#1DA1F2] hover:bg-[#1a8cd8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1DA1F2] transition-colors"
      aria-label="Xでシェア"
    >
      <svg
        className="w-5 h-5 mr-2"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      <span className="hidden sm:inline">シェア</span>
    </button>
  );
}

