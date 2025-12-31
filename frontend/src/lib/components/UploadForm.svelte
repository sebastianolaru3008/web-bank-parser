<script>
  import { PUBLIC_API_BASE } from '$env/static/public';
  import { tt } from '$lib/i18n';
  import { lang } from '$lib/stores/lang';
  export let onResult = (r)=>{};
  let file;
  let password = '';
  let showPassword = false; // auto-prompt from backend
  let usePassword = false;  // user-controlled toggle
  let loading = false;
  let error = '';
  let dropActive = false;
  let fileInput;
  const API = (PUBLIC_API_BASE || '/api').replace(/\/$/, '');

  

  function setFile(f){
    if (!f) return;
    const name = (f.name||'').toLowerCase();
    const type = (f.type||'').toLowerCase();
    const isPdf = type.includes('pdf') || name.endsWith('.pdf');
    if (!isPdf) { error = tt($lang, 'upload.select_file'); return; }
    file = f; error = '';
  }

  function onFileChange(e){ setFile(e.target.files[0]); }
  function onDragOver(){ dropActive = true; }
  function onDragLeave(){ dropActive = false; }
  function onDrop(e){
    const dt = e.dataTransfer;
    const f = dt?.files?.[0];
    setFile(f);
    dropActive = false;
  }
  function openPicker(){ if (fileInput) fileInput.click(); }

  async function submit() {
    error = '';
    if (!file) { error = tt($lang, 'upload.select_file'); return; }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('lang', $lang);
    loading = true;
    try {
      if (password) fd.append('password', password);
      const res = await fetch(`${API}/parse`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        if (data && (data.needPassword || data.wrongPassword)) {
          showPassword = true;
          if (data.wrongPassword) error = tt($lang, 'upload.err.wrong_password');
          else error = tt($lang, 'upload.err.encrypted');
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

  // Trigger re-render of t() strings when language changes
  $: _lang = $lang;
</script>

<div class="upload">
  

  <div
    class="dropzone"
    class:active={dropActive}
    on:click={openPicker}
    on:dragover|preventDefault={onDragOver}
    on:dragleave={onDragLeave}
    on:drop|preventDefault={onDrop}
    aria-label={tt($lang, 'upload.aria_label')}
    role="button"
    tabindex="0"
    on:keydown={(e)=> (e.key==='Enter'||e.key===' ') && openPicker()}
  >
    <div class="icon">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 16V4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M7 9l5-5 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M4 20h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>
    <div class="dz-text">
      <div class="title">{tt($lang, 'upload.click_to_select')}</div>
      <div class="subtitle">{tt($lang, 'upload.drag_drop_here')}</div>
      {#if file}
        <div class="file-name">{file.name}</div>
      {/if}
    </div>
    <input bind:this={fileInput} type="file" accept="application/pdf,.pdf" on:change={onFileChange} aria-hidden="true" />
  </div>

  <div class="field">
    <label class="row">
      <input type="checkbox" bind:checked={usePassword} />
      <span>{tt($lang, 'upload.use_password')}</span>
    </label>
  </div>

  {#if showPassword || usePassword}
    <div class="field">
      <label for="pwd">{tt($lang, 'upload.password')}</label>
      <input id="pwd" type="password" bind:value={password} placeholder={tt($lang, 'upload.password')} />
    </div>
  {/if}

  <button class="primary" on:click={submit} disabled={loading}>
    {loading ? tt($lang, 'upload.parsing') : tt($lang, 'upload.parse')}
  </button>

  {#if error}
    <div class="err">{error}</div>
  {/if}
</div>

<style>
  .upload { display: grid; gap: .75rem; margin: .5rem 0 1rem; }
  .field { display: grid; gap: .35rem; }
  label { color: var(--muted); }
  input[type="password"] { width: 100%; box-sizing: border-box; display: block; padding: .5rem .6rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-bg); color: var(--text); }
  .row { display: inline-flex; align-items: center; gap: .5rem; color: var(--text); }

  .dropzone { position: relative; width: 100%; max-width: 100%; box-sizing: border-box; border: 2px dashed var(--border-color); border-radius: 12px; background: var(--card-bg); padding: 1rem; display: grid; grid-template-columns: 40px 1fr; gap: .75rem; align-items: center; cursor: pointer; box-shadow: 0 4px 14px var(--shadow-color); }
  .dropzone:hover { border-color: var(--primary); }
  .dropzone.active { border-color: var(--primary); background: color-mix(in oklab, var(--card-bg) 85%, var(--primary)); }
  .dropzone input[type="file"] { position: absolute; inset: 0; opacity: 0; width: 100%; height: 100%; pointer-events: none; }
  .icon { display: inline-flex; align-items: center; justify-content: center; color: var(--primary); }
  .dz-text .title { font-weight: 600; }
  .dz-text .subtitle { color: var(--muted); }
  .dz-text .file-name { margin-top: .25rem; font-size: .9rem; }

  .primary { width: 100%; padding: .6rem .8rem; border-radius: 10px; border: 1px solid var(--border-color); background: var(--primary); color: #fff; }
  .err { color: var(--danger); }
</style>
