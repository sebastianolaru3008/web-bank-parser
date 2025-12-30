<script>
  export let totals = {};
  $: entries = Object.entries(totals || {}).sort((a,b)=> b[1]-a[1]);
  $: grand = entries.reduce((s, [,v])=> s + (Number(v)||0), 0);
</script>

<section>
  <h2>Totals</h2>
  {#if entries.length === 0}
    <p>No totals available.</p>
  {:else}
    <ul class="totals">
      {#each entries as [cat, sum]}
        <li>
          <span class="cat">{cat}</span>
          <span class="sum">{(Number(sum)||0).toFixed(2)}</span>
          <div class="bar">
            <div class="fill" style={`width: ${grand ? Math.min(100, (sum/grand)*100) : 0}%`}></div>
          </div>
        </li>
      {/each}
    </ul>
    <div class="grand">
      <strong>Total:</strong> {(Number(grand)||0).toFixed(2)}
    </div>
  {/if}
  <slot />
  
</section>

<style>
  section { margin: 1rem 0; }
  .totals { list-style: none; padding: 0; margin: .5rem 0; }
  .totals li { display: grid; grid-template-columns: 1fr auto; gap: .5rem 1rem; align-items: center; margin: .35rem 0; }
  .bar { grid-column: 1 / -1; background: var(--bar-bg, #eee); height: 8px; border-radius: 4px; overflow: hidden; }
  .fill { background: var(--bar-fill, #2e8b57); height: 100%; }
  .cat { font-weight: 600; }
  .sum { font-variant-numeric: tabular-nums; }
  .grand { margin-top: .5rem; }
</style>
