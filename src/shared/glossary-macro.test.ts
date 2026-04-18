import { describe, expect, it } from "vitest";

import {
  findSingleArgGlossaryMacros,
  replaceGlossarySecondArgs,
} from "./glossary-macro.js";

describe("glossary macro", () => {
  it("1 引数マクロを検出する", () => {
    const s = 'foo {{glossary("compile")}} bar';
    const m = findSingleArgGlossaryMacros(s);
    expect(m).toHaveLength(1);
    expect(m[0].termId).toBe("compile");
  });

  it("第2引数を付与する", () => {
    const { next, replaced, skipped } = replaceGlossarySecondArgs(
      '{{glossary("compile")}}',
      (id) => (id === "compile" ? "Compile (コンパイル)" : undefined),
    );
    expect(replaced).toBe(1);
    expect(next).toBe('{{glossary("compile", "Compile (コンパイル)")}}');
    expect(skipped).toHaveLength(0);
  });
});
