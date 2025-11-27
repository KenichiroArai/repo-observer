import { parse, ParseResult } from 'papaparse';

export interface RepositoryData {
  exportedAtUtc: string;
  exportedAtJst: string;
  name: string;
  fullName: string;
  description: string;
  status: string;
  activityType: string;
  daysSinceLastActivity: number;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  sizeDisplay: string;
  language: string;
  license: string;
  topics: string;
  archiveStatus: string;
  visibility: string;
  defaultBranch: string;
  hasIssues: string;
  hasWiki: string;
  hasProjects: string;
  homepage: string;
  createdDate: string;
  updatedDate: string;
  pushedDate: string;
  latestIssueUpdated: string;
  releaseInfo: string;
  url: string;
}

export interface RepositorySummary {
  exportedAtUtc: string;
  exportedAtJst: string;
  name: string;
  status: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  pushedDate: string;
  url: string;
}

const HEADER_MAP: Record<string, keyof RepositoryData> = {
  'エクスポート日時(UTC)': 'exportedAtUtc',
  'エクスポート日時(JST)': 'exportedAtJst',
  'リポジトリ名': 'name',
  'フルネーム': 'fullName',
  '説明': 'description',
  'ステータス': 'status',
  '活動種別': 'activityType',
  '最終活動からの日数': 'daysSinceLastActivity',
  'スター数': 'stars',
  'フォーク数': 'forks',
  'ウォッチャー数': 'watchers',
  '未解決Issue数': 'openIssues',
  'サイズ': 'sizeDisplay',
  '使用言語': 'language',
  'ライセンス': 'license',
  'トピック': 'topics',
  'アーカイブ状態': 'archiveStatus',
  '公開状態': 'visibility',
  'デフォルトブランチ': 'defaultBranch',
  'Issues有効': 'hasIssues',
  'Wiki有効': 'hasWiki',
  'Projects有効': 'hasProjects',
  'ホームページ': 'homepage',
  '作成日': 'createdDate',
  '最終更新日': 'updatedDate',
  '最終Push日': 'pushedDate',
  'Issue最終更新日': 'latestIssueUpdated',
  '最新リリース': 'releaseInfo',
  'URL': 'url',
};

const SUMMARY_HEADER_MAP: Record<string, keyof RepositorySummary> = {
  'エクスポート日時(UTC)': 'exportedAtUtc',
  'エクスポート日時(JST)': 'exportedAtJst',
  'リポジトリ名': 'name',
  'ステータス': 'status',
  'スター数': 'stars',
  'フォーク数': 'forks',
  '未解決Issue': 'openIssues',
  '言語': 'language',
  '最終Push': 'pushedDate',
  'URL': 'url',
};

function parseNumber(value: string): number {
  const num = parseInt(value, 10);
  return isNaN(num) ? 0 : num;
}

function mapRow(row: any, headerMap: Record<string, string>): any {
  const mapped: any = {};
  for (const [key, value] of Object.entries(row)) {
    const mappedKey = headerMap[key.trim()];
    if (mappedKey) {
      mapped[mappedKey] = value;
    }
  }
  return mapped;
}

function getBasePath(): string {
  if (typeof window === 'undefined') return '';

  // 開発環境（localhost）ではbasePathは空文字列
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
    return '';
  }

  // 本番環境（GitHub Pages）ではURLからbasePathを取得
  // GitHub Pagesで /docs フォルダを公開する場合:
  // URL: https://username.github.io/repo-name/
  // docs/ フォルダの内容がルートとして公開される
  // Next.jsのbasePathは /repo-name に設定されている
  // したがって、basePathは /repo-name を返す（/docs は含めない）
  const pathname = window.location.pathname;
  const parts = pathname.split('/').filter(Boolean);

  // リポジトリ名（最初のパスセグメント）を取得
  // 例: /repo-observer/dashboard → basePath = /repo-observer
  if (parts.length > 0) {
    return '/' + parts[0];
  }

  return '';
}

async function findLatestCsvFile(basePath: string, type: 'repositories' | 'repositories-summary'): Promise<string | null> {
  // 現在の日付から過去に向かって最大30日間試行
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const filename = type === 'repositories'
      ? `repositories-${dateStr}.csv`
      : `repositories-summary-${dateStr}.csv`;
    const url = `${basePath}/public/data/${type}/${year}/${month}/${filename}`;

    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        return url;
      }
    } catch (error) {
      // 次の日付を試行
      continue;
    }
  }
  return null;
}

export async function loadLatestRepositories(): Promise<RepositoryData[]> {
  try {
    const basePath = getBasePath();

    // 最新のCSVファイルを探す
    const csvUrl = await findLatestCsvFile(basePath, 'repositories');
    if (!csvUrl) {
      throw new Error('利用可能なCSVファイルが見つかりませんでした');
    }

    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error('CSVファイルの読み込みに失敗しました');
    }

    const text = await response.text();
    const result: ParseResult<Record<string, unknown>> = parse(text, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = result.data as any[];
    if (rows.length === 0) {
      return [];
    }

    // 最新のエクスポート日時を取得
    const latestExportedAtUtc = rows.reduce<string>((latest, row) => {
      const exportedAt = row['エクスポート日時(UTC)'] || '';
      return exportedAt > latest ? exportedAt : latest;
    }, rows[0]['エクスポート日時(UTC)'] || '');

    // 最新のデータのみをフィルタ
    const latestRows = rows.filter(
      (row) => row['エクスポート日時(UTC)'] === latestExportedAtUtc
    );

    return latestRows.map((row) => {
      const mapped = mapRow(row, HEADER_MAP as any);
      return {
        ...mapped,
        daysSinceLastActivity: parseNumber(mapped.daysSinceLastActivity || '0'),
        stars: parseNumber(mapped.stars || '0'),
        forks: parseNumber(mapped.forks || '0'),
        watchers: parseNumber(mapped.watchers || '0'),
        openIssues: parseNumber(mapped.openIssues || '0'),
      } as RepositoryData;
    });
  } catch (error) {
    console.error('CSV読み込みエラー:', error);
    return [];
  }
}

export async function loadLatestSummary(): Promise<RepositorySummary[]> {
  try {
    const basePath = getBasePath();

    // 最新のCSVファイルを探す
    const csvUrl = await findLatestCsvFile(basePath, 'repositories-summary');
    if (!csvUrl) {
      throw new Error('利用可能なCSVファイルが見つかりませんでした');
    }

    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error('CSVファイルの読み込みに失敗しました');
    }

    const text = await response.text();
    const result: ParseResult<Record<string, unknown>> = parse(text, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = result.data as any[];
    if (rows.length === 0) {
      return [];
    }

    const latestExportedAtUtc = rows.reduce<string>((latest, row) => {
      const exportedAt = row['エクスポート日時(UTC)'] || '';
      return exportedAt > latest ? exportedAt : latest;
    }, rows[0]['エクスポート日時(UTC)'] || '');

    const latestRows = rows.filter(
      (row) => row['エクスポート日時(UTC)'] === latestExportedAtUtc
    );

    return latestRows.map((row) => {
      const mapped = mapRow(row, SUMMARY_HEADER_MAP as any);
      return {
        ...mapped,
        stars: parseNumber(mapped.stars || '0'),
        forks: parseNumber(mapped.forks || '0'),
        openIssues: parseNumber(mapped.openIssues || '0'),
      } as RepositorySummary;
    });
  } catch (error) {
    console.error('CSV読み込みエラー:', error);
    return [];
  }
}

export function getAvailableDates(): string[] {
  // 実際の実装では、dataフォルダをスキャンして利用可能な日付を取得
  // ここでは固定値を返す
  return ['2025-11-17', '2025-11-16', '2025-11-15', '2025-11-14'];
}

