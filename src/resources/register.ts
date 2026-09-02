import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { GUIDELINE_RESOURCES } from "./catalog.js";
import { readGuidelineResource } from "./read.js";

export function registerGuidelineResources(server: McpServer): void {
  for (const entry of GUIDELINE_RESOURCES) {
    server.registerResource(
      entry.name,
      entry.uri,
      {
        title: entry.title,
        description: entry.description,
        mimeType: entry.mimeType,
      },
      async (uri) => ({
        contents: readGuidelineResource(uri).map((c) => ({
          uri: c.uri,
          mimeType: c.mimeType,
          text: c.text,
        })),
      }),
    );
  }
}
