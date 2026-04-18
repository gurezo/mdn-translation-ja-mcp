import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { resolveWorkspaceRoots } from "./workspace.js";

const prevContent = process.env.MDN_CONTENT_ROOT;
const prevTranslated = process.env.MDN_TRANSLATED_CONTENT_ROOT;

afterEach(() => {
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

describe("resolveWorkspaceRoots", () => {
  it("環境変数が両方ある場合はそれを使う", () => {
    const base = os.tmpdir();
    process.env.MDN_CONTENT_ROOT = path.join(base, "c");
    process.env.MDN_TRANSLATED_CONTENT_ROOT = path.join(base, "t");
    const r = resolveWorkspaceRoots();
    expect(r.contentRoot).toBe(path.resolve(base, "c"));
    expect(r.translatedRoot).toBe(path.resolve(base, "t"));
  });

  it("兄弟ディレクトリに content / translated-content があれば解決する", () => {
    const parent = fs.mkdtempSync(path.join(os.tmpdir(), "mdn-ws-"));
    const content = path.join(parent, "content");
    const translated = path.join(parent, "translated-content");
    fs.mkdirSync(content);
    fs.mkdirSync(translated);
    const mcp = path.join(parent, "mcp");
    fs.mkdirSync(mcp);
    const r = resolveWorkspaceRoots(mcp);
    expect(r.contentRoot).toBe(content);
    expect(r.translatedRoot).toBe(translated);
    fs.rmSync(parent, { recursive: true, force: true });
  });
});
