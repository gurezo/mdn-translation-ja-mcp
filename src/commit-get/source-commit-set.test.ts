import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runMdnTransSourceCommitSet } from "./source-commit-set.js";
import {
  ENV_MDN_CONTENT_ROOT,
  ENV_MDN_TRANSLATED_CONTENT_ROOT,
} from "../shared/workspace.js";

const MOCK_SOURCE_COMMIT = "2547f622337d6cbf8c3794776b17ed377d6aad57";
const OLD_SOURCE_COMMIT = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

function mockGitLog() {
  return async () => ({
    stdout: `${MOCK_SOURCE_COMMIT}\n`,
    stderr: "",
  });
}

describe("runMdnTransSourceCommitSet", () => {
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
    packageRoot: string;
    contentRoot: string;
    translatedRoot: string;
  }> {
    const parent = await fs.mkdtemp(
      path.join(os.tmpdir(), "mdn-source-commit-set-"),
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
    return { packageRoot, contentRoot, translatedRoot };
  }

  it("writes l10n.sourceCommit into existing ja index.md", async () => {
    const { packageRoot, contentRoot, translatedRoot } = await makeWorkspace();
    const slugPath = ["glossary", "jit"];
    const enRel = ["files", "en-us", ...slugPath, "index.md"];
    const jaRel = ["files", "ja", ...slugPath, "index.md"];
    await fs.mkdir(path.dirname(path.join(contentRoot, ...enRel)), {
      recursive: true,
    });
    await fs.mkdir(path.dirname(path.join(translatedRoot, ...jaRel)), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(contentRoot, ...enRel),
      `---
title: JIT
slug: Glossary/JIT
---

# EN
`,
      "utf8",
    );
    const jaPath = path.join(translatedRoot, ...jaRel);
    await fs.writeFile(
      jaPath,
      `---
title: 実行時
slug: Glossary/JIT
---

# 日本語
`,
      "utf8",
    );

    const result = await runMdnTransSourceCommitSet({
      url: "https://developer.mozilla.org/docs/Glossary/JIT",
      packageRoot,
      gitLog: mockGitLog(),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.sourceCommit).toBe(MOCK_SOURCE_COMMIT);
    expect(result.written).toBe(true);
    const out = await fs.readFile(jaPath, "utf8");
    expect(out).toContain(`sourceCommit: ${MOCK_SOURCE_COMMIT}`);
    expect(out).toContain("# 日本語");
  });

  it("overwrites stale l10n.sourceCommit in existing ja index.md", async () => {
    const { packageRoot, contentRoot, translatedRoot } = await makeWorkspace();
    const slugPath = ["glossary", "jit"];
    const enRel = ["files", "en-us", ...slugPath, "index.md"];
    const jaRel = ["files", "ja", ...slugPath, "index.md"];
    await fs.mkdir(path.dirname(path.join(contentRoot, ...enRel)), {
      recursive: true,
    });
    await fs.mkdir(path.dirname(path.join(translatedRoot, ...jaRel)), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(contentRoot, ...enRel),
      `---
title: JIT
slug: Glossary/JIT
---

# EN
`,
      "utf8",
    );
    const jaPath = path.join(translatedRoot, ...jaRel);
    await fs.writeFile(
      jaPath,
      `---
title: 実行時
slug: Glossary/JIT
l10n:
  sourceCommit: ${OLD_SOURCE_COMMIT}
---

# 日本語
`,
      "utf8",
    );

    const result = await runMdnTransSourceCommitSet({
      url: "https://developer.mozilla.org/docs/Glossary/JIT",
      packageRoot,
      gitLog: mockGitLog(),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.sourceCommit).toBe(MOCK_SOURCE_COMMIT);
    const out = await fs.readFile(jaPath, "utf8");
    expect(out).toContain(`sourceCommit: ${MOCK_SOURCE_COMMIT}`);
    expect(out).not.toContain(OLD_SOURCE_COMMIT);
  });

  it("returns TRANSLATION_MISSING when ja index.md does not exist", async () => {
    const { packageRoot, contentRoot } = await makeWorkspace();
    const enRel = ["files", "en-us", "web", "api", "fetch_api", "index.md"];
    await fs.mkdir(path.dirname(path.join(contentRoot, ...enRel)), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(contentRoot, ...enRel),
      `---
title: Fetch API
slug: Web/API/Fetch_API
---
`,
      "utf8",
    );

    const result = await runMdnTransSourceCommitSet({
      url: "https://developer.mozilla.org/docs/Web/API/Fetch_API",
      packageRoot,
      gitLog: mockGitLog(),
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("TRANSLATION_MISSING");
  });

  it("does not write when dryRun is true", async () => {
    const { packageRoot, contentRoot, translatedRoot } = await makeWorkspace();
    const enRel = ["files", "en-us", "learn", "index.md"];
    const jaRel = ["files", "ja", "learn", "index.md"];
    await fs.mkdir(path.dirname(path.join(contentRoot, ...enRel)), {
      recursive: true,
    });
    await fs.mkdir(path.dirname(path.join(translatedRoot, ...jaRel)), {
      recursive: true,
    });
    await fs.writeFile(
      path.join(contentRoot, ...enRel),
      `---
title: Learn
slug: Learn
---
`,
      "utf8",
    );
    const jaPath = path.join(translatedRoot, ...jaRel);
    const before = `---
title: 学ぶ
slug: Learn
---

# 旧
`;
    await fs.writeFile(jaPath, before, "utf8");

    const result = await runMdnTransSourceCommitSet({
      url: "https://developer.mozilla.org/docs/Learn",
      packageRoot,
      dryRun: true,
      gitLog: mockGitLog(),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.written).toBe(false);
    expect(await fs.readFile(jaPath, "utf8")).toBe(before);
  });
});
