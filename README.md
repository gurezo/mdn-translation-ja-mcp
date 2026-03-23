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

Issue #79 対応として TypeScript API リファレンスを TypeDoc で生成できます。

```bash
# 生成済みドキュメントの削除
npm run docs:clean

# API ドキュメント生成（出力: docs/api）
npm run docs:build

# GitHub Pages へ公開（gh-pages ブランチ）
npm run docs:publish
```

`docs:publish` は `docs:build` を内部で実行した後、`docs/api` を公開します。

## 🔗 MCP ツール名の対応

本サーバーが提供する MCP ツール名（Cursor のツール一覧に表示される名前）と主な用途です。  
**先頭に `/` は付きません**（MCP の登録名は `mdn_trans_start` のようなスネークケースです）。

### 翻訳フロー（最短）

一例として、翻訳開始 → 原文コミット同期 → glossary → レビューの順で使えます。

1. **翻訳開始** — 対象の MDN URL を伝え、**`mdn_trans_start`** で `ja` の `index.md` を用意します。
2. **英語原文との同期** — **`mdn_trans_commit_get`** で `sourceCommit` を取得し、  
   必要なら **`mdn_trans_source_commit_set`** で front-matter を更新する。
3. **用語 `{{glossary}}`** —  
   **`mdn_glossary_macro_scan`** → **`mdn_glossary_replacement_candidates`** → **`mdn_glossary_apply`**  
   （試すときは `dry_run` も可）。
4. **レビュー** — **`review_translation`** でルールベースの指摘を得る。

| MCP ツール名                          | 主な用途                                                                    |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `mdn_trans_start`                     | URL を指定して翻訳作業を開始<br>（content → `translated-content/files/ja`） |
| `mdn_trans_commit_get`                | `content` 側のコミットハッシュ取得・<br>`sourceCommit` のたたき台           |
| `mdn_trans_source_commit_set`         | 本文は変えず `l10n.sourceCommit` のみ更新                                   |
| `mdn_glossary_macro_scan`             | `{{glossary}}` マクロの走査                                                 |
| `mdn_glossary_replacement_candidates` | 置換候補の取得                                                              |
| `mdn_glossary_apply`                  | 置換の適用（`dry_run` 可）                                                  |
| `review_translation`                  | 翻訳レビュー（findings JSON）                                               |

## 🗂️ パスの解決順

`mdn_workspace_paths` および各ツールのワークスペース解決で共通です。  
環境変数の要否は「導入手順（チェックリスト）」の（任意）環境変数と同じ前提です。

1. **環境変数（任意）** —  
   `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` を**両方**指定すると、その絶対パスをそのまま使います。  
   片方だけは不可（誤設定防止のためエラー）。
2. **兄弟ディレクトリ** — どちらの環境変数も未設定のとき、  
   本リポジトリのルート（ビルド後は `dist/` の親）の**ひとつ上のディレクトリ**を親とみなし、  
   そこにある `content` と `translated-content` を参照します。`cwd` には依存しません。

**リポジトリ実体** — 解決した `content` 相当のルートには `files/en-us` が、  
`translated-content` 相当のルートには `files/ja` がそれぞれディレクトリとして存在する必要があります（公式リポジトリを clone した状態）。  
名前だけの空フォルダではエラーになります。

環境変数の MCP 設定例は  
[examples/cursor-mcp-with-env.json](examples/cursor-mcp-with-env.json) を参照してください。

## 📋 MCP ツールのエラー応答

本サーバーは **stdio**（`npm start` → `dist/index.js`）または  
**Streamable HTTP**（`npm run start:http` → `dist/http.js`）のいずれかで起動します。  
各ツールは **JSON テキスト**を本文として返します。

- **MCP プロトコル上のツール結果**は、ドメインのエラーであっても **通常は成功として返されます**。  
  （`content` に `type: "text"` の JSON 文字列が入る形）  
  **エラーかどうかは本文 JSON の `ok` で判定**してください。
- **`ok: true`** — 処理が成功した、または `dry_run` などで予定のみ返した場合。
- **`ok: false`** — 想定内の失敗（パス解決失敗、ファイル未存在、Git 取得失敗、用語集の読み込みエラーなど）。  
  **`code`**（`ENV_PARTIAL`、`SIBLING_MISSING`、`FILE_CHANGED` など、ツールごとに定義）と  
  **`message`**（人間向け説明）が付き、必要に応じて **`details`** に補足が入ります。
- **未捕捉の例外**は MCP 実装に委ねられ、  
  クライアント側でツール呼び出しエラーとして扱われることがあります。

エージェントやスクリプトでは、**本文を `JSON.parse` したうえで `ok` を確認**してください。  
`content` / `translated-content` / 本リポジトリの配置が不適切だと、  
`ok: false` になりやすいです。

## 💬 Cursor での利用例（エージェント）

MCP を有効にしたうえで、**チャットで対象ページの MDN URL を伝え**、主に次の表のツールをエージェントに実行させます。  
例（概念）：

- 「`https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API` を翻訳開始して」→ `mdn_trans_start`。
- 「この URL の英語原文の最新コミットは？」→ `mdn_trans_commit_get`。
- 「`ja` の `index.md` の `sourceCommit` だけ英語に合わせて更新して」→  
  `mdn_trans_source_commit_set`。
- 「`{{glossary}}` の第2引数を用語集に合わせて」→  
  `mdn_glossary_replacement_candidates` で確認のうえ `mdn_glossary_apply`（`dry_run` で試すことも可）。
- 「翻訳ルールに沿ってレビューして」→ `review_translation`。

人手レビューでは、[表記ガイドライン](https://github.com/mozilla-japan/translation/wiki/Editorial-Guideline) などへのリンクは  
`review_translation` の結果にも含まれることがあります。

## 🛠️ トラブルシュート

| 症状                                              | 確認すること                                                                                                                 |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| HTTP で Cursor が MCP に接続できない              | **`npm run start:http` が起動しているか**<br>Cursor の MCP 設定の `url`（ホスト・ポート・パス `/mcp`）が<br>一致しているか。 |
| MCP が起動しない / `Cannot find module`           | `npm run build` 済みか。<br>stdio のときは `args` のパスが **`dist/index.js` の絶対パス**か。                                |
| `dist/index.js` が無い                            | リポジトリルートで `npm install` と `npm run build`。                                                                        |
| `mdn_workspace_paths` が失敗する（`ENV_PARTIAL`） | `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` は<br>**両方**セットするか、**両方**未設定にする。                       |
| `SIBLING_MISSING` などパスが見つからない          | 親ディレクトリに `content` と `translated-content` があるか。<br>または上記環境変数で正しい絶対パスを指定。                  |
| `mdn_trans_commit_get` が git 関連で失敗する      | `content` が **git clone** された<br>[mdn/content](https://github.com/mdn/content) か、対象ファイルが追跡されているか。      |
| Node のバージョンエラー                           | `package.json` の `engines` は `node >= 22`。                                                                                |

## 🔐 ライセンスと第三者表記

- 本リポジトリのソースコード: [MIT License](LICENSE)。
- MDN 本文・翻訳データ・外部サイトの扱い: [THIRD_PARTY.md](THIRD_PARTY.md)。

## ⚠️ 注意

- MDN コンテンツは含まれません。
- `content` / `translated-content` は別途 clone が必要です。
- MDN のライセンスに従って利用してください。
