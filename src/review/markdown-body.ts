import { parseFrontMatter } from "../shared/translation-front-matter.js";

/** コードフェンス（``` または ~~~）を除去した本文 */
export function proseOutsideCodeFences(markdown: string): string {
  const withoutFences = markdown.replace(
    /^(```+|~~~+)[^\n]*\n[\s\S]*?^\1\s*$/gm,
    "",
  );
  return withoutFences;
}

export function splitMarkdownForReview(markdown: string): {
  frontMatterData: Record<string, unknown>;
  prose: string;
} {
  const parsed = parseFrontMatter(markdown);
  const data = parsed.data as Record<string, unknown>;
  const prose = proseOutsideCodeFences(parsed.content);
  return { frontMatterData: data, prose };
}
