# MDN Web Docs 日本語翻訳 MCP サーバー

このプロジェクトは、MDN Web Docs の日本語翻訳を支援するための MCP (Machine Translation Control Protocol) サーバーです。

## 機能

- テキストの翻訳エンドポイント (`/api/translate`)
- ヘルスチェックエンドポイント (`/health`)

## セットアップ

1. 依存関係のインストール:

```bash
npm install
```

2. 環境変数の設定:

```bash
cp .env.example .env
# .env ファイルを編集して必要な設定を行う
```

3. 開発サーバーの起動:

```bash
npm run dev
```

4. 本番サーバーの起動:

```bash
npm start
```

## API エンドポイント

### POST /api/translate

テキストの翻訳を行います。

リクエストボディ:

```json
{
  "text": "翻訳するテキスト",
  "sourceLang": "en",
  "targetLang": "ja"
}
```

レスポンス:

```json
{
  "translatedText": "翻訳されたテキスト",
  "sourceLang": "en",
  "targetLang": "ja",
  "status": "success"
}
```

## ライセンス

MIT
