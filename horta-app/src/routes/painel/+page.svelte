<script lang="ts">
	import { app, SEED } from '$lib/state.svelte';
	import { t } from '$lib/i18n.svelte';
	import { KINDS } from '$lib/ui';
	const count = (k: string) => app.obs.filter((o) => o.kind === k).length; // (no Object.groupBy: older Android WebViews lack it)
	const kg = $derived(app.obs.filter((o) => o.kind === 'harvest' && o.unit === 'kg').reduce((a, o) => a + Number(o.quantity ?? 0), 0));
	const recent = $derived(app.obs.slice(-8).reverse());
	const kindIcon = (k: string) => KINDS.find((x) => x[0] === k)?.[1] ?? '';
</script>

<div class="card">
	<h3>{t('panel.summary')}</h3>
	<table>
		<tbody>
			<tr><th>{t('panel.records')}</th><td>{app.obs.length}</td></tr>
			<tr><th>{t('panel.unsent')}</th><td>{app.obs.filter((o) => !o.synced).length}</td></tr>
			<tr><th>{t('panel.harvest')}</th><td>{kg} kg</td></tr>
			{#each KINDS as [k, i] (k)}{#if count(k)}<tr><th>{i} {t('kind.' + k)}</th><td>{count(k)}</td></tr>{/if}{/each}
		</tbody>
	</table>
</div>
<div class="card">
	<h3>{t('panel.recent')}</h3>
	<table>
		<tbody>
			{#each recent as o (o.id)}
				<tr>
					<td>{o.observed_on}</td>
					<td>{kindIcon(o.kind)} {SEED.species.find((s) => s.id === o.species_id)?.common_name_pt ?? ''}</td>
					<td>{app.plots.find((p) => p.id === o.plot_id)?.name ?? ''}</td>
					<td>{o.synced ? '✅' : '⏳'}</td>
				</tr>
			{:else}
				<tr><td>{t('panel.empty')}</td></tr>
			{/each}
		</tbody>
	</table>
</div>
<div class="lock">{@html t('panel.lock')}</div>
<h3 style="margin-top:20px">{t('panel.sources')}</h3>
{#each SEED.sources as s (s.id)}<p class="note"><b>{s.id}</b> {s.title}{#if s.limitations} — <i>{s.limitations}</i>{/if}</p>{/each}
