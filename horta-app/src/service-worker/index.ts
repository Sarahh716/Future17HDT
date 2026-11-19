// Offline-first service worker (SvelteKit 3 API: https://svelte.dev/docs/kit/service-workers)
//  1. precache the app files best-effort (one bad URL must not fail the whole install)
//  2. take control immediately (skipWaiting + clients.claim) so the very first visit is covered
//  3. runtime-cache every same-origin GET that succeeds, so any route chunk the user has opened works offline later
//  4. offline page navigations get the cached SPA shell
import { self } from '$app/service-worker';
import { version } from '$app/env';
import { immutable, assets } from '$app/manifest';
import { resolve } from '$app/paths';

const CACHE = `hdt-${version}`;
const ASSETS = [...immutable.map((a) => resolve(a.path)), ...assets.map((a) => resolve(a.path))];
const SHELL = resolve('/');

self.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE);
			const results = await Promise.allSettled([...ASSETS, SHELL].map((u) => cache.add(u)));
			const failed = results.filter((r) => r.status === 'rejected').length;
			if (failed) console.warn(`[hdt-sw] ${failed} of ${results.length} files could not be precached`);
			await self.skipWaiting();
		})()
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
			await self.clients.claim();
		})()
	);
});

self.addEventListener('fetch', (event) => {
	const req = event.request;
	if (req.method !== 'GET') return;
	const url = new URL(req.url);
	if (url.origin !== location.origin || url.pathname.startsWith('/api/')) return;

	async function respond(): Promise<Response> {
		const cache = await caches.open(CACHE);
		const hashed = url.pathname.includes('/_app/immutable/') || ASSETS.includes(url.pathname);
		if (hashed) {
			const hit = await cache.match(url.pathname);
			if (hit) return hit; // hashed files never change -> cache first
		}
		try {
			const res = await fetch(req);
			if (res.ok && req.mode !== 'navigate') void cache.put(url.pathname, res.clone());
			return res;
		} catch (err) {
			const hit = req.mode === 'navigate' ? await cache.match(SHELL) : await cache.match(url.pathname);
			if (hit) return hit;
			throw err;
		}
	}
	event.respondWith(respond());
});
