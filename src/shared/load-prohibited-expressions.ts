import fs from "node:fs";

export type ProhibitedItem = {
  id: string;
  matchType: "literal" | string;
  pattern: string;
  severity: string;
  message: string;
};

export type ProhibitedExpressionsFile = {
  items: ProhibitedItem[];
};

export function loadProhibitedExpressions(
  filePath: string,
): ProhibitedExpressionsFile {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as ProhibitedExpressionsFile;
}
