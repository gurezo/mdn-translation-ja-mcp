# portal 向け静的ドキュメント成果物の供給

親 Issue: [#127](https://github.com/gurezo/mdn-translation-ja-mcp/issues/127)
本 Issue: [#129](https://github.com/gurezo/mdn-translation-ja-mcp/issues/129)

前提は [#128](https://github.com/gurezo/mdn-translation-ja-mcp/issues/128) の [docs-subpath-audit.md](docs-subpath-audit.md)。公開主体は [gurezo/portal](https://github.com/gurezo/portal)。配置と Firebase デプロイの実装は [#130](https://github.com/gurezo/mdn-translation-ja-mcp/issues/130) と [gurezo/portal#48](https://github.com/gurezo/portal/issues/48)。

本文書は TypeDoc の `projectDocuments` に含めない。利用者向けの Pages には載せない。

## 生成

ランタイムは Node.js 24 以上（`package.json` の `engines.node`）。ドキュメント生成はアプリの `npm run build` と独立している。`dist/` は不要である。

リポジトリルートで次を実行する。

```bash
npm ci
npm run docs:build
npm run docs:verify
```

`docs:build` は `docs/` を削除したあと `typedoc --options typedoc.json` を実行する。出力先は `docs/`。`docs:verify` は次が欠けていれば終了コード 1 で止まる。

| パス | 条件 |
| --- | --- |
| `docs/index.html` | 空でないファイル |
| `docs/assets/style.css` | 空でないファイル |
| `docs/assets/main.js` | 空でないファイル |
| `docs/assets/search.js` | 空でないファイル |
| `docs/assets/navigation.js` | 空でないファイル |
| `docs/assets/icons.svg` | 空でないファイル |
| `docs/documents/` | `.html` が 1 件以上 |
| `docs/functions/` | `.html` が 1 件以上 |

CI の `docs` ジョブは、`test` ジョブの `npm run build` を待たずに同じコマンドを実行する。GitHub Actions artifact と Release asset は作らない。

## 渡すファイル

渡すものは `npm run docs:build` が書いた `docs/` ディレクトリ全体である。`dist/`、`src/`、`site/` は別に含めない。`site/` と `projectDocuments` の Markdown は、生成時に `docs/documents/` と `docs/index.html` へ入る。

サブパス配信でディレクトリをフラットにしないこと、トップ URL の末尾スラッシュ、`.nojekyll` の扱いは [docs-subpath-audit.md](docs-subpath-audit.md) に記録している。

## バージョンの固定

参照元はブランチ名ではなく、40 文字のコミット SHA で固定する。portal はその SHA を checkout してから生成する。同じ SHA で生成すると、HTML の `Defined in` に入る GitHub blob URL がその SHA を指す。

## portal での利用

portal は Angular ビルドで `firebase-public` を作り直したあと、Firebase デプロイの前に、固定した SHA で次を行う。

1. その SHA を checkout する。
2. `npm ci` と `npm run docs:build` を実行する。
3. `docs/` をディレクトリのまま `firebase-public/mdn-translation-ja-mcp/` へ置く。

このリポジトリから Firebase Hosting へ直接デプロイしない。取り込みスクリプトとプレビュー確認の実装先は portal である。
