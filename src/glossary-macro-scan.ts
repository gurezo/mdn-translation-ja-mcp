/**
 * 翻訳 Markdown 内の `{{glossary("…")}}` / `{{Glossary("…")}}` マクロを列挙する。
 */
import fs from "node:fs/promises";

import {
  resolveMdnPageFromUrl,
  type ResolveMdnPageFromUrlResult,
} from "./mdn-url-resolve.js";

export type GlossaryMacroMatch = {
  /** 1 始まりの行番号 */
  line: number;
  /** マクロ文字列全体（`{{` から `}}` まで） */
  raw: string;
  macroName: "glossary" | "Glossary";
  firstArg: string;
  hasSecondArg: boolean;
  secondArg?: string;
};

export type MdnGlossaryMacroScanErrorCode =
  | NonNullable<Extract<ResolveMdnPageFromUrlResult, { ok: false }>["code"]>
  | "TRANSLATION_MISSING";

export type MdnGlossaryMacroScanResult =
  | {
      ok: true;
      normalizedSlug: string;
      jaIndexPath: string;
      matches: GlossaryMacroMatch[];
    }
  | {
      ok: false;
      code: MdnGlossaryMacroScanErrorCode | string;
      message: string;
      details?: unknown;
    };

const MACRO_HEAD = /\{\{\s*(glossary|Glossary)\s*\(/g;

function parseQuotedString(
  line: string,
  start: number,
): { value: string; end: number } | null {
  if (line[start] !== '"') return null;
  let i = start + 1;
  let value = "";
  while (i < line.length) {
    const c = line[i];
    if (c === "\\") {
      if (i + 1 >= line.length) return null;
      value += line[i + 1];
      i += 2;
      continue;
    }
    if (c === '"') {
      return { value, end: i + 1 };
    }
    value += c;
    i += 1;
  }
  return null;
}

/**
 * 1 行の `from` 以降で、次の完全な glossary マクロをパースする。
 * 構文が完結しない場合は null（誤検知を避けるためスキップして次の `{{` を探す）。
 */
function tryParseMacroAtLine(
  line: string,
  lineNumber: number,
  from: number,
): { match: GlossaryMacroMatch; end: number } | null {
  MACRO_HEAD.lastIndex = 0;
  const slice = line.slice(from);
  const m = MACRO_HEAD.exec(slice);
  if (!m || m.index === undefined) return null;

  const macroStart = from + m.index;
  const macroName = m[1] as "glossary" | "Glossary";
  let afterOpenParen = macroStart + m[0].length; /* after "{{...glossary(" */
  while (afterOpenParen < line.length && /\s/.test(line[afterOpenParen]!)) {
    afterOpenParen += 1;
  }

  const first = parseQuotedString(line, afterOpenParen);
  if (!first) return null;

  let pos = first.end;
  while (pos < line.length && /\s/.test(line[pos]!)) pos += 1;

  if (line[pos] === ")") {
    pos += 1;
    while (pos < line.length && /\s/.test(line[pos]!)) pos += 1;
    if (line.slice(pos, pos + 2) !== "}}") return null;
    const raw = line.slice(macroStart, pos + 2);
    return {
      match: {
        line: lineNumber,
        raw,
        macroName,
        firstArg: first.value,
        hasSecondArg: false,
      },
      end: pos + 2,
    };
  }

  if (line[pos] !== ",") return null;
  pos += 1;
  while (pos < line.length && /\s/.test(line[pos]!)) pos += 1;

  const second = parseQuotedString(line, pos);
  if (!second) return null;
  pos = second.end;
  while (pos < line.length && /\s/.test(line[pos]!)) pos += 1;

  if (line[pos] !== ")") return null;
  pos += 1;
  while (pos < line.length && /\s/.test(line[pos]!)) pos += 1;
  if (line.slice(pos, pos + 2) !== "}}") return null;

  const raw = line.slice(macroStart, pos + 2);
  return {
    match: {
      line: lineNumber,
      raw,
      macroName,
      firstArg: first.value,
      hasSecondArg: true,
      secondArg: second.value,
    },
    end: pos + 2,
  };
}

/**
 * Markdown 全文を走査し、行番号付きで glossary マクロをすべて返す。
 */
export function scanGlossaryMacrosInText(markdown: string): GlossaryMacroMatch[] {
  const lines = markdown.split(/\r?\n/);
  const out: GlossaryMacroMatch[] = [];

  for (let li = 0; li < lines.length; li += 1) {
    const line = lines[li]!;
    const lineNumber = li + 1;
    let cursor = 0;
    while (cursor < line.length) {
      const next = line.indexOf("{{", cursor);
      if (next === -1) break;

      const parsed = tryParseMacroAtLine(line, lineNumber, next);
      if (parsed) {
        out.push(parsed.match);
        cursor = parsed.end;
      } else {
        cursor = next + 2;
      }
    }
  }

  return out;
}

export async function runMdnGlossaryMacroScan(options: {
  url: string;
  packageRoot?: string;
}): Promise<MdnGlossaryMacroScanResult> {
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

  const text = await fs.readFile(resolved.jaIndexPath, "utf8");
  const matches = scanGlossaryMacrosInText(text);

  return {
    ok: true,
    normalizedSlug: resolved.normalizedSlug,
    jaIndexPath: resolved.jaIndexPath,
    matches,
  };
}
