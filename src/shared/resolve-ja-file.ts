import path from "node:path";

import type { WorkspaceRoots } from "./workspace.js";

/**
 * translated-content 内の絶対パス、または files/ja/ からの相対パスを正規化する。
 * ルート外へのパスは拒否する。
 */
export function resolveJaFile(roots: WorkspaceRoots, jaFile: string): string {
  const p = path.isAbsolute(jaFile)
    ? jaFile
    : path.join(roots.translatedRoot, jaFile);
  const normalized = path.normalize(p);
  const base = path.resolve(roots.translatedRoot);
  if (!normalized.startsWith(base + path.sep) && normalized !== base) {
    throw new Error(
      `指定パスは translated-content の外に出ています: ${jaFile}`,
    );
  }
  return normalized;
}
