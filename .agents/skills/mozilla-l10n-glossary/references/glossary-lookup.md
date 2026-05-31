---
sourceUrl: https://github.com/mozilla-japan/translation/wiki/Mozilla-L10N-Glossary
retrievedAt: "2026-05-31"
description: MDN 翻訳で参照する用語カテゴリと確認手順
---

# 用語確認ガイド

## 確認手順

1. 英語原文の用語を特定する
2. [glossary-excerpt.md](glossary-excerpt.md) で抜粋を検索
3. 未掲載の場合は [Mozilla L10N Glossary Wiki](https://github.com/mozilla-japan/translation/wiki/Mozilla-L10N-Glossary) を参照
4. 用語集にない場合は editorial-guideline / l10n-guideline スキルに従い訳語を決定

## MDN で頻出するカテゴリ

### Web 標準・言語

HTML, CSS, JavaScript, DOM, HTTP, HTTPS, API, Web API

### ブラウザ・実行環境

browser（ブラウザー）, compile（コンパイル）, JIT（実行時コンパイル）

### UI・操作

sign in/out → ログイン/ログアウト, widget（ウィジェット）, toolbar（ツールバー）

## 訳語選択基準

- 固有名詞・技術用語として確立されたもの以外は英語表記を避ける
- カタカナ語は広く認知されているもの以外は日本語を優先
- 技術的で分かりにくい用語は説明的・補足的な訳語とする
- MDN では `{{glossary("id", "表示名")}}` で第2引数を明示する

## MCP 連携

- `mdn_trans_replace_glossary`: 1 引数 `{{glossary("id")}}` を用語データに基づき第2引数付きに置換
- 用語データ: `src/shared/data/glossary-terms.json`
