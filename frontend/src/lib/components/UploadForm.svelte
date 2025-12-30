<script>
  import { PUBLIC_API_BASE } from '$env/static/public';
  export let lang = 'en';
  export let onResult = (r)=>{};
  let file;
  let password = '';
  let showPassword = false; // auto-prompt from backend
  let usePassword = false;  // user-controlled toggle
  let loading = false;
  let error = '';
  const API = (PUBLIC_API_BASE || '/api').replace(/\/$/, '');

  async function submit() {
    error = '';
    if (!file) { error = 'Please select a CSV or Excel file'; return; }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('lang', lang);
    loading = true;
    try {
      if (password) fd.append('password', password);
      const res = await fetch(`${API}/parse`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        if (data && (data.needPassword || data.wrongPassword)) {
          showPassword = true;
          if (data.wrongPassword) error = 'Wrong password. Please try again.';
          else error = 'This PDF is encrypted. Please enter the password.';
          return;
        }
        throw new Error(data.error || 'Request failed');
      }
      onResult(data);
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="upload">
  <label>
    Language
    <select bind:value={lang}>
      <option value="en">English</option>
      <option value="ro">Română</option>
    </select>
  </label>

  <label>
    File
    <input type="file" accept="application/pdf,.pdf" on:change={(e)=>file=e.target.files[0]} />
  </label>

  <label style="display:inline-flex; align-items:center; gap:.4rem;">
    <input type="checkbox" bind:checked={usePassword} /> Use password
  </label>

  {#if showPassword || usePassword}
    <label>
      Password
      <input type="password" bind:value={password} placeholder="PDF password" />
    </label>
  {/if}

  <button on:click={submit} disabled={loading}>
    {loading ? 'Parsing…' : 'Parse'}
  </button>

  {#if error}
    <span class="err">{error}</span>
  {/if}
</div>

<style>
  .upload { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
  label { display: inline-flex; gap: .5rem; align-items: center; }
  .err { color: #c00; }
  button { padding: .5rem .9rem; }
  select, input[type="file"] { padding: .25rem; }
  select { min-width: 9rem; }
  .upload { margin: .5rem 0 1rem; }
  .upload > * { margin-right: .5rem; }
</style>
