# Issue #44・Wiki に基づく実装整理（日本語）

本書は [Issue #44: glossary 候補生成](https://github.com/gurezo/mdn-translation-ja-mcp/issues/44) と [Wiki: mdn-translation-ja-mcp 開発コンセプト](https://github.com/gurezo/mdn-translation-ja-mcp/wiki/mdn%E2%80%90translation%E2%80%90ja%E2%80%90mcp-%E9%96%8B%E7%99%BA%E3%82%B3%E3%83%B3%E3%82%BB%E3%83%97%E3%83%88) の **/mdn-trans-replace-glossary** における **`{{glossary}}` 第2引数（表示名）の置換候補**を、現行コードの **`mdn_glossary_replacement_candidates`** / `runMdnGlossaryReplacementCandidates` と突き合わせて一文書にまとめたものです。

## Issue #44 チェックリスト ↔ 実装

| Issue の項目 | 実装 |
| --- | --- |
| term 抽出 | [`runMdnGlossaryMacroScan`](../src/shared/glossary-macro-scan.ts): 日本語 `index.md` 内の `{{glossary("…")}}` / `{{Glossary("…")}}` から第1引数（スラグ）等を取得（[`runMdnGlossaryReplacementCandidates`](../src/replace-glossary/glossary-replacement-candidates.ts) が内部で呼び出し） |
| 用語集参照 | [`loadGlossaryJson`](../src/shared/glossary-loader.ts) / [`lookupSecondArg`](../src/shared/glossary-loader.ts): 同梱の [`glossary-terms.json`](../src/shared/data/glossary-terms.json) または `glossary_path` / `MDN_GLOSSARY_JSON_PATH` |
| 候補生成 | [`matchToCandidate`](../src/replace-glossary/glossary-replacement-candidates.ts)、[`buildSuggestedGlossaryMacro`](../src/replace-glossary/glossary-replacement-candidates.ts): `proposed` / `missing` / `already_set` と `suggestedSecondArg` / `suggestedRaw` |

**MCP ツール**: [`mdn_glossary_replacement_candidates`](../src/index.ts)。

**依存**: URL → パス解決は [`resolveMdnPageFromUrl`](../src/shared/mdn-url-resolve.ts)。ワークスペースは [`resolveMdnWorkspacePaths`](../src/shared/workspace.ts)。

## 上流・下流との関係

- **上流（Issue #43）**: [plan-issue-43-ja.md](./plan-issue-43-ja.md) で整理したとおり、本ツールは **`runMdnGlossaryMacroScan` を再実装せず利用**する。マクロ検出・`TRANSLATION_MISSING` 等は scan と同一経路。
- **下流**: [`mdn_glossary_apply`](../src/replace-glossary/glossary-apply.ts) が、第2引数なしかつ用語集にスラグがあるマクロのみファイルへ安全に反映する。

## 挙動メモ（日本語ファイルが無い場合）

日本語 `index.md` が無いときは **`TRANSLATION_MISSING`**（[`runMdnGlossaryMacroScan`](../src/shared/glossary-macro-scan.ts) 経由）。先に `mdn_trans_start` 等でファイルを用意する。

## 完了条件

「候補が返る」こと。MCP で `mdn_glossary_replacement_candidates` を実行し、対象 URL に日本語ファイルがあり用語集読込に成功するとき `ok: true` と **`candidates`** が得られること。手元では `npm test` が通ること。

## 実機スモーク（参考）

次を満たすことを確認済みです。

- `npm run build` と `npm test`（Vitest 全件）が成功する
- 一時ワークスペース上で `runMdnGlossaryReplacementCandidates` が `proposed` / `missing` / `already_set` を含む `candidates` を返す（[`glossary-replacement-candidates.test.ts`](../src/replace-glossary/glossary-replacement-candidates.test.ts)）

## テスト

- [`src/replace-glossary/glossary-replacement-candidates.test.ts`](../src/replace-glossary/glossary-replacement-candidates.test.ts): 候補の生成、カスタム用語集、第2引数既存、JSON 不正時のエラー
