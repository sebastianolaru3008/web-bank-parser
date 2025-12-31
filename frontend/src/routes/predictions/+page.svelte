<script>
  import UploadForm from '$lib/components/UploadForm.svelte';

  let lang = 'en';
  let result = null;
  let rataGroups = [];
  let recurringGroups = [];
  let totalNextMonth = 0;
  const MAX_BAR = 1000; // scale reference

  function scale(val){
    const v = Math.abs(Number(val)||0);
    return Math.min(100, Math.round(v / MAX_BAR * 100));
  }

  function onResult(data) {
    result = data;
    const items = data.items || [];
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
      // Group key: strip the Rata prefix and trim
      const label = d.replace(re, '').replace(/^\s*[;:\-]?\s*/, '').trim() || 'Installment';
      const key = `${label.toLowerCase()}|${total}`;
      const amt = Math.abs(Number(it.amount) || 0);
      const existing = groups.get(key);
      if (!existing) {
        groups.set(key, { key, label, amount: amt, lastN: n, totalM: total });
      } else {
        // Set amount from the latest observed installment number
        if (n >= existing.lastN) {
          existing.lastN = n;
          existing.amount = amt;
        }
        existing.totalM = Math.max(existing.totalM, total);
      }
    }
    const arr = Array.from(groups.values()).map(g => ({
      ...g,
      active: (g.lastN || 0) < (g.totalM || 0)
    }));
    // Sort by amount desc
    return arr.sort((a,b) => (b.amount||0) - (a.amount||0));
  }

  function monthKey(dateStr){
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
      if (g.months.size < 2) continue;
      const sortedMonths = Array.from(g.months).sort();
      const latest = sortedMonths[sortedMonths.length-1];
      const amt = g.amounts.get(latest) || 0;
      groups.push({ key: g.key, label: g.label || 'Recurring', amount: amt, active: true });
    }
    return groups.sort((a,b)=> (b.amount||0)-(a.amount||0));
  }
</script>

<main>
  <h1>Predicted Next Month (Rata)</h1>
  <p>Upload a statement PDF to estimate next month installments based on remaining "Rata" series.</p>
  <UploadForm {lang} onResult={onResult} />

  {#if result}
    <section class="summary">
      <div class="total">
        <div class="label">Predicted total next month</div>
        <div class="value">{totalNextMonth.toFixed(2)}</div>
      </div>
    </section>

    <section>
      <h2>By Installment Series</h2>
      {#if rataGroups.length === 0}
        <p>No installments detected.</p>
      {:else}
        <div class="bars">
          {#each rataGroups as g}
            <div class="bar-row">
              <div class="bar-label">
                <div class="name">{g.label}</div>
                <div class="meta">Rata {g.lastN} din {g.totalM} • {g.active ? 'Active' : 'Completed'}</div>
              </div>
              <div class="bar-wrap" title={g.amount.toFixed(2)}>
                <div class="bar" style={`width:${scale(g.amount)}%; background:${g.active ? 'var(--bar-fill)' : 'var(--muted)'};`}></div>
                <div class="bar-value">{g.amount.toFixed(2)}</div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>

    <section>
      <h2>Recurring Charges</h2>
      {#if recurringGroups.length === 0}
        <p>No recurring charges detected.</p>
      {:else}
        <div class="bars">
          {#each recurringGroups as g}
            <div class="bar-row">
              <div class="bar-label">
                <div class="name">{g.label}</div>
                <div class="meta">Recurring • Active</div>
              </div>
              <div class="bar-wrap" title={g.amount.toFixed(2)}>
                <div class="bar" style={`width:${scale(g.amount)}%; background: var(--bar-fill);`}></div>
                <div class="bar-value">{g.amount.toFixed(2)}</div>
              </div>
            </div>
          {/each}
        </div>
      {/else}
    </section>
  {/if}
</main>



<style>
  main { max-width: 1100px; margin: 1rem auto; padding: 0 1rem; }
  h1 { margin: 1rem 0; }
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
</style>
