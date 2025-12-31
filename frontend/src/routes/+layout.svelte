<script>
  import { lang } from '$lib/stores/lang';
  import { onMount } from 'svelte';
  let theme = 'light';
  let selectedLang = 'en';
  let langInitialized = false;

  onMount(() => {
    try {
      const saved = localStorage.getItem('pref:theme');
      theme = saved === 'dark' ? 'dark' : 'light';
      const savedLang = localStorage.getItem('pref:lang');
      if (savedLang === 'ro' || savedLang === 'en') {
        lang.set(savedLang);
        selectedLang = savedLang;
      } else {
        // ensure local matches store
        selectedLang = $lang;
      }
      langInitialized = true;
    } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = theme;
    }
  });

  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = theme;
      try { localStorage.setItem('pref:theme', theme); } catch {}
    }
  }

  $: if (langInitialized) lang.set(selectedLang);
  $: if (langInitialized) { try { localStorage.setItem('pref:lang', selectedLang); } catch {} }
</script>

<header>
  <div class="actions">
    <select class="pill" bind:value={selectedLang} aria-label="Language">
      <option value="en">EN</option>
      <option value="ro">RO</option>
    </select>
    <button class="icon" on:click={toggleTheme} aria-label="Toggle theme">
      {#if theme === 'light'}
        <!-- sun icon -->
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4V2M12 22v-2M4.93 4.93 3.51 3.51M20.49 20.49l-1.42-1.42M4 12H2m20 0h-2M4.93 19.07 3.51 20.49M20.49 3.51l-1.42 1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
        </svg>
      {:else}
        <!-- moon icon -->
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      {/if}
    </button>
    <!-- Settings temporarily disabled
    <a class="icon" href="/settings" aria-label="Settings">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" stroke-width="2"/>
        <path d="M19.4 12a7.4 7.4 0 0 1-.1 1.2l2.1 1.6-2 3.5-2.6-.8c-.6.5-1.2.8-1.9 1.1l-.4 2.7H9.5l-.4-2.7c-.7-.3-1.3-.6-1.9-1.1l-2.6.8-2-3.5 2.1-1.6A7.4 7.4 0 0 1 4.6 12c0-.4 0-.8.1-1.2L2.6 9.2l2-3.5 2.6.8c.6-.5 1.2-.8 1.9-1.1l.4-2.7h3.7l.4 2.7c.7.3 1.3.6 1.9 1.1l2.6-.8 2 3.5-2.1 1.6c.1.4.1.8.1 1.2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </a>
    -->
  </div>
</header>

<slot />

<style>
  :global(html) { color-scheme: light; }
  :global(html[data-theme="dark"]) { color-scheme: dark; }
  :global(body) { background: var(--bg); color: var(--text); font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }

  /* Light theme vars */
  :global(html[data-theme="light"]) {
    --bg: #f8fafc;
    --text: #0f172a;
    --muted: #64748b;
    --primary: #1e88e5;
    --card-bg: #ffffff;
    --border-color: #e2e8f0;
    --th-bg: #f1f5f9;
    --bar-bg: #e5e7eb;
    --bar-fill: #2e7d32;
    --danger: #d32f2f;
    --row-alt: #f8fafc;
    --shadow-color: rgba(0,0,0,0.08);
  }

  /* Dark theme vars */
  :global(html[data-theme="dark"]) {
    --bg: #0b1220;
    --text: #e5e7eb;
    --muted: #93a4b7;
    --primary: #64b5f6;
    --card-bg: #111827;
    --border-color: #1f2937;
    --th-bg: #0f172a;
    --bar-bg: #1f2937;
    --bar-fill: #3ba55c;
    --danger: #ef5350;
    --row-alt: #0f172a;
    --shadow-color: rgba(0,0,0,0.5);
  }

  header { display: flex; justify-content: flex-end; align-items:flex-end; padding: .75rem 1rem; border-bottom: 1px solid var(--border-color); background: var(--card-bg); }
  nav { display: flex; gap: .5rem; }
  nav a { text-decoration: none; color: inherit; }
  .pill { border: 1px solid var(--border-color); border-radius: 999px; padding: .35rem .7rem; background: var(--card-bg); box-shadow: 0 2px 6px var(--shadow-color); }
  .actions { display:flex; align-items:center; gap:.5rem;}
  .icon { display:inline-flex; align-items:center; justify-content:center; width: 34px; height: 34px; border-radius: 999px; border:1px solid var(--border-color); color: inherit; background: var(--card-bg); box-shadow: 0 2px 6px var(--shadow-color); }
</style>
