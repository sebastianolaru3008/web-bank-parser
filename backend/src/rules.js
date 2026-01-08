import fs from 'fs/promises';
import path from 'path';

const cache = new Map();

export function getRulesPath(lang) {
  const key = (lang || 'en').toLowerCase();
  return path.join(process.cwd(), 'data', 'rules', `${key}.csv`);
}

export function clearCache(lang) {
  if (lang) {
    cache.delete(lang.toLowerCase());
  } else {
    cache.clear();
  }
}

export async function loadRules(lang = 'en') {
  const key = lang.toLowerCase();
  if (cache.has(key)) return cache.get(key);
  const file = getRulesPath(key);
  const txt = await fs.readFile(file, 'utf8');
  const lines = txt.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rules = lines.map((l) => {
    const [pattern, category] = l.split(',');
    return { pattern: pattern?.trim() || '', category: (category || '').trim() };
  }).filter((r) => r.pattern);
  cache.set(key, rules);
  return rules;
}

export async function saveRules(lang = 'en', rules = []) {
  const key = lang.toLowerCase();
  const file = getRulesPath(key);
  const lines = (rules || []).map((r) => `${(r.pattern || '').trim()},${(r.category || '').trim()}`);
  const txt = lines.join('\n') + (lines.length ? '\n' : '');
  await fs.writeFile(file, txt, 'utf8');
  cache.set(key, rules);
}

export async function addRule(lang = 'en', rule) {
  const rules = await loadRules(lang);
  const pattern = (rule?.pattern || '').trim();
  const category = (rule?.category || '').trim();
  if (!pattern) throw new Error('pattern is required');
  const exists = rules.find((r) => r.pattern.toLowerCase() === pattern.toLowerCase());
  if (exists) throw new Error('rule already exists');
  const next = [...rules, { pattern, category }];
  await saveRules(lang, next);
  return next;
}

export async function removeRule(lang = 'en', query) {
  const rules = await loadRules(lang);
  let next = rules;
  if (typeof query === 'number') {
    const idx = query;
    if (idx < 0 || idx >= rules.length) throw new Error('index out of range');
    next = rules.filter((_, i) => i !== idx);
  } else if (typeof query === 'string') {
    const pattern = query.trim();
    next = rules.filter((r) => r.pattern.toLowerCase() !== pattern.toLowerCase());
  } else if (query && query.pattern) {
    const pattern = String(query.pattern || '').trim();
    next = rules.filter((r) => r.pattern.toLowerCase() !== pattern.toLowerCase());
  } else {
    throw new Error('missing remove criteria');
  }
  await saveRules(lang, next);
  return next;
}

export function patternToRegex(pattern) {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexStr = '^' + escaped.replace(/\\\*/g, '.*') + '$';
  return new RegExp(regexStr, 'i');
}
