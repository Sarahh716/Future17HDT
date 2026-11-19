<script lang="ts">
	import { goto } from '$app/navigation';
	import { addPlot, app, logForm, saveObservation, SEED } from '$lib/state.svelte';
	import { t } from '$lib/i18n.svelte';
	import { KINDS } from '$lib/ui';
	const needsQty = $derived(['harvest', 'survival'].includes(logForm.kind));
	const needsSev = $derived(['pest_disease', 'weather_event'].includes(logForm.kind));
	async function newPlot() { const n = prompt(t('log.plotPrompt')); if (n) await addPlot(n); }
	async function save() {
		if (!logForm.plot) return alert(t('log.pickPlot'));
		await saveObservation();
		goto('/sincronizar');
	}
	function pickPhoto(e: Event) { logForm.photo = (e.target as HTMLInputElement).files?.[0] ?? null; }
</script>

<label for="plot">{t('log.plot')}</label>
<div class="row" style="flex-wrap:nowrap">
	<select id="plot" bind:value={logForm.plot}>{#each app.plots as p (p.id)}<option value={p.id}>{p.name}</option>{/each}</select>
	<button class="ghost" onclick={newPlot}>{t('log.newPlot')}</button>
</div>
<label for="x">{t('log.what')}</label>
<div class="row">
	{#each KINDS as [k, i] (k)}<button class="chip big" class:on={logForm.kind === k} onclick={() => (logForm.kind = k)}><span class="ic">{i}</span>{t('kind.' + k)}</button>{/each}
</div>
<label for="sp">{t('log.species')}</label>
<select id="sp" bind:value={logForm.species}>
	<option value="">{t('log.none')}</option>
	{#each SEED.species as s (s.id)}<option value={s.id}>{s.common_name_pt}</option>{/each}
</select>
{#if needsQty}
	<label for="qty">{t('log.qty')}</label>
	<div class="row" style="flex-wrap:nowrap">
		<input id="qty" type="number" inputmode="decimal" bind:value={logForm.qty} />
		<!-- value stays the stable id (kg/g/unid./maços) so saved records don't depend on the UI language -->
		<select style="width:110px" bind:value={logForm.unit}>{#each ['kg', 'g', 'unid.', 'maços'] as u (u)}<option value={u}>{t('unit.' + u)}</option>{/each}</select>
	</div>
{/if}
{#if needsSev}
	<label for="x">{t('log.sev')}</label>
	<div class="sev">
		{#each [[0, '🙂'], [1, '😐'], [2, '😟'], [3, '😱']] as [v, e] (v)}<button class:on={logForm.sev === v} onclick={() => (logForm.sev = v as number)}>{e}</button>{/each}
	</div>
{/if}
<label for="photo">{t('log.photo')}</label>
<input id="photo" type="file" accept="image/*" capture="environment" onchange={pickPhoto} />
<label for="note">{t('log.note')}</label>
<textarea id="note" rows="2" bind:value={logForm.note}></textarea>
<button class="primary" onclick={save}>{t('log.save')}</button>
