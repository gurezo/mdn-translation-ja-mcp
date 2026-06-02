# MCP ツール対応表

| MCP ツール名 | 主な用途 |
| --- | --- |
| `mdn_trans_start` | URL を指定し、`content` の `index.md` を `translated-content/files/ja/.../index.md` にコピー |
| `mdn_trans_commit_get` | `content` の最新コミットを取得し、`l10n.sourceCommit` を翻訳ファイルに反映 |
| `mdn_trans_replace_glossary` | `{{glossary("id")}}` を `{{glossary("id", "表示")}}` に置換 |
| `mdn_trans_review` | `.agents/skills` 由来のガイドライン機械チェック（**読み取りのみ**） |

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

`examples/translated-content-cursor-mcp-example.json` と同一内容。

## レビュー後の制約

`mdn_trans_review` は対象ファイルを変更しない。エージェントはレビュー結果を理由に当該ファイルを編集してはならない（ユーザーが「修正して」と明示した場合のみ可）。

## ガイドライン Skills

`mdn_trans_review` が機械チェックするスキル（未自動の項目は人手確認）:

- editorial-guideline（禁止記号・頻出語・禁止表現リスト）
- japanese-style（ひらがな推奨表・文体ヒューリスティック）
- l10n-guideline（`l10n.sourceCommit`）
- mozilla-l10n-glossary（1 引数 `{{glossary}}`）
