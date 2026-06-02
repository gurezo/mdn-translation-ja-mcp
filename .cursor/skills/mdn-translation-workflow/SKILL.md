---
name: mdn-translation-workflow
description: Runs the MDN Japanese translation MCP workflow via Cursor MCP (server mdn-translation-ja). Tools mdn_trans_start, mdn_trans_commit_get, mdn_trans_replace_glossary, mdn_trans_review are MCP tools—not shell commands. Never run them in the terminal.
---

# MDN Translation Workflow

## Prerequisites

- `content` / `translated-content` / `mdn-translation-ja-mcp` が同じ親ディレクトリに並んでいる
- `translated-content/.cursor/mcp.json` で MCP サーバー `mdn-translation-ja` が設定済み
- 翻訳作業は `translated-content` をワークスペースとして開く
- **推奨:** `translated-content/.cursor/rules/` に本リポジトリの `.cursor/rules/*.mdc` を symlink またはコピー（MCP ツールをシェルと誤認しないため）

## MCP の呼び出し方（重要）

以下の名前は **すべて MCP ツール**である。ターミナル・シェル・npm では実行しない。

| 呼び出し | MCP サーバー | MCP ツール名 | 主な引数 |
| --- | --- | --- | --- |
| 翻訳開始 | `mdn-translation-ja` | `mdn_trans_start` | `url` |
| sourceCommit | `mdn-translation-ja` | `mdn_trans_commit_get` | `url` |
| glossary | `mdn-translation-ja` | `mdn_trans_replace_glossary` | `jaFile` |
| レビュー | `mdn-translation-ja` | `mdn_trans_review` | `jaFile` |

ユーザーが「`mdn_trans_review` を実行して」と書いた場合も、**MCP ツール**として `jaFile` を渡して呼び出す。

## Workflow

### 1. 翻訳開始

```
mdn_trans_start
url: https://developer.mozilla.org/en-US/docs/...
```

`content` の `files/en-us/.../index.md` を `translated-content` の `files/ja/.../index.md` にコピーするのみ。翻訳・他ファイル編集は行わない。

### 2. 翻訳実施

`.agents/skills/` の4スキルを参照:

- editorial-guideline — 表記
- l10n-guideline — 意訳・UI 表現
- mozilla-l10n-glossary — 用語
- japanese-style — 文体

### 3. sourceCommit 反映

```
mdn_trans_commit_get
url: https://developer.mozilla.org/en-US/docs/...
```

### 4. glossary 第2引数補完

```
mdn_trans_replace_glossary
jaFile: files/ja/.../index.md
```

### 5. レビュー（読み取り専用）

**MCP ツール:** `mdn_trans_review`（サーバー `mdn-translation-ja`）

| 引数 | 値の例 |
| --- | --- |
| `jaFile` | `files/ja/web/api/audio_session_api/index.md` |

チャット例（エージェントは上記 MCP ツールを呼ぶ。シェルでは実行しない）:

```text
mdn_trans_review を MCP ツールで実行して。レビュー結果だけ報告し、当該 index.md は編集・保存しないで。
jaFile: files/ja/.../index.md
```

**重要:** レビュー結果を理由に当該ファイルを編集・保存しない。MCP の返却テキストを報告のみ。

## Additional resources

- MCP ツール詳細: [references/mcp-tools.md](references/mcp-tools.md)
