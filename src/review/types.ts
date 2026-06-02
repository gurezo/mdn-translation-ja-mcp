export type GuidelineReviewFinding = {
  skill: string;
  ruleId: string;
  severity: string;
  message: string;
  excerpt?: string;
};

export const REVIEW_SKILL_ORDER = [
  "editorial-guideline",
  "japanese-style",
  "l10n-guideline",
  "mozilla-l10n-glossary",
] as const;
