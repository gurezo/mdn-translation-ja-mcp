# Issue #38・Wiki に基づく実装整理（日本語）

本書は [Issue #38: URL → slug → ファイルパス解決](https://github.com/gurezo/mdn-translation-ja-mcp/issues/38) と [Wiki: mdn-translation-ja-mcp 開発コンセプト](https://github.com/gurezo/mdn-translation-ja-mcp/wiki/mdn%E2%80%90translation%E2%80%90ja%E2%80%90mcp-%E9%96%8B%E7%99%BA%E3%82%B3%E3%83%B3%E3%82%BB%E3%83%97%E3%83%88) の **URL 起点のパス解決**を、現行コードにどう対応させるかを一文書にまとめたものです。

## Issue #38 チェックリスト ↔ 実装

| Issue の項目 | 実装 |
| --- | --- |
| URL パース | [`parseMdnDocsUrl`](../src/shared/mdn-url-resolve.ts) |
| slug 抽出 | `slugSegments` と [`normalizeSlugSegments`](../src/shared/mdn-url-resolve.ts) |
| content path 解決 | [`buildContentPaths`](../src/shared/mdn-url-resolve.ts) の `enUsIndexPath`（`content/files/en-us/.../index.md`） |
| translated path 解決 | 同 `jaIndexPath`（`translated-content/files/ja/.../index.md`） |
| 既存ファイル判定 | [`resolveMdnPageFromUrl`](../src/shared/mdn-url-resolve.ts) の `sourceExists`（英語原文）・`translationExists`（日本語） |

**MCP ツール**: [`mdn_resolve_page_paths`](../src/index.ts) が上記を JSON で返す。

**Wiki の翻訳フロー**（`/mdn-trans-start` 相当の `mdn_trans_start` など）は、すべてこの解決結果に依存する。

## 完了条件

「正しいファイルパスが返る」ことに加え、ローカルに実体があるかは `sourceExists` / `translationExists` で判別できる。

## テスト

[`src/shared/mdn-url-resolve.test.ts`](../src/shared/mdn-url-resolve.test.ts) を参照。
