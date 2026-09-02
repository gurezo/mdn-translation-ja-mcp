## ✨ 概要

このツールは、MDN 翻訳作業を支援・自動化することを目的とした **MCP サーバー**です。  
MCP クライアント（Cursor / Claude / VS Code など）からサーバーを登録するだけで、翻訳の開始・同期・レビューとガイドライン参照ができます。Cursor Rules / Skills は必須ではありません。

MDN の本文はリポジトリに含めません。手元では
[mdn/content](https://github.com/mdn/content) および
[mdn/translated-content](https://github.com/mdn/translated-content) を GitHub 上で **fork** し、その fork を **clone** して参照する想定です。

## 🎯 目的

- 翻訳開始（原文コピー）の自動化。
- 原文との同期（sourceCommit）の管理。
- glossary マクロの補助。
- ガイドラインに基づくレビュー。

## 🧱 アーキテクチャ

```text
MCP Client（Cursor / Claude / VS Code / other）
  ↓  stdio または Streamable HTTP
MCP Server
  ├─ Tools / Resources / Prompts
  └─ content + translated-content
```

## 📦 前提環境

以下の構成が必要です：

```text
.
├── content
├── translated-content
└── mdn-translation-ja-mcp
```

### 必須リポジトリ（fork → clone）

翻訳作業で参照する英語原文・日本語訳は、上流の次のリポジトリを自分の GitHub アカウントへ **fork** してから、手元へ **clone** します。

- 上流（fork 元）: [mdn/content](https://github.com/mdn/content)
- 上流（fork 元）: [mdn/translated-content](https://github.com/mdn/translated-content)

親ディレクトリで、fork したリポジトリを次のように **clone** します（クローン先ディレクトリ名は任意ですが、`content` / `translated-content` とすると後述のディレクトリツリーと一致します）。

```bash
mkdir -p mdn-work && cd mdn-work
git clone https://github.com/<あなたのGitHubユーザー名>/content.git # fork した content をclone
git clone https://github.com/<あなたのGitHubユーザー名>/translated-content.git # fork した translated-content をclone
git clone https://github.com/gurezo/mdn-translation-ja-mcp.git
```

`<あなたのGitHubユーザー名>` は、fork 先のアカウント名に読み替えてください（上記は [mdn/content](https://github.com/mdn/content) / [mdn/translated-content](https://github.com/mdn/translated-content) の fork を clone する例です）。

### ランタイム

- [Node.js](https://nodejs.org/) 22 以上（LTS 推奨）
- MCP クライアント（[Cursor](https://cursor.com/) など。**stdio** または **Streamable HTTP**）。HTTP 必須ではありません。Cursor Rules / Skills は任意です。

### translated-content リポジトリ側で行うこと

翻訳作業では **`translated-content` だけを Cursor のワークスペースとして開く**ことが多く、この場合の MCP 接続は次のとおりです。

**前提:** `content`・`translated-content`・`mdn-translation-ja-mcp` の **3 リポジトリを同じ親ディレクトリに並べる**こと（上記ディレクトリツリー）を推奨します。別の場所に置いている場合も、下記 `mcp.json` の **`env` に両方のルートを絶対パスで書く**形は同じです。

1. **`translated-content` リポジトリのルート**に、ディレクトリ **`.cursor`** を作成します。
2. **`translated-content/.cursor/mcp.json`** を、次の **実装例どおり**に作成します（ワークスペースのルートが `translated-content` のとき、このパスに置きます）。  
   [integrations/cursor/mcp.example.json](integrations/cursor/mcp.example.json) は **同一内容**のファイルです。コピーしてからパスだけ差し替えても構いません。

```json
{
  "mcpServers": {
    "mdn-translation-ja": {
      "command": "node",
      "args": ["/Users/translator/work/mdn-translation-ja-mcp/dist/index.js"],
      "env": {
        "MDN_CONTENT_ROOT": "/Users/translator/work/content",
        "MDN_TRANSLATED_CONTENT_ROOT": "/Users/translator/work/translated-content"
      }
    }
  }
}
```

3. 上記の `/absolute/path/to/...` は、次を指す **実環境でのフルパス（絶対パス）** に置き換えます。
   - **`args[0]`** — `mdn-translation-ja-mcp/dist/index.js` の絶対パス（先に「mdn-translation-ja-mcp 側」で `npm run build` 済みであること）
   - **`MDN_CONTENT_ROOT`** — 英語原文リポジトリ（[mdn/content](https://github.com/mdn/content)）のルート
   - **`MDN_TRANSLATED_CONTENT_ROOT`** — 日本語訳リポジトリ（[mdn/translated-content](https://github.com/mdn/translated-content)）のルート

同一親フォルダに 3 リポジトリを並べる場合も、`args` と `env` は **必ず絶対パス**で記載してください（プレースホルダのままにしないでください）。

4. **（推奨）一括セットアップ** — `mdn-translation-ja-mcp` でビルド済みなら、次で **`mcp.json` のみ**生成できます（Rules / Skills はコピーしません）。

```bash
cd mdn-translation-ja-mcp
npm run build
npm run setup:translated-content-cursor
# translated-content のパスが兄弟でない場合:
# node scripts/setup-translated-content-cursor.mjs /path/to/translated-content
# 薄い Rule も置く場合:
# npm run setup:translated-content-cursor -- --with-rules
```

5. **Cursor をリロード** — `mcp.json` 追加・変更後はウィンドウの再読み込みが必要です。

6. **MCP 接続確認** — Cursor の **Settings → MCP** でサーバー **`mdn-translation-ja`** が有効でエラーなく接続されていること。標準手順は MCP Prompt（`mdn_translate` / `mdn_sync` / `mdn_review`）です。

7. **（任意）Rules / Skills** — 基本フローには不要です。入れるメリットと手順は [integrations/cursor/README.md](integrations/cursor/README.md) と下記「Cursor AI 設定（任意）」を参照。

**注意（翻訳のコミット・PR）:** `translated-content/.cursor/` は **手元の Cursor 用のローカル設定**です。**翻訳作業のコミットや `mdn/translated-content` へのプルリクエストの差分に含めないでください**（絶対パスが入るため、リポジトリにコミットする想定ではありません）。誤ってステージしないよう、必要なら手元の `translated-content` で `.gitignore` に `.cursor/` を追加してください。

### mdn-translation-ja-mcp リポジトリ側で行うこと

MCP サーバーとして使うには、少なくとも次を実行します。

```bash
cd mdn-translation-ja-mcp   # clone 済みのディレクトリへ

npm install
npm run build   # dist/index.js / dist/http.js が生成される
```

ビルド後、stdio の動作確認に **`npm start`** または Streamable HTTP に **`npm run start:http`** を使えます。

**重要:** チャットのエージェントが `mdn_trans_review` を実行するために **`npm start` を手動で走らせる必要はありません**。エージェントは Cursor が **`mcp.json` 経由で起動した MCP サーバー**のツールを使います。`npm start` はターミナルでのサーバー単体確認用です。

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

TypeScript API リファレンスを TypeDoc で生成できます（出力先は `docs/`）。

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

一例として、Prompt **`mdn_translate`** が次の順で Tools / Resources を使います（個別に Tool を呼んでも同じです）。

1. **翻訳開始** — 対象の MDN URL を伝え、**`mdn_trans_start`** で `ja` の `index.md` を用意します。
2. **英語原文との同期** — **`mdn_trans_commit_get`** で `content` の該当ファイルに対する最新コミットを取得し、翻訳ファイルのフロントマターに **`l10n.sourceCommit`** を書き込みます。
3. **用語 `{{glossary}}`** — **`mdn_trans_replace_glossary`** で、指定した翻訳ファイル内の `{{glossary("id")}}` を用語データに基づき `{{glossary("id", "表示名")}}` に置換します。
4. **レビュー** — **`mdn_trans_review`** でガイドライン機械チェック（表記・文体・l10n メタデータ・glossary マクロ等。ルールは `mdn://data/review-rules` と同じ JSON）を行います（**サーバーは対象ファイルを変更しません**。意訳の自然さなど未自動の項目は人手確認。エージェントはレビュー結果だけを理由にそのファイルを編集しないよう注意してください）。ガイドライン本文は Resources（`mdn://guidelines/*` / `mdn://glossary`）です。

| MCP ツール名                 | 主な用途                                                                                                                                                                                                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mdn_trans_start`            | URL を指定し、`content` の `files/en-us/<category>/<slug...>/index.md` を **`translated-content` の `files/ja/<category>/<slug...>/index.md` にコピーするだけ**（翻訳・`_redirects.txt`・他ファイルの修正はしない。URL 側の `/docs/` はファイルパスには現れない） |
| `mdn_trans_commit_get`       | `content` の git 履歴からコミットハッシュを取得し、`l10n.sourceCommit` を翻訳ファイルに反映する                                                                                                                                                                   |
| `mdn_trans_replace_glossary` | 指定ファイル内の 1 引数 `{{glossary}}` を第 2 引数付きに置換する                                                                                                                                                                                                  |
| `mdn_trans_review`           | 翻訳ファイルのガイドライン機械レビュー（`mdn://data/review-rules` と同じ JSON）。**読み取りのみ**（対象 `index.md` には書き込まない）                                                                                                                             |

`mdn_trans_replace_glossary` と `mdn_trans_review` には、**translated-content 内のファイルパス**を渡してください（絶対パス、または `files/ja/` からの相対パス）。MCP はエディタの「開いているファイル」を知らないため、エージェントがパスを明示する想定です。

## 🗂️ パスの解決順

各ツールのワークスペース解決で共通です。  
環境変数の要否は「translated-content リポジトリ側」の `mcp.json`（`MDN_CONTENT_ROOT` / `MDN_TRANSLATED_CONTENT_ROOT` の指定）と同じ前提です。

1. **環境変数（任意）** —  
   `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` を**両方**指定すると、その絶対パスをそのまま使います。  
   片方だけは不可（誤設定防止のためエラー）。
2. **兄弟ディレクトリ** — どちらの環境変数も未設定のとき、  
   **プロセスのカレントディレクトリ**（通常は本リポジトリのルート）の**ひとつ上のディレクトリ**を親とみなし、  
   そこにある `content` と `translated-content` を参照します。

**リポジトリ実体** — 解決した `content` 相当のルートには `files/en-us` が、  
`translated-content` 相当のルートには `files/ja` がそれぞれディレクトリとして存在する必要があります（上流を fork して clone した状態で、リポジトリ一式が揃っていること）。  
名前だけの空フォルダではエラーになります。

環境変数の MCP 設定例は  
[integrations/cursor/mcp.example.json](integrations/cursor/mcp.example.json) を参照してください。

## 📋 MCP ツールの応答

本サーバーは **stdio**（`npm start` → `dist/index.js`）または  
**Streamable HTTP**（`npm run start:http` → `dist/http.js`）のいずれかで起動します。  
各ツールの結果は MCP の **`text` コンテンツ**として返ります（人間が読める説明文）。

想定外のエラー（パス解決失敗、ファイル未存在、Git 取得失敗など）は **ツール実装が例外を投げ**、クライアント側でツール呼び出しエラーとして扱われることがあります。

## 🔎 他 MCP クライアントでの確認

Cursor 以外では **MCP Inspector** で Tools / Resources / Prompts を確認できます（`.cursor` は不要です）。

```bash
npm run build
npm run inspect   # GUI。CLI 手順は architecture/client-verification.md
```

検証結果と Claude Code / VS Code の設定例は [architecture/client-verification.md](architecture/client-verification.md) を参照してください。

## 💬 Cursor での利用例（エージェント）

MCP を有効にしたうえで、**チャットで対象ページの MDN URL を伝え**、主に次のツールをエージェントに実行させます。

- 「`https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API` を翻訳開始して」→ `mdn_trans_start`。
- 「この URL の英語原文の最新コミットを `sourceCommit` に反映して」→ `mdn_trans_commit_get`。
- 「この `index.md` の `{{glossary}}` に第2引数を付けて」→ `mdn_trans_replace_glossary`（対象ファイルパスを指定）。
- 「この翻訳をルールでざっと確認して」→ `mdn_trans_review`（対象ファイルパスを指定。**レビュー結果を理由にそのファイルを自動編集しない**）。

### translated-content を Cursor で開いて作業する場合

（MCP の設定は **`translated-content/.cursor/mcp.json`**。手順と「翻訳 PR に `mcp.json` を含めない」旨の注意は「translated-content リポジトリ側で行うこと」を参照してください。）

翻訳作業では **`translated-content` リポジトリだけをワークスペースとして開く**運用がよくあります。上記のとおり `mcp.json` で `env` を指定していれば、ツールが `content` を参照する際のパスは一貫します（解決の詳細は「パスの解決順」）。

- 親ディレクトリに **`content`** と **`translated-content`** が並んでいる（上記「前提環境」のディレクトリツリーと同じ）。
- Cursor で **フォルダとして開いているルートが `translated-content`**（例: `.../mdn-work/translated-content`）。

このとき、エージェントに **ツール名と引数が分かるよう**、チャットへそのまま貼れる例は次のとおりです（`Glossary/Symbol` を例にしています。別ページでは URL と `files/ja/...` を読み替えてください）。

```text
mdn_trans_start で翻訳用ファイルを用意して。
url: https://developer.mozilla.org/en-US/docs/Glossary/Symbol
```

```text
mdn_trans_commit_get を実行して。
url: https://developer.mozilla.org/en-US/docs/Glossary/Symbol
```

```text
mdn_trans_replace_glossary を実行して。
jaFile: files/ja/glossary/symbol/index.md
```

```text
MCP ツール mdn_trans_review を実行して。レビュー結果だけ報告し、files/ja/glossary/symbol/index.md は編集・保存しないで。
jaFile: files/ja/glossary/symbol/index.md
```

**重要:** `mdn_trans_*` は **MCP ツール名**であり、ターミナルのシェルコマンドではありません。エージェントは Cursor の MCP サーバー `mdn-translation-ja` から呼び出してください。

**パス指定のコツ:** MCP はエディタの「開いているファイル」を自動では知らないため、**`files/ja/...` からの相対パス**（ワークスペースが `translated-content` のとき）か、**`index.md` の絶対パス**のどちらかを必ず含めます。  
親ディレクトリ構成が異なる場合は、MCP 設定の `env` に `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` を**両方**指定してください（[integrations/cursor/mcp.example.json](integrations/cursor/mcp.example.json)）。

人手レビューでは MCP Resources（`mdn://guidelines/editorial` / `l10n` / `japanese-style`、`mdn://glossary`）を参照してください。`.agents/skills` をワークスペースへコピーする必要はありません。

## 🤖 Cursor AI 設定（任意）

Cursor Rules / Skills は **optional integration** です。MCP サーバーを登録すれば、Prompt と Resource だけで基本翻訳フローを実行できます。

入れると便利な点は [integrations/cursor/README.md](integrations/cursor/README.md) にまとめています。

- 薄い Rule: エージェントが `mdn_trans_*` をシェルコマンドと誤認しにくくなる
- workflow Skill: Cursor の Skill ピッカーから `mdn_translate` 相当の手順を開ける

本リポジトリには、この MCP サーバーを Cursor で開発するための任意資産も含まれます。

```text
mdn-translation-ja-mcp/
├── .agents/skills/          # mozilla-japan 翻訳ガイドライン（外部ドメイン知識）
│   ├── editorial-guideline/
│   ├── l10n-guideline/
│   ├── mozilla-l10n-glossary/
│   └── japanese-style/
├── .cursor/
│   ├── rules/               # 常時適用の基本制約・MCP 呼び出し制約
│   │   ├── 00-mdn-translation.mdc
│   │   └── 01-mdn-mcp-tools.mdc
│   └── skills/              # MCP 翻訳ワークフロー
│       └── mdn-translation-workflow/
└── integrations/cursor/     # Cursor 向け optional 雛形
    ├── mcp.example.json
    └── rules/01-mdn-mcp-tools.mdc
```

### translated-content で翻訳する場合（任意）

基本フローには不要です。Cursor のエージェント UX を足したいときだけ、次を使います。

```bash
# 例: symlink（mdn-translation-ja-mcp と translated-content が兄弟ディレクトリの場合）
ln -s ../mdn-translation-ja-mcp/.agents translated-content/.agents
ln -s ../mdn-translation-ja-mcp/.cursor/skills translated-content/.cursor/skills

mkdir -p translated-content/.cursor/rules
cp ../mdn-translation-ja-mcp/integrations/cursor/rules/01-mdn-mcp-tools.mdc translated-content/.cursor/rules/
# または mdn-translation-ja-mcp の .cursor/rules/*.mdc をまとめてコピー
```

MCP 接続は `translated-content/.cursor/mcp.json` に設定します（翻訳 PR に含めないでください）。**`rules-from-mcp` のような別名ディレクトリでは Cursor が Rules を読み込めません。** 必ず `translated-content/.cursor/rules/` に置いてください。

## 🛠️ トラブルシュート

| 症状                                            | 確認すること                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP で Cursor が MCP に接続できない            | **`npm run start:http` が起動しているか**<br>Cursor の MCP 設定の `url`（ホスト・ポート・パス `/mcp`）が<br>一致しているか。                                                                                                                                                                                                                                                                                      |
| MCP が起動しない / `Cannot find module`         | `npm run build` 済みか。<br>stdio のときは `args` のパスが **`dist/index.js` の絶対パス**か。                                                                                                                                                                                                                                                                                                                     |
| `dist/index.js` が無い                          | リポジトリルートで `npm install` と `npm run build`。                                                                                                                                                                                                                                                                                                                                                             |
| ワークスペースが解決できない                    | `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` は<br>**両方**セットするか、**両方**未設定にする。                                                                                                                                                                                                                                                                                                            |
| `content` / `translated-content` が見つからない | 親ディレクトリに `content` と `translated-content` があるか。<br>または上記環境変数で正しい絶対パスを指定。                                                                                                                                                                                                                                                                                                       |
| `mdn_trans_commit_get` が git 関連で失敗する    | `content` が **fork した [mdn/content](https://github.com/mdn/content) を clone** したリポジトリか、対象ファイルが追跡されているか。                                                                                                                                                                                                                                                                              |
| Node のバージョンエラー                         | `package.json` の `engines` は `node >= 22`。                                                                                                                                                                                                                                                                                                                                                                     |
| `mdn_trans_review` がシェルで見つからない       | **`npm start` では解決しない**（エージェント用ではない）。<br>ワークスペースが **`translated-content`** か、`translated-content/.cursor/mcp.json` があるか。<br>`npm run setup:translated-content-cursor` 後に Cursor をリロードしたか。<br>Settings → MCP で **`mdn-translation-ja`** が接続済みか。<br>フォールバック: `mdn-translation-ja-mcp` で `npm run mdn:trans:review -- --jaFile=files/ja/.../index.md` |

## 🔐 ライセンスと第三者表記

- 本リポジトリのソースコード: [MIT License](LICENSE)。
- MDN 本文・翻訳データ・外部サイトの扱い: [THIRD_PARTY.md](THIRD_PARTY.md)。

## ⚠️ 注意

- MDN コンテンツは含まれません。
- `content` / `translated-content` は上流を fork したうえで、別途 clone が必要です。
- MDN のライセンスに従って利用してください。
