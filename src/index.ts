/**
 * MDN 日本語翻訳支援 MCP サーバー（stdio）。
 * Cursor 等のクライアントがプロセスとして起動し、stdin/stdout で MCP をやり取りする。
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createMdnTranslationMcpServer } from "./mcp-server-factory.js";

const server = createMdnTranslationMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);
