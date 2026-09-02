export type TranslationPromptArg = {
  name: string;
  required: boolean;
  description: string;
};

export type TranslationPromptEntry = {
  name: string;
  title: string;
  description: string;
  args: readonly TranslationPromptArg[];
};

const URL_ARG: TranslationPromptArg = {
  name: "url",
  required: true,
  description: "https://developer.mozilla.org/en-US/docs/... 形式の URL",
};

const JA_FILE_ARG: TranslationPromptArg = {
  name: "jaFile",
  required: true,
  description:
    "translated-content 内のパス（絶対パス、または files/ja/ からの相対）",
};

/**
 * MCP Prompt のメタデータ。手順本文は messages.ts、登録は register.ts。
 */
export const TRANSLATION_PROMPTS: readonly TranslationPromptEntry[] = [
  {
    name: "mdn_translate",
    title: "MDN 日本語翻訳（標準フロー）",
    description:
      "対象 URL から翻訳開始、ガイドライン参照、翻訳、sourceCommit、glossary、レビューまでの標準手順。サーバー内では LLM を実行しない。",
    args: [URL_ARG],
  },
  {
    name: "mdn_sync",
    title: "既存訳の sourceCommit 同期",
    description:
      "既存の日本語訳に対し、content の最新コミットを l10n.sourceCommit へ反映する手順。",
    args: [URL_ARG],
  },
  {
    name: "mdn_review",
    title: "翻訳の機械レビューと人手確認",
    description:
      "mdn_trans_review の呼び出し方と、機械では検出しない人手確認項目。対象ファイルは変更しない。",
    args: [JA_FILE_ARG],
  },
];

export function findTranslationPrompt(
  name: string,
): TranslationPromptEntry | undefined {
  return TRANSLATION_PROMPTS.find((p) => p.name === name);
}
