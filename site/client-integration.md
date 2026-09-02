---
title: Client Integration
---

# Client Integration

サーバー側の契約はどのクライアントでも同じです（`node dist/index.js` + 環境変数）。設定ファイルの形式だけがクライアント固有です。

接続例の一覧は [examples/](../examples/) です。

## 最小（必須）

MCP サーバーを登録するだけです。`.cursor/rules` や `.cursor/skills` は不要です。

環境変数 `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` は両方指定するか、両方未設定（兄弟ディレクトリ）にしてください。

## Cursor（optional）

Cursor で必要なのは接続設定だけです。

- 手動: [examples/cursor/mcp.example.json](../examples/cursor/mcp.example.json) を `translated-content/.cursor/mcp.json` にコピーし、絶対パスを書き換える
- 一括: `npm run setup:translated-content-cursor`（既定は `mcp.json` のみ）

`translated-content/.cursor/` は手元のローカル設定です。翻訳 PR に含めないでください。

薄い Rule や workflow Skill を足すメリットは [integrations/cursor/README.md](../integrations/cursor/README.md) にあります。基本フローの代替ではありません。

## Claude Code

[examples/mcp/claude-code.mcp.json](../examples/mcp/claude-code.mcp.json) をプロジェクトの `.mcp.json` として使います。

## VS Code

[examples/mcp/vscode.mcp.json](../examples/mcp/vscode.mcp.json) を `.vscode/mcp.json` として使います。

## MCP Inspector

`.cursor` は不要です。ビルド後に GUI で Tools / Resources / Prompts を確認できます。

```bash
npm run build
npm run inspect
```

CLI 手順と検証結果は [architecture/client-verification.md](../architecture/client-verification.md) を参照してください。
