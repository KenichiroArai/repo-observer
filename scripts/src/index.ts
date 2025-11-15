#!/usr/bin/env node
/**
 * Repo Observer - メインエントリーポイント
 */

import { RepoFetcher } from './repo-fetcher.js';
import { RepoFormatter } from './repo-formatter.js';
import { CsvExporter } from './exporters/csv-exporter.js';
import { IssueExporter } from './exporters/issue-exporter.js';
import { CsvImporter } from './csv-importer.js';
import { GitHubConfig, CsvExportConfig, IssueExportConfig } from './types.js';

/**
 * 環境変数から設定を読み込み
 */
function loadConfig() {
  const token = process.env.GITHUB_TOKEN;
  const targetUser = process.env.TARGET_USER || 'KenichiroArai';

  if (!token) {
    console.error('エラー: GITHUB_TOKEN環境変数が設定されていません');
    process.exit(1);
  }

  return { token, targetUser };
}

/**
 * CSV出力メイン処理
 */
export async function exportCsv() {
  console.log('=== CSV出力を開始 ===');

  const { token, targetUser } = loadConfig();
  const outputPath = process.env.OUTPUT_PATH || './output/repositories.csv';
  const includePrivate = process.env.INCLUDE_PRIVATE === 'true';
  const includeArchived = process.env.INCLUDE_ARCHIVED === 'true';
  const exportSummary = process.env.EXPORT_SUMMARY === 'true';

  const config: GitHubConfig = { token, targetUser };

  // リポジトリ情報を取得
  const fetcher = new RepoFetcher(config);
  const repos = await fetcher.fetchAllRepositories();

  // 情報を整形
  const formatter = new RepoFormatter();
  const formattedRepos = formatter.formatAll(repos);

  // CSV出力
  const csvExporter = new CsvExporter();
  const csvConfig: CsvExportConfig = {
    outputPath,
    includePrivate,
    includeArchived
  };

  await csvExporter.exportToCsv(formattedRepos, csvConfig);

  // サマリーも出力する場合
  if (exportSummary) {
    const summaryPath = outputPath.replace('.csv', '-summary.csv');
    await csvExporter.exportSummaryToCsv(formattedRepos, summaryPath);
  }

  console.log('=== CSV出力が完了しました ===');
}

/**
 * Issue同期メイン処理
 */
export async function syncIssues() {
  console.log('=== Issue同期を開始 ===');

  const { token, targetUser } = loadConfig();
  const repository = process.env.REPOSITORY;
  const projectNumber = process.env.PROJECT_NUMBER
    ? parseInt(process.env.PROJECT_NUMBER)
    : undefined;
  const projectStatusField = process.env.PROJECT_STATUS_FIELD || 'Status';
  const includePrivate = process.env.INCLUDE_PRIVATE === 'true';
  const includeArchived = process.env.INCLUDE_ARCHIVED === 'true';

  if (!repository) {
    console.error('エラー: REPOSITORY環境変数が設定されていません（例: owner/repo）');
    process.exit(1);
  }

  const config: GitHubConfig = { token, targetUser };

  // CSVからリポジトリ情報を読み込み
  const csvInputPath =
    process.env.CSV_INPUT_PATH || process.env.OUTPUT_PATH || './output/repositories.csv';
  const importer = new CsvImporter(csvInputPath);
  const formattedRepos = await importer.loadLatestRepositories();

  // Issue同期
  const issueExporter = new IssueExporter(token, {
    repository,
    projectNumber,
    projectStatusField,
    includePrivate,
    includeArchived
  });

  await issueExporter.syncToIssues(formattedRepos);

  console.log('=== Issue同期が完了しました ===');
}

/**
 * CLIメイン処理
 */
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'export-csv':
      await exportCsv();
      break;
    case 'sync-issues':
      await syncIssues();
      break;
    case 'help':
    case '--help':
    case '-h':
      console.log(`
使い方:
  node dist/index.js <command>

コマンド:
  export-csv    - リポジトリ情報をCSVファイルに出力
  sync-issues   - リポジトリ情報をIssueとして同期

環境変数:
  GITHUB_TOKEN        - GitHub Personal Access Token（必須）
  TARGET_USER         - 対象ユーザー名（デフォルト: KenichiroArai）

  CSV出力用:
    OUTPUT_PATH       - 出力先パス（デフォルト: ./output/repositories.csv）
    INCLUDE_PRIVATE   - プライベートリポジトリを含める（true/false）
    INCLUDE_ARCHIVED  - アーカイブ済みを含める（true/false）
    EXPORT_SUMMARY    - サマリーCSVも出力（true/false）

  Issue同期用:
    REPOSITORY           - 同期先リポジトリ（例: owner/repo）（必須）
    PROJECT_NUMBER       - Project番号（オプション）
    PROJECT_STATUS_FIELD - ステータスフィールド名（デフォルト: Status）
    CSV_INPUT_PATH       - Issue同期で参照するCSV（デフォルト: OUTPUT_PATHと同じ）
    INCLUDE_PRIVATE      - プライベートリポジトリを含める（true/false）
    INCLUDE_ARCHIVED     - アーカイブ済みを含める（true/false）

例:
  # CSV出力
  GITHUB_TOKEN=xxx TARGET_USER=KenichiroArai node dist/index.js export-csv

  # Issue同期
  GITHUB_TOKEN=xxx TARGET_USER=KenichiroArai REPOSITORY=owner/repo node dist/index.js sync-issues
      `);
      break;
    default:
      console.error(`不明なコマンド: ${command}`);
      console.error('使い方を確認するには: node dist/index.js help');
      process.exit(1);
  }
}

// スクリプトとして直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  });
}

