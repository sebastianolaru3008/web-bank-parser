import { get } from 'svelte/store';
import { lang } from './stores/lang';

type Dict = Record<string, string>;

const en: Dict = {
  'app.upload.title': 'Upload Bank Statement (PDF)',
  'app.upload.hint': 'We’ll parse your statement and take you to an analysis view with tabs for transactions and predictions.',
  'upload.select_file': 'Please select a PDF file',
  'upload.aria_label': 'Upload PDF',
  'upload.click_to_select': 'Click to select',
  'upload.drag_drop_here': 'or drag & drop your PDF here',
  'upload.use_password': 'Use password',
  'upload.password': 'Password',
  'upload.parse': 'Parse',
  'upload.parsing': 'Parsing…',
  'upload.err.encrypted': 'This PDF is encrypted. Please enter the password.',
  'upload.err.wrong_password': 'Wrong password. Please try again.',

  'analysis.title': 'Analysis',
  'analysis.tab.parsed': 'Parsed',
  'analysis.tab.predictions': 'Predictions',
  'analysis.upload_another': 'Upload another',
  'analysis.no_data': 'No parsed data. Please upload a PDF.',
  'analysis.filter.category': 'Filter by category',
  'analysis.filter.all': 'All',
  'analysis.search': 'Search',
  'analysis.search.placeholder': 'Text in description/category',
  'analysis.export_csv': 'Export CSV',
  'analysis.pred.total_next_month': 'Predicted total next month',
  'analysis.pred.completed_total': 'Completed installments total',
  'analysis.pred.active_installments': 'Active Installments',
  'analysis.pred.no_active': 'No active installments detected.',
  'analysis.pred.completed_installments': 'Completed Installments',
  'analysis.pred.no_completed': 'No completed installments.',
  'analysis.pred.installment': 'Installment',
  'analysis.pred.rata_meta_active': 'Active',
  'analysis.pred.rata_meta_completed': 'Completed',

  'currency.lei': 'lei',

  'table.items': 'items',
  'table.date': 'Date',
  'table.description': 'Description',
  'table.amount': 'Amount',
  'table.category': 'Category',
  'table.no_items': 'No items',
  'table.sum_shown': 'Sum of shown',

  'totals.title': 'Totals',
  'totals.empty': 'No totals available.',
  'totals.grand_total_label': 'Total',

  'rules.title': 'Rules',
  'rules.language': 'Language',
  'rules.reload': 'Reload',
  'rules.loading': 'Loading…',
  'rules.new_pattern': 'New pattern',
  'rules.category': 'Category',
  'rules.add_rule': 'Add Rule',
  'rules.pattern': 'Pattern',
  'rules.remove': 'Remove',
  'rules.empty': 'No rules',
  'rules.placeholder.pattern': 'e.g. *KAUFLAND*',
  'rules.placeholder.category': 'e.g. Groceries',
  'rules.lang.en': 'English',
  'rules.lang.ro': 'Romanian',
};

const ro: Dict = {
  'app.upload.title': 'Încarcă extrasul bancar (PDF)',
  'app.upload.hint': 'Vom analiza extrasul și te ducem la pagina de analiză cu taburi pentru tranzacții și predicții.',
  'upload.select_file': 'Te rugăm să selectezi un fișier PDF',
  'upload.aria_label': 'Încarcă PDF',
  'upload.click_to_select': 'Click pentru a selecta',
  'upload.drag_drop_here': 'sau trage și plasează PDF-ul aici',
  'upload.use_password': 'Folosește parolă',
  'upload.password': 'Parolă',
  'upload.parse': 'Procesează',
  'upload.parsing': 'Se procesează…',
  'upload.err.encrypted': 'PDF-ul este criptat. Te rugăm să introduci parola.',
  'upload.err.wrong_password': 'Parolă greșită. Încearcă din nou.',

  'analysis.title': 'Analiză',
  'analysis.tab.parsed': 'Tranzacții',
  'analysis.tab.predictions': 'Predicții',
  'analysis.upload_another': 'Încarcă altul',
  'analysis.no_data': 'Nu există date procesate. Te rugăm să încarci un PDF.',
  'analysis.filter.category': 'Filtrează după categorie',
  'analysis.filter.all': 'Toate',
  'analysis.search': 'Căutare',
  'analysis.search.placeholder': 'Text în descriere/categorie',
  'analysis.export_csv': 'Export CSV',
  'analysis.pred.total_next_month': 'Total estimat luna următoare',
  'analysis.pred.completed_total': 'Total rate finalizate',
  'analysis.pred.active_installments': 'Rate active',
  'analysis.pred.no_active': 'Nu există rate active.',
  'analysis.pred.completed_installments': 'Rate finalizate',
  'analysis.pred.no_completed': 'Nu există rate finalizate.',
  'analysis.pred.installment': 'Rata',
  'analysis.pred.rata_meta_active': 'Activă',
  'analysis.pred.rata_meta_completed': 'Finalizată',

  'currency.lei': 'lei',

  'table.items': 'elemente',
  'table.date': 'Data',
  'table.description': 'Descriere',
  'table.amount': 'Suma',
  'table.category': 'Categorie',
  'table.no_items': 'Nu există elemente',
  'table.sum_shown': 'Suma elementelor afișate',

  'totals.title': 'Totaluri',
  'totals.empty': 'Nu există totaluri.',
  'totals.grand_total_label': 'Total',

  'rules.title': 'Reguli',
  'rules.language': 'Limbă',
  'rules.reload': 'Reîncarcă',
  'rules.loading': 'Se încarcă…',
  'rules.new_pattern': 'Model nou',
  'rules.category': 'Categorie',
  'rules.add_rule': 'Adaugă regulă',
  'rules.pattern': 'Model',
  'rules.remove': 'Șterge',
  'rules.empty': 'Nu există reguli',
  'rules.placeholder.pattern': 'ex. *KAUFLAND*',
  'rules.placeholder.category': 'ex. Mâncare',
  'rules.lang.en': 'Engleză',
  'rules.lang.ro': 'Română',
};

const dicts: Record<string, Dict> = { en, ro };

export function t(key: string): string {
  const l = get(lang);
  const d = dicts[l] || dicts.en;
  return d[key] || dicts.en[key] || key;
}

export function tt(l: string, key: string): string {
  const d = dicts[l] || dicts.en;
  return d[key] || dicts.en[key] || key;
}
