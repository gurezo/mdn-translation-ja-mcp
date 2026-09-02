---
title: Architecture
---

# Architecture

MCP クライアントはサーバーを登録するだけで、MDN 日本語翻訳に必要な操作と知識へアクセスできます。Cursor Rules / Skills は必須ではありません。

```text
MCP Client（Cursor / Claude / VS Code / other）
    │  stdio または Streamable HTTP
    ▼
mdn-translation-ja-mcp
├─ Tools
├─ Resources
├─ Prompts
└─ shared translation domain
       │
       ├─ content
       └─ translated-content

integrations/cursor/   … optional UX
```

stdio と Streamable HTTP は同じ `createMcpServer()` を使います。トランスポートによる機能差はありません。

## Tools / Resources / Prompts

| 面 | 責務 | 置くもの |
| --- | --- | --- |
| [Tools](./mcp-tools.md) | 決定的な副作用・機械検査 | 既存 4 Tools |
| [Resources](./mcp-resources.md) | クライアントが読む知識（読み取り専用） | ガイドライン本文と機械用 JSON |
| [Prompts](./mcp-prompts.md) | クライアント LLM 向け手順 | `mdn_translate` / `mdn_sync` / `mdn_review` |

自然言語の翻訳はクライアント側の LLM が行います。サーバー内では LLM を実行しません。手順の合成は Prompt が担い、高レベル Tool は追加していません。

## ローカルリポジトリ

MDN 本文はこのリポジトリに含まれません。手元で [mdn/content](https://github.com/mdn/content) と [mdn/translated-content](https://github.com/mdn/translated-content) を fork して clone します。

パス解決:

1. `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` を**両方**指定する
2. どちらも未設定なら、プロセス cwd の親にある `content` / `translated-content`

片方だけの指定はエラーです。

## 設計の詳細

責務境界・互換方針は [architecture/mcp-native.md](../architecture/mcp-native.md) を参照してください。
