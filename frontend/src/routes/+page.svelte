<script>
  import UploadForm from '$lib/components/UploadForm.svelte';
  import { tt } from '$lib/i18n';
  import { lang } from '$lib/stores/lang';

  $: _lang = $lang; // trigger rerender when language changes


  function onResult(data) {
    try {
      sessionStorage.setItem('parseResult', JSON.stringify(data));
    } catch {}
    if (typeof window !== 'undefined') {
      window.location.href = '/analysis';
    }
  }
</script>

<main>
  <section class="card">
    <h1>{tt($lang, 'app.upload.title')}</h1>
    <p class="hint">{tt($lang, 'app.upload.hint')}</p>
    <UploadForm onResult={onResult} />
  </section>
</main>

<style>
  main { display:flex; align-items:center; justify-content:center; min-height: calc(100vh - 64px); padding: 1rem; }
  .card { width: 680px; max-width: 100%; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem 1.5rem; box-shadow: 0 8px 24px var(--shadow-color); }
  h1 { margin: 0 0 .5rem; font-size: 1.4rem; }
  .hint { margin: 0 0 1rem; color: var(--muted); }
  /* Controls are styled within UploadForm component */
</style>
