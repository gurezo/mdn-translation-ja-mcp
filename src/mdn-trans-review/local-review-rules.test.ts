import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

import {
  loadLocalReviewRules,
  mozillaGlossaryExcerptSchema,
  prohibitedExpressionsFileSchema,
  styleRulesFileSchema,
} from "./local-review-rules.js";

const repoRulesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "rules",
);

describe("loadLocalReviewRules", () => {
  it("loads and validates default local review JSON files", () => {
    const bundle = loadLocalReviewRules();
    expect(bundle.mozillaGlossaryExcerpt.terms.length).toBeGreaterThan(0);
    expect(
      bundle.styleRules.rules.some(
        (r) => r.id === "STYLE_DESU_MASU_AND_DEARU_MIX",
      ),
    ).toBe(true);
    expect(bundle.prohibitedExpressions.items.length).toBeGreaterThan(0);
    mozillaGlossaryExcerptSchema.parse(bundle.mozillaGlossaryExcerpt);
    styleRulesFileSchema.parse(bundle.styleRules);
    prohibitedExpressionsFileSchema.parse(bundle.prohibitedExpressions);
  });

  it("throws when a regex pattern is invalid", async () => {
    const mozilla = await readFile(
      join(repoRulesDir, "mozilla-glossary-excerpt.json"),
      "utf8",
    );
    const style = await readFile(
      join(repoRulesDir, "style-rules.json"),
      "utf8",
    );
    const badProhibited = JSON.stringify({
      $schema: "./prohibited-expressions.schema.json",
      sourceUrl: "https://example.com/",
      retrievedAt: "2026-03-21",
      items: [
        {
          id: "BAD_REGEX",
          matchType: "regex",
          pattern: "(",
          severity: "warning",
          message: "invalid",
        },
      ],
    });

    const dir = await mkdtemp(join(tmpdir(), "mdn-local-rules-"));
    try {
      await writeFile(
        join(dir, "mozilla-glossary-excerpt.json"),
        mozilla,
        "utf8",
      );
      await writeFile(join(dir, "style-rules.json"), style, "utf8");
      await writeFile(
        join(dir, "prohibited-expressions.json"),
        badProhibited,
        "utf8",
      );

      expect(() => loadLocalReviewRules(dir)).toThrow(/BAD_REGEX/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
