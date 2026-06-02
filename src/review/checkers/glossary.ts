import { findSingleArgGlossaryMacros } from "../../shared/glossary-macro.js";
import type { GuidelineReviewFinding } from "../types.js";

const GLOSSARY_SKILL = "mozilla-l10n-glossary";

export function findingsFromGlossaryMacros(
  body: string,
): GuidelineReviewFinding[] {
  const matches = findSingleArgGlossaryMacros(body);
  return matches.map((m) => ({
    skill: GLOSSARY_SKILL,
    ruleId: "GLOSSARY_SINGLE_ARG",
    severity: "info",
    message:
      "1 引数の {{glossary}} があります。mdn_trans_replace_glossary で第2引数を付与してください。",
    excerpt: m.termId,
  }));
}
