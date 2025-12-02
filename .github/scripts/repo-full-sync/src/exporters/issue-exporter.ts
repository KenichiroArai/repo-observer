/**
 * Issue出力モジュール
 */

import { Octokit } from '@octokit/rest';
import { graphql, GraphqlResponseError } from '@octokit/graphql';
import { FormattedRepoInfo, IssueExportConfig, RepoStatus } from '../types.js';

class ProjectConfigurationError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'ProjectConfigurationError';
  }
}

interface ProjectInfo {
  projectId: string;
  statusFieldId: string;
  statusOptions: Map<RepoStatus, string>;
}

const SECONDARY_RATE_LIMIT_MAX_DELAY_MS = 60 * 60 * 1000; // 1 hour

export class IssueExporter {
  private octokit: Octokit;
  private graphqlClient: typeof graphql;
  private config: IssueExportConfig;
  private issueCache: Map<string, { number: number; state: string }> | null = null;

  constructor(token: string, config: IssueExportConfig) {
    this.octokit = new Octokit({ auth: token });
    this.graphqlClient = graphql.defaults({
      headers: {
        authorization: `token ${token}`
      }
    });
    this.config = config;
  }

  /**
   * 指定時間待機
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * リトライ付きAPI呼び出し
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 6,
    initialDelayMs: number = 60000
  ): Promise<T> {
    let lastError: any;
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // セカンダリレート制限エラーの場合
        if (error.status === 403 && error.message?.includes('secondary rate limit')) {
          const delayMs = Math.min(
            initialDelayMs * Math.pow(2, i),
            SECONDARY_RATE_LIMIT_MAX_DELAY_MS
          );
          const delayMinutes =
            delayMs >= 60000 ? (delayMs / 60000).toFixed(delayMs >= 3600000 ? 0 : 1) : '0.0';
          console.warn(`⚠️ セカンダリレート制限に達しました。${delayMinutes}分（${delayMs}ms）待機してリトライします... (${i + 1}/${maxRetries + 1})`);
          console.warn(`  リクエストID: ${error.request?.url || 'N/A'}`);
          await this.sleep(delayMs);
          continue;
        }

        // プライマリレート制限の場合
        if (error.status === 403 && error.response?.headers?.['x-ratelimit-remaining'] === '0') {
          const resetTime = error.response.headers['x-ratelimit-reset'];
          if (resetTime) {
            const waitMs = (parseInt(resetTime) * 1000) - Date.now() + 5000; // +5秒の余裕
            if (waitMs > 0 && i < maxRetries) {
              const waitMinutes = (waitMs / 60000).toFixed(1);
              console.warn(`⚠️ プライマリレート制限に達しました。${waitMinutes}分待機してリトライします...`);
              await this.sleep(waitMs);
              continue;
            }
          }
        }

        // 最終リトライでない場合は短い待機を入れる
        if (i < maxRetries) {
          console.warn(`⚠️ APIエラーが発生しました。10秒待機してリトライします... (${i + 1}/${maxRetries + 1})`);
          await this.sleep(10000);
          continue;
        }

        // 最終リトライ後はエラーをそのまま投げる
        throw error;
      }
    }
    throw lastError;
  }

  /**
   * 既存の全Issueをキャッシュ
   */
  private async cacheExistingIssues(owner: string, repo: string): Promise<void> {
    console.log('既存Issueをキャッシュ中...');
    this.issueCache = new Map();

    let page = 1;
    const perPage = 100;

    while (true) {
      try {
        const response = await this.retryWithBackoff(() =>
          this.octokit.issues.listForRepo({
            owner,
            repo,
            state: 'all',
            per_page: perPage,
            page: page
          })
        );

        for (const issue of response.data) {
          // Pull Requestは除外
          if (!issue.pull_request) {
            this.issueCache.set(issue.title, {
              number: issue.number,
              state: issue.state
            });
          }
        }

        if (response.data.length < perPage) {
          break;
        }

        page++;

        // ページ間で待機してレート制限を回避
        await this.sleep(2000);
      } catch (error) {
        console.error(`❌ Issueリスト取得エラー (page ${page}):`, error);
        // エラーが発生した場合も継続してキャッシュを構築
        break;
      }
    }

    console.log(`✅ ${this.issueCache.size} 個のIssueをキャッシュしました`);
  }

  /**
   * リポジトリ情報をIssueとして同期
   */
  async syncToIssues(repos: FormattedRepoInfo[]): Promise<void> {
    console.log('Issueへの同期を開始します...');

    // フィルタリング
    let filteredRepos = repos;

    if (!this.config.includePrivate) {
      filteredRepos = filteredRepos.filter(r => !r.isPrivate);
    }

    if (!this.config.includeArchived) {
      filteredRepos = filteredRepos.filter(r => !r.archived);
    }

    const [owner, repo] = this.config.repository.split('/');

    // 既存Issueをキャッシュ（レート制限回避のため）
    await this.cacheExistingIssues(owner, repo);

    // Project情報を取得（設定されている場合）
    let projectInfo: ProjectInfo | undefined;
    if (this.config.projectNumber) {
      try {
        projectInfo = await this.fetchProjectInfo();
        console.log('✅ Project情報を取得しました');
      } catch (error) {
        if (error instanceof ProjectConfigurationError) {
          console.error(`❌ ${error.message}`);
          throw error;
        }
        console.warn('⚠️ Project情報の取得に失敗しました:', error);
      }
    }

    // 各リポジトリを処理
    let processedCount = 0;
    let errorCount = 0;
    console.log(`処理対象: ${filteredRepos.length} リポジトリ`);

    for (const repoInfo of filteredRepos) {
      try {
        await this.syncRepositoryToIssue(owner, repo, repoInfo, projectInfo);
        processedCount++;
        console.log(`進捗: ${processedCount}/${filteredRepos.length} (エラー: ${errorCount})`);

        // 各リポジトリ処理の間に待機してレート制限を回避
        if (processedCount < filteredRepos.length) {
          await this.sleep(3000); // 3秒待機
        }
      } catch (error: any) {
        errorCount++;
        console.error(`❌ ${repoInfo.fullName} の処理中にエラーが発生:`);
        if (error.status) {
          console.error(`  ステータスコード: ${error.status}`);
        }
        if (error.message) {
          console.error(`  メッセージ: ${error.message}`);
        }

        // セカンダリレート制限エラーの場合は処理を停止
        if (error.status === 403 && error.message?.includes('secondary rate limit')) {
          console.error(`⚠️ セカンダリレート制限に達したため、処理を一時停止します。`);
          console.error(`  これまでの処理: ${processedCount}/${filteredRepos.length} 完了`);
          // 5分待機してから処理を再開
          console.log(`⏰ 5分間待機してから処理を再開します...`);
          await this.sleep(300000);
        }
      }
    }

    console.log(`✅ ${filteredRepos.length} 個のリポジトリの同期が完了しました`);
  }

  /**
   * 個別リポジトリをIssueとして同期
   */
  private async syncRepositoryToIssue(
    owner: string,
    repo: string,
    repoInfo: FormattedRepoInfo,
    projectInfo?: ProjectInfo
  ): Promise<void> {
    console.log(`処理中: ${repoInfo.name}`);

    // Issue本文を生成
    const body = this.generateIssueBody(repoInfo);

    // 既存Issueを検索
    const existingIssue = await this.findExistingIssue(owner, repo, repoInfo.name);

    let issueNumber: number;

    if (existingIssue) {
      // 既存Issueを更新
      console.log(`  既存Issue #${existingIssue.number} を更新`);
      await this.retryWithBackoff(() =>
        this.octokit.issues.update({
          owner,
          repo,
          issue_number: existingIssue.number,
          body
        })
      );
      issueNumber = existingIssue.number;
    } else {
      // 新規Issue作成
      console.log(`  新規Issueを作成`);
      const created = await this.retryWithBackoff(() =>
        this.octokit.issues.create({
          owner,
          repo,
          title: repoInfo.name,
          body
        })
      );
      issueNumber = created.data.number;

      // キャッシュに追加
      if (this.issueCache) {
        this.issueCache.set(repoInfo.name, {
          number: issueNumber,
          state: 'open'
        });
      }
    }

    // Projectに追加・更新（設定されている場合）
    if (projectInfo && existingIssue?.state !== 'closed') {
      try {
        await this.updateProjectItem(
          owner,
          repo,
          issueNumber,
          repoInfo.activity.status,
          projectInfo
        );
        console.log(`  ✅ Projectステータスを更新`);
      } catch (error) {
        console.warn(`  ⚠️ Projectステータス更新に失敗:`, error);
      }
    }
  }

  /**
   * Issue本文を生成
   */
  private generateIssueBody(repo: FormattedRepoInfo): string {
    return `## 📦 リポジトリ: [${repo.fullName}](${repo.url})

### 📝 説明・設定系
| 項目 | 内容 |
|------|------|
| 説明 | ${repo.description} |
| 使用言語 | ${repo.language} |
| ライセンス | ${repo.license} |
| トピックス | ${repo.topicsDisplay} |
| ホームページ | ${repo.homepageDisplay} |

### 📊 活動指標系
| 項目 | 内容 |
|------|------|
| スター数 | ⭐ ${repo.stars} |
| フォーク数 | 🍴 ${repo.forks} |
| ウォッチャー数 | 👀 ${repo.watchers} |
| 未解決Issue数 | 🐞 ${repo.openIssues} |
| リポジトリサイズ | 💾 ${repo.sizeDisplay} |
| ステータス | ${repo.activity.status} (${repo.activity.activityType} による判定) |

### ⏰ 日時系
| 項目 | 内容 |
|------|------|
| 作成日 | ${repo.createdDateStr} |
| 最終更新日 | ${repo.updatedDateStr} |
| 最終Push日 | ${repo.pushedDateStr} |
| Issue最終更新日 | ${repo.latestIssueUpdatedStr} |
| 最新リリース | ${repo.releaseInfo} |

### 🔧 状態・設定系
| 項目 | 内容 |
|------|------|
| アーカイブ状態 | ${repo.archiveStatus} |
| 公開状態 | ${repo.visibility} |
| デフォルトブランチ | ${repo.defaultBranch} |
| Issues | ${repo.issuesStatus} |
| Wiki | ${repo.wikiStatus} |
| Projects | ${repo.projectsStatus} |`;
  }

  /**
   * 既存Issueを検索（キャッシュを使用）
   */
  private async findExistingIssue(
    owner: string,
    repo: string,
    title: string
  ): Promise<{ number: number; state: string } | null> {
    // キャッシュから検索
    if (this.issueCache && this.issueCache.has(title)) {
      return this.issueCache.get(title)!;
    }
    return null;
  }

  /**
   * Project情報を取得
   */
  private async fetchProjectInfo(): Promise<ProjectInfo> {
    const [owner] = this.config.repository.split('/');
    const statusFieldName = this.config.projectStatusField || 'Status';

    const query = `
      query($user: String!, $number: Int!) {
        user(login: $user) {
          projectV2(number: $number) {
            id
            fields(first: 20) {
              nodes {
                ... on ProjectV2SingleSelectField {
                  id
                  name
                  options {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    `;

    let result: any;
    try {
      result = await this.retryWithBackoff(() =>
        this.graphqlClient(query, {
          user: owner,
          number: this.config.projectNumber!
        })
      );
    } catch (error) {
      if (this.isProjectNotFoundError(error)) {
        const message = `Project番号 ${this.config.projectNumber} をユーザー ${owner} で取得できませんでした。Project設定を確認してください。`;
        throw new ProjectConfigurationError(message, error);
      }
      throw error;
    }

    const project = result.user.projectV2;
    const statusField = project.fields.nodes.find(
      (field: any) => field.name === statusFieldName
    );

    if (!statusField) {
      throw new Error(`ステータスフィールド '${statusFieldName}' が見つかりません`);
    }

    // ステータスオプションのマッピングを作成
    const statusOptions = new Map<RepoStatus, string>();
    for (const option of statusField.options) {
      const status = this.mapStatusNameToEnum(option.name);
      if (status) {
        statusOptions.set(status, option.id);
      }
    }

    return {
      projectId: project.id,
      statusFieldId: statusField.id,
      statusOptions
    };
  }

  /**
   * ステータス名をEnumにマッピング
   */
  private mapStatusNameToEnum(name: string): RepoStatus | null {
    const mapping: Record<string, RepoStatus> = {
      '頻繁に更新': RepoStatus.FREQUENT,
      '定期的に更新': RepoStatus.REGULAR,
      '時々更新': RepoStatus.OCCASIONAL,
      '更新が少ない': RepoStatus.RARE,
      '停滞中': RepoStatus.STALE
    };
    return mapping[name] || null;
  }

  /**
   * ProjectのアイテムとしてIssueを追加・更新
   */
  private async updateProjectItem(
    owner: string,
    repo: string,
    issueNumber: number,
    status: RepoStatus,
    projectInfo: ProjectInfo
  ): Promise<void> {
    // IssueのGlobal IDを取得
    const issueData = await this.retryWithBackoff(() =>
      this.octokit.issues.get({
        owner,
        repo,
        issue_number: issueNumber
      })
    );
    const issueGlobalId = (issueData.data as any).node_id;

    // Projectにアイテムを追加
    const addMutation = `
      mutation($projectId: ID!, $contentId: ID!) {
        addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
          item {
            id
          }
        }
      }
    `;

    let itemId: string;
    try {
      const addResult: any = await this.retryWithBackoff(() =>
        this.graphqlClient(addMutation, {
          projectId: projectInfo.projectId,
          contentId: issueGlobalId
        })
      );
      itemId = addResult.addProjectV2ItemById.item.id;
    } catch {
      // 既に追加済みの場合はitem_idを取得
      itemId = await this.getExistingItemId(projectInfo.projectId, issueGlobalId);
    }

    // ステータスフィールドを更新
    const statusOptionId = projectInfo.statusOptions.get(status);
    if (!statusOptionId) {
      console.warn(`ステータス ${status} のオプションIDが見つかりません`);
      return;
    }

    const updateMutation = `
      mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: ProjectV2FieldValue!) {
        updateProjectV2ItemFieldValue(input: {
          projectId: $projectId
          itemId: $itemId
          fieldId: $fieldId
          value: $value
        }) {
          projectV2Item {
            id
          }
        }
      }
    `;

    await this.retryWithBackoff(() =>
      this.graphqlClient(updateMutation, {
        projectId: projectInfo.projectId,
        itemId: itemId,
        fieldId: projectInfo.statusFieldId,
        value: {
          singleSelectOptionId: statusOptionId
        }
      })
    );
  }

  /**
   * 既存のProject Item IDを取得
   */
  private async getExistingItemId(projectId: string, issueGlobalId: string): Promise<string> {
    const query = `
      query($projectId: ID!) {
        node(id: $projectId) {
          ... on ProjectV2 {
            items(first: 100) {
              nodes {
                id
                content {
                  ... on Issue {
                    id
                  }
                }
              }
            }
          }
        }
      }
    `;

    const result: any = await this.retryWithBackoff(() =>
      this.graphqlClient(query, { projectId })
    );
    const item = result.node.items.nodes.find(
      (node: any) => node.content?.id === issueGlobalId
    );

    if (!item) {
      throw new Error('Project Item IDが見つかりません');
    }

    return item.id;
  }

  /**
   * Project取得エラーがProject番号未存在によるものか判定
   */
  private isProjectNotFoundError(error: unknown): error is GraphqlResponseError<any> {
    if (error instanceof GraphqlResponseError) {
      return error.errors?.some(e => e.type === 'NOT_FOUND' && e.message?.includes('ProjectV2')) ?? false;
    }
    return false;
  }
}

