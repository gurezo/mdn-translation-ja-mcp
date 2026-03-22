import { describe, expect, it } from "vitest";

import { loadLocalReviewRules } from "./local-review-rules.js";
import {
  loadTranslationRules,
  translationRulesDataSchema,
} from "./translation-rules.js";

describe("loadTranslationRules", () => {
  it("loads and validates default rules JSON", () => {
    const rules = loadTranslationRules();
    expect(rules.editorial.url).toContain("mozilla-japan");
    expect(rules.l10n.url).toContain("L10N-Guideline");
    expect(rules.glossary.url).toContain("Mozilla-L10N-Glossary");
    expect(rules.style.url).toContain("spreadsheets");
  });

  it("matches translationRulesDataSchema", () => {
    const rules = loadTranslationRules();
    const parsed = translationRulesDataSchema.parse(rules);
    expect(parsed.style.title).toBe("日本語の文体");
  });

  it("composes with localReviewRules like translation_rules MCP tool", () => {
    const guidelineLinks = loadTranslationRules();
    const localReviewRules = loadLocalReviewRules();
    const composed = { ...guidelineLinks, localReviewRules };
    expect(composed.editorial.url).toContain("mozilla-japan");
    expect(
      composed.localReviewRules.prohibitedExpressions.items.length,
    ).toBeGreaterThan(0);
  });
});
