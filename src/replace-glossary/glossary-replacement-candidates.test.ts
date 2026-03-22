import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  buildSuggestedGlossaryMacro,
  runMdnGlossaryReplacementCandidates,
} from "./glossary-replacement-candidates.js";
import { ENV_MDN_GLOSSARY_JSON } from "../shared/glossary-loader.js";
import {
  ENV_MDN_CONTENT_ROOT,
  ENV_MDN_TRANSLATED_CONTENT_ROOT,
} from "../shared/workspace.js";

describe("buildSuggestedGlossaryMacro", () => {
  it("builds macro with escaped quotes in args", () => {
    expect(
      buildSuggestedGlossaryMacro("glossary", 'say "hi"', "A (「引用」)"),
    ).toBe(String.raw`{{glossary("say \"hi\"", "A (「引用」)")}}`);
  });
});

describe("runMdnGlossaryReplacementCandidates", () => {
  beforeEach(() => {
    delete process.env[ENV_MDN_GLOSSARY_JSON];
  });

  afterEach(() => {
    delete process.env[ENV_MDN_CONTENT_ROOT];
    delete process.env[ENV_MDN_TRANSLATED_CONTENT_ROOT];
    delete process.env[ENV_MDN_GLOSSARY_JSON];
  });

  async function makeWorkspace(mdBody: string): Promise<{
    parent: string;
    packageRoot: string;
    jaIndexPath: string;
  }> {
    const parent = await fs.mkdtemp(
      path.join(os.tmpdir(), "mdn-glossary-cand-"),
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
    await fs.writeFile(jaIndexPath, mdBody, "utf8");

    process.env[ENV_MDN_CONTENT_ROOT] = contentRoot;
    process.env[ENV_MDN_TRANSLATED_CONTENT_ROOT] = translatedRoot;

    return { parent, packageRoot, jaIndexPath };
  }

  async function writeGlossary(
    parent: string,
    terms: Record<string, { secondArg: string }>,
  ): Promise<string> {
    const p = path.join(parent, "glossary.json");
    await fs.writeFile(
      p,
      JSON.stringify({ terms }, null, 2),
      "utf8",
    );
    return p;
  }

  it("returns proposed and missing candidates from custom glossary", async () => {
    const parent = await fs.mkdtemp(
      path.join(os.tmpdir(), "mdn-glossary-cand-mix-"),
    );
    try {
      const glossaryPath = await writeGlossary(parent, {
        compile: { secondArg: "Compile (コンパイル)" },
      });
      const { parent: wsParent, packageRoot } = await makeWorkspace(
        '# t\n\n{{glossary("compile")}}\n{{glossary("unknown")}}\n',
      );

      const url = "https://developer.mozilla.org/docs/Glossary/JIT";
      const result = await runMdnGlossaryReplacementCandidates({
        url,
        packageRoot,
        glossaryPath,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok");
      expect(result.candidates).toHaveLength(2);
      expect(result.candidates[0]).toMatchObject({
        status: "proposed",
        firstArg: "compile",
        suggestedSecondArg: "Compile (コンパイル)",
        suggestedRaw:
          '{{glossary("compile", "Compile (コンパイル)")}}',
      });
      expect(result.candidates[1]).toMatchObject({
        status: "missing",
        firstArg: "unknown",
      });

      await fs.rm(wsParent, { recursive: true, force: true });
    } finally {
      await fs.rm(parent, { recursive: true, force: true });
    }
  });

  it("marks macros that already have a second argument as already_set", async () => {
    const parent = await fs.mkdtemp(
      path.join(os.tmpdir(), "mdn-glossary-cand-second-"),
    );
    try {
      const glossaryPath = await writeGlossary(parent, {
        compile: { secondArg: "Compile (コンパイル)" },
      });
      const { parent: wsParent, packageRoot } = await makeWorkspace(
        '{{glossary("compile", "既存")}}\n',
      );

      const url = "https://developer.mozilla.org/docs/Glossary/JIT";
      const result = await runMdnGlossaryReplacementCandidates({
        url,
        packageRoot,
        glossaryPath,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok");
      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0]).toMatchObject({
        status: "already_set",
        firstArg: "compile",
      });

      await fs.rm(wsParent, { recursive: true, force: true });
    } finally {
      await fs.rm(parent, { recursive: true, force: true });
    }
  });

  it("returns glossary load error when JSON is invalid", async () => {
    const parent = await fs.mkdtemp(
      path.join(os.tmpdir(), "mdn-glossary-cand-badjson-"),
    );
    try {
      const badPath = path.join(parent, "bad.json");
      await fs.writeFile(badPath, "{", "utf8");

      const { parent: wsParent, packageRoot } = await makeWorkspace(
        '{{glossary("x")}}\n',
      );

      const url = "https://developer.mozilla.org/docs/Glossary/JIT";
      const result = await runMdnGlossaryReplacementCandidates({
        url,
        packageRoot,
        glossaryPath: badPath,
      });

      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("expected error");
      expect(result.code).toBe("GLOSSARY_INVALID");

      await fs.rm(wsParent, { recursive: true, force: true });
    } finally {
      await fs.rm(parent, { recursive: true, force: true });
    }
  });
});
