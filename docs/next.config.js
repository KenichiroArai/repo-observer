/** @type {import('next').NextConfig} */
// GitHub Pagesで /docs フォルダを公開する場合、basePathは /repo-name/docs になる
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'repo-observer';
const basePath = process.env.NODE_ENV === 'production' ? `/${repoName}/docs` : '';

const nextConfig = {
  output: 'export',
  basePath: basePath,
  assetPrefix: basePath,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig

