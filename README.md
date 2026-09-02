## 概要

このリポジトリは、MDN 日本語翻訳を支援する **MCP サーバー**です。  
MCP クライアント（Cursor / Claude / VS Code など）からサーバーを登録するだけで、翻訳の開始・同期・レビューとガイドライン参照ができます。Cursor Rules / Skills は必須ではありません。

MDN の本文はリポジトリに含めません。手元では
[mdn/content](https://github.com/mdn/content) および
[mdn/translated-content](https://github.com/mdn/translated-content) を GitHub 上で **fork** し、その fork を **clone** して参照する想定です。

利用者向けの詳細は GitHub Pages（TypeDoc）の次のページです。

- [Architecture](site/architecture.md)
- [Getting Started](site/getting-started.md)
- [MCP Tools](site/mcp-tools.md)
- [MCP Resources](site/mcp-resources.md)
- [MCP Prompts](site/mcp-prompts.md)
- [Translation Workflow](site/translation-workflow.md)
- [Client Integration](site/client-integration.md)

## 目的

- 翻訳開始（原文コピー）の自動化。
- 原文との同期（sourceCommit）の管理。
- glossary マクロの補助。
- ガイドラインに基づくレビュー。

## アーキテクチャ

```text
MCP Client（Cursor / Claude / VS Code / other）
    │  stdio または Streamable HTTP
    ▼
mdn-translation-ja-mcp
├─ Tools
├─ Resources
├─ Prompts
└─ content + translated-content

integrations/cursor/   … optional UX
```

設計の詳細は [architecture/mcp-native.md](architecture/mcp-native.md) を参照してください。

## 最小セットアップ

### 前提リポジトリ（fork → clone）

同じ親ディレクトリに次を並べます（ディレクトリ名は任意ですが、この名前だと後述の兄弟ディレクトリ解決と一致します）。

```text
.
├── content
├── translated-content
└── mdn-translation-ja-mcp
```

```bash
mkdir -p mdn-work && cd mdn-work
git clone https://github.com/<あなたのGitHubユーザー名>/content.git
git clone https://github.com/<あなたのGitHubユーザー名>/translated-content.git
git clone https://github.com/gurezo/mdn-translation-ja-mcp.git
```

`<あなたのGitHubユーザー名>` は fork 先のアカウント名に読み替えてください。上流は [mdn/content](https://github.com/mdn/content) / [mdn/translated-content](https://github.com/mdn/translated-content) です。

### ランタイム

- [Node.js](https://nodejs.org/) 22 以上（LTS 推奨）
- MCP クライアント（stdio または Streamable HTTP）。HTTP 必須ではありません。Cursor Rules / Skills は任意です。

### サーバーのビルド

```bash
cd mdn-translation-ja-mcp
npm install
npm run build
```

`dist/index.js`（stdio）と `dist/http.js`（Streamable HTTP）が生成されます。チャットのエージェントのために **`npm start` を手動で走らせる必要はありません**。クライアントが MCP 設定経由でサーバーを起動します。`npm start` / `npm run start:http` は単体確認用です。

### サーバー登録

どのクライアントでも次を渡します。パスは **絶対パス** に置き換えてください。

- `command`: `node`
- `args`: `/absolute/path/to/mdn-translation-ja-mcp/dist/index.js`
- `env.MDN_CONTENT_ROOT`: content のルート
- `env.MDN_TRANSLATED_CONTENT_ROOT`: translated-content のルート

設定ファイルの例は [examples/README.md](examples/README.md) です。

- MCP 共通: [examples/mcp/README.md](examples/mcp/README.md)（Claude Code / VS Code / Inspector）
- Cursor: [examples/cursor/mcp.example.json](examples/cursor/mcp.example.json)

クライアント別の置き場は [site/client-integration.md](site/client-integration.md) を参照してください。

### `content` / `translated-content` のパス解決

1. **環境変数（任意）** — `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` を**両方**指定すると、その絶対パスを使います。片方だけは不可です。
2. **兄弟ディレクトリ** — どちらも未設定のとき、プロセスのカレントディレクトリのひとつ上を親とみなし、そこにある `content` と `translated-content` を参照します。

解決した `content` 相当のルートには `files/en-us` が、`translated-content` 相当のルートには `files/ja` がディレクトリとして存在する必要があります。名前だけの空フォルダではエラーになります。

## MCP Tools

**先頭に `/` は付きません**（登録名は `mdn_trans_start` のようなスネークケースです）。シェルコマンドではありません。

| MCP ツール名 | 主な引数 | 用途 |
| --- | --- | --- |
| `mdn_trans_start` | `url` | `content` の原文 `index.md` を `translated-content` の対応パスへコピーするだけ（翻訳・`_redirects.txt`・他ファイルの修正はしない） |
| `mdn_trans_commit_get` | `url` | content の git 履歴からコミットハッシュを取得し、`l10n.sourceCommit` を翻訳ファイルに反映する |
| `mdn_trans_replace_glossary` | `jaFile` | 1 引数 `{{glossary}}` を第 2 引数付きに置換する |
| `mdn_trans_review` | `jaFile` | ガイドライン機械レビュー（`mdn://data/review-rules` と同じ JSON）。**読み取りのみ** |

`url` は `https://developer.mozilla.org/en-US/docs/...` 形式です。URL 側の `/docs/` はファイルパスに現れません。

`jaFile` は translated-content 内の絶対パス、または `files/ja/` からの相対パスです。MCP はエディタの「開いているファイル」を知りません。

詳細は [site/mcp-tools.md](site/mcp-tools.md) です。

## MCP Resources

人手翻訳ではガイドラインを Resource から読んでください。`.agents/skills` のコピーは不要です。

| URI | 内容 |
| --- | --- |
| `mdn://guidelines/editorial` | 表記ガイドライン |
| `mdn://guidelines/l10n` | L10N ガイドライン |
| `mdn://guidelines/japanese-style` | 文体ルール |
| `mdn://glossary` | 用語抜粋と Wiki 参照手順 |
| `mdn://data/glossary-terms` | 機械用 glossary（`mdn_trans_replace_glossary` と同一） |
| `mdn://data/review-rules` | 機械チェックルール（`mdn_trans_review` と同一） |
| `mdn://data/prohibited-expressions` | 禁止・注意表現 |

詳細は [site/mcp-resources.md](site/mcp-resources.md) です。

## MCP Prompts

標準手順は Prompt です。サーバー内では LLM を実行しません。

| Prompt | 引数 | 用途 |
| --- | --- | --- |
| `mdn_translate` | `url` | 翻訳開始からレビューまでの標準フロー |
| `mdn_sync` | `url` | 既存訳の `l10n.sourceCommit` 同期 |
| `mdn_review` | `jaFile` | 機械レビューと人手確認項目 |

詳細は [site/mcp-prompts.md](site/mcp-prompts.md) です。

## 翻訳フロー

一例として、Prompt **`mdn_translate`** は次の順で Tools / Resources を使います。

1. **`mdn_trans_start`** — `ja` の `index.md` を用意する
2. **`mdn_trans_commit_get`** — `l10n.sourceCommit` を書き込む
3. **Resources** — ガイドラインを読む
4. **クライアント LLM** — 本文を翻訳する
5. **`mdn_trans_replace_glossary`** — `{{glossary}}` 第 2 引数を補完する
6. **`mdn_trans_review`** — 機械チェックする（対象ファイルは変更しない）

既存訳の同期は `mdn_sync`、レビューだけなら `mdn_review` です。手順の全体は [site/translation-workflow.md](site/translation-workflow.md) です。

## Cursor integration（optional）

Cursor で必要なのは MCP 接続設定だけです。Rules / Skills は任意です。

- 手動: [examples/cursor/mcp.example.json](examples/cursor/mcp.example.json) を `translated-content/.cursor/mcp.json` にコピーし、絶対パスを書き換える
- 一括: `npm run setup:translated-content-cursor`（既定は `mcp.json` のみ。薄い Rule は `--with-rules`）

```bash
cd mdn-translation-ja-mcp
npm run build
npm run setup:translated-content-cursor
```

`translated-content/.cursor/` は手元のローカル設定です。翻訳 PR に含めないでください。

入れると便利な点（エージェントがツール名をシェルと誤認しにくくなる等）は [integrations/cursor/README.md](integrations/cursor/README.md) にまとめています。

## 他 MCP クライアント

Cursor 以外では [examples/mcp/README.md](examples/mcp/README.md) の JSON を使います。MCP Inspector なら `.cursor` は不要です。

```bash
npm run build
npm run inspect
```

検証結果は [architecture/client-verification.md](architecture/client-verification.md) を参照してください。

## ツールの応答

本サーバーは **stdio**（`npm start` → `dist/index.js`）または **Streamable HTTP**（`npm run start:http` → `dist/http.js`）で起動します。各ツールの結果は MCP の **`text` コンテンツ**として返ります。想定外のエラーはクライアント側でツール呼び出しエラーとして扱われることがあります。

## API ドキュメント（TypeDoc）

TypeScript API リファレンスと上記の利用者向けページを TypeDoc で生成します（出力先は `docs/`）。

```bash
# 生成済みドキュメントの削除
npm run docs:clean

# ドキュメント生成（docs/ を再生成）
npm run docs:build

# docs:publish は docs:build と同じ（ローカルで docs/ を更新する）
npm run docs:publish
```

## トラブルシュート

| 症状 | 確認すること |
| --- | --- |
| HTTP で MCP に接続できない | **`npm run start:http` が起動しているか**。クライアントの `url`（ホスト・ポート・パス `/mcp`）が一致しているか。 |
| MCP が起動しない / `Cannot find module` | `npm run build` 済みか。stdio のときは `args` のパスが **`dist/index.js` の絶対パス**か。 |
| `dist/index.js` が無い | リポジトリルートで `npm install` と `npm run build`。 |
| ワークスペースが解決できない | `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` は **両方**セットするか、**両方**未設定にする。 |
| `content` / `translated-content` が見つからない | 親ディレクトリに両方があるか。または上記環境変数で正しい絶対パスを指定。 |
| `mdn_trans_commit_get` が git 関連で失敗する | `content` が **fork した [mdn/content](https://github.com/mdn/content) を clone** したリポジトリか、対象ファイルが追跡されているか。 |
| Node のバージョンエラー | `package.json` の `engines` は `node >= 22`。 |
| `mdn_trans_review` がシェルで見つからない | **MCP ツールとして呼ぶ**（`npm start` では解決しない）。クライアントにサーバーが接続済みか。フォールバック: `npm run mdn:trans:review -- --jaFile=files/ja/.../index.md` |

## ライセンスと第三者表記

- 本リポジトリのソースコード: [MIT License](LICENSE)。
- MDN 本文・翻訳データ・外部サイトの扱い: [THIRD_PARTY.md](THIRD_PARTY.md)。

## 注意

- MDN コンテンツは含まれません。
- `content` / `translated-content` は上流を fork したうえで、別途 clone が必要です。
- MDN のライセンスに従って利用してください。
