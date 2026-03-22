import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const ruleCategorySchema = z.object({
  url: z.url(),
  title: z.string().optional(),
  description: z.string().optional(),
});

/** ルール JSON（`$schema` は任意・検証後は含めない） */
export const translationRulesDataSchema = z.object({
  version: z.string().optional(),
  editorial: ruleCategorySchema,
  l10n: ruleCategorySchema,
  glossary: ruleCategorySchema,
  style: ruleCategorySchema,
});

export type TranslationRules = z.infer<typeof translationRulesDataSchema>;

const RULE_FILES = {
  editorial: "editorial.rules.json",
  l10n: "l10n.rules.json",
  glossary: "glossary.rules.json",
  style: "style.rules.json",
} as const;

const BUNDLE_VERSION = "1";

function readRuleCategoryFile(filePath: string) {
  const raw = readFileSync(filePath, "utf8");
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error(`ルール JSON の形式が不正です: ${filePath}`);
  }
  const rest = { ...(parsed as Record<string, unknown>) };
  delete rest.$schema;
  return ruleCategorySchema.parse(rest);
}

/**
 * `rules/` ディレクトリ（`editorial.rules.json` など4ファイルを含む）を解決する。
 * `MDN_TRANSLATION_RULES_DIR` または従来の `MDN_TRANSLATION_RULES_JSON_PATH` にディレクトリを指定可能。
 */
function resolveTranslationRulesDir(explicit?: string): string {
  if (explicit) {
    return explicit;
  }
  const fromEnv =
    process.env.MDN_TRANSLATION_RULES_DIR ??
    process.env.MDN_TRANSLATION_RULES_JSON_PATH;
  if (fromEnv) {
    return fromEnv;
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(here, "rules"),
    join(here, "..", "rules"),
    join(here, "..", "..", "rules"),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      return p;
    }
  }
  throw new Error(
    `rules ディレクトリが見つかりません。次を試しました: ${candidates.join(", ")}`,
  );
}

/**
 * `rules/*.rules.json`（4カテゴリ）を読み込み Zod で検証し、`TranslationRules` にまとめる。
 * 実行時は `dist/rules/`（ビルド後コピー）または開発時はリポジトリ直下の `rules/` を参照する。
 */
export function loadTranslationRules(rulesDir?: string): TranslationRules {
  const dir = resolveTranslationRulesDir(rulesDir);
  const editorial = readRuleCategoryFile(join(dir, RULE_FILES.editorial));
  const l10n = readRuleCategoryFile(join(dir, RULE_FILES.l10n));
  const glossary = readRuleCategoryFile(join(dir, RULE_FILES.glossary));
  const style = readRuleCategoryFile(join(dir, RULE_FILES.style));
  return translationRulesDataSchema.parse({
    version: BUNDLE_VERSION,
    editorial,
    l10n,
    glossary,
    style,
  });
}
