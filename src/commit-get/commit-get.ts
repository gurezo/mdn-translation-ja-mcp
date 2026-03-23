/**
 * content リポジトリ上の英語 index.md に対する最新コミットハッシュ（sourceCommit）を取得する。
 */
import { resolveMdnPageFromUrl } from "../shared/mdn-url-resolve.js";
import {
  getEnUsSourceCommitHash,
  type GitLogExec,
  type MdnTransCommitGetErrorCode,
} from "../shared/mdn-content-source-commit.js";
import { resolveMdnWorkspacePaths } from "../shared/workspace.js";

export type {
  GitLogExec,
  MdnTransCommitGetErrorCode,
} from "../shared/mdn-content-source-commit.js";

/** `mdn_trans_commit_get` の戻り値。 */
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

/**
 * MDN のページ URL に対応する英語 `index.md` について、`content` リポジトリの `git log` で最新コミットハッシュを返す。
 */
export async function runMdnTransCommitGet(options: {
  url: string;
  packageRoot?: string;
  /** 単体テスト用。未指定時は `promisify(execFile)` で `git` を実行する。 */
  gitLog?: GitLogExec;
}): Promise<MdnTransCommitGetResult> {
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

  return {
    ok: true,
    sourceCommit: hashResult.sourceCommit,
    normalizedSlug,
    enUsIndexPath,
    contentRoot,
  };
}
