<script>
  import { tt } from '$lib/i18n';
  import { lang } from '$lib/stores/lang';
  import { formatAmount } from '$lib/utils/format.js';
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  export let totals = {};
  $: entries = Object.entries(totals || {}).sort((a,b)=> b[1]-a[1]);
  $: grand = entries.reduce((s, [,v])=> s + (Number(v)||0), 0);
  function pick(cat){ dispatch('select', cat); }

    $: _lang = $lang; // rerender on language change
</script>

<section>
  <h2>{tt($lang, 'totals.title')}</h2>
  {#if entries.length === 0}
    <p>{tt($lang, 'totals.empty')}</p>
  {:else}
    <ul class="totals">
      {#each entries as [cat, sum]}
        <li on:click={() => pick(cat)}>
          <span class="cat">{cat}</span>
          <span class="sum">{formatAmount(sum)}</span>
          <div class="bar">
            <div class="fill" style={`width: ${grand ? Math.min(100, (sum/grand)*100) : 0}%`}></div>
          </div>
        </li>
      {/each}
    </ul>
    <div class="grand">
      <strong>{tt($lang, 'totals.grand_total_label')}:</strong> {formatAmount(grand)}
    </div>
  {/if}
  <slot />
  
</section>

<style>
  section { margin: 1rem 0; }
  .totals { list-style: none; padding: 0; margin: .5rem 0; }
  .totals li { display: grid; grid-template-columns: 1fr auto; gap: .5rem 1rem; align-items: center; margin: .35rem 0; cursor: pointer; }
  .bar { grid-column: 1 / -1; background: var(--bar-bg); height: 8px; border-radius: 4px; overflow: hidden; }
  .fill { background: var(--bar-fill); height: 100%; }
  .cat { font-weight: 600; }
  .sum { font-variant-numeric: tabular-nums; }
  .grand { margin-top: .5rem; }
</style>
