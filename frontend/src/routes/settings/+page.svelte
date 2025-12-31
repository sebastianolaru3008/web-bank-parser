<script>
  import { onMount } from 'svelte';

  let lang = 'en';
  let theme = 'light';

  onMount(()=>{
    try {
      const savedLang = localStorage.getItem('pref:lang');
      if (savedLang) lang = savedLang;
      const html = document.documentElement;
      theme = html.dataset.theme || 'light';
    } catch {}
  });

  function save(){
    try { localStorage.setItem('pref:lang', lang); } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = theme;
    }
  }

  function goBack(){
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) window.history.back();
      else window.location.href = '/';
    }
  }
</script>

<main>
  <div class="topbar">
    <button class="back" on:click={goBack} aria-label="Go back">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>Back</span>
    </button>
  </div>
  <h1>Settings</h1>
  <section class="card">
    <div class="row">
      <label>Language</label>
      <select bind:value={lang}>
        <option value="en">English</option>
        <option value="ro">Română</option>
      </select>
    </div>
    <div class="row">
      <label>Theme</label>
      <select bind:value={theme}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
    <div class="actions">
      <button on:click={save}>Save</button>
    </div>
  </section>
</main>

<style>
  main { max-width: 800px; margin: 1rem auto; padding: 0 1rem; }
  .topbar { display:flex; justify-content:flex-start; }
  .back { display:inline-flex; align-items:center; gap:.35rem; border: 1px solid var(--border-color); border-radius: 999px; padding: .3rem .6rem; background: var(--card-bg); color: var(--text); box-shadow: 0 2px 6px var(--shadow-color); }
  .back svg { display:block; }
  h1 { margin: 1rem 0; }
  .card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem 1.25rem; box-shadow: 0 8px 24px var(--shadow-color); }
  .row { display: grid; grid-template-columns: 160px 1fr; gap: .75rem; align-items: center; margin: .75rem 0; }
  label { color: var(--muted); }
  select { padding: .4rem .5rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-bg); color: var(--text); }
  .actions { display:flex; justify-content:flex-end; }
  button { padding: .5rem .8rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--primary); color: #fff; }
</style>
