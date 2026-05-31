---
name: mozilla-l10n-glossary
description: Looks up Mozilla L10N glossary terms and {{glossary}} macro usage for MDN Japanese translation. Use when choosing terminology, setting glossary second arguments, or verifying technical term translations.
---

# Mozilla L10N Glossary

## When to use

- 英語技術用語の訳語を決めるとき
- `{{glossary("id", "表示名")}}` の第2引数を設定するとき
- レビューで用語の一貫性を確認するとき

## Workflow

1. 英語用語を [references/glossary-excerpt.md](references/glossary-excerpt.md) で検索
2. 未掲載なら [references/glossary-lookup.md](references/glossary-lookup.md) の手順で Wiki を参照
3. 訳語決定後、`mdn_trans_replace_glossary` で第2引数を補完
4. 用語集にない場合は editorial-guideline / l10n-guideline に従う

## {{glossary}} 形式

```markdown
{{glossary("compile", "Compile (コンパイル)")}}
```

MCP 用語データ: `src/shared/data/glossary-terms.json`

## Additional resources

- 抜粋: [references/glossary-excerpt.md](references/glossary-excerpt.md)
- 確認手順: [references/glossary-lookup.md](references/glossary-lookup.md)
- 出典: https://github.com/mozilla-japan/translation/wiki/Mozilla-L10N-Glossary
