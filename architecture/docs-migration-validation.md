# 移行後の検証と旧 GitHub Pages の方針

親 Issue: [#127](https://github.com/gurezo/mdn-translation-ja-mcp/issues/127)
本 Issue: [#132](https://github.com/gurezo/mdn-translation-ja-mcp/issues/132)

前提は [#128](https://github.com/gurezo/mdn-translation-ja-mcp/issues/128) の [docs-subpath-audit.md](docs-subpath-audit.md)。あの文書は調査時点の記録である。公開主体は [gurezo/portal](https://github.com/gurezo/portal) の Firebase Hosting（サイト `gurezo-portal`）。このリポジトリから Hosting へ直接デプロイしない。

本文書は TypeDoc の `projectDocuments` に含めない。利用者向けのページには載せない。

検証日は 2026-10-11。ブラウザでページを開き、検索とナビゲーションの操作まで確認した。

## 新 URL

公開先は `https://gurezo.net/mdn-translation-ja-mcp/`。末尾スラッシュなしの `https://gurezo.net/mdn-translation-ja-mcp` を開くと、同じトップ（末尾スラッシュ付き）に着地する。

| 確認 | 結果 |
| --- | --- |
| トップ | タイトル `mdn-translation-ja-mcp`。本文とサイドナビが表示される |
| Getting Started | 検索語 `Getting Started` の結果から遷移できた。タイトルは `Getting Started \| mdn-translation-ja-mcp` |
| Architecture | サイドナビから遷移できた。タイトルは `Architecture \| mdn-translation-ja-mcp` |
| MCP Tools | サイドナビから遷移できた。タイトルは `MCP Tools \| mdn-translation-ja-mcp`。相対の CSS と JS は `https://gurezo.net/mdn-translation-ja-mcp/assets/` を読む |
| 下層 HTML の直接アクセス | `functions/tools_trans-start.mdnTransStart.html` を URL で開くと `mdnTransStart` が表示され、サイドナビも出る |
| CSS | `assets/style.css` と `assets/highlight.css` が当たり、本文の背景色が付く |
| JS | `assets/main.js`、`icons.js`、`search.js`、`navigation.js` を読む。`searchData` と `navigationData` がある |
| 検索 | ツールバーの Search を開くと入力欄が出る。`Getting Started` で文書ヒットし、結果リンクでそのページへ移る |
| ナビゲーション | サイドナビの Architecture と MCP Tools でページが切り替わる |
| 画像 | 検索アイコンは `assets/icons.svg` を参照する |
| 存在しないパス | `mdn-translation-ja-mcp/this-page-does-not-exist` は Firebase Hosting の `Page Not Found`。ドキュメントへは飛ばない |

## 既存サイト

`https://gurezo.net/` はタイトル `gurezo portal site`。見出しは `Documentation and demos for OSS projects.`。プロジェクト一覧から `web-serial-rxjs` の Documentation を開くと `https://gurezo.net/web-serial-rxjs/` になる。ドキュメント配下を見たあとでも、ポータルのトップは同じ内容で開く。

## 旧 GitHub Pages

`https://gurezo.github.io/mdn-translation-ja-mcp/` は GitHub Pages の 404 である。タイトルは `Page not found · GitHub Pages`。見出しは `404` と `File not found`。アドレスは `github.io` のまま残り、`gurezo.net` へのリンクもリダイレクトも無い。

Pages 用の GitHub Actions、`gh-pages` ブランチ、`CNAME` は無い。検証時点の `devDependencies` には `gh-pages` がある。スクリプトと workflow は呼んでいない。公開経路ではない。`docs:publish` は `docs:build` の別名で、リモートへは送らない。

DNS は変えない。GitHub Pages から新 URL への自動リダイレクトは作らない。

## 方針

旧 URL は非公開のままにする。再公開しない。移行案内だけのページも置かない。利用者が開く公開先は `https://gurezo.net/mdn-translation-ja-mcp/` だけである。

ドキュメントの更新と、本番で問題が起きたときの戻しは portal 側の Hosting で行う。手順は README の「API ドキュメント（TypeDoc）」に書く。
