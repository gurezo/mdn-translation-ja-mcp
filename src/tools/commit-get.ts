import fs from "node:fs";
import path from "node:path";

import { getLatestCommitHashForPath } from "../git/get-source-commit.js";
import type { WorkspaceRoots } from "../shared/workspace.js";
import { docUrlToEnUsContentRelativePath } from "../shared/mdn-url-resolve.js";
import { setSourceCommitInBody } from "../shared/translation-front-matter.js";

export type CommitGetArgs = {
  url: string;
};

export async function mdnTransCommitGet(
  roots: WorkspaceRoots,
  args: CommitGetArgs,
): Promise<{ message: string; jaFile: string; sourceCommit: string }> {
  const rel = docUrlToEnUsContentRelativePath(args.url);
  const jaRel = rel.replace(/^files\/en-us\//i, "files/ja/");
  const jaFile = path.join(roots.translatedRoot, jaRel);

  if (!fs.existsSync(jaFile)) {
    throw new Error(
      `翻訳ファイルが見つかりません。先に mdn_trans_start を実行してください: ${jaFile}`,
    );
  }

  const hash = await getLatestCommitHashForPath(roots.contentRoot, rel);
  const md = fs.readFileSync(jaFile, "utf8");
  const updated = setSourceCommitInBody(md, hash);
  fs.writeFileSync(jaFile, updated, "utf8");

  return {
    message: `l10n.sourceCommit を更新しました。\n- ファイル: ${jaFile}\n- sourceCommit: ${hash}`,
    jaFile,
    sourceCommit: hash,
  };
}
