---
title: MCP Prompts
---

# MCP Prompts

クライアント LLM 向けの標準手順です。サーバー内部では LLM を実行しません。

| Prompt | 引数 | 担う手順 |
| --- | --- | --- |
| `mdn_translate` | `url`（必須） | 翻訳開始 → ガイドライン参照 → 翻訳 → sourceCommit → glossary → レビュー |
| `mdn_sync` | `url`（必須） | 既存訳の `l10n.sourceCommit` 同期 |
| `mdn_review` | `jaFile`（必須） | 機械レビュー呼び出しと人手確認項目 |

`url` は `https://developer.mozilla.org/en-US/docs/...` 形式です。`jaFile` は translated-content 内の絶対パス、または `files/ja/` からの相対パスです。

## 共通の制約

各 Prompt は次を手順本文に含みます。

- 4 Tools は MCP ツールであり、シェルではない
- `mdn_trans_review` は読み取り専用
- ガイドライン本文は Resource を読む（Prompt には複製しない）

## `mdn_translate`

新規翻訳の標準フローです。コピー → sourceCommit → Resources 参照 → クライアント LLM が翻訳 → glossary 置換 → 機械レビュー、の順です。詳細は [Translation Workflow](./translation-workflow.md) です。

## `mdn_sync`

既存の日本語訳に、content の最新コミットを `l10n.sourceCommit` へ反映します。ユーザーが依頼しない限り本文の再翻訳はしません。

## `mdn_review`

`mdn_trans_review` を呼び、結果を報告します。機械では検出しない人手確認項目（意訳の自然さ、識別子の非翻訳、カタカナと glossary の揃い、箇条書きの文体混在）も提示します。対象ファイルは変更しません。
