# Issue #35・Wiki 開発コンセプトに基づく実装プラン（日本語）

本書は [Issue #35: 完全移行設計（HTTP/SSE → ローカル MCP）とアーキテクチャ再定義](https://github.com/gurezo/mdn-translation-ja-mcp/issues/35) および [Wiki: mdn-translation-ja-mcp 開発コンセプト](https://github.com/gurezo/mdn-translation-ja-mcp/wiki/mdn%E2%80%90translation%E2%80%90ja%E2%80%90mcp-%E9%96%8B%E7%99%BA%E3%82%B3%E3%83%B3%E3%82%BB%E3%83%97%E3%83%88) の内容を整理し、**目的・廃止/継承・新アーキテクチャ・完了条件**と、**現行リポジトリとの対応**を一文書にまとめたものです。

---

## 1. 背景と目的（Issue #35 + Wiki の共通項）

| 観点 | 内容 |
| --- | --- |
| **プロダクトの目的** | [developer.mozilla.org/ja](https://developer.mozilla.org/ja/) 向け翻訳作業の **アシスト**（Wiki）。 |
| **利用形態** | **Cursor** を前提とし、**ローカルで MCP サーバーを起動**して利用する（Wiki）。 |
| **データの置き場所** | MDN 本文はリポジトリに含めず、手元の **mdn/content** と **mdn/translated-content** を参照する（README と整合）。 |
| **移行の方向性（Issue #35）** | 旧来の **HTTP/SSE** ベースを廃止し、**stdio のローカル MCP** に **完全移行**する。 |

---

## 2. 廃止対象（Issue #35）

以下は Issue 上で「完全に廃止」とされているものです。

- HTTP API（`/api/*`）
- SSE（`/api/events`）
- 外部サービス前提の構成
- `server.js` ベース設計
- rules を API で配信する設計

**現行リポジトリ**: 上記は README の「破壊的変更」および `docs/INVENTORY.md` の方針どおり **HTTP/SSE は廃止済み**です。MCP は **stdio**（`node` + `dist/index.js`）で提供されます。

---

## 3. 継承する概念（実装は作り直し／ローカル化）

Issue #35 で「思想のみ継承」とされているもの:

- **validation** → **review** にリネーム（ルールベースのレビュー）
- **rules** → **ローカル JSON**（`rules/*.json` 等）
- **glossary 補助**（用語マクロ・置換候補）

Wiki の **アシスト機能**（`/mdn-trans-*` 案）とも対応します。

---

## 4. 新アーキテクチャ（Issue #35 の意図）

Issue に掲げられたスタック:

```text
Cursor
  ↓
MCP Server（local / stdio）
  ↓
core（ロジック）
  ↓
FS + Git + rules(JSON)
```

**現行の対応**: `src/index.ts` が MCP サーバー（`McpServer` + `StdioServerTransport`）のエントリです。Issue 草案の `server.ts` という名前ではなく **`index.ts` がその役割**を担っています。

---

## 5. ディレクトリ構成（Issue 草案と現行）

### Issue #35 に記載の案（参考）

```text
mdn-translation-ja-mcp/
  src/
    server.ts
    tools/ ...
    core/ ...
    rules/ ...
```

### 現行リポジトリ（要点）

- **エントリ**: `src/index.ts`（MCP 登録）
- **機能別モジュール**: `src/start/`、`src/commit-get/`、`src/replace-glossary/`、`src/review/`、`src/shared/`
- **ルール JSON**: リポジトリ直下の `rules/`（ビルドで `dist/rules/` に同梱）
- **用語データ**: `src/shared/data/glossary-terms.json` 等

Issue の「`tools/` と `core/` に厳密分割」までは一致しないが、**責務の分離（start / commit-get / glossary / review / shared）は実装済み**です。

---

## 6. MCP ツールと Wiki コマンド案の対応

Issue #35 の表（4 コマンド）と Wiki のスラッシュ案、および **README に記載の現行ツール名**の対応は次のとおりです。

| Issue 草案（コマンド） | Wiki イメージ | 現行 MCP ツール（代表） |
| --- | --- | --- |
| start | `/mdn-trans-start` | `mdn_trans_start`、`mdn_resolve_page_paths` 等 |
| commit-get | `/mdn-trans-commit-get` | `mdn_trans_commit_get`、`mdn_trans_source_commit_set` |
| replace-glossary | `/mdn-trans-replace-glossary` | `mdn_glossary_macro_scan`、`mdn_glossary_replacement_candidates`、`mdn_glossary_apply` |
| review | `/mdn-trans-review` | `translation_rules`、`review_translation` |

補助: `mdn_workspace_paths` でワークスペース解決。

---

## 7. 旧 → 新 対応表（Issue #35）

| 旧 | 新 |
| --- | --- |
| `/api/validate` | `review_translation`（ルールベースレビュー） |
| `/api/rules` | `translation_rules` + `rules/*.json` |
| `server.js` | `src/index.ts` + ビルド成果物 `dist/index.js` |
| SSE events | 廃止 |
| HTTP request | MCP ツール呼び出し |

---

## 8. Issue #35 の完了条件（チェックリスト）

Issue に記載の完了条件:

- [ ] MCP サーバーとして起動できる → **stdio で起動可能**（`npm run build` 後、`node dist/index.js`）
- [ ] 上記 4 コマンドが呼び出せる → **相当する MCP ツールが登録済み**（上表）
- [ ] HTTP/SSE 実装が削除されている → **README・在庫ドキュメントの方針どおり削除済み**

残タスクは、Issue 側でチェックボックスを **実際のリリースタグ/ブランチで検証したうえでクローズ**する運用がよいです。

---

## 9. Wiki「開発コンセプト」の前提条件（運用プラン）

Wiki にある前提を **そのまま運用ルール**として固定します。

1. **3 リポジトリ**を fork または clone: [mdn/content](https://github.com/mdn/content)、[mdn/translated-content](https://github.com/mdn/translated-content)、[mdn-translation-ja-mcp](https://github.com/gurezo/mdn-translation-ja-mcp)。
2. **同一親ディレクトリ**に `content`、`translated-content`、`mdn-translation-ja-mcp` を並べる（README の推奨構成）。
3. **Cursor** の `mcp.json` で本 MCP を **stdio** として登録（[examples/cursor-mcp.json](../examples/cursor-mcp.json) を参照）。

### Wiki の「レビュー」前提

`review_translation` を人間・エージェントが使うときの参照先（表記・L10N・用語集・文体）は Wiki に列挙のリンクを **`translation_rules` の結果**とも併用する。

### 考慮事項・保留事項（Wiki）

- **[mdn/mcp](https://github.com/mdn/mcp)** の調査は継続可能（公式 MCP との棲み分け・再利用）。
- ガイドラインを **Agent SKILL 化するか**は **保留**（Wiki）。必要になったら Cursor の SKILL と `rules/` の役割分担を別 Issue で決める。

---

## 10. 「導入しやすくする」観点（README 完結）

次を **README のみ**で完結させることがゴールです（別チケットでの整理案と整合）。

| 項目 | 現状 |
| --- | --- |
| `mcp.json` サンプル | [examples/cursor-mcp.json](../examples/cursor-mcp.json) と README 内の JSON 断片 |
| セットアップ手順 | README「初めての導入（README のみ）」 |
| コマンド例 | README「Cursor での利用例」＋ Wiki 対応表 |
| トラブルシュート | README「トラブルシュート」表 |

本ファイルは **アーキテクチャと Issue/Wiki の対応**用であり、日々の導入手順は **README を正**とします。

---

## 11. 参照リンク

- Issue #35: <https://github.com/gurezo/mdn-translation-ja-mcp/issues/35>
- Wiki: <https://github.com/gurezo/mdn-translation-ja-mcp/wiki/mdn%E2%80%90translation%E2%80%90ja%E2%80%90mcp-%E9%96%8B%E7%99%BA%E3%82%B3%E3%83%B3%E3%82%BB%E3%83%97%E3%83%88>
- リポジトリ README: [../README.md](../README.md)
