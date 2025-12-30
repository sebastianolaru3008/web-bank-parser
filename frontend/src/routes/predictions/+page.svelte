<script>
  import UploadForm from '$lib/components/UploadForm.svelte';

  let lang = 'en';
  let result = null;
  let rataGroups = [];
  let totalNextMonth = 0;
  const MAX_BAR = 1000; // scale reference

  function scale(val){
    const v = Number(val)||0;
    return Math.min(100, Math.round(v / MAX_BAR * 100));
  }

  function onResult(data) {
    result = data;
    const groups = buildRataGroups(data.items || []);
    rataGroups = groups;
    totalNextMonth = groups.filter(g => g.active).reduce((sum, g) => sum + (g.amount || 0), 0);
  }

  function buildRataGroups(items) {
    const re = /\bRata\s+(\d+)\s+din\s+(\d+)\b/i;
    const groups = new Map();
    for (const it of items) {
      const d = String(it.description || '');
      const m = d.match(re);
      if (!m) continue;
      const n = parseInt(m[1], 10);
      const total = parseInt(m[2], 10);
      // Group key: strip the Rata prefix and trim
      const label = d.replace(re, '').replace(/^\s*;?\s*/, '').trim() || 'Installment';
      const key = label.toLowerCase();
      const amt = Number(it.amount) || 0;
      const existing = groups.get(key);
      if (!existing) {
        groups.set(key, { key, label, amount: amt, lastN: n, totalM: total });
      } else {
        // keep max N and latest amount
        existing.lastN = Math.max(existing.lastN, n);
        existing.amount = amt || existing.amount;
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
                <div class="bar" style={`width:${scale(g.amount)}%; background:${g.active ? '#2e7d32' : '#888'};`}></div>
                <div class="bar-value">{g.amount.toFixed(2)}</div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</main>



<style>
  main { max-width: 1100px; margin: 1rem auto; font-family: system-ui, Arial, sans-serif; padding: 0 1rem; }
  h1 { margin: 1rem 0; }
  section { margin-top: 1rem; }
  .summary { display: flex; gap: 1rem; }
  .total { background: #f5f5f5; border: 1px solid #e2e2e2; border-radius: 8px; padding: .75rem 1rem; }
  .total .label { font-size: .9rem; opacity: .8; }
  .total .value { font-size: 1.4rem; font-weight: 700; }
  .bars { display: flex; flex-direction: column; gap: .5rem; }
  .bar-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; align-items: center; }
  .bar-label .name { font-weight: 600; }
  .bar-label .meta { font-size: .85rem; opacity: .7; }
  .bar-wrap { position: relative; height: 28px; background: #fafafa; border: 1px solid #e2e2e2; border-radius: 6px; overflow: hidden; display:flex; align-items:center; }
  .bar { height: 100%; }
  .bar-value { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); font-weight: 600; }
</style>
