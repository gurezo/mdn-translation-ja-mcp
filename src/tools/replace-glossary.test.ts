import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { mdnTransReplaceGlossary } from "./replace-glossary.js";

describe("mdnTransReplaceGlossary", () => {
  let parent: string | undefined;
  const writeSpy = vi.spyOn(fs, "writeFileSync");

  afterEach(() => {
    if (parent !== undefined) {
      fs.rmSync(parent, { recursive: true, force: true });
      parent = undefined;
    }
    writeSpy.mockClear();
  });

  function setupJa(body: string) {
    parent = fs.mkdtempSync(path.join(os.tmpdir(), "mdn-gl-"));
    const contentRoot = path.join(parent, "content");
    const translatedRoot = path.join(parent, "translated-content");
    const jaRel = "files/ja/glossary/e2e_glossary/index.md";
    const jaPath = path.join(translatedRoot, jaRel);
    fs.mkdirSync(path.dirname(jaPath), { recursive: true });
    fs.writeFileSync(jaPath, body, "utf8");
    writeSpy.mockClear();
    return { contentRoot, translatedRoot, jaRel, jaPath };
  }

  it("既知の 1 引数 glossary を置換して保存する", () => {
    const { contentRoot, translatedRoot, jaRel, jaPath } = setupJa(
      '本文 {{glossary("compile")}} と {{glossary("unknown_term_xyz")}}\n',
    );

    const r = mdnTransReplaceGlossary(
      { contentRoot, translatedRoot },
      { jaFile: jaRel },
    );

    expect(r.replaced).toBe(1);
    expect(r.skipped).toContain("unknown_term_xyz");
    expect(r.jaFile).toBe(jaPath);
    expect(writeSpy).toHaveBeenCalled();
    const next = fs.readFileSync(jaPath, "utf8");
    expect(next).toContain('{{glossary("compile", "Compile (コンパイル)")}}');
    expect(next).toContain('{{glossary("unknown_term_xyz")}}');
  });

  it("置換対象が無いときは書き込まない", () => {
    const { contentRoot, translatedRoot, jaRel } = setupJa(
      "本文に glossary マクロはありません。\n",
    );

    const r = mdnTransReplaceGlossary(
      { contentRoot, translatedRoot },
      { jaFile: jaRel },
    );

    expect(r.replaced).toBe(0);
    expect(r.skipped).toEqual([]);
    expect(writeSpy).not.toHaveBeenCalled();
  });
});
