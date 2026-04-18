import fs from "node:fs";
import path from "node:path";

import type { WorkspaceRoots } from "../shared/workspace.js";
import { loadProhibitedExpressions } from "../shared/load-prohibited-expressions.js";
import { getRulesDir } from "../shared/paths.js";

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

  const text = fs.readFileSync(jaPath, "utf8");
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
    `レビュー対象: ${jaPath}`,
    `検出件数: ${findings.length}`,
    "",
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
