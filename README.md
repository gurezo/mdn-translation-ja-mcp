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
