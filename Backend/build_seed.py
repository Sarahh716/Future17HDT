"""Builds hdt.db (SQLite) + seed.json from the team's research spreadsheets.
Run:  python3 -I build_seed.py <path-to-Research-folder> <out-dir> [homegarden_data.db]
Principle: nothing is invented. Fields the sources don't state stay NULL ('data_gap').
Rules/extra species taken from the team's AI-written summary docs are labelled 'hypothesis'."""
import sys, re, json, sqlite3, os, openpyxl

RES, OUT = sys.argv[1], sys.argv[2]
HG = sys.argv[3] if len(sys.argv) > 3 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "homegarden_data.db")
HERE = os.path.dirname(os.path.abspath(__file__))

LAYERS = [("ground", "Camada rasteira", "Ground layer", 1),
          ("lower_mid", "Camada média-baixa", "Lower mid-layer", 2),
          ("mid", "Camada média", "Mid-layer", 3),
          ("canopy", "Dossel", "Canopy layer", 4)]
LAYER_MAP = {"Ground Layer": "ground", "Lower Mid-Layer": "lower_mid", "Mid-Layer": "mid", "Canopy Layer": "canopy"}

SOURCES = [
 ("SRC-T01", "Crops Horta da Terra spreadsheet (team research)", "Team research", "Layer, light, soil, pathogens, layout, intercropping for 19 species", "Detail filled for only 3 species (jambu, chicória, cariru); compiled by students, not field-validated", None),
 ("SRC-T02", "How El Niño Changes the Agroforestry Plan (team doc, AI-assisted summary)", "Team doc", "Scenario rules for drought", "AI-assisted summary; hypothesis until validated with Horta da Terra technicians", None),
 ("SRC-T03", "La Niña Affects Agroforestry (team doc, AI-assisted summary)", "Team doc", "Scenario rules for heavy rain", "AI-assisted summary with unverified citations; hypothesis", None),
 ("SRC-T04", "Simple Agroforestry Guide (team doc, AI-assisted summary)", "Team doc", "General layering/soil guidance, extra species", "AI-assisted summary; hypothesis", None),
]

def slug(s): return re.sub(r"\s+", " ", s).strip()

# --- sources from starter workbook ---
wb = openpyxl.load_workbook(f"{RES}/Horta_da_terra_agroforestry_starter_dataset (test).xlsx", data_only=True)
sources = []
for r in wb["Sources"].iter_rows(min_row=2, values_only=True):
    if r[0]: sources.append((r[0], r[1], r[2], r[3], r[4], r[5]))
sources += SOURCES

# --- species from crops spreadsheet ---
ws = openpyxl.load_workbook(f"{RES}/Crops Horta da Terra spreadsheet.xlsx", data_only=True).active
hdr = [c.value for c in ws[1]]
rows = []
for r in ws.iter_rows(min_row=2, values_only=True):
    if not r[1]: continue
    m = re.match(r"(.*?)\s*\((.*)\)\s*$", slug(r[1]))
    common, sci = (m.group(1), m.group(2)) if m else (slug(r[1]), None)
    rows.append(dict(layer=LAYER_MAP[r[0]], common=common, sci=sci, raw=r))

# IDs: keep SP-0001..0006 aligned with starter workbook (jambu, chicory, cariru, ora-pro-nobis, roselle, taioba)
PRESET = {"Acmella oleracea": "SP-0001", "Eryngium foetidum L.": "SP-0002", "Talinum triangulare": "SP-0003",
          "Pereskia aculeata": "SP-0004", "Hibiscus sabdariffa": "SP-0005", "Xanthosoma sagittifolium": "SP-0006"}
PANC = {"Acmella oleracea", "Eryngium foetidum L.", "Talinum triangulare", "Pereskia aculeata", "Hibiscus sabdariffa",
        "Xanthosoma sagittifolium", "Alternanthera sessilis", "Calathea allouia", "Physalis angulata", "Mansoa alliacea"}
GROWN = set(PRESET)  # reported in 2022 partner report (SRC-003)

# hand-structured fields for the three species the team filled in (translated/condensed from the spreadsheet text)
STRUCT = {
 "Acmella oleracea": dict(light_en='Partial shade / dappled light; avoid strong midday sun', harvest_notes_en='Tips can be harvested from ~60 days; keeps producing with frequent harvesting', yield_notes_en='30.53–32.44 g per plant', soil_en='Warm and moist', light_pt="Meia-sombra / luz filtrada; evitar sol forte do meio-dia", water_need="high",
    first_harvest_days=60, harvest_notes_pt="Colheita das pontas a partir de ~60 dias; segue produzindo com colheitas frequentes",
    yield_notes="30,53–32,44 g por planta", soil_pt="Quente e úmido"),
 "Eryngium foetidum L.": dict(light_en='Partial shade (30–70%); full sun stresses the plant and makes it flower early', harvest_notes_en='60–90 days; pick only the larger outer leaves and keep the centre', yield_notes_en='0.036–0.698 g per plant', soil_en='Moist, well-drained, fertile', light_pt="Sombra parcial (30–70%); sol pleno estressa e faz florescer cedo", water_need="medium",
    shade_min_pct=30, shade_max_pct=70, soil_ph_min=5.5, soil_ph_max=7.5, first_harvest_days=60,
    harvest_notes_pt="60–90 dias; colher só folhas externas maiores e manter o miolo",
    yield_notes="0,036–0,698 g por planta", soil_pt="Úmido, bem drenado, fértil"),
 "Talinum triangulare": dict(light_en='Partial shade or cloudy weather; full sun in the dry season causes stress', harvest_notes_en='6–8 weeks; then every 2 weeks (15–20 cuts per year); renew about every 6 months', yield_notes_en='1 kg per plant', soil_en='Moist, well-drained, humus-rich; tolerates some drought', light_pt="Sombra parcial ou tempo nublado; sol pleno na seca causa estresse", water_need="medium",
    drought_tolerance="medium", soil_ph_min=5.5, soil_ph_max=7.5, first_harvest_days=42,
    harvest_notes_pt="6–8 semanas; depois a cada 2 semanas (15–20 cortes/ano); renovar a cada ~6 meses",
    yield_notes="1 kg por planta", soil_pt="Úmido, bem drenado, rico em húmus; tolera alguma seca"),
}
PT_NAMES = {"Chicoria": "Chicória", "Parica": "Paricá", "Espinafre": "Espinafre", "Batata Aria": "Batata-ariá"}

species, relations = [], []
n = 7
for d in rows:
    sid = PRESET.get(d["sci"]) or f"SP-{n:04d}"
    if sid.startswith("SP-") and sid not in PRESET.values(): n += 1
    r = d["raw"]; s = STRUCT.get(d["sci"], {})
    has_detail = any(r[i] for i in range(2, 10))
    species.append(dict(
        id=sid, common_name_pt=PT_NAMES.get(d["common"], d["common"]), scientific_name=d["sci"], layer_id=d["layer"],
        is_panc=int(d["sci"] in PANC), grown_by_hdt=int(d["sci"] in GROWN),
        light_pt=s.get("light_pt"), light_en=s.get("light_en"), soil_en=s.get("soil_en"), water_need=s.get("water_need", "unknown"), drought_tolerance=s.get("drought_tolerance", "unknown"),
        shade_min_pct=s.get("shade_min_pct"), shade_max_pct=s.get("shade_max_pct"),
        soil_ph_min=s.get("soil_ph_min"), soil_ph_max=s.get("soil_ph_max"), soil_pt=s.get("soil_pt"),
        first_harvest_days=s.get("first_harvest_days"), harvest_notes_pt=s.get("harvest_notes_pt"), harvest_notes_en=s.get("harvest_notes_en"), yield_notes=s.get("yield_notes"), yield_notes_en=s.get("yield_notes_en"),
        pathogens_notes=r[6], layout_notes=r[7],
        evidence_status="company_reported" if d["sci"] in GROWN else "hypothesis" if has_detail else "data_gap",
        source_id="SRC-T01", raw_source_row=json.dumps({hdr[i]: r[i] for i in range(1, 10) if r[i]}, ensure_ascii=False),
        notes=("Possível duplicata de Paricá (mesma espécie, Schizolobium parahyba) — confirmar com a equipe." if d["sci"] == "Schizolobium parahyba" else None),
        notes_en=("Possible duplicate of Paricá (same species, Schizolobium parahyba) — confirm with the team." if d["sci"] == "Schizolobium parahyba" else None)))
    # relations (free-text partners, kept verbatim)
    for col, rtype in ((8, "intercrop"), (9, "companion"), (10, "plant_under")):
        if r[col]:
            relations.append(dict(id=f"REL-{len(relations)+1:04d}", species_a_id=sid, species_b_id=None, species_b_label=slug(r[col]),
                                  relation_type=rtype, note=None, evidence_status="hypothesis", source_id="SRC-T01"))

# extra species named in the team's docs (not in the crops sheet) — all 'hypothesis'
EXTRA = [("Açaí", "Euterpe oleracea", "mid", "high", "Precisa de água confiável; só plantar onde há água"),
         ("Cacau", "Theobroma cacao", "mid", "medium", "Plantas jovens precisam de sombra e proteção contra seca"),
         ("Cupuaçu", "Theobroma grandiflorum", "mid", "medium", "Pode precisar de sombra e água extra na seca"),
         ("Castanha-do-Brasil", "Bertholletia excelsa", "canopy", "unknown", "Árvore alta de dossel"),
         ("Ingá", "Inga spp.", "mid", "unknown", "Árvore de crescimento rápido: sombra, poda e cobertura do solo"),
         ("Feijão-guandu", "Cajanus cajan", "lower_mid", "unknown", "Adubo verde: cortar e deixar sobre o solo"),
         ("Mandioca", "Manihot esculenta", "lower_mid", "unknown", "Cultura de ciclo curto; consórcio com folhosas"),
         ("Crotalária", "Crotalaria spp.", "ground", "unknown", "Adubo verde / fixadora de nitrogênio"),
         ("Pimenta-do-reino", "Piper nigrum", "ground", "unknown", "Pode crescer sob plantas mais altas")]
NOTES_EN = {'Açaí': 'Needs a reliable water supply; plant only where there is water', 'Cacau': 'Young plants need shade and protection from drought', 'Cupuaçu': 'May need extra shade and water during dry periods', 'Castanha-do-Brasil': 'Tall canopy tree', 'Ingá': 'Fast-growing tree: shade, pruning and ground cover', 'Feijão-guandu': 'Green manure: cut and leave on the soil', 'Mandioca': 'Short-cycle crop; intercrop with leafy greens', 'Crotalária': 'Green manure / nitrogen fixer', 'Pimenta-do-reino': 'Can grow beneath taller plants'}
extra_ids = {}
for common, sci, layer, water, note in EXTRA:
    sid = f"SP-{n:04d}"; n += 1; extra_ids[common] = sid
    species.append(dict(id=sid, common_name_pt=common, scientific_name=sci, layer_id=layer, is_panc=0, grown_by_hdt=0,
        light_pt=None, light_en=None, soil_en=None, water_need=water, drought_tolerance="unknown", shade_min_pct=None, shade_max_pct=None, soil_ph_min=None,
        soil_ph_max=None, soil_pt=None, first_harvest_days=None, harvest_notes_pt=None, harvest_notes_en=None, yield_notes=None, yield_notes_en=None, pathogens_notes=None,
        layout_notes=None, evidence_status="hypothesis", source_id="SRC-T04", raw_source_row=None, notes=note, notes_en=NOTES_EN[common]))

sp_by_sci = {s["scientific_name"]: s["id"] for s in species}

# ---- homegarden survey (existing Backend/homegarden_data.db) ----
from collections import Counter
def keyof(sci):
    w = re.sub(r"[()]", " ", (sci or "").lower()).split()
    if not w: return None
    return (w[0], None) if len(w) < 2 or w[1] in ("sp", "sp.", "spp", "spp.") else (w[0], w[1].strip("."))
sp_key = {}
for s in species:
    k = keyof(s["scientific_name"])
    if k: sp_key[k] = s["id"]
ALIAS = {("hibiscus", "sabdafira"): "SP-0005", ("spilanthes", "oleraceae"): "SP-0001"}  # survey typo / synonym of Acmella oleracea
_g = {}
for s in species:
    k = keyof(s["scientific_name"])
    if k and k[1]: _g.setdefault(k[0], []).append(s["id"])
genus_map = {g: v[0] for g, v in _g.items() if len(v) == 1}
hg = sqlite3.connect(HG); T = "Dados_disponiveis_EN"
groups = {}
for mun, zone, common, sci, fam, hab, org, use in hg.execute(f'SELECT "Municipality","Zone","Common Name","Scientific name","Family","Growth habit","Origin","Use" FROM {T}'):
    if not sci or not sci.strip(): continue
    g = groups.setdefault(" ".join(sci.split()), dict(mun=set(), zones=Counter(), common=Counter(), fam=fam, hab=Counter(), org=Counter(), use=Counter(), n=0))
    g["mun"].add(mun); g["zones"][zone] += 1; g["common"][(common or "").strip()] += 1; g["hab"][hab] += 1; g["org"][org] += 1; g["use"][use] += 1; g["n"] += 1
survey_rows = []
for sci, g in groups.items():
    k = keyof(sci)
    # exact species -> alias (survey misspellings/synonyms) -> genus-only survey row when the genus is unambiguous in our portfolio
    sid = (ALIAS.get(k) or sp_key.get(k) or (genus_map.get(k[0]) if k[1] is None else None) or sp_key.get((k[0], None))) if k else None
    survey_rows.append((sci, g["common"].most_common(1)[0][0], g["fam"], g["hab"].most_common(1)[0][0], g["org"].most_common(1)[0][0],
                        g["use"].most_common(1)[0][0], g["n"], len(g["mun"]), ", ".join(z for z, _ in g["zones"].most_common()), sid))

A = extra_ids  # shorthand

# transparent rules — every one 'hypothesis' until validated by HdT technicians
RULES = [
 ("R-001","el_nino",{"water_access":["rain_only","unknown"]},A["Açaí"],"conditional",
  "El Niño: açaí precisa de muita água. Plante só onde houver água confiável ou espere a chuva melhorar.","SRC-T02"),
 ("R-002","el_nino",{},A["Cacau"],"conditional","El Niño: cacau pode dar certo, mas as mudas novas precisam de sombra e proteção contra a seca.","SRC-T02"),
 ("R-003","el_nino",{},A["Cupuaçu"],"conditional","El Niño: cupuaçu pode precisar de mais sombra e água nos períodos secos.","SRC-T02"),
 ("R-004","any",{},A["Ingá"],"prefer","Ingá dá sombra, protege o solo e os galhos podados viram cobertura (mulch).","SRC-T02"),
 ("R-005","any",{},A["Feijão-guandu"],"prefer","Guandu: cortar e deixar sobre o solo devolve matéria orgânica e protege contra o sol.","SRC-T04"),
 ("R-006","any",{},None,"practice","Mantenha o solo sempre coberto (folhas, galhos, mulch, plantas baixas). Solo nu esquenta e seca mais rápido.","SRC-T02"),
 ("R-007","el_nino",{},None,"practice","Plante quando houver chuva e umidade no solo — não só pelo calendário. Mudas novas sofrem mais com a seca.","SRC-T02"),
 ("R-008","el_nino",{},None,"practice","Risco de fogo: mantenha aceiros limpos de material seco e deixe água disponível para emergência.","SRC-T02"),
 ("R-009","la_nina",{},A["Cacau"],"conditional","La Niña: mais risco de fungos no cacau (vassoura-de-bruxa, podridão-parda). Pode o dossel para circular o ar.","SRC-T03"),
 ("R-010","la_nina",{},sp_by_sci["Acmella oleracea"],"conditional","Com menos circulação de ar o jambu sofre com fungos (ferrugem-branca, manchas, podridão). Solução da planilha: podar as árvores.","SRC-T01"),
 ("R-011","la_nina",{},None,"practice","Chuva forte atrapalha colheita e transporte, principalmente em várzea. Planeje o escoamento e colha antes dos picos.","SRC-T03"),
 ("R-012","any",{"canopy":["low"]},sp_by_sci["Eryngium foetidum L."],"conditional","Chicória prefere 30–70% de sombra; sol pleno estressa e faz a planta florescer cedo. Plante sob árvores.","SRC-T01"),
 ("R-013","any",{"canopy":["low"]},sp_by_sci["Talinum triangulare"],"conditional","Cariru sofre com sol pleno na seca. Prefira sob copa média/alta (bananeira, ingá).","SRC-T01"),
 ("R-014","any",{"canopy":["low"]},sp_by_sci["Acmella oleracea"],"conditional","Jambu prefere meia-sombra; evite sol forte do meio-dia. Plante sob açaí, cupuaçu ou cacau.","SRC-T01"),
 ("R-015","any",{},None,"practice","Faça análise de solo antes de plantar. O solo da região é ácido e pobre; calagem e fósforo só conforme o resultado.","SRC-T04"),
]

RULES_EN = {'R-001': 'El Niño: açaí needs a lot of water. Plant it only where water is reliable, or wait for rainfall to improve.', 'R-002': 'El Niño: cacao can work, but young seedlings need shade and protection from drought.', 'R-003': 'El Niño: cupuaçu may need more shade and water during dry periods.', 'R-004': 'Ingá gives shade, protects the soil, and pruned branches become mulch.', 'R-005': 'Pigeon pea (guandu): cutting it and leaving it on the soil returns organic matter and protects against the sun.', 'R-006': 'Keep the soil covered at all times (leaves, branches, mulch, low plants). Bare soil heats up and dries out faster.', 'R-007': 'Plant when there is rain and moisture in the soil, not just by the calendar. Young seedlings suffer most from drought.', 'R-008': 'Fire risk: keep firebreaks clear of dry material and keep water available for emergencies.', 'R-009': "La Niña: higher risk of fungal disease in cacao (witches' broom, black pod rot). Prune the canopy so air can circulate.", 'R-010': 'With less air circulation, jambu suffers from fungi (white rust, leaf spots, rot). Fix from the team sheet: prune the trees.', 'R-011': 'Heavy rain disrupts harvest and transport, especially in floodplain (várzea) areas. Plan how to get produce out and harvest before the peaks.', 'R-012': 'Chicória prefers 30–70% shade; full sun stresses it and makes it flower early. Plant under trees.', 'R-013': 'Cariru suffers in full sun during the dry season. Prefer planting under a medium or high canopy (banana, ingá).', 'R-014': 'Jambu prefers partial shade; avoid strong midday sun. Plant under açaí, cupuaçu or cacao.', 'R-015': 'Test the soil before planting. Soils in the region are acidic and poor; add lime and phosphorus only according to the result.'}

# ---- write sqlite ----
os.makedirs(OUT, exist_ok=True)
dbp = f"{OUT}/hdt.db"
if os.path.exists(dbp): os.remove(dbp)
con = sqlite3.connect(dbp)
con.executescript(open(f"{HERE}/schema.sql", encoding="utf-8").read())
con.executemany("INSERT INTO source VALUES (?,?,?,?,?,?)", sources)
con.executemany("INSERT INTO layer VALUES (?,?,?,?)", LAYERS)
SP_COLS = ["id","common_name_pt","scientific_name","layer_id","is_panc","grown_by_hdt","light_pt","light_en","soil_pt","soil_en","water_need","drought_tolerance",
           "shade_min_pct","shade_max_pct","soil_ph_min","soil_ph_max","first_harvest_days","harvest_notes_pt","harvest_notes_en","yield_notes","yield_notes_en",
           "pathogens_notes","layout_notes","evidence_status","source_id","raw_source_row","notes","notes_en"]
con.executemany(f"INSERT INTO species ({','.join(SP_COLS)}) VALUES ({','.join('?'*len(SP_COLS))})",
                [[s[c] for c in SP_COLS] for s in species])
con.executemany("INSERT INTO species_relation (id,species_a_id,species_b_id,species_b_label,relation_type,note,evidence_status,source_id) VALUES (?,?,?,?,?,?,?,?)",
                [[r[k] for k in ("id","species_a_id","species_b_id","species_b_label","relation_type","note","evidence_status","source_id")] for r in relations])
con.executemany("INSERT INTO rule (id,scenario,condition_json,species_id,action,message_pt,message_en,evidence_status,source_id) VALUES (?,?,?,?,?,?,?,'hypothesis',?)",
                [(r[0], r[1], json.dumps(r[2]), r[3], r[4], r[5], RULES_EN[r[0]], r[6]) for r in RULES])
# the one real site we know of (coordinates deliberately blank: 'confirm with company')
con.execute("INSERT INTO site (id,farm_code,municipality,state,water_access,current_land_use,consent_for_data_use,updated_at) VALUES ('SITE-0001','HDT-MAIN (confirmar limites)','Santo Antônio do Tauá','PA','unknown','Agrofloresta regenerativa (modelo)','not_obtained',datetime('now'))")
con.commit()

con.executemany("INSERT INTO homegarden_survey VALUES (?,?,?,?,?,?,?,?,?,?)", survey_rows)
con.commit()

# ---- seed.json for the app ----
def q(sql):
    cur = con.execute(sql); cols = [c[0] for c in cur.description]; return [dict(zip(cols, r)) for r in cur.fetchall()]
seed = dict(layers=q("SELECT * FROM layer ORDER BY sort"), species=q("SELECT * FROM species ORDER BY id"),
            relations=q("SELECT * FROM species_relation"), rules=[dict(r, condition=json.loads(r.pop("condition_json"))) for r in q("SELECT * FROM rule")],
            sources=q("SELECT * FROM source"),
            survey_matches=q("SELECT species_id, scientific_name, n_records, n_municipalities, origin, use FROM homegarden_survey WHERE species_id IS NOT NULL"),
            survey_candidates=q("SELECT scientific_name, common_name, family, growth_habit, origin, use, n_records, n_municipalities FROM homegarden_survey WHERE species_id IS NULL AND use IN ('Food','Food/Medicinal','Shading') AND n_records >= 25 ORDER BY n_records DESC LIMIT 40"), sites=q("SELECT id,farm_code,municipality,state,water_access FROM site"))
json.dump(seed, open(f"{OUT}/seed.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print({t: con.execute(f"SELECT count(*) FROM {t}").fetchone()[0] for t in ("source","layer","species","species_relation","rule","site","homegarden_survey")})
