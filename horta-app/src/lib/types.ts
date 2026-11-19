export type Evidence = 'company_reported' | 'published_research' | 'field_validated' | 'hypothesis' | 'data_gap';
export interface Layer { id: string; name_pt: string; name_en: string; sort: number }
export interface Species {
	id: string; common_name_pt: string; scientific_name: string | null; layer_id: string;
	is_panc: number; grown_by_hdt: number; light_pt: string | null; water_need: 'low' | 'medium' | 'high' | 'unknown';
	soil_pt?: string | null; light_en?: string | null; soil_en?: string | null; harvest_notes_en?: string | null; yield_notes_en?: string | null; notes_en?: string | null; harvest_notes_pt: string | null; yield_notes: string | null; pathogens_notes: string | null;
	layout_notes: string | null; evidence_status: Evidence; notes: string | null;
}
export interface Relation { species_a_id: string; species_b_label: string; relation_type: 'intercrop' | 'companion' | 'plant_under' }
export interface Rule {
	id: string; message_en?: string | null; scenario: 'any' | 'el_nino' | 'la_nina'; condition: { water_access?: string[]; canopy?: string[] };
	species_id: string | null; action: 'avoid' | 'conditional' | 'prefer' | 'practice'; message_pt: string; evidence_status: Evidence;
}
export interface Source { id: string; title: string; limitations: string | null }
export interface SurveyMatch { species_id: string; scientific_name: string; n_records: number; n_municipalities: number; origin: string; use: string }
export interface SurveyCandidate { scientific_name: string; common_name: string; family: string; growth_habit: string; origin: string; use: string; n_records: number; n_municipalities: number }
export interface Seed {
	layers: Layer[]; species: Species[]; relations: Relation[]; rules: Rule[]; sources: Source[];
	survey_matches: SurveyMatch[]; survey_candidates: SurveyCandidate[];
}
export interface Plot { id: string; site_id: string; name: string; updated_at: string }
export interface Obs {
	id: string; plot_id: string; species_id: string | null; observed_on: string; kind: string; quantity: number | null; unit: string | null;
	severity: number | null; note: string | null; photo_blob: Blob | null; user_role: string | null; device_id: string; created_at: string; updated_at: string; synced: 0 | 1;
}
export interface PlanInput { scenario: 'normal' | 'el_nino' | 'la_nina'; water: string; canopy: string }
