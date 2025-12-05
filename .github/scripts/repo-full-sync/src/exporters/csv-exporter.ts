/**
 * CSV出力モジュール
 */

import { createObjectCsvWriter } from 'csv-writer';
import { FormattedRepoInfo, CsvExportConfig } from '../types.js';
import * as fs from 'fs';
import * as path from 'path';

export class CsvExporter {
  private resolveDatedOutputPath(basePath: string, exportedAtJst: Date): string {
    const parsed = path.parse(basePath);
    const year = exportedAtJst.getUTCFullYear().toString();
    const month = String(exportedAtJst.getUTCMonth() + 1).padStart(2, '0');
    const day = String(exportedAtJst.getUTCDate()).padStart(2, '0');
    const extension = parsed.ext || '.csv';
    const baseName = parsed.name || 'export';
    const fileName = `${baseName}-${year}-${month}-${day}${extension}`;
    const baseDir = parsed.dir || '.';
    const categoryDir = path.join(baseDir, baseName);
    return path.join(categoryDir, year, month, fileName);
  }

  /**
   * リポジトリ情報をCSVファイルに出力
   */
  async exportToCsv(
    repos: FormattedRepoInfo[],
    config: CsvExportConfig
  ): Promise<void> {
    console.log('CSV出力を開始します...');

    // フィルタリング
    let filteredRepos = repos;

    if (!config.includePrivate) {
      filteredRepos = filteredRepos.filter(r => !r.isPrivate);
      console.log(`プライベートリポジトリを除外: ${repos.length - filteredRepos.length} 個`);
    }

    if (!config.includeArchived) {
      const beforeCount = filteredRepos.length;
      filteredRepos = filteredRepos.filter(r => !r.archived);
      console.log(`アーカイブ済みリポジトリを除外: ${beforeCount - filteredRepos.length} 個`);
    }

    const exportedAtUtc = new Date();
    const exportedAtJst = new Date(exportedAtUtc.getTime() + 9 * 60 * 60 * 1000);
    const exportedAtUtcStr = exportedAtUtc.toISOString();
    const exportedAtJstStr = exportedAtJst.toISOString().replace('Z', '+09:00');

    const resolvedOutputPath = this.resolveDatedOutputPath(
      config.outputPath,
      exportedAtJst
    );

    // 出力ディレクトリを作成
    const outputDir = path.dirname(resolvedOutputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const appendMode =
      fs.existsSync(resolvedOutputPath) &&
      fs.statSync(resolvedOutputPath).size > 0;

    // CSVライターを作成
    const csvWriter = createObjectCsvWriter({
      path: resolvedOutputPath,
      header: [
        { id: 'exportedAtUtc', title: 'エクスポート日時(UTC)' },
        { id: 'exportedAtJst', title: 'エクスポート日時(JST)' },
        { id: 'name', title: 'リポジトリ名' },
        { id: 'fullName', title: 'フルネーム' },
        { id: 'description', title: '説明' },
        { id: 'status', title: 'ステータス' },
        { id: 'activityType', title: '活動種別' },
        { id: 'daysSinceLastActivity', title: '最終活動からの日数' },
        { id: 'stars', title: 'スター数' },
        { id: 'forks', title: 'フォーク数' },
        { id: 'watchers', title: 'ウォッチャー数' },
        { id: 'openIssues', title: '未解決Issue数' },
        { id: 'closedIssues', title: 'クローズ済みIssue数' },
        { id: 'commits', title: 'コミット数' },
        { id: 'sizeDisplay', title: 'サイズ' },
        { id: 'language', title: '使用言語' },
        { id: 'license', title: 'ライセンス' },
        { id: 'topics', title: 'トピック' },
        { id: 'archiveStatus', title: 'アーカイブ状態' },
        { id: 'visibility', title: '公開状態' },
        { id: 'defaultBranch', title: 'デフォルトブランチ' },
        { id: 'hasIssues', title: 'Issues有効' },
        { id: 'hasWiki', title: 'Wiki有効' },
        { id: 'hasProjects', title: 'Projects有効' },
        { id: 'homepage', title: 'ホームページ' },
        { id: 'createdDate', title: '作成日' },
        { id: 'updatedDate', title: '最終更新日' },
        { id: 'pushedDate', title: '最終Push日' },
        { id: 'latestIssueUpdated', title: 'Issue最終更新日' },
        { id: 'releaseInfo', title: '最新リリース' },
        { id: 'url', title: 'URL' }
      ],
      append: appendMode,
      encoding: 'utf8'
    });

    // データを変換
    const records = filteredRepos.map(repo => ({
      exportedAtUtc: exportedAtUtcStr,
      exportedAtJst: exportedAtJstStr,
      name: repo.name,
      fullName: repo.fullName,
      description: repo.description,
      status: repo.activity.status,
      activityType: repo.activity.activityType,
      daysSinceLastActivity: repo.activity.daysSinceLastActivity,
      stars: repo.stars,
      forks: repo.forks,
      watchers: repo.watchers,
      openIssues: repo.openIssues,
      closedIssues: repo.closedIssues,
      commits: repo.commits,
      sizeDisplay: repo.sizeDisplay,
      language: repo.language,
      license: repo.license,
      topics: repo.topicsDisplay,
      archiveStatus: repo.archiveStatus,
      visibility: repo.visibility,
      defaultBranch: repo.defaultBranch,
      hasIssues: repo.hasIssues ? 'はい' : 'いいえ',
      hasWiki: repo.hasWiki ? 'はい' : 'いいえ',
      hasProjects: repo.hasProjects ? 'はい' : 'いいえ',
      homepage: repo.homepage || 'なし',
      createdDate: repo.createdDateStr,
      updatedDate: repo.updatedDateStr,
      pushedDate: repo.pushedDateStr,
      latestIssueUpdated: repo.latestIssueUpdatedStr,
      releaseInfo: repo.releaseInfo.replace(/\*\*/g, ''), // Markdown記号を除去
      url: repo.url
    }));

    // CSVに書き込み
    await csvWriter.writeRecords(records);

    console.log(
      `✅ ${filteredRepos.length} 個のリポジトリを ${resolvedOutputPath} に出力しました`
    );
  }

  /**
   * サマリーCSVを出力（主要な情報のみ）
   */
  async exportSummaryToCsv(
    repos: FormattedRepoInfo[],
    outputPath: string
  ): Promise<void> {
    console.log('サマリーCSVを出力します...');

    const exportedAtUtc = new Date();
    const exportedAtJst = new Date(exportedAtUtc.getTime() + 9 * 60 * 60 * 1000);
    const exportedAtUtcStr = exportedAtUtc.toISOString();
    const exportedAtJstStr = exportedAtJst.toISOString().replace('Z', '+09:00');

    const resolvedOutputPath = this.resolveDatedOutputPath(
      outputPath,
      exportedAtJst
    );

    const outputDir = path.dirname(resolvedOutputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const appendMode =
      fs.existsSync(resolvedOutputPath) &&
      fs.statSync(resolvedOutputPath).size > 0;

    const csvWriter = createObjectCsvWriter({
      path: resolvedOutputPath,
      header: [
        { id: 'exportedAtUtc', title: 'エクスポート日時(UTC)' },
        { id: 'exportedAtJst', title: 'エクスポート日時(JST)' },
        { id: 'name', title: 'リポジトリ名' },
        { id: 'status', title: 'ステータス' },
        { id: 'stars', title: 'スター数' },
        { id: 'forks', title: 'フォーク数' },
        { id: 'openIssues', title: '未解決Issue' },
        { id: 'closedIssues', title: 'クローズ済みIssue' },
        { id: 'commits', title: 'コミット数' },
        { id: 'language', title: '言語' },
        { id: 'pushedDate', title: '最終Push' },
        { id: 'url', title: 'URL' }
      ],
      append: appendMode,
      encoding: 'utf8'
    });

    const records = repos.map(repo => ({
      exportedAtUtc: exportedAtUtcStr,
      exportedAtJst: exportedAtJstStr,
      name: repo.name,
      status: repo.activity.status,
      stars: repo.stars,
      forks: repo.forks,
      openIssues: repo.openIssues,
      closedIssues: repo.closedIssues,
      commits: repo.commits,
      language: repo.language,
      pushedDate: repo.pushedDateStr,
      url: repo.url
    }));

    await csvWriter.writeRecords(records);
    console.log(`✅ サマリーを ${resolvedOutputPath} に出力しました`);
  }
}

