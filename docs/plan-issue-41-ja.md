# Issue #41・Wiki に基づく実装整理（日本語）

本書は [Issue #41: commit-get 実装](https://github.com/gurezo/mdn-translation-ja-mcp/issues/41) と [Wiki: mdn-translation-ja-mcp 開発コンセプト](https://github.com/gurezo/mdn-translation-ja-mcp/wiki/mdn%E2%80%90translation%E2%80%90ja%E2%80%90mcp-%E9%96%8B%E7%99%BA%E3%82%B3%E3%83%B3%E3%82%BB%E3%83%97%E3%83%88) の **`/mdn-trans-commit-get`**（英語原文に対する最新コミットハッシュ `sourceCommit` の取得）を、現行コードの **`mdn_trans_commit_get`** と突き合わせて一文書にまとめたものです。

Wiki の YAML 例は、取得したハッシュを `l10n.sourceCommit` として書き込むイメージです。**ハッシュ取得**は本ツール、**既存の日本語 `index.md` への反映**は [`mdn_trans_source_commit_set`](../README.md) が担当します。

## Issue #41 チェックリスト ↔ 実装

| Issue の項目 | 実装 |
| --- | --- |
| `git log` 実行 | [`getEnUsSourceCommitHash`](../src/shared/mdn-content-source-commit.ts): `git -C <contentRoot> log -1 --format=%H -- <相対パス>` |
| hash 取得 | 同上: stdout を検証し 40 桁 hex を `sourceCommit`（小文字）として返す |
| エラーハンドリング | 同上: `SOURCE_MISSING`、`NOT_A_GIT_REPOSITORY`、`SOURCE_UNTRACKED`、`PATH_OUTSIDE_CONTENT_ROOT`、`GIT_COMMAND_FAILED` など |

**MCP ツール**: [`mdn_trans_commit_get`](../src/index.ts) → [`runMdnTransCommitGet`](../src/commit-get/commit-get.ts)（Wiki の `/mdn-trans-commit-get` に相当）。

**依存**: URL → パスは [`resolveMdnPageFromUrl`](../src/shared/mdn-url-resolve.ts)、ワークスペースは [`resolveMdnWorkspacePaths`](../src/shared/workspace.ts)。ハッシュ取得ロジックは [`getEnUsSourceCommitHash`](../src/shared/mdn-content-source-commit.ts)（`mdn_trans_start` と共有）。

## 完了条件

「hash が取得できる」こと。手元では `content` / `translated-content` / 本リポジトリを同階層に置き、`npm test` が通ること、および代表 URL で `runMdnTransCommitGet` が `ok: true` と `sourceCommit` を返すことを確認する。

## 実機スモーク（参考）

次を満たすことを確認済みです。

- `npm run build` と `npm test`（Vitest 全件）が成功する
- 実際の `content` と隣接した `packageRoot` で、代表 URL（例: Fetch API）に対し `ok: true`・40 桁の `sourceCommit` が得られる

## テスト

- [`src/commit-get/commit-get.test.ts`](../src/commit-get/commit-get.test.ts): 成功、`NOT_A_GIT_REPOSITORY`、`SOURCE_UNTRACKED`、`SOURCE_MISSING`、`GIT_COMMAND_FAILED`
- [`src/e2e/mdn-translation-flow.e2e.test.ts`](../src/e2e/mdn-translation-flow.e2e.test.ts): start → commit-get を含むフロー
