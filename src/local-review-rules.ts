import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, "YYYY-MM-DD 形式");

const mozillaTermSchema = z.object({
  slug: z.string(),
  en: z.string(),
  ja: z.string(),
  note: z.string().optional(),
});

export const mozillaGlossaryExcerptSchema = z.object({
  sourceUrl: z.url(),
  retrievedAt: dateOnlySchema,
  description: z.string().optional(),
  terms: z.array(mozillaTermSchema),
});

export type MozillaGlossaryExcerpt = z.infer<
  typeof mozillaGlossaryExcerptSchema
>;

const styleRuleEntrySchema = z.object({
  id: z.string(),
  severity: z.enum(["error", "warning", "info"]).optional(),
  message: z.string(),
  pattern: z.string().optional(),
  implementationNote: z.string().optional(),
});

export const styleRulesFileSchema = z.object({
  sourceUrl: z.url(),
  retrievedAt: dateOnlySchema,
  description: z.string().optional(),
  rules: z.array(styleRuleEntrySchema),
});

export type StyleRulesFile = z.infer<typeof styleRulesFileSchema>;

export const prohibitedExpressionItemSchema = z.object({
  id: z.string(),
  matchType: z.enum(["literal", "regex"]),
  pattern: z.string(),
  severity: z.enum(["error", "warning", "info"]),
  message: z.string(),
});

export type ProhibitedExpressionItem = z.infer<
  typeof prohibitedExpressionItemSchema
>;

export const prohibitedExpressionsFileSchema = z.object({
  sourceUrl: z.url(),
  retrievedAt: dateOnlySchema,
  description: z.string().optional(),
  items: z.array(prohibitedExpressionItemSchema),
});

export type ProhibitedExpressionsFile = z.infer<
  typeof prohibitedExpressionsFileSchema
>;

export type LocalReviewRulesBundle = {
  mozillaGlossaryExcerpt: MozillaGlossaryExcerpt;
  styleRules: StyleRulesFile;
  prohibitedExpressions: ProhibitedExpressionsFile;
};

const FILES = {
  mozillaGlossaryExcerpt: "mozilla-glossary-excerpt.json",
  styleRules: "style-rules.json",
  prohibitedExpressions: "prohibited-expressions.json",
} as const;

function resolveRulesDir(): string {
  const fromEnv = process.env.MDN_LOCAL_REVIEW_RULES_DIR;
  if (fromEnv) {
    return fromEnv;
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [join(here, "rules"), join(here, "..", "rules")];
  for (const p of candidates) {
    if (existsSync(p)) {
      return p;
    }
  }
  throw new Error(
    `rules ディレクトリが見つかりません。次を試しました: ${candidates.join(", ")}`,
  );
}

function readAndParse<T>(path: string, schema: z.ZodType<T>): T {
  const raw = readFileSync(path, "utf8");
  const parsed: unknown = JSON.parse(raw);
  return schema.parse(parsed);
}

function validateRegexPatterns(items: ProhibitedExpressionItem[]): void {
  for (const item of items) {
    if (item.matchType !== "regex") {
      continue;
    }
    try {
      new RegExp(item.pattern, "u");
    } catch (e) {
      throw new Error(
        `禁止表現 ${item.id}: 正規表現が無効です: ${item.pattern} (${String(e)})`,
        { cause: e },
      );
    }
  }
}

/**
 * ローカルレビュー用 JSON（Mozilla 用語抜粋・文体ルール・禁止表現）を読み込み検証する。
 * 実行時は `dist/rules/` またはリポジトリ直下の `rules/` を参照。
 */
export function loadLocalReviewRules(
  rulesDir?: string,
): LocalReviewRulesBundle {
  const dir = rulesDir ?? resolveRulesDir();
  const mozillaPath = join(dir, FILES.mozillaGlossaryExcerpt);
  const stylePath = join(dir, FILES.styleRules);
  const prohibitedPath = join(dir, FILES.prohibitedExpressions);

  const mozillaGlossaryExcerpt = readAndParse(
    mozillaPath,
    mozillaGlossaryExcerptSchema,
  );
  const styleRules = readAndParse(stylePath, styleRulesFileSchema);
  const prohibitedExpressions = readAndParse(
    prohibitedPath,
    prohibitedExpressionsFileSchema,
  );

  validateRegexPatterns(prohibitedExpressions.items);

  return {
    mozillaGlossaryExcerpt,
    styleRules,
    prohibitedExpressions,
  };
}
