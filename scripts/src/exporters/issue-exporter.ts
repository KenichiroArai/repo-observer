/**
 * Issue出力モジュール
 */

import { Octokit } from '@octokit/rest';
import { graphql } from '@octokit/graphql';
import { FormattedRepoInfo, IssueExportConfig, RepoStatus } from '../types.js';

interface ProjectInfo {
  projectId: string;
  statusFieldId: string;
  statusOptions: Map<RepoStatus, string>;
}

export class IssueExporter {
  private octokit: Octokit;
  private graphqlClient: ReturnType<typeof graphql>;
  private config: IssueExportConfig;

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

    // Project情報を取得（設定されている場合）
    let projectInfo: ProjectInfo | undefined;
    if (this.config.projectNumber) {
      try {
        projectInfo = await this.fetchProjectInfo();
        console.log('✅ Project情報を取得しました');
      } catch (error) {
        console.warn('⚠️ Project情報の取得に失敗しました:', error);
      }
    }

    const [owner, repo] = this.config.repository.split('/');

    // 各リポジトリを処理
    for (const repoInfo of filteredRepos) {
      try {
        await this.syncRepositoryToIssue(owner, repo, repoInfo, projectInfo);
      } catch (error) {
        console.error(`❌ ${repoInfo.fullName} の処理中にエラーが発生:`, error);
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
      await this.octokit.issues.update({
        owner,
        repo,
        issue_number: existingIssue.number,
        body
      });
      issueNumber = existingIssue.number;
    } else {
      // 新規Issue作成
      console.log(`  新規Issueを作成`);
      const created = await this.octokit.issues.create({
        owner,
        repo,
        title: repoInfo.name,
        body
      });
      issueNumber = created.data.number;
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
   * 既存Issueを検索
   */
  private async findExistingIssue(
    owner: string,
    repo: string,
    title: string
  ): Promise<{ number: number; state: string } | null> {
    try {
      const response = await this.octokit.search.issuesAndPullRequests({
        q: `repo:${owner}/${repo} is:issue in:title "${title}"`
      });

      if (response.data.items.length > 0) {
        const issue = response.data.items[0];
        return {
          number: issue.number,
          state: issue.state
        };
      }
    } catch (error) {
      console.error('Issue検索エラー:', error);
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

    const result: any = await this.graphqlClient(query, {
      user: owner,
      number: this.config.projectNumber!
    });

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
    const issueData = await this.octokit.issues.get({
      owner,
      repo,
      issue_number: issueNumber
    });
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
      const addResult: any = await this.graphqlClient(addMutation, {
        projectId: projectInfo.projectId,
        contentId: issueGlobalId
      });
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

    await this.graphqlClient(updateMutation, {
      projectId: projectInfo.projectId,
      itemId: itemId,
      fieldId: projectInfo.statusFieldId,
      value: {
        singleSelectOptionId: statusOptionId
      }
    });
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

    const result: any = await this.graphqlClient(query, { projectId });
    const item = result.node.items.nodes.find(
      (node: any) => node.content?.id === issueGlobalId
    );

    if (!item) {
      throw new Error('Project Item IDが見つかりません');
    }

    return item.id;
  }
}

