# mdn-translation-ja-mcp

## ✨ 概要

このツールは、MDN 翻訳作業を効率化するための **ローカル開発ツール**です。

👉 翻訳作業そのものを支援・自動化することを目的としています。  
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
MCP Server（HTTP）
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

### 詳細な導入手順

1. **前提**:
   [Node.js](https://nodejs.org/) 22 以上（LTS 推奨）、[Cursor](https://cursor.com/)（MCP の **Streamable HTTP** または **stdio** に対応した版）。
2. **ビルド**:
   `mdn-translation-ja-mcp` で `npm install` のあと **`npm run build`** を実行する（`dist/index.js` / `dist/http.js` が生成されます）。
3. **（任意）環境変数**:
   推奨の兄弟ディレクトリ構成なら **`env` は不要**です。  
   `content` / `translated-content` を別の場所に置く場合は、stdio 利用時は
   [examples/cursor-mcp-with-env.json](examples/cursor-mcp-with-env.json) のとおり MCP 設定の `env` に
   `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` を**両方**書く（片方だけは不可。後述「パスの解決順」）。  
   **Streamable HTTP で同じ変数を使う場合**は、`npm run start:http` を実行するシェルで export するか、プロセスマネージャ経由で渡してください。

## 🚀 セットアップ

```bash
git clone https://github.com/gurezo/mdn-translation-ja-mcp
cd mdn-translation-ja-mcp

npm install
npm run build
npm run start:http
```

## 🌐 MCP エンドポイント

```text
http://127.0.0.1:3050/mcp
```

`mdn/content` 配下のローカル翻訳環境で使われるポート（例: 5042 / 5043 / 8083）と重ならないよう **3050** を既定にしています。  
変更は環境変数 `PORT` で可能です。  
先に **`npm run start:http`** でサーバーを起動してから Cursor から接続します。

## ⚙️ Cursor 設定（mcp.json）

[examples/cursor-mcp-http.json](examples/cursor-mcp-http.json) と同じ内容です。  
Streamable HTTP では **`type` と `url` を指定**してください。

```json
{
  "mcpServers": {
    "mdn-translation-ja": {
      "type": "http",
      "url": "http://127.0.0.1:3050/mcp"
    }
  }
}
```

## 🔗 MCP ツール名の対応

[開発コンセプト（Wiki）](https://github.com/gurezo/mdn-translation-ja-mcp/wiki/mdn%E2%80%90translation%E2%80%90ja%E2%80%90mcp-%E9%96%8B%E7%99%BA%E3%82%B3%E3%83%B3%E3%82%BB%E3%83%97%E3%83%88) の `/mdn-trans-*`（ハイフン表記のコマンド案）と、
MCP ツール名（`/mdn_trans_*` など）の対応は次のとおりです。

### 翻訳フロー（最短）

一例として、翻訳開始 → コミット取得 → 用語 → レビューの順で使えます。

1. **翻訳開始** — 対象の MDN URL を伝え、**`/mdn_trans_start`** で `ja` の `index.md` を用意する（必要なら **`/mdn_resolve_page_paths`** でパス確認）。
2. **英語原文との同期** — **`/mdn_trans_commit_get`** で `sourceCommit` を取得し、必要なら **`/mdn_trans_source_commit_set`** で front-matter を更新する。
3. **用語 `{{glossary}}`** — **`/mdn_glossary_macro_scan`** → **`/mdn_glossary_replacement_candidates`** → **`/mdn_glossary_apply`**（試すときは `dry_run` も可）。
4. **レビュー** — **`/translation_rules`** で参照リンクを確認しつつ **`/review_translation`** でルールベースの指摘を得る。

| Wiki（スラッシュコマンド案） | MCP ツール（呼び出し表記） | 主な用途 |
| ----------------------------- | ------------------------- | -------- |
| `/mdn-trans-start` | `/mdn_trans_start` | URL を指定して翻訳作業を開始（content → `translated-content/files/ja`） |
| `/mdn-trans-commit-get` | `/mdn_trans_commit_get` | `content` 側のコミットハッシュ取得・`sourceCommit` 反映のたたき台 |
| （同上フロー） | `/mdn_trans_source_commit_set` | 本文は変えず `l10n.sourceCommit` のみ更新 |
| — | `/mdn_resolve_page_paths` | 英語・日本語 `index.md` のパスと有無（`sourceExists` / `translationExists`） |
| — | `/mdn_workspace_paths` | `content` / `translated-content` の絶対パス |
| `/mdn-trans-replace-glossary` | `/mdn_glossary_macro_scan` ほか | `{{glossary}}` の走査・候補・置換 |
| `/mdn-trans-review` | `/review_translation` | 翻訳レビュー（findings JSON） |
| — | `/translation_rules` | 表記・L10N リンク等の JSON |


## 🗂️ パスの解決順（MCP ツール `/mdn_workspace_paths`）

1. **環境変数（任意）** — `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` を**両方**指定すると、その絶対パスをそのまま使います。  
   片方だけの指定はできません（誤設定防止のためエラーになります）。
2. **兄弟ディレクトリ** — どちらの環境変数も未設定のとき、本リポジトリのルート（ビルド後は `dist/` の親）の**ひとつ上のディレクトリ**を親とみなし、そこにある `content` と `translated-content` を参照します。  
   `cwd` には依存しません。

**リポジトリ実体** — 解決した `content` 相当のルートには `files/en-us` が、`translated-content` 相当のルートには `files/ja` がそれぞれディレクトリとして存在する必要があります（公式リポジトリを clone した状態）。  
名前だけの空フォルダではエラーになります。

## 📚 用語集 JSON（ツール `/mdn_glossary_replacement_candidates` / `/mdn_glossary_apply`）

`{{glossary("term")}}` の第2引数（表示名）の置換候補は、
[src/shared/data/glossary-terms.json](src/shared/data/glossary-terms.json) をビルド時に `dist/shared/data/` にコピーしたものを既定で参照します。

- **上書き** — 環境変数 `MDN_GLOSSARY_JSON_PATH` に別ファイルの絶対パスを指定するか、MCP ツール引数 `glossary_path` でパスを渡すと、その JSON を使います。
- **未登録のスラグ** — 用語集にキーが無いマクロは `status: "missing"` として返します（推測で第2引数は埋めません）。

## 📋 MCP ツールのエラー応答

本サーバーは **stdio**（`npm start` → `dist/index.js`）または **Streamable HTTP**（`npm run start:http` → `dist/http.js`）のいずれかで起動します。  
各ツールは **JSON テキスト**を本文として返します。

- **MCP プロトコル上のツール結果**は、ドメインのエラーであっても **通常は成功として返されます**（`content` に `type: "text"` の JSON 文字列が入る形）。  
  **エラーかどうかは本文 JSON の `ok` で判定**してください。
- **`ok: true`** — 処理が成功した、または `dry_run` などで予定のみ返した場合。
- **`ok: false`** — 想定内の失敗（パス解決失敗、ファイル未存在、Git 取得失敗、用語集の読み込みエラーなど）。  
  **`code`**（`ENV_PARTIAL`、`SIBLING_MISSING`、`FILE_CHANGED` など、ツールごとに定義）と **`message`**（人間向け説明）が付き、必要に応じて **`details`** に補足が入ります。
- **未捕捉の例外**は MCP 実装に委ねられ、クライアント側でツール呼び出しエラーとして扱われることがあります。

エージェントやスクリプトでは、**本文を `JSON.parse` したうえで `ok` を確認**してください。  
`content` / `translated-content` / 本リポジトリの配置が不適切だと、`ok: false` になりやすいです。

## 💬 Cursor での利用例（エージェント）

MCP を有効にしたうえで、**チャットで対象ページの MDN URL を伝え**、上表のツールをエージェントに実行させます。  
例（概念）：

- 「`https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API` を翻訳開始して」→ `/mdn_trans_start`（必要なら `/mdn_resolve_page_paths` でパス確認）。
- 「この URL の英語原文の最新コミットは？」→ `/mdn_trans_commit_get`。
- 「`ja` の `index.md` の `sourceCommit` だけ英語に合わせて更新して」→ `/mdn_trans_source_commit_set`。
- 「`{{glossary}}` の第2引数を用語集に合わせて」→ `/mdn_glossary_replacement_candidates` で確認のうえ `/mdn_glossary_apply`（`dry_run` で試すことも可）。
- 「翻訳ルールに沿ってレビューして」→ `/translation_rules` で参照リンクを確認しつつ `/review_translation`。

人手レビューでは、[表記ガイドライン](https://github.com/mozilla-japan/translation/wiki/Editorial-Guideline) などへのリンクは `/translation_rules` の結果にも含まれます。

## 🛠️ トラブルシュート

| 症状 | 確認すること |
| --- | --- |
| HTTP で Cursor が MCP に接続できない | **`npm run start:http` が起動しているか**<br>`mcp.json` の `url`（ホスト・ポート・パス `/mcp`）が一致しているか。 |
| MCP が起動しない / `Cannot find module` | `npm run build` 済みか、stdio のときは `args` のパスが **`dist/index.js` の絶対パス**か。 |
| `dist/index.js` が無い | リポジトリルートで `npm install` と `npm run build`。 |
| `/mdn_workspace_paths` が失敗する（`ENV_PARTIAL`） | `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` は**両方**セットするか、**両方**未設定にする。 |
| `SIBLING_MISSING` などパスが見つからない | 親ディレクトリに `content` と `translated-content` があるか。<br>または上記環境変数で正しい絶対パスを指定。 |
| `/mdn_trans_commit_get` が git 関連で失敗する | `content` が **git clone** された [mdn/content](https://github.com/mdn/content) か、対象ファイルが追跡されているか。 |
| Node のバージョンエラー | `package.json` の `engines` は `node >= 22`。 |

## 🔐 ライセンスと第三者表記

- 本リポジトリのソースコード: [MIT License](LICENSE)。
- MDN 本文・翻訳データ・外部サイトの扱い: [THIRD_PARTY.md](THIRD_PARTY.md)。

## ⚠️ 注意

- MDN コンテンツは含まれません。
- `content` / `translated-content` は別途 clone が必要です。
- MDN のライセンスに従って利用してください。