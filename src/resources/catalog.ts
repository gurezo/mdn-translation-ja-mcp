import {
  getEditorialGuidelinePath,
  getGlossaryExcerptPath,
  getGlossaryLookupPath,
  getGlossaryTermsPath,
  getJapaneseStyleRulesPath,
  getL10nGuidelinePath,
  getProhibitedExpressionsPath,
  getReviewRulesPath,
} from "../shared/paths.js";

export const MIME_MARKDOWN = "text/markdown";
export const MIME_JSON = "application/json";

export type GuidelineResourceEntry = {
  name: string;
  uri: string;
  title: string;
  description: string;
  mimeType: typeof MIME_MARKDOWN | typeof MIME_JSON;
  getFilePaths: () => string[];
};

export const GUIDELINE_RESOURCES: readonly GuidelineResourceEntry[] = [
  {
    name: "guidelines-editorial",
    uri: "mdn://guidelines/editorial",
    title: "MDN 日本語 表記ガイドライン",
    description:
      "Mozilla Japan の表記・約物・単位・カタカナ長音などの editorial guideline。",
    mimeType: MIME_MARKDOWN,
    getFilePaths: () => [getEditorialGuidelinePath()],
  },
  {
    name: "guidelines-l10n",
    uri: "mdn://guidelines/l10n",
    title: "MDN 日本語 L10N ガイドライン",
    description:
      "意訳・UI コンテクスト別表現・ですます調などの L10N guideline。",
    mimeType: MIME_MARKDOWN,
    getFilePaths: () => [getL10nGuidelinePath()],
  },
  {
    name: "guidelines-japanese-style",
    uri: "mdn://guidelines/japanese-style",
    title: "MDN 日本語 文体ルール",
    description: "ですます調・ひらがな/漢字・箇条書き文体などの style rules。",
    mimeType: MIME_MARKDOWN,
    getFilePaths: () => [getJapaneseStyleRulesPath()],
  },
  {
    name: "glossary",
    uri: "mdn://glossary",
    title: "Mozilla L10N 用語集",
    description: "用語抜粋と Wiki 参照手順。",
    mimeType: MIME_MARKDOWN,
    getFilePaths: () => [getGlossaryExcerptPath(), getGlossaryLookupPath()],
  },
  {
    name: "data-glossary-terms",
    uri: "mdn://data/glossary-terms",
    title: "機械用 glossary 用語データ",
    description:
      "mdn_trans_replace_glossary が読む glossary-terms.json（同一ファイル）。",
    mimeType: MIME_JSON,
    getFilePaths: () => [getGlossaryTermsPath()],
  },
  {
    name: "data-review-rules",
    uri: "mdn://data/review-rules",
    title: "機械チェックルール",
    description: "mdn_trans_review が読む review-rules.json（同一ファイル）。",
    mimeType: MIME_JSON,
    getFilePaths: () => [getReviewRulesPath()],
  },
  {
    name: "data-prohibited-expressions",
    uri: "mdn://data/prohibited-expressions",
    title: "禁止・注意表現",
    description:
      "mdn_trans_review が読む prohibited-expressions.json（同一ファイル）。",
    mimeType: MIME_JSON,
    getFilePaths: () => [getProhibitedExpressionsPath()],
  },
];

export function findGuidelineResource(
  uri: string | URL,
): GuidelineResourceEntry | undefined {
  const requested = typeof uri === "string" ? new URL(uri).href : uri.href;
  return GUIDELINE_RESOURCES.find((r) => new URL(r.uri).href === requested);
}
