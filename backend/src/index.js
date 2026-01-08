import cors from 'cors';
import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseUploadAndCategorize } from './parser.js';
import { addRule, loadRules, removeRule, saveRules, getRulesPath, clearCache } from './rules.js';

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

app.post('/api/rules', async (req, res) => {
  try {
    const lang = (req.query.lang || req.body?.lang || 'en').toString();
    const pattern = (req.body?.pattern || '').toString();
    const category = (req.body?.category || '').toString();
    const rules = await addRule(lang, { pattern, category });
    res.json({ lang, count: rules.length, rules });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/rules', async (req, res) => {
  try {
    const lang = (req.query.lang || req.body?.lang || 'en').toString();
    const idxRaw = req.query.index ?? req.body?.index;
    const patRaw = req.query.pattern ?? req.body?.pattern;
    let query;
    if (idxRaw != null) query = Number(idxRaw);
    else if (patRaw) query = patRaw.toString();
    else if (req.body && typeof req.body === 'object') query = req.body;
    else throw new Error('index or pattern is required');
    const rules = await removeRule(lang, query);
    res.json({ lang, count: rules.length, rules });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Export rules as CSV file download
app.get('/api/rules/export', async (req, res) => {
  try {
    const lang = (req.query.lang || 'en').toString();
    const rules = await loadRules(lang);
    const csv = rules.map(r => `${r.pattern},${r.category}`).join('\n') + (rules.length ? '\n' : '');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="rules-${lang}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import rules from uploaded CSV file
app.post('/api/rules/import', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'CSV file is required' });
  }
  const lang = (req.body.lang || req.query.lang || 'en').toString();
  const mode = (req.body.mode || req.query.mode || 'replace').toString(); // 'replace' or 'merge'
  const filePath = req.file.path;
  
  try {
    const txt = fs.readFileSync(filePath, 'utf8');
    const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const importedRules = lines.map(l => {
      const [pattern, category] = l.split(',');
      return { pattern: pattern?.trim() || '', category: (category || '').trim() };
    }).filter(r => r.pattern);

    let finalRules;
    if (mode === 'merge') {
      const existing = await loadRules(lang);
      const existingPatterns = new Set(existing.map(r => r.pattern.toLowerCase()));
      const newRules = importedRules.filter(r => !existingPatterns.has(r.pattern.toLowerCase()));
      finalRules = [...existing, ...newRules];
    } else {
      finalRules = importedRules;
    }

    await saveRules(lang, finalRules);
    res.json({ lang, count: finalRules.length, rules: finalRules, imported: importedRules.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    try { fs.unlinkSync(filePath); } catch {}
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
