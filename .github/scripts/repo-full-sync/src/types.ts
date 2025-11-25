/**
 * リポジトリ情報の型定義
 */

/** リポジトリ基本情報 */
export interface RepositoryInfo {
  name: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  size: number; // KB単位
  language: string;
  license: string;
  topics: string[];
  archived: boolean;
  isPrivate: boolean;
  defaultBranch: string;
  hasIssues: boolean;
  hasWiki: boolean;
  hasProjects: boolean;
  homepage: string;
  createdAt: Date;
  updatedAt: Date;
  pushedAt: Date;
  latestRelease?: ReleaseInfo;
  latestIssueUpdated?: Date;
  url: string;
}

/** リリース情報 */
export interface ReleaseInfo {
  tagName: string;
  publishedAt: Date;
}

/** リポジトリステータス */
export enum RepoStatus {
  FREQUENT = "頻繁に更新",
  REGULAR = "定期的に更新",
  OCCASIONAL = "時々更新",
  RARE = "更新が少ない",
  STALE = "停滞中",
  UNKNOWN = "不明"
}

/** 活動情報 */
export interface ActivityInfo {
  lastActivityDate: Date;
  activityType: "Push" | "Issue更新";
  daysSinceLastActivity: number;
  status: RepoStatus;
}

/** 整形済みリポジトリ情報 */
export interface FormattedRepoInfo extends RepositoryInfo {
  activity: ActivityInfo;
  sizeDisplay: string; // "123 MB" または "456 KB"
  createdDateStr: string; // YYYY-MM-DD
  updatedDateStr: string; // YYYY-MM-DD
  pushedDateStr: string; // YYYY-MM-DD
  latestIssueUpdatedStr: string; // YYYY-MM-DD または "なし"
  releaseInfo: string; // "v1.0.0 (2024-01-01)" または "リリースなし"
  archiveStatus: string; // "📦 アーカイブ済み" または "✅ アクティブ"
  visibility: string; // "🔒 プライベート" または "🔓 パブリック"
  issuesStatus: string; // "✅" または "❌"
  wikiStatus: string; // "✅" または "❌"
  projectsStatus: string; // "✅" または "❌"
  homepageDisplay: string; // "🌐 [url](url)" または "ホームページ未設定"
  topicsDisplay: string; // "topic1, topic2" または "トピックなし"
}

/** CSV出力用の設定 */
export interface CsvExportConfig {
  outputPath: string;
  includePrivate?: boolean;
  includeArchived?: boolean;
}

/** Issue出力用の設定 */
export interface IssueExportConfig {
  repository: string; // "owner/repo"
  projectNumber?: number;
  projectStatusField?: string;
  includePrivate?: boolean;
  includeArchived?: boolean;
}

/** GitHub APIクライアント設定 */
export interface GitHubConfig {
  token: string;
  targetUser: string;
}

