---
title: Agent Skills
---

# Agent Skills

`.agents/skills` は人手翻訳・レビュー用のドメイン知識です。MCP サーバーは実行時に `SKILL.md` を読みません。ガイドライン本文は [Resources](./mcp-resources.md) が同じ `references/` を公開します。

標準翻訳フローの正本は [Prompts](./mcp-prompts.md) です。Skills は Cursor などのエージェント向けの **optional** 補助です。

## harvest-review-findings

閉じた [mozilla-japan/translation Issue](https://github.com/mozilla-japan/translation/issues?q=is%3Aissue+state%3Aclosed) と [mdn/translated-content の `l10n-ja` PR](https://github.com/mdn/translated-content/pulls?q=is%3Apr+is%3Aclosed+ja) から人手レビュー指摘を集め、繰り返す慣行だけを `.agents/skills` へ反映します。

### 呼び出し（Cursor）

Agent チャットで次のように指定します。

```text
/harvest-review-findings
```

収集だけ、または反映範囲を絞るときは続けて指示します。

```text
/harvest-review-findings
直近の閉じた l10n-ja PR だけ再収集して、繰り返す指摘があればスキルを更新して。
```

前提は `gh` ログイン済みです。自動 PR、bot、Issue テンプレ、短い承認文は除外します。生の harvest JSON はコミットしません。

### 収集スクリプト

```bash
node .agents/skills/harvest-review-findings/scripts/harvest.mjs \
  --pr-limit=40 --issue-limit=30 \
  --out=/tmp/mdn-review-harvest.json
```

エージェントは出力を読み、繰り返す指摘だけを次へ反映します。

| 指摘の種類 | 反映先 |
| --- | --- |
| 表記 | `editorial-guideline` |
| 意訳・メタデータ・マクロ | `l10n-guideline` |
| 文体・かな漢字 | `japanese-style` |
| 訳語 | `mozilla-l10n-glossary` |

慣行の正本は [review-conventions.md](../.agents/skills/harvest-review-findings/references/review-conventions.md) です。機械検査できるパターンは `src/shared/data/review-rules.json`（`mdn://data/review-rules`）も検討します。

## ガイドライン Skills

人手翻訳・レビュー時にエージェントが参照します。本文は Resources と同じです。

| Skill | 用途 | Resource |
| --- | --- | --- |
| `editorial-guideline` | 表記・約物・長音 | `mdn://guidelines/editorial` |
| `l10n-guideline` | 意訳・UI・`sourceCommit` | `mdn://guidelines/l10n` |
| `japanese-style` | ですます・かな漢字 | `mdn://guidelines/japanese-style` |
| `mozilla-l10n-glossary` | 訳語・`{{glossary}}` | `mdn://glossary` |

翻訳手順そのものは `.cursor/skills/mdn-translation-workflow`（Cursor の Skill ピッカー）か Prompt `mdn_translate` です。
