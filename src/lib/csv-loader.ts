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
  closedIssues: number;
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
  closedIssues: number;
  commits: number;
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
  'クローズ済みIssue数': 'closedIssues',
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
  'クローズ済みIssue': 'closedIssues',
  'コミット数': 'commits',
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
  // 例: /repo-observer/change-rate-analysis → basePath = /repo-observer
  if (parts.length > 0) {
    return '/' + parts[0];
  }

  return '';
}

interface CsvFileList {
  repositories: Array<{
    date: string;
    year: string;
    month: string;
    filename: string;
    path: string;
  }>;
  'repositories-summary': Array<{
    date: string;
    year: string;
    month: string;
    filename: string;
    path: string;
  }>;
}

// 利用可能なCSVファイルのリストをキャッシュ
let cachedFileList: CsvFileList | null = null;

async function getAvailableCsvFiles(basePath: string): Promise<CsvFileList> {
  // キャッシュがあればそれを返す
  if (cachedFileList) {
    return cachedFileList;
  }

  try {
    // ビルド時に生成されたJSONファイルを読み込む
    const response = await fetch(`${basePath}/csv-file-list.json`);
    if (!response.ok) {
      throw new Error('CSVファイルリストの読み込みに失敗しました');
    }
    const data = await response.json() as CsvFileList;
    cachedFileList = data;
    return data;
  } catch (error) {
    console.error('CSVファイルリスト読み込みエラー:', error);
    // エラー時は空のリストを返す
    return { repositories: [], 'repositories-summary': [] };
  }
}

async function findLatestCsvFile(basePath: string, type: 'repositories' | 'repositories-summary'): Promise<string | null> {
  // 利用可能なファイルのリストを取得
  const fileList = await getAvailableCsvFiles(basePath);
  const availableFiles = fileList[type];

  if (availableFiles.length === 0) {
    return null;
  }

  // リストは既に日付でソートされている（新しい順）ので、最初のファイルを返す
  const latestFile = availableFiles[0];
  return `${basePath}${latestFile.path}`;
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
        closedIssues: parseNumber(mapped.closedIssues || '0'),
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
        closedIssues: parseNumber(mapped.closedIssues || '0'),
        commits: parseNumber(mapped.commits || '0'),
      } as RepositorySummary;
    });
  } catch (error) {
    console.error('CSV読み込みエラー:', error);
    return [];
  }
}

export interface TimeSeriesData {
  date: string;
  totalStars: number;
  totalForks: number;
  totalOpenIssues: number;
  totalClosedIssues: number;
  totalIssues: number;
  totalRepos: number;
  exportedAtJst: string;
}

// 利用可能な日付リストを取得
export async function getAvailableDates(): Promise<string[]> {
  try {
    const basePath = getBasePath();
    const fileList = await getAvailableCsvFiles(basePath);
    return fileList['repositories-summary'].map(file => file.date).sort().reverse();
  } catch (error) {
    console.error('利用可能な日付の取得エラー:', error);
    return [];
  }
}

// 指定した日付のサマリーデータを読み込む
export async function loadSummaryByDate(date: string): Promise<RepositorySummary[]> {
  try {
    const basePath = getBasePath();
    const fileList = await getAvailableCsvFiles(basePath);
    const fileInfo = fileList['repositories-summary'].find(file => file.date === date);

    if (!fileInfo) {
      throw new Error(`指定された日付(${date})のCSVファイルが見つかりませんでした`);
    }

    const csvUrl = `${basePath}${fileInfo.path}`;
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
      const mapped = mapRow(row, SUMMARY_HEADER_MAP as any);
      return {
        ...mapped,
        stars: parseNumber(mapped.stars || '0'),
        forks: parseNumber(mapped.forks || '0'),
        openIssues: parseNumber(mapped.openIssues || '0'),
        closedIssues: parseNumber(mapped.closedIssues || '0'),
        commits: parseNumber(mapped.commits || '0'),
      } as RepositorySummary;
    });
  } catch (error) {
    console.error('CSV読み込みエラー:', error);
    return [];
  }
}

// 時系列データを取得（全日付のサマリー）
export async function loadTimeSeriesData(): Promise<TimeSeriesData[]> {
  try {
    const dates = await getAvailableDates();
    const timeSeriesData: TimeSeriesData[] = [];

    for (const date of dates) {
      const summaries = await loadSummaryByDate(date);
      if (summaries.length > 0) {
        const totalStars = summaries.reduce((sum, repo) => sum + repo.stars, 0);
        const totalForks = summaries.reduce((sum, repo) => sum + repo.forks, 0);
        const totalOpenIssues = summaries.reduce((sum, repo) => sum + repo.openIssues, 0);
        const totalClosedIssues = summaries.reduce((sum, repo) => sum + repo.closedIssues, 0);
        const totalIssues = totalOpenIssues + totalClosedIssues;
        const exportedAtJst = summaries[0]?.exportedAtJst || '';

        timeSeriesData.push({
          date,
          totalStars,
          totalForks,
          totalOpenIssues,
          totalClosedIssues,
          totalIssues,
          totalRepos: summaries.length,
          exportedAtJst,
        });
      }
    }

    return timeSeriesData.sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('時系列データ読み込みエラー:', error);
    return [];
  }
}

