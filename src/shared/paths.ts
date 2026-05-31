import path from "node:path";
import { fileURLToPath } from "node:url";

const sharedDir = path.dirname(fileURLToPath(import.meta.url));

/** glossary-terms.json（dist/shared/data） */
export function getGlossaryTermsPath(): string {
  return path.join(sharedDir, "data", "glossary-terms.json");
}

/** prohibited-expressions.json（dist/shared/data） */
export function getProhibitedExpressionsPath(): string {
  return path.join(sharedDir, "data", "prohibited-expressions.json");
}
