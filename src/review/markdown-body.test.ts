import { describe, expect, it } from "vitest";

import { proseOutsideCodeFences } from "./markdown-body.js";

describe("proseOutsideCodeFences", () => {
  it("コードフェンス内の NG 表記は検出対象から除外する", () => {
    const md = "本文はOK\n```js\n下さい\n```\n";
    expect(proseOutsideCodeFences(md)).not.toContain("下さい");
  });
});
