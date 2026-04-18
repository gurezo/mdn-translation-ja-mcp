/** {{glossary("id")}} または {{glossary('id')}}（1引数のみ） */
const SINGLE_ARG_GLOSSARY =
  /\{\{\s*glossary\s*\(\s*(["'])([^"']+)\1\s*\)\s*\}\}/g;

export type GlossaryMacroMatch = {
  full: string;
  termId: string;
  index: number;
};

export function findSingleArgGlossaryMacros(
  body: string,
): GlossaryMacroMatch[] {
  const out: GlossaryMacroMatch[] = [];
  SINGLE_ARG_GLOSSARY.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SINGLE_ARG_GLOSSARY.exec(body)) !== null) {
    out.push({
      full: m[0],
      termId: m[2],
      index: m.index,
    });
  }
  return out;
}

export function replaceGlossarySecondArgs(
  body: string,
  resolveSecondArg: (termId: string) => string | undefined,
): { next: string; replaced: number; skipped: string[] } {
  const skipped: string[] = [];
  let replaced = 0;
  const next = body.replace(
    SINGLE_ARG_GLOSSARY,
    (full, _quote: string, termId: string) => {
      const second = resolveSecondArg(termId);
      if (second === undefined) {
        skipped.push(termId);
        return full;
      }
      replaced += 1;
      const safeSecond = second.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return `{{glossary("${termId}", "${safeSecond}")}}`;
    },
  );
  return { next, replaced, skipped };
}
