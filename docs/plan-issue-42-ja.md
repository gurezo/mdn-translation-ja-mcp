# Issue #42・Wiki に基づく実装整理（日本語）

本書は [Issue #42: front-matter に sourceCommit 反映](https://github.com/gurezo/mdn-translation-ja-mcp/issues/42) と [Wiki: mdn-translation-ja-mcp 開発コンセプト](https://github.com/gurezo/mdn-translation-ja-mcp/wiki/mdn%E2%80%90translation%E2%80%90ja%E2%80%90mcp-%E9%96%8B%E7%99%BA%E3%82%B3%E3%83%B3%E3%82%BB%E3%83%97%E3%83%88) の **`l10n.sourceCommit`**（英語原文の最新コミットハッシュを翻訳 `index.md` に埋め込む／更新する）を、現行コードと突き合わせて一文書にまとめたものです。

Wiki の `/mdn-trans-commit-get` の YAML 例は、取得したハッシュを `l10n.sourceCommit` として載せるイメージです。**ハッシュ取得**は [`mdn_trans_commit_get`](../README.md)、**既存の日本語ファイルへの反映**は [`mdn_trans_source_commit_set`](../README.md)、**新規に `ja` を作るとき**は [`mdn_trans_start`](../README.md) が担当します。

## Issue #42 チェックリスト ↔ 実装

| Issue の項目 | 実装 |
| --- | --- |
| front-matter 更新（`l10n.sourceCommit` の付与） | 新規: [`runMdnTransStart`](../src/start/start.ts) の [`minimizeTranslationIndexMd`](../src/shared/translation-front-matter.ts)。既存: [`runMdnTransSourceCommitSet`](../src/commit-get/source-commit-set.ts) の [`setL10nSourceCommitInTranslationMarkdown`](../src/shared/translation-front-matter.ts) |
| 既存値上書き | 同上: `l10n` をマージしつつ `sourceCommit` を上書き（[`setL10nSourceCommitInTranslationMarkdown`](../src/shared/translation-front-matter.ts)） |
| ハッシュ取得 | 共有の [`getEnUsSourceCommitHash`](../src/shared/mdn-content-source-commit.ts)（`content` 上の `git log`） |

**MCP ツール**: [`mdn_trans_source_commit_set`](../src/index.ts) → [`runMdnTransSourceCommitSet`](../src/commit-get/source-commit-set.ts)。新規翻訳開始は [`mdn_trans_start`](../src/index.ts)。

**依存**: URL → パスは [`resolveMdnPageFromUrl`](../src/shared/mdn-url-resolve.ts)、ワークスペースは [`resolveMdnWorkspacePaths`](../src/shared/workspace.ts)。

## 完了条件

翻訳 `files/ja/.../index.md` の front-matter に **`l10n.sourceCommit` が反映されている**こと。手元では `content` / `translated-content` / 本リポジトリを同階層に置き、`npm test` が通ること、および代表 URL で `runMdnTransSourceCommitSet`（または新規ページなら `runMdnTransStart`）が期待どおり `sourceCommit` を書き込むことを確認する。

## 実機スモーク（参考）

- `npm run build` と `npm test`（Vitest 全件）が成功する
- 既存の `ja` に古い `sourceCommit` がある場合、`mdn_trans_source_commit_set` で英語原文に対応する最新ハッシュへ更新される

## テスト

- [`src/commit-get/source-commit-set.test.ts`](../src/commit-get/source-commit-set.test.ts): 付与、`TRANSLATION_MISSING`、`dry_run`、**既存 `sourceCommit` の上書き**
- [`src/shared/translation-front-matter.test.ts`](../src/shared/translation-front-matter.test.ts): `setL10nSourceCommitInTranslationMarkdown` の front-matter 正規化・マージ
