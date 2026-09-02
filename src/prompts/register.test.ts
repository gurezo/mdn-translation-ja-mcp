import fs from "node:fs";

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
import { MCP_SERVER_INSTRUCTIONS } from "../mcp-server-instructions.js";
import { TRANSLATION_PROMPTS } from "./catalog.js";
import { MCP_TOOL_NAMES, TRANSLATION_RESOURCE_URIS } from "./messages.js";

const SAMPLE_URL = "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API";
const SAMPLE_JA_FILE = "files/ja/web/api/fetch_api/index.md";
const CURSOR_PATH_RE = /(^|[/\\])\.cursor([/\\]|$)/;

async function connectTestClient() {
  const server = createMcpServer();
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "prompt-test", version: "0.0.0" });
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  return { client, server };
}

function promptText(result: Awaited<ReturnType<Client["getPrompt"]>>): string {
  return result.messages
    .map((m) => ("text" in m.content ? m.content.text : ""))
    .join("\n");
}

describe("MCP translation prompts", () => {
  let client: Client;
  let server: ReturnType<typeof createMcpServer>;
  const writeSpy = vi.spyOn(fs, "writeFileSync");

  beforeAll(async () => {
    const pair = await connectTestClient();
    client = pair.client;
    server = pair.server;
  });

  afterEach(() => {
    writeSpy.mockClear();
  });

  afterAll(async () => {
    writeSpy.mockRestore();
    await client.close();
    await server.close();
  });

  it("prompts/list で 3 件を列挙する", async () => {
    const listed = await client.listPrompts();
    const names = listed.prompts.map((p) => p.name).sort();
    expect(names).toEqual(
      TRANSLATION_PROMPTS.map((p) => p.name)
        .slice()
        .sort(),
    );
    expect(names).toEqual(["mdn_review", "mdn_sync", "mdn_translate"]);
  });

  it("list の title / description / 必須引数がカタログと一致する", async () => {
    const listed = await client.listPrompts();
    const byName = new Map(listed.prompts.map((p) => [p.name, p]));

    for (const entry of TRANSLATION_PROMPTS) {
      const listedEntry = byName.get(entry.name);
      expect(listedEntry?.title).toBe(entry.title);
      expect(listedEntry?.description).toBe(entry.description);
      const argNames = (listedEntry?.arguments ?? []).map((a) => a.name);
      expect(argNames).toEqual(entry.args.map((a) => a.name));
      for (const arg of listedEntry?.arguments ?? []) {
        expect(arg.required).toBe(true);
      }
    }
  });

  it("prompts/get で引数が本文に埋め込まれる", async () => {
    const translate = await client.getPrompt({
      name: "mdn_translate",
      arguments: { url: SAMPLE_URL },
    });
    expect(promptText(translate)).toContain(SAMPLE_URL);

    const sync = await client.getPrompt({
      name: "mdn_sync",
      arguments: { url: SAMPLE_URL },
    });
    expect(promptText(sync)).toContain(SAMPLE_URL);

    const review = await client.getPrompt({
      name: "mdn_review",
      arguments: { jaFile: SAMPLE_JA_FILE },
    });
    expect(promptText(review)).toContain(SAMPLE_JA_FILE);
  });

  it("各 Prompt 本文に Tool 名と Resource URI が含まれる", async () => {
    const bodies = [
      promptText(
        await client.getPrompt({
          name: "mdn_translate",
          arguments: { url: SAMPLE_URL },
        }),
      ),
      promptText(
        await client.getPrompt({
          name: "mdn_sync",
          arguments: { url: SAMPLE_URL },
        }),
      ),
      promptText(
        await client.getPrompt({
          name: "mdn_review",
          arguments: { jaFile: SAMPLE_JA_FILE },
        }),
      ),
    ];

    for (const body of bodies) {
      for (const tool of MCP_TOOL_NAMES) {
        expect(body).toContain(tool);
      }
      for (const uri of TRANSLATION_RESOURCE_URIS) {
        expect(body).toContain(uri);
      }
    }
  });

  it("Prompt 本文とサーバー指示に .cursor パスを含まない", async () => {
    const bodies = [
      MCP_SERVER_INSTRUCTIONS,
      promptText(
        await client.getPrompt({
          name: "mdn_translate",
          arguments: { url: SAMPLE_URL },
        }),
      ),
      promptText(
        await client.getPrompt({
          name: "mdn_sync",
          arguments: { url: SAMPLE_URL },
        }),
      ),
      promptText(
        await client.getPrompt({
          name: "mdn_review",
          arguments: { jaFile: SAMPLE_JA_FILE },
        }),
      ),
    ];

    for (const body of bodies) {
      expect(body).not.toMatch(CURSOR_PATH_RE);
      expect(body).not.toContain(".cursor/");
    }
  });

  it("サーバー指示は Prompt 名へ誘導し Cursor Skill を参照しない", () => {
    expect(MCP_SERVER_INSTRUCTIONS).toContain("mdn_translate");
    expect(MCP_SERVER_INSTRUCTIONS).toContain("mdn_sync");
    expect(MCP_SERVER_INSTRUCTIONS).toContain("mdn_review");
    expect(MCP_SERVER_INSTRUCTIONS).not.toContain("mdn-translation-workflow");
  });

  it("prompts/get はファイルへ書き込まず messages だけ返す", async () => {
    writeSpy.mockClear();
    const result = await client.getPrompt({
      name: "mdn_translate",
      arguments: { url: SAMPLE_URL },
    });
    expect(writeSpy).not.toHaveBeenCalled();
    expect(result.messages.length).toBe(1);
    expect(result.messages[0]?.role).toBe("user");
    const content = result.messages[0]?.content;
    expect(content && "type" in content && content.type).toBe("text");
  });
});
