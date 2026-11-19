import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// Offline-first SPA: one static bundle + index.html fallback, cached by src/service-worker.ts.
			adapter: adapter({ fallback: 'index.html' }),
			// SvelteKit 3 removed the built-in $lib alias; restore it so imports like '$lib/state.svelte' work.
			alias: { $lib: 'src/lib' }
		})
	]
});
