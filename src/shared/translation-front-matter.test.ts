import { describe, expect, it } from "vitest";

import {
  minimizeTranslationIndexMd,
  setL10nSourceCommitInTranslationMarkdown,
} from "./translation-front-matter.js";

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

  it("adds l10n.sourceCommit when sourceCommit option is set", () => {
    const raw = `---
title: Just-In-Time Compilation (JIT)
slug: Glossary/Just_In_Time_Compilation
page-type: glossary-definition
---

# Body
`;
    const hash = "2547f622337d6cbf8c3794776b17ed377d6aad57";
    const result = minimizeTranslationIndexMd(raw, { sourceCommit: hash });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.markdown).toBe(`---
title: Just-In-Time Compilation (JIT)
slug: Glossary/Just_In_Time_Compilation
l10n:
  sourceCommit: ${hash}
---

# Body
`);
  });
});

describe("setL10nSourceCommitInTranslationMarkdown", () => {
  it("adds l10n.sourceCommit while preserving body", () => {
    const raw = `---
title: 実行時コンパイル
slug: Glossary/JIT
---

# 本文
`;
    const hash = "aaaabbbbccccddddeeeeffffaaaabbbbccccdddd";
    const result = setL10nSourceCommitInTranslationMarkdown(raw, hash);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.markdown).toContain(`sourceCommit: ${hash}`);
    expect(result.markdown).toContain("# 本文");
  });

  it("drops page-type and sidebar and matches minimized key order", () => {
    const raw = `---
title: 実行時コンパイル (JIT)
short-title: JIT
slug: Glossary/Just_In_Time_Compilation
page-type: glossary-definition
sidebar: glossarysidebar
---

# 本文
`;
    const hash = "2547f622337d6cbf8c3794776b17ed377d6aad57";
    const result = setL10nSourceCommitInTranslationMarkdown(raw, hash);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.markdown).toBe(`---
title: 実行時コンパイル (JIT)
short-title: JIT
slug: Glossary/Just_In_Time_Compilation
l10n:
  sourceCommit: ${hash}
---

# 本文
`);
  });

  it("merges into existing l10n object", () => {
    const raw = `---
title: Foo
slug: Bar/Baz
l10n:
  foo: bar
---

# x
`;
    const hash = "111122223333444455556666777788889999aaaa";
    const result = setL10nSourceCommitInTranslationMarkdown(raw, hash);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.markdown).toContain("foo: bar");
    expect(result.markdown).toContain(`sourceCommit: ${hash}`);
  });

  it("returns INVALID_L10N when l10n is not a plain object", () => {
    const raw = `---
title: T
slug: S
l10n: not-an-object
---

# b
`;
    const result = setL10nSourceCommitInTranslationMarkdown(
      raw,
      "2547f622337d6cbf8c3794776b17ed377d6aad57",
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("INVALID_L10N");
  });
});
