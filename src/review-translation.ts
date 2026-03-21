/**
 * ルールベースの翻訳レビュー（Issue #13 review_translation v1）。
 */
import fs from "node:fs/promises";

import matter from "gray-matter";

import { loadGlossaryJson, lookupSecondArg, type GlossaryData } from "./glossary-loader.js";
import { scanGlossaryMacrosInText } from "./glossary-macro-scan.js";
import {
  resolveMdnPageFromUrl,
  type ResolveMdnPageFromUrlResult,
} from "./mdn-url-resolve.js";
import { loadTranslationRules, type TranslationRules } from "./translation-rules.js";

export type ReviewFindingSeverity = "error" | "warning" | "info";

export type ReviewFindingCategory =
  | "front_matter"
  | "untranslated"
  | "glossary"
  | "style";

export type ReviewFinding = {
  severity: ReviewFindingSeverity;
  category: ReviewFindingCategory;
  code: string;
  message: string;
  line?: number;
  column?: number;
  snippet?: string;
};

export type ReviewTranslationRulesMeta = {
  editorialUrl: string;
  l10nUrl: string;
  glossaryUrl: string;
  styleUrl: string;
};

export type ReviewTranslationSuccess = {
  ok: true;
  version: "1";
  normalizedSlug: string;
  jaIndexPath: string;
  glossaryPath: string;
  rules: ReviewTranslationRulesMeta;
  findings: ReviewFinding[];
};

export type ReviewTranslationError =
  | Extract<ResolveMdnPageFromUrlResult, { ok: false }>
  | {
      ok: false;
      code: "TRANSLATION_MISSING";
      message: string;
      details?: { jaIndexPath: string };
    }
  | {
      ok: false;
      code: "RULES_LOAD_ERROR";
      message: string;
      details?: unknown;
    }
  | import("./glossary-loader.js").LoadGlossaryJsonResult & { ok: false };

export type ReviewTranslationResult = ReviewTranslationSuccess | ReviewTranslationError;

function rulesMetaFromTranslationRules(r: TranslationRules): ReviewTranslationRulesMeta {
  return {
    editorialUrl: r.editorial.url,
    l10nUrl: r.l10n.url,
    glossaryUrl: r.glossary.url,
    styleUrl: r.style.url,
  };
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function hasSourceCommit(data: Record<string, unknown>): boolean {
  const l10n = data.l10n;
  if (l10n === null || l10n === undefined || typeof l10n !== "object") {
    return false;
  }
  const sc = (l10n as Record<string, unknown>).sourceCommit;
  return nonEmptyString(sc);
}

/**
 * front-matter 終了後の本文開始行（1-based）。front-matter が無い場合は 1。
 */
export function bodyStartLineNumber(raw: string): number {
  const lines = raw.split(/\r?\n/);
  if (lines[0] !== "---") {
    return 1;
  }
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i] === "---") {
      return i + 2;
    }
  }
  return 1;
}

/**
 * コードフェンス外の本文を連結（front-matter は含まない `matter` の content を想定）。
 */
export function visibleBodyLinesOutsideFences(bodyContent: string): string[] {
  const lines = bodyContent.split(/\r?\n/);
  let inFence = false;
  const out: string[] = [];
  for (const line of lines) {
    const trimmedStart = line.trimStart();
    if (trimmedStart.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (!inFence) {
      out.push(line);
    }
  }
  return out;
}

/** 行内の `{{ ... }}` を空白化してプレーンテキスト近似にする（未翻訳検出の誤爆軽減）。 */
export function stripInlineMacroBraces(line: string): string {
  return line.replace(/\{\{[\s\S]*?\}\}/g, " ");
}

/**
 * 連続する英単語っぽい塊（3 語以上、各 3 文字以上）を検出する簡易パターン。
 */
const ENGLISH_RUN = /\b[A-Za-z]{3,}(?:\s+[A-Za-z]{3,}){2,}/;

function shouldSkipUntranslatedLine(line: string): boolean {
  const t = line.trim();
  if (t.length === 0) return true;
  if (/^<[a-zA-Z]/.test(t)) return true;
  if (/^https?:\/\//.test(t)) return true;
  if (/^[!*\-#>|]/.test(t) && t.length < 80) return true;
  return false;
}

function checkFrontMatter(raw: string): ReviewFinding[] {
  const out: ReviewFinding[] = [];
  if (!matter.test(raw)) {
    out.push({
      severity: "error",
      category: "front_matter",
      code: "FM_NO_FRONT_MATTER",
      message:
        "front-matter（--- で区切られた YAML）がありません。MDN の index.md では必須です。",
      line: 1,
    });
    return out;
  }

  const parsed = matter(raw);
  const data = parsed.data as Record<string, unknown>;

  if (!nonEmptyString(data.title)) {
    out.push({
      severity: "error",
      category: "front_matter",
      code: "FM_MISSING_TITLE",
      message: "front-matter に title がありません。",
      line: 1,
    });
  }

  if (!nonEmptyString(data.slug)) {
    out.push({
      severity: "error",
      category: "front_matter",
      code: "FM_MISSING_SLUG",
      message: "front-matter に slug がありません。",
      line: 1,
    });
  }

  if (!hasSourceCommit(data)) {
    out.push({
      severity: "warning",
      category: "front_matter",
      code: "FM_MISSING_SOURCE_COMMIT",
      message:
        "front-matter に l10n.sourceCommit がありません。翻訳追跡のため付与を推奨します。",
      line: 1,
    });
  }

  if (data["page-type"] !== undefined) {
    out.push({
      severity: "warning",
      category: "front_matter",
      code: "FM_LEGACY_PAGE_TYPE",
      message:
        "front-matter に page-type が残っています。翻訳向けには通常削除します（mdn-trans-start 後の形を参照）。",
      line: 1,
    });
  }

  if (data.sidebar !== undefined) {
    out.push({
      severity: "warning",
      category: "front_matter",
      code: "FM_LEGACY_SIDEBAR",
      message:
        "front-matter に sidebar が残っています。翻訳向けには通常削除します。",
      line: 1,
    });
  }

  return out;
}

function checkGlossary(
  text: string,
  glossary: GlossaryData,
): ReviewFinding[] {
  const matches = scanGlossaryMacrosInText(text);
  const out: ReviewFinding[] = [];

  for (const m of matches) {
    if (m.hasSecondArg) {
      continue;
    }

    const suggested = lookupSecondArg(glossary, m.firstArg);
    if (suggested !== undefined) {
      out.push({
        severity: "warning",
        category: "glossary",
        code: "GLOSSARY_SECOND_ARG_RECOMMENDED",
        message: `{{${m.macroName}(...)}} に第2引数（表示名）の付与を推奨します（用語集: ${suggested}）。`,
        line: m.line,
        column: m.startOffsetInLine + 1,
        snippet: m.raw,
      });
    } else {
      out.push({
        severity: "warning",
        category: "glossary",
        code: "GLOSSARY_SLUG_NOT_IN_JSON",
        message:
          "用語集 JSON に該当スラグがありません。Mozilla L10N 用語集（Wiki）を手動で確認してください。",
        line: m.line,
        column: m.startOffsetInLine + 1,
        snippet: m.raw,
      });
    }
  }

  return out;
}

function checkUntranslated(bodyContent: string, bodyStartLine: number): ReviewFinding[] {
  const lines = bodyContent.split(/\r?\n/);
  let inFence = false;
  const out: ReviewFinding[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    const lineNo = bodyStartLine + i;
    const trimmedStart = line.trimStart();
    if (trimmedStart.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      continue;
    }

    if (shouldSkipUntranslatedLine(line)) {
      continue;
    }
    const stripped = stripInlineMacroBraces(line);
    if (ENGLISH_RUN.test(stripped)) {
      const match = stripped.match(ENGLISH_RUN);
      const col =
        match && stripped.indexOf(match[0]) >= 0 ? stripped.indexOf(match[0]) + 1 : undefined;
      out.push({
        severity: "warning",
        category: "untranslated",
        code: "UNTRANSLATED_ENGLISH_RUN",
        message:
          "英語の単語列が検出されました。未翻訳の可能性があります（コード・固有名詞は誤検知することがあります）。",
        line: lineNo,
        column: col,
        snippet: line.trim().slice(0, 200),
      });
    }
  }

  return out;
}

function checkStyle(bodyContent: string): ReviewFinding[] {
  const visibleLines = visibleBodyLinesOutsideFences(bodyContent);
  const text = visibleLines.join("\n");

  const hasDesuMasu = /です[。]?|ます[。]?|ません|でした|でしょう|ください/.test(text);
  const hasDearu =
    /である|ではない|ではありません|であった|だった/.test(text) ||
    /(?:^|[\s\u3000])だ[。]?/m.test(text);

  if (hasDesuMasu && hasDearu) {
    return [
      {
        severity: "info",
        category: "style",
        code: "STYLE_DESU_MASU_AND_DEARU_MIX",
        message:
          "です・ます調とだ・である調の両方が本文に見られます。文体を統一できているか確認してください。",
      },
    ];
  }

  return [];
}

export type ReviewTranslationMarkdownOptions = {
  glossaryData: GlossaryData;
};

/**
 * ファイル I/O なしで Markdown 全文をレビューする（テスト用）。
 */
export function reviewTranslationMarkdown(
  raw: string,
  options: ReviewTranslationMarkdownOptions,
): ReviewFinding[] {
  const findings: ReviewFinding[] = [];
  findings.push(...checkFrontMatter(raw));

  const bodyStart = bodyStartLineNumber(raw);
  const parsed = matter(raw);
  const bodyContent = parsed.content;

  findings.push(...checkUntranslated(bodyContent, bodyStart));
  findings.push(...checkGlossary(raw, options.glossaryData));
  findings.push(...checkStyle(bodyContent));

  return findings;
}

export async function runReviewTranslation(options: {
  url: string;
  glossaryPath?: string;
  packageRoot?: string;
  translationRulesJsonPath?: string;
}): Promise<ReviewTranslationResult> {
  let rules: TranslationRules;
  try {
    rules = loadTranslationRules(options.translationRulesJsonPath);
  } catch (e: unknown) {
    return {
      ok: false,
      code: "RULES_LOAD_ERROR",
      message: `翻訳ルール JSON の読み込みに失敗しました: ${String(e)}`,
      details: e,
    };
  }

  const glossary = await loadGlossaryJson({
    path: options.glossaryPath,
  });

  if (!glossary.ok) {
    return glossary;
  }

  const resolved = await resolveMdnPageFromUrl(options.url, {
    packageRoot: options.packageRoot,
  });

  if (!resolved.ok) {
    return resolved;
  }

  if (!resolved.translationExists) {
    return {
      ok: false,
      code: "TRANSLATION_MISSING",
      message: `日本語の index.md が見つかりません: ${resolved.jaIndexPath}`,
      details: { jaIndexPath: resolved.jaIndexPath },
    };
  }

  const raw = await fs.readFile(resolved.jaIndexPath, "utf8");
  const findings = reviewTranslationMarkdown(raw, {
    glossaryData: glossary.data,
  });

  return {
    ok: true,
    version: "1",
    normalizedSlug: resolved.normalizedSlug,
    jaIndexPath: resolved.jaIndexPath,
    glossaryPath: glossary.path,
    rules: rulesMetaFromTranslationRules(rules),
    findings,
  };
}
