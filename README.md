# MDN Web Docs 日本語翻訳 MCP サーバー

このプロジェクトは、MDN Web Docs の日本語翻訳のための MCP サーバーを提供します。

## セットアップ

1. 依存関係のインストール:

```bash
npm install
```

2. サーバーの起動:

```bash
npm start
```

開発モードで起動する場合:

```bash
npm run dev
```

## エンドポイント

### GET /api/rules

翻訳に関するルールとガイドラインのリンクを取得します。

### POST /api/validate

翻訳テキストの検証を行います。

リクエストボディ:

```json
{
  "text": "検証するテキスト"
}
```

レスポンス:

```json
{
  "isValid": true,
  "issues": []
}
```

### GET /api/events

Server-Sent Events (SSE) エンドポイント。リアルタイムな更新を受け取ります。

## Cursor 設定

Cursor の設定に以下の設定を追加してください：

```json
"mdn-wdb-doc-ja-mcp": {
  "url": "http://localhost:3000",
  "endpoints": {
    "events": "/api/events",
    "rules": "/api/rules",
    "validate": "/api/validate"
  }
}
```
