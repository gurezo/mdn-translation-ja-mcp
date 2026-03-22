# mdn-translation-ja-mcp

MDN 日本語翻訳作業を支援するための **ローカル MCP サーバー（HTTP）**です。Cursor から利用し、翻訳の開始・同期・レビューを自動化します。**MCP 仕様の Streamable HTTP**（`type: "http"` + `url` …`/mcp`）を推奨します。別途 **stdio**（`command` / `args` で `node dist/index.js` を起動）も利用できます。MDN の本文はリポジトリに含めず、手元で clone した [mdn/content](https://github.com/mdn/content) および [mdn/translated-content](https://github.com/mdn/translated-content) を参照する想定です。

## 破壊的変更（互換性なし）

以前の **REST `/api/*` + SSE（例: `http://localhost:3000` の `/api/rules` 等）** は **廃止**済みです（Issue #1）。それは MCP ではなく独自 HTTP API でした。**廃止したのはあのスタックのみ**です。現行の **MCP Streamable HTTP**（`npm run start:http`、`/mcp` エンドポイント）は別物であり、[docs/INVENTORY.md](docs/INVENTORY.md) に整理しています。

## ✨ 概要

このツールは、MDN 翻訳作業を効率化するための **ローカル開発ツール**です。

👉 翻訳作業そのものを支援・自動化することを目的としています

## 🎯 目的

- 翻訳開始（原文コピー）の自動化
- 原文との同期（sourceCommit）の管理
- glossary マクロの補助
- ガイドラインに基づくレビュー

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

1. **前提**: [Node.js](https://nodejs.org/) 18 以上（LTS 推奨）、[Cursor](https://cursor.com/)（MCP の **Streamable HTTP** または **stdio** に対応した版）。
2. **ビルド**: `mdn-translation-ja-mcp` で `npm install` のあと **`npm run build`** を実行する（`dist/index.js` / `dist/http.js` が生成されます）。
3. **（任意）環境変数**: 推奨の兄弟ディレクトリ構成なら **`env` は不要**です。`content` / `translated-content` を別の場所に置く場合は、stdio 利用時は [examples/cursor-mcp-with-env.json](examples/cursor-mcp-with-env.json) のとおり MCP 設定の `env` に `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` を**両方**書く（片方だけは不可。後述「パスの解決順」）。**Streamable HTTP で同じ変数を使う場合**は、`npm run start:http` を実行するシェルで export するか、プロセスマネージャ経由で渡してください。

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

`mdn/content` 配下のローカル翻訳環境で使われるポート（例: 5042 / 5043 / 8083）と重ならないよう **3050** を既定にしています。変更は環境変数 `PORT` で可能です。先に **`npm run start:http`** でサーバーを起動**してから** Cursor から接続します。

## ⚙️ Cursor 設定（mcp.json）

[examples/cursor-mcp-http.json](examples/cursor-mcp-http.json) と同じ内容です。Streamable HTTP では **`type` と `url` を指定**してください。

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

`url` のポートは `PORT` 環境変数（未設定時は `3050`）に合わせてください。

**設定ファイルの置き場所** — Cursor のエディションやバージョンにより異なる場合があります。次は一般的な例です。**最新のパス・形式は [Cursor のドキュメント](https://cursor.com/docs)（MCP）を確認**してください。

- **ユーザー全体（よくある例）**: `~/.cursor/mcp.json`（macOS / Linux のホーム直下の例）
- **プロジェクト単位**: ワークスペースの `.cursor/mcp.json` など

### stdio（代替）

Cursor がプロセス起動型のみの場合など、サンプルは [examples/cursor-mcp.json](examples/cursor-mcp.json) です。

- **`command` / `args`**: `node` と、本リポジトリの **`dist/index.js`（ビルド後）への絶対パス**。
- **`env`**: 推奨の兄弟構成のときは省略可能。別パスに置く場合は `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` を**セットで**指定（記述例は [examples/cursor-mcp-with-env.json](examples/cursor-mcp-with-env.json)）。

```json
{
  "mcpServers": {
    "mdn-translation-ja": {
      "command": "node",
      "args": ["/absolute/path/to/mdn-translation-ja-mcp/dist/index.js"]
    }
  }
}
```

## 🛠️ 提供 Tools（実装済み）

以下は `tools/list` に基づく実際の Tool 一覧です。

### 🔧 基盤系

#### translation_rules

翻訳ルール（ガイドライン）を取得します。

#### mdn_workspace_paths

ローカルの workspace パス情報を取得します。

#### mdn_resolve_page_paths

MDN URL から対応するファイルパスを解決します。

### 🚀 翻訳開始・同期

#### mdn_trans_start

翻訳を開始します。

- URL → slug 解決
- 原文コピー
- 翻訳ファイル生成
- front-matter 初期化

#### mdn_trans_commit_get

原文の最新 commit hash を取得します。

#### mdn_trans_source_commit_set

翻訳ファイルに `l10n.sourceCommit` を設定します。

### 🔤 glossary 関連

#### mdn_glossary_macro_scan

glossary マクロを検出します。

#### mdn_glossary_replacement_candidates

glossary の置換候補を生成します。

#### mdn_glossary_apply

glossary マクロを安全に置換します。

### 🔍 レビュー

#### review_translation

翻訳ファイルをレビューします。

主なチェック：

- front-matter
- 未翻訳箇所
- glossary 不整合
- 文体・表記ルール

## 📁 ディレクトリ構成（想定）

```text
src/
  server.ts

  tools/
  core/
  rules/

tests/
docs/
```

## 🧠 設計方針

### ローカルファースト

- 外部API非依存
- 高速・再現性あり

### MCPベース

- Cursor から直接操作
- HTTP MCP (`/mcp`) を利用

### ルールベースレビュー

- JSONルールで検出
- AIは補助用途（将来）

## ❌ やらないこと

- 自動翻訳
- 外部サービス化
- 外部API依存

## 🔐 ライセンス

MIT

## ⚠️ 注意

- MDN コンテンツは含まれません
- `content` / `translated-content` は別途 clone が必要です
- MDN のライセンスに従って利用してください

## 🚧 今後の予定

- diff ベースレビュー
- glossary 自動補完強化
- Agent による修正提案

## 🧠 一言

👉 MDN翻訳を「作業」から「コマンド」に変えるツール
