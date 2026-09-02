# MCP Tools の責務と翻訳ワークフロー API

親 Issue: [#103](https://github.com/gurezo/mdn-translation-ja-mcp/issues/103)
本 Issue: [#108](https://github.com/gurezo/mdn-translation-ja-mcp/issues/108)

入力: [#105](https://github.com/gurezo/mdn-translation-ja-mcp/issues/105) の [mcp-native.md](./mcp-native.md)、[#107](https://github.com/gurezo/mdn-translation-ja-mcp/issues/107) の Prompts。

## 目的

既存 4 MCP Tools の名前・引数・副作用を明文化し、翻訳ワークフロー API の粒度を固定する。Tool は決定的な repository / metadata / validation 操作に限定する。自然言語翻訳はクライアント LLM が行い、手順の合成は Prompt が担う。

## スコープ

含める:

- 既存 4 Tools の責務（引数、副作用、読み取り、やらないこと）
- 高レベル Tool の要否判断
- 既存 API との互換（名前・引数・副作用は維持）

含めない:

- README / GitHub Pages の刷新（[#111](https://github.com/gurezo/mdn-translation-ja-mcp/issues/111)）
- Cursor Rules / Skills の移動（[#109](https://github.com/gurezo/mdn-translation-ja-mcp/issues/109)）
- レビューチェッカーのルール ID 所属変更（Tool API ではない）

登録は [src/create-mcp-server.ts](../src/create-mcp-server.ts)。stdio と Streamable HTTP は同じ集合を出す。

## 既存 4 Tools

[mcp-native.md](./mcp-native.md) の Tool 面（決定的な副作用・機械検査）を、呼び出し契約として展開する。

共通制約:

- 4 Tools は MCP ツールであり、シェルコマンド・npm スクリプトではない。
- ワークスペースは兄弟ディレクトリ、または `MDN_CONTENT_ROOT` / `MDN_TRANSLATED_CONTENT_ROOT`。
- LLM による自然言語翻訳はどの Tool にも含めない。
- CLI `npm run mdn:trans:review` は `mdn_trans_review` のフォールバックであり、MCP の必須面ではない。

### `mdn_trans_start`

| 項目 | 内容 |
| --- | --- |
| 実装 | [src/tools/trans-start.ts](../src/tools/trans-start.ts) `mdnTransStart` |
| 引数 | `url`（必須。`https://developer.mozilla.org/en-US/docs/...`）。`overwrite`（任意 boolean） |
| 副作用 | `content` の `files/en-us/<category>/<slug...>/index.md` を `translated-content` の `files/ja/<category>/<slug...>/index.md` へコピー。親ディレクトリが無ければ作成する。既存ファイルは `overwrite: true` のときだけ上書き |
| 読み取り | content の原文 `index.md` |
| やらないこと | 本文の翻訳、`_redirects.txt` の変更、他ドキュメントのリンク修正、`l10n.sourceCommit` の書き込み、LLM 実行 |
| 典型的な次の一手 | `mdn_trans_commit_get`（Prompt `mdn_translate`） |

URL 側の `/docs/` はファイルパスに現れない。解決は [src/shared/mdn-url-resolve.ts](../src/shared/mdn-url-resolve.ts)。

### `mdn_trans_commit_get`

| 項目 | 内容 |
| --- | --- |
| 実装 | [src/tools/commit-get.ts](../src/tools/commit-get.ts) `mdnTransCommitGet` |
| 引数 | `url`（必須。`mdn_trans_start` と同じ形式） |
| 副作用 | 対応する翻訳ファイルの front-matter に `l10n.sourceCommit` を書き込む。仕様として `page-type` と `sidebar` を削除する |
| 読み取り | content の git 履歴（対象原文パスの最新コミット） |
| やらないこと | 原文コピー、本文の翻訳・再翻訳、glossary 置換、LLM 実行 |
| 典型的な次の一手 | 新規翻訳では Resources 参照のあとクライアント LLM が翻訳。既存訳の同期ではここで終わり（Prompt `mdn_sync`） |

翻訳ファイルが無いときは失敗する。先に `mdn_trans_start` が必要。git 取得は [src/git/get-source-commit.ts](../src/git/get-source-commit.ts)、front-matter は [src/shared/translation-front-matter.ts](../src/shared/translation-front-matter.ts)。

### `mdn_trans_replace_glossary`

| 項目 | 内容 |
| --- | --- |
| 実装 | [src/tools/replace-glossary.ts](../src/tools/replace-glossary.ts) `mdnTransReplaceGlossary` |
| 引数 | `jaFile`（必須。translated-content 内の絶対パス、または `files/ja/` からの相対） |
| 副作用 | 1 引数 `{{glossary("id")}}` を用語 JSON に基づき第 2 引数付きへ置換して保存。置換が 0 件なら書き込まない。用語未定義の id は skipped |
| 読み取り | 対象 `index.md` と `glossary-terms.json`（Resource `mdn://data/glossary-terms` と同一ファイル） |
| やらないこと | 訳語の新規決定、ガイドライン本文の解釈、レビュー、LLM 実行。translated-content 外へのパスは拒否 |
| 典型的な次の一手 | `mdn_trans_review`（Prompt `mdn_translate`） |

MCP はエディタの開いているファイルを知らない。`jaFile` は呼び出し側が明示する。

### `mdn_trans_review`

| 項目 | 内容 |
| --- | --- |
| 実装 | [src/tools/review.ts](../src/tools/review.ts) `mdnTransReview` |
| 引数 | `jaFile`（必須。`mdn_trans_replace_glossary` と同じパス規則） |
| 副作用 | なし（`readOnlyHint`）。対象ファイルへ書き込まない |
| 読み取り | 対象 `index.md`（`O_RDONLY`）と機械ルール（`review-rules.json`、`prohibited-expressions.json`。各 Resource と同一ファイル） |
| やらないこと | findings を理由にした自動修正、対象ファイルの整形・追記、シェルでの代替スキャン、LLM 実行。translated-content 外へのパスは拒否 |
| 典型的な次の一手 | 人手確認項目の提示（Prompt `mdn_review`）。ユーザーが明示しない限り対象ファイルは編集しない |

機械では検出しない項目（意訳の自然さ、識別子の非翻訳、カタカナと glossary の揃い、箇条書きの文体混在）は Prompt 側の人手確認に残す。

## 高レベル Tool は追加しない

[#105](./mcp-native.md) が保留した `mdn_trans_prepare` などの workflow Tool は **追加しない**。

理由:

- Tool 面は決定的な副作用・機械検査に限り、手順のオーケストレーションは Prompt に置く（#105）。
- Prompt `mdn_translate` が既に `mdn_trans_start` → `mdn_trans_commit_get` → Resources → 翻訳 → `mdn_trans_replace_glossary` → `mdn_trans_review` を合成している（#107）。
- `mdn_trans_prepare` は `start` と `commit_get` の合成であり、低レベル Tool と重複する。
- Issue #108 も自然言語翻訳を Tool に取り込まない。既存 4 を維持したうえで必要性を判断すれば足りる。

代替は Prompt 合成である。ツール専用クライアントは 4 Tools を順に呼ぶ。戻り値の機械可読化（`structuredContent`）は名前・引数・副作用を変えずに足してよい。

```text
mdn_translate（Prompt）
  ├─ mdn_trans_start
  ├─ mdn_trans_commit_get
  ├─ Resources（ガイドライン）
  ├─ クライアント LLM が翻訳
  ├─ mdn_trans_replace_glossary
  └─ mdn_trans_review
```

## 互換

- 既存 4 Tools の **名前・引数・副作用の範囲は維持**する。改名・統合・削除はしない。
- テキスト応答は維持する。`structuredContent` は互換な追加である。
- stdio と Streamable HTTP は同じ Tool 集合を出す。

## Issue #108 の完了対応

| 完了条件 | 対応 |
| --- | --- |
| 既存 Tool の責務が明文化されている | 本ファイル「既存 4 Tools」 |
| 高レベル Tool の必要性が判断されている | 「追加しない」（本節） |
| 必要な場合は workflow Tool が実装されている | 不要のため実装しない |
| 既存 Tool との重複がない | 新 Tool を足さない |
| 後方互換性が考慮されている | 名前・引数・副作用を維持 |
| Tool のテストが更新されている | 実装コミットで `commit-get` / `replace-glossary` / `tools/list` を追加 |
