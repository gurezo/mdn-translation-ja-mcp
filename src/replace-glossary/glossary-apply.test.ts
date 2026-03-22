import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runMdnGlossaryApply } from "./glossary-apply.js";
import { ENV_MDN_GLOSSARY_JSON } from "../shared/glossary-loader.js";
import {
  ENV_MDN_CONTENT_ROOT,
  ENV_MDN_TRANSLATED_CONTENT_ROOT,
} from "../shared/workspace.js";

describe("runMdnGlossaryApply", () => {
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
      path.join(os.tmpdir(), "mdn-glossary-apply-"),
    );
    const packageRoot = path.join(parent, "mdn-translation-ja-mcp");
    const contentRoot = path.join(parent, "content");
    const translatedRoot = path.join(parent, "translated-content");
    await fs.mkdir(packageRoot, { recursive: true });
    await fs.mkdir(contentRoot, { recursive: true });
    await fs.mkdir(translatedRoot, { recursive: true });

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

  it("dry_run does not modify the file", async () => {
    const glossaryParent = await fs.mkdtemp(
      path.join(os.tmpdir(), "mdn-glossary-apply-dry-"),
    );
    try {
      const glossaryPath = await writeGlossary(glossaryParent, {
        compile: { secondArg: "Compile (コンパイル)" },
      });
      const mdBefore = '# t\n\n{{glossary("compile")}}\n';
      const { parent, packageRoot, jaIndexPath } =
        await makeWorkspace(mdBefore);

      const url = "https://developer.mozilla.org/docs/Glossary/JIT";
      const result = await runMdnGlossaryApply({
        url,
        packageRoot,
        glossaryPath,
        dryRun: true,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok");
      expect(result.written).toBe(false);
      expect(result.applied).toHaveLength(1);
      const after = await fs.readFile(jaIndexPath, "utf8");
      expect(after).toBe(mdBefore);

      await fs.rm(parent, { recursive: true, force: true });
    } finally {
      await fs.rm(glossaryParent, { recursive: true, force: true });
    }
  });

  it("replaces only proposed macros and leaves already_set and missing", async () => {
    const glossaryParent = await fs.mkdtemp(
      path.join(os.tmpdir(), "mdn-glossary-apply-mix-"),
    );
    try {
      const glossaryPath = await writeGlossary(glossaryParent, {
        compile: { secondArg: "Compile (コンパイル)" },
      });
      const mdBefore =
        '# t\n\n{{glossary("compile")}}\n{{glossary("unknown")}}\n{{glossary("compile", "既存")}}\n';
      const { parent, packageRoot, jaIndexPath } =
        await makeWorkspace(mdBefore);

      const url = "https://developer.mozilla.org/docs/Glossary/JIT";
      const result = await runMdnGlossaryApply({
        url,
        packageRoot,
        glossaryPath,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok");
      expect(result.written).toBe(true);
      expect(result.skippedCount).toEqual({ alreadySet: 1, missing: 1 });

      const after = await fs.readFile(jaIndexPath, "utf8");
      expect(after).toContain(
        '{{glossary("compile", "Compile (コンパイル)")}}',
      );
      expect(after).toContain('{{glossary("unknown")}}');
      expect(after).toContain('{{glossary("compile", "既存")}}');

      await fs.rm(parent, { recursive: true, force: true });
    } finally {
      await fs.rm(glossaryParent, { recursive: true, force: true });
    }
  });

  it("replaces two identical single-arg macros on one line at correct offsets", async () => {
    const glossaryParent = await fs.mkdtemp(
      path.join(os.tmpdir(), "mdn-glossary-apply-dup-"),
    );
    try {
      const glossaryPath = await writeGlossary(glossaryParent, {
        x: { secondArg: "X (エックス)" },
      });
      const mdBefore = '# t\n\n{{glossary("x")}} {{glossary("x")}}\n';
      const { parent, packageRoot, jaIndexPath } =
        await makeWorkspace(mdBefore);

      const url = "https://developer.mozilla.org/docs/Glossary/JIT";
      const result = await runMdnGlossaryApply({
        url,
        packageRoot,
        glossaryPath,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok");
      expect(result.applied).toHaveLength(2);

      const after = await fs.readFile(jaIndexPath, "utf8");
      const expected =
        '{{glossary("x", "X (エックス)")}} {{glossary("x", "X (エックス)")}}';
      expect(after).toContain(expected);

      await fs.rm(parent, { recursive: true, force: true });
    } finally {
      await fs.rm(glossaryParent, { recursive: true, force: true });
    }
  });

  it("returns ok with no writes when nothing is proposed", async () => {
    const glossaryParent = await fs.mkdtemp(
      path.join(os.tmpdir(), "mdn-glossary-apply-empty-"),
    );
    try {
      const glossaryPath = await writeGlossary(glossaryParent, {
        compile: { secondArg: "Compile (コンパイル)" },
      });
      const mdBefore = '{{glossary("compile", "手動")}}\n';
      const { parent, packageRoot, jaIndexPath } =
        await makeWorkspace(mdBefore);

      const url = "https://developer.mozilla.org/docs/Glossary/JIT";
      const result = await runMdnGlossaryApply({
        url,
        packageRoot,
        glossaryPath,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok");
      expect(result.written).toBe(false);
      expect(result.applied).toHaveLength(0);
      const after = await fs.readFile(jaIndexPath, "utf8");
      expect(after).toBe(mdBefore);

      await fs.rm(parent, { recursive: true, force: true });
    } finally {
      await fs.rm(glossaryParent, { recursive: true, force: true });
    }
  });
});
