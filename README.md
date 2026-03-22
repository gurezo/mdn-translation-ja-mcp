# MDN Web Docs 日本語翻訳 MCP サーバー

[developer.mozilla.org](https://developer.mozilla.org/) 日本語翻訳作業を支援するための **ローカル MCP サーバー**（**stdio**）です。MDN の本文はリポジトリに含めず、手元で clone した [mdn/content](https://github.com/mdn/content) および [mdn/translated-content](https://github.com/mdn/translated-content) を参照する想定です。

## 破壊的変更（互換性なし）

以前の **HTTP / SSE（`http://localhost:3000`）** 実装は **廃止**しました。Cursor の設定は URL ベースではなく、**stdio で起動する MCP プロセス**として追加してください。過去バージョンのクライアント設定はそのままでは動作しません。詳細は [docs/INVENTORY.md](docs/INVENTORY.md) を参照してください。

## 初めての導入（README のみ）

次の手順だけで Cursor から利用できる状態にします。

1. **前提**: [Node.js](https://nodejs.org/) 18 以上（LTS 推奨）、[Cursor](https://cursor.com/)（MCP / stdio 対応）。
2. **リポジトリを揃える**: 同じ親ディレクトリに [mdn/content](https://github.com/mdn/content)、[mdn/translated-content](https://github.com/mdn/translated-content)、本リポジトリ（[gurezo/mdn-translation-ja-mcp](https://github.com/gurezo/mdn-translation-ja-mcp)）を **clone** する（推奨レイアウトは下記）。
3. **ビルド**: `mdn-translation-ja-mcp` で `npm install` のあと **`npm run build`** を実行する（`dist/index.js` が必須）。
4. **Cursor に MCP を登録**: プロジェクト用またはユーザー用の MCP 設定に、[examples/cursor-mcp.json](examples/cursor-mcp.json) を参考に `mcpServers` を追加する。`args` の **`dist/index.js` への絶対パス**を自分の環境に合わせて書き換える。
5. **（任意）環境変数**: 推奨の兄弟ディレクトリ構成なら [examples/cursor-mcp.json](examples/cursor-mcp.json) のとおり **`env` は不要**です。`content` / `translated-content` を別の場所に置く場合は、MCP 設定の `env` に `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` を**両方**書く（片方だけは不可。下記「パスの解決順」）。

Cursor の MCP 設定ファイルの場所や形式の詳細は、[Cursor のドキュメント](https://cursor.com/docs)（MCP の項）を参照してください。

## 推奨ディレクトリ構成（Wiki との整合）

親ディレクトリに次のように並べると、翻訳フローでパスを扱いやすくなります。

```text
.
├── content/                 # mdn/content の clone
├── translated-content/      # mdn/translated-content の clone
└── mdn-translation-ja-mcp/  # 本リポジトリ
```

### パスの解決順（MCP ツール `mdn_workspace_paths`）

1. **環境変数（任意）** — `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` を**両方**指定すると、その絶対パスをそのまま使います。片方だけの指定はできません（誤設定防止のためエラーになります）。
2. **兄弟ディレクトリ** — どちらの環境変数も未設定のとき、本リポジトリのルート（ビルド後は `dist/` の親）の**ひとつ上のディレクトリ**を親とみなし、そこにある `content` と `translated-content` を参照します。`cwd` には依存しません。

**リポジトリ実体** — 解決した `content` 相当のルートには `files/en-us` が、`translated-content` 相当のルートには `files/ja` がそれぞれディレクトリとして存在する必要があります（公式リポジトリを clone した状態）。名前だけの空フォルダではエラーになります。

### 用語集 JSON（ツール `mdn_glossary_replacement_candidates` / `mdn_glossary_apply`）

`{{glossary("term")}}` の第2引数（表示名）の置換候補は、[src/shared/data/glossary-terms.json](src/shared/data/glossary-terms.json) をビルド時に `dist/shared/data/` にコピーしたものを既定で参照します。

- **上書き** — 環境変数 `MDN_GLOSSARY_JSON_PATH` に別ファイルの絶対パスを指定するか、MCP ツール引数 `glossary_path` でパスを渡すと、その JSON を使います。
- **未登録のスラグ** — 用語集にキーが無いマクロは `status: "missing"` として返します（推測で第2引数は埋めません）。

## Cursor（`mcp.json`）の設定

サンプル全体は [examples/cursor-mcp.json](examples/cursor-mcp.json) にあります。最小の考え方は次のとおりです。

- **`command` / `args`**: `node` と、本リポジトリの **`dist/index.js`（ビルド後）への絶対パス**。
- **`env`**: 推奨の兄弟構成のときは省略可能。別パスに置く場合は `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` を**セットで**指定。

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

## Wiki のコマンド案と MCP ツール名の対応

[開発コンセプト（Wiki）](https://github.com/gurezo/mdn-translation-ja-mcp/wiki) にある `/mdn-trans-*` は **スラッシュコマンド案**です。現行の実装は **MCP ツール**として次の名前で登録されています（Cursor のエージェントがツールとして呼び出します）。

| Wiki でのイメージ                            | MCP ツール名                          | 主な用途                                    |
| -------------------------------------------- | ------------------------------------- | ------------------------------------------- |
| 翻訳開始（英語 `index.md` を `ja` にコピー） | `mdn_trans_start`                     | URL を指定して翻訳作業を開始                |
| 英語原文の最新コミット取得（`sourceCommit`） | `mdn_trans_commit_get`                | `l10n.sourceCommit` 用のハッシュ取得        |
| 既存 `ja` の `sourceCommit` 更新             | `mdn_trans_source_commit_set`         | 本文は変えず front-matter のみ更新          |
| URL からローカルパス解決                     | `mdn_resolve_page_paths`              | 英語・日本語 `index.md` のパスと有無（`sourceExists` / `translationExists`） |
| ワークスペースルート確認                     | `mdn_workspace_paths`                 | `content` / `translated-content` の絶対パス |
| `{{glossary}}` の走査                        | `mdn_glossary_macro_scan`             | マクロの列挙                                |
| 用語第2引数の候補                            | `mdn_glossary_replacement_candidates` | 用語集 JSON に基づく候補                    |
| 用語第2引数の適用                            | `mdn_glossary_apply`                  | 安全な置換のみファイルに反映                |
| ガイドライン・ローカルルール取得             | `translation_rules`                   | 表記・L10N リンク等の JSON                  |
| ルールベースレビュー                         | `review_translation`                  | findings（JSON）を返す                      |

## MCP ツールのエラー応答

本サーバーは **stdio** の MCP サーバーとして起動します（`npm run build` のあと `npm start` で `dist/index.js` を実行）。各ツールは **JSON テキスト**を本文として返します。

- **MCP プロトコル上のツール結果**は、ドメインのエラーであっても **通常は成功として返されます**（`content` に `type: "text"` の JSON 文字列が入る形）。**エラーかどうかは本文 JSON の `ok` で判定**してください。
- **`ok: true`** — 処理が成功した、または `dry_run` などで予定のみ返した場合。
- **`ok: false`** — 想定内の失敗（パス解決失敗、ファイル未存在、Git 取得失敗、用語集の読み込みエラーなど）。**`code`**（`ENV_PARTIAL`、`SIBLING_MISSING`、`FILE_CHANGED` など、ツールごとに定義）と **`message`**（人間向け説明）が付き、必要に応じて **`details`** に補足が入ります。
- **未捕捉の例外**は MCP 実装に委ねられ、クライアント側でツール呼び出しエラーとして扱われることがあります。

エージェントやスクリプトでは、**本文を `JSON.parse` したうえで `ok` を確認**してください。[開発コンセプト（Wiki）](https://github.com/gurezo/mdn-translation-ja-mcp/wiki/mdn%E2%80%90translation%E2%80%90ja%E2%80%90mcp-%E9%96%8B%E7%99%BA%E3%82%B3%E3%83%B3%E3%82%BB%E3%83%97%E3%83%88) の前提（3 リポジトリを同階層に置く等）を満たさないと、`ok: false` になりやすいです。

## Cursor での利用例（エージェント）

MCP を有効にしたうえで、**チャットで対象ページの MDN URL を伝え**、上表のツールをエージェントに実行させます。例（概念）:

- 「`https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API` を翻訳開始して」→ `mdn_trans_start`（必要なら `mdn_resolve_page_paths` でパス確認）。
- 「この URL の英語原文の最新コミットは？」→ `mdn_trans_commit_get`。
- 「`ja` の `index.md` の `sourceCommit` だけ英語に合わせて更新して」→ `mdn_trans_source_commit_set`。
- 「`{{glossary}}` の第2引数を用語集に合わせて」→ `mdn_glossary_replacement_candidates` で確認のうえ `mdn_glossary_apply`（`dry_run` で試すことも可）。
- 「翻訳ルールに沿ってレビューして」→ `translation_rules` で参照リンクを確認しつつ `review_translation`。

人手レビュー時は Wiki にある [表記ガイドライン](https://github.com/mozilla-japan/translation/wiki/Editorial-Guideline) などへのリンクは `translation_rules` の結果にも含まれます。

## トラブルシュート

| 症状                                              | 確認すること                                                                                                         |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| MCP が起動しない / `Cannot find module`           | `npm run build` 済みか、`args` のパスが **`dist/index.js` の絶対パス**か。                                           |
| `dist/index.js` が無い                            | リポジトリルートで `npm install` と `npm run build`。                                                                |
| `mdn_workspace_paths` が失敗する（`ENV_PARTIAL`） | `MDN_CONTENT_ROOT` と `MDN_TRANSLATED_CONTENT_ROOT` は**両方**セットするか、**両方**未設定にする。                   |
| `SIBLING_MISSING` などパスが見つからない          | 親ディレクトリに `content` と `translated-content` があるか。または上記環境変数で正しい絶対パスを指定。              |
| `mdn_trans_commit_get` が git 関連で失敗する      | `content` が **git clone** された [mdn/content](https://github.com/mdn/content) か、対象ファイルが追跡されているか。 |
| Node のバージョンエラー                           | `package.json` の `engines` は `node >= 18`。                                                                        |

## ライセンスと第三者表記

- 本リポジトリのソースコード: [MIT License](LICENSE)
- MDN 本文・翻訳データ・外部サイトの扱い: [THIRD_PARTY.md](THIRD_PARTY.md)

## 開発メモ

- Issue #35 と Wiki の開発コンセプトを整理した実装プラン（日本語）: [docs/plan-issue-35-ja.md](docs/plan-issue-35-ja.md)
- Issue #38（URL → slug → ローカルパス）の整理: [docs/plan-issue-38-ja.md](docs/plan-issue-38-ja.md)
- Issue #47（ルールベースレビュー v1 / `review_translation`）の整理: [docs/plan-issue-47-ja.md](docs/plan-issue-47-ja.md)
- Issue #36（MCP サーバー基盤・stdio）の完了条件は、上記「初めての導入」および「MCP ツールのエラー応答」で説明したとおり、`npm run build` 後の `npm start` でプロセスが起動し、Cursor から各ツールを呼び出せることです。
- 品質チェック: `npm run lint` / `npm run typecheck` / `npm run format:check` / `npm test`
- 旧 HTTP API（`/api/rules`、`/api/validate`、`/api/events`）は削除済みです。同等の機能は今後、MCP の tools / resources として追加する予定です。
- 開発コンセプト（将来のコマンド案、[mdn/mcp](https://github.com/mdn/mcp) の調査メモなど）は [Wiki](https://github.com/gurezo/mdn-translation-ja-mcp/wiki) を参照してください。
