import type { ReviewRuleItem } from "../../shared/load-review-rules.js";
import type { GuidelineReviewFinding } from "../types.js";

export function findingsFromRuleItems(
  prose: string,
  items: ReviewRuleItem[],
): GuidelineReviewFinding[] {
  const findings: GuidelineReviewFinding[] = [];

  for (const item of items) {
    if (item.matchType === "literal") {
      if (prose.includes(item.pattern)) {
        findings.push({
          skill: item.skill,
          ruleId: item.id,
          severity: item.severity,
          message: item.message,
          excerpt: item.pattern,
        });
      }
      continue;
    }

    if (item.matchType === "regex") {
      const re = new RegExp(item.pattern, "g");
      if (re.test(prose)) {
        findings.push({
          skill: item.skill,
          ruleId: item.id,
          severity: item.severity,
          message: item.message,
          excerpt: item.pattern,
        });
      }
    }
  }

  return findings;
}
