<script>
  import { tt } from '$lib/i18n';
  import { lang } from '$lib/stores/lang';
  import { formatAmount } from '$lib/utils/format.js';
  export let items = [];
  export let filterCategory = '';
  export let search = '';
  let sortKey = 'date';
  let sortDir = 'desc';

  $: _lang = $lang; // rerender on language change

  function setSort(k) {
    if (sortKey === k) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    else { sortKey = k; sortDir = 'asc'; }
  }

  function norm(s) { return String(s ?? '').toLowerCase(); }

  $: filtered = (items || []).filter((it)=>{
    const catOk = !filterCategory || it.category === filterCategory;
    const q = norm(search);
    const searchOk = !q || norm(it.description).includes(q) || norm(it.category).includes(q);
    return catOk && searchOk;
  });

  function cmp(a,b){
    const va = a?.[sortKey];
    const vb = b?.[sortKey];
    if (sortKey === 'amount') return (Number(va)||0) - (Number(vb)||0);
    return String(va||'').localeCompare(String(vb||''));
  }

  $: shown = [...filtered].sort((a,b)=> sortDir==='asc' ? cmp(a,b) : cmp(b,a));
  $: sumShown = shown.reduce((s,it)=> s + (Number(it.amount)||0), 0);
</script>

<div class="controls">
  <slot name="filters" />
  <div class="count">{shown.length} {tt($lang, 'table.items')}</div>
  <div style="flex:1"></div>
  <slot name="actions" />
  
</div>

<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th><button on:click={() => setSort('date')}>{tt($lang, 'table.date')} {sortKey==='date' ? (sortDir==='asc' ? '▲' : '▼') : ''}</button></th>
        <th><button on:click={() => setSort('description')}>{tt($lang, 'table.description')} {sortKey==='description' ? (sortDir==='asc' ? '▲' : '▼') : ''}</button></th>
        <th class="num"><button on:click={() => setSort('amount')}>{tt($lang, 'table.amount')} {sortKey==='amount' ? (sortDir==='asc' ? '▲' : '▼') : ''}</button></th>
        <th><button on:click={() => setSort('category')}>{tt($lang, 'table.category')} {sortKey==='category' ? (sortDir==='asc' ? '▲' : '▼') : ''}</button></th>
      </tr>
    </thead>
    <tbody>
      {#each shown as it}
        <tr>
          <td>{it.date}</td>
          <td>{it.description}</td>
          <td class="num">{formatAmount(it.amount)}</td>
          <td>{it.category}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  {#if shown.length === 0}
    <div class="empty">{tt($lang, 'table.no_items')}</div>
  {/if}
  {#if shown.length > 0}
    <div class="summary">{tt($lang, 'table.sum_shown')}: <strong>{formatAmount(sumShown)}</strong></div>
  {/if}
</div>

<style>
  .controls { display: flex; gap: .5rem; align-items: center; margin: .5rem 0; }
  .count { opacity: .7; }
  .table-wrap { width: 100%; overflow: auto; border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-bg); }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: .5rem .6rem; border-bottom: 1px solid var(--border-color); text-align: left; }
  th .num, td.num { text-align: right; }
  thead th { position: sticky; top: 0; background: var(--th-bg); }
  th button { background: none; border: none; cursor: pointer; font-weight: 600; }
  .empty { padding: 1rem; text-align: center; }
  tbody tr:nth-child(odd) { background: var(--row-alt); }
  .summary { padding: .5rem .75rem; border-top: 1px solid var(--border-color); display:flex; justify-content:flex-end; }
</style>
