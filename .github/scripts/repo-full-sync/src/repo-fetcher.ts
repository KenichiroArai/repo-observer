/**
 * リポジトリ情報取得モジュール
 */

import { Octokit } from '@octokit/rest';
import { RepositoryInfo, ReleaseInfo, GitHubConfig } from './types.js';

export class RepoFetcher {
  private octokit: Octokit;
  private targetUser: string;

  constructor(config: GitHubConfig) {
    this.octokit = new Octokit({ auth: config.token });
    this.targetUser = config.targetUser;
  }

  /**
   * 対象ユーザーの全リポジトリを取得
   */
  async fetchAllRepositories(): Promise<RepositoryInfo[]> {
    console.log(`${this.targetUser} のリポジトリを取得中...`);

    const repos: RepositoryInfo[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      try {
        const response = await this.octokit.repos.listForUser({
          username: this.targetUser,
          per_page: perPage,
          page: page,
          sort: 'updated',
          direction: 'desc'
        });

        if (response.data.length === 0) {
          break;
        }

        for (const repo of response.data) {
          const repoInfo = await this.fetchRepositoryDetails(repo.owner.login, repo.name);
          repos.push(repoInfo);
          console.log(`  ✓ ${repo.full_name}`);
        }

        // 次のページがあるか確認
        if (response.data.length < perPage) {
          break;
        }

        page++;
      } catch (error) {
        console.error(`リポジトリ一覧取得エラー (page ${page}):`, error);
        break;
      }
    }

    console.log(`合計 ${repos.length} 個のリポジトリを取得しました`);
    return repos;
  }

  /**
   * 個別リポジトリの詳細情報を取得
   */
  private async fetchRepositoryDetails(owner: string, repo: string): Promise<RepositoryInfo> {
    try {
      const { data } = await this.octokit.repos.get({
        owner,
        repo
      });

      // 最新リリース情報を取得
      let latestRelease: ReleaseInfo | undefined;
      try {
        const releaseResponse = await this.octokit.repos.getLatestRelease({
          owner,
          repo
        });
        latestRelease = {
          tagName: releaseResponse.data.tag_name,
          publishedAt: new Date(releaseResponse.data.published_at!)
        };
      } catch {
        // リリースがない場合はundefined
        latestRelease = undefined;
      }

      // 最新Issue更新日を取得
      let latestIssueUpdated: Date | undefined;
      try {
        const issuesResponse = await this.octokit.issues.listForRepo({
          owner,
          repo,
          state: 'all',
          sort: 'updated',
          direction: 'desc',
          per_page: 1
        });
        if (issuesResponse.data.length > 0) {
          latestIssueUpdated = new Date(issuesResponse.data[0].updated_at);
        }
      } catch {
        // Issue情報が取得できない場合はundefined
        latestIssueUpdated = undefined;
      }

      // クローズしたIssue数を取得
      let closedIssues = 0;
      try {
        // Issuesが有効な場合のみ取得
        if (data.has_issues) {
          closedIssues = await this.fetchClosedIssuesCount(owner, repo);
        }
      } catch (error) {
        // エラーが発生した場合は0として扱う
        console.warn(`クローズしたIssue数取得エラー (${owner}/${repo}):`, error);
        closedIssues = 0;
      }

      return {
        name: data.name,
        fullName: data.full_name,
        description: data.description || '説明なし',
        stars: data.stargazers_count,
        forks: data.forks_count,
        watchers: data.watchers_count,
        openIssues: data.open_issues_count,
        closedIssues: closedIssues,
        size: data.size,
        language: data.language || '不明',
        license: data.license?.name || 'ライセンスなし',
        topics: data.topics || [],
        archived: data.archived,
        isPrivate: data.private,
        defaultBranch: data.default_branch,
        hasIssues: data.has_issues,
        hasWiki: data.has_wiki,
        hasProjects: data.has_projects,
        homepage: data.homepage || '',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        pushedAt: new Date(data.pushed_at!),
        latestRelease,
        latestIssueUpdated,
        url: data.html_url
      };
    } catch (error) {
      console.error(`リポジトリ詳細取得エラー (${owner}/${repo}):`, error);
      throw error;
    }
  }

  /**
   * 特定のリポジトリ情報を取得
   */
  async fetchRepository(owner: string, repo: string): Promise<RepositoryInfo> {
    return this.fetchRepositoryDetails(owner, repo);
  }

  /**
   * クローズしたIssue数を取得
   */
  private async fetchClosedIssuesCount(owner: string, repo: string): Promise<number> {
    let count = 0;
    let page = 1;
    const perPage = 100;

    while (true) {
      try {
        const response = await this.octokit.issues.listForRepo({
          owner,
          repo,
          state: 'closed',
          per_page: perPage,
          page: page
        });

        // Pull Requestは除外（Issueのみをカウント）
        const issuesOnly = response.data.filter(
          issue => !issue.pull_request
        );
        count += issuesOnly.length;

        // 次のページがあるか確認
        if (response.data.length < perPage) {
          break;
        }

        page++;
      } catch (error) {
        console.warn(`クローズしたIssue取得エラー (${owner}/${repo}, page ${page}):`, error);
        break;
      }
    }

    return count;
  }
}

