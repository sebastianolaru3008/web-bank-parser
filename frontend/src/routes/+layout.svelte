<script>
  let theme = 'light';
  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = theme;
    }
  }
</script>

<header>
  <nav>
    <a href="/">Parser</a>
    <a href="/rules">Rules</a>
    <a href="/predictions">Predictions</a>
  </nav>
  <button class="theme" on:click={toggleTheme}>Toggle {theme}</button>
  <a class="health" href="/api/health" target="_blank" rel="noreferrer">API Health</a>
</header>

<slot />

<style>
  :global(html[data-theme="dark"]) { color-scheme: dark; }
  header { display: flex; justify-content: space-between; align-items: center; padding: .75rem 1rem; border-bottom: 1px solid #ddd; }
  nav { display: flex; gap: 1rem; }
  nav a { text-decoration: none; color: inherit; }
  .theme { margin-left: auto; margin-right: .75rem; }
</style>
