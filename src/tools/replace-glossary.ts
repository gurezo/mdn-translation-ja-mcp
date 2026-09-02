import fs from "node:fs";

import type { WorkspaceRoots } from "../shared/workspace.js";
import { replaceGlossarySecondArgs } from "../shared/glossary-macro.js";
import { loadGlossaryTerms } from "../shared/load-glossary-terms.js";
import { getGlossaryTermsPath } from "../shared/paths.js";
import { resolveJaFile } from "../shared/resolve-ja-file.js";

export type ReplaceGlossaryArgs = {
  /** translated-content 配下の絶対パス、または files/ja/... からの相対パス */
  jaFile: string;
};

export function mdnTransReplaceGlossary(
  roots: WorkspaceRoots,
  args: ReplaceGlossaryArgs,
): { message: string; jaFile: string; replaced: number; skipped: string[] } {
  const jaPath = resolveJaFile(roots, args.jaFile);
  if (!fs.existsSync(jaPath)) {
    throw new Error(`ファイルが見つかりません: ${jaPath}`);
  }

  const glossaryPath = getGlossaryTermsPath();
  const glossary = loadGlossaryTerms(glossaryPath);
  const resolveSecond = (id: string) => glossary.terms[id]?.secondArg;

  const body = fs.readFileSync(jaPath, "utf8");
  const { next, replaced, skipped } = replaceGlossarySecondArgs(
    body,
    resolveSecond,
  );
  if (replaced > 0) {
    fs.writeFileSync(jaPath, next, "utf8");
  }

  return {
    message:
      replaced > 0
        ? `glossary マクロを ${replaced} 件置換しました。\n- ${jaPath}`
        : `置換対象の 1 引数 glossary マクロはありませんでした。\n- ${jaPath}`,
    jaFile: jaPath,
    replaced,
    skipped,
  };
}
