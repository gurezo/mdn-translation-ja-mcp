# MDN Web Docs 日本語翻訳 MCP サーバー

[developer.mozilla.org](https://developer.mozilla.org/) 日本語翻訳作業を支援するための **ローカル MCP サーバー**（**stdio**）です。MDN の本文はリポジトリに含めず、手元で clone した [mdn/content](https://github.com/mdn/content) および [mdn/translated-content](https://github.com/mdn/translated-content) を参照する想定です。

## 破壊的変更（互換性なし）

以前の **HTTP / SSE（`http://localhost:3000`）** 実装は **廃止**しました。Cursor の設定は URL ベースではなく、**stdio で起動する MCP プロセス**として追加してください。過去バージョンのクライアント設定はそのままでは動作しません。詳細は [docs/INVENTORY.md](docs/INVENTORY.md) を参照してください。

## 推奨ディレクトリ構成（Wiki との整合）

親ディレクトリに次のように並べると、翻訳フローでパスを扱いやすくなります。

```text
.
├── content/              # mdn/content の clone
├── translated-content/   # mdn/translated-content の clone
└── mdn-translation-ja-mcp/  # 本リポジトリ
```

## 前提条件

- [Node.js](https://nodejs.org/)（LTS 推奨）
- [Cursor](https://cursor.com/) など、MCP（stdio）に対応したクライアント

## セットアップ

```bash
cd mdn-translation-ja-mcp
npm install
```

## Cursor（`mcp.json`）の例

プロジェクトまたはユーザーの MCP 設定に、次のように **コマンドでサーバーを起動**する定義を追加します（パスは環境に合わせて変更してください）。

```json
{
  "mcpServers": {
    "mdn-translation-ja": {
      "command": "node",
      "args": ["/absolute/path/to/mdn-translation-ja-mcp/src/index.js"]
    }
  }
}
```

`args` には、本リポジトリを clone した場所の `src/index.js` への **絶対パス**を指定してください。

## ライセンスと第三者表記

- 本リポジトリのソースコード: [MIT License](LICENSE)
- MDN 本文・翻訳データ・外部サイトの扱い: [THIRD_PARTY.md](THIRD_PARTY.md)

## 開発メモ

- 旧 HTTP API（`/api/rules`、`/api/validate`、`/api/events`）は削除済みです。同等の機能は今後、MCP の tools / resources として追加する予定です。
- 開発コンセプト（将来のコマンド案など）は [Wiki](https://github.com/gurezo/mdn-translation-ja-mcp/wiki) を参照してください。
