---
name: mdn-translation-workflow
description: Runs the MDN Japanese translation MCP workflow (mdn_trans_start, mdn_trans_commit_get, mdn_trans_replace_glossary, mdn_trans_review). Use when starting MDN translation, syncing sourceCommit, replacing glossary macros, or reviewing translated index.md files.
---

# MDN Translation Workflow

## Prerequisites

- `content` / `translated-content` / `mdn-translation-ja-mcp` が同じ親ディレクトリに並んでいる
- `translated-content/.cursor/mcp.json` で MCP サーバーが設定済み
- 翻訳作業は `translated-content` をワークスペースとして開く

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

```
mdn_trans_review
jaFile: files/ja/.../index.md
```

**重要:** レビュー結果を理由に当該ファイルを編集・保存しない。結果報告のみ。

## Additional resources

- MCP ツール詳細: [references/mcp-tools.md](references/mcp-tools.md)
