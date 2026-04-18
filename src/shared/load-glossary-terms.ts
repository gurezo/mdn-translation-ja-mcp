import fs from "node:fs";

export type GlossaryTermsFile = {
  terms: Record<string, { secondArg: string }>;
};

export function loadGlossaryTerms(filePath: string): GlossaryTermsFile {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as GlossaryTermsFile;
}
