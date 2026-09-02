import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { createMcpServer } from "../create-mcp-server.js";
import { getLatestCommitHashForPath } from "../git/get-source-commit.js";
import { MCP_TOOL_NAMES } from "../prompts/messages.js";

vi.mock("../git/get-source-commit.js", () => ({
  getLatestCommitHashForPath: vi.fn(),
}));

const SAMPLE_URL =
  "https://developer.mozilla.org/en-US/docs/Glossary/E2E_mcp_tool";
const EN_REL = "files/en-us/glossary/e2e_mcp_tool/index.md";
const JA_REL = "files/ja/glossary/e2e_mcp_tool/index.md";
const SOURCE_COMMIT = "2547f622337d6cbf8c3794776b17ed377d6aad57";

const prevContent = process.env.MDN_CONTENT_ROOT;
const prevTranslated = process.env.MDN_TRANSLATED_CONTENT_ROOT;

async function connectTestClient() {
  const server = createMcpServer();
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "tool-test", version: "0.0.0" });
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  return { client, server };
}

describe("MCP translation tools", () => {
  let client: Client;
  let server: ReturnType<typeof createMcpServer>;
  let parent: string;

  beforeAll(async () => {
    parent = fs.mkdtempSync(path.join(os.tmpdir(), "mdn-tools-mcp-"));
    const contentRoot = path.join(parent, "content");
    const translatedRoot = path.join(parent, "translated-content");
    fs.mkdirSync(path.join(contentRoot, path.dirname(EN_REL)), {
      recursive: true,
    });
    fs.mkdirSync(translatedRoot, { recursive: true });
    fs.writeFileSync(
      path.join(contentRoot, EN_REL),
      '---\ntitle: E2E\n---\n{{glossary("compile")}}\n',
      "utf8",
    );
    process.env.MDN_CONTENT_ROOT = contentRoot;
    process.env.MDN_TRANSLATED_CONTENT_ROOT = translatedRoot;
    vi.mocked(getLatestCommitHashForPath).mockResolvedValue(SOURCE_COMMIT);

    const pair = await connectTestClient();
    client = pair.client;
    server = pair.server;
  });

  afterEach(() => {
    const jaPath = path.join(
      process.env.MDN_TRANSLATED_CONTENT_ROOT ?? "",
      JA_REL,
    );
    if (fs.existsSync(jaPath)) {
      fs.rmSync(jaPath, { force: true });
    }
  });

  afterAll(async () => {
    await client.close();
    await server.close();
    fs.rmSync(parent, { recursive: true, force: true });
    if (prevContent === undefined) {
      delete process.env.MDN_CONTENT_ROOT;
    } else {
      process.env.MDN_CONTENT_ROOT = prevContent;
    }
    if (prevTranslated === undefined) {
      delete process.env.MDN_TRANSLATED_CONTENT_ROOT;
    } else {
      process.env.MDN_TRANSLATED_CONTENT_ROOT = prevTranslated;
    }
  });

  it("tools/list で 4 件を列挙する", async () => {
    const listed = await client.listTools();
    const names = listed.tools.map((t) => t.name).sort();
    expect(names).toEqual([...MCP_TOOL_NAMES].slice().sort());
  });

  it("mdn_trans_start の structuredContent にパスを含む", async () => {
    const result = await client.callTool({
      name: "mdn_trans_start",
      arguments: { url: SAMPLE_URL },
    });
    const sc = result.structuredContent as Record<string, unknown>;
    expect(sc.tool).toBe("mdn_trans_start");
    expect(sc.sourceRel).toBe(EN_REL);
    expect(sc.destRel).toBe(JA_REL);
    expect(String(sc.sourceFile)).toContain("files");
    expect(String(sc.destFile)).toContain("files");
    expect(result.content).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "text" })]),
    );
  });

  it("mdn_trans_commit_get の structuredContent に sourceCommit を含む", async () => {
    await client.callTool({
      name: "mdn_trans_start",
      arguments: { url: SAMPLE_URL, overwrite: true },
    });
    const result = await client.callTool({
      name: "mdn_trans_commit_get",
      arguments: { url: SAMPLE_URL },
    });
    const sc = result.structuredContent as Record<string, unknown>;
    expect(sc.tool).toBe("mdn_trans_commit_get");
    expect(sc.jaFile).toEqual(expect.any(String));
    expect(sc.sourceCommit).toBe(SOURCE_COMMIT);
  });

  it("mdn_trans_replace_glossary の structuredContent に replaced を含む", async () => {
    await client.callTool({
      name: "mdn_trans_start",
      arguments: { url: SAMPLE_URL, overwrite: true },
    });
    const result = await client.callTool({
      name: "mdn_trans_replace_glossary",
      arguments: { jaFile: JA_REL },
    });
    const sc = result.structuredContent as Record<string, unknown>;
    expect(sc.tool).toBe("mdn_trans_replace_glossary");
    expect(sc.replaced).toBe(1);
    expect(sc.skipped).toEqual([]);
    expect(sc.jaFile).toEqual(expect.any(String));
  });

  it("mdn_trans_review の structuredContent に findings を含む", async () => {
    await client.callTool({
      name: "mdn_trans_start",
      arguments: { url: SAMPLE_URL, overwrite: true },
    });
    const result = await client.callTool({
      name: "mdn_trans_review",
      arguments: { jaFile: JA_REL },
    });
    const sc = result.structuredContent as Record<string, unknown>;
    expect(sc.tool).toBe("mdn_trans_review");
    expect(sc.readsFileOnly).toBe(true);
    expect(sc.mustNotModifyReviewedFile).toBe(true);
    expect(sc.jaFile).toEqual(expect.any(String));
    expect(Array.isArray(sc.findings)).toBe(true);
    expect(sc.summaryBySkill).toEqual(expect.any(Object));
  });
});
