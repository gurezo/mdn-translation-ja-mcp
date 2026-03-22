/**
 * 既存の日本語 index.md の YAML front-matter に l10n.sourceCommit を追加または更新する。
 */
import fs from "node:fs/promises";

import {
  getEnUsSourceCommitHash,
  type GitLogExec,
} from "../shared/mdn-content-source-commit.js";
import type { MdnTransCommitGetErrorCode } from "../shared/mdn-content-source-commit.js";
import { resolveMdnPageFromUrl } from "../shared/mdn-url-resolve.js";
import {
  setL10nSourceCommitInTranslationMarkdown,
  type SetL10nSourceCommitErrorCode,
} from "../shared/translation-front-matter.js";
import { resolveMdnWorkspacePaths } from "../shared/workspace.js";

export type MdnTransSourceCommitSetErrorCode =
  | MdnTransCommitGetErrorCode
  | SetL10nSourceCommitErrorCode
  | "TRANSLATION_MISSING"
  | "TRANSLATION_NOT_FILE";

export type MdnTransSourceCommitSetResult =
  | {
      ok: true;
      dryRun: boolean;
      normalizedSlug: string;
      jaIndexPath: string;
      enUsIndexPath: string;
      sourceCommit: string;
      written: boolean;
    }
  | {
      ok: false;
      code: MdnTransSourceCommitSetErrorCode | string;
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

export async function runMdnTransSourceCommitSet(options: {
  url: string;
  dryRun?: boolean;
  packageRoot?: string;
  gitLog?: GitLogExec;
}): Promise<MdnTransSourceCommitSetResult> {
  const dryRun = options.dryRun === true;

  const resolved = await resolveMdnPageFromUrl(options.url, {
    packageRoot: options.packageRoot,
  });

  if (!resolved.ok) {
    return resolved as MdnTransSourceCommitSetResult;
  }

  const ws = await resolveMdnWorkspacePaths(
    options.packageRoot !== undefined
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

  const { normalizedSlug, enUsIndexPath, jaIndexPath } = resolved;
  const { contentRoot } = ws.paths;

  const jaKind = await pathIsRegularFile(jaIndexPath);
  if (jaKind.kind === "missing") {
    return {
      ok: false,
      code: "TRANSLATION_MISSING",
      message: `日本語の index.md が見つかりません: ${jaIndexPath}。先に mdn_trans_start で作成してください。`,
      details: { jaIndexPath },
    };
  }
  if (jaKind.kind === "not_file") {
    return {
      ok: false,
      code: "TRANSLATION_NOT_FILE",
      message: `日本語のパスがファイルではありません: ${jaIndexPath}`,
    };
  }

  const hashResult = await getEnUsSourceCommitHash({
    contentRoot,
    enUsIndexPath,
    gitLog: options.gitLog,
  });

  if (!hashResult.ok) {
    return {
      ok: false,
      code: hashResult.code,
      message: hashResult.message,
      details: hashResult.details,
    };
  }

  const sourceCommit = hashResult.sourceCommit;

  const rawJa = await fs.readFile(jaIndexPath, "utf8");
  const updated = setL10nSourceCommitInTranslationMarkdown(rawJa, sourceCommit);

  if (!updated.ok) {
    return {
      ok: false,
      code: updated.code,
      message: updated.message,
      details: { jaIndexPath },
    };
  }

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      normalizedSlug,
      jaIndexPath,
      enUsIndexPath,
      sourceCommit,
      written: false,
    };
  }

  await fs.writeFile(jaIndexPath, updated.markdown, "utf8");

  return {
    ok: true,
    dryRun: false,
    normalizedSlug,
    jaIndexPath,
    enUsIndexPath,
    sourceCommit,
    written: true,
  };
}
