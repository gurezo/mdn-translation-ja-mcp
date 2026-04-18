import path from "node:path";

/**
 * MDN ドキュメント URL から、content リポジトリ内の相対パス（POSIX）を返す。
 * 例: https://developer.mozilla.org/en-US/docs/Glossary/Symbol → files/en-us/docs/glossary/symbol/index.md
 */
export function docUrlToEnUsContentRelativePath(urlString: string): string {
  let u: URL;
  try {
    u = new URL(urlString);
  } catch {
    throw new Error(`無効な URL です: ${urlString}`);
  }

  if (u.hostname !== "developer.mozilla.org") {
    throw new Error(
      `developer.mozilla.org のドキュメント URL を指定してください: ${urlString}`,
    );
  }

  const pathname = u.pathname.replace(/\/+$/, "");
  const match = pathname.match(/^\/en-US\/(.*)$/i);
  if (!match?.[1]) {
    throw new Error(`URL に /en-US/docs/... が含まれていません: ${urlString}`);
  }

  const rest = match[1];
  const segments = rest
    .split("/")
    .filter(Boolean)
    .map((s) => s.toLowerCase());

  if (segments.length === 0) {
    throw new Error(`ドキュメントパスが空です: ${urlString}`);
  }

  return path.posix.join("files", "en-us", ...segments, "index.md");
}
