import { describe, expect, it } from "vitest";

import {
  bodyStartLineNumber,
  reviewTranslationMarkdown,
  stripInlineMacroBraces,
  visibleBodyLinesOutsideFences,
} from "./review-translation.js";

const minimalGlossary = {
  terms: {
    compile: { secondArg: "Compile (コンパイル)" },
  },
} as const;

function doc(body: string): string {
  return `---
title: テスト
slug: Glossary/Test
l10n:
  sourceCommit: "abc123"
---

${body}`;
}

describe("reviewTranslationMarkdown", () => {
  it("reports missing front-matter", () => {
    const findings = reviewTranslationMarkdown("# only body\n", {
      glossaryData: { terms: {} },
    });
    expect(findings.some((f) => f.code === "FM_NO_FRONT_MATTER")).toBe(true);
  });

  it("reports missing title in front-matter", () => {
    const raw = `---
slug: Foo/Bar
---

# x
`;
    const findings = reviewTranslationMarkdown(raw, {
      glossaryData: { terms: {} },
    });
    expect(findings.some((f) => f.code === "FM_MISSING_TITLE")).toBe(true);
  });

  it("warns when l10n.sourceCommit is absent", () => {
    const raw = `---
title: T
slug: S
---

# x
`;
    const findings = reviewTranslationMarkdown(raw, {
      glossaryData: { terms: {} },
    });
    expect(findings.some((f) => f.code === "FM_MISSING_SOURCE_COMMIT")).toBe(
      true,
    );
  });

  it("warns when page-type remains in front-matter", () => {
    const raw = `---
title: T
slug: S
page-type: guide
l10n:
  sourceCommit: "abc"
---

# x
`;
    const findings = reviewTranslationMarkdown(raw, {
      glossaryData: { terms: {} },
    });
    expect(findings.some((f) => f.code === "FM_LEGACY_PAGE_TYPE")).toBe(true);
  });

  it("flags glossary macro without second arg when slug is in glossary", () => {
    const raw = doc(`{{glossary("compile")}}`);
    const findings = reviewTranslationMarkdown(raw, {
      glossaryData: { terms: { ...minimalGlossary.terms } },
    });
    expect(
      findings.some((f) => f.code === "GLOSSARY_SECOND_ARG_RECOMMENDED"),
    ).toBe(true);
  });

  it("flags glossary macro without second arg when slug is missing from glossary", () => {
    const raw = doc(`{{glossary("unknown")}}`);
    const findings = reviewTranslationMarkdown(raw, {
      glossaryData: { terms: { ...minimalGlossary.terms } },
    });
    expect(findings.some((f) => f.code === "GLOSSARY_SLUG_NOT_IN_JSON")).toBe(
      true,
    );
  });

  it("does not flag glossary macro when second arg is set", () => {
    const raw = doc(`{{glossary("compile", "Compile (コンパイル)")}}`);
    const findings = reviewTranslationMarkdown(raw, {
      glossaryData: { terms: { ...minimalGlossary.terms } },
    });
    expect(findings.filter((f) => f.category === "glossary")).toHaveLength(0);
  });

  it("detects probable English run in body text", () => {
    const raw = doc(
      `This word and another example here are written in English for testing.`,
    );
    const findings = reviewTranslationMarkdown(raw, {
      glossaryData: { terms: {} },
    });
    expect(findings.some((f) => f.code === "UNTRANSLATED_ENGLISH_RUN")).toBe(
      true,
    );
  });

  it("skips English runs inside fenced code blocks", () => {
    const raw = doc(`\`\`\`js
const foo = bar baz qux
\`\`\`

日本語の本文です。`);
    const findings = reviewTranslationMarkdown(raw, {
      glossaryData: { terms: {} },
    });
    expect(findings.some((f) => f.code === "UNTRANSLATED_ENGLISH_RUN")).toBe(
      false,
    );
  });

  it("reports style mix when desu-masu and dearu both appear", () => {
    const raw = doc(`これは説明です。次に述べる。\n\nこの問題は難しいである。`);
    const findings = reviewTranslationMarkdown(raw, {
      glossaryData: { terms: {} },
    });
    expect(
      findings.some((f) => f.code === "STYLE_DESU_MASU_AND_DEARU_MIX"),
    ).toBe(true);
  });

  it("flags prohibited literal when configured", () => {
    const raw = doc(`この節は（要翻訳）として残しています。`);
    const findings = reviewTranslationMarkdown(raw, {
      glossaryData: { terms: {} },
      prohibitedItems: [
        {
          id: "PLACEHOLDER_TRANSLATION_PENDING",
          matchType: "literal",
          pattern: "（要翻訳）",
          severity: "warning",
          message: "未翻訳のプレースホルダが残っている可能性があります。",
        },
      ],
    });
    expect(
      findings.some(
        (f) => f.code === "PROHIBITED_PLACEHOLDER_TRANSLATION_PENDING",
      ),
    ).toBe(true);
    expect(findings.some((f) => f.category === "prohibited")).toBe(true);
  });

  it("flags prohibited literal for untranslated marker", () => {
    const raw = doc(`この節は（未翻訳）のままです。`);
    const findings = reviewTranslationMarkdown(raw, {
      glossaryData: { terms: {} },
      prohibitedItems: [
        {
          id: "PLACEHOLDER_UNTRANSLATED_MARK",
          matchType: "literal",
          pattern: "（未翻訳）",
          severity: "warning",
          message: "未翻訳のマーカーが残っている可能性があります。",
        },
      ],
    });
    expect(
      findings.some(
        (f) => f.code === "PROHIBITED_PLACEHOLDER_UNTRANSLATED_MARK",
      ),
    ).toBe(true);
  });

  it("skips prohibited check when prohibitedItems is omitted", () => {
    const raw = doc(`この節は（要翻訳）として残しています。`);
    const findings = reviewTranslationMarkdown(raw, {
      glossaryData: { terms: {} },
    });
    expect(findings.some((f) => f.category === "prohibited")).toBe(false);
  });

  it("matches prohibited regex per line", () => {
    const raw = doc(`行にFOO_BAR禁止という文字列を含む。`);
    const findings = reviewTranslationMarkdown(raw, {
      glossaryData: { terms: {} },
      prohibitedItems: [
        {
          id: "TEST_REGEX",
          matchType: "regex",
          pattern: "FOO_BAR禁止",
          severity: "info",
          message: "テスト用",
        },
      ],
    });
    expect(findings.some((f) => f.code === "PROHIBITED_TEST_REGEX")).toBe(true);
  });
});

describe("bodyStartLineNumber", () => {
  it("returns line after closing front-matter", () => {
    const raw = `---
title: T
slug: S
---

# Body
`;
    expect(bodyStartLineNumber(raw)).toBe(5);
  });
});

describe("stripInlineMacroBraces", () => {
  it("removes glossary macro text", () => {
    expect(stripInlineMacroBraces(`x {{glossary("a")}} y`)).toBe("x   y");
  });
});

describe("visibleBodyLinesOutsideFences", () => {
  it("drops fenced lines", () => {
    const body = "```js\na\n```\nvisible\n";
    expect(visibleBodyLinesOutsideFences(body)).toEqual(["visible", ""]);
  });
});
