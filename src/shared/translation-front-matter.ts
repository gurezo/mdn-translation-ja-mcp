import matter from "gray-matter";

export type FrontMatterData = Record<string, unknown>;

export function parseFrontMatter(markdown: string) {
  return matter(markdown);
}

export function setSourceCommitInBody(
  markdown: string,
  sourceCommit: string,
): string {
  const res = matter(markdown);
  const data = { ...(res.data as FrontMatterData) };
  // mdn_trans_commit_get の仕様として常に削除する。
  delete data["page-type"];
  delete data.sidebar;
  const l10n =
    typeof data.l10n === "object" &&
    data.l10n !== null &&
    !Array.isArray(data.l10n)
      ? { ...(data.l10n as Record<string, unknown>) }
      : {};
  l10n.sourceCommit = sourceCommit;
  data.l10n = l10n;
  return matter.stringify(res.content, data);
}
