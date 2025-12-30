import fs from 'fs/promises';
import path from 'path';

const cache = new Map();

export async function loadRules(lang = 'en') {
  const key = lang.toLowerCase();
  if (cache.has(key)) return cache.get(key);
  const file = path.join(process.cwd(), 'data', 'rules', `${key}.csv`);
  const txt = await fs.readFile(file, 'utf8');
  const lines = txt.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rules = lines.map((l) => {
    const [pattern, category] = l.split(',');
    return { pattern: pattern?.trim() || '', category: (category || '').trim() };
  }).filter((r) => r.pattern);
  cache.set(key, rules);
  return rules;
}

export function patternToRegex(pattern) {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regexStr = '^' + escaped.replace(/\\\*/g, '.*') + '$';
  return new RegExp(regexStr, 'i');
}
