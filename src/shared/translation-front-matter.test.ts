import { describe, expect, it } from "vitest";

import { setSourceCommitInBody } from "./translation-front-matter.js";

describe("setSourceCommitInBody", () => {
  it("sourceCommit を設定しつつ page-type と sidebar を削除する", () => {
    const markdown = `---
title: Symbol
page-type: glossary-definition
sidebar: glossarysidebar
l10n:
  sourceLocale: en-US
---
body
`;

    const updated = setSourceCommitInBody(
      markdown,
      "2547f622337d6cbf8c3794776b17ed377d6aad57",
    );

    expect(updated).toContain("l10n:");
    expect(updated).toContain("sourceCommit: 2547f622337d6cbf8c3794776b17ed377d6aad57");
    expect(updated).not.toContain("page-type:");
    expect(updated).not.toContain("sidebar:");
  });
});
