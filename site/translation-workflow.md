---
title: Translation Workflow
---

# Translation Workflow

標準手順は MCP Prompt です。個別に Tool を呼んでも同じ結果になります。

```text
mdn_translate（Prompt）
  ├─ mdn_trans_start
  ├─ mdn_trans_commit_get
  ├─ Resources（ガイドライン）
  ├─ クライアント LLM が翻訳
  ├─ mdn_trans_replace_glossary
  └─ mdn_trans_review
```

## 新規翻訳（`mdn_translate`）

1. 対象 URL を確認する（`https://developer.mozilla.org/en-US/docs/...`）
2. `mdn_trans_start` で原文 `index.md` を `translated-content` へコピーする（翻訳はしない）
3. `mdn_trans_commit_get` で `l10n.sourceCommit` を反映する
4. Resources（`mdn://guidelines/editorial` / `l10n` / `japanese-style`、`mdn://glossary`）を読む
5. クライアント LLM が翻訳する。です・ます調。コードブロックと識別子は翻訳しない。Markdown 構造は維持する
6. `mdn_trans_replace_glossary` で `{{glossary}}` 第 2 引数を補完する
7. `mdn_trans_review` で機械チェックする（読み取り専用。結果を理由に当該ファイルを編集しない）
8. 人手確認項目を提示する

## 既存訳の同期（`mdn_sync`）

1. 対象 URL と対応する `files/ja/.../index.md` があることを確認する
2. `mdn_trans_commit_get` で `l10n.sourceCommit` を更新する
3. ユーザーがレビューも依頼した場合のみ `mdn_review` または `mdn_trans_review` を使う

## レビューのみ（`mdn_review`）

1. `mdn_trans_review` を `jaFile` 付きで呼ぶ
2. 返却テキストを報告する
3. ユーザーが明示しない限り対象ファイルは編集しない

## パスの対応

URL `/en-US/docs/<Category>/<Slug...>` は `files/ja/<category>/<slug...>/index.md` に対応します。URL 側の `docs/` はファイルパスに現れません。
