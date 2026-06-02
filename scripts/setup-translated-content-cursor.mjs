#!/usr/bin/env node
/**
 * translated-content/.cursor/ に mcp.json と MCP 呼び出し Rule を生成する。
 *
 * 用法（mdn-translation-ja-mcp リポジトリルートで）:
 *   node scripts/setup-translated-content-cursor.mjs
 *   node scripts/setup-translated-content-cursor.mjs /path/to/translated-content
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mcpRepoRoot = path.join(__dirname, "..");
const defaultTranslated = path.join(mcpRepoRoot, "..", "translated-content");
const defaultContent = path.join(mcpRepoRoot, "..", "content");
const distIndex = path.join(mcpRepoRoot, "dist", "index.js");

const translatedRoot = path.resolve(process.argv[2] ?? defaultTranslated);
const contentRoot = path.resolve(
  process.env.MDN_CONTENT_ROOT ?? defaultContent,
);

if (!fs.existsSync(distIndex)) {
  console.error(
    "dist/index.js がありません。先に mdn-translation-ja-mcp で npm run build を実行してください。",
  );
  process.exit(1);
}

if (!fs.statSync(translatedRoot).isDirectory()) {
  console.error(`translated-content が見つかりません: ${translatedRoot}`);
  console.error("第1引数に translated-content のパスを指定してください。");
  process.exit(1);
}

const cursorDir = path.join(translatedRoot, ".cursor");
const rulesDir = path.join(cursorDir, "rules");
fs.mkdirSync(rulesDir, { recursive: true });

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

fs.writeFileSync(
  path.join(cursorDir, "mcp.json"),
  `${JSON.stringify(mcpJson, null, 2)}\n`,
  "utf8",
);

const ruleSrc = path.join(
  mcpRepoRoot,
  "examples",
  "translated-content-cursor-rules",
  "01-mdn-mcp-tools.mdc",
);
const ruleDest = path.join(rulesDir, "01-mdn-mcp-tools.mdc");
fs.copyFileSync(ruleSrc, ruleDest);

console.log("生成しました:");
console.log(`  ${path.join(cursorDir, "mcp.json")}`);
console.log(`  ${ruleDest}`);
console.log("");
console.log("次の手順:");
console.log("  1. Cursor で translated-content をワークスペースとして開く");
console.log("  2. Cursor を再読み込み（ウィンドウのリロード）");
console.log(
  "  3. 設定 > MCP でサーバー mdn-translation-ja が有効・接続済みか確認",
);
console.log(
  "  4. チャットで MCP ツール mdn_trans_review を呼び出す（npm start は不要）",
);
if (!fs.existsSync(contentRoot)) {
  console.warn("");
  console.warn(
    `警告: content リポジトリが見つかりません: ${contentRoot}`,
  );
  console.warn(
    "mdn_trans_commit_get 等で必要です。MDN_CONTENT_ROOT を見直してください。",
  );
}
