# Issue #45・Wiki に基づく実装整理（日本語）

本書は [Issue #45: glossary apply 実装](https://github.com/gurezo/mdn-translation-ja-mcp/issues/45) と [Wiki: mdn-translation-ja-mcp 開発コンセプト](https://github.com/gurezo/mdn-translation-ja-mcp/wiki/mdn%E2%80%90translation%E2%80%90ja%E2%80%90mcp-%E9%96%8B%E7%99%BA%E3%82%B3%E3%83%B3%E3%82%BB%E3%83%97%E3%83%88) の **/mdn-trans-replace-glossary** における **`{{glossary}}` 第2引数の安全なファイル反映**を、現行コードの **`mdn_glossary_apply`** / `runMdnGlossaryApply` と突き合わせて一文書にまとめたものです。

## Issue #45 チェックリスト ↔ 実装

| Issue の項目 | 実装 |
| --- | --- |
| 第2引数なしのみ対象 | [`runMdnGlossaryReplacementCandidates`](../src/replace-glossary/glossary-replacement-candidates.ts) の `status: "proposed"` のみが適用対象。[`runMdnGlossaryApply`](../src/replace-glossary/glossary-apply.ts) は `applyProposedToLines` で `proposed` のみ置換。`already_set` / `missing` は [`skippedCount`](../src/replace-glossary/glossary-apply.ts) に集計され、テキストは変更しない。 |
| dry-run | `dryRun: true` のときファイルへ書き込まず、`applied` と `skippedCount` のみ返す（[`glossary-apply.ts`](../src/replace-glossary/glossary-apply.ts)）。MCP ツール [`mdn_glossary_apply`](../src/index.ts) の `dry_run`。 |
| 安全に置換 | 書き込み前に候補を **2回** 計算し、`proposed` のスナップショットが一致しなければ `FILE_CHANGED` で失敗（[`compareProposedSnapshots`](../src/replace-glossary/glossary-apply.ts)）。読み込んだ行と `raw` が一致しなければ `APPLY_MISMATCH`。 |

**MCP ツール**: [`mdn_glossary_apply`](../src/index.ts)。

**依存**: 候補生成は [`runMdnGlossaryReplacementCandidates`](../src/replace-glossary/glossary-replacement-candidates.ts)（上流の [`plan-issue-44-ja.md`](./plan-issue-44-ja.md) と同じ）。URL・ワークスペース解決も同様。

## 上流・下流との関係

- **上流（Issue #44）**: `mdn_glossary_replacement_candidates` で `proposed` / `missing` / `already_set` を確認してから、本ツールで反映する想定。
- **Wiki**: `/mdn-trans-replace-glossary` の「`{{glossary("compile")}}` → `{{glossary("compile", "Compile (コンパイル)")}}`」に相当。

## 挙動メモ（日本語ファイルが無い場合）

日本語 `index.md` が無いときは **`TRANSLATION_MISSING`**（候補生成と同一経路）。先に `mdn_trans_start` 等でファイルを用意する。

## 完了条件

- **第2引数なしのみ**がファイルに反映され、既存の第2引数・用語集に無いスラグは変更されないこと。
- **`dry_run: true`** でディスクが変わらないこと。
- **安全**: 候補の二重チェックまたは行内容一致に失敗したときは書き込まないこと。

手元では `npm test`（[`glossary-apply.test.ts`](../src/replace-glossary/glossary-apply.test.ts)、[`glossary-apply.errors.test.ts`](../src/replace-glossary/glossary-apply.errors.test.ts)）が通ること。

## テスト

- [`src/replace-glossary/glossary-apply.test.ts`](../src/replace-glossary/glossary-apply.test.ts): dry_run、混在マクロ、同一行複数、変更なし
- [`src/replace-glossary/glossary-apply.errors.test.ts`](../src/replace-glossary/glossary-apply.errors.test.ts): `FILE_CHANGED`、`APPLY_MISMATCH`
