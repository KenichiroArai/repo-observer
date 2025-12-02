import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { FormattedRepoInfo, RepoStatus } from './types.js';

interface CsvRow {
  exportedAtUtc: string;
  exportedAtJst: string;
  name: string;
  fullName: string;
  description: string;
  status: string;
  activityType: string;
  daysSinceLastActivity: string;
  stars: string;
  forks: string;
  watchers: string;
  openIssues: string;
  closedIssues?: string;
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

const HEADER_MAP: Record<string, keyof CsvRow> = {
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
  'URL': 'url'
};

export class CsvImporter {
  constructor(private readonly basePath: string) {}

  async loadLatestRepositories(): Promise<FormattedRepoInfo[]> {
    const csvPath = this.resolveLatestCsvPath();
    console.log(`CSVからリポジトリ情報を読み込みます: ${csvPath}`);

    const content = fs.readFileSync(csvPath, 'utf8');
    const rows = parse(content, {
      bom: true,
      columns: (header: string[]) => header.map((h: string) => {
        const mapped = HEADER_MAP[h.trim()];
        // 未知のヘッダーは無視（後方互換性のため）
        return mapped || h.trim();
      }),
      skip_empty_lines: true,
      trim: true
    }) as Partial<CsvRow>[];

    if (rows.length === 0) {
      console.warn('CSVファイルに有効なレコードがありません。');
      return [];
    }

    // exportedAtUtcが存在する行のみをフィルタ
    const validRows = rows.filter((row): row is Partial<CsvRow> & { exportedAtUtc: string } =>
      typeof row.exportedAtUtc === 'string' && row.exportedAtUtc.length > 0
    );

    if (validRows.length === 0) {
      console.warn('有効なエクスポート日時を持つレコードがありません。');
      return [];
    }

    const latestExportedAtUtc = validRows.reduce<string>((latest, row) => {
      return row.exportedAtUtc > latest ? row.exportedAtUtc : latest;
    }, validRows[0].exportedAtUtc);

    const latestRows = validRows.filter(row => row.exportedAtUtc === latestExportedAtUtc);
    console.log(`最新エクスポート時刻 (${latestExportedAtUtc}) の ${latestRows.length} 件を使用します`);

    return latestRows.map(row => this.mapRowToRepo(row as CsvRow));
  }

  private resolveLatestCsvPath(): string {
    const normalizedBase = path.resolve(this.basePath);
    if (fs.existsSync(normalizedBase) && fs.statSync(normalizedBase).isFile()) {
      return normalizedBase;
    }

    const categoryDir = this.resolveCategoryDir(normalizedBase);
    if (!fs.existsSync(categoryDir)) {
      throw new Error(`CSVディレクトリが見つかりません: ${categoryDir}`);
    }

    const csvFiles = this.collectCsvFiles(categoryDir);
    if (csvFiles.length === 0) {
      throw new Error(`CSVファイルが見つかりません: ${categoryDir}`);
    }

    const datedFiles = csvFiles
      .map(file => ({
        file,
        date: this.extractDateFromFilename(file)
      }))
      .filter(
        (entry): entry is { file: string; date: Date } =>
          entry.date !== null && !Number.isNaN(entry.date.getTime())
      );

    if (datedFiles.length > 0) {
      datedFiles.sort((a, b) => b.date.getTime() - a.date.getTime());
      return datedFiles[0].file;
    }

    csvFiles.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    return csvFiles[0];
  }

  private resolveCategoryDir(basePath: string): string {
    const parsed = path.parse(basePath);
    const baseDir = parsed.dir || '.';
    const baseName = parsed.name || 'export';
    return path.resolve(baseDir, baseName);
  }

  private collectCsvFiles(dirPath: string): string[] {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        files.push(...this.collectCsvFiles(entryPath));
      } else if (entry.isFile() && entry.name.endsWith('.csv')) {
        files.push(entryPath);
      }
    }

    return files;
  }

  private extractDateFromFilename(filePath: string): Date | null {
    const fileName = path.basename(filePath);
    const match = fileName.match(/-(\d{4})-(\d{2})-(\d{2})\.csv$/);
    if (!match) {
      return null;
    }

    const [, year, month, day] = match;
    const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private mapRowToRepo(row: CsvRow): FormattedRepoInfo {
    const activityType = row.activityType === 'Issue更新' ? 'Issue更新' : 'Push';
    const daysSinceLastActivity = this.parseNumber(row.daysSinceLastActivity);
    const exportedAtUtc = new Date(row.exportedAtUtc);
    const lastActivityDate = new Date(
      exportedAtUtc.getTime() - daysSinceLastActivity * 24 * 60 * 60 * 1000
    );

    const hasIssues = this.parseYesNo(row.hasIssues);
    const hasWiki = this.parseYesNo(row.hasWiki);
    const hasProjects = this.parseYesNo(row.hasProjects);

    const homepage = row.homepage === 'なし' ? '' : row.homepage;
    const topicsDisplay = row.topics || 'トピックなし';
    const topics =
      topicsDisplay === 'トピックなし'
        ? []
        : topicsDisplay.split(',').map(topic => topic.trim()).filter(Boolean);

    return {
      name: row.name,
      fullName: row.fullName,
      description: row.description || '説明なし',
      stars: this.parseNumber(row.stars),
      forks: this.parseNumber(row.forks),
      watchers: this.parseNumber(row.watchers),
      openIssues: this.parseNumber(row.openIssues),
      closedIssues: row.closedIssues ? this.parseNumber(row.closedIssues) : 0,
      size: this.parseSize(row.sizeDisplay),
      language: row.language || '未設定',
      license: row.license || '未設定',
      topics,
      archived: row.archiveStatus.includes('アーカイブ'),
      isPrivate: row.visibility.includes('プライベート'),
      defaultBranch: row.defaultBranch || 'main',
      hasIssues,
      hasWiki,
      hasProjects,
      homepage,
      createdAt: this.parseDate(row.createdDate),
      updatedAt: this.parseDate(row.updatedDate),
      pushedAt: this.parseDate(row.pushedDate),
      latestRelease: undefined,
      latestIssueUpdated: this.parseOptionalDate(row.latestIssueUpdated),
      url: row.url,
      activity: {
        lastActivityDate,
        activityType,
        daysSinceLastActivity,
        status: this.mapStatus(row.status)
      },
      sizeDisplay: row.sizeDisplay,
      createdDateStr: row.createdDate,
      updatedDateStr: row.updatedDate,
      pushedDateStr: row.pushedDate,
      latestIssueUpdatedStr: row.latestIssueUpdated,
      releaseInfo: row.releaseInfo,
      archiveStatus: row.archiveStatus,
      visibility: row.visibility,
      issuesStatus: hasIssues ? '✅' : '❌',
      wikiStatus: hasWiki ? '✅' : '❌',
      projectsStatus: hasProjects ? '✅' : '❌',
      homepageDisplay: homepage
        ? `🌐 [${homepage}](${homepage})`
        : 'ホームページ未設定',
      topicsDisplay
    };
  }

  private parseNumber(value: string): number {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }

  private parseSize(sizeDisplay: string): number {
    const match = sizeDisplay.match(/^(\d+)\s*(MB|KB)$/i);
    if (!match) {
      return 0;
    }

    const size = Number(match[1]);
    const unit = match[2].toUpperCase();
    return unit === 'MB' ? size * 1024 : size;
  }

  private parseDate(value: string): Date {
    return new Date(`${value}T00:00:00Z`);
  }

  private parseOptionalDate(value: string): Date | undefined {
    if (!value || value === 'なし') {
      return undefined;
    }
    return this.parseDate(value);
  }

  private parseYesNo(value: string): boolean {
    return value === 'はい';
  }

  private mapStatus(value: string): RepoStatus {
    const mapping: Record<string, RepoStatus> = {
      '頻繁に更新': RepoStatus.FREQUENT,
      '定期的に更新': RepoStatus.REGULAR,
      '時々更新': RepoStatus.OCCASIONAL,
      '更新が少ない': RepoStatus.RARE,
      '停滞中': RepoStatus.STALE,
      '不明': RepoStatus.UNKNOWN
    };
    return mapping[value] ?? RepoStatus.UNKNOWN;
  }
}

