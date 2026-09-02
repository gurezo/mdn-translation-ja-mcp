import { loadProhibitedExpressions } from "../shared/load-prohibited-expressions.js";
import { loadReviewRules } from "../shared/load-review-rules.js";
import {
  getProhibitedExpressionsPath,
  getReviewRulesPath,
} from "../shared/paths.js";
import { findingsFromGlossaryMacros } from "./checkers/glossary.js";
import { findingsFromL10nMetadata } from "./checkers/l10n-metadata.js";
import { findingsFromProhibited } from "./checkers/prohibited.js";
import { findingsFromRuleItems } from "./checkers/rule-items.js";
import { splitMarkdownForReview } from "./markdown-body.js";
import type { GuidelineReviewFinding } from "./types.js";
import { REVIEW_SKILL_ORDER } from "./types.js";

export type GuidelineReviewResult = {
  findings: GuidelineReviewFinding[];
  summaryBySkill: Record<string, number>;
};

export function runGuidelineReview(markdown: string): GuidelineReviewResult {
  const { frontMatterData, prose } = splitMarkdownForReview(markdown);
  const reviewRules = loadReviewRules(getReviewRulesPath());
  const prohibited = loadProhibitedExpressions(getProhibitedExpressionsPath());

  const findings: GuidelineReviewFinding[] = [
    ...findingsFromRuleItems(prose, reviewRules.items),
    ...findingsFromProhibited(markdown, prohibited.items),
    ...findingsFromL10nMetadata(frontMatterData),
    ...findingsFromGlossaryMacros(markdown),
  ];

  const summaryBySkill: Record<string, number> = {};
  for (const skill of REVIEW_SKILL_ORDER) {
    summaryBySkill[skill] = 0;
  }
  for (const f of findings) {
    summaryBySkill[f.skill] = (summaryBySkill[f.skill] ?? 0) + 1;
  }

  return { findings, summaryBySkill };
}

export function formatFindingsReport(
  jaPath: string,
  result: GuidelineReviewResult,
): string {
  const lines: string[] = [
    `レビュー対象: ${jaPath}`,
    `検出件数: ${result.findings.length}`,
    "",
    "（機械チェック。ルールは mdn://data/review-rules と同じ JSON。意訳の自然さ等は人手確認が必要です。）",
    "",
  ];

  for (const skill of REVIEW_SKILL_ORDER) {
    const count = result.summaryBySkill[skill] ?? 0;
    lines.push(`## ${skill} (${count})`);
    const skillFindings = result.findings.filter((f) => f.skill === skill);
    if (skillFindings.length === 0) {
      lines.push("- （検出なし）");
    } else {
      for (const f of skillFindings) {
        lines.push(
          `- [${f.severity}] ${f.ruleId}: ${f.message}${f.excerpt ? `（該当: ${f.excerpt}）` : ""}`,
        );
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}
