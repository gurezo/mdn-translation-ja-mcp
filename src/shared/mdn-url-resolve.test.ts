import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildContentPaths,
  normalizeSlugSegments,
  parseMdnDocsUrl,
  resolveMdnPageFromUrl,
} from "./mdn-url-resolve.js";
import {
  ENV_MDN_CONTENT_ROOT,
  ENV_MDN_TRANSLATED_CONTENT_ROOT,
} from "./workspace.js";

describe("parseMdnDocsUrl", () => {
  it("parses ja locale and slug segments", () => {
    const r = parseMdnDocsUrl(
      "https://developer.mozilla.org/ja/docs/Web/API/Fetch_API",
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("expected ok");
    expect(r.locale).toBe("ja");
    expect(r.slugSegments).toEqual(["Web", "API", "Fetch_API"]);
  });

  it("parses en-US locale", () => {
    const r = parseMdnDocsUrl(
      "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API",
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("expected ok");
    expect(r.locale).toBe("en-US");
    expect(r.slugSegments).toEqual(["Web", "API", "Fetch_API"]);
  });

  it("defaults locale to en-US when path is /docs/...", () => {
    const r = parseMdnDocsUrl(
      "https://developer.mozilla.org/docs/Web/API/Fetch_API",
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("expected ok");
    expect(r.locale).toBe("en-US");
    expect(r.slugSegments).toEqual(["Web", "API", "Fetch_API"]);
  });

  it("accepts www host", () => {
    const r = parseMdnDocsUrl(
      "https://www.developer.mozilla.org/ja/docs/Glossary/JIT",
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("expected ok");
    expect(r.slugSegments).toEqual(["Glossary", "JIT"]);
  });

  it("ignores trailing slash in pathname", () => {
    const r = parseMdnDocsUrl(
      "https://developer.mozilla.org/ja/docs/Web/API/Window/",
    );
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error("expected ok");
    expect(r.slugSegments).toEqual(["Web", "API", "Window"]);
  });

  it("returns INVALID_HOST for other sites", () => {
    const r = parseMdnDocsUrl("https://example.com/ja/docs/Web/API");
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("expected error");
    expect(r.code).toBe("INVALID_HOST");
  });

  it("returns NO_DOCS_SEGMENT when /docs/ is missing", () => {
    const r = parseMdnDocsUrl("https://developer.mozilla.org/ja/Web/API");
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("expected error");
    expect(r.code).toBe("NO_DOCS_SEGMENT");
  });

  it("returns EMPTY_SLUG for /docs only", () => {
    const r = parseMdnDocsUrl("https://developer.mozilla.org/ja/docs");
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("expected error");
    expect(r.code).toBe("EMPTY_SLUG");
  });

  it("returns INVALID_PATH when extra segments precede locale", () => {
    const r = parseMdnDocsUrl(
      "https://developer.mozilla.org/foo/ja/docs/Web/API",
    );
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("expected error");
    expect(r.code).toBe("INVALID_PATH");
  });
});

describe("normalizeSlugSegments", () => {
  it("lowercases each segment and joins with slash", () => {
    expect(normalizeSlugSegments(["Web", "API", "Fetch_API"])).toBe(
      "web/api/fetch_api",
    );
  });
});

describe("buildContentPaths", () => {
  it("builds en-us and ja index paths under workspace roots", () => {
    const ws = {
      contentRoot: "/a/content",
      translatedContentRoot: "/b/translated-content",
    };
    const { enUsIndexPath, jaIndexPath } = buildContentPaths(
      ws,
      "web/api/fetch_api",
    );
    expect(enUsIndexPath).toBe(
      path.join(
        "/a/content",
        "files",
        "en-us",
        "web",
        "api",
        "fetch_api",
        "index.md",
      ),
    );
    expect(jaIndexPath).toBe(
      path.join(
        "/b/translated-content",
        "files",
        "ja",
        "web",
        "api",
        "fetch_api",
        "index.md",
      ),
    );
  });
});

describe("resolveMdnPageFromUrl", () => {
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
    const parent = await fs.mkdtemp(path.join(os.tmpdir(), "mdn-url-"));
    const packageRoot = path.join(parent, "mdn-translation-ja-mcp");
    const contentRoot = path.join(parent, "content");
    const translatedRoot = path.join(parent, "translated-content");
    await fs.mkdir(packageRoot, { recursive: true });
    await fs.mkdir(contentRoot, { recursive: true });
    await fs.mkdir(translatedRoot, { recursive: true });
    await fs.mkdir(path.join(contentRoot, "files", "en-us"), { recursive: true });
    await fs.mkdir(path.join(translatedRoot, "files", "ja"), { recursive: true });
    return { parent, packageRoot, contentRoot, translatedRoot };
  }

  it("resolves paths for representative ja URL and reports translationExists", async () => {
    const { packageRoot, contentRoot, translatedRoot } = await makeWorkspace();
    const rel = ["files", "en-us", "web", "api", "fetch_api", "index.md"];
    const jaRel = ["files", "ja", "web", "api", "fetch_api", "index.md"];
    await fs.mkdir(path.dirname(path.join(contentRoot, ...rel)), {
      recursive: true,
    });
    await fs.writeFile(path.join(contentRoot, ...rel), "# en\n", "utf8");
    await fs.mkdir(path.dirname(path.join(translatedRoot, ...jaRel)), {
      recursive: true,
    });
    await fs.writeFile(path.join(translatedRoot, ...jaRel), "# ja\n", "utf8");

    const result = await resolveMdnPageFromUrl(
      "https://developer.mozilla.org/ja/docs/Web/API/Fetch_API",
      { packageRoot },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.locale).toBe("ja");
    expect(result.normalizedSlug).toBe("web/api/fetch_api");
    expect(result.translationExists).toBe(true);
    expect(result.enUsIndexPath).toBe(path.join(contentRoot, ...rel));
    expect(result.jaIndexPath).toBe(path.join(translatedRoot, ...jaRel));
  });

  it("matches same paths for en-US URL as ja URL for same document", async () => {
    const { packageRoot, contentRoot, translatedRoot } = await makeWorkspace();
    const rel = ["files", "en-us", "web", "api", "window", "index.md"];
    await fs.mkdir(path.dirname(path.join(contentRoot, ...rel)), {
      recursive: true,
    });
    await fs.writeFile(path.join(contentRoot, ...rel), "# en\n", "utf8");

    const jaPath = path.join(
      translatedRoot,
      "files",
      "ja",
      "web",
      "api",
      "window",
      "index.md",
    );
    await fs.mkdir(path.dirname(jaPath), { recursive: true });
    await fs.writeFile(jaPath, "# ja\n", "utf8");

    const en = await resolveMdnPageFromUrl(
      "https://developer.mozilla.org/en-US/docs/Web/API/Window",
      { packageRoot },
    );
    const ja = await resolveMdnPageFromUrl(
      "https://developer.mozilla.org/ja/docs/Web/API/Window",
      { packageRoot },
    );
    expect(en.ok && ja.ok).toBe(true);
    if (!en.ok || !ja.ok) throw new Error("expected ok");
    expect(en.enUsIndexPath).toBe(ja.enUsIndexPath);
    expect(en.jaIndexPath).toBe(ja.jaIndexPath);
    expect(en.translationExists).toBe(true);
    expect(ja.translationExists).toBe(true);
  });

  it("sets translationExists false when ja index.md is missing", async () => {
    const { packageRoot, contentRoot } = await makeWorkspace();
    const rel = ["files", "en-us", "learn", "index.md"];
    await fs.mkdir(path.dirname(path.join(contentRoot, ...rel)), {
      recursive: true,
    });
    await fs.writeFile(path.join(contentRoot, ...rel), "# en\n", "utf8");

    const result = await resolveMdnPageFromUrl(
      "https://developer.mozilla.org/docs/Learn",
      { packageRoot },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.translationExists).toBe(false);
  });

  it("returns workspace error when content is missing", async () => {
    const parent = await fs.mkdtemp(path.join(os.tmpdir(), "mdn-url-"));
    const packageRoot = path.join(parent, "mdn-translation-ja-mcp");
    await fs.mkdir(packageRoot, { recursive: true });
    await fs.mkdir(path.join(parent, "translated-content"), {
      recursive: true,
    });

    const result = await resolveMdnPageFromUrl(
      "https://developer.mozilla.org/ja/docs/Web/API/Fetch_API",
      { packageRoot },
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.code).toBe("SIBLING_MISSING");
  });
});
