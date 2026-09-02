/**
 * MCP サーバーに渡す利用説明。標準手順の本体は Prompt 側に置く。
 */
export const MCP_SERVER_INSTRUCTIONS = [
  "mdn_trans_start / mdn_trans_commit_get / mdn_trans_replace_glossary / mdn_trans_review は MCP ツールであり、シェルコマンド・npm スクリプトではない。ターミナルで同名コマンドを実行せず、本サーバーのツールとして呼び出すこと。",
  "mdn_trans_review は対象の翻訳ファイルを読むだけで書き込まない。レビュー結果を理由に当該ファイルを編集・保存してはならない（ユーザーが明示的に修正を依頼した場合のみ可）。",
  "content と translated-content は兄弟ディレクトリに置くか、MDN_CONTENT_ROOT / MDN_TRANSLATED_CONTENT_ROOT で指定する。",
  "標準の翻訳手順は MCP Prompt（mdn_translate / mdn_sync / mdn_review）を使う。",
].join("\n");
