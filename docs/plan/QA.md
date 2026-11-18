# Phase 1 QA guide

A standalone guide for verifying Phase 1 with no memory of how it was built. Read these first:

- `docs/plan/DESIGN.md` (the build plan) and `CLAUDE.md` (the rules)
- Planning docs in `docs/design/`: `vehicle-data-model.md`, `data-sources.md`, `charging-curve-viewer.md`, `database-ui.md`, `phase1-stack.md`. **Detailed docs win over `overview.md`.**

Report every gap: what you checked, what you expected (with doc + section), what you saw.

**Scope (owner decision B21, 2026-11-15):** the first QA run covers **Phase 1a** only: the items tagged [1a] in `CHECKLIST.md`. Cars tab filters and sorts, the first-load picker and My car, Compare, and template calibration are **Phase 1b** (after the charger map). Report a missing 1b feature as "deferred (1b)", not as a gap. Also check the later owner decisions B18–B20 (accordions and numbered sources, cost and units, themes and side nav) in `gaps-and-questions.md`.

---

## 1. Build and tests

| # | Check | How |
|---|-------|-----|
| B1 | Clean install works | `npm ci` |
| B2 | Data validates | `npm run validate` exits 0 |
| B3 | Tests pass | `npm test` |
| B4 | Site builds | `npm run build`; `dist/` exists; `public/data/index.json` and `public/data/cars/*.json` exist |
| B5 | CI runs the same | Latest PR on GitHub shows the CI workflow green |
| B6 | Deploys | Vercel production URL loads; a PR has a preview URL |

## 2. Data integrity (vehicle-data-model.md §3–§7)

| # | Requirement | How to check | Edge cases to try |
|---|-------------|--------------|-------------------|
| D1 | No bare numbers | Inspect `public/data/cars/*.json`: every figure is `{value, unit, kind, source_id}` | Add a bare number to a copy of a variant file; `npm run validate` must fail |
| D2 | Every `source_id` resolves | Each id exists in `data/sources/` | Use a made-up id; validate must fail |
| D3 | Source URLs are specific | No homepage-only URL without `low_confidence` | |
| D4 | Kinds limited to the 7 in §3 | grep `kind` values | Use `"kind": "guess"`; validate must fail |
| D5 | "unknown" allowed and distinct | A field set to `"unknown"` validates and shows as "Unknown" | Heat pump has 4 states incl. `optional` |
| D6 | Curves | ≥2 points, sorted by SoC, exactly one display default per variant | One-point curve, unsorted curve, two defaults: each fails |
| D7 | Units metric | Wh/km, km, kWh, kW only in data | NRCan Wh/km = kWh/100 km × 10 on a sample row vs `sources/nrcan/` CSV |
| D8 | Crosswalk | `crosswalk/crosswalk.csv` has our id, source, source key, method, confirmed | Set a row to `confirmed=false`; that source's values must drop out of the build |
| D9 | `sold_in_canada` | True only for variants with a confirmed NRCan row | |
| D10 | Precedence (§7 + 2026-11-15 decision) | Range: NRCan → EPA → manufacturer → tested → estimated. Battery/DC/AC: direct OEM → tested → manufacturer via OpenEV → Chargeprice. Curves: tested → community → manufacturer → estimated | Find a car with values from several sources; confirm the default shown and the rest listed as "other figures" |
| D11 | Tested never replaces rated | Range shows rated as default, tested alongside | |
| D12 | Conflict flag | Two same-kind values >5% apart are flagged | Edit one value to 6% off; flag appears. 4% off: no flag |
| D13 | Chargeprice | Measured curves are `tested` with Fastned chain noted; **default curves are absent** (skipped) | Check the import log lists skipped ones |
| D14 | Estimated curves | Generated from template × `dc_max_kw`, have a `basis` note, never default when a measured curve exists | Unknown chemistry uses NMC template for its voltage class and says so |
| D15 | Derived numbers not stored | No 10–80% time / km per 10 min in data files | |

## 3. Charging maths (charging-curve-viewer.md §3)

Check by hand with a simple case: a 70 kWh usable battery, flat 100 kW curve, 10→80%.
- Energy added = 49 kWh; time = 29.4 min; average kW = 100.
- With a 50 kW charger: time = 58.8 min; lost to limits = 29.4 min.
- km added at 200 Wh/km = 245 km; km per 10 min = 245 / 29.4 × 10 ≈ 83.3.

| # | Check | Edge cases |
|---|-------|-----------|
| M1 | Results above match the app/tests | Start = end SoC; 0% start; 100% end |
| M2 | Linear interpolation between points | SoC between two uneven points |
| M3 | No loss factor; energy labelled "added to battery" | |
| M4 | Estimated results rounded to nearest 5 min with "~" | |

## 4. Screens (database-ui.md, charging-curve-viewer.md)

Use `npm run dev` or the deployed site. Test at desktop and phone width (375 px), light and dark.

| # | Requirement | Doc |
|---|-------------|-----|
| U1 | First load shows "Which EV do you drive, or want to?" with search + make→model→year→variant; trim optional; "Just browsing" goes to Cars | database-ui §3 |
| U2 | My car saved; header chip: change / go to page / forget | §3 |
| U3 | Storage blocked (private window or disabled): site works, forgets on reload | §3 |
| U4 | Header: Cars, Compare (n), My car, km\|mi. **No Map or Trip links** | §2, user-flows §5 |
| U5 | Browse: cards default, table toggle; every MVP filter in §4 incl. Sold in Canada **on** by default; sorts incl. 10–80% and km per 10 min (uncapped); estimated badge in list | §4 |
| U6 | Car page URL `/cars/make/model/year/variant`; variant/trim selectors change URL; sections in §5 order | §5 |
| U7 | Key tiles each carry a source badge | §5, §7 |
| U8 | Badge: kind text, opens to source/date/link + other figures; ⚠ for conflicts; grey "Unknown"; estimated style | §7 |
| U9 | Curve viewer inputs: curve dropdown, SoC sliders (default 10→80), charger presets 50/100/150/250/350 + custom + "No limit", range basis (highway default) | viewer §2 |
| U10 | Results panel: time, km added, km per 10 min, average kW, lost to limits (only when capped), curve badge | §4 |
| U11 | More detail: peak + SoC, time above 100/150/200 kW, raw points, conditions, source link | §4 |
| U12 | Chart: solid line (dashed + tag if estimated), limit line, shaded delivered area inside window only, draggable window guides, hover readout, SoC↔time toggle | §5 |
| U13 | Warm-battery note; estimated banner with explanation | §7, §9 |
| U14 | Compare: up to 4 (5th refused), URL `/compare?cars=…`, overlay with shared settings, table sorted by km per 10 min, best value with icon + bold, "only differences", mixed-quality note, one colour per car | database-ui §6, viewer §6 |
| U15 | About & sources: credits for NRCan (OGL-Canada), OpenEV Data (CDLA-Permissive-2.0), Chargeprice (MIT attribution) | database-ui §2 |
| U16 | km/mi switch changes every distance; efficiency options | §9 |
| U17 | Accessibility: colour never the only cue; chart readable as a table | §8 |

## 5. Translatable text (U5)

| # | Check | How |
|---|-------|-----|
| T1 | No hard-coded user-facing strings | grep `src/components` and `src/pages` for literal English text in markup; all should go through `t()` |
| T2 | Missing key fails a test | Remove a key from `src/i18n/en.json`; `npm test` fails |

## 6. Rules and process

| # | Check |
|---|-------|
| P1 | Every design change made during build is reflected in the matching planning doc and in `gaps-and-questions.md` |
| P2 | All CHECKLIST.md items ticked are genuinely done; stubs are noted |
| P3 | Data refresh workflow opens a PR on a diff and nothing otherwise |

---

## Results

| ID | Pass / Fail | Notes |
|----|-------------|-------|
| B1–B6 | | |
| D1–D15 | | |
| M1–M4 | | |
| U1–U17 | | |
| T1–T2 | | |
| P1–P3 | | |

---

# Phase 2 QA guide: charger map

Standalone checks for the charger map against [DESIGN-map.md](DESIGN-map.md) and `docs/design/charger-map.md` (detailed doc wins), with owner decisions B26–B29 in `docs/design/gaps-and-questions.md` §12. Dev server: `.claude/launch.json` "voltway-dev" (port 4321). Clear localStorage before and after UI checks.

## 1. Build and tests

| # | Check | How |
|---|-------|-----|
| MB1 | Unit tests pass | `npx vitest run` |
| MB2 | Validate, type-check and build pass | `npm run validate`, `npx astro check`, `npm run build` |
| MB3 | Map files exist and are small | `public/data/map/l3.json`, `l2.json`, `meta.json`; gzip each (`gzip -c f \| wc -c`), under ~2 MB |
| MB4 | No unsourced station | the output check fails the build if a station lacks the AFDC `source_id` (try removing one in a scratch copy) |

## 2. Data rules (vision.md "Power bands", charger-map.md §3, §6)

| # | Check | How |
|---|-------|-----|
| MD1 | Level comes from the source's classification, not kW | find a DC station under 25 kW in `stations.json`; it is Level 3 |
| MD2 | kW range includes both ends; "Max" means no limit (B35) | read `tests/map-filter.test.ts`; a port exactly on the min and on the max matches, one just outside does not |
| MD3 | Missing kW shows only while the level's slider covers its full range (B35) | test + a real station with no `power_kw` |
| MD4 | A mixed site shows when any port matches the level, range and plug | test + filter check in the browser |
| MD5 | Private, Level 1-only and planned stations are dropped | count them in the raw pull vs `stations.json` |
| MD6 | Temporarily unavailable kept, with expected date when given | find a `T` station |
| MD7 | Sanity checks stop the update | tests: >10 % drop, >2 % missing required fields |
| MD8 | API host is developer.nlr.gov; key comes from env / secret, never committed | grep the repo for the key and for `nrel.gov` |

## 3. Refresh workflow (B27)

| # | Check | How |
|---|-------|-----|
| MW1 | Manual run with changes opens a PR, runs the CI steps itself and merges it | Actions → charger-refresh → Run workflow; check the PR and Vercel deploy |
| MW2 | No change = no PR | re-run right after MW1 |
| MW3 | A failed check leaves the PR open and fails the run | run on a test branch with a simulated drop |

## 4. Map screen (charger-map.md §2, §4–§7; B26, B28, B29)

| # | Check |
|---|-------|
| MU1 | `/` is the map; nav shows Map, Charging, Cars, About; `/charging` works |
| MU2 | Attribution shows © OpenStreetMap contributors and OpenFreeMap |
| MU3 | First visit opens on southern Ontario/Québec; a moved view is restored after reload |
| MU4 | Clusters show counts; clicking one zooms in |
| MU5 | Level 3 pins are bolts, Level 2 pins plugs (not colour alone); temporarily unavailable pins greyed with a mark |
| MU6 | Defaults: Level 3 on, Level 2 off; each slider at its full range ("Any power"); all four plugs on |
| MU7 | The kW slider appears only under a ticked level; stops are L2 0/3.6/7.2/11.5/19.2/Max and L3 0/50/100/150/250/350/Max; the range is written in words; arrow keys move a handle one stop; the handles can't cross; narrowing it shows the unknown-power note (B35) |
| MU8 | Filter choices persist after reload |
| MU9 | Level 2 data is requested only once Level 2 is first ticked (Network tab) |
| MU10 | Station panel: name, network, level badge; port lines like "2 × CCS1 · 180 kW"; access + customers-only / limited-hours warning; pricing or "Not listed"; status, with the expected date only if it is in the future (B32); Google and Apple Maps links; "Data: NRCan / NLR AFDC · updated {date}" |
| MU11 | Supercharger sites show the generic Tesla note; Destination sites the customers-only note; no My car toggle (B28) |
| MU12 | Locate me asks only on click and centres the map; denied shows a message; nothing stored |
| MU13 | No place search box (B29) |
| MU14 | Phone width 375 px: bottom sheet, no sideways scroll; dark mode readable; filters and panel usable by keyboard |
| MU15 | No console errors; all new text comes from `src/i18n/en.json` |
| MU16 | About lists AFDC/NRCan, OpenFreeMap and OSM credits |
| MU17 | "Stations in view" (over 640 px): the toggle opens a list of matching stations in view, nearest the centre first, at most 50 with a "more" line; it updates after a pan; Tab + Enter on an item opens the station panel and centres the map; the list isn't offered at 375 px (B34) |
| MU18 | A temporarily unavailable station shows its expected date only when it is in the future (B32); after Locate me, a later pan saves the view (B33) |

## 5. Rules and process

| # | Check |
|---|-------|
| MP1 | B26–B35 recorded in `gaps-and-questions.md` and matching docs |
| MP2 | Ticked Phase 2 checklist items are genuinely done; stubs noted |
| MP3 | No map link or feature beyond the design (no network filter, planned toggle, OCM, routing) |

## Phase 2 results

| ID | Pass / Fail | Notes |
|----|-------------|-------|
| MB1–MB4 | | |
| MD1–MD8 | | |
| MW1–MW3 | | |
| MU1–MU18 | | |
| MP1–MP3 | | |

---

# Phase 1b QA guide

Covers the items tagged [1b] in `CHECKLIST.md`: template calibration (2.2), Cars browse (5.1), picker + My car (5.2a), map toggle and cross-links (5.2b), Compare (6.1). Read `docs/plan/DESIGN-1b.md`, owner decisions **B37–B40** in `gaps-and-questions.md`, then `database-ui.md` §2–§7, `charging-curve-viewer.md` §6 and §9, `charger-map.md` §4 and §7, `user-flows.md` §1–§2. Report every gap with doc + section, expected and seen. Dev server: `.claude/launch.json` "voltway-dev" (port 4321). Clear localStorage between scenarios.

## 1. Build and tests

| # | Check | How |
|---|-------|-----|
| QB1 | Tests, types, build | `npx vitest run`, `npx astro check` (0 errors), `npm run build` |
| QB2 | CI green on every 1b PR | GitHub PR checks |
| QB3 | All new text translatable | grep new components for hard-coded user-facing strings; every label from `src/i18n/en.json` |

## 2. Calibration (2.2, charging-curve-viewer.md §9)

| # | Check | Edge cases |
|---|-------|-----------|
| QC1 | `npm run calibrate` prints/writes `docs/plan/calibration-report.md`: every car with a tested curve or published 10–80 %, its template, reference, estimate, error, before and after | A car with both: the tested curve is the reference |
| QC2 | After tuning most cars are within ±15 %; thin groups (e.g. LFP) flagged; no split template unless justified | |
| QC3 | Owner approval recorded (gaps-and-questions, dated); `TEMPLATES` equals §9's table; estimated curves no longer say "uncalibrated" | Templates still fall after their peak (monotonic) |

## 3. Cars tab (5.1, database-ui.md §4, B39)

| # | Check | Edge cases |
|---|-------|-----------|
| QL1 | `/cars` shows cards by default; table toggle; no accordions | |
| QL2 | Every §4 filter exists with its default (Sold in Canada on, years current + previous) and narrows the list; count shown; Clear filters resets | A min filter on a car with "Unknown" range drops it only while the filter is set |
| QL3 | Sorts: name, range, efficiency, DC peak, 10–80 %, km/10 min (table default), newest; table headers sortable with `aria-sort` | Unknown values sort last in both directions |
| QL4 | Cards: name, variant, range, 10–80 %, km/10 min, port, Tested/Estimated badge, "+ Compare"; estimated figures show "~" | |
| QL5 | Search finds "ioniq 5", "model y", a trim alias | Empty result shows a message |
| QL6 | Filters, sort and view survive reload; km/mi switch updates figures | Corrupt `voltway.browse` value → defaults, no crash |
| QL7 | 375 px: filters in a bottom sheet, table stacks, no sideways scroll; dark mode readable; keyboard reaches everything | |

## 4. Picker + My car (5.2a, database-ui.md §3, B37, B40)

| # | Check | Edge cases |
|---|-------|-----------|
| QP1 | `/charging` with no My car and no link shows "Which EV do you drive, or want to?" with search + step selects | A `?car=` link skips the picker |
| QP2 | Search suggests as you type; arrows + Enter pick; step selects reach a variant; trim optional with the "standard trim" note | |
| QP3 | "Just browsing" → `/cars`, sets nothing | |
| QP4 | Picking sets My car; header chip shows it; reload of `/charging` lands on it | |
| QP5 | Chip menu: change (picker), open (its Charging page), forget (chip clears, picker returns) | |
| QP6 | Charging tab: "Set as my car" and "+ Compare"; Compare (n) chip hidden at 0, updates live, max 4 with a clear message | |
| QP7 | Storage blocked (e.g. stub localStorage to throw): everything works, forgets on reload | |
| QP8 | `adapters_included` is in the schema as optional sourced values; shows "Unknown" in Ports & access (B38) | |
| QP9 | An empty `?car=` behaves like no link (TD-P4 part) | |

## 5. Map with My car (5.2b, charger-map.md §4, §7; user-flows.md §2; B28, B31, B37, B38)

| # | Check | Edge cases |
|---|-------|-----------|
| QM1 | No My car: no toggle; a dismissable "Set my car" prompt, gone after dismiss + reload; map never blocked | |
| QM2 | With My car: "Chargers my car can use" toggle in the filter panel; saved with filters | |
| QM3 | Toggle on: NACS car → NACS ports, plus J1772 when Level 2 is on (B42); CCS1 car without Supercharger access → CCS1 only; CCS1 car with `via_adapter` → CCS1 + Superchargers marked "needs adapter"; unknown port → toggle disabled with a note | |
| QM4 | Tesla note hidden when My car is a Tesla; via-adapter wording for a via-adapter car; generic note otherwise | |
| QM5 | Curve viewer with a charger preset → "Find chargers this fast" opens the map at that L3 range ("N kW and up") and the car's plugs; params removed from the URL | Preset "No limit" hides the link |
| QM6 | Station panel → "How fast would my car charge here?" (only with My car and DC ports) opens `/charging` for My car capped at the station's top kW; saved curve settings unchanged afterwards | L2-only station: no link |
| QM7 | `site-ui-checker` (formerly map-ui-checker) MU1–MU18 still pass | |

## 6. Compare (6.1, database-ui.md §6, charging-curve-viewer.md §6)

| # | Check | Edge cases |
|---|-------|-----------|
| QX1 | `/compare` lists the saved cars; `?cars=a,b` link shows the same view in a fresh browser, with a "shared comparison" banner when it differs from the saved list; the banner goes and the list is saved after the first change (B43) | Unknown id in the link → notice, rest shown; >4 ids → first 4 |
| QX2 | Header per car: name, variant selector, remove; empty state links to Cars | |
| QX3 | One colour per car across header, curve line and table | |
| QX4 | Overlay: shared SoC window and charger power; results table (time, km added, km/10 min, avg kW, curve badge) sortable, default km/10 min; mixed tested/estimated note | |
| QX5 | Spec table grouped like the Charging tab; best value per row with icon + bold (not colour alone), lower-is-better for 10–80 % and consumption; ties for best all marked (nothing marked when every known value is equal or fewer than two cars have a figure) | Unknowns never "best" |
| QX6 | "Only show differences" hides identical rows | |
| QX7 | 375 px: two cars visible, swipe for the rest; dark mode; keyboard | |

## 7. Rules and process

| # | Check |
|---|-------|
| QR1 | B37–B40 recorded in `gaps-and-questions.md` and the matching docs |
| QR2 | Ticked 1b items are genuinely done; anything skipped noted inline |
| QR3 | No route planner links; only parts that exist are linked |

## Phase 1b results

| ID | Pass / Fail | Notes |
|----|-------------|-------|
| QB1–QB3 | | |
| QC1–QC3 | | |
| QL1–QL7 | | |
| QP1–QP9 | | |
| QM1–QM7 | | |
| QX1–QX7 | | |
| QR1–QR3 | | |

---

# Phase 3: Route planner (DESIGN-3.md, route-planner.md, user-flows.md §2–§3)

Run against [DESIGN-3.md](DESIGN-3.md) and [route-planner.md](../design/route-planner.md). Owner decisions: B44 (rate limit), B45 (GeoNames places), B46 (highway factor research + calibration), B47 (curb weight defaults). Dev server: `.claude/launch.json` "voltway-dev" (port 4321); the function needs `ORS_API_KEY` in `.env` locally. Check at desktop width and 375 px, light and dark. Clean up `voltway.*` storage keys after testing.

## 1. Build and rules

| # | Check | Edge cases |
|---|-------|-----------|
| QT1 | `npx vitest run`, `npx astro check` (0 errors), `npm run build` pass | |
| QT2 | Build output: every page prerendered; only `/api/route` and `/api/geocode` are functions | |
| QT3 | No new hard-coded user-facing strings (all in `src/i18n/en.json`); no new unsourced vehicle figure (curb-weight defaults are `kind: estimated` with a basis) | |
| QT4 | The ORS key is read only on the server (`src/pages/api/*`, `src/lib/ors.ts`), never in client code, `public/` or a response | Search the built client files in `dist/` for the variable name and the key |

## 2. Data (3.1, 3.2, 3.3)

| # | Check | Edge cases |
|---|-------|-----------|
| QD1 | `public/data/places.json` exists: Canadian places with population ≥ 1,000 and their province; Toronto, Montréal, Whitehorse and Iqaluit present; About credits GeoNames (CC BY 4.0) | Accented names keep their accents |
| QD2 | Every built car has a curb weight; the filled-in ones show Estimated with "median of N sourced …" | A body type with fewer than 3 sourced cars uses the overall median |
| QD3 | Tested highway figures (once 3.3 is merged) are `kind: tested` with a source each; the owner merged the data PR | |

## 3. Energy and stop logic (3.4–3.6, route-planner §3–§5)

| # | Check | Edge cases |
|---|-------|-----------|
| QE1 | Base consumption: tested highway if present, else NRCan highway × factor (1.08, calibrated, B49) | |
| QE2 | A climb adds `m·9.81·Δh / 0.9`; a descent returns 60 %; mass = curb weight + 150 kg | Unknown weight → body-type default, result marked estimated |
| QE3 | SoC drop uses usable kWh; the gross fallback marks the trip estimated | |
| QE4 | Stop window: arrive between threshold and threshold + 20 %, ≤ 2 km from the route; highest usable kW (capped at the car's DC peak); ties → furthest along | |
| QE5 | Fallbacks: 10 km, then the last earlier compatible charger, then a "charging gap" warning | Destination reached below threshold → an extra stop |
| QE6 | Compatibility = the map's "Chargers my car can use" rule (B38, B42); temporarily unavailable and restricted stations skipped; a non-Tesla at a Supercharger flagged | A CCS1 car without Supercharger access is never routed to one |
| QE7 | Charging time = the Phase 1 curve maths from arrival % to 80 % at min(curve, charger kW), + 5 min per stop; estimated curves show "~" | |
| QE8 | Total time = driving + detours + charging + overhead; "Change car" re-plans from the same route with no new `/api/route` request | |

## 4. The function (3.8–3.10, route-planner §2, B44)

| # | Check | Edge cases |
|---|-------|-----------|
| QF1 | `/api/route?from=lon,lat&to=lon,lat` returns a trimmed route with elevation, distance and duration | Missing, non-numeric or out-of-area coordinates → 400 |
| QF2 | `/api/geocode?q=` returns at most 5 Canadian results | Empty `q` → 400 |
| QF3 | Responses carry CDN cache headers; a repeat call on the deployment shows `x-vercel-cache: HIT` | Coordinates are rounded so near-identical requests share the cache |
| QF4 | ORS daily limit (403), per-minute limit (429) or a timeout → 503 `busy`; the page shows "Trip planning is busy, try again later" | |
| QF5 | The firewall rule blocks a burst from one IP; the page shows the busy message | |
| QF6 | The function writes no addresses or coordinates to the logs | |

## 5. Trip planner on the charger map (3.11–3.14, 3.17–3.20; B50; route-planner §1, §6, §7; user-flows §2)

*B50 (2026-11-16): the planner moved onto the charger map at `/`; `/trip` no longer exists. Read "the trip screen" below as the map in route mode.*

| # | Check | Edge cases |
|---|-------|-----------|
| QS1 | No "Trip" in the nav; `/trip` is a 404 and nothing links to it; `/` loads with no console errors | |
| QS2 | From/To suggest places while typing with no network request; "Search full address" calls `/api/geocode` only on press; "Use my location" fills From only when pressed | "montreal" finds Montréal; location denied → a message |
| QS3 | The car comes from My car, with an inline picker when there is none; start 90 % and threshold 15 % by default, both adjustable | |
| QS4 | Toronto → Montréal with an IONIQ 5 plans sensible stops; Calgary → Vancouver uses more energy than the same distance on the flat | A route that needs no stop shows none |
| QS5 | Map: the route line and numbered stop pins; a pin opens the same station panel as the map | |
| QS6 | Itinerary per route-planner §7: depart %, legs, stops (arrive % → 80 %, kW + plug, charging + 5 min), arrival %, totals | The km/mi switch updates distances |
| QS7 | Warnings: estimated curve, Tesla network, charging gap (try a long northern route), detour, uncalibrated factor; the winter footer and the K2 disclaimer always; the charger data date shown | |
| QS8 | Per stop: Google Maps and Apple Maps links, Open charger, and "See the charging curve for this stop" → `/charging` at arrival % → 80 % capped at that kW; saved curve settings unchanged afterwards | |
| QS9 | Station panel → "Route here" switches the same map to route mode with To filled in | |
| QS10 | The last trip is restored on reload; the share link appears only after opting in, and it reproduces the trip in a fresh browser | A corrupt `voltway.lastTrip` → an empty form, no crash |
| QS11 | 375 px: the itinerary is a bottom sheet with no sideways scroll; dark mode readable; the keyboard reaches everything (combobox ARIA, itinerary list) | |
| QS12 | States: no route found, busy, offline, no compatible chargers at all — each has a clear message | |
| QS13 | "Where to?" box: picking a place flies the map there with a marker and a place card (name, fast chargers within 25 km, Route here); Escape or close clears it | A place with no chargers nearby says so |
| QS14 | Route mode: From = last start (or the location only if the browser already allows it, otherwise "Use my location"); swap works; the car · % line expands to change car, start % and threshold | No saved trip and no permission → From is empty with "Use my location" |
| QS15 | While a route shows, other chargers are faded but visible, filters still apply, and the itinerary replaces the filter panel; Close route restores the plain map | Filters set before Route here still apply to the faded pins (the filter panel is hidden while routing, so they can't change mid-route); Close route shows the filter panel with the same choices |
| QS16 | The plain charger map still works: filters, Stations in view, Locate me, station panel (MU spot-check) | |

## 6. Rules and process

| # | Check |
|---|-------|
| QR4 | B44–B47 recorded in `gaps-and-questions.md` and the matching design docs |
| QR5 | Ticked [3] items are genuinely done; anything skipped is noted inline |
| QR6 | No waypoints, cost, live status or re-planning (route-planner §8 "later"); no links to parts that don't exist |

## Phase 3 results

| ID | Pass / Fail | Notes |
|----|-------------|-------|
| QT1–QT4 | | |
| QD1–QD3 | | |
| QE1–QE8 | | |
| QF1–QF6 | | |
| QS1–QS16 | | |
| QR4–QR6 | | |

# Polish: showcase pass (P.1–P.7)

| # | Check | Edge cases |
|---|-------|------------|
| QP1 | The side menu on every page has a km/mi switch; it matches the Charging tab's switch and changes figures on the open page without a reload (map itinerary, Charging, Cars, Compare) | Reload keeps the choice; switching on the Charging tab updates the menu's pressed state next time the menu opens |
| QP2 | Escape closes route mode and returns focus to "Where to?" | Escape inside a field with open suggestions only closes the list; with a station panel open, Escape closes the panel first |
| QP3 | On desktop the place card never covers the "Set my car" toast | 1280 px and 1024 px |
| QP4 | Every page's HTML has og:title, og:description, og:image (absolute, 1200×630), og:url and twitter:card | The image loads at its URL |
| QP5 | axe-core reports no serious or critical violations on each page and map state listed in P.4 | Dark and light |

## Polish results

| ID | Pass / Fail | Notes |
|----|-------------|-------|
| QP1–QP5 | | |

---

# Phase 4: whole-site redesign, "Road Paint" (`DESIGN-4.md`, B52–B57)

Run `npx vitest run`, `npx astro check` and `npm run build` first. Check every item in dark and light, at 375 px and at desktop width, unless it says otherwise. Test trips: Toronto → Montréal (no gap) and Greater Sudbury → Thunder Bay with a Kia EV6 Wind (a charging gap). `/api/route` allows 30 calls per 10 minutes.

| ID | Check | Edge cases |
|----|-------|------------|
| QR1 | Tokens: no old palette colours remain in `src/` outside tests; Archivo loads from the site's own origin (no request to a font host) | Offline reload still shows text |
| QR2 | `tests/contrast.test.ts` passes: text, muted, warning, estimated, button labels 4.5:1; large text, route, gap, pins 3:1 | Both themes |
| QR3 | The map uses Voltway's own style on OpenFreeMap tiles; roads and town labels readable at regional zoom; attribution wording unchanged | Theme switch swaps the style without a reload |
| QR4 | Home, desktop: planner card top left, navigation pill top right, controls bottom right; nothing covers "Locate me" | 1280 px and 1024 px |
| QR5 | Home, 375 px: planner is a bottom sheet; the map keeps at least 200 px; no sideways scroll | Keyboard open on a real phone |
| QR6 | First visit (cleared storage): one destination search and a "your car" tile; picking a car is a compact search | "Just browsing" in the picker goes to Cars (database-ui.md §3); the header's Map link returns to the map |
| QR7 | Unplannable cars (e.g. 2026 IONIQ 5 Long Range AWD) are marked and sorted last in the picker; if chosen, the message contains "Change car" | |
| QR8 | Trip result: total time is the largest text; distance, stops and charging on one line under it | Zero stops; ten stops |
| QR9 | Charging gap: warning under the totals, visible with the sheet collapsed; the gap leg is dashed in the list and on the map; names both places | The "not expected to make it" wording |
| QR10 | Each stop is two lines plus one Details control that opens the station panel; directions and the curve link are reachable from there | Long station names wrap, no overflow |
| QR11 | Tesla and "your car takes less" notes appear once per trip, with a tag on the stops they apply to | A Tesla car shows no Tesla note |
| QR12 | "How this was estimated" holds assumptions, the winter note and data dates; "This is an estimate…" is visible without opening it | |
| QR13 | A six-stop plan's sheet is under 1,600 px tall at 375 px | |
| QR14 | Filters open from one control with a count when narrowed; Plugs is a disclosure with all four plugs visible; the map has no "Chargers my car can use" box (removed by B55) | |
| QR15 | After a reload the last trip is restored or offered in one tap, with no extra `/api/route` call until asked | Cleared storage shows no "Last trip" |
| QR16 | Selecting a stop highlights it in the list and on the map; Escape and focus return work as in QP2 | Keyboard only |
| QR17 | Cars, car page, Charging, Compare, About, 404 are in the new look with the same content, filters and links as before; source badges present on every stored vehicle figure (calculated values such as 10–80 % time carry the "Estimated" row tag instead) | Compare with 4 cars |
| QR18 | Charging chart: new palette, estimated curve dashed with its badge, guides drag | km/mi switch |
| QR19 | Wording: "Trip" used consistently; variant names plain with the regulator suffix secondary; no hard-coded strings in components | |
| QR20 | axe-core: no serious or critical violations on every page and map state | Both themes |
| QR21 | No ABRP or car-maker logo, font or asset anywhere; no new third-party request | Network tab |
| QR22 | Root `DESIGN.md` and `.impeccable/design.json` describe the built tokens and components | |
| QR23 | B54: the small floating header pill is on every page (sticky on content pages); "Pick your car" opens a dialog, not a page; the Map key sits above Locate me and lists every mark | 375 px: the key opens as a popup within the screen |
| QR24 | B54/B55 marks: clusters are a dark disc with a pale count and a ring split yellow (Level 3, from 12 o'clock) / white (Level 2); speed bolts and plug drawings only on groups under 20 and on pins; NACS drawn from the J3400 face; chargers turn grey while a trip shows | Both themes |
| QR25 | B55 Tesla and logo: Supercharger pins red with a white T, Destination pins white with a red T, both in the Map key; header, favicon and link preview use the road-and-bolt tile | 16 px favicon readable |
| QR26 | B55 plugs: the My car menu has NACS / CCS1 / CHAdeMO switches (car's own plug on by default), saved with My car; trips use them and the trip panel says "Plugs used … Change plugs"; the picker dialog explains the default | Re-picking the same car keeps the switches; a different car resets them |
| QR27 | B56 locate on load: the map centres on the visitor after the browser's prompt; nothing is asked or shown when permission was refused; a trip link does not locate; a late answer does not move a map the visitor has already moved or a trip they opened; nothing is stored | Real phone (first-time prompt) |
| QR28 | B57: chargers stay grouped up to zoom 15, so downtown pins don't pile up | Downtown Toronto at zoom 14.5 |
| QR29 | B58: one car picker (the header dialog); the trip form's prompt opens it; a suggestion selects without closing; "Select car" saves; plug switches shown before saving | Same car re-picked keeps its switches |
| QR31 | B59: on phones, round icon Map key / Locate me, compact credits, a draggable sheet (peek / half / full, keyboard too), no zoom buttons on touch; the route fits the visible map | 320 px wide; landscape phone; a mouse at 375 px keeps the zoom buttons |
| QR30 | B58: tags show from zoom 9 in on any group size; Charging with no car shows the first car | "Forget my car" on Charging |

## Phase 4 results

| ID | Pass / Fail | Notes |
|----|-------------|-------|
| QR1 | Pass | No pre-4.1 colours left in `src/` except `#1D4ED8`, kept on purpose (light car-1 series, location dot). Archivo from the site's own origin (@fontsource), `font-display: swap` with a system fallback. Offline reload not possible in the browser tool. (qa-reviewer; ui-check-4.20) |
| QR2 | Pass | vitest 537/537 incl. contrast.test.ts; contrast-pairs: all CSS pairs covered. |
| QR3 | Pass | Own recoloured style on OpenFreeMap tiles; side-menu theme switch swaps the style without a reload (ui-check-4.20); attribution unchanged. |
| QR4 | Pass | 1280 and 1024 px; nothing covers Locate me (ui-check-4.17 follow-up). |
| QR5 | Pass | 375×812 and 375×667: sheet, map ≥ 220 px, no sideways scroll. Keyboard on a real phone: owner phone test (4.18). |
| QR6 | Pass | First visit: search + car tile, compact picker; Just browsing → Cars, Map link back (ui-check-4.20). |
| QR7 | Pass | Unplannable cars tagged and last, in the planner and (since 4.20) the header dialog; "Change car" in the message. |
| QR8 | Pass | Total time largest (32 px); 0 stops (Toronto → Hamilton) and 10 stops (Toronto → Halifax) render correctly (ui-check-4.20). |
| QR9 | Pass | Gap warning under the totals, fully above the fold at 375×812 and 375×667 after the 4.20 fix; dashed leg; both places named. |
| QR10 | Pass | Two lines + Details; a 72-character station name wraps with no overflow at 375 (ui-check-4.20). |
| QR11 | Pass | Tesla and Car-limited notes once, tags on their stops; no Tesla note for a Tesla car (ui-check-4.17 follow-up). |
| QR12 | Pass | Disclaimer outside "How this was estimated"; assumptions, winter note and data dates inside. |
| QR13 | Pass | Six-stop sheet 1,458–1,473 px at 375. |
| QR14 | Pass | One Chargers control with a count; Plugs disclosure with four plugs; no "my car" box (B55). |
| QR15 | Pass | Last trip offered after reload; no /api/route call until asked; none with cleared storage. |
| QR16 | Pass | Keyboard Details → panel, aria-current, Escape returns focus. |
| QR17 | Pass | Car page 22 figures / 22 badges; Compare (4 cars) 57 / 57; calculated rows tagged Estimated (ui-check-4.20). |
| QR18 | Pass | Dashed estimate with badge, guide drag, km/mi; limit label fixed in 4.17. |
| QR19 | Pass | "Trip" throughout; variant code muted on Cars, Compare, car page and (since 4.20) pickers and chip; no hard-coded strings. |
| QR20 | Pass | axe 0 serious/critical on every page and map state, incl. trip form, gap trip, 10-stop trip in dark/light × 1280/375 (ui-check-4.17, 4.20). |
| QR21 | Pass | Only the site's origin and tiles.openfreemap.org. |
| QR22 | Pass | Root DESIGN.md + .impeccable/design.json; all 48 colours checked against the code (4.20 fixes). |
| QR23 | Pass | ui-check-4.21-4.25. |
| QR24 | Pass | ui-check-4.21-4.25, ui-check-4.26-4.30. |
| QR25 | Pass | ui-check-4.26-4.30; T outline thickened in 4.17. |
| QR26 | Pass | ui-check-4.26-4.30; re-pick keeps switches (ui-check-4.20). |
| QR27 | Pass | Stubbed: flies when untouched, stays put after drag/place/trip, quiet when denied, not on trip links (ui-check-4.26-4.30, 4.20). Real first-time prompt: owner phone test (4.18). |
| QR28 | Pass | Downtown Toronto at zoom 14.5 shows groups (main session check, ui-check-4.20). |

---

# Phase 5 QA: Drive mode handoff and route options (B72–B74)

Read `docs/plan/DESIGN-5.md` and B72–B74 in `docs/design/gaps-and-questions.md` first. `/api/route` allows 30 calls per 10 minutes; each test trip uses one.

| # | Requirement | How to check | Edge cases |
|---|---|---|---|
| QD1 | Settings shows Avoid tolls, Avoid highways (off by default) and Stay in Canada (on, disabled, with its note) | Open the gear on the map and on /cars; toggle; reload | Storage blocked (private window): switches still work for the visit; keyboard only; 375 px |
| QD2 | Options reach the router and are validated | Network tab: `/api/route` has `avoid=…`; `avoid=ferries` → 400; `avoid=tolls,tolls` → 400; `avoid=highways,tolls` is sent as `tolls,highways` | Unit tests in `tests/ors.test.ts` |
| QD3 | Avoid highways changes the route and stops still plan | Toronto → Ottawa with and without: different line, longer time, stops present | A long trip (Toronto → Thunder Bay) still returns |
| QD4 | Changing an option re-plans a shown trip once | Trip on screen, toggle Avoid tolls: exactly one new `/api/route` call | On the form the button reads Plan trip, not Return to plan |
| QD5 | Ends outside Canada are refused with the right message and no ORS call | A trip link from Detroit, one to Seattle, one with both | Windsor and a point just inside the border plan normally |
| QD6 | Routes never leave Canada | Toronto → Winnipeg and Toronto → Vancouver: the line stays north of the border | — |
| QD7 | Drive appears only with a planned trip | Form, errors and no-car states have no Drive button | 0-stop trip: the next target is the destination |
| QD8 | Next stop panel | Name, distance, arrive ~time, planned charge and cost; km/mi switch | Estimated curve shows ~ |
| QD9 | Navigate links | Read each link: Google `…/maps/dir/?api=1&destination=lat,lng&travelmode=driving&dir_action=navigate`; Apple `maps.apple.com/directions?destination=lat,lng&mode=driving` (+ avoid) | Only coordinates in the URLs |
| QD10 | Whole-trip limits | 2-stop trip: both whole-trip buttons; 5 stops: Apple only; 10 stops (Toronto → Halifax): neither until stops are reached | Waypoint order matches the plan |
| QD11 | Progress from location | Stub positions near stop 1, then 2 km past it along the route: ticked, next moves on | Position > 5 km off the route ticks nothing; Mark as reached / Not reached yet |
| QD12 | Foreground only | With Drive open, hide the page: the watch stops; show it: it resumes | Leaving Drive stops it |
| QD13 | Wake lock | Stub `navigator.wakeLock`: requested on open, again on visible, released on exit | API missing: no error |
| QD14 | Coming back | Reload with Drive open: Drive and progress return; Exit clears it; nothing in localStorage holds the start | — |
| QD15 | Words, accessibility, looks | No hard-coded strings; axe clean; dark and light at 375 px and desktop; 44 px targets | Long station names wrap |
| QD16 | Charge past 80 % (B75) | `npx vitest run tests/trip-plan.test.ts` (B75 block); plan Hamilton ON → Vancouver BC with a 2025 Polestar 2 and read each stop's "charge to" | No stop charges only a few % right after another; a stop before a long stretch shows more than 80 %, never over 100 %; ordinary stops still 80 % |
| QD17 | NACS suggestion (B76) | `npx vitest run tests/trip-plan.test.ts` (B76 block); plan Hamilton ON → Vancouver BC in a 2025 Polestar 2 with NACS off, then press Turn on NACS | Note shows only when NACS would fix the trip; the button turns NACS on in My car and the trip re-plans reachable, with no new /api/route call; no note when NACS is already on or the trip already works |

## Phase 5 results

| ID | Pass / Fail | Notes |
|----|-------------|-------|
| QD1–QD15 | Pass with issues | qa-reviewer 2026-11-18 + site-ui-checker (docs/plan/reports/ui-check-5.md, re-checks 1–3). No blockers. |
| Should-fix 1 | Fixed | Escape / Close route now clears `voltway.drive` (`closeRoute` in ChargerMap.tsx). |
| Should-fix 2 | Known limit | The outline check lets a few US spots right at the border through (downtown Detroit, Port Huron, Niagara Falls NY, Sumas WA, Lubec ME) and Greenland north of 60.5°. ORS still avoids every border, and the map has only Canadian chargers, so such a trip fails or shows a gap rather than routing through the US. A US polygon check is a follow-up. |
| Should-fix 3 | Fixed | `drive.noteLocation` now says "Location is used only while this page is open."; `drive.locationOn` shortened so it doesn't repeat. |
| Minor 4, 6, 9, 11 | Fixed | Resumed ticks trimmed to the stop count; whole-trip limits come from `WHOLE_TRIP_MAX` ({max}); Drive follows price changes (PRICE_EVENT); curly apostrophe. |
| Minor 5, 7, 8, 10, 12 | Open (logged) | Option change mid-Drive resets ticks; Drive shown on unreachable plans; map dot stays after Drive; points outside AREA give 400 not 422; map key overlap at 375 (pre-existing). |
| Light theme driven line | Fixed | Driven segment is now #A4A29A on the #2B2C30 band in both themes (6.4:1; was 1.8:1 in light). |
| QD16 | Pass (unit) | B75 block in tests/trip-plan.test.ts: one stop charges to 91 % instead of a short hop; last stop charges for the final stretch (86 / 100); 80 % kept when the next window is reachable. Owner to confirm Hamilton → BC on the deployed site. |
