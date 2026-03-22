import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runMdnGlossaryReplacementCandidates = vi.hoisted(() =>
  vi.fn(),
);

vi.mock("./glossary-replacement-candidates.js", () => ({
  runMdnGlossaryReplacementCandidates,
}));

import fs from "node:fs/promises";

import { runMdnGlossaryApply } from "./glossary-apply.js";

describe("runMdnGlossaryApply error paths (mocked candidates)", () => {
  beforeEach(() => {
    runMdnGlossaryReplacementCandidates.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns FILE_CHANGED when the second candidate snapshot differs", async () => {
    const baseOk = {
      ok: true as const,
      normalizedSlug: "Glossary/JIT",
      jaIndexPath: "/fake/ja/index.md",
      glossaryPath: "/fake/glossary.json",
    };

    const proposedA = {
      line: 1,
      startOffsetInLine: 0,
      raw: '{{glossary("x")}}',
      macroName: "glossary" as const,
      firstArg: "x",
      status: "proposed" as const,
      suggestedSecondArg: "X (1)",
      suggestedRaw: '{{glossary("x", "X (1)")}}',
    };

    const proposedB = {
      ...proposedA,
      suggestedSecondArg: "X (2)",
      suggestedRaw: '{{glossary("x", "X (2)")}}',
    };

    runMdnGlossaryReplacementCandidates
      .mockResolvedValueOnce({
        ...baseOk,
        candidates: [proposedA],
      })
      .mockResolvedValueOnce({
        ...baseOk,
        candidates: [proposedB],
      });

    const result = await runMdnGlossaryApply({
      url: "https://developer.mozilla.org/docs/Glossary/JIT",
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("FILE_CHANGED");
  });

  it("returns APPLY_MISMATCH when file content does not match proposed raw slices", async () => {
    const proposed = {
      line: 2,
      startOffsetInLine: 0,
      raw: '{{glossary("y")}}',
      macroName: "glossary" as const,
      firstArg: "y",
      status: "proposed" as const,
      suggestedSecondArg: "Y",
      suggestedRaw: '{{glossary("y", "Y")}}',
    };

    runMdnGlossaryReplacementCandidates.mockResolvedValue({
      ok: true,
      normalizedSlug: "Glossary/JIT",
      jaIndexPath: "/fake/ja/index.md",
      glossaryPath: "/fake/glossary.json",
      candidates: [proposed],
    });

    vi.spyOn(fs, "readFile").mockResolvedValue("# t\n\nnot the macro\n");

    const result = await runMdnGlossaryApply({
      url: "https://developer.mozilla.org/docs/Glossary/JIT",
      dryRun: false,
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("APPLY_MISMATCH");
  });
});
