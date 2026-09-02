---
title: MCP Tools
---

# MCP Tools

4 Tools は MCP ツールであり、シェルコマンド・npm スクリプトではありません。ターミナルで同名コマンドを実行しないでください。

stdio と Streamable HTTP は同じ集合を出します。自然言語翻訳はどの Tool にも含めません。

| MCP ツール名 | 主な引数 | 副作用 | 用途 |
| --- | --- | --- | --- |
| `mdn_trans_start` | `url`（必須）、`overwrite`（任意） | `translated-content` へ原文コピー | 翻訳ファイルの用意 |
| `mdn_trans_commit_get` | `url` | `l10n.sourceCommit` を書き込み | 原文コミットの同期 |
| `mdn_trans_replace_glossary` | `jaFile` | 1 引数 `{{glossary}}` を第 2 引数付きに置換して保存 | 用語マクロの補完 |
| `mdn_trans_review` | `jaFile` | なし（読み取り専用） | ガイドライン機械チェック |

`url` は `https://developer.mozilla.org/en-US/docs/...` 形式です。URL 側の `/docs/` はファイルパスに現れません。

`jaFile` は translated-content 内の絶対パス、または `files/ja/` からの相対パスです。MCP はエディタの「開いているファイル」を知りません。パスは呼び出し側が明示してください。translated-content 外へのパスは拒否します。

## `mdn_trans_start`

`content` の `files/en-us/<category>/<slug...>/index.md` を `translated-content` の `files/ja/<category>/<slug...>/index.md` へコピーするだけです。本文の翻訳、`_redirects.txt` の変更、他ファイルの修正、`l10n.sourceCommit` の書き込みはしません。既存ファイルは `overwrite: true` のときだけ上書きします。

## `mdn_trans_commit_get`

content の git 履歴から対象原文の最新コミットを取得し、翻訳ファイルの front-matter に `l10n.sourceCommit` を書き込みます。仕様として `page-type` と `sidebar` を削除します。翻訳ファイルが無いときは失敗するので、先に `mdn_trans_start` が必要です。

## `mdn_trans_replace_glossary`

1 引数 `{{glossary("id")}}` を用語 JSON（Resource `mdn://data/glossary-terms` と同一ファイル）に基づき第 2 引数付きへ置換して保存します。置換 0 件なら書き込みません。用語未定義の id は skipped です。訳語の新規決定はしません。

## `mdn_trans_review`

対象 `index.md` を読むだけで書き込みません。機械ルールは `mdn://data/review-rules` および `mdn://data/prohibited-expressions` と同じ JSON です。レビュー結果を理由に当該ファイルを編集・保存してはなりません（ユーザーが明示した場合のみ可）。

CLI `npm run mdn:trans:review` は MCP 未接続時のフォールバックであり、必須面ではありません。

契約の詳細は [architecture/tools.md](../architecture/tools.md) を参照してください。
