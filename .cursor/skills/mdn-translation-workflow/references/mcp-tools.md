# MCP ツール対応表

**これらはシェルコマンドではない。** Cursor の MCP サーバー `mdn-translation-ja` 経由で呼び出す。ターミナルで `mdn_trans_review` 等を実行しない。

| MCP ツール名 | 主な用途 |
| --- | --- |
| `mdn_trans_start` | URL を指定し、`content` の `index.md` を `translated-content/files/ja/.../index.md` にコピー |
| `mdn_trans_commit_get` | `content` の最新コミットを取得し、`l10n.sourceCommit` を翻訳ファイルに反映 |
| `mdn_trans_replace_glossary` | `{{glossary("id")}}` を `{{glossary("id", "表示")}}` に置換 |
| `mdn_trans_review` | ガイドライン機械チェック（`src/shared/data` の JSON。**読み取りのみ**） |

## パス指定

- `jaFile`: translated-content 内の絶対パス、または `files/ja/` からの相対パス
- MCP はエディタの「開いているファイル」を自動認識しない

## mcp.json 設定例

```json
{
  "mcpServers": {
    "mdn-translation-ja": {
      "command": "node",
      "args": ["/absolute/path/to/mdn-translation-ja-mcp/dist/index.js"],
      "env": {
        "MDN_CONTENT_ROOT": "/absolute/path/to/content",
        "MDN_TRANSLATED_CONTENT_ROOT": "/absolute/path/to/translated-content"
      }
    }
  }
}
```

`examples/cursor/mcp.example.json` と同一内容。

## エージェント向け呼び出し手順

1. Cursor の MCP 一覧でサーバー `mdn-translation-ja` が有効か確認する
2. ツール `mdn_trans_review` を選び、引数 `jaFile` に translated-content 内のパスを渡す
3. 返却された text（と structuredContent）をユーザーに報告する
4. シェルで同名コマンドを探したり、手動で禁止表現スキャンに置き換えたりしない

## レビュー後の制約

`mdn_trans_review` は対象ファイルを変更しない。エージェントはレビュー結果を理由に当該ファイルを編集してはならない（ユーザーが「修正して」と明示した場合のみ可）。

## ガイドライン Resources

人手翻訳では MCP Resources を読む（`.agents/skills` のコピーは不要）:

- `mdn://guidelines/editorial`
- `mdn://guidelines/l10n`
- `mdn://guidelines/japanese-style`
- `mdn://glossary`

`mdn_trans_review` の機械チェックは `mdn://data/review-rules` / `glossary-terms` / `prohibited-expressions` と同じ JSON を使う。未自動の項目は人手確認。
