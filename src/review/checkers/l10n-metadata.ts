import type { GuidelineReviewFinding } from "../types.js";

const L10N_SKILL = "l10n-guideline";

export function findingsFromL10nMetadata(
  frontMatterData: Record<string, unknown>,
): GuidelineReviewFinding[] {
  const findings: GuidelineReviewFinding[] = [];
  const l10n = frontMatterData.l10n;

  if (
    typeof l10n !== "object" ||
    l10n === null ||
    Array.isArray(l10n)
  ) {
    findings.push({
      skill: L10N_SKILL,
      ruleId: "STYLE_L10N_METADATA",
      severity: "warning",
      message:
        "front-matter に l10n.sourceCommit がありません（mdn_trans_commit_get で反映を推奨）。",
    });
    return findings;
  }

  const record = l10n as Record<string, unknown>;
  const sourceCommit = record.sourceCommit;
  if (
    typeof sourceCommit !== "string" ||
    sourceCommit.trim().length === 0
  ) {
    findings.push({
      skill: L10N_SKILL,
      ruleId: "STYLE_L10N_METADATA",
      severity: "warning",
      message:
        "l10n.sourceCommit が未設定または空です（mdn_trans_commit_get で反映を推奨）。",
    });
  }

  return findings;
}
