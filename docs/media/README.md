# Examples

MCP サーバーの接続設定例です。クライアント固有の形式だけが異なります。サーバー側の契約は同じです（`node dist/index.js` と `MDN_CONTENT_ROOT` / `MDN_TRANSLATED_CONTENT_ROOT`）。

| ディレクトリ | 対象 | 内容 |
| --- | --- | --- |
| [mcp/](./mcp/) | MCP 共通 | Claude Code、VS Code、MCP Inspector |
| [cursor/](./cursor/) | Cursor 固有 | `translated-content/.cursor/mcp.json` の雛形 |

Cursor の薄い Rule / Skill は接続例ではなく optional integration です。[integrations/cursor/](../integrations/cursor/) を参照してください。
