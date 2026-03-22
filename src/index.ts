/**
 * MDN 日本語翻訳支援 MCP サーバー（stdio）。
 * Cursor 等のクライアントがプロセスとして起動し、stdin/stdout で MCP をやり取りする。
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { runMdnGlossaryApply } from "./mdn-trans-replace-glossary/glossary-apply.js";
import { runMdnGlossaryReplacementCandidates } from "./mdn-trans-replace-glossary/glossary-replacement-candidates.js";
import { runMdnGlossaryMacroScan } from "./shared/glossary-macro-scan.js";
import { resolveMdnPageFromUrl } from "./shared/mdn-url-resolve.js";
import { runMdnTransCommitGet } from "./mdn-trans-commit-get/mdn-trans-commit-get.js";
import { runMdnTransSourceCommitSet } from "./mdn-trans-commit-get/mdn-trans-source-commit-set.js";
import { runMdnTransStart } from "./mdn-trans-start/mdn-trans-start.js";
import { loadLocalReviewRules } from "./mdn-trans-review/local-review-rules.js";
import { runReviewTranslation } from "./mdn-trans-review/review-translation.js";
import { loadTranslationRules } from "./mdn-trans-review/translation-rules.js";
import { resolveMdnWorkspacePaths } from "./shared/workspace.js";

const server = new McpServer({
  name: "mdn-translation-ja-mcp",
  version: "1.0.0",
});

server.registerTool(
  "translation_rules",
  {
    title: "Translation guideline links",
    description:
      "日本語 MDN 翻訳向けの表記・L10N・用語集・文体（rules/translation-rules.json）と、ローカルレビュー用 JSON（Mozilla 用語抜粋・文体ルール・禁止表現）を読み込み、検証済み JSON を返す。",
    inputSchema: z.object({}),
  },
  async () => {
    const guidelineLinks = loadTranslationRules();
    const localReviewRules = loadLocalReviewRules();
    const result = {
      ...guidelineLinks,
      localReviewRules,
    };
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "mdn_workspace_paths",
  {
    title: "MDN content / translated-content paths",
    description:
      "ローカルの mdn/content と mdn/translated-content に相当するディレクトリの絶対パスを解決する。推奨は親ディレクトリに content・translated-content・本リポジトリを並べる構成。任意で環境変数 MDN_CONTENT_ROOT / MDN_TRANSLATED_CONTENT_ROOT（両方）で上書き可能。",
    inputSchema: z.object({}),
  },
  async () => {
    const result = await resolveMdnWorkspacePaths();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "mdn_resolve_page_paths",
  {
    title: "Resolve MDN page paths from URL",
    description:
      "MDN のページ URL から locale・正規化 slug、ローカルの英語原文（files/en-us/.../index.md）と日本語（files/ja/.../index.md）の絶対パス、および日本語翻訳ファイルの有無を返す。",
    inputSchema: z.object({
      url: z.url("有効な URL を指定してください。"),
    }),
  },
  async ({ url }) => {
    const result = await resolveMdnPageFromUrl(url.toString());
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "mdn_trans_start",
  {
    title: "Start Japanese translation (copy en-US index.md to ja)",
    description:
      "MDN のページ URL から英語原文（content/files/en-us/.../index.md）を読み、translated-content/files/ja/.../index.md にコピーして翻訳を開始する。front-matter には英語原文の最新コミットを l10n.sourceCommit として書き込む。既に日本語ファイルがある場合は force: true が無い限りエラー。dry_run: true では実行せず予定のみ返す。",
    inputSchema: z.object({
      url: z.url("有効な URL を指定してください。"),
      dry_run: z
        .boolean()
        .optional()
        .describe("true のときファイル操作を行わず、実行予定のみ返す。"),
      force: z
        .boolean()
        .optional()
        .describe("true のとき、既存の日本語 index.md を上書きする。"),
    }),
  },
  async ({ url, dry_run: dryRun, force }) => {
    const result = await runMdnTransStart({
      url: url.toString(),
      dryRun,
      force,
    });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "mdn_trans_commit_get",
  {
    title: "Get English source commit hash (sourceCommit)",
    description:
      "MDN のページ URL に対応する英語原文（content/files/en-us/.../index.md）について、mdn/content リポジトリ上の git log で最新コミットハッシュを取得する。翻訳ファイル front-matter の l10n.sourceCommit に使う値。content が Git リポジトリでない・ファイル未追跡などのときはエラーを返す。",
    inputSchema: z.object({
      url: z.url("有効な URL を指定してください。"),
    }),
  },
  async ({ url }) => {
    const result = await runMdnTransCommitGet({
      url: url.toString(),
    });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "mdn_trans_source_commit_set",
  {
    title: "Set l10n.sourceCommit on existing Japanese index.md",
    description:
      "既存の files/ja/.../index.md の front-matter に、対応する英語原文の最新コミットハッシュを l10n.sourceCommit として追加または更新する。本文は変更しない。dry_run: true のときはファイルに書き込まず、取得した sourceCommit のみ返す。",
    inputSchema: z.object({
      url: z.url("有効な URL を指定してください。"),
      dry_run: z
        .boolean()
        .optional()
        .describe("true のとき front-matter を更新せず、結果のみ返す。"),
    }),
  },
  async ({ url, dry_run: dryRun }) => {
    const result = await runMdnTransSourceCommitSet({
      url: url.toString(),
      dryRun,
    });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "mdn_glossary_macro_scan",
  {
    title: "Scan {{glossary}} macros in Japanese index.md",
    description:
      'MDN のページ URL に対応する日本語 index.md を読み、{{glossary("…")}} / {{Glossary("…")}} を行番号付きで列挙する。第2引数の有無も返す。日本語ファイルが無い場合はエラー。',
    inputSchema: z.object({
      url: z.url("有効な URL を指定してください。"),
    }),
  },
  async ({ url }) => {
    const result = await runMdnGlossaryMacroScan({
      url: url.toString(),
    });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "mdn_glossary_replacement_candidates",
  {
    title: "Suggest {{glossary}} second-arg replacements from glossary JSON",
    description:
      '日本語 index.md 内の {{glossary("…")}} を走査し、同梱の用語集 JSON（または glossary_path / 環境変数 MDN_GLOSSARY_JSON_PATH）に基づき第2引数の置換候補を一覧で返す。未登録のスラグは status: missing。既に第2引数があるマクロは already_set。',
    inputSchema: z.object({
      url: z.url("有効な URL を指定してください。"),
      glossary_path: z
        .string()
        .optional()
        .describe(
          "用語集 JSON の絶対パス（省略時は MDN_GLOSSARY_JSON_PATH または同梱の data/glossary-terms.json）。",
        ),
    }),
  },
  async ({ url, glossary_path: glossaryPath }) => {
    const result = await runMdnGlossaryReplacementCandidates({
      url: url.toString(),
      glossaryPath,
    });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "mdn_glossary_apply",
  {
    title: "Apply {{glossary}} second-arg from glossary JSON (safe)",
    description:
      '日本語 index.md 内の {{glossary("…")}} のうち第2引数が無く、用語集 JSON にスラグがあるものだけを第2引数付きに置換する。既に第2引数があるマクロ・用語集に無いスラグは変更しない。dry_run: true のときはファイルに書かず置換予定のみ返す。書き込み前に候補を再計算し一致しない場合は FILE_CHANGED で失敗する（Issue #11 / Wiki の mdn-trans-replace-glossary 相当）。',
    inputSchema: z.object({
      url: z.url("有効な URL を指定してください。"),
      dry_run: z
        .boolean()
        .optional()
        .describe("true のときファイルに書き込まず、適用予定の一覧のみ返す。"),
      glossary_path: z
        .string()
        .optional()
        .describe(
          "用語集 JSON の絶対パス（省略時は MDN_GLOSSARY_JSON_PATH または同梱の data/glossary-terms.json）。",
        ),
    }),
  },
  async ({ url, dry_run: dryRun, glossary_path: glossaryPath }) => {
    const result = await runMdnGlossaryApply({
      url: url.toString(),
      dryRun,
      glossaryPath,
    });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

server.registerTool(
  "review_translation",
  {
    title: "Rule-based translation review (v1)",
    description:
      "日本語 index.md をルールベースでレビューし、front-matter・未翻訳の疑い・{{glossary}}・文体（簡易）・禁止表現（rules/prohibited-expressions.json）に関する findings（JSON）を返す。rules/translation-rules.json・ローカルレビュー用 JSON・用語集 JSON（glossary_path または MDN_GLOSSARY_JSON_PATH）を参照。",
    inputSchema: z.object({
      url: z.url("有効な URL を指定してください。"),
      glossary_path: z
        .string()
        .optional()
        .describe(
          "用語集 JSON の絶対パス（省略時は MDN_GLOSSARY_JSON_PATH または同梱の data/glossary-terms.json）。",
        ),
    }),
  },
  async ({ url, glossary_path: glossaryPath }) => {
    const result = await runReviewTranslation({
      url: url.toString(),
      glossaryPath,
    });
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
