/**
 * 用語集 JSON に基づき {{glossary}} の第2引数を日本語 index.md に安全に書き込む。
 */
import fs from "node:fs/promises";

import type { GlossaryReplacementCandidate } from "./glossary-replacement-candidates.js";
import {
  runMdnGlossaryReplacementCandidates,
  type MdnGlossaryReplacementCandidatesResult,
} from "./glossary-replacement-candidates.js";

export type MdnGlossaryApplyErrorCode =
  | "FILE_CHANGED"
  | "APPLY_MISMATCH"
  | NonNullable<Extract<MdnGlossaryReplacementCandidatesResult, { ok: false }>["code"]>;

export type GlossaryApplyItem = {
  line: number;
  startOffsetInLine: number;
  raw: string;
  suggestedRaw: string;
};

export type MdnGlossaryApplyResult =
  | {
      ok: true;
      dryRun: boolean;
      written: boolean;
      normalizedSlug: string;
      jaIndexPath: string;
      glossaryPath: string;
      applied: GlossaryApplyItem[];
      skippedCount: {
        alreadySet: number;
        missing: number;
      };
    }
  | {
      ok: false;
      code: MdnGlossaryApplyErrorCode | string;
      message: string;
      details?: unknown;
    };

function compareProposedSnapshots(
  a: GlossaryReplacementCandidate[],
  b: GlossaryReplacementCandidate[],
): boolean {
  const pa = a
    .filter((c) => c.status === "proposed")
    .sort(proposedSort);
  const pb = b
    .filter((c) => c.status === "proposed")
    .sort(proposedSort);
  if (pa.length !== pb.length) return false;
  for (let i = 0; i < pa.length; i += 1) {
    const x = pa[i]!;
    const y = pb[i]!;
    if (
      x.line !== y.line ||
      x.startOffsetInLine !== y.startOffsetInLine ||
      x.raw !== y.raw ||
      x.suggestedRaw !== y.suggestedRaw ||
      x.suggestedSecondArg !== y.suggestedSecondArg
    ) {
      return false;
    }
  }
  return true;
}

function proposedSort(
  a: GlossaryReplacementCandidate,
  b: GlossaryReplacementCandidate,
): number {
  if (a.line !== b.line) return a.line - b.line;
  return a.startOffsetInLine - b.startOffsetInLine;
}

function applyProposedToLines(
  lines: string[],
  proposed: GlossaryReplacementCandidate[],
): { ok: true; lines: string[] } | { ok: false } {
  const items = proposed.filter(
    (c): c is GlossaryReplacementCandidate & { suggestedRaw: string } =>
      c.status === "proposed" && c.suggestedRaw !== undefined,
  );

  const byLine = new Map<number, typeof items>();
  for (const p of items) {
    const arr = byLine.get(p.line) ?? [];
    arr.push(p);
    byLine.set(p.line, arr);
  }

  const out = [...lines];
  for (const [, lineItems] of byLine) {
    lineItems.sort((a, b) => b.startOffsetInLine - a.startOffsetInLine);
    for (const p of lineItems) {
      const idx = p.line - 1;
      if (idx < 0 || idx >= out.length) return { ok: false };
      let line = out[idx]!;
      const slice = line.slice(
        p.startOffsetInLine,
        p.startOffsetInLine + p.raw.length,
      );
      if (slice !== p.raw) return { ok: false };
      line =
        line.slice(0, p.startOffsetInLine) +
        p.suggestedRaw +
        line.slice(p.startOffsetInLine + p.raw.length);
      out[idx] = line;
    }
  }

  return { ok: true, lines: out };
}

export async function runMdnGlossaryApply(options: {
  url: string;
  dryRun?: boolean;
  glossaryPath?: string;
  packageRoot?: string;
}): Promise<MdnGlossaryApplyResult> {
  const dryRun = options.dryRun === true;

  const first = await runMdnGlossaryReplacementCandidates({
    url: options.url,
    glossaryPath: options.glossaryPath,
    packageRoot: options.packageRoot,
  });

  if (!first.ok) {
    return first;
  }

  const second = await runMdnGlossaryReplacementCandidates({
    url: options.url,
    glossaryPath: options.glossaryPath,
    packageRoot: options.packageRoot,
  });

  if (!second.ok) {
    return second;
  }

  if (!compareProposedSnapshots(first.candidates, second.candidates)) {
    return {
      ok: false,
      code: "FILE_CHANGED",
      message:
        "置換直前の再読み込みで候補が一致しませんでした。ファイルが他のプロセスやエディタで変更された可能性があります。",
      details: { jaIndexPath: first.jaIndexPath },
    };
  }

  const skippedCount = {
    alreadySet: first.candidates.filter((c) => c.status === "already_set").length,
    missing: first.candidates.filter((c) => c.status === "missing").length,
  };

  const proposed = first.candidates.filter((c) => c.status === "proposed");
  const applied: GlossaryApplyItem[] = proposed.map((c) => ({
    line: c.line,
    startOffsetInLine: c.startOffsetInLine,
    raw: c.raw,
    suggestedRaw: c.suggestedRaw!,
  }));

  if (proposed.length === 0) {
    return {
      ok: true,
      dryRun,
      written: false,
      normalizedSlug: first.normalizedSlug,
      jaIndexPath: first.jaIndexPath,
      glossaryPath: first.glossaryPath,
      applied: [],
      skippedCount,
    };
  }

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      written: false,
      normalizedSlug: first.normalizedSlug,
      jaIndexPath: first.jaIndexPath,
      glossaryPath: first.glossaryPath,
      applied,
      skippedCount,
    };
  }

  const text = await fs.readFile(first.jaIndexPath, "utf8");
  const lines = text.split(/\r?\n/);
  const appliedLines = applyProposedToLines(lines, proposed);
  if (!appliedLines.ok) {
    return {
      ok: false,
      code: "APPLY_MISMATCH",
      message:
        "ファイル内容が期待と一致しません。マクロの位置または内容が変わった可能性があります。",
      details: { jaIndexPath: first.jaIndexPath },
    };
  }

  const newText = appliedLines.lines.join("\n");
  await fs.writeFile(first.jaIndexPath, newText, "utf8");

  return {
    ok: true,
    dryRun: false,
    written: true,
    normalizedSlug: first.normalizedSlug,
    jaIndexPath: first.jaIndexPath,
    glossaryPath: first.glossaryPath,
    applied,
    skippedCount,
  };
}
