# 生成ドキュメントとサブパス公開の調査

親 Issue: [#127](https://github.com/gurezo/mdn-translation-ja-mcp/issues/127)
本 Issue: [#128](https://github.com/gurezo/mdn-translation-ja-mcp/issues/128)

移行先は `https://gurezo.net/mdn-translation-ja-mcp/`。Firebase Hosting の公開主体は [gurezo/portal](https://github.com/gurezo/portal) である。本文書は、移す前の生成物と公開パスを記録する。

本文書は TypeDoc の `projectDocuments` に含めない。利用者向けの Pages には載せない。

## スコープ

含める:

- `docs:build`、`typedoc.json`、`site/`、`docs/` の棚卸し
- 現行 GitHub Pages の公開元
- クリーンビルドと、`/mdn-translation-ja-mcp/` 配下でのパス確認
- サブパス公開に必要な変更と不要な変更
- `portal` へ渡すファイル一式

含めない:

- 成果物の供給方式と CI（[#129](https://github.com/gurezo/mdn-translation-ja-mcp/issues/129)）
- portal 側の取り込みとデプロイ（[#130](https://github.com/gurezo/mdn-translation-ja-mcp/issues/130)）
- 公開 URL と文書内リンクの更新（[#131](https://github.com/gurezo/mdn-translation-ja-mcp/issues/131)）
- 旧 GitHub Pages の整理（[#132](https://github.com/gurezo/mdn-translation-ja-mcp/issues/132)）
- MCP サーバー本体の変更
- `docs/` の再生成コミット

## 生成

ランタイムは Node.js 24 以上（`package.json` の `engines.node`）。ドキュメント生成はアプリの `npm run build` とは独立している。`dist/` は不要である。

| スクリプト | 内容 |
| --- | --- |
| `docs:clean` | `rm -rf docs` |
| `docs:build` | `docs:clean` のあと `typedoc --options typedoc.json` |
| `docs:publish` | `docs:build` と同じ。ローカルで `docs/` を更新する別名であり、リモートへは送らない |

`typedoc.json` の要点:

| 項目 | 値 |
| --- | --- |
| `entryPoints` | `src`（`entryPointStrategy: expand`） |
| `exclude` | `**/*.test.ts` |
| `tsconfig` | `tsconfig.json` |
| `out` | `docs` |
| `excludePrivate` / `excludeProtected` / `excludeInternal` | すべて `true` |
| `hostedBaseUrl` | 未設定 |
| `githubPages` | 未設定（TypeDoc の既定で `.nojekyll` を出す） |

`projectDocuments` は次の 12 本。利用者向けが `site/`、設計メモが `architecture/` である。

- `site/architecture.md`
- `site/getting-started.md`
- `site/mcp-tools.md`
- `site/mcp-resources.md`
- `site/mcp-prompts.md`
- `site/translation-workflow.md`
- `site/client-integration.md`
- `site/agent-skills.md`
- `architecture/mcp-native.md`
- `architecture/tools.md`
- `architecture/client-verification.md`
- `architecture/responsibility-inventory.md`

README の「API ドキュメント（TypeDoc）」は、上記 3 スクリプトの実行例だけを案内している。公開 URL は書いていない。

## GitHub Pages の公開元

2026-10-11 時点の Pages API（`repos/gurezo/mdn-translation-ja-mcp/pages`）:

| 項目 | 値 |
| --- | --- |
| `html_url` | `https://gurezo.github.io/mdn-translation-ja-mcp/` |
| `build_type` | `legacy` |
| `source.branch` | `main` |
| `source.path` | `/docs` |
| `cname` | なし |
| `https_enforced` | `true` |
| `status` | `built` |

リポジトリに `CNAME` は無い。カスタムドメインは未設定である。公開 URL はすでに `/mdn-translation-ja-mcp/` サブパスである。移行先 `https://gurezo.net/mdn-translation-ja-mcp/` とパスの形は同じである。

Pages 用の GitHub Actions は無い。`.github/workflows/ci.yml` は `main` への push と pull request で `npm ci`、lint、typecheck、`npm run build`、`npm test` を実行する。`docs:build` は走らない。

`devDependencies` に `gh-pages` がある。スクリプトからも workflow からも呼んでいない。`gh-pages` ブランチへの publish は現行の公開経路ではない。

`docs/.nojekyll` は TypeDoc が置く。中身は、GitHub Pages が Jekyll で処理しないための印である。Firebase Hosting では不要だが、ファイルがあっても配信の妨げにはならない。`githubPages: false` にすると再生成時に消える。

## コミット済み生成物

`docs/` は git 管理で、135 ファイルある。`docs:clean` がディレクトリを消すため、本棚卸し以外の手書き文書は置かない。

| パス | ファイル数 | 役割 |
| --- | --- | --- |
| `docs/index.html` | 1 | トップ。README 由来 |
| `docs/modules.html` | 1 | モジュール一覧 |
| `docs/hierarchy.html` | 1 | 継承階層 |
| `docs/.nojekyll` | 1 | Jekyll 無効化 |
| `docs/assets/` | 8 | CSS、JS、`icons.svg` |
| `docs/documents/` | 12 | `projectDocuments` の HTML |
| `docs/functions/` | 41 | 関数ページ |
| `docs/modules/` | 32 | モジュールページ |
| `docs/types/` | 20 | 型ページ |
| `docs/variables/` | 8 | 変数ページ |
| `docs/media/` | 10 | 参照されたリポジトリファイルのコピー |

`docs/assets/` は `style.css`、`highlight.css`、`main.js`、`icons.js`、`icons.svg`、`search.js`、`navigation.js`、`hierarchy.js`。画像ファイルは `icons.svg` だけである。

`docs/media/` は Markdown、JSON、LICENSE、テストファイルである。HTML ではない。

sitemap、`CNAME`、canonical 用の別ファイルは無い。

## クリーンビルド

2026-10-11、作業ブランチ上で Node.js 24.16.0 を使い、リポジトリルートで次を実行した。

```bash
npm ci
npm run docs:build
```

どちらも成功した。TypeDoc は error 0、warning 4 で `./docs` に HTML を出した。警告は次のとおり。

- `examples/mcp/` と `examples/cursor/` はディレクトリであり、出力へコピーされない
- `architecture/mcp-native.md` と `architecture/responsibility-inventory.md` の mermaid コードブロックは、`highlightLanguages` に無いため強調表示されない

再生成後のファイル数は 135 のままである。`git diff` は 69 ファイル。差分は `Defined in` の GitHub blob URL に埋め込まれたコミット SHA だけである。生成時点の `HEAD` が変わるたびにこの SHA は変わる。HTML の構造、相対パス、本文は変わらない。この SHA 差分はコミットしていない。`git checkout -- docs` でコミット済みの `docs/` に戻した。

## パス

HTML 116 ページを確認した。

| 項目 | 結果 |
| --- | --- |
| ルートの `data-base` | `"./"`（`index.html`、`modules.html`、`hierarchy.html`） |
| 1 階層下の `data-base` | `"../"` |
| CSS / JS / SVG | 相対パス（例: `assets/style.css`、`../assets/style.css`） |
| ルート絶対パス（`href="/`、`src="/`） | 無し |
| `<link rel="canonical">` | 無し |
| `sitemap.xml` | 無し |

検索インデックスは別 JSON ではない。`docs/assets/search.js` が `window.searchData` を持つ。ナビゲーションも `docs/assets/navigation.js` が `window.navigationData` を持つ。検索結果とナビのリンクは `document.documentElement.dataset.base` にページ相対パスを足して作る。`data-base` が `./` または `../` なので、文書 URL のディレクトリを基準に解決する。

ローカルリンク 2627 件のうち、ファイルとして存在しないのは次の 4 件だけである。いずれも `docs/documents/MCP-native_Architecture.html` にある。

- `../`（README へのディレクトリリンク）
- `../media/mcp` が 2 件、`../media/cursor` が 1 件

後者は、TypeDoc がディレクトリを `media/` にコピーしない警告と一致する。サブパスに依存しない既存のリンクである。画像ファイルは `docs/assets/icons.svg` のみで、各ページから相対参照されている。

外部の `http` / `https` リンクは 291 件ある。ソース定義への GitHub blob URL が中心で、公開ホスト名ではない。リポジトリ内に `gurezo.github.io` の URL は無い。

## サブパス配信

`docs/` を `/mdn-translation-ja-mcp/` として静的配信し、確認した。サーバーは Python の `http.server`（`127.0.0.1:4173`）。

| URL | 結果 |
| --- | --- |
| `/mdn-translation-ja-mcp` | 301 で `/mdn-translation-ja-mcp/` へ |
| `/mdn-translation-ja-mcp/` | 200、`text/html` |
| `/mdn-translation-ja-mcp/index.html` | 200、`text/html` |
| `/mdn-translation-ja-mcp/assets/style.css` | 200、`text/css` |
| `/mdn-translation-ja-mcp/assets/main.js` | 200、`text/javascript` |
| `/mdn-translation-ja-mcp/assets/search.js` | 200。先頭は `window.searchData` |
| `/mdn-translation-ja-mcp/assets/navigation.js` | 200 |
| `/mdn-translation-ja-mcp/assets/icons.svg` | 200、`image/svg+xml` |
| `/mdn-translation-ja-mcp/documents/Getting_Started.html` | 200 |
| `/mdn-translation-ja-mcp/functions/tools_review.mdnTransReview.html` | 200 |
| `/mdn-translation-ja-mcp/media/README.md` | 200、`application/octet-stream`（生の Markdown） |
| `/assets/style.css`（サイト直下） | 404 |

末尾スラッシュの有無で、相対 URL の解決先が変わる。

| 文書 URL | `assets/style.css` の解決先 |
| --- | --- |
| `https://gurezo.net/mdn-translation-ja-mcp` | `https://gurezo.net/assets/style.css`（壊れる） |
| `https://gurezo.net/mdn-translation-ja-mcp/` | `https://gurezo.net/mdn-translation-ja-mcp/assets/style.css` |
| `https://gurezo.net/mdn-translation-ja-mcp/index.html` | 同上 |
| 下層の `../assets/style.css` | サブパス内の `assets/style.css` |

ディレクトリ URL が末尾スラッシュ付きで開ければ、CSS、JS、検索スクリプト、SVG、下層 HTML への直接アクセスは、生成設定を変えずに動く。現行の GitHub Pages URL も同じサブパス形である。
