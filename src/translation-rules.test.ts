import { describe, expect, it } from "vitest";

import { TRANSLATION_RULES } from "./translation-rules.js";

describe("TRANSLATION_RULES", () => {
  it("exposes Mozilla Japan guideline URLs", () => {
    expect(TRANSLATION_RULES.editorial).toContain("mozilla-japan");
    expect(TRANSLATION_RULES.l10n).toContain("L10N-Guideline");
    expect(TRANSLATION_RULES.glossary).toContain("Mozilla-L10N-Glossary");
  });
});
