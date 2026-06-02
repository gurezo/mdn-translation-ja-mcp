import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { mdnTransReview } from "./review.js";

describe("mdnTransReview", () => {
  let parent: string | undefined;
  const writeSpy = vi.spyOn(fs, "writeFileSync");

  afterEach(() => {
    if (parent !== undefined) {
      fs.rmSync(parent, { recursive: true, force: true });
      parent = undefined;
    }
    writeSpy.mockClear();
  });

  it("対象ファイルを読み取るのみで writeFileSync しない", () => {
    parent = fs.mkdtempSync(path.join(os.tmpdir(), "mdn-review-"));
    const translatedRoot = path.join(parent, "translated-content");
    const jaRel = "files/ja/glossary/symbol/index.md";
    const jaPath = path.join(translatedRoot, jaRel);
    fs.mkdirSync(path.dirname(jaPath), { recursive: true });
    fs.writeFileSync(
      jaPath,
      "---\ntitle: x\nl10n:\n  sourceCommit: abc123\n---\n本文はOK\n",
      "utf8",
    );
    writeSpy.mockClear();

    mdnTransReview(
      {
        contentRoot: path.join(parent, "content"),
        translatedRoot,
      },
      { jaFile: jaRel },
    );

    expect(writeSpy).not.toHaveBeenCalled();
  });

  it("文体 NG と sourceCommit 欠落を検出する", () => {
    parent = fs.mkdtempSync(path.join(os.tmpdir(), "mdn-review-"));
    const translatedRoot = path.join(parent, "translated-content");
    const jaRel = "files/ja/web/api/audio_session_api/index.md";
    const jaPath = path.join(translatedRoot, jaRel);
    fs.mkdirSync(path.dirname(jaPath), { recursive: true });
    fs.writeFileSync(
      jaPath,
      "---\ntitle: Audio\n---\n下さい確認して {{glossary(\"foo\")}}\n",
      "utf8",
    );

    const r = mdnTransReview(
      {
        contentRoot: path.join(parent, "content"),
        translatedRoot,
      },
      { jaFile: jaRel },
    );

    const ruleIds = r.findings.map((f) => f.ruleId);
    expect(ruleIds).toContain("STYLE_HIRAGANA_NG_SHITASAI");
    expect(ruleIds).toContain("STYLE_L10N_METADATA");
    expect(ruleIds).toContain("GLOSSARY_SINGLE_ARG");
    expect(r.summaryBySkill["japanese-style"]).toBeGreaterThanOrEqual(1);
    expect(r.summaryBySkill["mozilla-l10n-glossary"]).toBe(1);
    expect(r.message).toContain("READ-ONLY: mdn_trans_review");
    expect(r.message).toContain("## japanese-style");
  });
});
