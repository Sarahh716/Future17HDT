// Transparent recommendation engine: reads the `rule` table (seed.rules). No ML. Pure function -> easy to unit-test.
import type { PlanInput, Rule, Species } from './types';
export const RANK: Record<string, number> = { avoid: 3, conditional: 2, prefer: 1 };

export function applies(r: Rule, i: PlanInput): boolean {
	if (r.scenario !== 'any' && r.scenario !== i.scenario) return false;
	const c = r.condition ?? {};
	if (c.water_access && !c.water_access.includes(i.water)) return false;
	if (c.canopy && !c.canopy.includes(i.canopy)) return false;
	return true;
}
export function plan(rules: Rule[], species: Species[], i: PlanInput) {
	const fired = rules.filter((r) => applies(r, i));
	const bySp = new Map<string, Rule[]>();
	fired.filter((r) => r.species_id).forEach((r) => bySp.set(r.species_id!, [...(bySp.get(r.species_id!) ?? []), r]));
	const items = species
		.map((s) => {
			const rs = bySp.get(s.id) ?? [];
			return { s, rs, top: rs.reduce((m, r) => Math.max(m, RANK[r.action] ?? 0), 0) };
		})
		.filter((x) => x.top > 0)
		.sort((a, b) => b.top - a.top);
	return { items, practices: fired.filter((r) => !r.species_id) };
}
