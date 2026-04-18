import fs from "node:fs";
import path from "node:path";

import type { WorkspaceRoots } from "../shared/workspace.js";
import { loadProhibitedExpressions } from "../shared/load-prohibited-expressions.js";
import { getRulesDir } from "../shared/paths.js";

const REVIEW_READ_ONLY_BANNER = [
  "========================================",
  "READ-ONLY: mdn_trans_review",
  "このツールはレビュー対象ファイルを変更しません。",
  "エージェントはこの結果を理由に当該ファイルを編集・保存してはいけません。",
  "（ユーザーが「修正して」等と明示した場合のみ編集可）",
  "========================================",
  "",
].join("\n");

export type ReviewArgs = {
  jaFile: string;
};

export type ReviewFinding = {
  ruleId: string;
  severity: string;
  message: string;
  excerpt?: string;
};

function resolveJaFile(roots: WorkspaceRoots, jaFile: string): string {
  const p = path.isAbsolute(jaFile)
    ? jaFile
    : path.join(roots.translatedRoot, jaFile);
  const normalized = path.normalize(p);
  const base = path.resolve(roots.translatedRoot);
  if (!normalized.startsWith(base + path.sep) && normalized !== base) {
    throw new Error(
      `指定パスは translated-content の外に出ています: ${jaFile}`,
    );
  }
  return normalized;
}

/**
 * 禁止・注意表現の簡易チェック（読み取りのみ）。
 * 対象ファイルやリポジトリには一切書き込まない。
 */
export function mdnTransReview(
  roots: WorkspaceRoots,
  args: ReviewArgs,
): { message: string; jaFile: string; findings: ReviewFinding[] } {
  const jaPath = resolveJaFile(roots, args.jaFile);
  if (!fs.existsSync(jaPath)) {
    throw new Error(`ファイルが見つかりません: ${jaPath}`);
  }

  const rulesDir = getRulesDir();
  const prohibitedPath = path.join(rulesDir, "prohibited-expressions.json");
  const prohibited = loadProhibitedExpressions(prohibitedPath);

  const fd = fs.openSync(jaPath, fs.constants.O_RDONLY);
  let text: string;
  try {
    text = fs.readFileSync(fd, "utf8");
  } finally {
    fs.closeSync(fd);
  }
  const findings: ReviewFinding[] = [];

  for (const item of prohibited.items) {
    if (item.matchType !== "literal") {
      continue;
    }
    if (text.includes(item.pattern)) {
      findings.push({
        ruleId: item.id,
        severity: item.severity,
        message: item.message,
        excerpt: item.pattern,
      });
    }
  }

  const lines: string[] = [
    REVIEW_READ_ONLY_BANNER,
    `レビュー対象: ${jaPath}`,
    `検出件数: ${findings.length}`,
    "",
    "（このツールはファイルを書き込みません。読み取りとレポートのみです。）",
    "（禁止・注意表現リストに基づく簡易チェック。詳細はエージェントがガイドラインを参照してください。）",
  ];
  for (const f of findings) {
    lines.push(
      `- [${f.severity}] ${f.ruleId}: ${f.message}${f.excerpt ? `（パターン: ${f.excerpt}）` : ""}`,
    );
  }

  return {
    message: lines.join("\n"),
    jaFile: jaPath,
    findings,
  };
}
