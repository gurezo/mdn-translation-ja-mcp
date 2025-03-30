const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// CORSの設定を詳細に指定
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// SSEクライアントの接続を保持する配列
const clients = new Set();

// SSEエンドポイント
app.get('/api/events', (req, res) => {
  console.log('New SSE connection request received');

  // SSEヘッダーの設定
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  // クライアントを追加
  clients.add(res);
  console.log(`Current connected clients: ${clients.size}`);

  // クライアントが切断した場合の処理
  req.on('close', () => {
    console.log('Client disconnected');
    clients.delete(res);
    console.log(`Remaining connected clients: ${clients.size}`);
  });

  // エラーハンドリング
  req.on('error', (error) => {
    console.error('SSE connection error:', error);
    clients.delete(res);
  });

  // 接続確立時に初期メッセージを送信
  try {
    res.write(
      `data: ${JSON.stringify({
        type: 'connected',
        message: 'SSE connection established',
        timestamp: new Date().toISOString(),
      })}\n\n`
    );
    console.log('Initial connection message sent');
  } catch (error) {
    console.error('Error sending initial message:', error);
    clients.delete(res);
  }

  // 定期的なハートビートを送信
  const heartbeat = setInterval(() => {
    try {
      res.write(
        `data: ${JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
        })}\n\n`
      );
    } catch (error) {
      console.error('Error sending heartbeat:', error);
      clearInterval(heartbeat);
      clients.delete(res);
    }
  }, 30000); // 30秒ごとにハートビートを送信

  // クライアントが切断したらハートビートを停止
  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

// イベントを送信する関数
const sendEvent = (data) => {
  console.log('Sending event to clients:', data);
  clients.forEach((client) => {
    try {
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      console.error('Error sending event to client:', error);
      clients.delete(client);
    }
  });
};

// 翻訳ルールのエンドポイント
app.get('/api/rules', (req, res) => {
  const rules = {
    editorial:
      'https://github.com/mozilla-japan/translation/wiki/Editorial-Guideline',
    l10n: 'https://github.com/mozilla-japan/translation/wiki/L10N-Guideline',
    glossary:
      'https://github.com/mozilla-japan/translation/wiki/Mozilla-L10N-Glossary',
    spreadsheet:
      'https://docs.google.com/spreadsheets/d/1y-hC-xMXawCgcYZwJDnvuSlAOTgMRLLyqXurpYkJbYE/edit#gid=0',
  };
  res.json(rules);
});

// 翻訳テキストの検証エンドポイント
app.post('/api/validate', (req, res) => {
  const { text } = req.body;

  // 基本的な検証ルール
  const validation = {
    isValid: true,
    issues: [],
  };

  // 空のテキストチェック
  if (!text || text.trim() === '') {
    validation.isValid = false;
    validation.issues.push('テキストが空です');
  }

  // 文字数チェック
  if (text.length > 1000) {
    validation.issues.push('テキストが長すぎます');
  }

  // 検証結果をSSEで送信
  sendEvent({
    type: 'validation',
    data: validation,
  });

  res.json(validation);
});

// サーバー起動
app.listen(port, () => {
  console.log(`MCP server is running at http://localhost:${port}`);
});
