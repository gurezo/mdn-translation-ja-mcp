/**
 * content リポジトリ上の英語 index.md に対する最新コミットハッシュ（sourceCommit）を取得する。
 */
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** `git log` 相当の実行（単体テストで差し替え可能） */
export type GitLogExec = typeof execFileAsync;

import { resolveMdnPageFromUrl } from "./mdn-url-resolve.js";
import { resolveMdnWorkspacePaths } from "./workspace.js";

export type MdnTransCommitGetErrorCode =
  | "SOURCE_MISSING"
  | "SOURCE_NOT_FILE"
  | "NOT_A_GIT_REPOSITORY"
  | "GIT_COMMAND_FAILED"
  | "SOURCE_UNTRACKED"
  | "PATH_OUTSIDE_CONTENT_ROOT";

export type MdnTransCommitGetResult =
  | {
      ok: true;
      sourceCommit: string;
      normalizedSlug: string;
      enUsIndexPath: string;
      contentRoot: string;
    }
  | {
      ok: false;
      code: MdnTransCommitGetErrorCode | string;
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

function stderrFromExecError(e: unknown): string {
  if (e !== null && typeof e === "object" && "stderr" in e) {
    const s = (e as { stderr?: unknown }).stderr;
    if (Buffer.isBuffer(s)) return s.toString("utf8");
    if (typeof s === "string") return s;
  }
  return e instanceof Error ? e.message : String(e);
}

/**
 * MDN のページ URL に対応する英語 `index.md` について、`content` リポジトリの `git log` で最新コミットハッシュを返す。
 */
export async function runMdnTransCommitGet(options: {
  url: string;
  packageRoot?: string;
  /** 単体テスト用。未指定時は `promisify(execFile)` で `git` を実行する。 */
  gitLog?: GitLogExec;
}): Promise<MdnTransCommitGetResult> {
  const runGit = options.gitLog ?? execFileAsync;

  const resolved = await resolveMdnPageFromUrl(options.url, {
    packageRoot: options.packageRoot,
  });

  if (!resolved.ok) {
    return resolved as MdnTransCommitGetResult;
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

  const { normalizedSlug, enUsIndexPath } = resolved;
  const { contentRoot } = ws.paths;

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

  let relativeToContent = path.relative(contentRoot, enUsIndexPath);
  if (
    relativeToContent.startsWith("..") ||
    path.isAbsolute(relativeToContent)
  ) {
    return {
      ok: false,
      code: "PATH_OUTSIDE_CONTENT_ROOT",
      message:
        "英語 index.md のパスが content ルート外として解決されました。MDN_CONTENT_ROOT（または兄弟 content）の設定を確認してください。",
      details: { contentRoot, enUsIndexPath },
    };
  }

  relativeToContent = relativeToContent.split(path.sep).join("/");

  try {
    const { stdout } = await runGit(
      "git",
      [
        "-C",
        contentRoot,
        "log",
        "-1",
        "--format=%H",
        "--",
        relativeToContent,
      ],
      { encoding: "utf8", maxBuffer: 1024 * 1024 },
    );

    const hash = String(stdout).trim();
    if (!/^[0-9a-f]{40}$/i.test(hash)) {
      return {
        ok: false,
        code: "SOURCE_UNTRACKED",
        message:
          "git log からコミットを取得できませんでした。ファイルが未追跡であるか、履歴に存在しない可能性があります。",
        details: { contentRoot, relativePath: relativeToContent },
      };
    }

    return {
      ok: true,
      sourceCommit: hash.toLowerCase(),
      normalizedSlug,
      enUsIndexPath,
      contentRoot,
    };
  } catch (e: unknown) {
    const combined = `${stderrFromExecError(e)}`;
    const lower = combined.toLowerCase();
    if (
      lower.includes("not a git repository") ||
      lower.includes("not a git repo")
    ) {
      return {
        ok: false,
        code: "NOT_A_GIT_REPOSITORY",
        message:
          "content ディレクトリが Git リポジトリではありません。mdn/content を clone したディレクトリを指すよう設定してください。",
        details: { contentRoot },
      };
    }

    return {
      ok: false,
      code: "GIT_COMMAND_FAILED",
      message: `git log の実行に失敗しました: ${combined.trim() || "(no stderr)"}`,
      details: { contentRoot, relativePath: relativeToContent },
    };
  }
}
