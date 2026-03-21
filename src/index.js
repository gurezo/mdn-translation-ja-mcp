/**
 * MDN 日本語翻訳支援 MCP サーバー（stdio）。
 * Cursor 等のクライアントがプロセスとして起動し、stdin/stdout で MCP をやり取りする。
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const TRANSLATION_RULES = {
  editorial:
    'https://github.com/mozilla-japan/translation/wiki/Editorial-Guideline',
  l10n: 'https://github.com/mozilla-japan/translation/wiki/L10N-Guideline',
  glossary:
    'https://github.com/mozilla-japan/translation/wiki/Mozilla-L10N-Glossary',
  spreadsheet:
    'https://docs.google.com/spreadsheets/d/1y-hC-xMXawCgcYZwJDnvuSlAOTgMRLLyqXurpYkJbYE/edit#gid=0',
};

const server = new McpServer({
  name: 'mdn-translation-ja-mcp',
  version: '1.0.0',
});

server.registerTool(
  'translation_rules',
  {
    title: 'Translation guideline links',
    description:
      '日本語 MDN 翻訳向けの表記・L10N・用語集・スプレッドシートへのリンクを返す（旧 HTTP GET /api/rules 相当）。',
    inputSchema: z.object({}),
  },
  async () => ({
    content: [
      {
        type: 'text',
        text: JSON.stringify(TRANSLATION_RULES, null, 2),
      },
    ],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
