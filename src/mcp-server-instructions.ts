/**
 * MCP サーバーに渡す利用説明（Cursor のサーバー指示用）
 */
export const MCP_SERVER_INSTRUCTIONS = [
  "【最優先・読み取り専用】mdn_trans_review は対象の翻訳ファイルを読むだけで書き込まない。ツール実行後も、レビュー内容を理由にそのファイルをエージェントが編集・保存してはならない（ユーザーが明示的に修正を依頼した場合のみ可）。",
  "developer.mozilla.org の /en-US/docs/... URL を mdn_trans_start / mdn_trans_commit_get に渡します。",
  "content と translated-content は兄弟ディレクトリに置くか、MDN_CONTENT_ROOT / MDN_TRANSLATED_CONTENT_ROOT で指定します。",
  "【重要】mdn_trans_start は Wiki 仕様どおり、content の該当 index.md を translated-content の対応パスへコピーするだけです。",
  "翻訳・_redirects.txt の編集・他ファイルのリンク修正・リポジトリを Cursor で開く操作はこのツールの範囲外です。エージェントはコピー以外のファイル変更を勝手に行わないこと。",
  "コピー先パスは URL `/en-US/docs/<Category>/<Slug...>` の `docs/` を除いた `files/ja/<category>/<slug...>/index.md` の形です（例: /en-US/docs/Glossary/Symbol → files/ja/glossary/symbol/index.md）。",
  "mdn_trans_replace_glossary と mdn_trans_review には、translated-content 内の翻訳ファイルパス（絶対パス、または files/ja/ からの相対）を渡してください。",
  "【重要】mdn_trans_review は対象ファイルを読み取るだけで書き込まない（readOnlyHint）。ユーザーが明示しない限り、レビュー結果を理由に該当ファイルを編集しないこと。",
  "翻訳レビューの詳細は mozilla-japan の翻訳ガイドラインを参照し、エージェントが内容を確認してください。",
].join("\n");
