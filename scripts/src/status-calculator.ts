/**
 * リポジトリステータス判定モジュール
 */

import { RepositoryInfo, ActivityInfo, RepoStatus } from './types.js';

export class StatusCalculator {
  /**
   * リポジトリの活動情報を計算
   */
  calculateActivity(repo: RepositoryInfo): ActivityInfo {
    const now = new Date();

    // Push日とIssue更新日を比較し、より新しい方を使用
    let lastActivityDate = repo.pushedAt;
    let activityType: "Push" | "Issue更新" = "Push";

    if (repo.latestIssueUpdated && repo.latestIssueUpdated > lastActivityDate) {
      lastActivityDate = repo.latestIssueUpdated;
      activityType = "Issue更新";
    }

    // 経過日数を計算
    const diffMs = now.getTime() - lastActivityDate.getTime();
    const daysSinceLastActivity = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // ステータスを判定
    const status = this.determineStatus(daysSinceLastActivity);

    return {
      lastActivityDate,
      activityType,
      daysSinceLastActivity,
      status
    };
  }

  /**
   * 経過日数からステータスを判定
   */
  private determineStatus(days: number): RepoStatus {
    if (days <= 7) {
      return RepoStatus.FREQUENT;
    } else if (days <= 30) {
      return RepoStatus.REGULAR;
    } else if (days <= 180) {
      return RepoStatus.OCCASIONAL;
    } else if (days <= 365) {
      return RepoStatus.RARE;
    } else {
      return RepoStatus.STALE;
    }
  }

  /**
   * ステータスの説明を取得
   */
  getStatusDescription(status: RepoStatus): string {
    const descriptions: Record<RepoStatus, string> = {
      [RepoStatus.FREQUENT]: '7日以内に更新',
      [RepoStatus.REGULAR]: '8-30日以内に更新',
      [RepoStatus.OCCASIONAL]: '31-180日以内に更新',
      [RepoStatus.RARE]: '181-365日以内に更新',
      [RepoStatus.STALE]: '366日以上更新なし',
      [RepoStatus.UNKNOWN]: 'ステータス不明'
    };
    return descriptions[status];
  }

  /**
   * ステータスの絵文字を取得
   */
  getStatusEmoji(status: RepoStatus): string {
    const emojis: Record<RepoStatus, string> = {
      [RepoStatus.FREQUENT]: '🔥',
      [RepoStatus.REGULAR]: '✅',
      [RepoStatus.OCCASIONAL]: '⏰',
      [RepoStatus.RARE]: '⚠️',
      [RepoStatus.STALE]: '💤',
      [RepoStatus.UNKNOWN]: '❓'
    };
    return emojis[status];
  }
}

