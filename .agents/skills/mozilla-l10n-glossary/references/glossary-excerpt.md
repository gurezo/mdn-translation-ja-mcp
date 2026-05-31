---
sourceUrl: https://github.com/mozilla-japan/translation/wiki/Mozilla-L10N-Glossary
retrievedAt: "2026-03-22"
description: MDN 翻訳で頻出する用語の抜粋。{{glossary}} 第2引数は src/shared/data/glossary-terms.json を参照。
---

# Mozilla L10N 用語集（抜粋）

| slug | 英語 | 日本語 | 備考 |
| --- | --- | --- | --- |
| compile | compile | コンパイル | 動詞・名詞とも「コンパイル」 |
| jit | Just-In-Time Compilation (JIT) | 実行時コンパイル (JIT) | 用語集ページの表記に合わせる |
| api | API | API | 頭字語は表記ガイドラインに従い統一 |
| browser | browser | ブラウザ | ユーザーエージェント文脈で頻出 |
| css | CSS | CSS | 言語名としてそのまま |
| dom | DOM | DOM | Document Object Model の略称 |
| html | HTML | HTML | マークアップ言語名 |
| http | HTTP | HTTP | プロトコル名 |
| https | HTTPS | HTTPS | HTTP over TLS の略称 |
| javascript | JavaScript | JavaScript | 言語名 |

## {{glossary}} マクロ

```markdown
{{glossary("compile", "Compile (コンパイル)")}}
```

MCP ツール `mdn_trans_replace_glossary` は `src/shared/data/glossary-terms.json` に基づき第2引数を補完する。
