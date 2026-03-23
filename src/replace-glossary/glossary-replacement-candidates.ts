/**
 * 用語集 JSON に基づき {{glossary}} の第2引数（表示名）置換候補を列挙する。
 */
import type { GlossaryMacroMatch, MdnGlossaryMacroScanResult } from "../shared/glossary-macro-scan.js";
import { runMdnGlossaryMacroScan } from "../shared/glossary-macro-scan.js";
import {
  loadGlossaryJson,
  lookupSecondArg,
  type LoadGlossaryJsonResult,
} from "../shared/glossary-loader.js";

const MISSING_MESSAGE =
  "用語集 JSON に該当するスラグがありません。Mozilla L10N 用語集（Wiki）を手動で確認してください。";

/** glossary 第2引数候補の分類。 */
export type GlossaryReplacementCandidateStatus =
  | "proposed"
  | "missing"
  | "already_set";

/** 1 件の glossary 置換候補。 */
export type GlossaryReplacementCandidate = {
  line: number;
  startOffsetInLine: number;
  raw: string;
  macroName: "glossary" | "Glossary";
  firstArg: string;
  status: GlossaryReplacementCandidateStatus;
  suggestedSecondArg?: string;
  suggestedRaw?: string;
  message?: string;
};

/** `mdn_glossary_replacement_candidates` の戻り値。 */
export type MdnGlossaryReplacementCandidatesResult =
  | {
      ok: true;
      normalizedSlug: string;
      jaIndexPath: string;
      glossaryPath: string;
      candidates: GlossaryReplacementCandidate[];
    }
  | Extract<MdnGlossaryMacroScanResult, { ok: false }>
  | Extract<LoadGlossaryJsonResult, { ok: false }>;

function quoteForGlossaryMacro(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** 第2引数を含む `{{glossary(...)}}` 文字列を生成する。 */
export function buildSuggestedGlossaryMacro(
  macroName: "glossary" | "Glossary",
  firstArg: string,
  secondArg: string,
): string {
  const a = quoteForGlossaryMacro(firstArg);
  const b = quoteForGlossaryMacro(secondArg);
  return `{{${macroName}(${a}, ${b})}}`;
}

function matchToCandidate(
  m: GlossaryMacroMatch,
  secondArg: string | undefined,
): GlossaryReplacementCandidate {
  if (m.hasSecondArg) {
    return {
      line: m.line,
      startOffsetInLine: m.startOffsetInLine,
      raw: m.raw,
      macroName: m.macroName,
      firstArg: m.firstArg,
      status: "already_set",
      message: "第2引数が既に指定されているため、候補は生成しません。",
    };
  }

  if (secondArg !== undefined) {
    return {
      line: m.line,
      startOffsetInLine: m.startOffsetInLine,
      raw: m.raw,
      macroName: m.macroName,
      firstArg: m.firstArg,
      status: "proposed",
      suggestedSecondArg: secondArg,
      suggestedRaw: buildSuggestedGlossaryMacro(m.macroName, m.firstArg, secondArg),
    };
  }

  return {
    line: m.line,
    startOffsetInLine: m.startOffsetInLine,
    raw: m.raw,
    macroName: m.macroName,
    firstArg: m.firstArg,
    status: "missing",
    message: MISSING_MESSAGE,
  };
}

/** URL に対応する翻訳ファイルの glossary 第2引数候補を生成する。 */
export async function runMdnGlossaryReplacementCandidates(options: {
  url: string;
  glossaryPath?: string;
  packageRoot?: string;
}): Promise<MdnGlossaryReplacementCandidatesResult> {
  const scan = await runMdnGlossaryMacroScan({
    url: options.url,
    packageRoot: options.packageRoot,
  });

  if (!scan.ok) {
    return scan;
  }

  const glossary = await loadGlossaryJson({
    path: options.glossaryPath,
  });

  if (!glossary.ok) {
    return glossary;
  }

  const candidates = scan.matches.map((m) =>
    matchToCandidate(m, lookupSecondArg(glossary.data, m.firstArg)),
  );

  return {
    ok: true,
    normalizedSlug: scan.normalizedSlug,
    jaIndexPath: scan.jaIndexPath,
    glossaryPath: glossary.path,
    candidates,
  };
}
