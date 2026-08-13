const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve the static front-end (parent folder)
app.use(express.static(path.join(__dirname, '..')));

const DB_PATH = path.join(__dirname, 'db.json');

function readDb() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Save login / savepoint
app.post('/api/save-login', (req, res) => {
  const payload = req.body || {};
  const record = {
    name: payload.name || 'unknown',
    savePoint: payload.savePoint || null,
    meta: payload.meta || {},
    date: new Date().toISOString()
  };
  const db = readDb();
  db.push(record);
  try {
    writeDb(db);
    res.json({ ok: true, record });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// Simple endpoint to list records (teacher use)
app.get('/api/records', (req, res) => {
  res.json(readDb());
});

// Compatible welcome endpoint: prefer @vercel/global-config, fallback to env/default
app.get('/welcome', async (req, res) => {
  try {
    let greeting = null;
    try {
      const mod = require('@vercel/global-config');
      const getter = mod.get || mod.default && mod.default.get;
      if (typeof getter === 'function') {
        // allow getter to be async
        greeting = await getter('greeting');
      }
    } catch (err) {
      // module not available or failed — ignore and fallback
    }

    if (greeting == null) greeting = process.env.GREETING || 'សួស្តី (Welcome)';

    res.setHeader('Content-Type', 'application/json');
    res.status(200).end(JSON.stringify({ greeting }));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Exam backend listening on http://localhost:${PORT}`);
});
