#!/usr/bin/env node
/**
 * MCP 未接続時のフォールバック用 CLI（mdn_trans_review と同等の機械チェック）。
 * 通常は Cursor の MCP ツール mdn_trans_review を使うこと。
 */
import { mdnTransReview } from "../tools/review.js";
import { resolveWorkspaceRoots } from "../shared/workspace.js";

function parseJaFileArg(argv: string[]): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--jaFile" || a === "-f") {
      return argv[i + 1];
    }
    if (a.startsWith("--jaFile=")) {
      return a.slice("--jaFile=".length);
    }
    if (a.startsWith("jaFile:")) {
      return a.slice("jaFile:".length).trim();
    }
  }
  return undefined;
}

function main() {
  const jaFile = parseJaFileArg(process.argv.slice(2));
  if (!jaFile) {
    console.error(
      "用法: npm run mdn:trans:review -- --jaFile=files/ja/.../index.md",
    );
    console.error(
      "環境変数 MDN_CONTENT_ROOT と MDN_TRANSLATED_CONTENT_ROOT を設定するか、",
    );
    console.error(
      "content / translated-content を mdn-translation-ja-mcp の兄弟に配置してください。",
    );
    process.exit(1);
  }

  try {
    const roots = resolveWorkspaceRoots();
    const r = mdnTransReview(roots, { jaFile });
    console.log(r.message);
    process.exit(r.findings.some((f) => f.severity === "error") ? 2 : 0);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
