import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { mdnTransStart } from "./trans-start.js";

describe("mdnTransStart", () => {
  let parent: string | undefined;

  afterEach(() => {
    if (parent !== undefined) {
      fs.rmSync(parent, { recursive: true, force: true });
      parent = undefined;
    }
  });

  it("原文を ja にコピーする", () => {
    parent = fs.mkdtempSync(path.join(os.tmpdir(), "mdn-ts-"));
    const contentRoot = path.join(parent, "content");
    const translatedRoot = path.join(parent, "translated-content");
    const rel = "files/en-us/glossary/e2e_fixture/index.md";
    fs.mkdirSync(path.join(contentRoot, path.dirname(rel)), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(contentRoot, rel),
      "---\ntitle: E2E\n---\nbody\n",
      "utf8",
    );

    const r = mdnTransStart(
      { contentRoot, translatedRoot },
      {
        url: "https://developer.mozilla.org/en-US/docs/Glossary/E2E_fixture",
      },
    );

    expect(fs.existsSync(r.destFile)).toBe(true);
    expect(fs.readFileSync(r.destFile, "utf8")).toContain("body");
    expect(r.destFile).toContain(
      `files${path.sep}ja${path.sep}glossary${path.sep}e2e_fixture`,
    );
    expect(r.destFile).not.toContain(`${path.sep}docs${path.sep}`);
    expect(r.message).toContain("files/ja/glossary/");
  });
});
