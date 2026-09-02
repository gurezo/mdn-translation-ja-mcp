import fs from "node:fs";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createMcpServer } from "../create-mcp-server.js";
import {
  getGlossaryTermsPath,
  getProhibitedExpressionsPath,
  getReviewRulesPath,
} from "../shared/paths.js";
import { GUIDELINE_RESOURCES } from "./catalog.js";

const EXPECTED_URIS = GUIDELINE_RESOURCES.map((r) => r.uri);

async function connectTestClient() {
  const server = createMcpServer();
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "resource-test", version: "0.0.0" });
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  return { client, server };
}

describe("MCP guideline resources", () => {
  let client: Client;
  let server: ReturnType<typeof createMcpServer>;

  beforeAll(async () => {
    const pair = await connectTestClient();
    client = pair.client;
    server = pair.server;
  });

  afterAll(async () => {
    await client.close();
    await server.close();
  });

  it("resources/list で 7 URI を列挙する", async () => {
    const listed = await client.listResources();
    const uris = listed.resources.map((r) => r.uri);
    expect(uris.sort()).toEqual([...EXPECTED_URIS].sort());
  });

  it("各 Resource を取得でき、mimeType がカタログと一致する", async () => {
    const listed = await client.listResources();
    const listedByUri = new Map(listed.resources.map((r) => [r.uri, r]));

    for (const entry of GUIDELINE_RESOURCES) {
      const listedEntry = listedByUri.get(entry.uri);
      expect(listedEntry?.mimeType).toBe(entry.mimeType);

      const read = await client.readResource({ uri: entry.uri });
      expect(read.contents.length).toBeGreaterThan(0);
      for (const content of read.contents) {
        expect("text" in content && content.text.length > 0).toBe(true);
        expect(content.mimeType).toBe(entry.mimeType);
      }
    }
  });

  it("機械用 JSON Resource は Tools と同じファイル本文である", async () => {
    const cases = [
      {
        uri: "mdn://data/review-rules",
        filePath: getReviewRulesPath(),
      },
      {
        uri: "mdn://data/prohibited-expressions",
        filePath: getProhibitedExpressionsPath(),
      },
      {
        uri: "mdn://data/glossary-terms",
        filePath: getGlossaryTermsPath(),
      },
    ];

    for (const { uri, filePath } of cases) {
      const read = await client.readResource({ uri });
      expect(read.contents).toHaveLength(1);
      const content = read.contents[0];
      expect("text" in content ? content.text : undefined).toBe(
        fs.readFileSync(filePath, "utf8"),
      );
    }
  });

  it("ガイドライン Markdown Resource は .agents/skills の references と一致する", async () => {
    for (const entry of GUIDELINE_RESOURCES.filter(
      (r) => r.mimeType === "text/markdown",
    )) {
      const read = await client.readResource({ uri: entry.uri });
      const fileTexts = entry
        .getFilePaths()
        .map((p) => fs.readFileSync(p, "utf8"));
      const resourceTexts = read.contents.map((c) =>
        "text" in c ? c.text : "",
      );
      expect(resourceTexts).toEqual(fileTexts);
    }
  });

  it("読み取り対象に .cursor パスを含まない", () => {
    const allPaths = GUIDELINE_RESOURCES.flatMap((r) => r.getFilePaths());
    expect(allPaths.length).toBeGreaterThan(0);
    for (const filePath of allPaths) {
      expect(filePath).not.toMatch(/(^|[/\\])\.cursor([/\\]|$)/);
    }
  });
});
