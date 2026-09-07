# Cursor optional integration

MCP クライアントはサーバーを登録するだけで、Tools / Resources / Prompts による標準翻訳フローを実行できます。このディレクトリは **Cursor 専用の補助**です。必須ではありません。

正本の手順は MCP Prompt（`mdn_translate` / `mdn_sync` / `mdn_review`）と Resources（`mdn://guidelines/*`）です。ここに置く Rule / Skill はそれを置き換えません。

## 最低限（必須）

Cursor で使う場合に必要なのは MCP 接続設定だけです。接続 JSON の正本は [examples/cursor/mcp.example.json](../../examples/cursor/mcp.example.json) です。

- 手動: 上記 JSON を `translated-content/.cursor/mcp.json` にコピーし、絶対パスを書き換える
- 一括: `mdn-translation-ja-mcp` で `npm run setup:translated-content-cursor`（`mcp.json` のみ生成）

`translated-content/.cursor/` は手元のローカル設定です。翻訳 PR に含めないでください。

## 任意で足すもの

| 資産 | 入れると良くなること |
| --- | --- |
| [rules/01-mdn-mcp-tools.mdc](./rules/01-mdn-mcp-tools.mdc) | Cursor エージェントが `mdn_trans_*` をシェルコマンドと誤認しにくくなる |
| `.cursor/skills/mdn-translation-workflow` | Cursor の Skill ピッカーから `mdn_translate` 相当の手順を開ける |
| `.agents/skills/harvest-review-findings` | 閉じた JA PR のレビュー指摘を集め、ガイドライン Skills を更新する |

どちらも Prompts / Resources の代替ではありません。Cursor のエージェント UX を足したいときだけ導入します。

### 薄い Rule を入れる

```bash
cd mdn-translation-ja-mcp
npm run setup:translated-content-cursor -- --with-rules
# または
cp integrations/cursor/rules/01-mdn-mcp-tools.mdc ../translated-content/.cursor/rules/
```

### workflow Skill を入れる

```bash
# mdn-translation-ja-mcp と translated-content が兄弟ディレクトリの場合
ln -s ../mdn-translation-ja-mcp/.cursor/skills translated-content/.cursor/skills
```

Skills は setup スクリプトではコピーしません。
