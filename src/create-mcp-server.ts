import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod";

import { MCP_SERVER_INSTRUCTIONS } from "./mcp-server-instructions.js";
import { resolveWorkspaceRoots } from "./shared/workspace.js";
import { mdnTransStart } from "./tools/trans-start.js";
import { mdnTransCommitGet } from "./tools/commit-get.js";
import { mdnTransReplaceGlossary } from "./tools/replace-glossary.js";
import { mdnTransReview } from "./tools/review.js";

function toolText(body: string) {
  return {
    content: [{ type: "text" as const, text: body }],
  };
}

/** mdn_trans_review 専用: 読み取り専用であることをクライアントとエージェントの両方に伝える */
function toolReviewResult(body: string) {
  return {
    content: [{ type: "text" as const, text: body }],
    structuredContent: {
      tool: "mdn_trans_review",
      readsFileOnly: true,
      mustNotModifyReviewedFile: true,
    },
  };
}

export function createMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: "mdn-translation-ja-mcp",
      version: "1.0.0",
    },
    {
      instructions: MCP_SERVER_INSTRUCTIONS,
      capabilities: {},
    },
  );

  server.registerTool(
    "mdn_trans_start",
    {
      title: "翻訳開始（原文コピーのみ）",
      description:
        "Wiki 定義: content の files/en-us/<category>/<slug...>/index.md を、同じ階層の translated-content 側 files/ja/<category>/<slug...>/index.md にコピーするのみ（URL 側の /docs/ セグメントはファイルパスには現れない）。翻訳・_redirects・他ファイル編集は行わない。",
      inputSchema: {
        url: z
          .string()
          .describe("https://developer.mozilla.org/en-US/docs/... 形式の URL"),
        overwrite: z
          .boolean()
          .optional()
          .describe("true のとき、既存の翻訳ファイルを上書きします"),
      },
    },
    async ({ url, overwrite }) => {
      const roots = resolveWorkspaceRoots();
      const r = mdnTransStart(roots, { url, overwrite });
      return toolText(r.message);
    },
  );

  server.registerTool(
    "mdn_trans_commit_get",
    {
      title: "sourceCommit の取得と反映",
      description:
        "content リポジトリで該当原文の最新コミットを取得し、翻訳ファイルのフロントマターに l10n.sourceCommit を書き込みます。",
      inputSchema: {
        url: z
          .string()
          .describe("https://developer.mozilla.org/en-US/docs/... 形式の URL"),
      },
    },
    async ({ url }) => {
      const roots = resolveWorkspaceRoots();
      const r = await mdnTransCommitGet(roots, { url });
      return toolText(r.message);
    },
  );

  server.registerTool(
    "mdn_trans_replace_glossary",
    {
      title: "glossary マクロの第2引数補完",
      description:
        '指定した翻訳ファイル内の {{glossary("id")}} を、用語データに基づき {{glossary("id", "表示")}} に置換します。',
      inputSchema: {
        jaFile: z
          .string()
          .describe(
            "translated-content 内のパス（絶対パス、または files/ja/ からの相対）",
          ),
      },
    },
    async ({ jaFile }) => {
      const roots = resolveWorkspaceRoots();
      const r = mdnTransReplaceGlossary(roots, { jaFile });
      const skipped =
        r.skipped.length > 0
          ? `\n未置換（用語未定義）: ${r.skipped.join(", ")}`
          : "";
      return toolText(`${r.message}${skipped}`);
    },
  );

  server.registerTool(
    "mdn_trans_review",
    {
      title: "翻訳の簡易レビュー（読み取りのみ）",
      description:
        "禁止・注意表現リスト等に基づき、翻訳ファイルを読み取って機械的にチェックします。サーバーは対象ファイルへ一切書き込みません（readOnlyHint）。エージェントはこのツール呼び出しの前後を問わず、レビュー結果を理由に当該ファイルを編集・整形・追記してはならない。ユーザーが「修正して」等と明示した場合のみ編集してよい。",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
      inputSchema: {
        jaFile: z
          .string()
          .describe(
            "読み取り対象。translated-content 内のパス（絶対パス、または files/ja/ からの相対）。このファイルは変更しない。",
          ),
      },
    },
    async ({ jaFile }) => {
      const roots = resolveWorkspaceRoots();
      const r = mdnTransReview(roots, { jaFile });
      return toolReviewResult(r.message);
    },
  );

  return server;
}
