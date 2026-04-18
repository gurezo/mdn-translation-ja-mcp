import path from "node:path";
import { fileURLToPath } from "node:url";

const sharedDir = path.dirname(fileURLToPath(import.meta.url));

/** dist 直下の rules ディレクトリ */
export function getRulesDir(): string {
  return path.join(sharedDir, "..", "rules");
}

/** glossary-terms.json（dist/shared/data） */
export function getGlossaryTermsPath(): string {
  return path.join(sharedDir, "data", "glossary-terms.json");
}
