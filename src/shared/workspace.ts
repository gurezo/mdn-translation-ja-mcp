/**
 * mdn/content と mdn/translated-content のローカルパスを解決する。
 * 推奨: 親ディレクトリに content / translated-content / mdn-translation-ja-mcp が並ぶ構成。
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** `content` / `translated-content` の解決済みルート。 */
export const ENV_MDN_CONTENT_ROOT = "MDN_CONTENT_ROOT";
export const ENV_MDN_TRANSLATED_CONTENT_ROOT = "MDN_TRANSLATED_CONTENT_ROOT";

/** MDN 参照対象 2 リポジトリの絶対パス。 */
export type MdnWorkspacePaths = {
  contentRoot: string;
  translatedContentRoot: string;
};

/** ワークスペース解決時の失敗コード。 */
export type ResolveWorkspaceErrorCode =
  | "ENV_PARTIAL"
  | "SIBLING_MISSING"
  | "NOT_DIRECTORY"
  | "INVALID_MDN_LAYOUT";

/** `INVALID_MDN_LAYOUT` の詳細区分。 */
export type MdnLayoutInvalidPart =
  | "content-files-en-us"
  | "translated-files-ja";

/** ワークスペース解決 API の戻り値。 */
export type ResolveWorkspaceResult =
  | { ok: true; paths: MdnWorkspacePaths }
  | {
      ok: false;
      code: ResolveWorkspaceErrorCode;
      message: string;
      details: {
        contentRoot: string;
        translatedContentRoot: string;
        workspaceParent: string;
        missing: ("content" | "translated-content")[];
        notDirectory: ("content" | "translated-content")[];
        /** mdn/content に相当するリポジトリ内の英語本文ルート（files/en-us） */
        expectedContentFilesEnUs?: string;
        /** mdn/translated-content に相当するリポジトリ内の日本語本文ルート（files/ja） */
        expectedTranslatedFilesJa?: string;
        /** INVALID_MDN_LAYOUT 時: どちらが不正か */
        layoutInvalid?: MdnLayoutInvalidPart[];
      };
    };

function packageRootFromThisModule(): string {
  const filePath = fileURLToPath(import.meta.url);
  const dir = path.dirname(filePath);
  return path.dirname(dir);
}

async function pathKind(
  absolutePath: string,
): Promise<"missing" | "file" | "directory"> {
  try {
    const st = await fs.stat(absolutePath);
    return st.isDirectory() ? "directory" : "file";
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") return "missing";
    throw e;
  }
}

/**
 * 環境変数または本パッケージの親ディレクトリ（兄弟リポジトリ）からパスを解決する。
 *
 * - `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` は**両方**セットするか**両方**未設定にする。
 * - 未設定のときは、このファイルのパッケージルートの親を `workspaceParent` とし、
 *   `workspaceParent/content` と `workspaceParent/translated-content` を使う。
 */
export async function resolveMdnWorkspacePaths(options?: {
  /** テスト用: 本リポジトリのルート（mdn-translation-ja-mcp）を模倣する絶対パス */
  packageRoot?: string;
}): Promise<ResolveWorkspaceResult> {
  const rawContent = process.env[ENV_MDN_CONTENT_ROOT];
  const rawTranslated = process.env[ENV_MDN_TRANSLATED_CONTENT_ROOT];
  const hasContent = rawContent !== undefined && rawContent !== "";
  const hasTranslated = rawTranslated !== undefined && rawTranslated !== "";

  if (hasContent !== hasTranslated) {
    const packageRoot = options?.packageRoot ?? packageRootFromThisModule();
    const workspaceParent = path.dirname(packageRoot);
    return {
      ok: false,
      code: "ENV_PARTIAL",
      message:
        `${ENV_MDN_CONTENT_ROOT} と ${ENV_MDN_TRANSLATED_CONTENT_ROOT} は両方とも設定するか、両方とも未設定にしてください。` +
        " 推奨ディレクトリ構成は README の「推奨ディレクトリ構成」を参照してください。",
      details: {
        contentRoot: "",
        translatedContentRoot: "",
        workspaceParent,
        missing: [],
        notDirectory: [],
      },
    };
  }

  const packageRoot = options?.packageRoot ?? packageRootFromThisModule();
  const workspaceParent = path.dirname(packageRoot);

  let contentRoot: string;
  let translatedContentRoot: string;

  if (hasContent && hasTranslated) {
    contentRoot = path.resolve(rawContent!);
    translatedContentRoot = path.resolve(rawTranslated!);
  } else {
    contentRoot = path.join(workspaceParent, "content");
    translatedContentRoot = path.join(workspaceParent, "translated-content");
  }

  const [kindContent, kindTranslated] = await Promise.all([
    pathKind(contentRoot),
    pathKind(translatedContentRoot),
  ]);

  const missing: ("content" | "translated-content")[] = [];
  const notDirectory: ("content" | "translated-content")[] = [];

  if (kindContent === "missing") missing.push("content");
  else if (kindContent !== "directory") notDirectory.push("content");

  if (kindTranslated === "missing") missing.push("translated-content");
  else if (kindTranslated !== "directory")
    notDirectory.push("translated-content");

  if (missing.length > 0) {
    return {
      ok: false,
      code: "SIBLING_MISSING",
      message:
        "次のディレクトリが見つかりません: " +
        missing.join(", ") +
        "。content と translated-content を同じ親ディレクトリに clone するか、" +
        `${ENV_MDN_CONTENT_ROOT} / ${ENV_MDN_TRANSLATED_CONTENT_ROOT} でパスを指定してください。`,
      details: {
        contentRoot,
        translatedContentRoot,
        workspaceParent,
        missing,
        notDirectory,
      },
    };
  }

  if (notDirectory.length > 0) {
    return {
      ok: false,
      code: "NOT_DIRECTORY",
      message:
        "次のパスはディレクトリではありません: " +
        notDirectory.join(", ") +
        "。",
      details: {
        contentRoot,
        translatedContentRoot,
        workspaceParent,
        missing,
        notDirectory,
      },
    };
  }

  const expectedContentFilesEnUs = path.join(contentRoot, "files", "en-us");
  const expectedTranslatedFilesJa = path.join(
    translatedContentRoot,
    "files",
    "ja",
  );

  const [kindEnUs, kindJa] = await Promise.all([
    pathKind(expectedContentFilesEnUs),
    pathKind(expectedTranslatedFilesJa),
  ]);

  const layoutInvalid: MdnLayoutInvalidPart[] = [];
  if (kindEnUs !== "directory") layoutInvalid.push("content-files-en-us");
  if (kindJa !== "directory") layoutInvalid.push("translated-files-ja");

  if (layoutInvalid.length > 0) {
    return {
      ok: false,
      code: "INVALID_MDN_LAYOUT",
      message:
        "指定されたパスは mdn/content および mdn/translated-content のリポジトリ構成ではありません。" +
        " 各ルート直下に files/en-us と files/ja ディレクトリがあること（公式リポジトリを clone した状態）を確認してください。" +
        " 空のフォルダだけ作成した場合もこのエラーになります。",
      details: {
        contentRoot,
        translatedContentRoot,
        workspaceParent,
        missing,
        notDirectory,
        expectedContentFilesEnUs,
        expectedTranslatedFilesJa,
        layoutInvalid,
      },
    };
  }

  return {
    ok: true,
    paths: {
      contentRoot,
      translatedContentRoot,
    },
  };
}
