import { describe, expect, it } from "vitest";

import { minimizeTranslationIndexMd } from "./translation-front-matter.js";

describe("minimizeTranslationIndexMd", () => {
  it("keeps title, optional short-title, slug and drops other keys in fixed order", () => {
    const raw = `---
title: Just-In-Time Compilation (JIT)
short-title: JIT
slug: Glossary/Just_In_Time_Compilation
page-type: glossary-definition
sidebar: glossarysidebar
---

# Body

Hello.
`;

    const result = minimizeTranslationIndexMd(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.markdown).toBe(`---
title: Just-In-Time Compilation (JIT)
short-title: JIT
slug: Glossary/Just_In_Time_Compilation
---

# Body

Hello.
`);
  });

  it("omits short-title when absent or empty", () => {
    const raw = `---
title: Foo
slug: Bar/Baz
---

# Hi
`;

    const result = minimizeTranslationIndexMd(raw);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.markdown).toBe(`---
title: Foo
slug: Bar/Baz
---

# Hi
`);
  });

  it("returns NO_FRONT_MATTER when there are no delimiters", () => {
    const result = minimizeTranslationIndexMd("# Only body\n");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("NO_FRONT_MATTER");
  });

  it("returns MISSING_TITLE when title is missing", () => {
    const result = minimizeTranslationIndexMd(`---
slug: Only/Slug
---

# x
`);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("MISSING_TITLE");
  });

  it("returns MISSING_SLUG when slug is missing", () => {
    const result = minimizeTranslationIndexMd(`---
title: Only Title
---

# x
`);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("MISSING_SLUG");
  });
});
