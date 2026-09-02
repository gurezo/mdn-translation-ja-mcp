import type { GetPromptResult } from "@modelcontextprotocol/sdk/types.js";

import { findTranslationPrompt } from "./catalog.js";

export const MCP_TOOL_NAMES = [
  "mdn_trans_start",
  "mdn_trans_commit_get",
  "mdn_trans_replace_glossary",
  "mdn_trans_review",
] as const;

export const TRANSLATION_RESOURCE_URIS = [
  "mdn://guidelines/editorial",
  "mdn://guidelines/l10n",
  "mdn://guidelines/japanese-style",
  "mdn://glossary",
] as const;

const TOOL_TABLE = `| MCP ツール | 用途 | 主な引数 |
| --- | --- | --- |
| \`mdn_trans_start\` | content の原文 index.md を translated-content へコピーするのみ | \`url\` |
| \`mdn_trans_commit_get\` | 原文の最新コミットを \`l10n.sourceCommit\` に書き込む | \`url\` |
| \`mdn_trans_replace_glossary\` | \`{{glossary("id")}}\` を第 2 引数付きに置換して保存 | \`jaFile\` |
| \`mdn_trans_review\` | ガイドライン機械チェック（読み取り専用。対象ファイルは変更しない） | \`jaFile\` |`;

const COMMON_CONSTRAINTS = `## MCP ツールの呼び出し

${MCP_TOOL_NAMES.join(" / ")} は MCP ツールであり、シェルコマンド・npm スクリプトではありません。ターミナルで同名コマンドを実行せず、必ず MCP ツールとして呼び出してください。

${TOOL_TABLE}

## パス規則

- \`mdn_trans_start\` / \`mdn_trans_commit_get\` には \`https://developer.mozilla.org/en-US/docs/...\` 形式の URL を渡す。
- URL \`/en-US/docs/<Category>/<Slug...>\` は \`files/ja/<category>/<slug...>/index.md\` に対応する（URL 側の \`docs/\` はファイルパスに現れない）。
- \`mdn_trans_replace_glossary\` / \`mdn_trans_review\` の \`jaFile\` は translated-content 内の絶対パス、または \`files/ja/\` からの相対パス。
- MCP はエディタの「開いているファイル」を自動認識しない。パスは明示する。

## 翻訳ガイドライン（Resources）

ガイドライン本文はこの Prompt には含めません。次の MCP Resource を読んでください。

- \`mdn://guidelines/editorial\` — 表記・約物・単位・カタカナ長音
- \`mdn://guidelines/l10n\` — 意訳・UI 表現・ですます調
- \`mdn://guidelines/japanese-style\` — 文体・ひらがな/漢字
- \`mdn://glossary\` — 用語抜粋と Wiki 参照手順`;

const HUMAN_REVIEW_ITEMS = `## 人手確認項目

機械レビュー（\`mdn_trans_review\`）では検出しない、または自動修正してはいけない項目です。結果を報告し、ユーザーが明示しない限り対象ファイルを編集しないでください。

- 意訳の自然さ（逐語訳になっていないか）
- コードブロック、変数名、関数名、API 名、メソッド名が翻訳されていないか
- \`STYLE_KATAKANA_AND_GLOSSARY_CONSISTENCY\` — カタカナ表記と \`{{glossary}}\` 第 2 引数が用語集・表記ガイドラインに揃っているか
- \`STYLE_LIST_AND_PROCEDURE_VOICE\` — 箇条書き・手順で体言止めとです・ます調が混在していないか
- 機械レビューの findings（報告のみ。自動では修正しない）`;

function promptResult(description: string, text: string): GetPromptResult {
  return {
    description,
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text,
        },
      },
    ],
  };
}

function requirePromptDescription(name: string): string {
  const entry = findTranslationPrompt(name);
  if (!entry) {
    throw new Error(`未知の Prompt: ${name}`);
  }
  return entry.description;
}

export function buildTranslatePrompt(url: string): GetPromptResult {
  const text = `# MDN 日本語翻訳（標準フロー）

対象 URL: ${url}

この Prompt はクライアント LLM 向けの標準手順です。翻訳そのものはクライアント側の LLM が行います。MCP サーバー内では LLM を実行しません。

${COMMON_CONSTRAINTS}

## 手順

1. 対象 URL を確認する: \`${url}\`
2. MCP ツール \`mdn_trans_start\` を \`url\`=${url} で呼び出す。\`content\` の原文 \`index.md\` を \`translated-content\` の対応パスへコピーするだけ。翻訳・\`_redirects.txt\`・他ファイルの編集はしない。既に翻訳ファイルがある場合は、ユーザーに確認してから \`overwrite\` を使う。
3. 原文 \`files/en-us/.../index.md\` と翻訳対象 \`files/ja/.../index.md\` の内容を確認する。
4. MCP ツール \`mdn_trans_commit_get\` を \`url\`=${url} で呼び、\`l10n.sourceCommit\` を反映する。
5. 上記の Resources（\`mdn://guidelines/editorial\` / \`mdn://guidelines/l10n\` / \`mdn://guidelines/japanese-style\` / \`mdn://glossary\`）を読む。
6. クライアント LLM が翻訳する。です・ます調で統一する。コードブロックと識別子は翻訳しない。逐語訳ではなく自然な日本語にする。Markdown の見出し・リスト・コードブロック構造は維持する。
7. MCP ツール \`mdn_trans_replace_glossary\` を、翻訳ファイルの \`jaFile\`（絶対パスまたは \`files/ja/...\`）で呼び出す。
8. MCP ツール \`mdn_trans_review\` を同じ \`jaFile\` で呼び出す。読み取り専用。レビュー結果を理由に当該ファイルを編集・保存してはならない（ユーザーが明示的に修正を依頼した場合のみ可）。
9. 次の人手確認項目を提示する。

${HUMAN_REVIEW_ITEMS}`;

  return promptResult(requirePromptDescription("mdn_translate"), text);
}

export function buildSyncPrompt(url: string): GetPromptResult {
  const text = `# 既存訳の sourceCommit 同期

対象 URL: ${url}

既存の日本語訳ファイルの \`l10n.sourceCommit\` を、content リポジトリの最新コミットに合わせます。ユーザーが依頼しない限り、本文の再翻訳はしません。

${COMMON_CONSTRAINTS}

## 手順

1. 対象 URL を確認する: \`${url}\`
2. 対応する翻訳ファイル \`files/ja/.../index.md\` が存在することを確認する。
3. MCP ツール \`mdn_trans_commit_get\` を \`url\`=${url} で呼び、\`l10n.sourceCommit\` を反映する。
4. メタデータの詳細が必要なら Resource \`mdn://guidelines/l10n\` を読む。
5. ユーザーがレビューも依頼した場合のみ \`mdn_review\` Prompt、または MCP ツール \`mdn_trans_review\` を使う。`;

  return promptResult(requirePromptDescription("mdn_sync"), text);
}

export function buildReviewPrompt(jaFile: string): GetPromptResult {
  const text = `# 翻訳の機械レビューと人手確認

対象 jaFile: ${jaFile}

${COMMON_CONSTRAINTS}

## 手順

1. MCP ツール \`mdn_trans_review\` を \`jaFile\`=${jaFile} で呼び出す。このツールは対象ファイルを読むだけで書き込まない。
2. 返却テキスト（と structuredContent があれば findings）をユーザーに報告する。
3. レビュー結果を理由に当該ファイルを編集・保存してはならない。ユーザーが「修正して」等と明示した場合のみ編集してよい。
4. ガイドラインの詳細は Resources（\`mdn://guidelines/editorial\` / \`mdn://guidelines/l10n\` / \`mdn://guidelines/japanese-style\` / \`mdn://glossary\`）を読む。
5. 次の人手確認項目を提示する。シェルで同名コマンドを探したり、手動スキャンに置き換えたりしない。

${HUMAN_REVIEW_ITEMS}`;

  return promptResult(requirePromptDescription("mdn_review"), text);
}
