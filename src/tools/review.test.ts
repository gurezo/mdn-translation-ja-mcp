import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { mdnTransReview } from "./review.js";

describe("mdnTransReview", () => {
  let parent: string | undefined;
  const writeSpy = vi.spyOn(fs, "writeFileSync");

  afterEach(() => {
    if (parent !== undefined) {
      fs.rmSync(parent, { recursive: true, force: true });
      parent = undefined;
    }
    writeSpy.mockClear();
  });

  it("対象ファイルを読み取るのみで writeFileSync しない", () => {
    parent = fs.mkdtempSync(path.join(os.tmpdir(), "mdn-review-"));
    const translatedRoot = path.join(parent, "translated-content");
    const jaRel = "files/ja/glossary/symbol/index.md";
    const jaPath = path.join(translatedRoot, jaRel);
    fs.mkdirSync(path.dirname(jaPath), { recursive: true });
    fs.writeFileSync(jaPath, "---\ntitle: x\n---\n本文はOK\n", "utf8");
    writeSpy.mockClear();

    mdnTransReview(
      {
        contentRoot: path.join(parent, "content"),
        translatedRoot,
      },
      { jaFile: jaRel },
    );

    expect(writeSpy).not.toHaveBeenCalled();
  });
});
