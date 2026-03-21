/**
 * MDN 日本語翻訳支援 MCP サーバー（stdio）。
 * Cursor 等のクライアントがプロセスとして起動し、stdin/stdout で MCP をやり取りする。
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { resolveMdnPageFromUrl } from "./mdn-url-resolve.js";
import { TRANSLATION_RULES } from "./translation-rules.js";
import { resolveMdnWorkspacePaths } from "./workspace.js";

const server = new McpServer({
  name: "mdn-translation-ja-mcp",
  version: "1.0.0",
});

server.registerTool(
  "translation_rules",
  {
    title: "Translation guideline links",
    description:
      "日本語 MDN 翻訳向けの表記・L10N・用語集・スプレッドシートへのリンクを返す（旧 HTTP GET /api/rules 相当）。",
    inputSchema: z.object({}),
  },
  async () => ({
    content: [
      {
        type: "text",
        text: JSON.stringify(TRANSLATION_RULES, null, 2),
      },
    ],
  }),
);

server.registerTool(
  "mdn_workspace_paths",
  {
    title: "MDN content / translated-content paths",
    description:
      "ローカルの mdn/content と mdn/translated-content に相当するディレクトリの絶対パスを解決する。推奨は親ディレクトリに content・translated-content・本リポジトリを並べる構成。任意で環境変数 MDN_CONTENT_ROOT / MDN_TRANSLATED_CONTENT_ROOT（両方）で上書き可能。",
    inputSchema: z.object({}),
  },
  async () => {
    const result = await resolveMdnWorkspacePaths();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "mdn_resolve_page_paths",
  {
    title: "Resolve MDN page paths from URL",
    description:
      "MDN のページ URL から locale・正規化 slug、ローカルの英語原文（files/en-us/.../index.md）と日本語（files/ja/.../index.md）の絶対パス、および日本語翻訳ファイルの有無を返す。",
    inputSchema: z.object({
      url: z.url("有効な URL を指定してください。"),
    }),
  },
  async ({ url }) => {
    const result = await resolveMdnPageFromUrl(url.toString());
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
