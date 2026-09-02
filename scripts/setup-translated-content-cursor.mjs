#!/usr/bin/env node
/**
 * translated-content/.cursor/ に mcp.json を生成する。
 * Rule は任意（--with-rules）。Skills はコピーしない。
 *
 * 用法（mdn-translation-ja-mcp リポジトリルートで）:
 *   node scripts/setup-translated-content-cursor.mjs
 *   node scripts/setup-translated-content-cursor.mjs /path/to/translated-content
 *   node scripts/setup-translated-content-cursor.mjs --with-rules
 *   node scripts/setup-translated-content-cursor.mjs --with-rules /path/to/translated-content
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @param {string[]} args
 * @returns {{ withRules: boolean; translatedRootArg: string | undefined }}
 */
export function parseSetupArgs(args) {
  let withRules = false;
  /** @type {string | undefined} */
  let translatedRootArg;
  for (const arg of args) {
    if (arg === "--with-rules") {
      withRules = true;
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`不明なオプションです: ${arg}`);
    }
    if (translatedRootArg !== undefined) {
      throw new Error(
        `translated-content のパスは1つだけ指定してください: ${arg}`,
      );
    }
    translatedRootArg = arg;
  }
  return { withRules, translatedRootArg };
}

/**
 * @param {{
 *   mcpRepoRoot: string;
 *   translatedRoot: string;
 *   contentRoot: string;
 *   distIndex: string;
 *   withRules?: boolean;
 * }} opts
 * @returns {{ mcpJsonPath: string; ruleDest: string | undefined; contentRootExists: boolean }}
 */
export function setupTranslatedContentCursor(opts) {
  const {
    mcpRepoRoot,
    translatedRoot,
    contentRoot,
    distIndex,
    withRules = false,
  } = opts;

  if (!fs.existsSync(distIndex)) {
    throw new Error(
      "dist/index.js がありません。先に mdn-translation-ja-mcp で npm run build を実行してください。",
    );
  }

  if (
    !fs.existsSync(translatedRoot) ||
    !fs.statSync(translatedRoot).isDirectory()
  ) {
    throw new Error(
      `translated-content が見つかりません: ${translatedRoot}\n第1引数に translated-content のパスを指定してください。`,
    );
  }

  const cursorDir = path.join(translatedRoot, ".cursor");
  fs.mkdirSync(cursorDir, { recursive: true });

  const mcpJson = {
    mcpServers: {
      "mdn-translation-ja": {
        command: "node",
        args: [distIndex],
        env: {
          MDN_CONTENT_ROOT: contentRoot,
          MDN_TRANSLATED_CONTENT_ROOT: translatedRoot,
        },
      },
    },
  };

  const mcpJsonPath = path.join(cursorDir, "mcp.json");
  fs.writeFileSync(
    mcpJsonPath,
    `${JSON.stringify(mcpJson, null, 2)}\n`,
    "utf8",
  );

  /** @type {string | undefined} */
  let ruleDest;
  if (withRules) {
    const rulesDir = path.join(cursorDir, "rules");
    fs.mkdirSync(rulesDir, { recursive: true });
    const ruleSrc = path.join(
      mcpRepoRoot,
      "integrations",
      "cursor",
      "rules",
      "01-mdn-mcp-tools.mdc",
    );
    ruleDest = path.join(rulesDir, "01-mdn-mcp-tools.mdc");
    fs.copyFileSync(ruleSrc, ruleDest);
  }

  return {
    mcpJsonPath,
    ruleDest,
    contentRootExists: fs.existsSync(contentRoot),
  };
}

function runCli() {
  const mcpRepoRoot = path.join(__dirname, "..");
  const defaultTranslated = path.join(mcpRepoRoot, "..", "translated-content");
  const defaultContent = path.join(mcpRepoRoot, "..", "content");
  const distIndex = path.join(mcpRepoRoot, "dist", "index.js");

  let withRules;
  let translatedRootArg;
  try {
    ({ withRules, translatedRootArg } = parseSetupArgs(process.argv.slice(2)));
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const translatedRoot = path.resolve(translatedRootArg ?? defaultTranslated);
  const contentRoot = path.resolve(
    process.env.MDN_CONTENT_ROOT ?? defaultContent,
  );

  let result;
  try {
    result = setupTranslatedContentCursor({
      mcpRepoRoot,
      translatedRoot,
      contentRoot,
      distIndex,
      withRules,
    });
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  console.log("生成しました:");
  console.log(`  ${result.mcpJsonPath}`);
  if (result.ruleDest !== undefined) {
    console.log(`  ${result.ruleDest}`);
  }
  console.log("");
  console.log("次の手順:");
  console.log("  1. Cursor で translated-content をワークスペースとして開く");
  console.log("  2. Cursor を再読み込み（ウィンドウのリロード）");
  console.log(
    "  3. 設定 > MCP でサーバー mdn-translation-ja が有効・接続済みか確認",
  );
  console.log(
    "  4. 標準手順は MCP Prompt（mdn_translate / mdn_sync / mdn_review）を使う（npm start は不要）",
  );
  if (!withRules) {
    console.log("");
    console.log(
      "Rule はコピーしていません。エージェントがツール名をシェルと誤認する場合は --with-rules を付けて再実行してください。",
    );
  }
  if (!result.contentRootExists) {
    console.warn("");
    console.warn(`警告: content リポジトリが見つかりません: ${contentRoot}`);
    console.warn(
      "mdn_trans_commit_get 等で必要です。MDN_CONTENT_ROOT を見直してください。",
    );
  }
}

const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invoked === fileURLToPath(import.meta.url)) {
  runCli();
}
