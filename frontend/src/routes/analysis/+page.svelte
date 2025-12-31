<script>
  import ItemsTable from '$lib/components/ItemsTable.svelte';
  import Totals from '$lib/components/Totals.svelte';
  import { tt } from '$lib/i18n';
  import { lang } from '$lib/stores/lang';
  import { formatAmount } from '$lib/utils/format.js';
  import { onMount } from 'svelte';

  let result = null;
  let tab = 'parsed';
  let selectedCategory = '';
  let search = '';
  let rataGroups = [];
  let recurringGroups = [];
  let totalNextMonth = 0;
  const MAX_BAR = 1000;
  function scale(val){ const v = Math.abs(Number(val)||0); return Math.min(100, Math.round(v / MAX_BAR * 100)); }
  $: activeRata = (rataGroups||[]).filter(g => g.active);
  $: completedRata = (rataGroups||[]).filter(g => !g.active);
  $: completedTotal = (completedRata||[]).reduce((sum, g) => sum + (g.amount || 0), 0);
  function completion(g){
    const m = Number(g.totalM)||0;
    const n = Number(g.lastN)||0;
    if (m <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round(n/m*100)));
  }

  onMount(() => {
    try {
      const raw = sessionStorage.getItem('parseResult');
      if (raw) {
        result = JSON.parse(raw);
        computePredictions();
      }
    } catch {}
  });

  function computePredictions(){
    const items = result?.items || [];
    rataGroups = buildRataGroups(items);
    recurringGroups = buildRecurringGroups(items);
    const rataTotal = rataGroups.filter(g => g.active).reduce((sum, g) => sum + (g.amount || 0), 0);
    const recTotal = recurringGroups.filter(g => g.active).reduce((sum, g) => sum + (g.amount || 0), 0);
    totalNextMonth = rataTotal + recTotal;
  }

  function buildRataGroups(items) {
    const re = /\bRata\b\s*(?:nr\.?\s*)?(\d+)\s*(?:din|\/)\s*(\d+)\b/i;
    const groups = new Map();
    for (const it of items) {
      const d = String(it.description || '');
      const m = d.match(re);
      if (!m) continue;
      const n = parseInt(m[1], 10);
      const total = parseInt(m[2], 10);
      const label = d.replace(re, '').replace(/^\s*[;:\-]?\s*/, '').trim() || 'Installment';
      const amt = Math.abs(Number(it.amount) || 0);
      const amtKey = Math.round(amt * 100) / 100; // stabilize grouping by monthly installment amount
      const key = `${label.toLowerCase()}|${total}|${amtKey}`;
      const existing = groups.get(key);
      if (!existing) {
        groups.set(key, { key, label, amount: amt, lastN: n, totalM: total });
      } else {
        if (n >= existing.lastN) {
          existing.lastN = n;
          existing.amount = amt;
        }
        existing.totalM = Math.max(existing.totalM, total);
      }
    }
    return Array.from(groups.values()).map(g=>({ ...g, active: (g.lastN||0) < (g.totalM||0) })).sort((a,b)=> (b.amount||0)-(a.amount||0));
  }

  function monthKey(dateStr){
    // Parse YYYY-MM or DD.MM.YYYY or similar, fallback to first 7 chars
    const s = String(dateStr||'');
    const m1 = s.match(/^(\d{4})[-/.](\d{2})/);
    if (m1) return `${m1[1]}-${m1[2]}`;
    const m2 = s.match(/^(\d{2})[.\-/](\d{2})[.\-/](\d{4})/);
    if (m2) return `${m2[3]}-${m2[2]}`;
    return s.slice(0,7);
  }

  function normalizeBaseLabel(desc){
    return String(desc||'')
      .replace(/\bRata\b[^;]*$/i,'')
      .replace(/[\d#]+/g,'')
      .replace(/\s+/g,' ')
      .trim()
      .toLowerCase();
  }

  function buildRecurringGroups(items){
    const byKey = new Map();
    for (const it of items){
      const label = normalizeBaseLabel(it.description);
      if (!label) continue;
      const amt = Math.abs(Number(it.amount)||0);
      const month = monthKey(it.date);
      const g = byKey.get(label) || { key: label, label, months: new Set(), amounts: new Map(), amount: 0 };
      g.months.add(month);
      g.amounts.set(month, amt);
      byKey.set(label, g);
    }
    const groups = [];
    for (const g of byKey.values()){
      if (g.months.size < 2) continue; // require at least 2 months
      // Use the latest month amount
      const sortedMonths = Array.from(g.months).sort();
      const latest = sortedMonths[sortedMonths.length-1];
      const amt = g.amounts.get(latest) || 0;
      groups.push({ key: g.key, label: g.label || 'Recurring', amount: amt, active: true });
    }
    return groups.sort((a,b)=> (b.amount||0)-(a.amount||0));
  }

  function exportCSV() {
    import('$lib/utils/csv.js').then(({ toCSV, download }) => {
      const csv = toCSV(result.items, ['date', 'description', 'amount', 'category']);
      download(`bank-records-${new Date().toISOString().slice(0,10)}.csv`, csv);
    });
  }

  function clearAndBack(){
    try { sessionStorage.removeItem('parseResult'); } catch {}
    if (typeof window !== 'undefined') window.location.href = '/';
  }

    $: _lang = $lang; // rerender on language change
</script>

<main>
  <section class="card">
  <h1>{tt($lang, 'analysis.title')}</h1>
  {#if !result}
    <p>{tt($lang, 'analysis.no_data')}</p>
  {:else}
    <div class="tabs">
      <div class="seg">
        <button class:active={tab==='parsed'} on:click={()=>tab='parsed'}>{tt($lang, 'analysis.tab.parsed')}</button>
        <button class:active={tab==='predictions'} on:click={()=>tab='predictions'}>{tt($lang, 'analysis.tab.predictions')}</button>
      </div>
      <div class="spacer"></div>
      <button class="outline" on:click={clearAndBack}>{tt($lang, 'analysis.upload_another')}</button>
    </div>

    {#if tab==='parsed'}
      <Totals totals={result.totals} on:select={(e)=> selectedCategory = e.detail}>
        <div class="filters">
          <div class="field">
            <label>{tt($lang, 'analysis.filter.category')}</label>
            <select bind:value={selectedCategory}>
              <option value="">{tt($lang, 'analysis.filter.all')}</option>
              {#each Object.keys(result.totals || {}) as cat}
                <option value={cat}>{cat}</option>
              {/each}
            </select>
          </div>
          <div class="field">
            <label>{tt($lang, 'analysis.search')}</label>
            <input placeholder={tt($lang, 'analysis.search.placeholder')} bind:value={search} />
          </div>
        </div>
      </Totals>

      <ItemsTable items={result.items} filterCategory={selectedCategory} search={search}>
        <div slot="actions" class="actions">
          <button class="primary" on:click={exportCSV}>{tt($lang, 'analysis.export_csv')}</button>
        </div>
      </ItemsTable>
    {/if}

    {#if tab==='predictions'}
      <section class="summary">
        <div class="total">
          <div class="label">{tt($lang, 'analysis.pred.total_next_month')}</div>
          <div class="value">{formatAmount(totalNextMonth)}</div>
        </div>
        <div class="total">
          <div class="label">{tt($lang, 'analysis.pred.completed_total')}</div>
          <div class="value">{formatAmount(completedTotal)}</div>
        </div>
      </section>

      <section>
        <h2>{tt($lang, 'analysis.pred.active_installments')}</h2>
        {#if activeRata.length === 0}
          <p>{tt($lang, 'analysis.pred.no_active')}</p>
        {:else}
          <div class="bars">
            {#each activeRata as g}
              <div class="bar-row">
                <div class="bar-label">
                  <div class="name">{g.label}</div>
                  <div class="meta">{tt($lang, 'analysis.pred.installment')} {g.lastN} / {g.totalM} • {tt($lang, 'analysis.pred.rata_meta_active')}</div>
                </div>
                <div class="bar-wrap" title={`Progress ${completion(g)}%`}>
                  <div class="bar" style={`width:${completion(g)}%; background: var(--primary);`}></div>
                  <div class="bar-value">{formatAmount(g.amount)} {tt($lang, 'currency.lei')}</div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>

      <section>
        <h2>{tt($lang, 'analysis.pred.completed_installments')}</h2>
        {#if completedRata.length === 0}
          <p>{tt($lang, 'analysis.pred.no_completed')}</p>
        {:else}
          <div class="bars">
            {#each completedRata as g}
              <div class="bar-row">
                <div class="bar-label">
                  <div class="name">{g.label}</div>
                  <div class="meta">{tt($lang, 'analysis.pred.installment')} {g.lastN} / {g.totalM} • {tt($lang, 'analysis.pred.rata_meta_completed')}</div>
                </div>
                <div class="bar-wrap" title={`Progress 100%`}>
                  <div class="bar" style={`width:100%; background: var(--muted);`}></div>
                  <div class="bar-value">{formatAmount(g.amount)} {tt($lang, 'currency.lei')}</div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>

      
    {/if}
  {/if}
</section>
</main>

<style>
  main { max-width: 1100px; margin: 1rem auto; padding: 0 1rem; }
  .card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem 1.5rem; box-shadow: 0 8px 24px var(--shadow-color); }
  h1 { margin: 1rem 0; }
  .tabs { display:flex; gap:.5rem; align-items:center; margin:.5rem 0 1rem; }
  .tabs button { padding:.5rem .7rem; border:1px solid var(--border-color); background: var(--card-bg); border-radius:8px; cursor:pointer; color: var(--text); }
  .tabs button.active { background: var(--primary); border-color: var(--primary); color:#fff; }
  .tabs .spacer { flex:1; }
  .tabs .outline { padding:.5rem .7rem; border:1px solid var(--border-color); background: var(--card-bg); border-radius:8px; color: var(--text); }

  .seg { display:inline-flex; gap:0; border:1px solid var(--border-color); border-radius:999px; background: var(--card-bg); box-shadow: 0 2px 6px var(--shadow-color); overflow:hidden; }
  .seg button { border:none; background: transparent; color: var(--text); padding:.45rem .9rem; border-radius:0; }
  .seg button.active { background: var(--primary); color:#fff; }
  .filters { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; margin: .5rem 0 1rem; }
  .filters .field { display: grid; gap: .35rem; }
  .filters label { color: var(--muted); }
  .filters select, .filters input { width: 100%; padding: .5rem .6rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-bg); color: var(--text); }
  @media (max-width: 720px) { .filters { grid-template-columns: 1fr; } }

  .actions { display:flex; gap:.5rem; }
  .primary { padding: .5rem .8rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--primary); color: #fff; }

  section { margin-top: 1rem; }
  .summary { display: flex; gap: 1rem; }
  .total { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: .75rem 1rem; box-shadow: 0 6px 16px var(--shadow-color); }
  .total .label { font-size: .9rem; color: var(--muted); }
  .total .value { font-size: 1.4rem; font-weight: 700; }
  .bars { display: flex; flex-direction: column; gap: .5rem; }
  .bar-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; align-items: center; }
  .bar-label .name { font-weight: 600; }
  .bar-label .meta { font-size: .85rem; color: var(--muted); }
  .bar-wrap { position: relative; height: 28px; background: var(--bar-bg); border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden; display:flex; align-items:center; }
  .bar { height: 100%; }
  .bar-value { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); font-weight: 600; }

  /* Responsiveness: stack bar rows vertically on narrow screens */
  @media (max-width: 720px) {
    .bar-row { grid-template-columns: 1fr; gap: .5rem; }
    .bar-wrap { height: 32px; }
  }
</style>
