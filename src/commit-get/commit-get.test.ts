import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runMdnTransCommitGet } from "./commit-get.js";
import {
  ENV_MDN_CONTENT_ROOT,
  ENV_MDN_TRANSLATED_CONTENT_ROOT,
} from "../shared/workspace.js";

describe("runMdnTransCommitGet", () => {
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
  }> {
    const parent = await fs.mkdtemp(
      path.join(os.tmpdir(), "mdn-commit-get-"),
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
    return { packageRoot, contentRoot };
  }

  it("returns NOT_A_GIT_REPOSITORY when git stderr indicates not a repo", async () => {
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

# English
`,
      "utf8",
    );

    const err = Object.assign(new Error("Command failed"), {
      stderr: Buffer.from(
        "fatal: not a git repository (or any of the parent directories): .git\n",
      ),
    });

    const result = await runMdnTransCommitGet({
      url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API",
      packageRoot,
      gitLog: async () => {
        throw err;
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("NOT_A_GIT_REPOSITORY");
  });

  it("returns sourceCommit from git log stdout for tracked en-US index.md", async () => {
    const { packageRoot, contentRoot } = await makeWorkspace();
    const enRel = ["files", "en-us", "glossary", "jit", "index.md"];
    const fullPath = path.join(contentRoot, ...enRel);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(
      fullPath,
      `---
title: JIT
slug: Glossary/JIT
---

# Body
`,
      "utf8",
    );

    const hash = "2547f622337d6cbf8c3794776b17ed377d6aad57";

    const result = await runMdnTransCommitGet({
      url: "https://developer.mozilla.org/docs/Glossary/JIT",
      packageRoot,
      gitLog: async () => ({ stdout: `${hash}\n`, stderr: "" }),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.sourceCommit).toBe(hash);
    expect(result.enUsIndexPath).toBe(fullPath);
  });

  it("returns SOURCE_UNTRACKED when git log stdout is empty", async () => {
    const { packageRoot, contentRoot } = await makeWorkspace();
    const enRel = ["files", "en-us", "learn", "index.md"];
    const fullPath = path.join(contentRoot, ...enRel);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(
      fullPath,
      `---
title: Learn
slug: Learn
---
`,
      "utf8",
    );

    const result = await runMdnTransCommitGet({
      url: "https://developer.mozilla.org/docs/Learn",
      packageRoot,
      gitLog: async () => ({ stdout: "", stderr: "" }),
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("SOURCE_UNTRACKED");
  });

  it("returns SOURCE_MISSING when en-US index.md does not exist", async () => {
    const { packageRoot } = await makeWorkspace();

    const result = await runMdnTransCommitGet({
      url: "https://developer.mozilla.org/docs/Web/API/Window",
      packageRoot,
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("SOURCE_MISSING");
  });
});
