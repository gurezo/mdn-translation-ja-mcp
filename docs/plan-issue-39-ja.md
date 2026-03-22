# Issue #39・Wiki に基づく実装整理（日本語）

本書は [Issue #39: start 実装（翻訳開始）](https://github.com/gurezo/mdn-translation-ja-mcp/issues/39) と [Wiki: mdn-translation-ja-mcp 開発コンセプト](https://github.com/gurezo/mdn-translation-ja-mcp/wiki/mdn%E2%80%90translation%E2%80%90ja%E2%80%90mcp-%E9%96%8B%E7%99%BA%E3%82%B3%E3%83%B3%E3%82%BB%E3%83%97%E3%83%88) の **/mdn-trans-start**（英語原文のコピーと `translated-content/files/ja` への配置）を、現行コードの **`mdn_trans_start`** と突き合わせて一文書にまとめたものです。

## Issue #39 チェックリスト ↔ 実装

| Issue の項目 | 実装 |
| --- | --- |
| 原文コピー | [`runMdnTransStart`](../src/start/start.ts): `enUsIndexPath` を読み、[translation-front-matter](../src/shared/translation-front-matter.ts) で最小化した本文を `jaIndexPath` に書き込み |
| ディレクトリ生成 | `fs.mkdir(..., { recursive: true })`、結果の `createdDirectories` |
| 上書き防止 | 既存の日本語 `index.md` があり `force` でないとき **`TRANSLATION_EXISTS`**（[`start.ts` の該当箇所](../src/start/start.ts)） |
| dry-run | `dryRun: true` のときファイル操作なし。予定パス・`sourceCommit` 等を返す |
| force | `force: true` で既存日本語を上書き可能 |

**MCP ツール**: [`mdn_trans_start`](../src/index.ts)（Wiki のコマンド名 `/mdn-trans-start` に相当）。

**依存**: URL → パス解決は Issue #38 系の [`resolveMdnPageFromUrl`](../src/shared/mdn-url-resolve.ts)。ワークスペースは [`resolveMdnWorkspacePaths`](../src/shared/workspace.ts)。

## 挙動メモ（既存翻訳があるページ）

日本語 `index.md` が既にある場合、`dry_run: true` でも **`TRANSLATION_EXISTS`** になります（上書き防止が先に評価されるため）。プレビューや上書きを試すときは **`force: true`** を併用してください。

## 完了条件

「URL から翻訳ファイルを生成できる」こと。手元では `content` / `translated-content` / 本リポジトリを同階層に置き、`npm test` が通ること、および代表 URL で `runMdnTransStart` が期待どおり返ることを確認する。

## 実機スモーク（参考）

次を満たすことを確認済みです。

- `npm run build` と `npm test`（Vitest 全件）が成功する
- 実際の `content`・`translated-content` と隣接した `packageRoot` で、`dryRun: true` かつ `force: true` のときに `ok: true`・`sourceCommit` が得られる（既に日本語があるページの例）

## テスト

- [`src/start/start.test.ts`](../src/start/start.test.ts): コピー、`TRANSLATION_EXISTS`、`force`、`dry_run`、`SOURCE_MISSING`
- [`src/e2e/mdn-translation-flow.e2e.test.ts`](../src/e2e/mdn-translation-flow.e2e.test.ts): start を含むフロー
