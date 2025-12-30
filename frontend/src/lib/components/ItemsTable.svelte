<script>
  export let items = [];
  export let filterCategory = '';
  export let search = '';
  let sortKey = 'date';
  let sortDir = 'desc';

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
</script>

<div class="controls">
  <slot name="filters" />
  <div class="count">{shown.length} items</div>
  <div style="flex:1"></div>
  <slot name="actions" />
  
</div>

<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th><button on:click={() => setSort('date')}>Date</button></th>
        <th><button on:click={() => setSort('description')}>Description</button></th>
        <th class="num"><button on:click={() => setSort('amount')}>Amount</button></th>
        <th><button on:click={() => setSort('category')}>Category</button></th>
      </tr>
    </thead>
    <tbody>
      {#each shown as it}
        <tr>
          <td>{it.date}</td>
          <td>{it.description}</td>
          <td class="num">{(Number(it.amount)||0).toFixed(2)}</td>
          <td>{it.category}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  {#if shown.length === 0}
    <div class="empty">No items</div>
  {/if}
</div>

<style>
  .controls { display: flex; gap: .5rem; align-items: center; margin: .5rem 0; }
  .count { opacity: .7; }
  .table-wrap { width: 100%; overflow: auto; border: 1px solid #e2e2e2; border-radius: 8px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: .5rem .6rem; border-bottom: 1px solid #eee; text-align: left; }
  th .num, td.num { text-align: right; }
  thead th { position: sticky; top: 0; background: var(--th-bg, #fafafa); }
  th button { background: none; border: none; cursor: pointer; font-weight: 600; }
  .empty { padding: 1rem; text-align: center; }
</style>
