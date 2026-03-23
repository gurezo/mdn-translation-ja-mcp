/**
 * MDN ページ URL から locale・slug を取り出し、ローカル content / translated-content の index.md パスへ解決する。
 */
import fs from "node:fs/promises";
import path from "node:path";

import type {
  MdnWorkspacePaths,
  ResolveWorkspaceErrorCode,
} from "./workspace.js";
import { resolveMdnWorkspacePaths } from "./workspace.js";

const ALLOWED_HOSTS = new Set([
  "developer.mozilla.org",
  "www.developer.mozilla.org",
]);

/** MDN URL パース時の失敗コード。 */
export type ParseMdnDocsUrlErrorCode =
  | "INVALID_URL"
  | "INVALID_HOST"
  | "NO_DOCS_SEGMENT"
  | "EMPTY_SLUG"
  | "INVALID_PATH";

/** MDN URL 解析結果。 */
export type ParseMdnDocsUrlResult =
  | { ok: true; locale: string; slugSegments: string[] }
  | {
      ok: false;
      code: ParseMdnDocsUrlErrorCode;
      message: string;
    };

/**
 * pathname から `/docs/` 以降の slug と、locale（パス上の先頭セグメント）を取得する。
 * `https://developer.mozilla.org/docs/...` のように locale が無い場合は locale を `en-US` とする。
 */
export function parseMdnDocsUrl(urlString: string): ParseMdnDocsUrlResult {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return {
      ok: false,
      code: "INVALID_URL",
      message: "URL の形式が不正です。",
    };
  }

  const host = url.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) {
    return {
      ok: false,
      code: "INVALID_HOST",
      message: "developer.mozilla.org（または www）の URL のみ対応しています。",
    };
  }

  const segments = url.pathname.split("/").filter(Boolean);
  const docsIdx = segments.indexOf("docs");
  if (docsIdx === -1) {
    return {
      ok: false,
      code: "NO_DOCS_SEGMENT",
      message: "パスに /docs/ が含まれていません。",
    };
  }

  if (docsIdx > 1) {
    return {
      ok: false,
      code: "INVALID_PATH",
      message: "/docs/ の前のパス形式が想定外です。",
    };
  }

  const slugSegments = segments.slice(docsIdx + 1);
  if (slugSegments.length === 0) {
    return {
      ok: false,
      code: "EMPTY_SLUG",
      message: "/docs/ 以降にドキュメントパスがありません。",
    };
  }

  const locale = docsIdx === 0 ? "en-US" : segments[0]!;

  return { ok: true, locale, slugSegments };
}

/**
 * MDN リポジトリのディレクトリ名に合わせ、各セグメントを小文字化する。
 */
export function normalizeSlugSegments(slugSegments: string[]): string {
  return slugSegments.map((s) => s.toLowerCase()).join("/");
}

/** 正規化済み slug から `content` / `translated-content` 側の index.md パスを生成する。 */
export function buildContentPaths(
  workspace: MdnWorkspacePaths,
  normalizedSlugPath: string,
): { enUsIndexPath: string; jaIndexPath: string } {
  const enUsIndexPath = path.join(
    workspace.contentRoot,
    "files",
    "en-us",
    ...normalizedSlugPath.split("/"),
    "index.md",
  );
  const jaIndexPath = path.join(
    workspace.translatedContentRoot,
    "files",
    "ja",
    ...normalizedSlugPath.split("/"),
    "index.md",
  );
  return { enUsIndexPath, jaIndexPath };
}

async function pathIsExistingRegularFile(absolutePath: string): Promise<boolean> {
  try {
    const st = await fs.stat(absolutePath);
    return st.isFile();
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return false;
    throw e;
  }
}

/** URL からページ解決する API の失敗コード。 */
export type ResolveMdnPageFromUrlErrorCode =
  | ParseMdnDocsUrlErrorCode
  | ResolveWorkspaceErrorCode;

/** URL からローカル翻訳対象を解決した結果。 */
export type ResolveMdnPageFromUrlResult =
  | {
      ok: true;
      locale: string;
      normalizedSlug: string;
      enUsIndexPath: string;
      jaIndexPath: string;
      /** `content/files/en-us/.../index.md` がローカルに存在し通常ファイルである */
      sourceExists: boolean;
      translationExists: boolean;
    }
  | {
      ok: false;
      code: string;
      message: string;
      details?: unknown;
    };

/**
 * MDN のページ URL をローカルファイルパスへ解決する。
 *
 * @param urlString MDN ドキュメント URL
 * @param options テスト向けオプション
 */
export async function resolveMdnPageFromUrl(
  urlString: string,
  options?: {
    packageRoot?: string;
  },
): Promise<ResolveMdnPageFromUrlResult> {
  const parsed = parseMdnDocsUrl(urlString);
  if (!parsed.ok) {
    return parsed;
  }

  const normalizedSlug = normalizeSlugSegments(parsed.slugSegments);
  const ws = await resolveMdnWorkspacePaths(
    options?.packageRoot !== undefined
      ? { packageRoot: options.packageRoot }
      : undefined,
  );

  if (!ws.ok) {
    return {
      ok: false,
      code: ws.code,
      message: ws.message,
      details: ws.details,
    };
  }

  const { enUsIndexPath, jaIndexPath } = buildContentPaths(
    ws.paths,
    normalizedSlug,
  );

  const [sourceExists, translationExists] = await Promise.all([
    pathIsExistingRegularFile(enUsIndexPath),
    pathIsExistingRegularFile(jaIndexPath),
  ]);

  return {
    ok: true,
    locale: parsed.locale,
    normalizedSlug,
    enUsIndexPath,
    jaIndexPath,
    sourceExists,
    translationExists,
  };
}
