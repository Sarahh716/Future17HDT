// horta-app/src/lib/recommender.ts
import seedData from './data/seed.json'; // <-- adjust path if your file is ./data.json

export type LayerId = 'emergent' | 'canopy' | 'mid' | 'lower_mid' | 'ground';

export interface SiteInput {
  tempC?: number;          // e.g. 26
  rainMm?: number;         // e.g. 2200
  soilPh?: number;         // e.g. 5.5
  drainage?: 'well_drained' | 'wet' | 'any';
  preferPancs?: boolean;
  primaryCashCropId?: string; // e.g. 'SP-0019' (Açaí) or 'SP-0013' (Banana)
}

export interface Species {
  id: string;
  common_name_pt: string;
  scientific_name: string | null;
  layer_id: LayerId;
  succession_stage: string | null;
  role_in_system: string | null;
  is_panc: number;
  shade_tolerance: string | null;
  drainage_requirement: string | null;
  opt_temp_min: number | null;
  opt_temp_max: number | null;
  abs_temp_min: number | null;
  abs_temp_max: number | null;
  opt_rain_min: number | null;
  opt_rain_max: number | null;
  abs_rain_min: number | null;
  abs_rain_max: number | null;
  soil_ph_min: number | null;
  soil_ph_max: number | null;
  abs_ph_min: number | null;
  abs_ph_max: number | null;
  layout_notes: string | null;
  harvest_notes_en: string | null;
  harvest_notes_pt: string | null;
}

export interface ScoredSpecies {
  species: Species;
  score: number;
  reasons: string[];
  penalties: string[];
  isCompanionMatch: boolean;
}

export interface GuildResult {
  slots: Record<LayerId, ScoredSpecies | null>;
  warnings: string[];
  blueprint: string[];
}

const LAYERS_ORDER: LayerId[] = ['emergent', 'canopy', 'mid', 'lower_mid', 'ground'];

const allSpecies = (seedData.species as Species[]).filter(
  (sp) => Boolean(sp.scientific_name) && (sp.opt_temp_min !== null || sp.soil_ph_min !== null)
);
const allRelations = seedData.relations as Array<{
  species_a_id: string;
  species_b_label: string;
  relation_type: string;
}>;

// Helper: check if a value falls in [optMin, optMax] or [absMin, absMax]
// Helper: score value against [optMin, optMax] and [absMin, absMax] without hiding the plant
function rangeScore(
  label: string,
  val: number | undefined,
  optMin: number | null,
  optMax: number | null,
  absMin: number | null,
  absMax: number | null,
  softLow = 1,
  softHigh = 1
): { pts: number; penalty?: string } {
  if (val === undefined || (optMin === null && optMax === null)) return { pts: 5 };
  if (optMin !== null && optMax !== null && val >= optMin && val <= optMax) return { pts: 20 };

  const effAbsMin = absMin ?? (optMin !== null ? optMin - softLow : null);
  const effAbsMax = absMax ?? (optMax !== null ? optMax + softHigh : null);

  if (effAbsMin !== null && effAbsMax !== null && val >= effAbsMin && val <= effAbsMax) {
    return {
      pts: 10,
      penalty: `${label} outside optimal (${val}; ideal is ${optMin ?? '?'}–${optMax ?? '?'}, tolerated ${effAbsMin}–${effAbsMax}) [−10 pts]`,
    };
  }

  return {
    pts: -25,
    penalty: `${label} out of range (${val}; optimal ${optMin ?? '?'}–${optMax ?? '?'}, max tolerance ${effAbsMin ?? '?'}–${effAbsMax ?? '?'}) [−25 pts]`,
  };
}


function isSoilHealer(sp: Species): boolean {
  const role = (sp.role_in_system || '').toLowerCase();
  return role.includes('nitrogen') || role.includes('biomass');
}

function isCashCrop(sp: Species): boolean {
  return (sp.role_in_system || '').toLowerCase().includes('cash crop');
}

/**
 * 1. Score and rank all compatible species for a given site & optional anchor crop.
 */
export function rankSpeciesForSite(site: SiteInput): ScoredSpecies[] {
  const anchorSp = site.primaryCashCropId
    ? allSpecies.find((s) => s.id === site.primaryCashCropId)
    : undefined;
  const anchorKey = anchorSp ? anchorSp.common_name_pt.toLowerCase().split(/[\s-(]/)[0] : '';
  const anchorText = site.primaryCashCropId
    ? allRelations
        .filter((r) => r.species_a_id === site.primaryCashCropId)
        .map((r) => r.species_b_label.toLowerCase())
        .join(' ')
    : '';

  const results: ScoredSpecies[] = [];

  for (const sp of allSpecies) {
    const reasons: string[] = [];
    const penalties: string[] = [];
    let score = 0;

    // Drainage check (penalty + reason instead of hiding)
    // Drainage check
    if (site.drainage === 'wet' && sp.drainage_requirement === 'strictly_well_drained') {
      score -= 30;
      penalties.push('Drainage mismatch: requires well-drained soil, site is Wet/Várzea [−30 pts]');
    }

    // Climate & soil checks
    const t = rangeScore('Temp', site.tempC, sp.opt_temp_min, sp.opt_temp_max, sp.abs_temp_min, sp.abs_temp_max, 7, 6);
    const r = rangeScore('Rain', site.rainMm, sp.opt_rain_min, sp.opt_rain_max, sp.abs_rain_min, sp.abs_rain_max, 500, 1200);
    const p = rangeScore('pH', site.soilPh, sp.soil_ph_min, sp.soil_ph_max, sp.abs_ph_min, sp.abs_ph_max, 1, 1);

    score += t.pts + r.pts + p.pts;
    if (t.penalty) penalties.push(t.penalty);
    if (r.penalty) penalties.push(r.penalty);
    if (p.penalty) penalties.push(p.penalty);

    if (site.preferPancs && sp.is_panc === 1) {
      score += 12;
      reasons.push('PANC (+12 pts)');
    }
    if (isSoilHealer(sp)) {
      score += 10;
      reasons.push('Soil healer: N-fixer / Biomass (+10 pts)');
    }

    const nameKey = sp.common_name_pt.toLowerCase().split(/[\s-(]/)[0];
    const spText = site.primaryCashCropId
      ? allRelations
          .filter((r) => r.species_a_id === sp.id)
          .map((r) => r.species_b_label.toLowerCase())
          .join(' ')
      : '';

    const isCompanionMatch = Boolean(
      site.primaryCashCropId &&
        sp.id !== site.primaryCashCropId &&
        ((nameKey.length > 3 && anchorText.includes(nameKey)) ||
          (anchorKey.length > 3 && spText.includes(anchorKey)))
    );
    if (isCompanionMatch) {
      score += 15;
      reasons.push('Recommended companion (+15 pts)');
    }

    results.push({ species: sp, score, reasons, penalties, isCompanionMatch });
  }

  return results.sort((a, b) => b.score - a.score);
}

/**
 * 2. Get compatible dropdown options for a single stratum slot (for interactive swapping).
 */
export function getOptionsForLayer(layer: LayerId, site: SiteInput): ScoredSpecies[] {
  return rankSpeciesForSite(site).filter((item) => item.species.layer_id === layer);
}

/**
 * 3. Auto-build a balanced 5-layer syntropic guild.
 */
export function buildRecommendedGuild(
  site: SiteInput,
  activeLayers: LayerId[] = LAYERS_ORDER
): GuildResult {
  const ranked = rankSpeciesForSite(site);
  const slots: Record<LayerId, ScoredSpecies | null> = {
    emergent: null,
    canopy: null,
    mid: null,
    lower_mid: null,
    ground: null,
  };

  // Lock in primary cash crop if the user selected one
  if (site.primaryCashCropId) {
    const anchor = ranked.find((x) => x.species.id === site.primaryCashCropId);
    if (anchor) slots[anchor.species.layer_id] = anchor;
  }

  // Fill only the active layers with top-scoring species
  for (const layer of activeLayers) {
    if (!slots[layer]) {
      slots[layer] = ranked.find((x) => x.species.layer_id === layer) ?? null;
    }
  }

  // Ensure at least 1 nitrogen-fixer / biomass species is in the active layers
  const chosen = Object.values(slots).filter(Boolean) as ScoredSpecies[];
  if (!chosen.some((c) => isSoilHealer(c.species))) {
    const healer = ranked.find(
      (x) =>
        activeLayers.includes(x.species.layer_id) &&
        isSoilHealer(x.species) &&
        x.species.id !== site.primaryCashCropId
    );
    if (healer) slots[healer.species.layer_id] = healer;
  }

  return evaluateGuild(slots);
}

/**
 * 4. Validate any user-edited guild + generate the simple row-spacing blueprint.
 */
export function evaluateGuild(slots: Record<LayerId, ScoredSpecies | null>): GuildResult {
  const chosen = Object.values(slots).filter(Boolean) as ScoredSpecies[];
  const warnings: string[] = [];

  if (!chosen.some((c) => isSoilHealer(c.species))) {
    warnings.push('No nitrogen-fixer or heavy biomass plant selected — add Ingá-cipó, Gliricidia, or Banana to restore soil.');
  }
  if (!chosen.some((c) => isCashCrop(c.species))) {
    warnings.push('No primary cash crop selected — consider adding Açaí, Cupuaçu, Banana, or Jambu for farm income.');
  }
  if (!chosen.some((c) => c.species.is_panc === 1)) {
    warnings.push('No PANC species included — add a ground or lower-mid PANC (e.g., Jambu, Cariru, Taioba).');
  }

  const name = (l: LayerId) => slots[l]?.species.common_name_pt ?? '—';
  const blueprint = [
    `Main Tree Line (every 3–5 m): ${name('emergent')} (Emergent) + ${name('canopy')} (Canopy)`,
    `Between Trees (every 2–3 m): ${name('mid')} (Mid-layer)`,
    `Alley / Raised Beds (1–2 m strips between tree lines): ${name('lower_mid')} (Lower-mid) + ${name('ground')} (Ground cover)`,
  ];

  return { slots, warnings, blueprint };
}