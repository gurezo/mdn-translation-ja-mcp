import fs from "node:fs";

export type ReviewRuleItem = {
  id: string;
  skill: string;
  matchType: "literal" | "regex" | string;
  pattern: string;
  severity: string;
  message: string;
  sourceRef?: string;
};

export type ReviewRulesFile = {
  items: ReviewRuleItem[];
};

export function loadReviewRules(filePath: string): ReviewRulesFile {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as ReviewRulesFile;
}
