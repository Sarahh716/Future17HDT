import { db, uid } from './db';
import type { Obs, PlanInput, Plot, Seed } from './types';
import seed from './data/seed.json';

export const SEED = seed as unknown as Seed;
export const app = $state({ role: null as string | null, deviceId: '', plots: [] as Plot[], obs: [] as Obs[], online: true });
export const planInput: PlanInput = $state({ scenario: 'normal', water: 'unknown', canopy: 'medium' });
export const logForm = $state({ plot: '', kind: 'harvest', species: '', qty: '', unit: 'kg', sev: null as number | null, note: '', photo: null as Blob | null });

export async function refresh() {
	app.obs = await db.all<Obs>('observation');
	app.plots = await db.all<Plot>('plot');
}
export async function init() {
	app.online = navigator.onLine;
	app.role = (await db.get<string>('kv', 'role')) ?? null;
	app.deviceId = (await db.get<string>('kv', 'device')) ?? uid();
	await db.put('kv', app.deviceId, 'device');
	if (!(await db.all('plot')).length)
		await db.put('plot', { id: uid(), site_id: 'SITE-0001', name: 'Parcela 1', updated_at: new Date().toISOString() });
	await refresh();
	logForm.plot ||= app.plots[0]?.id ?? '';
}
export async function setRole(r: string) { app.role = r; await db.put('kv', r, 'role'); }
export async function addPlot(name: string) {
	const p: Plot = { id: uid(), site_id: 'SITE-0001', name, updated_at: new Date().toISOString() };
	await db.put('plot', p); await refresh(); logForm.plot = p.id;
}
export async function saveObservation() {
	const now = new Date().toISOString();
	const o: Obs = {
		id: uid(), plot_id: logForm.plot, species_id: logForm.species || null, observed_on: now.slice(0, 10), kind: logForm.kind,
		quantity: logForm.qty === '' ? null : Number(logForm.qty), unit: logForm.qty === '' ? null : logForm.unit,
		severity: logForm.sev, note: logForm.note || null, photo_blob: logForm.photo, user_role: app.role, device_id: app.deviceId,
		created_at: now, updated_at: now, synced: 0
	};
	await db.put('observation', o);
	logForm.qty = ''; logForm.sev = null; logForm.note = ''; logForm.photo = null;
	await refresh();
}
export async function syncNow(): Promise<string | null> {
	const pend = app.obs.filter((o) => !o.synced);
	try {
		const r = await fetch('/api/sync', {
			method: 'POST', headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ device_id: app.deviceId, plots: app.plots, observations: pend.map(({ photo_blob, ...o }) => o) })
		});
		if (!r.ok) throw new Error(String(r.status));
		for (const o of pend) await db.put('observation', { ...o, synced: 1 });
		await refresh();
		return null;
	} catch {
		return 'sync.fail'; // i18n key, translated by the page
	}
}
