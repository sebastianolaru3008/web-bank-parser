import cors from 'cors';
import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseUploadAndCategorize } from './parser.js';
import { loadRules } from './rules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;
const corsOrigin = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: corsOrigin, credentials: false }));
app.use(express.json());

const uploadsDir = path.join(__dirname, '..', 'uploads');
try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch {}
const upload = multer({ dest: uploadsDir });

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.json({
    service: 'bank-record-backend',
    status: 'ok',
    hint: 'Use /health or /api endpoints. UI runs on :3000',
    endpoints: [
      'GET /health',
      'GET /api/rules?lang=en|ro',
      'POST /api/parse (multipart: file, lang)'
    ]
  });
});

app.get('/api/rules', async (req, res) => {
  try {
    const lang = (req.query.lang || 'en').toString();
    const rules = await loadRules(lang);
    res.json({ lang, count: rules.length, rules });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/parse', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'file is required (pdf preferred)' });
  }
  const lang = (req.body.lang || 'en').toString();
  const password = (req.body.password || '').toString();
  const filePath = req.file.path;
  try {
    const rules = await loadRules(lang);
    const result = await parseUploadAndCategorize(filePath, req.file.originalname, rules, { password });
    res.json(result);
  } catch (err) {
    const msg = (err && err.message) ? err.message : String(err);
    const name = err && err.name ? err.name : '';
    const lower = msg.toLowerCase();

    const mentionsPassword = lower.includes('password') || lower.includes('encrypted');
    const isWrong = /invalid|incorrect|wrong|fail|failed/.test(lower);
    const isMissing = /no\s+password\s+given|required|need/.test(lower);

    if (name === 'PasswordException' || mentionsPassword) {
      return res.status(400).json({
        error: isWrong ? 'Incorrect PDF password' : 'PDF is encrypted; password required',
        needPassword: !isWrong && (isMissing || !password),
        wrongPassword: isWrong,
        detail: process.env.NODE_ENV === 'production' ? undefined : msg
      });
    }
    res.status(500).json({ error: msg });
  } finally {
    try { fs.unlinkSync(filePath); } catch {}
  }
});

app.listen(port, () => {
  console.log(`Backend listening on :${port}`);
});
