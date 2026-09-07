---
title: Getting Started
---

# Getting Started

最小構成は **MCP サーバーをクライアントに登録する** ことです。Cursor Rules / Skills のコピーは不要です。

## 前提

同じ親ディレクトリに次を並べます（ディレクトリ名は任意ですが、この名前だと兄弟ディレクトリ解決と一致します）。

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

上流は [mdn/content](https://github.com/mdn/content) と [mdn/translated-content](https://github.com/mdn/translated-content) です。自分のアカウントへ fork してから clone してください。

ランタイムは [Node.js](https://nodejs.org/) 22 以上（LTS 推奨）です。MCP クライアントは stdio または Streamable HTTP に対応していればどれでも構いません。

## サーバーのビルド

```bash
cd mdn-translation-ja-mcp
npm install
npm run build
```

`dist/index.js`（stdio）と `dist/http.js`（Streamable HTTP）が生成されます。チャットのエージェントのために `npm start` を手動で走らせる必要はありません。クライアントが MCP 設定経由で起動します。`npm start` / `npm run start:http` は単体確認用です。

## サーバー登録

どのクライアントでも次を渡します。パスは絶対パスに置き換えてください。

- `command`: `node`
- `args`: `/absolute/path/to/mdn-translation-ja-mcp/dist/index.js`
- `env.MDN_CONTENT_ROOT`: content のルート
- `env.MDN_TRANSLATED_CONTENT_ROOT`: translated-content のルート

設定ファイルの例:

- [examples/mcp/claude-code.mcp.json](../examples/mcp/claude-code.mcp.json)
- [examples/mcp/vscode.mcp.json](../examples/mcp/vscode.mcp.json)
- [examples/cursor/mcp.example.json](../examples/cursor/mcp.example.json)

クライアント固有の置き場と Inspector の手順は [Client Integration](./client-integration.md) を参照してください。レビュー指摘の収集は [Agent Skills](./agent-skills.md) です。

## 最初の翻訳

登録後、Prompt **`mdn_translate`** に対象の MDN URL を渡すのが標準手順です。個別に Tool を呼んでも同じです。詳細は [Translation Workflow](./translation-workflow.md) です。
