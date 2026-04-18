import fs from "node:fs";
import path from "node:path";

export type WorkspaceRoots = {
  contentRoot: string;
  translatedRoot: string;
};

/**
 * mdn/content と mdn/translated-content のルートを解決する。
 * - 両方の環境変数があればそれを使用（どちらか一方のみは不可）
 * - なければカレントディレクトリの兄弟に content / translated-content がある前提
 */
export function resolveWorkspaceRoots(
  cwd: string = process.cwd(),
): WorkspaceRoots {
  const envContent = process.env.MDN_CONTENT_ROOT;
  const envTranslated = process.env.MDN_TRANSLATED_CONTENT_ROOT;

  if (envContent || envTranslated) {
    if (!envContent || !envTranslated) {
      throw new Error(
        "MDN_CONTENT_ROOT と MDN_TRANSLATED_CONTENT_ROOT は両方とも指定してください（片方のみは不可）。",
      );
    }
    return {
      contentRoot: path.resolve(envContent),
      translatedRoot: path.resolve(envTranslated),
    };
  }

  const siblingContent = path.resolve(cwd, "..", "content");
  const siblingTranslated = path.resolve(cwd, "..", "translated-content");

  if (
    fs.existsSync(siblingContent) &&
    fs.existsSync(siblingTranslated) &&
    fs.statSync(siblingContent).isDirectory() &&
    fs.statSync(siblingTranslated).isDirectory()
  ) {
    return {
      contentRoot: siblingContent,
      translatedRoot: siblingTranslated,
    };
  }

  throw new Error(
    "content と translated-content の場所が判別できません。リポジトリを兄弟に配置するか、MDN_CONTENT_ROOT / MDN_TRANSLATED_CONTENT_ROOT を設定してください。",
  );
}
