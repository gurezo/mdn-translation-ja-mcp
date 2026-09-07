---
title: MCP Resources
---

# MCP Resources

クライアントが読む翻訳知識です。読み取り専用で、ファイルへの書き込みはしません。ガイドライン本文の正本は `.agents/skills/*/references/`、機械用 JSON は `src/shared/data/` です。Tools と Resource は同じファイルを読みます。

| URI | 内容 | MIME |
| --- | --- | --- |
| `mdn://guidelines/editorial` | 表記・約物・単位・カタカナ長音 | `text/markdown` |
| `mdn://guidelines/l10n` | 意訳・UI 表現・ですます調 | `text/markdown` |
| `mdn://guidelines/japanese-style` | 文体・ひらがな/漢字 | `text/markdown` |
| `mdn://glossary` | 用語抜粋と Wiki 参照手順 | `text/markdown` |
| `mdn://data/glossary-terms` | 機械用 glossary（`mdn_trans_replace_glossary` と同一） | `application/json` |
| `mdn://data/review-rules` | 機械チェックルール（`mdn_trans_review` と同一） | `application/json` |
| `mdn://data/prohibited-expressions` | 禁止・注意表現（`mdn_trans_review` と同一） | `application/json` |

人手翻訳ではガイドライン 4 本（`mdn://guidelines/*` と `mdn://glossary`）を読んでください。`.agents/skills` をワークスペースへコピーする必要はありません。

Skill の `SKILL.md`（When to use / checklist）は Resource ではありません。手順は [Prompts](./mcp-prompts.md) にあります。ガイドライン `references/` の更新手順は [Agent Skills](./agent-skills.md) の `harvest-review-findings` です。
