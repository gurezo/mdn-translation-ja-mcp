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

### パスの解決順（MCP ツール `mdn_workspace_paths`）

1. **環境変数（任意）** — `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` を**両方**指定すると、その絶対パスをそのまま使います。片方だけの指定はできません（誤設定防止のためエラーになります）。
2. **兄弟ディレクトリ** — どちらの環境変数も未設定のとき、本リポジトリのルート（ビルド後は `dist/` の親）の**ひとつ上のディレクトリ**を親とみなし、そこにある `content` と `translated-content` を参照します。`cwd` には依存しません。

### 用語集 JSON（ツール `mdn_glossary_replacement_candidates`）

`{{glossary("term")}}` の第2引数（表示名）の置換候補は、[src/data/glossary-terms.json](src/data/glossary-terms.json) をビルド時に `dist/data/` にコピーしたものを既定で参照します。

- **上書き** — 環境変数 `MDN_GLOSSARY_JSON_PATH` に別ファイルの絶対パスを指定するか、MCP ツール引数 `glossary_path` でパスを渡すと、その JSON を使います。
- **未登録のスラグ** — 用語集にキーが無いマクロは `status: "missing"` として返します（推測で第2引数は埋めません）。

## 前提条件

- [Node.js](https://nodejs.org/)（LTS 推奨）
- [Cursor](https://cursor.com/) など、MCP（stdio）に対応したクライアント

## セットアップ

```bash
cd mdn-translation-ja-mcp
npm install
npm run build
```

ソースは TypeScript（`src/`）で、`npm run build` で `dist/` に JavaScript が出力されます。MCP を起動する前にビルドしてください。

## Cursor（`mcp.json`）の例

プロジェクトまたはユーザーの MCP 設定に、次のように **コマンドでサーバーを起動**する定義を追加します（パスは環境に合わせて変更してください）。

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

`args` には、本リポジトリを clone した場所の **`dist/index.js`（ビルド後）** への **絶対パス**を指定してください。

## ライセンスと第三者表記

- 本リポジトリのソースコード: [MIT License](LICENSE)
- MDN 本文・翻訳データ・外部サイトの扱い: [THIRD_PARTY.md](THIRD_PARTY.md)

## 開発メモ

- 品質チェック: `npm run lint` / `npm run typecheck` / `npm run format:check` / `npm test`
- MCP ツール: `translation_rules`（ガイドラインリンク）、`mdn_workspace_paths`（上記の content / translated-content パス解決）、`mdn_glossary_replacement_candidates`（用語集 JSON に基づく `{{glossary}}` 第2引数の候補一覧）
- 旧 HTTP API（`/api/rules`、`/api/validate`、`/api/events`）は削除済みです。同等の機能は今後、MCP の tools / resources として追加する予定です。
- 開発コンセプト（将来のコマンド案など）は [Wiki](https://github.com/gurezo/mdn-translation-ja-mcp/wiki) を参照してください。
