# Issue #47・Wiki に基づく実装整理（日本語）

本書は [Issue #47: review 実装（v1）](https://github.com/gurezo/mdn-translation-ja-mcp/issues/47) と [Wiki: mdn-translation-ja-mcp 開発コンセプト](https://github.com/gurezo/mdn-translation-ja-mcp/wiki/mdn%E2%80%90translation%E2%80%90ja%E2%80%90mcp-%E9%96%8B%E7%99%BA%E3%82%B3%E3%83%B3%E3%82%BB%E3%83%97%E3%83%88) の **/mdn-trans-review** に相当する **`review_translation`** を、現行コードと突き合わせて一文書にまとめたものです。

## Issue #47 チェックリスト ↔ 実装

| Issue の観点 | 実装 |
| --- | --- |
| front-matter | [`checkFrontMatter`](../src/review/review-translation.ts): 欠落、`title`、`l10n.sourceCommit`、レガシー `page-type` 等 |
| 未翻訳 | `checkUntranslated`: 本文での英語連続の簡易検出（コードフェンス外） |
| glossary | `checkGlossary` + [`scanGlossaryMacrosInText`](../src/shared/glossary-macro-scan.ts): 第2引数推奨・用語集 JSON 未登録スラグ等 |
| 文体 | `checkStyle`（[`rules/style-rules.json`](../rules/style-rules.json) ベース）: です・ます／であるの混在など |

**追加カテゴリ**: `prohibited`（[`rules/prohibited-expressions.json`](../rules/prohibited-expressions.json)）は Issue 本文に明示されていないが、v1 で同梱されている。

**MCP ツール**: [`review_translation`](../src/index.ts)（Wiki のコマンド名 `/mdn-trans-review` に相当）。入力は MDN ページ URL と任意の `glossary_path`。

**出力**: 成功時は `ok: true` と **`findings`**（`severity` / `category` / `code` / `message`、行・スニペット）。ガイドラインリンク等は `rules` メタに含まれる。

**依存**: URL → パス解決は [`resolveMdnPageFromUrl`](../src/shared/mdn-url-resolve.ts)。用語集は [`loadGlossaryJson`](../src/shared/glossary-loader.ts)（`MDN_GLOSSARY_JSON_PATH` または同梱 `data/glossary-terms.json`）。ローカルルールは [`loadLocalReviewRules`](../src/review/local-review-rules.ts)。

## 完了条件

「問題一覧が返る」こと。MCP で `review_translation` を実行し、日本語 `index.md` が存在する URL では **`ok: true` かつ `findings` が配列**（問題が無ければ空配列）であること。手元では `npm run build` と `npm test` が通ること。

## テスト

- [`src/review/review-translation.test.ts`](../src/review/review-translation.test.ts): `reviewTranslationMarkdown` による front-matter・未翻訳・glossary・文体・禁止表現
- [`src/e2e/mdn-translation-flow.e2e.test.ts`](../src/e2e/mdn-translation-flow.e2e.test.ts): `runReviewTranslation` が `findings` を返すフロー

## 日本語ファイルが無い場合

日本語 `index.md` が無いときは **`TRANSLATION_MISSING`**（[`runReviewTranslation`](../src/review/review-translation.ts)）。先に `mdn_trans_start` 等でファイルを用意する。
