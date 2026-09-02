import path from "node:path";
import { fileURLToPath } from "node:url";

const sharedDir = path.dirname(fileURLToPath(import.meta.url));

/** パッケージルート（src/shared または dist/shared の 2 つ上） */
export function getPackageRoot(): string {
  return path.join(sharedDir, "..", "..");
}

/** glossary-terms.json（dist/shared/data） */
export function getGlossaryTermsPath(): string {
  return path.join(sharedDir, "data", "glossary-terms.json");
}

/** prohibited-expressions.json（dist/shared/data） */
export function getProhibitedExpressionsPath(): string {
  return path.join(sharedDir, "data", "prohibited-expressions.json");
}

/** review-rules.json（dist/shared/data） */
export function getReviewRulesPath(): string {
  return path.join(sharedDir, "data", "review-rules.json");
}

function guidelineReferencePath(...segments: string[]): string {
  return path.join(getPackageRoot(), ".agents", "skills", ...segments);
}

/** 表記ガイドライン（editorial-guideline references） */
export function getEditorialGuidelinePath(): string {
  return guidelineReferencePath(
    "editorial-guideline",
    "references",
    "editorial-guideline.md",
  );
}

/** L10N ガイドライン（l10n-guideline references） */
export function getL10nGuidelinePath(): string {
  return guidelineReferencePath(
    "l10n-guideline",
    "references",
    "l10n-guideline.md",
  );
}

/** 文体ルール（japanese-style references） */
export function getJapaneseStyleRulesPath(): string {
  return guidelineReferencePath(
    "japanese-style",
    "references",
    "style-rules.md",
  );
}

/** 用語抜粋（mozilla-l10n-glossary references） */
export function getGlossaryExcerptPath(): string {
  return guidelineReferencePath(
    "mozilla-l10n-glossary",
    "references",
    "glossary-excerpt.md",
  );
}

/** 用語 Wiki 参照手順（mozilla-l10n-glossary references） */
export function getGlossaryLookupPath(): string {
  return guidelineReferencePath(
    "mozilla-l10n-glossary",
    "references",
    "glossary-lookup.md",
  );
}
