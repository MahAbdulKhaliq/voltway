# Product debt (deferred by decision)

## Open

### TD-P1 Efficiency unit options
- **Since:** 2026-11-16, owner decision **B25** (QA 9.1 #4).
- **Impact:** `database-ui.md` §9 asks for kWh/100 km with Wh/km and mi/kWh options. v1 shows kWh/100 km, or kWh/100 mi when miles are chosen.
- **Fix:** after the map: add the choice to the units setting (`src/lib/units.ts`, `src/i18n/en.json`).

### TD-P2 Should EPA ratings ever take precedence over NRCan?
- **Since:** open question in the handoff, 2026-11-15. **Needs owner.**
- **Impact:** matters once the site covers markets other than Canada (B12).
- **Fix:** decide when a second market is planned; record it in `gaps-and-questions.md`.

### TD-P3 Retired planning folder
- **Since:** 2026-11-15. `G:\Work\Ideating\EV-App-Planning` was replaced by `docs/design/` but still exists. **Needs owner** (delete or keep).

### TD-P4 A bad `?trim=` falls back silently
- **Since:** 2026-11-16, QA re-check. An unmatched car link now shows a notice, but an unmatched trim quietly shows the first trim. An empty `?car=` also ignores the remembered car.
- **Fix:** reuse the link notice for trims; treat an empty `?car=` as absent.

### TD-P5 NRCan licence wording for charger data
- **Since:** 2026-11-16, owner decision **B30** (M1). Charger data is used under NLR's terms; NRCan's site terms allow non-commercial reproduction only "as is", and it is unclear whether they cover data reached through the AFDC API.
- **Fix (optional):** email nrcan.copyright-droitdauteur.rncan@canada.ca to confirm transformed, non-commercial reuse with credit is fine; record the answer in `data/sources/src-afdc-ca.json`.

### TD-P6 `adapters_included` is not in the vehicle data model
- **Since:** 2026-11-16, Phase 2 plan (DESIGN-map.md M9).
- **Impact:** "Chargers my car can use" (Phase 1b, checklist 5.2, B28) needs to know which adapters come with a car (e.g. NACS→CCS1) as well as `charge_port` and `supercharger_access`. Without it, a CCS1 car with a bundled adapter can't be shown Superchargers.
- **Fix:** with 5.2: add `adapters_included` (sourced values, like every figure) to `vehicle-data-model.md` and the schema, then research it with `fill-data-gaps`.

### TD-P7 Which Superchargers are open to non-Teslas (N9)
- **Since:** 2026-11-16, Phase 2 plan (DESIGN-map.md M9).
- **Impact:** AFDC doesn't record per-site non-Tesla access, so every Supercharger shows the same generic note ("access varies by site, check the Tesla app"). Drivers of other cars can't filter to sites they can use.
- **Fix:** look for an open source of per-site access (charger-map.md §7). Tesla's own site list is not openly licensed.

### TD-P8 Open Charge Map as a second charger source (N7)
- **Since:** 2026-11-16, Phase 2 plan (DESIGN-map.md M9).
- **Impact:** v1 uses AFDC only. Networks or sites AFDC lacks are missing from the map.
- **Fix:** later, if gaps show up: add OCM with the duplicate rule in charger-map.md §3 (same network, within ~50 m, overlapping plugs = one station; prefer AFDC). OCM's licence and attribution terms need checking first.

### TD-P9 Stations can't be opened by keyboard
- **Since:** 2026-11-16, Phase 2 QA (M10, report `qa-phase2-2026-11-16.md` in the session notes). Pins are drawn on the map canvas, so keyboard and screen-reader users can filter but can't open a station.
- **Fix (decided 2026-11-16, B34):** a "Stations in view" list in the filter panel (nearest first, capped at 50), each item opening the panel. Being built as M12.

## Closed
- 2026-11-16: TD-P10 (top Level 2 band label) no longer applies: the owner replaced the power-band boxes with kW range sliders whose top stop is "Max" (B35, M11).
- 2026-11-16, PR #41: "Added to battery" result shown (QA #7); notice for unmatched `?car=` links (QA #15); "Estimated" tag on estimated lines (QA #11).
