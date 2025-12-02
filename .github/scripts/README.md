# GitHub Actions スクリプト

このディレクトリには、GitHub Actions ワークフローで使用するスクリプトがまとめられています。

## 📁 ディレクトリ構成

```text
.github/scripts/
└── repo-full-sync/     # repo-full-syncワークフロー専用スクリプト
    ├── src/            # TypeScriptソースコード
    ├── package.json    # 依存関係定義
    ├── tsconfig.json   # TypeScript設定
    └── README.md       # スクリプトの詳細ドキュメント
```

## 🔧 ワークフローとの関係

- **ワークフローファイル**: `.github/workflows/repo-full-sync.yml`
- **使用スクリプト**: `.github/scripts/repo-full-sync/`

この構成は、GitHub Actions で一般的に採用されている標準的な構成です。

## 📝 詳細

各スクリプトの詳細については、それぞれのサブディレクトリ内のREADMEを参照してください：

- [repo-full-sync スクリプト](./repo-full-sync/README.md)
