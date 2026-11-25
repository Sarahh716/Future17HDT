-- Horta da Terra / Future17 — database schema (SQLite-compatible; maps 1:1 to Postgres)
-- Design rules:
--  * Offline-first: every synced table has uuid id, updated_at, deleted_at, and device_id/origin so
--    records created on a phone can be merged later without ID collisions.
--  * Evidence honesty: nothing is a "recommendation" without an evidence_status label
--    (company_reported | published_research | field_validated | hypothesis | data_gap),
--    mirroring the starter workbook.
--  * Community knowledge is private by default; sharing requires an explicit consent record.

PRAGMA foreign_keys = ON;

-- ---------- reference data (curated by Horta da Terra, read-only in the field) ----------
CREATE TABLE source (
  id            TEXT PRIMARY KEY,            -- SRC-001...
  title         TEXT NOT NULL,
  source_type   TEXT,
  supports      TEXT,
  limitations   TEXT,
  url           TEXT
);

CREATE TABLE layer (                          -- agroforestry strata
  id        TEXT PRIMARY KEY,                -- ground | lower_mid | mid | canopy | emergent
  name_pt   TEXT NOT NULL,
  name_en   TEXT NOT NULL,
  sort      INTEGER NOT NULL
);

CREATE TABLE species (
  id                    TEXT PRIMARY KEY,    -- SP-0001
  common_name_pt        TEXT NOT NULL,
  scientific_name       TEXT,
  layer_id              TEXT REFERENCES layer(id),
  succession_stage      TEXT,                -- Placenta (0-2 yr) | Secondary (2-15 yr) | Climax (15+ yr)
  plant_group           TEXT,                -- leafy | tuber | fruit | tree | green_manure ...
  role_in_system        TEXT,                -- food | PANC | nitrogen_fixer | shade | timber ...
  is_panc               INTEGER DEFAULT 0,
  grown_by_hdt          INTEGER DEFAULT 0,   -- company-reported
  ecocrop_id            INTEGER,
  shade_tolerance       TEXT,
  drainage_requirement  TEXT,
  opt_temp_min          REAL,
  opt_temp_max          REAL,
  abs_temp_min          REAL,
  abs_temp_max          REAL,
  opt_rain_min          REAL,
  opt_rain_max          REAL,
  abs_rain_min          REAL,
  abs_rain_max          REAL,
  light_pt              TEXT,
  light_en              TEXT,
  soil_pt               TEXT,
  soil_en               TEXT,
  water_need            TEXT CHECK (water_need IN ('low','medium','high','unknown')) DEFAULT 'unknown',
  drought_tolerance     TEXT CHECK (drought_tolerance IN ('low','medium','high','unknown')) DEFAULT 'unknown',
  shade_min_pct         INTEGER,             -- NULL = unknown
  shade_max_pct         INTEGER,
  soil_ph_min           REAL,
  soil_ph_max           REAL,
  abs_ph_min            REAL,
  abs_ph_max            REAL,
  first_harvest_days    INTEGER,
  harvest_notes_pt      TEXT,
  harvest_notes_en      TEXT,
  yield_notes           TEXT,
  yield_notes_en        TEXT,
  pathogens_notes       TEXT,
  layout_notes          TEXT,
  evidence_status       TEXT NOT NULL DEFAULT 'data_gap',
  source_id             TEXT REFERENCES source(id),
  source_url            TEXT,
  raw_source_row        TEXT,                -- original (English) spreadsheet text, kept verbatim
  notes                 TEXT,                -- Portuguese (UI language)
  notes_en              TEXT,
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Pairwise relationship (intercrop / companion / "plant beneath"). Directional: A benefits from / sits under B.
CREATE TABLE species_relation (
  id               TEXT PRIMARY KEY,
  species_a_id     TEXT NOT NULL REFERENCES species(id),
  species_b_id     TEXT,                      -- NULL when the partner is only named (not yet a row)
  species_b_label  TEXT,                      -- free-text partner, e.g. "Arugula (Eruca sativa)"
  relation_type    TEXT NOT NULL CHECK (relation_type IN
                    ('intercrop','companion','plant_under','green_manure','unknown')),
  note             TEXT,
  evidence_status  TEXT NOT NULL DEFAULT 'data_gap',
  source_id        TEXT REFERENCES source(id)
);

-- Aggregated from Backend/homegarden_data.db (Santarém / Belterra / Mojuí dos Campos homegarden survey).
-- Occurrence/context evidence only (what people grow, native vs cultivated, use) — NOT yield or performance data,
-- and a different region from Santo Antônio do Tauá.
CREATE TABLE homegarden_survey (
  scientific_name   TEXT PRIMARY KEY,
  common_name       TEXT, family TEXT, growth_habit TEXT, origin TEXT, use TEXT,
  n_records         INTEGER NOT NULL,
  n_municipalities  INTEGER NOT NULL,
  zones             TEXT,
  species_id        TEXT REFERENCES species(id)      -- set when it matches a portfolio species
);

-- Transparent rules behind recommendations. No black box: each rule is a row a technician can read/edit.
CREATE TABLE rule (
  id               TEXT PRIMARY KEY,          -- R-001
  scenario         TEXT NOT NULL,             -- any | el_nino | la_nina
  condition_json   TEXT NOT NULL,             -- e.g. {"water":"rain_only"}
  species_id       TEXT REFERENCES species(id),
  action           TEXT NOT NULL CHECK (action IN ('avoid','conditional','prefer','practice')),
  message_pt       TEXT NOT NULL,
  message_en       TEXT,
  evidence_status  TEXT NOT NULL DEFAULT 'hypothesis',
  source_id        TEXT REFERENCES source(id),
  validated_by     TEXT,                      -- person/role who validated, once field-validated
  validated_at     TEXT
);

-- ---------- field data (created on devices, synced) ----------
CREATE TABLE app_user (
  id          TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('farmer','technician','manager','educator')),
  language    TEXT NOT NULL DEFAULT 'pt-BR',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE site (                           -- one per farm / materially different plot group
  id                 TEXT PRIMARY KEY,
  farm_code          TEXT NOT NULL,           -- code, NOT a personal name
  municipality       TEXT,
  state              TEXT DEFAULT 'PA',
  latitude           REAL,
  longitude          REAL,
  soil_classification TEXT,
  soil_texture       TEXT,
  soil_ph            REAL,
  organic_matter_pct REAL,
  drainage           TEXT,
  water_access       TEXT CHECK (water_access IN ('irrigation','spring_or_stream','rain_only','unknown')) DEFAULT 'unknown',
  current_land_use   TEXT,
  farmer_objectives  TEXT,
  consent_for_data_use TEXT NOT NULL DEFAULT 'not_obtained'
                      CHECK (consent_for_data_use IN ('not_obtained','verbal','written','withdrawn')),
  consent_date       TEXT,
  owner_user_id      TEXT REFERENCES app_user(id),
  device_id          TEXT, updated_at TEXT NOT NULL, deleted_at TEXT
);

CREATE TABLE plot (
  id          TEXT PRIMARY KEY,
  site_id     TEXT NOT NULL REFERENCES site(id),
  name        TEXT NOT NULL,
  area_ha     REAL,
  canopy_cover_pct INTEGER,
  stage       TEXT CHECK (stage IN ('established_saf','transition','new')) ,
  device_id   TEXT, updated_at TEXT NOT NULL, deleted_at TEXT
);

CREATE TABLE planting (                       -- what is planted where
  id            TEXT PRIMARY KEY,
  plot_id       TEXT NOT NULL REFERENCES plot(id),
  species_id    TEXT NOT NULL REFERENCES species(id),
  planting_date TEXT,
  initial_count INTEGER,
  seedling_source TEXT,
  device_id TEXT, updated_at TEXT NOT NULL, deleted_at TEXT
);

CREATE TABLE observation (                    -- the main thing farmers/technicians record offline
  id              TEXT PRIMARY KEY,
  plot_id         TEXT NOT NULL REFERENCES plot(id),
  species_id      TEXT REFERENCES species(id),
  observed_on     TEXT NOT NULL,
  kind            TEXT NOT NULL CHECK (kind IN
                    ('harvest','survival','pest_disease','weather_event','soil','growth','note')),
  quantity        REAL,                        -- e.g. kg harvested, count alive
  unit            TEXT,
  severity        INTEGER CHECK (severity BETWEEN 0 AND 3),   -- 0 none .. 3 severe (icon scale in UI)
  soil_cover_pct  INTEGER,
  note            TEXT,
  photo_ref       TEXT,                        -- local blob key -> uploaded when online
  audio_ref       TEXT,                        -- voice note (for low-literacy use)
  user_id         TEXT REFERENCES app_user(id),
  device_id       TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT
);

-- ---------- traditional / community knowledge: private by default, consent-gated ----------
CREATE TABLE community (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  location_note TEXT,
  agreement_ref TEXT                          -- pointer to the signed data/benefit-sharing agreement
);

CREATE TABLE knowledge_entry (
  id              TEXT PRIMARY KEY,
  community_id    TEXT NOT NULL REFERENCES community(id),
  species_id      TEXT REFERENCES species(id),
  topic           TEXT,                        -- use | planting | season | management | other
  content         TEXT NOT NULL,
  contributor_note TEXT,                       -- who/how they wish to be credited (or 'anonymous')
  visibility      TEXT NOT NULL DEFAULT 'private'
                   CHECK (visibility IN ('private','community_only','htd_internal','public')),
  consent_status  TEXT NOT NULL DEFAULT 'pending'
                   CHECK (consent_status IN ('pending','granted','withdrawn')),
  consent_scope   TEXT,                        -- what exactly was agreed (ownership/access/sharing)
  consent_date    TEXT,
  device_id TEXT, updated_at TEXT NOT NULL, deleted_at TEXT,
  -- hard rule: nothing leaves 'private' without granted consent
  CHECK (visibility = 'private' OR consent_status = 'granted')
);

-- ---------- sync ----------
CREATE TABLE sync_change (                    -- server-side append-only log; clients pull "since seq"
  seq         INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name  TEXT NOT NULL,
  row_id      TEXT NOT NULL,
  op          TEXT NOT NULL CHECK (op IN ('upsert','delete')),
  device_id   TEXT,
  changed_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_obs_plot_date ON observation(plot_id, observed_on);
CREATE INDEX idx_species_layer ON species(layer_id);
CREATE INDEX idx_rel_a ON species_relation(species_a_id);