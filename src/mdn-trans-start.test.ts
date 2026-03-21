import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runMdnTransStart } from "./mdn-trans-start.js";
import {
  ENV_MDN_CONTENT_ROOT,
  ENV_MDN_TRANSLATED_CONTENT_ROOT,
} from "./workspace.js";

describe("runMdnTransStart", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    delete process.env[ENV_MDN_CONTENT_ROOT];
    delete process.env[ENV_MDN_TRANSLATED_CONTENT_ROOT];
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete process.env[ENV_MDN_CONTENT_ROOT];
    delete process.env[ENV_MDN_TRANSLATED_CONTENT_ROOT];
  });

  async function makeWorkspace(): Promise<{
    parent: string;
    packageRoot: string;
    contentRoot: string;
    translatedRoot: string;
  }> {
    const parent = await fs.mkdtemp(path.join(os.tmpdir(), "mdn-trans-start-"));
    const packageRoot = path.join(parent, "mdn-translation-ja-mcp");
    const contentRoot = path.join(parent, "content");
    const translatedRoot = path.join(parent, "translated-content");
    await fs.mkdir(packageRoot, { recursive: true });
    await fs.mkdir(contentRoot, { recursive: true });
    await fs.mkdir(translatedRoot, { recursive: true });
    return { parent, packageRoot, contentRoot, translatedRoot };
  }

  it("copies en-US index.md to ja when translation does not exist", async () => {
    const { packageRoot, contentRoot, translatedRoot } = await makeWorkspace();
    const enRel = ["files", "en-us", "web", "api", "fetch_api", "index.md"];
    await fs.mkdir(path.dirname(path.join(contentRoot, ...enRel)), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(contentRoot, ...enRel),
      `---
title: Fetch API
slug: Web/API/Fetch_API
page-type: guide
---

# English
body
`,
      "utf8",
    );

    const jaPath = path.join(
      translatedRoot,
      "files",
      "ja",
      "web",
      "api",
      "fetch_api",
      "index.md",
    );

    const result = await runMdnTransStart({
      url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API",
      packageRoot,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.copied).toBe(true);
    expect(result.dryRun).toBe(false);
    expect(result.jaIndexPath).toBe(jaPath);
    const jaContent = await fs.readFile(jaPath, "utf8");
    expect(jaContent).toBe(`---
title: Fetch API
slug: Web/API/Fetch_API
---

# English
body
`);
  });

  it("returns TRANSLATION_EXISTS when ja file exists and force is false", async () => {
    const { packageRoot, contentRoot, translatedRoot } = await makeWorkspace();
    const enRel = ["files", "en-us", "glossary", "jit", "index.md"];
    await fs.mkdir(path.dirname(path.join(contentRoot, ...enRel)), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(contentRoot, ...enRel),
      `---
title: JIT
slug: Glossary/JIT
---

# New EN
`,
      "utf8",
    );

    const jaRel = ["files", "ja", "glossary", "jit", "index.md"];
    await fs.mkdir(path.dirname(path.join(translatedRoot, ...jaRel)), {
      recursive: true,
    });
    await fs.writeFile(path.join(translatedRoot, ...jaRel), "# 既存\n", "utf8");

    const result = await runMdnTransStart({
      url: "https://developer.mozilla.org/ja/docs/Glossary/JIT",
      packageRoot,
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("TRANSLATION_EXISTS");

    const jaContent = await fs.readFile(
      path.join(translatedRoot, ...jaRel),
      "utf8",
    );
    expect(jaContent).toBe("# 既存\n");
  });

  it("overwrites ja when force is true", async () => {
    const { packageRoot, contentRoot, translatedRoot } = await makeWorkspace();
    const enRel = ["files", "en-us", "glossary", "jit", "index.md"];
    await fs.mkdir(path.dirname(path.join(contentRoot, ...enRel)), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(contentRoot, ...enRel),
      `---
title: JIT
slug: Glossary/JIT
---

# New EN
`,
      "utf8",
    );

    const jaRel = ["files", "ja", "glossary", "jit", "index.md"];
    await fs.mkdir(path.dirname(path.join(translatedRoot, ...jaRel)), {
      recursive: true,
    });
    await fs.writeFile(path.join(translatedRoot, ...jaRel), "# old\n", "utf8");

    const result = await runMdnTransStart({
      url: "https://developer.mozilla.org/ja/docs/Glossary/JIT",
      packageRoot,
      force: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.copied).toBe(true);
    const jaContent = await fs.readFile(
      path.join(translatedRoot, ...jaRel),
      "utf8",
    );
    expect(jaContent).toBe(`---
title: JIT
slug: Glossary/JIT
---

# New EN
`);
  });

  it("does not create files when dry_run is true", async () => {
    const { packageRoot, contentRoot, translatedRoot } = await makeWorkspace();
    const enRel = ["files", "en-us", "learn", "index.md"];
    await fs.mkdir(path.dirname(path.join(contentRoot, ...enRel)), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(contentRoot, ...enRel),
      `---
title: Learn
slug: Learn
---

# L
`,
      "utf8",
    );

    const jaPath = path.join(
      translatedRoot,
      "files",
      "ja",
      "learn",
      "index.md",
    );

    const result = await runMdnTransStart({
      url: "https://developer.mozilla.org/docs/Learn",
      packageRoot,
      dryRun: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.copied).toBe(false);
    expect(result.dryRun).toBe(true);

    await expect(fs.access(jaPath)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("returns SOURCE_MISSING when en-US index.md is missing", async () => {
    const { packageRoot } = await makeWorkspace();

    const result = await runMdnTransStart({
      url: "https://developer.mozilla.org/docs/Web/API/Window",
      packageRoot,
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("SOURCE_MISSING");
  });
});
