# horta-app — Horta da Terra field app (SvelteKit, offline-first, PT-BR)

Converted from the `sv create` *library* template to an app: `adapter-static` (SPA, `index.html` fallback), `ssr = false`,
`src/service-worker/index.ts` precaches the whole app so it opens with no connection. No new runtime dependencies.

```sh
npm install      # package.json changed; package-lock.json will be regenerated (use install, not ci, the first time)
npm run dev
npm run build && npm run preview
```

Routes: `/` home · `/plantas` · `/plantas/[id]` · `/planejar` · `/registrar` · `/sincronizar` · `/painel` · `/explorar`.
Data: `src/lib/data/seed.json` is **generated** by `Backend/build_seed.py` — don't edit by hand.
Local storage: IndexedDB (`src/lib/db.ts`), same fields as `Backend/schema.sql`. `/api/sync` doesn't exist yet (the Sync button
fails gracefully; JSON export works).

> Status: written without the ability to run `npm install`/`vite build` — **not yet compiled**. Expect to fix small
> type/Svelte warnings on first run (`npm run check`). Behaviour of the rule engine (`src/lib/plan.ts`) was tested against the seed.
