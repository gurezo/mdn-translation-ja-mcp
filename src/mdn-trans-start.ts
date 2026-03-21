/**
 * MDN URL から英語 index.md を translated-content/files/ja にコピーする（翻訳開始）。
 */
import fs from "node:fs/promises";
import path from "node:path";

import { resolveMdnPageFromUrl } from "./mdn-url-resolve.js";
import type { MinimizeTranslationFrontMatterErrorCode } from "./translation-front-matter.js";
import { minimizeTranslationIndexMd } from "./translation-front-matter.js";

export type MdnTransStartErrorCode =
  | "SOURCE_MISSING"
  | "SOURCE_NOT_FILE"
  | "TRANSLATION_EXISTS"
  | MinimizeTranslationFrontMatterErrorCode;

export type MdnTransStartResult =
  | {
      ok: true;
      dryRun: boolean;
      normalizedSlug: string;
      enUsIndexPath: string;
      jaIndexPath: string;
      /** dry-run 以外で実際にコピーした場合 true */
      copied: boolean;
      /** dry-run またはコピー時に作成した親ディレクトリ（既存のみの場合は空） */
      createdDirectories: string[];
    }
  | {
      ok: false;
      code: MdnTransStartErrorCode;
      message: string;
      details?: unknown;
    };

async function pathIsRegularFile(
  absolutePath: string,
): Promise<
  | { kind: "file" }
  | { kind: "missing" }
  | { kind: "not_file"; isDirectory: boolean }
> {
  try {
    const st = await fs.stat(absolutePath);
    return st.isFile()
      ? { kind: "file" }
      : { kind: "not_file", isDirectory: st.isDirectory() };
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return { kind: "missing" };
    throw e;
  }
}

export async function runMdnTransStart(options: {
  url: string;
  dryRun?: boolean;
  force?: boolean;
  packageRoot?: string;
}): Promise<MdnTransStartResult> {
  const dryRun = options.dryRun === true;
  const force = options.force === true;

  const resolved = await resolveMdnPageFromUrl(options.url, {
    packageRoot: options.packageRoot,
  });

  if (!resolved.ok) {
    return resolved;
  }

  const { normalizedSlug, enUsIndexPath, jaIndexPath, translationExists } =
    resolved;

  const enKind = await pathIsRegularFile(enUsIndexPath);
  if (enKind.kind === "missing") {
    return {
      ok: false,
      code: "SOURCE_MISSING",
      message: `英語原文が見つかりません: ${enUsIndexPath}`,
    };
  }
  if (enKind.kind === "not_file") {
    return {
      ok: false,
      code: "SOURCE_NOT_FILE",
      message: `英語原文のパスがファイルではありません: ${enUsIndexPath}`,
    };
  }

  if (translationExists && !force) {
    return {
      ok: false,
      code: "TRANSLATION_EXISTS",
      message: `日本語の index.md が既に存在します: ${jaIndexPath}。上書きする場合は force: true を指定してください。`,
      details: { jaIndexPath },
    };
  }

  const rawEn = await fs.readFile(enUsIndexPath, "utf8");
  const minimized = minimizeTranslationIndexMd(rawEn);
  if (!minimized.ok) {
    return {
      ok: false,
      code: minimized.code,
      message: minimized.message,
      details: { enUsIndexPath },
    };
  }

  const jaDir = path.dirname(jaIndexPath);
  const createdDirectories: string[] = [];

  async function jaDirExists(): Promise<boolean> {
    try {
      const st = await fs.stat(jaDir);
      return st.isDirectory();
    } catch (e: unknown) {
      const err = e as NodeJS.ErrnoException;
      if (err.code === "ENOENT") return false;
      throw e;
    }
  }

  if (dryRun) {
    if (!(await jaDirExists())) {
      createdDirectories.push(jaDir);
    }
    return {
      ok: true,
      dryRun: true,
      normalizedSlug,
      enUsIndexPath,
      jaIndexPath,
      copied: false,
      createdDirectories,
    };
  }

  const dirExistedBefore = await jaDirExists();
  await fs.mkdir(jaDir, { recursive: true });
  if (!dirExistedBefore) {
    createdDirectories.push(jaDir);
  }

  await fs.writeFile(jaIndexPath, minimized.markdown, "utf8");

  return {
    ok: true,
    dryRun: false,
    normalizedSlug,
    enUsIndexPath,
    jaIndexPath,
    copied: true,
    createdDirectories,
  };
}
