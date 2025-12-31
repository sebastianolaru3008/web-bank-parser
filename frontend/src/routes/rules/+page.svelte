<script>
  import { PUBLIC_API_BASE } from '$env/static/public';
  import { tt } from '$lib/i18n';
  import { lang as uiLang } from '$lib/stores/lang';
  import { onMount } from 'svelte';
  let lang = 'en';
  let rules = [];
  let loading = false;
  let error = '';
  let newPattern = '';
  let newCategory = '';
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

  $: if (typeof window !== 'undefined') loadRules();

  onMount(() => {
    try {
      // default rules language to current UI language on first load
      lang = $uiLang === 'ro' ? 'ro' : 'en';
    } catch {}
  });

  async function addRule() {
    error = '';
    const payload = { lang, pattern: newPattern, category: newCategory };
    try {
      const res = await fetch(`${API}/rules`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add rule');
      rules = data.rules || [];
      newPattern = ''; newCategory = '';
    } catch (e) { error = e.message; }
  }

  async function removeRule(pattern) {
    error = '';
    try {
      const url = new URL(`${API}/rules`, window.location.origin);
      url.searchParams.set('lang', lang);
      url.searchParams.set('pattern', pattern);
      const res = await fetch(url.toString(), { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove rule');
      rules = data.rules || [];
    } catch (e) { error = e.message; }
  }
</script>

<main>
  <section class="card">
    <h1>{tt($uiLang, 'rules.title')}</h1>

    <div class="controls">
      <div class="field">
        <label>{tt($uiLang, 'rules.language')}</label>
        <select bind:value={lang}>
          <option value="en">{tt($uiLang, 'rules.lang.en')}</option>
          <option value="ro">{tt($uiLang, 'rules.lang.ro')}</option>
        </select>
      </div>
      <div style="flex:1"></div>
      <button class="outline" on:click={loadRules} disabled={loading}>{loading ? tt($uiLang, 'rules.loading') : tt($uiLang, 'rules.reload')}</button>
    </div>

    <div class="grid">
      <div class="field">
        <label>{tt($uiLang, 'rules.new_pattern')}</label>
        <input placeholder={tt($uiLang, 'rules.placeholder.pattern')} bind:value={newPattern} />
      </div>
      <div class="field">
        <label>{tt($uiLang, 'rules.category')}</label>
        <input placeholder={tt($uiLang, 'rules.placeholder.category')} bind:value={newCategory} />
      </div>
      <div class="actions">
        <button class="primary" on:click={addRule} disabled={loading || !newPattern}>{tt($uiLang, 'rules.add_rule')}</button>
      </div>
    </div>

  {#if error}
    <p class="err">{error}</p>
  {/if}

  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>{tt($uiLang, 'rules.pattern')}</th><th>{tt($uiLang, 'rules.category')}</th><th></th></tr>
      </thead>
      <tbody>
        {#each rules as r}
          <tr>
            <td>{r.pattern}</td>
            <td>{r.category}</td>
            <td class="right"><button class="danger" on:click={() => removeRule(r.pattern)}>{tt($uiLang, 'rules.remove')}</button></td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if rules.length === 0 && !loading}
      <div class="empty">{tt($uiLang, 'rules.empty')}</div>
    {/if}
  </div>
  </section>
</main>

<style>
  main { max-width: 1000px; margin: 1rem auto; padding: 0 1rem; }
  .card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem 1.5rem; box-shadow: 0 8px 24px var(--shadow-color); }
  h1 { margin: 0 0 .75rem; }
  .controls { display: flex; gap: .75rem; align-items: center; margin: .5rem 0 1rem; }
  .field { display: grid; gap: .35rem; }
  .field label { color: var(--muted); }
  select { width: 220px; padding: .5rem .6rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-bg); color: var(--text); }
  .outline { padding:.5rem .7rem; border:1px solid var(--border-color); background: var(--card-bg); border-radius:8px; color: var(--text); }
  .grid { display:grid; grid-template-columns: 1fr 1fr auto; gap: .75rem; align-items:end; margin-bottom: 1rem; }
  input { width: 100%; padding: .5rem .6rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-bg); color: var(--text); }
  .actions { display:flex; }
  .primary { padding:.5rem .7rem; border-radius:8px; border:1px solid var(--border-color); background: var(--primary); color:#fff; }
  .table-wrap { border: 1px solid var(--border-color); border-radius: 8px; overflow: auto; background: var(--card-bg); }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: .5rem .6rem; border-bottom: 1px solid var(--border-color); text-align: left; }
  thead th { position: sticky; top: 0; background: var(--th-bg); }
  tbody tr:nth-child(odd) { background: var(--row-alt); }
  td.right { text-align: right; }
  .danger { padding:.35rem .6rem; border-radius:6px; border:1px solid var(--border-color); background: var(--card-bg); color: var(--danger); }
  .empty { padding: 1rem; text-align: center; }
  .err { color: var(--danger); }
</style>
