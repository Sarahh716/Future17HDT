<script lang="ts">
	import { app, syncNow } from '$lib/state.svelte';
	import { t } from '$lib/i18n.svelte';
	const pend = $derived(app.obs.filter((o) => !o.synced));
	let msgKey = $state('');
	async function send() { msgKey = (await syncNow()) ?? ''; }
	function exportJson() {
		const data = { device_id: app.deviceId, plots: app.plots, observations: app.obs.map(({ photo_blob, ...o }) => o) };
		const a = document.createElement('a');
		a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
		a.download = 'hdt-registros.json'; a.click();
	}
</script>

<div class="card">
	<h3>{app.online ? t('sync.online') : t('sync.offline')}</h3>
	<p>{#if pend.length}{@html t('sync.pending', pend.length)}{:else}{t('sync.done')}{/if}</p>
	<button class="primary" disabled={!pend.length} onclick={send}>{t('sync.send')}</button>
	<p class="note">{msgKey ? t(msgKey) : ''}</p>
</div>
<div class="card">
	<h3>{t('sync.longTitle')}</h3>
	<p class="note">{t('sync.longText')}</p>
	<button class="ghost" onclick={exportJson}>{t('sync.export')}</button>
</div>
