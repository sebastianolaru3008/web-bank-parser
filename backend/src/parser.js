import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
// PDF.js for password-protected PDFs
import crypto from 'crypto';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import XLSX from 'xlsx';
import { patternToRegex } from './rules.js';

function normalizeHeader(h) {
  return (h || '').toString().trim().toLowerCase();
}

function detectColumns(headers) {
  const norm = headers.map(normalizeHeader);
  const findIdx = (candidates) => {
    for (const c of candidates) {
      const i = norm.findIndex((h) => h.includes(c));
      if (i !== -1) return i;
    }
    return -1;
  };
  return {
    date: findIdx(['date', 'data']),
    description: findIdx(['description', 'descriere', 'detalii', 'details', 'transaction', 'explica']),
    amount: findIdx(['amount', 'sum', 'suma', 'value', 'valoare'])
  };
}

function readCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',');
  const idx = detectColumns(headers);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    rows.push({
      date: idx.date >= 0 ? cols[idx.date] : '',
      description: idx.description >= 0 ? cols[idx.description] : cols.join(' , '),
      amount: idx.amount >= 0 ? parseFloat((cols[idx.amount] || '0').replace(',', '.')) : 0
    });
  }
  return rows;
}

function readXLSX(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
  if (json.length === 0) return [];
  const headers = json[0];
  const idx = detectColumns(headers);
  const rows = [];
  for (let i = 1; i < json.length; i++) {
    const row = json[i];
    rows.push({
      date: idx.date >= 0 ? row[idx.date] : '',
      description: idx.description >= 0 ? row[idx.description] : row.join(' , '),
      amount: idx.amount >= 0 ? parseFloat(String(row[idx.amount] || '0').replace(',', '.')) : 0
    });
  }
  return rows;
}

export async function parseUploadAndCategorize(filePath, originalName, rules, opts = {}) {
  const ext = path.extname(originalName).toLowerCase();
  const buffer = await fs.readFile(filePath);
  let items = [];
  if (ext === '.pdf') {
    items = await readPDF(buffer, opts.password);
  } else if (ext === '.xlsx' || ext === '.xls') {
    items = readXLSX(buffer);
  } else {
    items = readCSV(buffer.toString('utf8'));
  }

  const compiled = rules.map((r) => ({ regex: patternToRegex(r.pattern), category: r.category || 'Uncategorized' }));
  const categorized = items.map((tx) => {
    const d = (tx.description || '').toString();
    let category = 'Uncategorized';
    for (const r of compiled) {
      if (r.regex.test(d)) { category = r.category || 'Uncategorized'; break; }
    }
    return { ...tx, category };
  });

  // Attach stable IDs to each transaction to enable reliable identification
  const withId = categorized.map((tx, idx) => ({ id: makeId(tx, idx), ...tx }));

  const totals = {};
  for (const tx of withId) {
    const key = tx.category || 'Uncategorized';
    totals[key] = (totals[key] || 0) + (Number.isFinite(tx.amount) ? tx.amount : 0);
  }

  return { count: withId.length, items: withId, totals };
}

function makeId(tx, idx){
  try {
    const base = `${tx.date ?? ''}|${tx.description ?? ''}|${Number(tx.amount) || 0}|${idx}`;
    const h = crypto.createHash('sha1').update(base).digest('hex').slice(0, 12);
    return `tx_${h}`;
  } catch {
    return `tx_${idx}`;
  }
}

function normalizeAmount(raw) {
  if (raw == null) return 0;
  let s = String(raw).trim();
  s = s.replace(/[\s\u00A0]/g, '');
  const m = s.match(/([+-]?)([0-9]{1,3}(?:[.,][0-9]{3})*|[0-9]+)([.,][0-9]{2})?/);
  if (!m) return Number(s.replace(/[^0-9.-]/g, '')) || 0;
  let sign = m[1] === '-' ? -1 : 1;
  let intPart = m[2];
  let fracPart = m[3] || '';
  intPart = intPart.replace(/[.,](?=\d{3}(\D|$))/g, '');
  let numStr = intPart + (fracPart ? fracPart.replace(',', '.') : '');
  const n = parseFloat(numStr);
  return (isNaN(n) ? 0 : n * sign);
}

async function readPDF(buffer, password) {
  // First try fast path via pdf-parse (works for many PDFs)
  try {
    const { text } = await pdfParse(buffer);
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    return linesToRows(lines);
  } catch (e) {
    // Fallback to PDF.js with password support
    const lineItems = await extractTextWithPdfjs(buffer, password);
    return linesToRowsFromItems(lineItems);
  }
}

function linesToRows(lines) {
  const dateRe = /\b(\d{2}[.\/-]\d{2}[.\/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/;
  const amountRe = /([+-]?[0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})|[+-]?[0-9]+(?:[.,][0-9]{2}))/;
  const rows = [];
  let lastRow = null;
  for (const line of lines) {
    const dMatch = line.match(dateRe);
    const aMatch = line.match(new RegExp(amountRe.source + '$'));
    if (dMatch && aMatch) {
      const date = dMatch[0];
      const amountStr = aMatch[0];
      const desc = line.replace(date, '').replace(aMatch[0], '').replace(/\s{2,}/g, ' ').trim();
      const row = { date, description: desc, amount: normalizeAmount(amountStr) };
      rows.push(row);
      lastRow = row;
    } else if (!dMatch && !aMatch) {
      // Continuation line: append extra merchant/details text to previous row
      if (lastRow) {
        const extra = line.trim();
        if (extra) lastRow.description = (lastRow.description ? lastRow.description + ' ' : '') + extra;
      }
    } else {
      // Lines with only date or only amount are ignored
    }
  }
  return rows;
}

async function extractTextWithPdfjs(buffer, password) {
  const data = ensureUint8Array(buffer);
  const loadingTask = getDocument({ data, password, disableWorker: true });
  const doc = await loadingTask.promise;
  const parts = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const lines = groupItemsToLines(content.items);
    parts.push(lines);
  }
  return parts.flat();
}

function groupItemsToLines(items) {
  // Group by Y coordinate (baseline), sort by X, keep positions
  const rows = new Map();
  for (const it of items) {
    const t = it.transform || it.TS || [0, 0, 0, 0, 0, 0];
    const x = t[4] || 0;
    const y = t[5] || 0;
    const key = Math.round(y); // tolerance bucket
    if (!rows.has(key)) rows.set(key, []);
    rows.get(key).push({ x, str: it.str || '' });
  }
  const sortedKeys = Array.from(rows.keys()).sort((a, b) => a - b);
  const lines = [];
  for (const k of sortedKeys) {
    const cols = rows.get(k).sort((a, b) => a.x - b.x);
    if (cols.length) lines.push({ y: k, items: cols });
  }
  return lines;
}

function linesToRowsFromItems(lines) {
  const dateRe = /\b(\d{2}[.\/-]\d{2}[.\/-]\d{2,4}|\d{4}-\d{2}-\d{2})\b/;
  const amountTailRe = /([+-]?[0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})|[+-]?[0-9]+(?:[.,][0-9]{2}))$/;
  const amountExactRe = new RegExp('^' + amountTailRe.source + '$');
  const rows = [];
  let lastRow = null; // most recent transaction row
  for (const line of lines) {
    const text = line.items.map((i) => i.str).join(' ').replace(/\s{2,}/g, ' ').trim();
    if (!text) continue;
    const dMatch = text.match(dateRe);
    const aMatch = text.match(amountTailRe);
    if (dMatch && aMatch) {
      const date = dMatch[0];
      const amountStr = aMatch[0];
      // Find positions of date and amount items
      let dateIdx = line.items.findIndex((i) => i.str.includes(date));
      if (dateIdx === -1) dateIdx = 0;
      let amountIdx = -1;
      for (let i = line.items.length - 1; i >= 0; i--) {
        const s = (line.items[i].str || '').trim();
        if (amountExactRe.test(s) || s.endsWith(amountStr)) { amountIdx = i; break; }
      }
      if (amountIdx === -1) continue;
      const mid = line.items.slice(Math.min(dateIdx + 1, amountIdx), Math.max(amountIdx, dateIdx + 1));
      let desc = mid.map((i) => i.str).join(' ').replace(/\s{2,}/g, ' ').trim();
      const row = { date, description: desc, amount: normalizeAmount(amountStr) };
      rows.push(row);
      // Always track the last row so we can append merchant info from following lines
      lastRow = row;
    } else if (!dMatch && !aMatch) {
      // Continuation line: no date and no trailing amount -> append to previous row's description
      if (lastRow) {
        const extra = text;
        if (extra) lastRow.description = (lastRow.description ? lastRow.description + ' ' : '') + extra;
      }
    } else {
      // Lines with only date or only amount are less useful; ignore and reset
      // Do not reset lastRow; we might still get more appended lines later
    }
  }
  return rows;
}

function ensureUint8Array(input) {
  if (input instanceof Uint8Array && !(globalThis.Buffer && globalThis.Buffer.isBuffer && Buffer.isBuffer(input))) {
    return input;
  }
  if (globalThis.Buffer && Buffer.isBuffer && Buffer.isBuffer(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }
  return new Uint8Array(input);
}
