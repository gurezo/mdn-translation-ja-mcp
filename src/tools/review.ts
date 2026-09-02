import fs from "node:fs";

import {
  formatFindingsReport,
  runGuidelineReview,
} from "../review/run-guideline-review.js";
import { resolveJaFile } from "../shared/resolve-ja-file.js";
import type { WorkspaceRoots } from "../shared/workspace.js";

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
  skill: string;
  ruleId: string;
  severity: string;
  message: string;
  excerpt?: string;
};

export type ReviewResult = {
  message: string;
  jaFile: string;
  findings: ReviewFinding[];
  summaryBySkill: Record<string, number>;
};

/**
 * .agents/skills 由来のガイドライン機械チェック（読み取りのみ）。
 * 対象ファイルやリポジトリには一切書き込まない。
 */
export function mdnTransReview(
  roots: WorkspaceRoots,
  args: ReviewArgs,
): ReviewResult {
  const jaPath = resolveJaFile(roots, args.jaFile);
  if (!fs.existsSync(jaPath)) {
    throw new Error(`ファイルが見つかりません: ${jaPath}`);
  }

  const fd = fs.openSync(jaPath, fs.constants.O_RDONLY);
  let text: string;
  try {
    text = fs.readFileSync(fd, "utf8");
  } finally {
    fs.closeSync(fd);
  }

  const { findings, summaryBySkill } = runGuidelineReview(text);

  const message = [
    REVIEW_READ_ONLY_BANNER,
    formatFindingsReport(jaPath, { findings, summaryBySkill }),
    "（このツールはファイルを書き込みません。読み取りとレポートのみです。）",
  ].join("\n");

  return {
    message,
    jaFile: jaPath,
    findings,
    summaryBySkill,
  };
}
