<script lang="ts">
	import { page } from '$app/state';
	import { SEED } from '$lib/state.svelte';
	import { L, t, tr } from '$lib/i18n.svelte';
	import { canSpeak, evClass, icon, speak } from '$lib/ui';
	const s = $derived(SEED.species.find((x) => x.id === page.params.id));
	const layer = $derived(SEED.layers.find((l) => l.id === s?.layer_id));
	const rel = $derived(SEED.relations.filter((r) => r.species_a_id === s?.id));
	const rules = $derived(SEED.rules.filter((r) => r.species_id === s?.id));
	const survey = $derived(SEED.survey_matches.filter((m) => m.species_id === s?.id));
	const rows = $derived(
		s
			? ([
					['f.layer', layer ? L(layer, 'name') : null], ['f.light', L(s, 'light')],
					['f.water', s.water_need !== 'unknown' ? t('water.' + s.water_need) : null], ['f.soil', L(s, 'soil')],
					['f.harvest', L(s, 'harvest_notes')], ['f.yield', L(s, 'yield_notes')],
					['f.disease', s.pathogens_notes], ['f.layout', s.layout_notes], ['f.note', L(s, 'notes')]
				] as [string, string | null][]).filter(([, v]) => v)
			: []
	);
	const spoken = $derived(s ? `${s.common_name_pt}. ${L(s, 'light') ?? ''} ${L(s, 'harvest_notes') ?? ''}` : '');
</script>

{#if !s}
	<p>{t('plant.notfound')}</p>
{:else}
	<div class="card">
		<h3>{icon(s)} {s.common_name_pt}</h3>
		<div class="sci">{s.scientific_name}</div>
		<div><span class="tag {evClass(s.evidence_status)}">{t('ev.' + s.evidence_status)}</span>{#if s.is_panc}<span class="tag">PANC</span>{/if}</div>
		<table><tbody>{#each rows as [k, v] (k)}<tr><th>{t(k)}</th><td>{v}</td></tr>{/each}</tbody></table>
		{#if !s.light_pt && !s.harvest_notes_pt}<p class="note">{t('plant.nodata')}</p>{/if}
		{#if canSpeak() && (s.light_pt || s.harvest_notes_pt)}
			<button class="ghost" onclick={() => speak(spoken)}>{t('plant.listen')}</button>
		{/if}
	</div>
	{#if survey.length}
		<div class="card">
			<h3>{t('survey.title')}</h3>
			{#each survey as m (m.scientific_name)}
				<p>{t('survey.line', m.n_records, m.n_municipalities, tr('origin', m.origin), tr('use', m.use))}</p>
			{/each}
			<p class="note">{t('survey.note')}</p>
		</div>
	{/if}
	{#if rel.length}
		<div class="card">
			<h3>{t('rel.title')}</h3>
			{#each rel as r, i (i)}<p><b>{t('rel.' + r.relation_type)}:</b> {r.species_b_label}</p>{/each}
			<p class="note">{t('rel.note')}</p>
		</div>
	{/if}
	{#if rules.length}
		<div class="card">
			<h3>{t('alerts.title')}</h3>
			{#each rules as r (r.id)}
				<p>{t('sc.' + r.scenario)} {L(r, 'message')} <span class="tag {evClass(r.evidence_status)}">{t('ev.' + r.evidence_status)}</span></p>
			{/each}
		</div>
	{/if}
{/if}
