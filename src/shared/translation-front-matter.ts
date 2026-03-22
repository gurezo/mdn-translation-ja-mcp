/**
 * 翻訳用 index.md の YAML front-matter を最小化する（title / short-title / slug / 任意で l10n.sourceCommit）。
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

export type SetL10nSourceCommitErrorCode =
  | "NO_FRONT_MATTER"
  | "MISSING_TITLE"
  | "MISSING_SLUG"
  | "INVALID_L10N";

export type SetL10nSourceCommitInTranslationMarkdownResult =
  | { ok: true; markdown: string }
  | {
      ok: false;
      code: SetL10nSourceCommitErrorCode;
      message: string;
    };

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

/**
 * 英語 index.md 相当の Markdown を、翻訳向け front-matter に整形する。
 * `page-type`・`sidebar` 等は削除し、キー順は title → short-title（任意）→ slug → l10n（任意）に固定する。
 *
 * `sourceCommit` を渡したときは `l10n.sourceCommit` を付与する。
 */
export function minimizeTranslationIndexMd(
  raw: string,
  options?: { sourceCommit?: string },
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

  if (options?.sourceCommit !== undefined) {
    normalized.l10n = { sourceCommit: options.sourceCommit };
  }

  const yamlBlock = stringify(normalized, { lineWidth: 0 }).trimEnd();
  const markdown = `---\n${yamlBlock}\n---\n${parsed.content}`;

  return { ok: true, markdown };
}

/**
 * 既存の翻訳 index.md 全文に対し、front-matter の `l10n.sourceCommit` のみ追加または更新する。本文はそのまま保持する。
 */
export function setL10nSourceCommitInTranslationMarkdown(
  raw: string,
  sourceCommit: string,
): SetL10nSourceCommitInTranslationMarkdownResult {
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

  const existing = data.l10n;
  let l10n: Record<string, unknown>;
  if (existing === undefined || existing === null) {
    l10n = { sourceCommit };
  } else if (isPlainObject(existing)) {
    l10n = { ...existing, sourceCommit };
  } else {
    return {
      ok: false,
      code: "INVALID_L10N",
      message:
        "front-matter の l10n がオブジェクトではありません。手作業で YAML を確認してください。",
    };
  }

  const nextData: Record<string, unknown> = { ...data, l10n };
  const yamlBlock = stringify(nextData, { lineWidth: 0 }).trimEnd();
  const markdown = `---\n${yamlBlock}\n---\n${parsed.content}`;

  return { ok: true, markdown };
}
