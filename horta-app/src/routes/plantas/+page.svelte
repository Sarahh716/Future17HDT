<script lang="ts">
	import { page } from '$app/state';
	import { SEED } from '$lib/state.svelte';
	import { L, t } from '$lib/i18n.svelte';
	import { evClass, icon, LAYER_ICON } from '$lib/ui';
	const layer = $derived(page.url.searchParams.get('camada') ?? SEED.layers[0].id);
	const list = $derived(SEED.species.filter((s) => s.layer_id === layer));
</script>

<div class="row">
	{#each SEED.layers as l (l.id)}
		<a class="chip big" class:on={l.id === layer} href="/plantas?camada={l.id}"><span class="ic">{LAYER_ICON[l.id]}</span>{L(l, 'name')}</a>
	{/each}
</div>
{#each list as s (s.id)}
	<a class="card" style="display:block;text-decoration:none;color:inherit" href="/plantas/{s.id}">
		<h3>{icon(s)} {s.common_name_pt} {#if s.is_panc}<span class="tag">PANC</span>{/if}</h3>
		<div class="sci">{s.scientific_name}</div>
		<div>
			<span class="tag {evClass(s.evidence_status)}">{t('ev.' + s.evidence_status)}</span>
			{#if s.grown_by_hdt}<span class="tag ok">{t('tag.grows')}</span>{/if}
		</div>
	</a>
{/each}
