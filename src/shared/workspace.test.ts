import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ENV_MDN_CONTENT_ROOT,
  ENV_MDN_TRANSLATED_CONTENT_ROOT,
  resolveMdnWorkspacePaths,
} from "./workspace.js";

async function makeSiblingLayout(): Promise<{
  parent: string;
  packageRoot: string;
}> {
  const parent = await fs.mkdtemp(path.join(os.tmpdir(), "mdn-ws-"));
  const packageRoot = path.join(parent, "mdn-translation-ja-mcp");
  await fs.mkdir(packageRoot, { recursive: true });
  await fs.mkdir(path.join(parent, "content", "files", "en-us"), {
    recursive: true,
  });
  await fs.mkdir(path.join(parent, "translated-content", "files", "ja"), {
    recursive: true,
  });
  return { parent, packageRoot };
}

describe("resolveMdnWorkspacePaths", () => {
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

  it("resolves sibling content and translated-content under workspace parent", async () => {
    const { packageRoot } = await makeSiblingLayout();
    const result = await resolveMdnWorkspacePaths({ packageRoot });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.paths.contentRoot).toBe(
      path.join(path.dirname(packageRoot), "content"),
    );
    expect(result.paths.translatedContentRoot).toBe(
      path.join(path.dirname(packageRoot), "translated-content"),
    );
  });

  it("returns SIBLING_MISSING when content is absent", async () => {
    const parent = await fs.mkdtemp(path.join(os.tmpdir(), "mdn-ws-"));
    const packageRoot = path.join(parent, "mdn-translation-ja-mcp");
    await fs.mkdir(packageRoot, { recursive: true });
    await fs.mkdir(path.join(parent, "translated-content"), {
      recursive: true,
    });

    const result = await resolveMdnWorkspacePaths({ packageRoot });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("SIBLING_MISSING");
    expect(result.details.missing).toContain("content");
  });

  it("returns SIBLING_MISSING when translated-content is absent", async () => {
    const parent = await fs.mkdtemp(path.join(os.tmpdir(), "mdn-ws-"));
    const packageRoot = path.join(parent, "mdn-translation-ja-mcp");
    await fs.mkdir(packageRoot, { recursive: true });
    await fs.mkdir(path.join(parent, "content"), { recursive: true });

    const result = await resolveMdnWorkspacePaths({ packageRoot });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("SIBLING_MISSING");
    expect(result.details.missing).toContain("translated-content");
  });

  it("returns NOT_DIRECTORY when a path exists but is not a directory", async () => {
    const { packageRoot, parent } = await makeSiblingLayout();
    await fs.rm(path.join(parent, "content"), { recursive: true });
    await fs.writeFile(path.join(parent, "content"), "not-a-dir", "utf8");

    const result = await resolveMdnWorkspacePaths({ packageRoot });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("NOT_DIRECTORY");
    expect(result.details.notDirectory).toContain("content");
  });

  it("uses MDN_CONTENT_ROOT and MDN_TRANSLATED_CONTENT_ROOT when both are set", async () => {
    const parent = await fs.mkdtemp(path.join(os.tmpdir(), "mdn-ws-"));
    const c = path.join(parent, "c");
    const t = path.join(parent, "t");
    await fs.mkdir(path.join(c, "files", "en-us"), { recursive: true });
    await fs.mkdir(path.join(t, "files", "ja"), { recursive: true });

    vi.stubEnv(ENV_MDN_CONTENT_ROOT, c);
    vi.stubEnv(ENV_MDN_TRANSLATED_CONTENT_ROOT, t);

    const result = await resolveMdnWorkspacePaths({
      packageRoot: path.join(parent, "unused-mcp"),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.paths.contentRoot).toBe(c);
    expect(result.paths.translatedContentRoot).toBe(t);
  });

  it("returns ENV_PARTIAL when only MDN_CONTENT_ROOT is set", async () => {
    vi.stubEnv(ENV_MDN_CONTENT_ROOT, "/tmp/foo");
    const result = await resolveMdnWorkspacePaths({
      packageRoot: path.join(os.tmpdir(), "fake-mcp"),
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("ENV_PARTIAL");
  });

  it("returns ENV_PARTIAL when only MDN_TRANSLATED_CONTENT_ROOT is set", async () => {
    vi.stubEnv(ENV_MDN_TRANSLATED_CONTENT_ROOT, "/tmp/bar");
    const result = await resolveMdnWorkspacePaths({
      packageRoot: path.join(os.tmpdir(), "fake-mcp"),
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("ENV_PARTIAL");
  });

  it("returns INVALID_MDN_LAYOUT when files/en-us is missing under content root", async () => {
    const parent = await fs.mkdtemp(path.join(os.tmpdir(), "mdn-ws-"));
    const packageRoot = path.join(parent, "mdn-translation-ja-mcp");
    await fs.mkdir(packageRoot, { recursive: true });
    await fs.mkdir(path.join(parent, "content"), { recursive: true });
    await fs.mkdir(path.join(parent, "translated-content", "files", "ja"), {
      recursive: true,
    });

    const result = await resolveMdnWorkspacePaths({ packageRoot });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("INVALID_MDN_LAYOUT");
    if (result.code !== "INVALID_MDN_LAYOUT") throw new Error("unexpected code");
    expect(result.details.layoutInvalid).toContain("content-files-en-us");
    expect(result.details.expectedContentFilesEnUs).toBe(
      path.join(parent, "content", "files", "en-us"),
    );
  });

  it("returns INVALID_MDN_LAYOUT when files/ja is missing under translated-content root", async () => {
    const parent = await fs.mkdtemp(path.join(os.tmpdir(), "mdn-ws-"));
    const packageRoot = path.join(parent, "mdn-translation-ja-mcp");
    await fs.mkdir(packageRoot, { recursive: true });
    await fs.mkdir(path.join(parent, "content", "files", "en-us"), {
      recursive: true,
    });
    await fs.mkdir(path.join(parent, "translated-content"), { recursive: true });

    const result = await resolveMdnWorkspacePaths({ packageRoot });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("INVALID_MDN_LAYOUT");
    if (result.code !== "INVALID_MDN_LAYOUT") throw new Error("unexpected code");
    expect(result.details.layoutInvalid).toContain("translated-files-ja");
  });

  it("returns INVALID_MDN_LAYOUT when both layout paths are missing", async () => {
    const { packageRoot } = await makeSiblingLayout();
    const parent = path.dirname(packageRoot);
    await fs.rm(path.join(parent, "content", "files", "en-us"), {
      recursive: true,
    });
    await fs.rm(path.join(parent, "translated-content", "files", "ja"), {
      recursive: true,
    });

    const result = await resolveMdnWorkspacePaths({ packageRoot });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("INVALID_MDN_LAYOUT");
    if (result.code !== "INVALID_MDN_LAYOUT") throw new Error("unexpected code");
    expect(result.details.layoutInvalid).toEqual(
      expect.arrayContaining([
        "content-files-en-us",
        "translated-files-ja",
      ]),
    );
  });
});
