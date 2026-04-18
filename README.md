## ✨ 概要

このツールは、MDN 翻訳作業を支援・自動化することを目的としています。  
Cursor から利用し、翻訳の開始・同期・レビューを支援します。

MDN の本文はリポジトリに含めず、手元で clone した
[mdn/content](https://github.com/mdn/content) および
[mdn/translated-content](https://github.com/mdn/translated-content) を参照する想定です。

## 🎯 目的

- 翻訳開始（原文コピー）の自動化。
- 原文との同期（sourceCommit）の管理。
- glossary マクロの補助。
- ガイドラインに基づくレビュー。

## 🧱 アーキテクチャ

```text
Cursor
  ↓
MCP Server（stdio または Streamable HTTP）
  ↓
ローカルFS + Git + rules(JSON)
```

## 📦 前提環境

以下の構成が必要です：

```text
.
├── content
├── translated-content
└── mdn-translation-ja-mcp
```

### 必須リポジトリ

- [https://github.com/mdn/content](https://github.com/mdn/content)
- [https://github.com/mdn/translated-content](https://github.com/mdn/translated-content)

親ディレクトリで次のように **clone** できます（ディレクトリ名は任意です）。

```bash
mkdir -p mdn-work && cd mdn-work
git clone https://github.com/mdn/content.git
git clone https://github.com/mdn/translated-content.git
git clone https://github.com/gurezo/mdn-translation-ja-mcp.git
```

### 導入手順（チェックリスト）

1. **ランタイム**  
   [Node.js](https://nodejs.org/) 22 以上（LTS 推奨）、[Cursor](https://cursor.com/)（MCP の **stdio** または **Streamable HTTP** に対応した版）。  
   HTTP 必須ではありません。

2. **リポジトリの配置**  
   上記のディレクトリツリーのとおり、`content`・`translated-content`・本リポジトリを**同じ親ディレクトリ**に並べることを推奨します。  
   別の場所に置く場合は、次項の環境変数で**両方**を指定してください。

3. **ビルド**  
   `mdn-translation-ja-mcp` で `npm install` のあと **`npm run build`** を実行します。  
   `dist/index.js` / `dist/http.js` が生成されます。

4. **（任意）環境変数**  
   推奨の兄弟ディレクトリ構成なら **`env` は不要**です。  
   `content` / `translated-content` を別の場所に置く場合は、stdio 利用時は  
   [examples/cursor-mcp-with-env.json](examples/cursor-mcp-with-env.json) のとおり MCP 設定の `env` に  
   `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` を**両方**書きます（片方だけは不可。後述「パスの解決順」）。  
   **Streamable HTTP で同じ変数を使う場合**は、`npm run start:http` を実行するシェルで export するか、  
   プロセスマネージャ経由で渡してください。

5. **Cursor との接続**  
   MCP の登録は Cursor の `mcp.json` で行います。  
   stdio の例は [examples/cursor-mcp.json](examples/cursor-mcp.json)、  
   Streamable HTTP の例は [examples/cursor-mcp-http.json](examples/cursor-mcp-http.json) を参照してください。  
   HTTP 利用時は先に **`npm run start:http`** でサーバーを起動してから接続します。  
   既定ポートは **3050**、パスは **`/mcp`**（`PORT` で変更可）。

### ビルド後の起動（ローカル MCP）

いずれか一方を選びます。Cursor 側の設定（上記サンプル）と揃えてください。

```bash
cd mdn-translation-ja-mcp   # 既に clone 済みなら省略可

npm install    # 未実行なら
npm run build

# stdio（既定: npm start → dist/index.js）
npm start

# または Streamable HTTP（npm run start:http → dist/http.js）
npm run start:http
```

初めて本リポジトリだけ取得する場合の例:

```bash
git clone https://github.com/gurezo/mdn-translation-ja-mcp
cd mdn-translation-ja-mcp
npm install
npm run build
npm start
# または: npm run start:http
```

## 📚 API ドキュメント（TypeDoc）

TypeScript API リファレンスを TypeDoc で生成できます（出力先は `typedoc-out/`）。

```bash
# 生成済みドキュメントの削除
npm run docs:clean

# API ドキュメント生成
npm run docs:build

# GitHub Pages へ公開（gh-pages ブランチ）
npm run docs:publish
```

## 🔗 MCP ツール名の対応

本サーバーが提供する MCP ツール名（Cursor のツール一覧に表示される名前）と主な用途です。  
**先頭に `/` は付きません**（MCP の登録名は `mdn_trans_start` のようなスネークケースです）。

### 翻訳フロー（最短）

一例として、翻訳開始 → 原文コミット同期 → glossary → レビューの順で使えます。

1. **翻訳開始** — 対象の MDN URL を伝え、**`mdn_trans_start`** で `ja` の `index.md` を用意します。
2. **英語原文との同期** — **`mdn_trans_commit_get`** で `content` の該当ファイルに対する最新コミットを取得し、翻訳ファイルのフロントマターに **`l10n.sourceCommit`** を書き込みます。
3. **用語 `{{glossary}}`** — **`mdn_trans_replace_glossary`** で、指定した翻訳ファイル内の `{{glossary("id")}}` を用語データに基づき `{{glossary("id", "表示名")}}` に置換します。
4. **レビュー** — **`mdn_trans_review`** で禁止・注意表現リストに基づく簡易チェックを行います（**サーバーは対象ファイルを変更しません**。エージェントがレビュー結果だけを理由にそのファイルを編集しないよう注意してください。詳細はエージェントが [表記ガイドライン](https://github.com/mozilla-japan/translation/wiki/Editorial-Guideline) 等を参照してください）。

| MCP ツール名                 | 主な用途                                                                                        |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| `mdn_trans_start`            | URL を指定し、`content` の `files/en-us/<category>/<slug...>/index.md` を **`translated-content` の `files/ja/<category>/<slug...>/index.md` にコピーするだけ**（翻訳・`_redirects.txt`・他ファイルの修正はしない。URL 側の `/docs/` はファイルパスには現れない） |
| `mdn_trans_commit_get`       | `content` の git 履歴からコミットハッシュを取得し、`l10n.sourceCommit` を翻訳ファイルに反映する |
| `mdn_trans_replace_glossary` | 指定ファイル内の 1 引数 `{{glossary}}` を第 2 引数付きに置換する                                |
| `mdn_trans_review`           | 翻訳ファイルの簡易レビュー（禁止・注意表現など）。**読み取りのみ**（対象 `index.md` には書き込まない） |

`mdn_trans_replace_glossary` と `mdn_trans_review` には、**translated-content 内のファイルパス**を渡してください（絶対パス、または `files/ja/` からの相対パス）。MCP はエディタの「開いているファイル」を知らないため、エージェントがパスを明示する想定です。

## 🗂️ パスの解決順

各ツールのワークスペース解決で共通です。  
環境変数の要否は「導入手順（チェックリスト）」の（任意）環境変数と同じ前提です。

1. **環境変数（任意）** —  
   `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` を**両方**指定すると、その絶対パスをそのまま使います。  
   片方だけは不可（誤設定防止のためエラー）。
2. **兄弟ディレクトリ** — どちらの環境変数も未設定のとき、  
   **プロセスのカレントディレクトリ**（通常は本リポジトリのルート）の**ひとつ上のディレクトリ**を親とみなし、  
   そこにある `content` と `translated-content` を参照します。

**リポジトリ実体** — 解決した `content` 相当のルートには `files/en-us` が、  
`translated-content` 相当のルートには `files/ja` がそれぞれディレクトリとして存在する必要があります（公式リポジトリを clone した状態）。  
名前だけの空フォルダではエラーになります。

環境変数の MCP 設定例は  
[examples/cursor-mcp-with-env.json](examples/cursor-mcp-with-env.json) を参照してください。

## 📋 MCP ツールの応答

本サーバーは **stdio**（`npm start` → `dist/index.js`）または  
**Streamable HTTP**（`npm run start:http` → `dist/http.js`）のいずれかで起動します。  
各ツールの結果は MCP の **`text` コンテンツ**として返ります（人間が読める説明文）。

想定外のエラー（パス解決失敗、ファイル未存在、Git 取得失敗など）は **ツール実装が例外を投げ**、クライアント側でツール呼び出しエラーとして扱われることがあります。

## 💬 Cursor での利用例（エージェント）

MCP を有効にしたうえで、**チャットで対象ページの MDN URL を伝え**、主に次のツールをエージェントに実行させます。

- 「`https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API` を翻訳開始して」→ `mdn_trans_start`。
- 「この URL の英語原文の最新コミットを `sourceCommit` に反映して」→ `mdn_trans_commit_get`。
- 「この `index.md` の `{{glossary}}` に第2引数を付けて」→ `mdn_trans_replace_glossary`（対象ファイルパスを指定）。
- 「この翻訳をルールでざっと確認して」→ `mdn_trans_review`（対象ファイルパスを指定。**レビュー結果を理由にそのファイルを自動編集しない**）。

人手レビューでは、[表記ガイドライン](https://github.com/mozilla-japan/translation/wiki/Editorial-Guideline) などを参照してください。

## 🛠️ トラブルシュート

| 症状                                            | 確認すること                                                                                                                 |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| HTTP で Cursor が MCP に接続できない            | **`npm run start:http` が起動しているか**<br>Cursor の MCP 設定の `url`（ホスト・ポート・パス `/mcp`）が<br>一致しているか。 |
| MCP が起動しない / `Cannot find module`         | `npm run build` 済みか。<br>stdio のときは `args` のパスが **`dist/index.js` の絶対パス**か。                                |
| `dist/index.js` が無い                          | リポジトリルートで `npm install` と `npm run build`。                                                                        |
| ワークスペースが解決できない                    | `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` は<br>**両方**セットするか、**両方**未設定にする。                       |
| `content` / `translated-content` が見つからない | 親ディレクトリに `content` と `translated-content` があるか。<br>または上記環境変数で正しい絶対パスを指定。                  |
| `mdn_trans_commit_get` が git 関連で失敗する    | `content` が **git clone** された<br>[mdn/content](https://github.com/mdn/content) か、対象ファイルが追跡されているか。      |
| Node のバージョンエラー                         | `package.json` の `engines` は `node >= 22`。                                                                                |

## 🔐 ライセンスと第三者表記

- 本リポジトリのソースコード: [MIT License](LICENSE)。
- MDN 本文・翻訳データ・外部サイトの扱い: [THIRD_PARTY.md](THIRD_PARTY.md)。

## ⚠️ 注意

- MDN コンテンツは含まれません。
- `content` / `translated-content` は別途 clone が必要です。
- MDN のライセンスに従って利用してください。
