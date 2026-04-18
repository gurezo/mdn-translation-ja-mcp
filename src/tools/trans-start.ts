import fs from "node:fs";
import path from "node:path";

import type { WorkspaceRoots } from "../shared/workspace.js";
import { docUrlToEnUsContentRelativePath } from "../shared/mdn-url-resolve.js";

export type TransStartArgs = {
  url: string;
  overwrite?: boolean;
};

export function mdnTransStart(
  roots: WorkspaceRoots,
  args: TransStartArgs,
): { message: string; sourceFile: string; destFile: string } {
  const rel = docUrlToEnUsContentRelativePath(args.url);
  const sourceFile = path.join(roots.contentRoot, rel);
  const jaRel = rel.replace(/^files\/en-us\//i, "files/ja/");
  const destFile = path.join(roots.translatedRoot, jaRel);

  if (!fs.existsSync(sourceFile)) {
    throw new Error(`原文が見つかりません: ${sourceFile}`);
  }

  if (fs.existsSync(destFile) && !args.overwrite) {
    throw new Error(
      `既に翻訳先ファイルがあります。上書きする場合は overwrite: true を指定してください: ${destFile}`,
    );
  }

  fs.mkdirSync(path.dirname(destFile), { recursive: true });
  fs.copyFileSync(sourceFile, destFile);

  return {
    message: `原文をコピーしました。\n- 元: ${sourceFile}\n- 先: ${destFile}`,
    sourceFile,
    destFile,
  };
}
