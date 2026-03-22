/**
 * 用語集 JSON（マクロ第2引数の候補）を読み込む。
 * デフォルトは本モジュールと同階層の `data/glossary-terms.json`（ビルド後は dist/shared/data）。
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

export const ENV_MDN_GLOSSARY_JSON = "MDN_GLOSSARY_JSON_PATH";

const GlossaryDataSchema = z.object({
  terms: z.record(
    z.string(),
    z.object({
      secondArg: z.string(),
    }),
  ),
});

export type GlossaryData = z.infer<typeof GlossaryDataSchema>;

export type LoadGlossaryJsonErrorCode =
  | "GLOSSARY_PATH_MISSING"
  | "GLOSSARY_READ_ERROR"
  | "GLOSSARY_INVALID";

export type LoadGlossaryJsonResult =
  | { ok: true; path: string; data: GlossaryData }
  | {
      ok: false;
      code: LoadGlossaryJsonErrorCode;
      message: string;
      path: string;
      details?: unknown;
    };

function moduleDirname(): string {
  return path.dirname(fileURLToPath(import.meta.url));
}

/**
 * 同梱用語集のパス（`src/shared/glossary-loader.ts` → `src/shared/data/…`、`dist/shared/glossary-loader.js` → `dist/shared/data/…`）。
 */
export function defaultBundledGlossaryPath(options?: {
  /** テスト用: 本パッケージルートを模倣する絶対パス（未指定時は import.meta.url から算出） */
  moduleDir?: string;
}): string {
  const dir = options?.moduleDir ?? moduleDirname();
  return path.join(dir, "data", "glossary-terms.json");
}

function resolveGlossaryPath(options?: {
  /** 明示パス（ツール引数など）。絶対パスまたは cwd 相対。 */
  path?: string;
  /** テスト用: defaultBundledGlossaryPath に渡す */
  moduleDir?: string;
}): string {
  const fromEnv = process.env[ENV_MDN_GLOSSARY_JSON];
  if (options?.path !== undefined && options.path !== "") {
    return path.resolve(options.path);
  }
  if (fromEnv !== undefined && fromEnv !== "") {
    return path.resolve(fromEnv);
  }
  return defaultBundledGlossaryPath({ moduleDir: options?.moduleDir });
}

export async function loadGlossaryJson(options?: {
  path?: string;
  moduleDir?: string;
}): Promise<LoadGlossaryJsonResult> {
  const glossaryPath = resolveGlossaryPath(options);

  let raw: string;
  try {
    raw = await fs.readFile(glossaryPath, "utf8");
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return {
        ok: false,
        code: "GLOSSARY_PATH_MISSING",
        path: glossaryPath,
        message: `用語集ファイルが見つかりません: ${glossaryPath}`,
        details: { cause: err.message },
      };
    }
    return {
      ok: false,
      code: "GLOSSARY_READ_ERROR",
      path: glossaryPath,
      message: `用語集ファイルの読み込みに失敗しました: ${glossaryPath}`,
      details: { cause: err.message },
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch (e: unknown) {
    return {
      ok: false,
      code: "GLOSSARY_INVALID",
      path: glossaryPath,
      message: "用語集 JSON のパースに失敗しました。",
      details: { cause: String(e) },
    };
  }

  const result = GlossaryDataSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      code: "GLOSSARY_INVALID",
      path: glossaryPath,
      message: "用語集 JSON の形式が不正です（terms と各エントリの secondArg を確認してください）。",
      details: result.error.flatten(),
    };
  }

  return {
    ok: true,
    path: glossaryPath,
    data: result.data,
  };
}

/**
 * `firstArg`（用語スラッグ）に対応する第2引数候補を返す。無ければ undefined。
 */
export function lookupSecondArg(
  data: GlossaryData,
  firstArg: string,
): string | undefined {
  return data.terms[firstArg]?.secondArg;
}
