import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { getLatestCommitHashForPath } from "../git/get-source-commit.js";
import { mdnTransCommitGet } from "./commit-get.js";

vi.mock("../git/get-source-commit.js", () => ({
  getLatestCommitHashForPath: vi.fn(),
}));

const SOURCE_COMMIT = "2547f622337d6cbf8c3794776b17ed377d6aad57";

describe("mdnTransCommitGet", () => {
  let parent: string | undefined;

  afterEach(() => {
    if (parent !== undefined) {
      fs.rmSync(parent, { recursive: true, force: true });
      parent = undefined;
    }
    vi.mocked(getLatestCommitHashForPath).mockReset();
  });

  it("翻訳ファイルが無いと失敗する", async () => {
    parent = fs.mkdtempSync(path.join(os.tmpdir(), "mdn-cg-"));
    const contentRoot = path.join(parent, "content");
    const translatedRoot = path.join(parent, "translated-content");
    fs.mkdirSync(contentRoot, { recursive: true });
    fs.mkdirSync(translatedRoot, { recursive: true });

    await expect(
      mdnTransCommitGet(
        { contentRoot, translatedRoot },
        {
          url: "https://developer.mozilla.org/en-US/docs/Glossary/E2E_commit",
        },
      ),
    ).rejects.toThrow(/先に mdn_trans_start/);
  });

  it("l10n.sourceCommit を front-matter に書き込む", async () => {
    parent = fs.mkdtempSync(path.join(os.tmpdir(), "mdn-cg-"));
    const contentRoot = path.join(parent, "content");
    const translatedRoot = path.join(parent, "translated-content");
    const jaRel = "files/ja/glossary/e2e_commit/index.md";
    const jaPath = path.join(translatedRoot, jaRel);
    fs.mkdirSync(path.dirname(jaPath), { recursive: true });
    fs.writeFileSync(
      jaPath,
      "---\ntitle: E2E\npage-type: glossary-definition\nsidebar: glossarysidebar\n---\nbody\n",
      "utf8",
    );

    vi.mocked(getLatestCommitHashForPath).mockResolvedValue(SOURCE_COMMIT);

    const r = await mdnTransCommitGet(
      { contentRoot, translatedRoot },
      {
        url: "https://developer.mozilla.org/en-US/docs/Glossary/E2E_commit",
      },
    );

    expect(getLatestCommitHashForPath).toHaveBeenCalledWith(
      contentRoot,
      "files/en-us/glossary/e2e_commit/index.md",
    );
    expect(r.sourceCommit).toBe(SOURCE_COMMIT);
    expect(r.jaFile).toBe(jaPath);
    const updated = fs.readFileSync(jaPath, "utf8");
    expect(updated).toContain(`sourceCommit: ${SOURCE_COMMIT}`);
    expect(updated).not.toContain("page-type:");
    expect(updated).not.toContain("sidebar:");
  });
});
