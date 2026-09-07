---
name: harvest-review-findings
description: Collects closed mozilla-japan/translation issues and mdn/translated-content l10n-ja PR review comments, then updates .agents/skills from recurring findings. Use when harvesting review comments, syncing translation skills from GitHub reviews, or the user mentions mozilla-japan issues / translated-content JA PR reviews.
---

# Harvest Review Findings

閉じた翻訳 Issue と JA PR の人手レビュー指摘を集め、`.agents/skills` のチェックリストと references に反映する。

## When to use

- mozilla-japan/translation の閉じた Issue を解析するとき
- mdn/translated-content の閉じた `l10n-ja` PR レビュー指摘を収集するとき
- レビュー慣行を `.agents/skills` に取り込むとき

## Utility scripts

**実行する**（読むだけではない）:

```bash
node .agents/skills/harvest-review-findings/scripts/harvest.mjs \
  --pr-limit=40 --issue-limit=30 \
  --out=/tmp/mdn-review-harvest.json
```

`gh` がログイン済みであること。自動 PR（`automated pr`）、bot、プレビュー URL、Issue テンプレ、作者の `feat:` 作業ログ、短い承認・クローズ文は除外する。

## Workflow

1. 上記スクリプトを実行し、`/tmp/mdn-review-harvest.json` と `.md` を読む
2. `clusters` をスキルごとに読み、[references/review-conventions.md](references/review-conventions.md) と照合する
3. **繰り返す指摘**だけを対象スキルへ反映する（1件だけの文脈依存指摘は入れない）
4. 反映先:
   - 表記 → `editorial-guideline`
   - 意訳・メタデータ・マクロ → `l10n-guideline`
   - 文体・かな漢字 → `japanese-style`
   - 訳語 → `mozilla-l10n-glossary`
5. SKILL.md の Quick checklist と `references/` の両方を更新する。機械検査できるパターンは `src/shared/data/review-rules.json` も検討する
6. 出典は PR/Issue URL を `sourceRef` または conventions 表に残す
7. 生の harvest JSON はコミットしない

## Do not

- Issue 本文の翻訳作業チケットをガイドラインにコピーしない
- 承認だけ（「OKです」）を指摘として扱わない
- ユーザーが依頼するまで対象 `index.md` を編集しない

## Additional resources

- 慣行の正本: [references/review-conventions.md](references/review-conventions.md)
- 収集対象: https://github.com/mozilla-japan/translation/issues?q=is%3Aissue+state%3Aclosed
- 収集対象: https://github.com/mdn/translated-content/pulls?q=is%3Apr+is%3Aclosed+ja
