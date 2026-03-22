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

const DEFAULT_FILENAME = "translation-rules.json";

function resolveTranslationRulesPath(explicit?: string): string {
  if (explicit) {
    return explicit;
  }
  const fromEnv = process.env.MDN_TRANSLATION_RULES_JSON_PATH;
  if (fromEnv) {
    return fromEnv;
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(here, "rules", DEFAULT_FILENAME),
    join(here, "..", "rules", DEFAULT_FILENAME),
    join(here, "..", "..", "rules", DEFAULT_FILENAME),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      return p;
    }
  }
  throw new Error(
    `${DEFAULT_FILENAME} が見つかりません。次を試しました: ${candidates.join(", ")}`,
  );
}

/**
 * `rules/translation-rules.json` を読み込み Zod で検証する。
 * 実行時は `dist/rules/`（ビルド後コピー）または開発時はリポジトリ直下の `rules/` を参照する。
 */
export function loadTranslationRules(jsonPath?: string): TranslationRules {
  const resolved = resolveTranslationRulesPath(jsonPath);
  const raw = readFileSync(resolved, "utf8");
  const parsed: unknown = JSON.parse(raw);
  return translationRulesDataSchema.parse(parsed);
}
