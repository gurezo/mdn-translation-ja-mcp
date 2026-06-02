import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { runGuidelineReview } from "./run-guideline-review.js";

const fixtureDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "__fixtures__",
);

describe("runGuidelineReview", () => {
  it("Audio Session API 訳文（PR #36277 指摘相当）の表記を検出する", () => {
    const markdown = fs.readFileSync(
      path.join(fixtureDir, "audio-session-api-excerpt.md"),
      "utf8",
    );
    const { findings } = runGuidelineReview(markdown);
    const ruleIds = findings.map((f) => f.ruleId);

    expect(ruleIds).toContain("EDITORIAL_WEB_APPLICATION_LATIN");
    expect(ruleIds).toContain("EDITORIAL_INTERFACE_SPELLING");
    expect(ruleIds).toContain("EDITORIAL_SPEC_HEADING");
    expect(ruleIds).toContain("EDITORIAL_BROWSER_COMPAT_HEADING");
    expect(ruleIds).toContain("EDITORIAL_TERM_BROWSER_SHORT");
  });
});
