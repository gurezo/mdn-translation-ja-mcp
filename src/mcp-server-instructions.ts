/**
 * MCP サーバーに渡す利用説明（Cursor のサーバー指示用）
 */
export const MCP_SERVER_INSTRUCTIONS = [
  "developer.mozilla.org の /en-US/docs/... URL を mdn_trans_start / mdn_trans_commit_get に渡します。",
  "content と translated-content は兄弟ディレクトリに置くか、MDN_CONTENT_ROOT / MDN_TRANSLATED_CONTENT_ROOT で指定します。",
  "mdn_trans_replace_glossary と mdn_trans_review には、translated-content 内の翻訳ファイルパス（絶対パス、または files/ja/ からの相対）を渡してください。",
  "翻訳レビューの詳細は mozilla-japan の翻訳ガイドラインを参照し、エージェントが内容を確認してください。",
].join("\n");
