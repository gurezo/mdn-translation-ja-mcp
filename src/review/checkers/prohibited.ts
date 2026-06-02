import type { ProhibitedItem } from "../../shared/load-prohibited-expressions.js";
import type { GuidelineReviewFinding } from "../types.js";

const PROHIBITED_SKILL = "editorial-guideline";

export function findingsFromProhibited(
  text: string,
  items: ProhibitedItem[],
): GuidelineReviewFinding[] {
  const findings: GuidelineReviewFinding[] = [];

  for (const item of items) {
    if (item.matchType !== "literal") {
      continue;
    }
    if (text.includes(item.pattern)) {
      findings.push({
        skill: PROHIBITED_SKILL,
        ruleId: item.id,
        severity: item.severity,
        message: item.message,
        excerpt: item.pattern,
      });
    }
  }

  return findings;
}
