---
name: japanese-style
description: Applies Mozilla Japan Japanese style rules for desu-masu tone, hiragana/kanji usage, and review checklists. Use when reviewing MDN translation voice, checking grammar consistency, or validating style-rules IDs.
---

# Japanese Style

## When to use

- です・ます調の統一を確認するとき
- ひらがな/漢字表記の揺れを確認するとき
- 箇条書き・手順文の文体混在を確認するとき
- 文体レビュー（STYLE_* ルール ID）を実施するとき

## Review rule IDs

| ID | 確認内容 |
| --- | --- |
| STYLE_DESU_MASU_AND_DEARU_MIX | です・ます調とだ・である調の混在 |
| STYLE_KATAKANA_AND_GLOSSARY_CONSISTENCY | カタカナと {{glossary}} 第2引数の整合 |
| STYLE_LIST_AND_PROCEDURE_VOICE | 体言止めとです・ます調の混在 |
| STYLE_L10N_METADATA | l10n.sourceCommit 等のメタデータ |

`mdn_trans_review` は上記を自動検査しない。本スキルで手動確認する。

## Workflow

1. コードフェンス外の本文を対象に文体を確認
2. [references/style-rules.md](references/style-rules.md) の表記統一ルールを適用
3. 表記・用語は editorial-guideline / mozilla-l10n-glossary と併用

## Additional resources

- 詳細: [references/style-rules.md](references/style-rules.md)
- 出典: https://docs.google.com/spreadsheets/d/1y-hC-xMXawCgcYZwJDnvuSlAOTgMRLLyqXurpYkJbYE/edit#gid=0
