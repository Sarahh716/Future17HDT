<script lang="ts">
	import { planInput, SEED } from '$lib/state.svelte';
	import { L, t } from '$lib/i18n.svelte';
	import { plan, RANK } from '$lib/plan';
	import { canSpeak, evClass, icon, speak } from '$lib/ui';
	const SCEN = [['normal', '⛅'], ['el_nino', '☀️'], ['la_nina', '🌧️']] as const;
	const WAT = [['rain_only', '🌦️'], ['spring_or_stream', '🏞️'], ['irrigation', '🚿'], ['unknown', '❓']] as const;
	const CAN = [['low', '☀️'], ['medium', '⛅'], ['high', '🌳']] as const;
	const result = $derived(plan(SEED.rules, SEED.species, planInput));
	const ICO: Record<string, string> = { avoid: '⛔', conditional: '⚠️', prefer: '✅' };
	const verdict = (top: number) => Object.keys(RANK).find((k) => RANK[k] === top)!;
	const speech = $derived([...result.items.flatMap((x) => x.rs.map((r) => L(r, 'message'))), ...result.practices.map((r) => L(r, 'message'))].join(' '));
</script>

<label for="x">{t('plan.climate')}</label>
<div class="row">
	{#each SCEN as [v, i] (v)}<button class="chip big" class:on={planInput.scenario === v} onclick={() => (planInput.scenario = v)}><span class="ic">{i}</span>{t('plan.' + v)}</button>{/each}
</div>
<label for="x">{t('plan.water')}</label>
<div class="row">
	{#each WAT as [v, i] (v)}<button class="chip big" class:on={planInput.water === v} onclick={() => (planInput.water = v)}><span class="ic">{i}</span>{t('plan.' + v)}</button>{/each}
</div>
<label for="x">{t('plan.shade')}</label>
<div class="row">
	{#each CAN as [v, i] (v)}<button class="chip big" class:on={planInput.canopy === v} onclick={() => (planInput.canopy = v)}><span class="ic">{i}</span>{t('plan.' + v)}</button>{/each}
</div>

<h2 style="font-size:20px;margin-top:22px">{t('plan.result')} {#if canSpeak()}<button class="ghost" onclick={() => speak(speech)}>{t('plant.listen')}</button>{/if}</h2>
<p class="note">{@html t('plan.note')}</p>
{#each result.items as { s, rs, top } (s.id)}
	{@const a = verdict(top)}
	<div class="card v-{a}">
		<h3>{ICO[a]} {icon(s)} {s.common_name_pt} – {t('plan.' + a)}</h3>
		{#each rs as r (r.id)}<p>{L(r, 'message')} <span class="tag {evClass(r.evidence_status)}">{t('ev.' + r.evidence_status)}</span></p>{/each}
	</div>
{/each}
{#if result.items.length === 0}
	<div class="card v-none">{@html t('plan.none')}</div>
{/if}
<h3>{t('plan.practices')}</h3>
{#each result.practices as r (r.id)}
	<div class="card v-none"><p>{L(r, 'message')} <span class="tag {evClass(r.evidence_status)}">{t('ev.' + r.evidence_status)}</span></p></div>
{/each}
