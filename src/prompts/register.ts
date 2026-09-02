import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod";

import { findTranslationPrompt } from "./catalog.js";
import {
  buildReviewPrompt,
  buildSyncPrompt,
  buildTranslatePrompt,
} from "./messages.js";

function promptMeta(name: string): { title: string; description: string } {
  const entry = findTranslationPrompt(name);
  if (!entry) {
    throw new Error(`未知の Prompt: ${name}`);
  }
  return { title: entry.title, description: entry.description };
}

export function registerTranslationPrompts(server: McpServer): void {
  const translate = promptMeta("mdn_translate");
  server.registerPrompt(
    "mdn_translate",
    {
      title: translate.title,
      description: translate.description,
      argsSchema: {
        url: z
          .string()
          .describe("https://developer.mozilla.org/en-US/docs/... 形式の URL"),
      },
    },
    ({ url }) => buildTranslatePrompt(url),
  );

  const sync = promptMeta("mdn_sync");
  server.registerPrompt(
    "mdn_sync",
    {
      title: sync.title,
      description: sync.description,
      argsSchema: {
        url: z
          .string()
          .describe("https://developer.mozilla.org/en-US/docs/... 形式の URL"),
      },
    },
    ({ url }) => buildSyncPrompt(url),
  );

  const review = promptMeta("mdn_review");
  server.registerPrompt(
    "mdn_review",
    {
      title: review.title,
      description: review.description,
      argsSchema: {
        jaFile: z
          .string()
          .describe(
            "translated-content 内のパス（絶対パス、または files/ja/ からの相対）",
          ),
      },
    },
    ({ jaFile }) => buildReviewPrompt(jaFile),
  );
}
