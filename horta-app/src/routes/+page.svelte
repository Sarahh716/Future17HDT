<script lang="ts">
	import { app, SEED, setRole } from '$lib/state.svelte';
	import { t } from '$lib/i18n.svelte';
	import { ROLES } from '$lib/ui';
	const pend = $derived(app.obs.filter((o) => !o.synced).length);
</script>

<div class="row">
	{#each ROLES as [k, i] (k)}
		<button class="chip" class:on={app.role === k} onclick={() => setRole(k)}>{i} {t('role.' + k)}</button>
	{/each}
</div>
<div class="grid">
	<a class="tile" href="/plantas"><span class="ic">🌳</span>{t('nav.plants')}<small>{t('home.species', SEED.species.length)}</small></a>
	<a class="tile" href="/planejar"><span class="ic">🗺️</span>{t('nav.plan')}<small>{t('home.planSub')}</small></a>
	<a class="tile" href="/registrar"><span class="ic">📝</span>{t('nav.log')}<small>{t('home.logSub')}</small></a>
	<a class="tile" href="/sincronizar">
		<span class="ic">🔄</span>{t('title.sync')}{#if pend}<span class="badge">{pend}</span>{/if}
		<small>{pend ? t('home.toSend', pend) : t('home.allSent')}</small>
	</a>
	<a class="tile" href="/explorar" style="grid-column: span 2"><span class="ic">🔭</span>{t('title.explore')}<small>{t('home.exploreSub')}</small></a>
</div>
<p class="note" style="margin-top: 18px">{@html t('home.note')}</p>
