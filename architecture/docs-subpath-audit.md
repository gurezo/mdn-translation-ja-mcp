# 生成ドキュメントとサブパス公開の調査

親 Issue: [#127](https://github.com/gurezo/mdn-translation-ja-mcp/issues/127)
本 Issue: [#128](https://github.com/gurezo/mdn-translation-ja-mcp/issues/128)

移行先は `https://gurezo.net/mdn-translation-ja-mcp/`。Firebase Hosting の公開主体は [gurezo/portal](https://github.com/gurezo/portal) である。本文書は、移す前の生成物と公開パスを記録する。

本文書は TypeDoc の `projectDocuments` に含めない。利用者向けの Pages には載せない。

## スコープ

含める:

- `docs:build`、`typedoc.json`、`site/`、`docs/` の棚卸し
- 現行 GitHub Pages の公開元
- クリーンビルドと、`/mdn-translation-ja-mcp/` 配下でのパス確認
- サブパス公開に必要な変更と不要な変更
- `portal` へ渡すファイル一式

含めない:

- 成果物の供給方式と CI（[#129](https://github.com/gurezo/mdn-translation-ja-mcp/issues/129)）
- portal 側の取り込みとデプロイ（[#130](https://github.com/gurezo/mdn-translation-ja-mcp/issues/130)）
- 公開 URL と文書内リンクの更新（[#131](https://github.com/gurezo/mdn-translation-ja-mcp/issues/131)）
- 旧 GitHub Pages の整理（[#132](https://github.com/gurezo/mdn-translation-ja-mcp/issues/132)）
- MCP サーバー本体の変更
- `docs/` の再生成コミット

## 生成

ランタイムは Node.js 24 以上（`package.json` の `engines.node`）。ドキュメント生成はアプリの `npm run build` とは独立している。`dist/` は不要である。

| スクリプト | 内容 |
| --- | --- |
| `docs:clean` | `rm -rf docs` |
| `docs:build` | `docs:clean` のあと `typedoc --options typedoc.json` |
| `docs:publish` | `docs:build` と同じ。ローカルで `docs/` を更新する別名であり、リモートへは送らない |

`typedoc.json` の要点:

| 項目 | 値 |
| --- | --- |
| `entryPoints` | `src`（`entryPointStrategy: expand`） |
| `exclude` | `**/*.test.ts` |
| `tsconfig` | `tsconfig.json` |
| `out` | `docs` |
| `excludePrivate` / `excludeProtected` / `excludeInternal` | すべて `true` |
| `hostedBaseUrl` | 未設定 |
| `githubPages` | 未設定（TypeDoc の既定で `.nojekyll` を出す） |

`projectDocuments` は次の 12 本。利用者向けが `site/`、設計メモが `architecture/` である。

- `site/architecture.md`
- `site/getting-started.md`
- `site/mcp-tools.md`
- `site/mcp-resources.md`
- `site/mcp-prompts.md`
- `site/translation-workflow.md`
- `site/client-integration.md`
- `site/agent-skills.md`
- `architecture/mcp-native.md`
- `architecture/tools.md`
- `architecture/client-verification.md`
- `architecture/responsibility-inventory.md`

README の「API ドキュメント（TypeDoc）」は、上記 3 スクリプトの実行例だけを案内している。公開 URL は書いていない。

## GitHub Pages の公開元

2026-10-11 時点の Pages API（`repos/gurezo/mdn-translation-ja-mcp/pages`）:

| 項目 | 値 |
| --- | --- |
| `html_url` | `https://gurezo.github.io/mdn-translation-ja-mcp/` |
| `build_type` | `legacy` |
| `source.branch` | `main` |
| `source.path` | `/docs` |
| `cname` | なし |
| `https_enforced` | `true` |
| `status` | `built` |

リポジトリに `CNAME` は無い。カスタムドメインは未設定である。公開 URL はすでに `/mdn-translation-ja-mcp/` サブパスである。移行先 `https://gurezo.net/mdn-translation-ja-mcp/` とパスの形は同じである。

Pages 用の GitHub Actions は無い。`.github/workflows/ci.yml` は `main` への push と pull request で `npm ci`、lint、typecheck、`npm run build`、`npm test` を実行する。`docs:build` は走らない。

`devDependencies` に `gh-pages` がある。スクリプトからも workflow からも呼んでいない。`gh-pages` ブランチへの publish は現行の公開経路ではない。

`docs/.nojekyll` は TypeDoc が置く。中身は、GitHub Pages が Jekyll で処理しないための印である。Firebase Hosting では不要だが、ファイルがあっても配信の妨げにはならない。`githubPages: false` にすると再生成時に消える。

## コミット済み生成物

`docs/` は git 管理で、135 ファイルある。`docs:clean` がディレクトリを消すため、本棚卸し以外の手書き文書は置かない。

| パス | ファイル数 | 役割 |
| --- | --- | --- |
| `docs/index.html` | 1 | トップ。README 由来 |
| `docs/modules.html` | 1 | モジュール一覧 |
| `docs/hierarchy.html` | 1 | 継承階層 |
| `docs/.nojekyll` | 1 | Jekyll 無効化 |
| `docs/assets/` | 8 | CSS、JS、`icons.svg` |
| `docs/documents/` | 12 | `projectDocuments` の HTML |
| `docs/functions/` | 41 | 関数ページ |
| `docs/modules/` | 32 | モジュールページ |
| `docs/types/` | 20 | 型ページ |
| `docs/variables/` | 8 | 変数ページ |
| `docs/media/` | 10 | 参照されたリポジトリファイルのコピー |

`docs/assets/` は `style.css`、`highlight.css`、`main.js`、`icons.js`、`icons.svg`、`search.js`、`navigation.js`、`hierarchy.js`。画像ファイルは `icons.svg` だけである。

`docs/media/` は Markdown、JSON、LICENSE、テストファイルである。HTML ではない。

sitemap、`CNAME`、canonical 用の別ファイルは無い。
