# Cursor 向け接続例

Cursor で MCP サーバーを登録するための雛形です。Rules / Skills は必須ではありません。

- 手動: [mcp.example.json](./mcp.example.json) を `translated-content/.cursor/mcp.json` にコピーし、絶対パスを書き換える
- 一括: `mdn-translation-ja-mcp` で `npm run setup:translated-content-cursor`（`mcp.json` のみ生成）

`translated-content/.cursor/` は手元のローカル設定です。翻訳 PR に含めないでください。

薄い Rule や workflow Skill を足す場合は [integrations/cursor/](../../integrations/cursor/) を参照してください。
