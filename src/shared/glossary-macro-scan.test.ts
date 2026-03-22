import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  runMdnGlossaryMacroScan,
  scanGlossaryMacrosInText,
} from "./glossary-macro-scan.js";
import {
  ENV_MDN_CONTENT_ROOT,
  ENV_MDN_TRANSLATED_CONTENT_ROOT,
} from "./workspace.js";

describe("scanGlossaryMacrosInText", () => {
  it("detects glossary and Glossary with line numbers", () => {
    const md = [
      'Text {{glossary("compile")}} here.',
      "",
      'Also {{Glossary("JIT")}} end.',
    ].join("\n");

    const matches = scanGlossaryMacrosInText(md);
    expect(matches).toHaveLength(2);
    expect(matches[0]).toMatchObject({
      line: 1,
      startOffsetInLine: 5,
      macroName: "glossary",
      firstArg: "compile",
      hasSecondArg: false,
      raw: '{{glossary("compile")}}',
    });
    expect(matches[1]).toMatchObject({
      line: 3,
      startOffsetInLine: 5,
      macroName: "Glossary",
      firstArg: "JIT",
      hasSecondArg: false,
      raw: '{{Glossary("JIT")}}',
    });
  });

  it("detects optional second argument", () => {
    const md =
      '{{glossary("compile", "Compile (コンパイル)")}} and {{glossary("x")}}';
    const matches = scanGlossaryMacrosInText(md);
    expect(matches).toHaveLength(2);
    expect(matches[0]).toMatchObject({
      line: 1,
      hasSecondArg: true,
      firstArg: "compile",
      secondArg: "Compile (コンパイル)",
    });
    expect(matches[1]).toMatchObject({
      hasSecondArg: false,
      firstArg: "x",
    });
  });

  it("allows whitespace inside macro braces", () => {
    const md = '{{ glossary ( "a" ) }}';
    const matches = scanGlossaryMacrosInText(md);
    expect(matches).toHaveLength(1);
    expect(matches[0]!.raw).toBe('{{ glossary ( "a" ) }}');
    expect(matches[0]!.firstArg).toBe("a");
  });

  it("lists multiple macros on one line", () => {
    const md = '{{glossary("a")}} mid {{Glossary("b", "B")}}';
    const matches = scanGlossaryMacrosInText(md);
    expect(matches).toHaveLength(2);
    expect(matches[0]!.firstArg).toBe("a");
    expect(matches[0]!.startOffsetInLine).toBe(0);
    expect(matches[1]!.secondArg).toBe("B");
    expect(matches[1]!.startOffsetInLine).toBe(22);
  });

  it("gives distinct startOffsetInLine for identical macros on one line", () => {
    const md = '{{glossary("x")}} {{glossary("x")}}';
    const matches = scanGlossaryMacrosInText(md);
    expect(matches).toHaveLength(2);
    expect(matches[0]!.startOffsetInLine).toBe(0);
    expect(matches[1]!.startOffsetInLine).toBe(18);
    expect(matches[0]!.raw).toBe(matches[1]!.raw);
  });

  it("parses escaped quotes inside strings", () => {
    const md = String.raw`{{glossary("say \"hi\"")}}`;
    const matches = scanGlossaryMacrosInText(md);
    expect(matches).toHaveLength(1);
    expect(matches[0]!.firstArg).toBe('say "hi"');
  });

  it("does not treat incomplete syntax as a match", () => {
    const md = "{{glossary(bare)}} {{glossary(\"ok\")}}";
    const matches = scanGlossaryMacrosInText(md);
    expect(matches).toHaveLength(1);
    expect(matches[0]!.firstArg).toBe("ok");
  });
});

describe("runMdnGlossaryMacroScan", () => {
  beforeEach(() => {
    delete process.env[ENV_MDN_CONTENT_ROOT];
    delete process.env[ENV_MDN_TRANSLATED_CONTENT_ROOT];
  });

  afterEach(() => {
    delete process.env[ENV_MDN_CONTENT_ROOT];
    delete process.env[ENV_MDN_TRANSLATED_CONTENT_ROOT];
  });

  async function makeWorkspace(): Promise<{
    parent: string;
    packageRoot: string;
    jaIndexPath: string;
  }> {
    const parent = await fs.mkdtemp(
      path.join(os.tmpdir(), "mdn-glossary-scan-"),
    );
    const packageRoot = path.join(parent, "mdn-translation-ja-mcp");
    const contentRoot = path.join(parent, "content");
    const translatedRoot = path.join(parent, "translated-content");
    await fs.mkdir(packageRoot, { recursive: true });
    await fs.mkdir(contentRoot, { recursive: true });
    await fs.mkdir(translatedRoot, { recursive: true });
    await fs.mkdir(path.join(contentRoot, "files", "en-us"), {
      recursive: true,
    });

    const jaRel = ["files", "ja", "glossary", "jit"];
    const jaDir = path.join(translatedRoot, ...jaRel);
    await fs.mkdir(jaDir, { recursive: true });
    const jaIndexPath = path.join(jaDir, "index.md");
    await fs.writeFile(
      jaIndexPath,
      '# t\n\n{{glossary("compile")}}\n',
      "utf8",
    );

    process.env[ENV_MDN_CONTENT_ROOT] = contentRoot;
    process.env[ENV_MDN_TRANSLATED_CONTENT_ROOT] = translatedRoot;

    return { parent, packageRoot, jaIndexPath };
  }

  it("returns matches from resolved Japanese index.md", async () => {
    const { parent, packageRoot, jaIndexPath } = await makeWorkspace();
    try {
      const url = "https://developer.mozilla.org/docs/Glossary/JIT";
      const result = await runMdnGlossaryMacroScan({ url, packageRoot });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok");
      expect(result.jaIndexPath).toBe(jaIndexPath);
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0]).toMatchObject({
        line: 3,
        firstArg: "compile",
        hasSecondArg: false,
      });
    } finally {
      await fs.rm(parent, { recursive: true, force: true });
    }
  });

  it("returns TRANSLATION_MISSING when ja file does not exist", async () => {
    const parent = await fs.mkdtemp(
      path.join(os.tmpdir(), "mdn-glossary-scan-miss-"),
    );
    const packageRoot = path.join(parent, "mdn-translation-ja-mcp");
    const contentRoot = path.join(parent, "content");
    const translatedRoot = path.join(parent, "translated-content");
    await fs.mkdir(packageRoot, { recursive: true });
    await fs.mkdir(contentRoot, { recursive: true });
    await fs.mkdir(translatedRoot, { recursive: true });
    await fs.mkdir(path.join(contentRoot, "files", "en-us"), {
      recursive: true,
    });
    await fs.mkdir(path.join(translatedRoot, "files", "ja"), {
      recursive: true,
    });
    process.env[ENV_MDN_CONTENT_ROOT] = contentRoot;
    process.env[ENV_MDN_TRANSLATED_CONTENT_ROOT] = translatedRoot;

    try {
      const url = "https://developer.mozilla.org/docs/Web/API/Fetch_API";
      const result = await runMdnGlossaryMacroScan({ url, packageRoot });
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("expected error");
      expect(result.code).toBe("TRANSLATION_MISSING");
    } finally {
      await fs.rm(parent, { recursive: true, force: true });
    }
  });
});
