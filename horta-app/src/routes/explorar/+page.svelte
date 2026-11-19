<script lang="ts">
	import { SEED } from '$lib/state.svelte';
	import { t, tr } from '$lib/i18n.svelte';
	let only = $state<'all' | 'Native'>('all');
	const list = $derived(SEED.survey_candidates.filter((c) => only === 'all' || c.origin === only));
</script>

<p class="note">{@html t('explore.intro')}</p>
<div class="row">
	<button class="chip" class:on={only === 'all'} onclick={() => (only = 'all')}>{t('explore.all')}</button>
	<button class="chip" class:on={only === 'Native'} onclick={() => (only = 'Native')}>{t('explore.native')}</button>
</div>
{#each list as c (c.scientific_name)}
	<div class="card">
		<h3>{c.common_name}</h3>
		<div class="sci">{c.scientific_name}</div>
		<div><span class="tag">{tr('origin', c.origin)}</span><span class="tag">{tr('use', c.use)}</span><span class="tag">{tr('habit', c.growth_habit)}</span></div>
		<p class="note">{t('explore.counts', c.n_records, c.n_municipalities)}</p>
	</div>
{/each}
