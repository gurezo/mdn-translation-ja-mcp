import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { TRANSLATION_PROMPTS } from "./prompts/catalog.js";
import { MCP_TOOL_NAMES } from "./prompts/messages.js";
import { GUIDELINE_RESOURCES } from "./resources/catalog.js";

const execFileAsync = promisify(execFile);

const DIST_INDEX = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "dist",
  "index.js",
);

const SAMPLE_URL =
  "https://developer.mozilla.org/en-US/docs/Glossary/E2E_stdio";
const EN_REL = "files/en-us/glossary/e2e_stdio/index.md";
const JA_REL = "files/ja/glossary/e2e_stdio/index.md";
const CURSOR_PATH_RE = /(^|[/\\])\.cursor([/\\]|$)/;
const GIT_IDENTITY = {
  GIT_AUTHOR_NAME: "stdio-e2e",
  GIT_AUTHOR_EMAIL: "stdio-e2e@example.com",
  GIT_COMMITTER_NAME: "stdio-e2e",
  GIT_COMMITTER_EMAIL: "stdio-e2e@example.com",
};

function promptText(result: Awaited<ReturnType<Client["getPrompt"]>>): string {
  return result.messages
    .map((m) => ("text" in m.content ? m.content.text : ""))
    .join("\n");
}

async function git(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", ["-C", cwd, ...args], {
    encoding: "utf8",
    env: { ...process.env, ...GIT_IDENTITY },
  });
  return stdout.trim();
}

describe.skipIf(!fs.existsSync(DIST_INDEX))(
  "stdio MCP client without .cursor",
  () => {
    let client: Client;
    let transport: StdioClientTransport;
    let parent: string;
    let contentRoot: string;
    let translatedRoot: string;

    beforeAll(async () => {
      parent = fs.mkdtempSync(path.join(os.tmpdir(), "mdn-stdio-mcp-"));
      contentRoot = path.join(parent, "content");
      translatedRoot = path.join(parent, "translated-content");
      fs.mkdirSync(path.join(contentRoot, path.dirname(EN_REL)), {
        recursive: true,
      });
      fs.mkdirSync(translatedRoot, { recursive: true });
      fs.writeFileSync(
        path.join(contentRoot, EN_REL),
        '---\ntitle: E2E stdio\n---\n{{glossary("compile")}}\n',
        "utf8",
      );

      await git(contentRoot, ["init", "--initial-branch=main"]);
      await git(contentRoot, ["add", EN_REL]);
      await git(contentRoot, ["commit", "-m", "stdio e2e fixture"]);

      transport = new StdioClientTransport({
        command: process.execPath,
        args: [DIST_INDEX],
        cwd: parent,
        stderr: "pipe",
        env: {
          MDN_CONTENT_ROOT: contentRoot,
          MDN_TRANSLATED_CONTENT_ROOT: translatedRoot,
        },
      });
      client = new Client({ name: "stdio-e2e", version: "0.0.0" });
      await client.connect(transport);
    });

    afterAll(async () => {
      await client.close();
      await transport.close();
      fs.rmSync(parent, { recursive: true, force: true });
    });

    it("tools/list で 4 件を列挙する", async () => {
      const listed = await client.listTools();
      const names = listed.tools.map((t) => t.name).sort();
      expect(names).toEqual([...MCP_TOOL_NAMES].slice().sort());
    });

    it("resources/list と resources/read ができる", async () => {
      const listed = await client.listResources();
      const uris = listed.resources.map((r) => r.uri).sort();
      expect(uris).toEqual(
        GUIDELINE_RESOURCES.map((r) => r.uri)
          .slice()
          .sort(),
      );

      const read = await client.readResource({
        uri: "mdn://guidelines/editorial",
      });
      expect(read.contents.length).toBeGreaterThan(0);
      expect(read.contents.some((c) => "text" in c && c.text.length > 0)).toBe(
        true,
      );
    });

    it("prompts/list と prompts/get ができる", async () => {
      const listed = await client.listPrompts();
      const names = listed.prompts.map((p) => p.name).sort();
      expect(names).toEqual(
        TRANSLATION_PROMPTS.map((p) => p.name)
          .slice()
          .sort(),
      );

      const translate = await client.getPrompt({
        name: "mdn_translate",
        arguments: { url: SAMPLE_URL },
      });
      const body = promptText(translate);
      expect(body).toContain(SAMPLE_URL);
      expect(body).toContain("mdn_trans_start");
      expect(body).not.toMatch(CURSOR_PATH_RE);
    });

    it("サーバー指示に .cursor パスを含まない", () => {
      const instructions = client.getInstructions() ?? "";
      expect(instructions).toContain("mdn_translate");
      expect(instructions).not.toMatch(CURSOR_PATH_RE);
      expect(instructions).not.toContain(".cursor/");
    });

    it("4 Tools を順に呼べる", async () => {
      const start = await client.callTool({
        name: "mdn_trans_start",
        arguments: { url: SAMPLE_URL },
      });
      expect(start.isError).toBeFalsy();
      const startSc = start.structuredContent as Record<string, unknown>;
      expect(startSc.tool).toBe("mdn_trans_start");
      expect(startSc.destRel).toBe(JA_REL);
      expect(fs.existsSync(path.join(translatedRoot, JA_REL))).toBe(true);

      const commit = await client.callTool({
        name: "mdn_trans_commit_get",
        arguments: { url: SAMPLE_URL },
      });
      expect(commit.isError).toBeFalsy();
      const commitSc = commit.structuredContent as Record<string, unknown>;
      expect(commitSc.tool).toBe("mdn_trans_commit_get");
      expect(String(commitSc.sourceCommit)).toMatch(/^[0-9a-f]{40}$/i);

      const glossary = await client.callTool({
        name: "mdn_trans_replace_glossary",
        arguments: { jaFile: JA_REL },
      });
      expect(glossary.isError).toBeFalsy();
      const glossarySc = glossary.structuredContent as Record<string, unknown>;
      expect(glossarySc.tool).toBe("mdn_trans_replace_glossary");
      expect(glossarySc.replaced).toBe(1);

      const review = await client.callTool({
        name: "mdn_trans_review",
        arguments: { jaFile: JA_REL },
      });
      expect(review.isError).toBeFalsy();
      const reviewSc = review.structuredContent as Record<string, unknown>;
      expect(reviewSc.tool).toBe("mdn_trans_review");
      expect(reviewSc.readsFileOnly).toBe(true);
      expect(Array.isArray(reviewSc.findings)).toBe(true);
    });

    it("ワークスペースに .cursor を作らない", () => {
      expect(fs.existsSync(path.join(parent, ".cursor"))).toBe(false);
      expect(fs.existsSync(path.join(contentRoot, ".cursor"))).toBe(false);
      expect(fs.existsSync(path.join(translatedRoot, ".cursor"))).toBe(false);
    });
  },
);
