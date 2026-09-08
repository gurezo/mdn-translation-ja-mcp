---
title: Client Verification
---

# Cursor 以外の MCP クライアント検証

親 Issue: [#103](https://github.com/gurezo/mdn-translation-ja-mcp/issues/103)
本 Issue: [#110](https://github.com/gurezo/mdn-translation-ja-mcp/issues/110)

入力: [#105](https://github.com/gurezo/mdn-translation-ja-mcp/issues/105) の [mcp-native.md](./mcp-native.md)。同じ `createMcpServer()` が Tools / Resources / Prompts を出すことを、Cursor 以外のクライアントで確認する。

## 検証日と環境

| 項目           | 値                                                                   |
| -------------- | -------------------------------------------------------------------- |
| 日付           | 2026-09-02                                                           |
| 主クライアント | MCP Inspector CLI / GUI（`@modelcontextprotocol/inspector@2.3.0`）   |
| Node           | v24.16.0（サーバーの `engines` は `>=24 <25`）                       |
| プロトコル     | `2025-11-25`                                                         |
| サーバー       | `mdn-translation-ja-mcp` `1.0.0`（`dist/index.js` / `dist/http.js`） |

CI では同じ stdio 入口を公式 SDK `Client` + `StdioClientTransport` で固定する（[`src/index.stdio.test.ts`](../src/index.stdio.test.ts)）。Inspector 自体は npx 依存のため CI には載せない。

## 完了条件

| 完了条件                                           | 結果                                                         |
| -------------------------------------------------- | ------------------------------------------------------------ |
| Cursor 以外のクライアントで MCP 接続できる         | MCP Inspector（stdio / Streamable HTTP）で `initialize` 成功 |
| Tools を利用できる                                 | 4 件を列挙し、一時ワークスペースで 4 Tools を順に呼び出し    |
| Resources を利用できる                             | 7 URI を列挙し、`mdn://guidelines/editorial` を取得          |
| Prompts を利用できる                               | 3 件を列挙し、`mdn_translate` を取得                         |
| `.cursor` ディレクトリなしで基本フローを確認できる | 一時ディレクトリに `.cursor` を置かず、フロー完了後も未作成  |
| 検証結果がドキュメント化されている                 | 本文書                                                       |

Claude Code / VS Code は設定例のみ（未実機）。README / GitHub Pages の全面更新は [#111](https://github.com/gurezo/mdn-translation-ja-mcp/issues/111)。

## 再現手順（stdio）

書き込み Tool は一時ディレクトリに対してだけ実行する。手元の `translated-content` は使わない。

```bash
npm run build

# GUI（本リポジトリの cwd。環境変数は Inspector の -e で渡す）
npm run inspect

# CLI（target は --cli の直後。dist は絶対パス）
npx --yes @modelcontextprotocol/inspector --cli node /absolute/path/to/dist/index.js \
  -e MDN_CONTENT_ROOT=/tmp/verify/content \
  -e MDN_TRANSLATED_CONTENT_ROOT=/tmp/verify/translated-content \
  --cwd /tmp/verify \
  --method tools/list
```

一時ワークスペースの最小構成:

- `content/` を git リポジトリにし、サンプル `files/en-us/.../index.md` を 1 コミットする（`mdn_trans_commit_get` 用）
- `translated-content/` は空でよい
- `.cursor` は作らない

## Inspector CLI で確認したコマンドと要約

すべて `--format json`。結果は `result` オブジェクト。

### 接続（`initialize`）

```bash
npx --yes @modelcontextprotocol/inspector --cli node dist/index.js --method initialize
```

- `serverInfo.name`: `mdn-translation-ja-mcp`
- capabilities: `tools` / `resources` / `prompts`（いずれも `listChanged: true`）
- `instructions` は Prompt 名へ誘導し、`.cursor` パスを含まない

### Tools

```bash
--method tools/list
--method tools/call --tool-name mdn_trans_start --tool-arg url=https://developer.mozilla.org/en-US/docs/Glossary/E2E_inspector
--method tools/call --tool-name mdn_trans_commit_get --tool-arg url=https://developer.mozilla.org/en-US/docs/Glossary/E2E_inspector
--method tools/call --tool-name mdn_trans_replace_glossary --tool-arg jaFile=files/ja/glossary/e2e_inspector/index.md
--method tools/call --tool-name mdn_trans_review --tool-arg jaFile=files/ja/glossary/e2e_inspector/index.md
```

列挙: `mdn_trans_start` / `mdn_trans_commit_get` / `mdn_trans_replace_glossary` / `mdn_trans_review`

呼び出し結果（structuredContent）:

| Tool                         | 結果                                                  |
| ---------------------------- | ----------------------------------------------------- |
| `mdn_trans_start`            | `destRel`: `files/ja/glossary/e2e_inspector/index.md` |
| `mdn_trans_commit_get`       | 40 桁の `sourceCommit`                                |
| `mdn_trans_replace_glossary` | `replaced: 1`                                         |
| `mdn_trans_review`           | `readsFileOnly: true`、対象ファイル未変更             |

### Resources

```bash
--method resources/list
--method resources/read --uri mdn://guidelines/editorial
```

列挙（7 URI）:

- `mdn://guidelines/editorial`
- `mdn://guidelines/l10n`
- `mdn://guidelines/japanese-style`
- `mdn://glossary`
- `mdn://data/glossary-terms`
- `mdn://data/review-rules`
- `mdn://data/prohibited-expressions`

`mdn://guidelines/editorial` は `text/markdown` で本文を取得できた。

### Prompts

```bash
--method prompts/list
--method prompts/get --prompt-name mdn_translate \
  --prompt-args url=https://developer.mozilla.org/en-US/docs/Glossary/E2E_inspector
```

列挙: `mdn_translate` / `mdn_sync` / `mdn_review`

`mdn_translate` の本文に対象 URL と `mdn_trans_start` が含まれ、`.cursor` パスは含まれない。

## Streamable HTTP スモーク

```bash
PORT=13050 npm run start:http
npx --yes @modelcontextprotocol/inspector --cli http://127.0.0.1:13050/mcp \
  --transport http --method initialize
npx --yes @modelcontextprotocol/inspector --cli http://127.0.0.1:13050/mcp \
  --transport http --method tools/list
```

`initialize` と `tools/list`（同じ 4 Tools）に成功した。stdio と同じ `createMcpServer()` である。

## `.cursor` なし

検証用一時ディレクトリの親・`translated-content` のいずれにも `.cursor` を置かず、フロー完了後も作成されなかった。接続に必要なのはサーバー登録（Inspector では CLI の target / `-e`）だけである。

## 他クライアントの設定例（未実機）

形式はクライアント固有。サーバー側の契約は同じ（`node dist/index.js` + 環境変数）。JSON の正本は [examples/mcp/README.md](../examples/mcp/README.md) です。

- Claude Code: [examples/mcp/claude-code.mcp.json](../examples/mcp/claude-code.mcp.json)（プロジェクトの `.mcp.json`）
- VS Code: [examples/mcp/vscode.mcp.json](../examples/mcp/vscode.mcp.json)（`.vscode/mcp.json`）

## Issue #110 の完了対応

| 完了条件                                           | 対応                                           |
| -------------------------------------------------- | ---------------------------------------------- |
| Cursor 以外のクライアントで MCP 接続できる         | 本ファイル「接続」「Streamable HTTP スモーク」 |
| Tools を利用できる                                 | 「Tools」                                      |
| Resources を利用できる                             | 「Resources」                                  |
| Prompts を利用できる                               | 「Prompts」                                    |
| `.cursor` ディレクトリなしで基本フローを確認できる | 「`.cursor` なし」                             |
| 検証結果がドキュメント化されている                 | 本文書                                         |
