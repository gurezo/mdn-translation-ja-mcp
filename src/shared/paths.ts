import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sharedDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * ルール JSON ディレクトリ（ビルド後は dist/rules、開発時はリポジトリ直下の rules）。
 */
export function getRulesDir(): string {
  const adjacent = path.join(sharedDir, "..", "rules");
  if (
    fs.existsSync(path.join(adjacent, "prohibited-expressions.json"))
  ) {
    return adjacent;
  }
  const repoRules = path.join(sharedDir, "..", "..", "rules");
  if (
    fs.existsSync(path.join(repoRules, "prohibited-expressions.json"))
  ) {
    return repoRules;
  }
  return adjacent;
}

/** glossary-terms.json（dist/shared/data） */
export function getGlossaryTermsPath(): string {
  return path.join(sharedDir, "data", "glossary-terms.json");
}
