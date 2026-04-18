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

  const message = [
    "mdn_trans_start: Wiki 定義どおり、content の英語原文 1 ファイルを translated-content の対応パスへコピーしただけです。",
    "",
    "リポジトリ内の相対パス:",
    `- コピー元: ${rel}`,
    `- コピー先: ${jaRel}（files/en-us を files/ja に置き換えただけのパス）`,
    "",
    "このツールは上記のファイルコピー以外は行いません。次は別作業です:",
    "- 本文の翻訳・編集",
    "- _redirects.txt の変更",
    "- 他ドキュメントからのリンク修正",
    "",
    "絶対パス:",
    `- 元: ${sourceFile}`,
    `- 先: ${destFile}`,
  ].join("\n");

  return {
    message,
    sourceFile,
    destFile,
  };
}
