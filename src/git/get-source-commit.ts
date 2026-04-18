import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * content リポジトリで、指定された相対パス（リポジトリルート基準）の blob が最後に更新されたコミットハッシュを返す。
 */
export async function getLatestCommitHashForPath(
  contentRepoRoot: string,
  relativePathFromRepoRoot: string,
): Promise<string> {
  const { stdout, stderr } = await execFileAsync(
    "git",
    [
      "-C",
      contentRepoRoot,
      "log",
      "-1",
      "--format=%H",
      "--",
      relativePathFromRepoRoot,
    ],
    { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
  );
  if (stderr.trim()) {
    // git は正常時も stderr に出すことがあるため、stdout が空ならエラー扱い
  }
  const hash = stdout.trim();
  if (!/^[0-9a-f]{40}$/i.test(hash)) {
    throw new Error(
      `git log からコミットハッシュを取得できませんでした: ${relativePathFromRepoRoot}\n${stderr || stdout}`,
    );
  }
  return hash;
}
