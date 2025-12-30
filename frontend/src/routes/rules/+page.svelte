<script>
  import { PUBLIC_API_BASE } from '$env/static/public';
  let lang = 'en';
  let rules = [];
  let loading = false;
  let error = '';
  const API = (PUBLIC_API_BASE || '/api').replace(/\/$/, '');

  async function loadRules() {
    loading = true; error = '';
    try {
      const res = await fetch(`${API}/rules?lang=${encodeURIComponent(lang)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load rules');
      rules = data.rules || [];
    } catch (e) { error = e.message; }
    finally { loading = false; }
  }

  $: loadRules();
</script>

<main>
  <h1>Rules</h1>

  <div class="controls">
    <label>Language
      <select bind:value={lang}>
        <option value="en">English</option>
        <option value="ro">Română</option>
      </select>
    </label>
    <button on:click={loadRules} disabled={loading}>{loading ? 'Loading…' : 'Reload'}</button>
  </div>

  {#if error}
    <p style="color:red;">{error}</p>
  {/if}

  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Pattern</th><th>Category</th></tr>
      </thead>
      <tbody>
        {#each rules as r}
          <tr>
            <td>{r.pattern}</td>
            <td>{r.category}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if rules.length === 0 && !loading}
      <div class="empty">No rules</div>
    {/if}
  </div>
</main>

<style>
  main { max-width: 900px; margin: 1rem auto; padding: 0 1rem; font-family: system-ui, Arial, sans-serif; }
  .controls { display: flex; gap: .75rem; align-items: center; margin: .5rem 0 1rem; }
  .table-wrap { border: 1px solid #e2e2e2; border-radius: 8px; overflow: auto; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: .5rem .6rem; border-bottom: 1px solid #eee; text-align: left; }
  thead th { background: var(--th-bg, #fafafa); }
  .empty { padding: 1rem; text-align: center; }
  select, button { padding: .4rem .5rem; }
  label { display: inline-flex; gap: .5rem; align-items: center; }
  h1 { margin: 1rem 0; }
</style>
