<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { app, init } from '$lib/state.svelte';
	import { i18n, initLang, setLang, t } from '$lib/i18n.svelte';
	let { children } = $props();
	const TABS: [string, string, string][] = [['/', '🏠', 'nav.home'], ['/plantas', '🌳', 'nav.plants'], ['/planejar', '🗺️', 'nav.plan'], ['/registrar', '📝', 'nav.log'], ['/painel', '📊', 'nav.panel']];
	const TITLES: Record<string, string> = { '/': 'title.app', '/plantas': 'nav.plants', '/planejar': 'nav.plan', '/registrar': 'nav.log', '/sincronizar': 'title.sync', '/painel': 'nav.panel', '/explorar': 'title.explore' };
	const path = $derived(page.url.pathname.replace(/\/$/, '') || '/');
	const title = $derived(t(TITLES[path] ?? (path.startsWith('/plantas/') ? 'title.plant' : 'title.app')));
	const active = (p: string) => (p === '/' ? path === '/' || path === '/sincronizar' : path.startsWith(p));
	onMount(() => {
		initLang();
		init();
		const on = () => (app.online = true), off = () => (app.online = false);
		addEventListener('online', on); addEventListener('offline', off);
		return () => { removeEventListener('online', on); removeEventListener('offline', off); };
	});
</script>

<header>
	{#if path !== '/'}<button id="back" aria-label={t('back')} onclick={() => history.back()}>←</button>{/if}
	<h1>{title}</h1>
	<button class="lang" aria-label="Language / Idioma" onclick={() => setLang(i18n.lang === 'pt' ? 'en' : 'pt')}>
		<b class:on={i18n.lang === 'pt'}>PT</b> | <b class:on={i18n.lang === 'en'}>EN</b>
	</button>
	<span class="pill" class:off={!app.online}>{app.online ? t('net.on') : t('net.off')}</span>
</header>
<main>{@render children()}</main>
<nav id="tabs">
	{#each TABS as [href, ic, key] (href)}
		<a {href} class:on={active(href)}><span>{ic}</span>{t(key)}</a>
	{/each}
</nav>
