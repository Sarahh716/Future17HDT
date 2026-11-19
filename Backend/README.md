# Backend data

- `homegarden_data.db` — original survey (Santarém / Belterra / Mojuí dos Campos; table `Dados_disponiveis_EN`, 5,323 rows). Untouched. (`main_table` is empty.)
- `schema.sql` — app database (SQLite, maps to Postgres): species, layers, relations, transparent rules, sites/plots/observations,
  consent-gated community knowledge, `homegarden_survey` (aggregated from the file above), sync log.
- `build_seed.py` — `python3 -I build_seed.py <Research folder with the team xlsx> <out dir> [homegarden_data.db]` → `hdt.db` + `seed.json`.
- `hdt.db` — generated output (28 species, 15 rules, 175 surveyed species, 17 matched to the portfolio).

Survey matching: exact species, plus genus-only survey rows (Eryngium, Talinum, Inga), plus two fixes (survey "Hibiscus sabdafira" = roselle;
"Spilanthes oleraceae" = jambu). The survey is occurrence/context data from another region — not yield or performance evidence.
