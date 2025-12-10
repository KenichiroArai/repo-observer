'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import XShareButton from './XShareButton';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'トップ' },
    { href: '/change-rate-analysis', label: '変化率分析' },
    { href: '/repositories', label: 'リポジトリ一覧' },
    { href: '/docs', label: 'ドキュメント' },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                📊 リポジトリ・オブザーバー
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      active
                        ? 'border-blue-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/users/KenichiroArai/projects/15"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 border border-blue-500 text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700 dark:hover:bg-blue-800 transition-colors"
              title="GitHub Projectsで確認"
            >
              <span className="mr-1">📋</span>
              <span className="hidden sm:inline">Project</span>
            </a>
            <XShareButton />
          </div>
        </div>
      </div>
    </nav>
  );
}

