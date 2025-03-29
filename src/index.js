require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { translate } = require('./utils/translator');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// MCP endpoints
app.post('/api/translate', async (req, res) => {
  try {
    const { text, sourceLang = 'en', targetLang = 'ja' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const translatedText = await translate(text, sourceLang, targetLang);

    res.json({
      original: text,
      translated: translatedText,
      sourceLang,
      targetLang,
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`MCP server is running on port ${port}`);
});
