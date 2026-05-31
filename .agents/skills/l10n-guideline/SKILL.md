---
name: l10n-guideline
description: Applies Mozilla Japan L10N guidelines for natural Japanese translation, UI context-specific phrasing, and metadata. Use when translating MDN pages, adapting English to Japanese, reviewing desu-masu tone, or checking l10n.sourceCommit front matter.
---

# L10N Guideline

## When to use

- 逐語訳を避け自然な日本語に意訳するとき
- UI 要素（ボタン、メニュー、ツールチップ等）の訳語を決めるとき
- です・ます調・英数記号の全角半角を確認するとき
- `l10n.sourceCommit` 等の front-matter を確認するとき

## Quick checklist

- [ ] 英語直訳特有の言い回しを避け、余分な主語を削除
- [ ] です・ます調で統一
- [ ] 「Web」→「ウェブ」
- [ ] UI コンテクスト別表現（体言止め、動詞末尾等）を適用
- [ ] `(` 前は半角空白、`)` 後は半角空白
- [ ] front-matter の L10N メタデータが適切

## Workflow

1. 原文の意図を把握し、逐語訳でない訳案を作成
2. UI 要素の種類を特定し、コンテクスト別ルールを適用
3. [references/l10n-guideline.md](references/l10n-guideline.md) で詳細を確認
4. 表記・用語は editorial-guideline / mozilla-l10n-glossary と併用

## Additional resources

- 詳細: [references/l10n-guideline.md](references/l10n-guideline.md)
- 出典: https://github.com/mozilla-japan/translation/wiki/L10N-Guideline
