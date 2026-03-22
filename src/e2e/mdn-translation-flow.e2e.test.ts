import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runMdnTransCommitGet } from "../mdn-trans-commit-get/mdn-trans-commit-get.js";
import { runMdnTransStart } from "../mdn-trans-start/mdn-trans-start.js";
import { runReviewTranslation } from "../mdn-trans-review/review-translation.js";

const MOCK_SOURCE_COMMIT = "2547f622337d6cbf8c3794776b17ed377d6aad57";

const E2E_DOC_URL =
  "https://developer.mozilla.org/en-US/docs/Glossary/E2E_Fixture";

function mockGitLog() {
  return async () => ({
    stdout: `${MOCK_SOURCE_COMMIT}\n`,
    stderr: "",
  });
}

function repoRootFromThisTestFile(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
}

describe("E2E: fixture workspace start → commit-get → review", () => {
  let tmpParent: string | undefined;

  beforeEach(() => {
    tmpParent = undefined;
  });

  afterEach(async () => {
    if (tmpParent !== undefined) {
      await fs.rm(tmpParent, { recursive: true, force: true });
      tmpParent = undefined;
    }
  });

  it("runs the main flow against copied fixtures", async () => {
    const repoRoot = repoRootFromThisTestFile();
    const fixtureRoot = path.join(repoRoot, "test", "fixtures", "e2e-flow");

    tmpParent = await fs.mkdtemp(
      path.join(os.tmpdir(), "mdn-translation-flow-e2e-"),
    );
    const packageRoot = path.join(tmpParent, "mdn-translation-ja-mcp");
    const contentRoot = path.join(tmpParent, "content");
    const translatedRoot = path.join(tmpParent, "translated-content");
    await fs.mkdir(packageRoot, { recursive: true });

    await fs.cp(
      path.join(fixtureRoot, "content"),
      contentRoot,
      { recursive: true },
    );
    await fs.cp(
      path.join(fixtureRoot, "translated-content"),
      translatedRoot,
      { recursive: true },
    );

    const gitLog = mockGitLog();

    const start = await runMdnTransStart({
      url: E2E_DOC_URL,
      packageRoot,
      gitLog,
    });
    expect(start.ok).toBe(true);
    if (!start.ok) throw new Error("expected start ok");
    expect(start.copied).toBe(true);
    expect(start.sourceCommit).toBe(MOCK_SOURCE_COMMIT);

    const commitGet = await runMdnTransCommitGet({
      url: E2E_DOC_URL,
      packageRoot,
      gitLog,
    });
    expect(commitGet.ok).toBe(true);
    if (!commitGet.ok) throw new Error("expected commit-get ok");
    expect(commitGet.sourceCommit).toBe(MOCK_SOURCE_COMMIT);

    const rulesJson = path.join(repoRoot, "rules", "translation-rules.json");
    const rulesDir = path.join(repoRoot, "rules");
    const glossaryJson = path.join(
      repoRoot,
      "src",
      "shared",
      "data",
      "glossary-terms.json",
    );

    const review = await runReviewTranslation({
      url: E2E_DOC_URL,
      packageRoot,
      translationRulesJsonPath: rulesJson,
      localReviewRulesDir: rulesDir,
      glossaryPath: glossaryJson,
    });
    expect(review.ok).toBe(true);
    if (!review.ok) throw new Error("expected review ok");
    expect(Array.isArray(review.findings)).toBe(true);
    expect(review.jaIndexPath).toBe(start.jaIndexPath);
  });
});
