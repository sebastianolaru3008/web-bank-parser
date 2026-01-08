<script>
  import { onMount } from 'svelte';
  import { env } from '$env/dynamic/public';

  const API_BASE = env.PUBLIC_API_BASE || '';

  let lang = 'en';
  let theme = 'light';
  let rulesLang = 'en';
  let importMode = 'replace';
  let rulesFile = null;
  let uploading = false;
  let uploadMessage = '';
  let uploadError = false;

  onMount(()=>{
    try {
      const savedLang = localStorage.getItem('pref:lang');
      if (savedLang) lang = savedLang;
      rulesLang = lang;
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

  function exportRules() {
    window.open(`${API_BASE}/api/rules/export?lang=${rulesLang}`, '_blank');
  }

  async function importRules() {
    if (!rulesFile) {
      uploadMessage = 'Please select a CSV file first';
      uploadError = true;
      return;
    }
    
    uploading = true;
    uploadMessage = '';
    uploadError = false;

    const formData = new FormData();
    formData.append('file', rulesFile);
    formData.append('lang', rulesLang);
    formData.append('mode', importMode);

    try {
      const res = await fetch(`${API_BASE}/api/rules/import`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }
      
      uploadMessage = `Successfully imported ${data.imported} rules. Total: ${data.count} rules.`;
      uploadError = false;
      rulesFile = null;
      // Reset file input
      const fileInput = document.getElementById('rules-file-input');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      uploadMessage = err.message || 'Import failed';
      uploadError = true;
    } finally {
      uploading = false;
    }
  }

  function handleFileSelect(e) {
    const files = e.target.files;
    if (files && files.length > 0) {
      rulesFile = files[0];
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
    <h2>Preferences</h2>
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

  <section class="card">
    <h2>Rules Management</h2>
    <p class="hint">Import or export categorization rules as CSV files. Format: <code>pattern,category</code></p>
    
    <div class="row">
      <label>Rules Language</label>
      <select bind:value={rulesLang}>
        <option value="en">English</option>
        <option value="ro">Română</option>
      </select>
    </div>

    <div class="rules-section">
      <h3>Export Rules</h3>
      <p class="hint">Download current rules as a CSV file.</p>
      <button class="secondary" on:click={exportRules}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Export Rules CSV
      </button>
    </div>

    <div class="rules-section">
      <h3>Import Rules</h3>
      <p class="hint">Upload a CSV file with rules.</p>
      
      <div class="row">
        <label>Import Mode</label>
        <select bind:value={importMode}>
          <option value="replace">Replace all rules</option>
          <option value="merge">Merge with existing</option>
        </select>
      </div>

      <div class="file-input-row">
        <input 
          type="file" 
          id="rules-file-input"
          accept=".csv,text/csv"
          on:change={handleFileSelect}
        />
      </div>

      <button class="primary" on:click={importRules} disabled={uploading}>
        {#if uploading}
          Uploading...
        {:else}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Import Rules CSV
        {/if}
      </button>

      {#if uploadMessage}
        <p class="message" class:error={uploadError} class:success={!uploadError}>
          {uploadMessage}
        </p>
      {/if}
    </div>
  </section>
</main>

<style>
  main { max-width: 800px; margin: 1rem auto; padding: 0 1rem; }
  .topbar { display:flex; justify-content:flex-start; }
  .back { display:inline-flex; align-items:center; gap:.35rem; border: 1px solid var(--border-color); border-radius: 999px; padding: .3rem .6rem; background: var(--card-bg); color: var(--text); box-shadow: 0 2px 6px var(--shadow-color); }
  .back svg { display:block; }
  h1 { margin: 1rem 0; }
  h2 { margin: 0 0 1rem 0; font-size: 1.1rem; color: var(--text); }
  h3 { margin: 0 0 0.5rem 0; font-size: 0.95rem; color: var(--text); }
  .card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem 1.25rem; box-shadow: 0 8px 24px var(--shadow-color); margin-bottom: 1rem; }
  .row { display: grid; grid-template-columns: 160px 1fr; gap: .75rem; align-items: center; margin: .75rem 0; }
  label { color: var(--muted); }
  select { padding: .4rem .5rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-bg); color: var(--text); }
  .actions { display:flex; justify-content:flex-end; }
  button { padding: .5rem .8rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--primary); color: #fff; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem; }
  button:disabled { opacity: 0.6; cursor: not-allowed; }
  button.secondary { background: var(--card-bg); color: var(--text); }
  button.secondary:hover { background: var(--hover-bg, #f0f0f0); }
  button.primary { background: var(--primary); color: #fff; }
  .hint { font-size: 0.85rem; color: var(--muted); margin: 0.5rem 0; }
  .hint code { background: var(--code-bg, #f4f4f4); padding: 0.1rem 0.3rem; border-radius: 4px; font-size: 0.8rem; }
  .rules-section { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color); }
  .file-input-row { margin: 0.75rem 0; }
  .file-input-row input[type="file"] { width: 100%; padding: 0.5rem; border: 1px dashed var(--border-color); border-radius: 8px; background: var(--card-bg); }
  .message { padding: 0.5rem 0.75rem; border-radius: 8px; margin-top: 0.75rem; font-size: 0.9rem; }
  .message.error { background: #fee2e2; color: #dc2626; }
  .message.success { background: #dcfce7; color: #16a34a; }
</style>
