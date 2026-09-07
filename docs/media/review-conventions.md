---
sourceUrl: https://github.com/mdn/translated-content/pulls?q=is%3Apr+is%3Aclosed+label%3Al10n-ja
retrievedAt: "2026-09-08"
title: MDN 日本語翻訳レビュー慣行
---

# MDN 日本語翻訳レビュー慣行

mozilla-japan/translation の閉じた Issue は作業チケットが中心。繰り返し指摘の正本は `mdn/translated-content` の閉じた `l10n-ja` PR レビュー（主に mfuji09）。

| ID | スキル | 指摘 | 出典例 |
| --- | --- | --- | --- |
| CONV_GLOSSARY_TITLE_EN_JA | l10n-guideline | 用語集 `title` は `English (日本語)` | [#38091](https://github.com/mdn/translated-content/pull/38091) |
| CONV_SOURCE_COMMIT | l10n-guideline | `l10n.sourceCommit` に英語版コミットハッシュを入れる | [#38090](https://github.com/mdn/translated-content/pull/38090) |
| CONV_NO_GLOSSARY_SIDEBAR | l10n-guideline | `{{GlossarySidebar}}` は削除（英語版でも廃止） | [#38090](https://github.com/mdn/translated-content/pull/38090) [#38091](https://github.com/mdn/translated-content/pull/38091) |
| CONV_KEEP_SOURCE_WORDS | l10n-guideline | 原文の語句を省略しない。辞書的意味がずれる訳は避ける | [#37943](https://github.com/mdn/translated-content/pull/37943) |
| CONV_TERM_CONSISTENCY | mozilla-l10n-glossary | 既存ページと同じ訳語（例: computed value → 計算値） | [#38090](https://github.com/mdn/translated-content/pull/38090) |
| CONV_KANJI_WHEN_LONG_HIRAGANA | japanese-style | ひらがな連続で読みにくいときは漢字（例: ときには様々な） | [#37943](https://github.com/mdn/translated-content/pull/37943) |
| CONV_GLOSS_PAREN_ONCE | l10n-guideline | 英日併記（`Symbol(シンボル)`）は初出のみ。以降は概念なら日本語、コードなら英語 | [#35270](https://github.com/mdn/translated-content/pull/35270) |
| CONV_TRANSLATE_PARENS | l10n-guideline | タイトルや括弧内の英語展開も訳す | [#33575](https://github.com/mdn/translated-content/pull/33575) |
| CONV_KEEP_EMPHASIS | l10n-guideline | 原文のイタリック等の強調を訳でも維持 | [#34442](https://github.com/mdn/translated-content/pull/34442) |
| CONV_WIKI_CONCEPT_MATCH | l10n-guideline | Wikipedia リンクは概念が一致する言語版を選ぶ。日本語版が別概念なら英語版 | [#35270](https://github.com/mdn/translated-content/pull/35270) |
| CONV_NO_MIDWORD_SPACE | editorial-guideline | 英単語内部に空白を入れない（`HTM L`、`SS R` は不可） | [#32212](https://github.com/mdn/translated-content/pull/32212) |

## 反映ルール

- 同じ趣旨の指摘が複数 PR に出たらスキルへ昇格する
- 1 件だけの文脈依存コメントは conventions に載せない
- harvest 後はこの表と各スキルの checklist / references を同期する
