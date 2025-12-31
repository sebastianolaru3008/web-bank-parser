import { get } from 'svelte/store';
import { lang } from '../stores/lang';

function currentLocale() {
  const l = get(lang);
  if (l === 'ro') return 'ro-RO';
  return 'en-US';
}

export function formatAmount(value) {
  const num = Number(value) || 0;
  const locale = currentLocale();
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}
