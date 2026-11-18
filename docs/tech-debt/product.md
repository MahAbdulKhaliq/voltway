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
- **Fix:** reuse the link notice for trims. *(The empty `?car=` part was fixed in 5.2a.)*

### TD-P5 NRCan licence wording for charger data
- **Since:** 2026-11-16, owner decision **B30** (M1). Charger data is used under NLR's terms; NRCan's site terms allow non-commercial reproduction only "as is", and it is unclear whether they cover data reached through the AFDC API.
- **Fix (optional):** email nrcan.copyright-droitdauteur.rncan@canada.ca to confirm transformed, non-commercial reuse with credit is fine; record the answer in `data/sources/src-afdc-ca.json`.

### TD-P6 `adapters_included` is not in the vehicle data model
- **Since:** 2026-11-16, Phase 2 plan (DESIGN-map.md M9).
- **Impact:** "Chargers my car can use" (Phase 1b, checklist 5.2, B28) needs to know which adapters come with a car (e.g. NACS→CCS1) as well as `charge_port` and `supercharger_access`. Without it, a CCS1 car with a bundled adapter can't be shown Superchargers.
- **Fix:** B38 (2026-11-16): 5.2 adds the field to the schema (optional, "Unknown") and the toggle works from `charge_port` + `supercharger_access`. Still to do: research the values with `fill-data-gaps`, then let the toggle use them.

### TD-P7 Which Superchargers are open to non-Teslas (N9)
- **Since:** 2026-11-16, Phase 2 plan (DESIGN-map.md M9).
- **Impact:** AFDC doesn't record per-site non-Tesla access, so every Supercharger shows the same generic note ("access varies by site, check the Tesla app"). Drivers of other cars can't filter to sites they can use.
- **Fix:** look for an open source of per-site access (charger-map.md §7). Tesla's own site list is not openly licensed.

### TD-P13 Open Charge Map duplicate edge cases
- **Since:** 2026-11-18, Phase 6 real-data audit (research/map-audit-2026-11-18-ocm-real.md, W1–W5).
- **Impact:** the place layer can still remove a different network's fast charger next to an AFDC station that shares one plug type (about 10 cases, e.g. OCM 148153, 289433, 299714); a kept OCM station repeats ports its AFDC neighbour already lists (W3); 27 removed sites had CHAdeMO their AFDC match lacks (W5); a few CCS ports at 22–24 kW sit in Level 3 (W4).
- **Fix:** for Level 3 stations in the place layer, also require the same network, same address, a similar name or ≤ 40 m (audit suggestion); needs owner sign-off (duplicate rule change).

### TD-P11 "Stations in view" on phones
- **Since:** 2026-11-16, M12 (B34). The list is offered only over 640 px wide: on phones the filter panel and the station bottom sheet already compete for the screen.
- **Impact:** screen-reader users on phones still can't open a station.
- **Fix:** a phone layout for the list (for example its own sheet, or a tab in the filter sheet), as the owner suggested.

### TD-P12 J1772 adapter note for NACS cars
- **Since:** 2026-11-16 (B42). With "Chargers my car can use" on, a NACS car also sees J1772 sites, since most come with a J1772 → NACS adapter.
- **Impact:** a driver without that adapter isn't told they need one.
- **Fix:** an informational note in the station panel (or the filter panel) for J1772 ports when My car has a NACS port, as the owner suggested.

### TD-P14 Data date on cross-border trips
- **Since:** 2026-11-18, Phase 8 QA (B79, DESIGN-8 Known limits).
- **Impact:** a trip that crosses the border shows only the Canadian charger-data date in the trip panel (`ChargerMap.tsx:984` picks the US date only for US-only trips), though its stops can be in both countries.
- **Fix:** show both dates when the route passes through both countries (for example "Charger data: Canada 2026-11-01, US 2026-11-01"); new wording needs a translated string.

## Closed
- 2026-11-18, Phase 6 (B77): TD-P8 (Open Charge Map as a second charger source) closed. About 580 open-licensed OCM stations fill AFDC gaps, deduplicated in layers, credited per station, refreshed monthly. Hamilton → Vancouver with CCS only now gets past Thunder Bay → Dryden via Ivy Upsala; the Sault Ste. Marie → Marathon gap remains (Ivy White River is marked temporarily unavailable in OCM). Edge cases: TD-P13.
- 2026-11-16, M12: TD-P9 (stations unreachable by keyboard) closed by the "Stations in view" list (B34); phones are TD-P11.
- 2026-11-16: TD-P10 (top Level 2 band label) no longer applies: the owner replaced the power-band boxes with kW range sliders whose top stop is "Max" (B35, M11).
- 2026-11-16, PR #41: "Added to battery" result shown (QA #7); notice for unmatched `?car=` links (QA #15); "Estimated" tag on estimated lines (QA #11).
