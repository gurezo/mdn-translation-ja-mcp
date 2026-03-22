# Issue #43・Wiki に基づく実装整理（日本語）

本書は [Issue #43: glossary scan 実装](https://github.com/gurezo/mdn-translation-ja-mcp/issues/43) と [Wiki: mdn-translation-ja-mcp 開発コンセプト](https://github.com/gurezo/mdn-translation-ja-mcp/wiki/mdn%E2%80%90translation%E2%80%90ja%E2%80%90mcp-%E9%96%8B%E7%99%BA%E3%82%B3%E3%83%B3%E3%82%BB%E3%83%97%E3%83%88) の **/mdn-trans-replace-glossary** 前提となる **`{{glossary}}` マクロ検出**を、現行コードの **`mdn_glossary_macro_scan`** / `runMdnGlossaryMacroScan` と突き合わせて一文書にまとめたものです。

## Issue #43 チェックリスト ↔ 実装

| Issue の項目 | 実装 |
| --- | --- |
| macro 検出 | [`scanGlossaryMacrosInText`](../src/shared/glossary-macro-scan.ts): `{{glossary("…")}}` / `{{Glossary("…")}}` を行単位で列挙 |
| 第2引数判定 | 同一ファイルの `GlossaryMacroMatch`: `hasSecondArg`, `secondArg` |
| 行番号取得 | `line`（1 始まり）、`startOffsetInLine`（行内 UTF-16 オフセット） |
| 検出結果の返却 | [`runMdnGlossaryMacroScan`](../src/shared/glossary-macro-scan.ts): URL 解決後に日本語 `index.md` を読み、`matches` 配列で返す |

**MCP ツール**: [`mdn_glossary_macro_scan`](../src/index.ts)（Wiki のコマンド名 `/mdn-trans-replace-glossary` チェーンの先頭に相当する走査）。

**依存**: URL → パス解決は [`resolveMdnPageFromUrl`](../src/shared/mdn-url-resolve.ts)。ワークスペースは [`resolveMdnWorkspacePaths`](../src/shared/workspace.ts)（環境変数で `content` / `translated-content` を指す想定）。

## 下流ツールとの関係

- [`mdn_glossary_replacement_candidates`](../src/replace-glossary/glossary-replacement-candidates.ts) は内部で `runMdnGlossaryMacroScan` を呼び、用語集 JSON に基づく第2引数候補を返す。
- [`mdn_glossary_apply`](../src/replace-glossary/glossary-apply.ts) は候補に従い、第2引数が無いマクロのみ安全に置換する。

## 挙動メモ（日本語ファイルが無い場合）

日本語 `index.md` が無いときは **`TRANSLATION_MISSING`**（[`runMdnGlossaryMacroScan`](../src/shared/glossary-macro-scan.ts)）。先に `mdn_trans_start` 等でファイルを用意する。

## 完了条件

「検出結果が返る」こと。MCP で `mdn_glossary_macro_scan` を実行し、対象 URL に日本語ファイルがあるとき `ok: true` と **`matches`**（行番号・第2引数の有無を含む）が得られること。手元では `npm test` が通ること。

## 実機スモーク（参考）

次を満たすことを確認済みです。

- `npm run build` と `npm test`（Vitest 全件）が成功する
- 一時ワークスペース上で `runMdnGlossaryMacroScan` が `matches` を返し、日本語ファイル欠如時は `TRANSLATION_MISSING` になる（[`glossary-macro-scan.test.ts`](../src/shared/glossary-macro-scan.test.ts)）

## テスト

- [`src/shared/glossary-macro-scan.test.ts`](../src/shared/glossary-macro-scan.test.ts): `scanGlossaryMacrosInText`（行番号・第2引数・エスケープ等）、`runMdnGlossaryMacroScan`、`TRANSLATION_MISSING`
