<script>
  import ItemsTable from '$lib/components/ItemsTable.svelte';
  import Totals from '$lib/components/Totals.svelte';
  import UploadForm from '$lib/components/UploadForm.svelte';

  let lang = 'en';
  let result = null;
  let error = '';
  let search = '';
  let selectedCategory = '';

  function onResult(data) {
    error = '';
    result = data;
    const firstCat = Object.keys(data.totals || {})[0];
    selectedCategory = '';
  }

  function clearAll() {
    result = null;
    search = '';
    selectedCategory = '';
  }

  function exportCSV() {
    import('$lib/utils/csv.js').then(({ toCSV, download }) => {
      const csv = toCSV(result.items, ['date', 'description', 'amount', 'category']);
      download(`bank-records-${new Date().toISOString().slice(0,10)}.csv`, csv);
    });
  }
</script>

<main>
  <h1>Bank Record Parser</h1>

  <UploadForm {lang} onResult={onResult} />

  {#if error}
    <p style="color:red">{error}</p>
  {/if}

  {#if result}
    <Totals totals={result.totals}>
      <div style="display:flex; gap:.5rem; align-items:center;">
        <label>Filter by category
          <select bind:value={selectedCategory}>
            <option value="">All</option>
            {#each Object.keys(result.totals || {}) as cat}
              <option value={cat}>{cat}</option>
            {/each}
          </select>
        </label>
        <label>Search
          <input placeholder="Text in description/category" bind:value={search} />
        </label>
      </div>
    </Totals>

    <ItemsTable items={result.items} filterCategory={selectedCategory} search={search}>
      <div slot="actions" style="display:flex; gap:.5rem;">
        <button on:click={exportCSV}>Export CSV</button>
        <button on:click={clearAll}>Clear</button>
      </div>
    </ItemsTable>
  {/if}
</main>

<style>
  main { max-width: 1100px; margin: 1rem auto; font-family: system-ui, Arial, sans-serif; padding: 0 1rem; }
  h1 { margin: 1rem 0; }
  input, select, button { padding: .4rem .5rem; }
</style>
