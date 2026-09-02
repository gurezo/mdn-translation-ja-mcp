# MCP 共通の接続例

Cursor 以外の MCP クライアント向けです。`.cursor` は不要です。

サーバー契約は共通です。

- 起動: `node /absolute/path/to/mdn-translation-ja-mcp/dist/index.js`（先に `npm run build`）
- 環境変数: `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` を両方指定するか、両方未設定（兄弟ディレクトリ）

| ファイル | クライアント | 置き場 |
| --- | --- | --- |
| [claude-code.mcp.json](./claude-code.mcp.json) | Claude Code | プロジェクトの `.mcp.json` |
| [vscode.mcp.json](./vscode.mcp.json) | VS Code | `.vscode/mcp.json` |

絶対パスのプレースホルダを実環境のパスに置き換えてください。

## MCP Inspector

設定ファイルは使いません。ビルド後に次で GUI を開けます。

```bash
npm run build
npm run inspect
```

CLI 手順と検証結果は [architecture/client-verification.md](../../architecture/client-verification.md) を参照してください。
