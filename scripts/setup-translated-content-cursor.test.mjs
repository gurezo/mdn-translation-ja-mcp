import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import {
  parseSetupArgs,
  setupTranslatedContentCursor,
} from "./setup-translated-content-cursor.mjs";

const mcpRepoRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

describe("parseSetupArgs", () => {
  it("引数なしは Rule なし", () => {
    expect(parseSetupArgs([])).toEqual({
      withRules: false,
      translatedRootArg: undefined,
    });
  });

  it("--with-rules とパスを順不同で解釈する", () => {
    expect(parseSetupArgs(["--with-rules", "/tmp/tc"])).toEqual({
      withRules: true,
      translatedRootArg: "/tmp/tc",
    });
    expect(parseSetupArgs(["/tmp/tc", "--with-rules"])).toEqual({
      withRules: true,
      translatedRootArg: "/tmp/tc",
    });
  });

  it("不明なオプションは失敗する", () => {
    expect(() => parseSetupArgs(["--with-skills"])).toThrow(/不明なオプション/);
  });
});

describe("setupTranslatedContentCursor", () => {
  /** @type {string | undefined} */
  let parent;

  afterEach(() => {
    if (parent !== undefined) {
      fs.rmSync(parent, { recursive: true, force: true });
      parent = undefined;
    }
  });

  function makeRoots() {
    parent = fs.mkdtempSync(path.join(os.tmpdir(), "mdn-setup-"));
    const translatedRoot = path.join(parent, "translated-content");
    const contentRoot = path.join(parent, "content");
    const distIndex = path.join(parent, "dist", "index.js");
    fs.mkdirSync(translatedRoot, { recursive: true });
    fs.mkdirSync(path.dirname(distIndex), { recursive: true });
    fs.writeFileSync(distIndex, "export {}\n", "utf8");
    return { translatedRoot, contentRoot, distIndex };
  }

  it("既定では mcp.json のみ生成し rules は作らない", () => {
    const { translatedRoot, contentRoot, distIndex } = makeRoots();
    const r = setupTranslatedContentCursor({
      mcpRepoRoot,
      translatedRoot,
      contentRoot,
      distIndex,
    });

    expect(r.mcpJsonPath).toBe(
      path.join(translatedRoot, ".cursor", "mcp.json"),
    );
    expect(r.ruleDest).toBeUndefined();
    expect(fs.existsSync(r.mcpJsonPath)).toBe(true);
    expect(fs.existsSync(path.join(translatedRoot, ".cursor", "rules"))).toBe(
      false,
    );

    const mcp = JSON.parse(fs.readFileSync(r.mcpJsonPath, "utf8"));
    expect(mcp.mcpServers["mdn-translation-ja"].args[0]).toBe(distIndex);
    expect(
      mcp.mcpServers["mdn-translation-ja"].env.MDN_TRANSLATED_CONTENT_ROOT,
    ).toBe(translatedRoot);
  });

  it("--with-rules のとき薄い Rule をコピーする", () => {
    const { translatedRoot, contentRoot, distIndex } = makeRoots();
    const r = setupTranslatedContentCursor({
      mcpRepoRoot,
      translatedRoot,
      contentRoot,
      distIndex,
      withRules: true,
    });

    expect(r.ruleDest).toBe(
      path.join(translatedRoot, ".cursor", "rules", "01-mdn-mcp-tools.mdc"),
    );
    expect(fs.existsSync(r.ruleDest)).toBe(true);
    const copied = fs.readFileSync(r.ruleDest, "utf8");
    const src = fs.readFileSync(
      path.join(
        mcpRepoRoot,
        "integrations",
        "cursor",
        "rules",
        "01-mdn-mcp-tools.mdc",
      ),
      "utf8",
    );
    expect(copied).toBe(src);
  });

  it("既定の再実行では既存の rules を削除しない", () => {
    const { translatedRoot, contentRoot, distIndex } = makeRoots();
    const existing = path.join(
      translatedRoot,
      ".cursor",
      "rules",
      "01-mdn-mcp-tools.mdc",
    );
    fs.mkdirSync(path.dirname(existing), { recursive: true });
    fs.writeFileSync(existing, "keep-me\n", "utf8");

    setupTranslatedContentCursor({
      mcpRepoRoot,
      translatedRoot,
      contentRoot,
      distIndex,
    });

    expect(fs.readFileSync(existing, "utf8")).toBe("keep-me\n");
  });

  it("dist が無いと失敗する", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mdn-setup-"));
    parent = dir;
    const translatedRoot = path.join(dir, "translated-content");
    fs.mkdirSync(translatedRoot, { recursive: true });
    expect(() =>
      setupTranslatedContentCursor({
        mcpRepoRoot,
        translatedRoot,
        contentRoot: path.join(dir, "content"),
        distIndex: path.join(dir, "missing", "index.js"),
      }),
    ).toThrow(/dist\/index\.js がありません/);
  });
});
