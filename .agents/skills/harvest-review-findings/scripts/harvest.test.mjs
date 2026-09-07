import { describe, expect, it } from "vitest";

import {
  classifySkill,
  extractPrNumbers,
  isBotLogin,
  isNoiseComment,
  parseHarvestArgs,
  toFindings,
} from "./harvest.mjs";

describe("parseHarvestArgs", () => {
  it("デフォルト値を返す", () => {
    expect(parseHarvestArgs([])).toEqual({
      prLimit: 40,
      issueLimit: 30,
      out: undefined,
    });
  });

  it("オプションを解釈する", () => {
    expect(
      parseHarvestArgs([
        "--pr-limit=10",
        "--issue-limit=5",
        "--out=/tmp/out.json",
      ]),
    ).toEqual({ prLimit: 10, issueLimit: 5, out: "/tmp/out.json" });
  });

  it("不明なオプションは失敗する", () => {
    expect(() => parseHarvestArgs(["--foo"])).toThrow(/不明なオプション/);
  });
});

describe("isNoiseComment", () => {
  it("bot とプレビューコメントを除外する", () => {
    expect(isBotLogin("github-actions[bot]")).toBe(true);
    expect(
      isNoiseComment({
        user: "github-actions[bot]",
        body: "Preview URLs",
      }),
    ).toBe(true);
    expect(
      isNoiseComment({
        user: "mfuji09",
        body: "OKです。",
      }),
    ).toBe(true);
    expect(
      isNoiseComment({
        user: "mfuji09",
        body: "5行目の sourceCommit には英語版記事のコミットハッシュを記入してください。",
      }),
    ).toBe(false);
    expect(
      isNoiseComment({
        kind: "issue-body",
        user: "issue-author",
        body: "<!-- 件名の「<翻訳対象ページ名>」 -->\n## 翻訳対象ページ",
      }),
    ).toBe(true);
    expect(
      isNoiseComment({
        user: "gurezo",
        body: "- feat: replace Web to ウェブ 2cd8fa973b2",
      }),
    ).toBe(true);
    expect(
      isNoiseComment({
        user: "potappo",
        body: "レビューしてマージしましたので、クローズします。",
      }),
    ).toBe(true);
  });
});

describe("classifySkill / extractPrNumbers", () => {
  it("sourceCommit は l10n-guideline", () => {
    expect(classifySkill("sourceCommit を記入してください")).toBe(
      "l10n-guideline",
    );
  });

  it("訳語は mozilla-l10n-glossary", () => {
    expect(classifySkill("computed value は「計算値」の訳語を使ってください")).toBe(
      "mozilla-l10n-glossary",
    );
  });

  it("PR URL を抽出する", () => {
    expect(
      extractPrNumbers(
        "see https://github.com/mdn/translated-content/pull/38090 and 38091",
      ),
    ).toEqual([38090]);
  });
});

describe("toFindings", () => {
  it("ノイズを落として skill を付与する", () => {
    const findings = toFindings([
      { user: "mfuji09", body: "OKです。" },
      {
        user: "mfuji09",
        body: "{{GlossarySidebar}} は削除してください。",
        prUrl: "https://github.com/mdn/translated-content/pull/38090",
      },
    ]);
    expect(findings).toHaveLength(1);
    expect(findings[0].skill).toBe("l10n-guideline");
  });
});
