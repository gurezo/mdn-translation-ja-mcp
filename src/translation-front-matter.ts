/**
 * 翻訳用 index.md の YAML front-matter を最小化する（title / short-title / slug のみ）。
 */
import matter from "gray-matter";
import { stringify } from "yaml";

export type MinimizeTranslationFrontMatterErrorCode =
  | "NO_FRONT_MATTER"
  | "MISSING_TITLE"
  | "MISSING_SLUG";

export type MinimizeTranslationIndexMdResult =
  | { ok: true; markdown: string }
  | {
      ok: false;
      code: MinimizeTranslationFrontMatterErrorCode;
      message: string;
    };

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

/**
 * 英語 index.md 相当の Markdown を、翻訳向け front-matter に整形する。
 * `page-type`・`sidebar` 等は削除し、キー順は title → short-title（任意）→ slug に固定する。
 */
export function minimizeTranslationIndexMd(
  raw: string,
): MinimizeTranslationIndexMdResult {
  if (!matter.test(raw)) {
    return {
      ok: false,
      code: "NO_FRONT_MATTER",
      message:
        "front-matter（--- で区切られた YAML）がありません。MDN の index.md では必須です。",
    };
  }

  const parsed = matter(raw);

  const data = parsed.data as Record<string, unknown>;

  if (!nonEmptyString(data.title)) {
    return {
      ok: false,
      code: "MISSING_TITLE",
      message: "front-matter に title がありません。",
    };
  }

  if (!nonEmptyString(data.slug)) {
    return {
      ok: false,
      code: "MISSING_SLUG",
      message: "front-matter に slug がありません。",
    };
  }

  const normalized: Record<string, unknown> = {
    title: data.title,
  };

  const shortTitle = data["short-title"];
  if (nonEmptyString(shortTitle)) {
    normalized["short-title"] = shortTitle;
  }

  normalized.slug = data.slug;

  const yamlBlock = stringify(normalized, { lineWidth: 0 }).trimEnd();
  const markdown = `---\n${yamlBlock}\n---\n${parsed.content}`;

  return { ok: true, markdown };
}
