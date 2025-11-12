/**
 * リポジトリ情報整形モジュール
 */

import { format } from 'date-fns';
import { RepositoryInfo, FormattedRepoInfo } from './types.js';
import { StatusCalculator } from './status-calculator.js';

export class RepoFormatter {
  private statusCalculator: StatusCalculator;

  constructor() {
    this.statusCalculator = new StatusCalculator();
  }

  /**
   * リポジトリ情報を整形
   */
  format(repo: RepositoryInfo): FormattedRepoInfo {
    const activity = this.statusCalculator.calculateActivity(repo);

    return {
      ...repo,
      activity,
      sizeDisplay: this.formatSize(repo.size),
      createdDateStr: this.formatDate(repo.createdAt),
      updatedDateStr: this.formatDate(repo.updatedAt),
      pushedDateStr: this.formatDate(repo.pushedAt),
      latestIssueUpdatedStr: repo.latestIssueUpdated
        ? this.formatDate(repo.latestIssueUpdated)
        : 'なし',
      releaseInfo: this.formatRelease(repo),
      archiveStatus: repo.archived ? '📦 アーカイブ済み' : '✅ アクティブ',
      visibility: repo.isPrivate ? '🔒 プライベート' : '🔓 パブリック',
      issuesStatus: repo.hasIssues ? '✅' : '❌',
      wikiStatus: repo.hasWiki ? '✅' : '❌',
      projectsStatus: repo.hasProjects ? '✅' : '❌',
      homepageDisplay: repo.homepage
        ? `🌐 [${repo.homepage}](${repo.homepage})`
        : 'ホームページ未設定',
      topicsDisplay: repo.topics.length > 0
        ? repo.topics.join(', ')
        : 'トピックなし'
    };
  }

  /**
   * 全リポジトリを整形
   */
  formatAll(repos: RepositoryInfo[]): FormattedRepoInfo[] {
    return repos.map(repo => this.format(repo));
  }

  /**
   * サイズを読みやすい形式に変換
   */
  private formatSize(sizeKb: number): string {
    if (sizeKb >= 1024) {
      const sizeMb = Math.floor(sizeKb / 1024);
      return `${sizeMb} MB`;
    }
    return `${sizeKb} KB`;
  }

  /**
   * 日付をYYYY-MM-DD形式に変換
   */
  private formatDate(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }

  /**
   * リリース情報を整形
   */
  private formatRelease(repo: RepositoryInfo): string {
    if (!repo.latestRelease) {
      return 'リリースなし';
    }

    const dateStr = this.formatDate(repo.latestRelease.publishedAt);
    return `**${repo.latestRelease.tagName}** (${dateStr})`;
  }
}

