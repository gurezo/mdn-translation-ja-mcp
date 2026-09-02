import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { resolveJaFile } from "./resolve-ja-file.js";

describe("resolveJaFile", () => {
  let parent: string | undefined;

  afterEach(() => {
    if (parent !== undefined) {
      fs.rmSync(parent, { recursive: true, force: true });
      parent = undefined;
    }
  });

  function roots() {
    parent = fs.mkdtempSync(path.join(os.tmpdir(), "mdn-jafile-"));
    const contentRoot = path.join(parent, "content");
    const translatedRoot = path.join(parent, "translated-content");
    fs.mkdirSync(translatedRoot, { recursive: true });
    return { contentRoot, translatedRoot };
  }

  it("相対パスを translated-content 配下へ解決する", () => {
    const r = roots();
    const jaRel = path.join("files", "ja", "glossary", "symbol", "index.md");
    const resolved = resolveJaFile(r, jaRel);
    expect(resolved).toBe(path.join(r.translatedRoot, jaRel));
  });

  it("配下の絶対パスを受け入れる", () => {
    const r = roots();
    const abs = path.join(
      r.translatedRoot,
      "files",
      "ja",
      "glossary",
      "symbol",
      "index.md",
    );
    expect(resolveJaFile(r, abs)).toBe(path.normalize(abs));
  });

  it("相対パスでのルート外脱出を拒否する", () => {
    const r = roots();
    expect(() => resolveJaFile(r, path.join("..", "outside.md"))).toThrow(
      /translated-content の外/,
    );
  });

  it("ルート外の絶対パスを拒否する", () => {
    const r = roots();
    expect(() => resolveJaFile(r, path.join(parent!, "outside.md"))).toThrow(
      /translated-content の外/,
    );
  });
});
