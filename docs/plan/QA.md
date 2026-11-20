| QV5 | PASS | Settings → Animations off: 0 s transitions, 0 animations, 0 ghosts, instant count; back on without reload restores motion (docs/plan/reports/ui-check-b86.md); re-checked after the review changes: 0 animations across a tick and a Clear |
| QV4 | PASS (after fix) | Count ticks 84→52→31→19→12→9; status line changes once to the final count; mark.hit on matches; "zzzz" shows the empty message. Fixed after QA: mid-tick plural ("1 car"), and a negative frame when a frame timestamp preceded the start (clamped; interrupted ticks resume from the shown number); re-checked 1–84 only (docs/plan/reports/ui-check-b86.md) |
| QV3 | PASS | Staying cards transform, new ones transform+opacity, 6 ghosts on a Make tick, 0 ghosts and 0 animations after ~600 ms; ≤ 12 cards animate, offscreen 0; table view filters (84 → 9) (docs/plan/reports/ui-check-b86.md) |
| QV2 | PASS | Native checkbox lists (radios exclusive for heat pump), whole row clickable, focus ring 3 px, labels 14.67 dark / 16.35 light, rows 44 px at 375 and 34 px at 1280; no horizontal scroll; chips hidden while open. Note: light-theme checkbox edge ~1.3:1, state carried by the tick and bold label (docs/plan/reports/ui-check-b86.md) |
| QV1 | PASS (after fix) | Clear only on sections in use (years only off-default, heat pump only off "any"); 3 makes cleared in one click, button gone, focus on the Make summary, other sections untouched; works on a closed section; years/sliders/heat pump reset right; keyboard reachable, 3 px focus ring, contrast 11.38 dark / 6.84 light; phone sheet scrolls, 60 Tabs inside, Escape returns focus. Fixed: Clear overlapped "Maximum 10–80% time" at 1280 (titles now wrap); Clear 44 px on phones; re-measured no overlap (docs/plan/reports/ui-check-b86.md) |
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
| QD1 | `public/data/places.json` (since B78: `places-ca.json`) exists: Canadian places with population ≥ 1,000 and their province; Toronto, Montréal, Whitehorse and Iqaluit present; About credits GeoNames (CC BY 4.0) | Accented names keep their accents |
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
| QR30 | B58: tags show from zoom 9 in on any group size (*since B82: from zoom 13, not on groups of 50+, see QR31*); Charging with no car shows the first car | "Forget my car" on Charging |
| QR31 | B82: tags follow crowding: Hamilton (Level 2 off and on) tagged at zoom 11; Montreal with Level 2 on untagged at zoom 11–13, tagged at 14; groups of 50+ never tagged; at 375 px tags need fewer marks on screen; groups visibly fewer than with 48 px; Map key note matches | Trip showing (greyed marks follow the same rule) |

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
| QD1 | Settings shows Avoid tolls, Avoid highways (off by default) and Stay in Canada (since B78: "Stay within the border"; on, disabled, with its note) | Open the gear on the map and on /cars; toggle; reload | Storage blocked (private window): switches still work for the visit; keyboard only; 375 px |
| QD2 | Options reach the router and are validated | Network tab: `/api/route` has `avoid=…`; `avoid=ferries` → 400; `avoid=tolls,tolls` → 400; `avoid=highways,tolls` is sent as `tolls,highways` | Unit tests in `tests/ors.test.ts` |
| QD3 | Avoid highways changes the route and stops still plan | Toronto → Ottawa with and without: different line, longer time, stops present | A long trip (Toronto → Thunder Bay) still returns |
| QD4 | Changing an option re-plans a shown trip once | Trip on screen, toggle Avoid tolls: exactly one new `/api/route` call | On the form the button reads Plan trip, not Return to plan |
| QD5 | Ends outside Canada are refused with the right message and no ORS call | A trip link from Detroit, one to Seattle, one with both | Windsor and a point just inside the border plan normally |
| QD6 | Routes never leave Canada | Toronto → Winnipeg and Toronto → Vancouver: the line stays north of the border | — |
| QD7 | Drive appears only with a planned trip | Form, errors and no-car states have no Drive button | 0-stop trip: the next target is the destination |
| QD8 | Next stop panel | Name, distance, arrive ~time, planned charge and cost; km/mi switch | Estimated curve shows ~ |
| QD9 | Navigate links | Read each link: Google `…/maps/dir/?api=1&destination=lat,lng&travelmode=driving&dir_action=navigate`; Apple `maps.apple.com/directions?destination=lat,lng&mode=driving` (+ avoid) | Only coordinates in the URLs |
| QD9b | Market-neutral screens (B98, 9.15b) | `/charging?car=chevrolet/bolt/2027/bolt` opens the 2027 Bolt with no "not sold in Canada" banner; no "Coverage: Canada" note in the Charging intro or "Currently covers EVs sold in Canada" in the footer; Cars page: "Sold in" checklist, Canada only → no US-only cars, United States only → no CA-only cars, none → all | An old saved Cars state with `canadaOnly` loads without error and shows all markets |
| QD9c | Prices without a country (B99, 9.15c) | Charging: cost reads "~$xx.xx", price label "Price per kWh ($)", help says "a typical Supercharger rate"; trip itinerary and Drive costs also plain "$"; footer and About data list credit the US EPA | A browser set to French or en-GB still shows "$", not "CA$"/"US$" |
| QD9d | Cars page pages (B106, 9.17a) | Cars, all years: 48 cards and page controls; page 2 shows 49–96; a filter change returns to page 1; table view 50 rows | Last page shows the remainder; 375 px: controls fit without horizontal scroll; keyboard reaches Previous/Next |
| QD9e | Review round 2 data (B100–B105, 9.20c) | Kandi, Fit EV, Azure absent from Cars and pickers; 2024 Toyota shows "bZ4X", 2026 shows "bZ"; LYRIQ-V is its own model; 2026 Equinox EV AWD 19.2 kW trim shows a shorter Level 2 time than the 11.5 kW trim; 2022 Polestar 2 offers 19″/20″ wheels; Escalade IQ shows a 10–80 % time | A B97 car's consumption names its source; wheel picker range is 2″ around the factory sizes |
| QD9f | Simpler data storage (B111, 9.22) | `npx tsx scripts/merge-powertrains.ts --dry` merges 0; `npx tsx scripts/dedupe-notes.ts --dry` changes 0 files; `npm run data:format` rewrites 0 files; a car whose values use `note_id` shows the full note text on /charging; `npm run validate` reports a made-up `note_id` | Built `public/data/cars` identical to a build of the commit before B111 |
| QD9g | Charging adapters and heat pumps (B112, 9.23) | Pick 10 random cars and 10 random trims: each `adapters_included`/`heat_pump` value opens on its cited page and matches it; no source cites EVChargingStations, iSeeCars, Tire Wheel Guide, Unplugged Performance or ArenaEV for B112 values; /charging shows the "Charging adapter" label with the four wordings; `npm run validate` rejects an unknown adapter value | A CA+US car whose value differs by market says so in its notes |
| QD9h | B112 follow-ups (B113, 9.24) | /charging for `volkswagen/id-4/2022/pro` (Canada) shows a heat pump and `volkswagen/id-4/2022/pro-us` shows none; a 2023 Mach-E shows "sold by the maker"; an ArenaEV-sourced heat pump shows its caveat and low confidence; the trim list labels split cars "· Canada"/"· US" | My car saved with a split car id still loads (the Canadian edition keeps the id) |
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

---

# Phase 6 QA: Open Charge Map as a second charger source (B77)

Read `DESIGN-6.md` first. Never print or read the OCM key or `.env`. Don't call the OCM API more than once during QA (use `sources/ocm-ca/` from the last pull).

| ID | Area | How to check | Pass when / edge cases |
|----|------|--------------|------------------------|
| QO1 | Fair use | Read `scripts/fetch-ocm.ts` and its tests; `sources/ocm-ca/FETCHED.json` | Providers 1,24,45 only; countrycode=CA; compact, verbose=false, no comments; id-paged; 3 s between pages; ≤ 4 pages; no retry loop; key in `X-API-Key` header only; custom user agent; request count in FETCHED.json ≤ 5 |
| QO2 | No browser calls | `grep -rn "openchargemap" src/` | Only links to OCM pages (station panel, About), no API host |
| QO3 | Key safety | `git grep -nIE "OCM_API_KEY\s*=\s*\S|X-API-Key: [A-Za-z0-9]|key=[A-Za-z0-9-]{16,}"` (tracked files only, so never .env) | No key in repo, FETCHED.json, logs or URLs |
| QO4 | Filters | `tests/ocm.test.ts`; spot-check 20 records of `data/imported/ocm/stations.json` against `sources/ocm-ca/` | Private, planned, removed, not-operational, unpublished and AFDC-copy records absent; temporarily unavailable kept with flag |
| QO5 | Plugs and levels | Same sample | J1772/CCS1/CHAdeMO/NACS mapped; others ignored; CCS1/CHAdeMO always Level 3, J1772 always Level 2, NACS Level 3 when OCM level 3 or ≥ 40 kW; Level 1-only dropped |
| QO6 | Duplicates | `tests/ocm.test.ts` (mergeOcm block); summary near-miss list; map at a known pair (6435 Metral Drive, Nanaimo) | One pin per real station; AFDC record kept; a different-plug neighbour kept; same address needs a shared plug; an OCM station with Level 3 or NACS its AFDC match lacks is kept; skip list works; a point outside Canada is dropped |
| QO7 | Ids | `public/data/map/*.json` | No id used twice; OCM ids ≥ 100,000,000 |
| QO8 | Credit | Browser: an OCM station and an AFDC station panel; About page | Source line on both; OCM shows provider, licence, link to its OCM page and last verified date; About credits OCM with licence and terms links |
| QO9 | Checks | `tests/ocm.test.ts` ("OCM import checks"; shared `scripts/lib/afdc-checks.ts`) | > 10 % drop or missing fields stops the import and writes nothing |
| QO10 | Refresh | Workflow file; a manual run on GitHub | OCM after AFDC; OCM failure keeps old OCM data and AFDC still updates; PR body has the OCM summary |
| QO11 | Planner | Hamilton → Vancouver, 2025 Polestar 2, CCS only | OCM fast chargers can be stops; result reported (gap may remain if OCM has none) |
| QO12 | Words, looks | Browser at 375 and 1280, dark and light | No hard-coded strings; source line wraps; contrast OK |

## Phase 6 results

| ID | Pass / Fail | Notes |
|----|-------------|-------|
| QO1 | Pass | fetch-ocm.ts: providers 1,24,45, CA, compact, no comments, id-paged, 3 s, 4-page cap, no retry, X-API-Key header, UA; FETCHED.json 4 requests (2,901 records) |
| QO2 | Pass | src/ links only to OCM's POI pages and terms; no API host |
| QO3 | Pass | git grep finds no key; OCM_API_KEY only as a name; raw pull, reference data, summary and .env git-ignored |
| QO4 | Pass | all 2,508 usable records checked against raw: 0 failures; T kept (5); only notice required (7) restricted after the owner's second amendment |
| QO5 | Pass | plug mapping and plug-decides-level rule hold on all records; J1772 at 50 kW stays Level 2; Level 1-only dropped |
| QO6 | Pass | every removal within its layer's distance with a shared plug; 0 hit the never-remove rule; 6435 Metral Drive one pin; Golden Petro-Canada kept; 17 skip entries apply |
| QO7 | Pass | 15,125 ids unique; all OCM ids ≥ 100,000,000 |
| QO8 | Pass | docs/plan/reports/ui-check-6.md (375/1280, dark/light); on dry-run data; AddÉnergie/Greems wording not seen on screen |
| QO9 | Pass | > 10 % drop test on a scratch copy: exit 1, data left unchanged |
| QO10 | Pending | 6.8: workflow read and reviewed (import crash now keeps last month's data); manual run on GitHub after merge |
| QO11 | Pass | Hamilton → Vancouver CCS only: 5 OCM stops; one gap left (Ivy White River temporarily unavailable); with NACS reachable |
| QO12 | Pass | all new text in en.json; provider names are constants; contrast 5.83–11.38 |


# Phase 7 QA: US chargers and "Stay within the border" (B78)

Read `DESIGN-7.md` first. Never print or read `.env` or any key. Don't call AFDC or OCM during QA; use the files under `sources/` from the last pull.

| ID | Area | How to check | Pass when / edge cases |
|----|------|--------------|------------------------|
| QU1 | Canada unchanged | Compare Canadian counts in `meta.json` with Phase 6 (15,125 sites, 578 OCM; after the 2026-11-18 audit decisions 14,546 AFDC + 579 OCM, still 15,125); re-plan Hamilton → Vancouver CCS only | Same counts (or explained by a newer pull); same stops as Phase 6 |
| QU2 | AFDC US import | `data/imported/afdc/us*.json`, summary, 30 random records against `sources/` | Fields mapped as for Canada; no Canadian or out-of-area points; per-country > 10 % drop check stops only that country |
| QU3 | OCM US fair use | `scripts/fetch-ocm.ts`, its tests, `FETCHED.json` | Providers 1/24/45, countrycode=US, 3 s pauses, request cap held, key only in the header |
| QU4 | OCM US duplicates | `map-data-auditor` report; spot-check 20 removed and 20 kept | B77 layers and amendments hold; AFDC wins; credit on every OCM station |
| QU5 | Tiles | `public/data/map/tiles/index.json`, sizes, unit tests | Every station in exactly one detail tile and in the overview; no tile > 300 KB; first load < 1 MB; build fails when a budget is broken (try it) |
| QU6 | Map loading | Browser at 375 and 1280, dark and light; network log | Zoomed out shows filtered clusters, with Level 2 counted at every zoom when ticked (B81); pins at zoom ≥ 9; only tiles in view fetched, each once; no console errors; Toronto, Detroit, Los Angeles, rural Montana |
| QU7 | Planner | Chicago → Denver, Anchorage → Fairbanks, Hamilton → Vancouver | Plans as expected; corridor tiles only; loading shown on the card |
| QU8 | Border rule | `/api/route` unit tests and on screen | Toronto → Buffalo: crossBorder; Seattle → Anchorage: crossBorder with the Alaska message; Mexico City start: outsideArea; no ORS call for these |
| QU9 | Settings | Settings menu | "Stay within the border" locked on, new help text, readable in both themes |
| QU10 | Place search | "Where to?" | US towns and addresses found; results lean to the start's country; US town file within its size |
| QU11 | Words and credits | `grep -n "Canada" src/i18n/en.json`; About page | No stale Canada-only claims about the map or trips; credits and licences for every new source; car list described as Canadian |
| QU12 | Refresh | Workflow file; a manual run after merge | Both countries fetched; per-country checks; self-merge only when all pass; a failed OCM country keeps last month's file |
| QU13 | Stops stay in the country (QA 2026-11-18) | `tests/station-country.test.ts`, `/api/route` response `countries`; a border trip (Fort Erie → Niagara Falls ON, low start charge) | No stop in the other country; a trip whose ends are both on the border line (in both countries) may use either |
| QU14 | Refresh PR size (QA 2026-11-18) | `wc -c sources/*/summary.md` after the imports | All four together well under 60,000 characters (closest 40 near misses per country); `near-misses.md` git-ignored and uploaded as an artifact |

# Phase 8 QA: Cross-border trips (B79)

Read `DESIGN-8.md` first. Never print or read `.env` or any key. Real `/api/route` calls use the owner's ORS allowance: keep them to the trips listed.

| ID | Area | How to check | Pass when / edge cases |
|----|------|--------------|------------------------|
| QB1 | API option | `tests/cross-border.test.ts` | `border=cross` accepted, any other `border` value 400; absent = stay within (B78 behaviour unchanged) |
| QB2 | Border rule with crossing | unit tests | With cross: Toronto → Buffalo and Seattle → Anchorage pass; Mexico City or an ocean point at either end → outsideArea. Without: as QU8 |
| QB3 | Crossings | unit tests (synthetic lines) | Windsor → Detroit: one crossing into `us` at the right index; Lower 48 → Alaska line: two; a line along the border inside the slack: none; `countries` lists the countries passed through |
| QB4 | Settings | Settings menu, 375 and 1280, dark and light | Switch off by default (B80; on in B79), toggles, kept after reload; help text; focus and contrast as the other switches |
| QB5 | Messages | Switch on: Toronto → Buffalo, Seattle → Anchorage | Messages say how to allow the trip; the Settings button opens Settings at the route options |
| QB6 | Crossing trip | Switch off: Toronto → Detroit, Vancouver → Seattle, Anchorage → Seattle | Plans; note under the summary; crossing rows in route order with a town on the far side; stops may be in either country; Drive mode still opens |
| QB7 | Same-country trip with crossing allowed | Switch off: Toronto → Ottawa; Detroit → Buffalo | Toronto → Ottawa: no note, stops in Canada only. Detroit → Buffalo: if ORS goes through Ontario, the note and two rows show |
| QB8 | Cache and share | Network log; a share link | `border=cross` in the URL only when the switch is off; a shared crossing trip opened with the switch on shows the message with the Settings button |

## Phase 8 results

| ID | Pass / Fail | Notes |
|----|-------------|-------|
| QB1 | PASS | `tests/cross-border.test.ts`, `tests/route-options.test.ts` (842 tests pass); qa-reviewer 2026-11-18 |
| QB2 | PASS | findCrossings on real outlines (London ON → Dearborn, Seattle → Anchorage); real ORS Toronto → Dearborn with `border=cross`: 393 km, ca+us, one crossing; without it 422 |
| QB3 | PASS | `tests/border-rows.test.ts`; qa-reviewer read Itinerary/border-rows |
| QB4 | PASS | `docs/plan/reports/ui-check-8.md`: desktop and 375 px, dark and light |
| QB5 | PASS | ui-check-8: Buffalo and Anchorage messages, Open Settings focuses the switch |
| QB6 | PASS (after fix 4e6735d) | ui-check-8: note, rows "into the US near River Rouge, MI" in route order |
| QB7 | PASS | ui-check-8: Toronto → Ottawa no note, no rows, stops in Canada |
| QB8 | PASS | ui-check-8: `border=cross` only when the switch is off; share link opened with switch on shows the message |

# B83 QA: Charging page hierarchy

Read B83 in `docs/design/gaps-and-questions.md`. Page: `/charging`. Cars: Kia EV9 Land AWD GT-Line (tested curve, measured 18–80 %), BMW i4 eDrive40 (estimated), any car with Charger set to 150 kW.

| ID | Area | How to check | Pass when / edge cases |
|----|------|--------------|------------------------|
| QC1 | Answer first | 1280×800 and 375×812, both themes | The charging time is the first line in the viewer card, Overpass, clearly the largest number; at 1280×800 the top of the chart is above the fold; at 375 the answer is above the fold. Values match the old tiles (same `~` on estimates, cost, "lost to charger limit" only with a charger limit) |
| QC2 | Window slider | drag each handle, keyboard arrows, Tab | Handles line up with the chart's 10 % / 80 % guides (≤ 4 px); start can't pass end; arrow keys move one handle by 1 %; each handle announces its own label; dragging a guide on the chart moves the handle; settings remembered after reload; a trip-stop link window (`?from=…&to=…` from a trip) still shows |
| QC3 | Axis switch | click Time, then State of charge | Switch sits at the chart's top right; chart redraws; no overlap with the y-axis name at 375 |
| QC4 | Curve paint | EV9 and i4, dark and light | EV9: yellow line on a dark band, violet dashed stretches below 18 % and above 80 %; i4: violet dashed, no band; delivered fill visible in both themes; guides in the text colour |
| QC5 | One yellow (superseded) | — | Replaced by the owner in round 3: selected switches are yellow like Settings (QC8). Kept for history |
| QC6 | Readouts and panels | 1280 and 375, both themes; open every accordion | Viewer results and Car figures on raised readout cards (Overpass values); chart, Specifications groups, Trims and Sources on raised panels; text on them ≥ 4.5:1; no overflow or horizontal scroll at 375 |
| QC7 | Curve outside the window | EV9 at 10–80 % and 30–60 %; i4 | Solid yellow on the band only where measured and inside the window; outside the window long lane-line dashes (yellow in dark, band colour in light); unmeasured/estimated violet, short dashes inside the window, lane-line dashes outside |
| QC8 | Switches and sliders | km/mi, SoC/Time, both sliders; arrows, `?kw=150`, `?kw=62.5`, reload | Switches use the Settings look (selected yellow, ink label); sliders use the map's kW slider look; Charger steps 50, 100 … 350, Max (no limit line, no "Find chargers" link at Max); results update; value remembered; `?kw=62.5` shows "63 kW" (link values round to whole kW, B31) with the handle at 50; ticks are centred on their handle positions (≤ 4 px) and don't overlap at 375; each control has its own name and value text |
| QC9 | Source badges | Car figures, Specifications, both themes | Manufacturer, Tested, Official and Estimated badges clearly outlined on the raised cards (outline ≥ 3:1 against `surface-2`; `tests/contrast.test.ts`); the badge popup still opens |
| QC10 | Section motion (overdrive, 10.7) | Animations on: open and close each section on /charging (Select vehicle, Car figures, Specifications, Trims, Sources) by click and by keyboard (Tab to the header, Enter/Space); click twice fast mid-animation | Opening: body height animates over ~320 ms, the lane line paints left→right, inner cards fade/rise in a ~30 ms stagger; closing animates ~220 ms then the section is closed (`open` false); a fast second click reverses cleanly (no stuck `acc-opening`/`acc-shutting` class, no clipped body); after opening the body has no fixed height (content changes, e.g. a new car, aren't cut off); the Select vehicle section still opens/closes from its own controlled state; no console errors |
| QC11 | Animations off (overdrive, 10.7) | Settings → Animations off (`html[data-motion="off"]`), reload; repeat QC10; open a select | Sections open and shut at once; `getAnimations()` empty on body and lane; summary, chevron and select transitions 0 s; the select list has no drop-in; turning Animations back on restores the motion without a reload |
| QC12 | Headers and source links (overdrive, 10.7) | 1280 and 375, both themes; click a `[n]` source link with Sources closed | Titles Overpass; "a · b · c" previews as pills that fade at the right edge (no overflow or horizontal scroll at 375); round chevron turns 180° and goes yellow-soft when open; lane line visible under open headers in both themes; focus outline visible on the header from the keyboard; the source link opens Sources without animating and the entry is in view |
| QC13 | Select menus (overdrive, 10.7) | 1280 and 375, both themes; every select in Select vehicle and the wheel-size select; mouse and keyboard (arrows, Enter, Escape, type-ahead) | Closed field: Overpass value, drawn chevron, no native arrow doubled, text not under the chevron (ellipsis), hover border, 3 px accent focus outline; text ≥ 4.5:1 and border ≥ 3:1; in Chrome/Edge (`appearance: base-select`) the open list is a raised surface card with rounded options, hover on surface-2, chosen row yellow-soft with a checkmark, and it drops in; picking a value still changes the car (URL and page update); keyboard selection works; disabled selects look disabled; no layout shift between closed and picked states |

## B83 results

| ID | Pass / Fail | Notes |
|----|-------------|-------|
| QC1 | PASS | Re-run: answer Overpass 800 41.6 px / 30.4 px; chart top y=675 (EV9) / 674 (i4) at 1280×800; answer above the fold at 375; values and `~` unchanged (docs/plan/reports/ui-check-b83-final.md) |
| QC2 | PASS | Re-run with the map-style slider: track = chart grid at 1280 and 375; guides within 0.6 px of the handles; arrows 1 %, no crossing, own names; chart guide drag; reload; `?from=30&to=60` (docs/plan/reports/ui-check-b83-final.md) |
| QC3 | PASS | Re-run: switch top right, no overlap at either width; Time redraws (docs/plan/reports/ui-check-b83-final.md) |
| QC4 | PASS | Re-run: EV9 #FFD400 on the 10 px band, violet outside 18–80 %; i4 violet, no band; fill both themes; guides text colour (docs/plan/reports/ui-check-b83-final.md) |
| QC5 | PASS | no yellow fill; selected border 14.67:1 dark / 16.35:1 light; focus rings visible (docs/plan/reports/ui-check-b83.md) | Superseded by QC8 (owner, round 3)
| QC6 | PASS | Readouts, chart, spec groups, Trims, Sources on raised panels (10 px, no border/shadow); lowest text contrast 5.42 dark / 5.06 light; Overpass values and titles; no horizontal scroll at 375 (docs/plan/reports/ui-check-b83-final.md) |
| QC7 | PASS | 16/12 lane dashes outside the window (yellow dark, #2B2C30 light), short 9/6 violet dashes inside where unmeasured; i4 violet (docs/plan/reports/ui-check-b83-final.md) |
| QC8 | PASS (after fix) | Settings-look switches; charger steps 50…350, Max (no limit line or map link at Max); remembered; `?kw=150`. First run: end ticks off their handles by 6.4 / 10.7 px and the `?kw=62.5` wording; fixed (end ticks centred, measured 0.0 px at 375) and the QA wording corrected (link rounds to 63 kW, B31) (docs/plan/reports/ui-check-b83-final.md) |
| QC9 | PASS | Badge outline vs surface-2: default 3.29 dark / 4.04 light, Official 9.88 / 5.61, Estimated 7.93 / 5.98; popup opens on a raised card; [n] opens Sources (docs/plan/reports/ui-check-b83-final.md; tests/contrast.test.ts) |
| QC10 | PASS (after fix) | All five sections: body 320 ms, lane paint 420 ms, staggered rise; close 220 ms then open=false; classes and animations cleared, no inline height; keyboard Enter/Space; programmatic open not animated; heights match scrollHeight after a car change (Niro EV); 375 same. Note fixed: a click mid-close kept closing; now it reverses from the current height (re-checked: 73 px → grows back, ends open, no classes or animations left) (docs/plan/reports/ui-check-b83-overdrive.md) |
| QC11 | PASS | Real Settings control sets data-motion="off", persists across reload; instant open/shut, no animations, transitions 0 s incl. ::picker(select); back on restores motion without reload (docs/plan/reports/ui-check-b83-overdrive.md) |
| QC12 | PASS | Overpass titles, pills, 375/375 no horizontal scroll; chevron 30/28 px turns 180°, yellow-soft both themes; lane 2 px both themes; [6] with Sources closed opens at once, entry in view (y 406–474 of 800) (docs/plan/reports/ui-check-b83-overdrive.md) |
| QC13 | PASS | 8 selects Overpass 600, base-select, ellipsis; text 14.67 / 16.35, border 3.79 / 4.93 (dark / light); open list raised card, chosen row yellow-soft + checkmark; ArrowDown+Enter changes car and URL; Escape cancels; focus outline; disabled Trim looks disabled. Not checked: type-ahead, non-Chromium fallback (docs/plan/reports/ui-check-b83-overdrive.md) |

# B85 QA: Compare page overdrive

Read B85 in `docs/design/gaps-and-questions.md` and `docs/design/design-language.md`. Page: `/compare?cars=kia/ev9/2026/land-awd-gt-line,hyundai/ioniq-5/2026/long-range-awd,bmw/i4/2026/edrive40-gran-coupe` (tested curve, no curve, estimated curve). Also an empty list and four cars.

| ID | Area | How to check | Pass when / edge cases |
|----|------|--------------|------------------------|
| QR1 | Design language | 1280 and 375, both themes | Car cards, chart panel, spec section follow design-language.md (Overpass names and values, raised panels without border/shadow, restyled selects, Settings-style switch); text ≥ 4.5:1; no horizontal page scroll at 375 (the spec table scrolls inside its own box) |
| QR2 | Sliders and chart | drag both window handles and the charger; arrows; reload | Window handles line up with the chart's 0–100 % axis (≤ 4 px); start can't pass end; charger steps 50…350, Max; the orange limit line follows; curves solid inside the window, lane dashes outside; estimated dashed; tooltip lists each car's kW |
| QR3 | Charge race | each figure in the switch; EV9 + IONIQ 5 (no curve) + i4 | Lanes best first (time: shortest first); bars proportional (measure widths); best lane flagged, ties both flagged, unknown last with "Unknown" and no bar; each lane states all four figures and the curve kind as text; screen reader reads a list in order with values |
| QR4 | Race motion | Animations on: drag the window so the order changes, switch figures, change the charger; then Animations off | Bars resize smoothly (no jump), re-sorted lanes slide to their new places, no lane overlaps after settling, no stuck transforms; first view grows the bars in once; with Animations off everything is instant (no transitions or animations) |
| QR5 | Specs and list edits | Only show differences on/off; variant select; Remove; empty list; 4 cars at 375 | Switch filters rows and announces state (role switch, aria-checked); the spec section unrolls (Road unrolls); best marked with icon + bold; variant change and Remove update the race, chart, table and URL; empty list shows the browse prompt; 4 cars at 375 swipe in the spec table |

## B85 results

| ID | Pass / Fail | Notes |
|----|-------------|-------|
| QR1 | PASS | Overpass names/values, borderless chart panel, role=switch; text ≥ 5.06:1 all four passes, car colours ≥ 4.73:1 on lanes; no page scroll at 1280/375, spec table scrolls in its box (docs/plan/reports/ui-check-b85.md) |
| QR2 | PASS (after fix) | Track edges = axis edges (169.5/1127.5 at 1280, 85/322 at 375), thumb 0 px off; clamp at 80/80; 8 charger stops, limit line at 150; solid inside / dashed outside, i4 dashed; tooltip per car; reload keeps both. Fixed: curves now capped at the charger kW like the Charging page (re-checked at 150 kW) (docs/plan/reports/ui-check-b85.md) |
| QR3 | PASS (after fix) | Order right for all four figures, IONIQ 5 last with "No curve yet"; bars 81.2 % / 73.2 % / 77.2 % proportional; flag + sr "Best:"; every figure as text. Fixed: time raced on the shown minutes, so bars and ties match labels (150 kW: both ~25 min, equal bars, no single best); chart alt singular for one curve (docs/plan/reports/ui-check-b85.md) |
| QR4 | PASS | Grow-in once ~0.6 s; fill transition 0.62 s; FLIP translateY ±84 px over 460 ms, nothing left after 900 ms; real Settings control Off: 0 s, no animations, instant; restored On (docs/plan/reports/ui-check-b85.md) |
| QR5 | PASS | Switch aria-checked false/true/false, rows 21/18/21; Specs unrolls; 9 best marks (star + sr text, bold); variant change and Remove update race/table/chart alt/URL/storage; empty list yellow Browse cars; 4 cars at 375 table 608 in 313 box with snap (docs/plan/reports/ui-check-b85.md) |

# B86 QA: Cars page overdrive

Read B86 in `docs/design/gaps-and-questions.md` and `docs/design/design-language.md`. Page: `/cars` (84 cars). Clear `voltway.browse` and `voltway.browseOpen` in localStorage for the first-visit checks (save and restore them).

| ID | Area | How to check | Pass when / edge cases |
|----|------|--------------|------------------------|
| QV1 | Filter sections | first visit; set a Make and a minimum range; reload; close/open sections; Clear filters; phone sheet | Every category is a collapsible section; first visit opens only sections in use (default years count as in use only if not the default); closed headers show choices as pills; open/closed survives reload; each set section shows "Clear" (named "Clear <section>"), which resets only that category, disappears and moves focus to the header; Clear filters empties pills; on a phone the sheet scrolls, Tab stays inside, Escape closes |
| QV2 | Design language | 1280 and 375, both themes | Overpass names, figures on raised readouts, map-style sliders, checkbox lists (radios for heat pump) with visible focus and checked state, 44 px rows at 375, switches for market and tested curves, restyled selects; text ≥ 4.5:1; no horizontal page scroll at 375 |
| QV3 | Live reflow | Animations on: tick a Make, change sort, type a search, clear it | Staying cards glide (FLIP), new cards rise in, removed ones fade out; nothing left mid-animation or as a ghost after ~1 s; only on-screen cards animate; table view still works |
| QV4 | Count and search | type "ioniq", then "model 3", then clear | Count ticks to the new value; the status region announces the final count once; matched words highlighted in names; no results shows the empty message |
| QV5 | Animations off | Settings → Animations off; repeat QV3 | Every change instant: no animations, no transitions, no ghosts; turning Animations back on restores motion without a reload |

## B86 results

| ID | Pass / Fail | Notes |
|----|-------------|-------|
| QV1 | | |
| QV2 | | |
| QV3 | | |
| QV4 | | |
| QV5 | | |

# B87 QA: Cars table and compare flow

Read B87 in `docs/design/gaps-and-questions.md`. Pages: `/cars` (Table view), `/compare`, `/charging`. Save and restore `voltway.compare` and `voltway.browse` in localStorage.

| ID | Area | How to check | Pass when / edge cases |
|----|------|--------------|------------------------|
| QX1 | Cars table | Table view at 1280 and 375, km and mi, dark and light; sort by each header | Table width ≤ its box at 1280 (no sideways scroll); units in headers only; port and curve under the name; sorted column marked and aria-sort right; numbers aligned; 375 stacked rows readable with no page scroll; text ≥ 4.5:1; Live reflow still glides rows |
| QX2 | Compare toggle | Cards, table and the Charging page car section: add, remove, fill to 4 | "+ Compare" adds, "− Compare" removes, names say "Add … to Compare" / "Remove … from Compare"; header count follows; a 5th add explains the limit; state matches across tabs after reload |
| QX3 | Add-a-car dialog | On /compare open the dialog, search, use the steps, try an already-compared car, Escape, Cancel | Car added at the end; compared cars marked and not selectable (search and steps); focus trapped in the dialog and returned to the opener; header "My car" picker still has trim and plug steps |
| QX4 | Ghost card | 0, 1, 3 and 4 cars | Ghost card after the cars for 1–3 (dashed, next car colour), none at 4; empty page shows it with the Cars link; specs "add another" opens the dialog; Enter/Space work |
| QX5 | Regressions | Race, chart, specs, shared link (?cars=), Animations off | Adding/removing animates the race as before and is instant with Animations off; a shared link still shows its banner; no console errors beyond known stale HMR ones |

## B87 results

| ID | Pass / Fail | Notes |
|----|-------------|-------|
| QX1 | PASS | Table box 806/806 at 1280 (km and mi), 695/695 at 1024; units in headers; aria-sort right on all 6 sortable headers; sorted column yellow underline + wash; text ≥ 6.15:1 both themes; 375 stacked rows, toggle 44×44 top-right without overlap; rows still glide (docs/plan/reports/ui-check-b87.md) |
| QX2 | PASS (after fix) | Toggle on cards, table and /charging with "Add … / Remove … from Compare" names; header count follows; state consistent after reload; painted "− Compare" 12.03:1. Fixed: the 4-car limit message is now a bottom-of-screen notice (was out of view on /cars); card toggle 44 px on phones (docs/plan/reports/ui-check-b87.md) |
| QX3 | PASS (after fix) | Focus starts in search; compared cars marked, not selectable by click/Enter, disabled in Variant; car added at the end; Escape/Cancel/✕/backdrop close and return focus; Tab trapped; long variant names keep all four dropdowns 163×31 on one line; My car picker keeps trim and plug steps. Fixed: "Already in Compare" wraps under the name on phones; dialog buttons and dropdowns 44 px on phones (docs/plan/reports/ui-check-b87.md) |
| QX4 | PASS (after fix) | Ghost at 0 (with the Cars link), 1–3 cars ("Car n of 4", next car's colour, dashed outline only), none at 4 and no "Add another car"; Enter/Space open the dialog; text ≥ 6.48:1. Fixed: focus moves to the ghost card after Remove (docs/plan/reports/ui-check-b87.md) |
| QX5 | PASS | Race/chart/specs update on add/remove; every curve solid inside the window (estimated too), dashed outside; shared link banner kept; Animations off: no animations; console only the known stale HMR errors (docs/plan/reports/ui-check-b87.md) |

# B88 QA: About page

Read B88 in `docs/design/gaps-and-questions.md`. Page: `/about`; also follow the footer's and the map's `/about#data` links.

| ID | Area | How to check | Pass when / edge cases |
|----|------|--------------|------------------------|
| QY1 | Look | 1280 and 375, dark and light | Design language (Overpass, cards, badges); hero lane paints and the marker drives once, counts tick to their values; text ≥ 4.5:1; no horizontal scroll at 375 |
| QY2 | Builder card | read and follow the links | Portfolio (https://mahabdulkhaliq.github.io/), GitHub (https://github.com/MahAbdulKhaliq) and source links open in a new tab with `rel=noopener` and say so to screen readers; the GitHub-issues line is there; no separate "Report a problem" section |
| QY3 | Sections | open/close each, click mid-close, keyboard, `/about#data` | Road-unrolls animation (lane, rise-in), reverses mid-close; Enter/Space work; `#data` opens the data section and scrolls to it; every dataset and map credit, licence link and the MIT notice still present |
| QY4 | Animations off | Settings → Animations off; reload | Hero static at its final state, counts show final values at once, sections open/close instantly; regressions: Charging/Compare/Cars sections still unroll as before |

## B88 results

| ID | Pass / Fail | Notes |
|----|-------------|-------|
| QY1 | Pass | 2026-11-19 site-ui-checker: no horizontal scroll at 1280/375 in both themes; lowest text contrast 5.53 (dark) / 5.61 (light) over 123 nodes; marker ends at 80.0 %; counts 84/8/138/0 match data-count (reports/b88/qa-report.md) |
| QY2 | Pass | All four links target=_blank, rel=noopener, sr-only "(opens in a new tab)"; no Report a problem section |
| QY3 | Pass | Closed with chips; opens to 618/1673 px with no overshoot; mid-close reverses; Enter/Space toggle; #data opens only that section, heading at 80 px under the 62 px header; 8 datasets + 2 map credits, MIT notice opens |
| QY4 | Pass | Motion off: static hero, final counts at once, instant sections; Charging (5), Compare (1), Cars (11) sections still unroll, instant with motion off |

# B89 QA: map fixes

Read B89 in `docs/design/gaps-and-questions.md`. Page: `/` (the charger map and trip planner). Plan a trip that crosses the border (e.g. Toronto → Detroit, with Stay within the border off) and one with several stops (e.g. Toronto → Montréal).

| ID | Area | How to check | Pass when / edge cases |
|----|------|--------------|------------------------|
| QZ1 | Road names | dark and light, zoom ≥ 13 on a city | Street names in their own capitals and bold; place names unchanged; shields unchanged; dark place names match the light map (proper case, bold cities, italic water) and nothing light shows through; dark highway shields are dark rectangles with light numbers, light keeps its white ones |
| QZ2 | Stations in view | open a row, Back; again but drag before Back; Animations off | Flies close in (zoom ≥ 15, charger clear of the panel); Back returns to the earlier view only when the map wasn't moved; instant with Animations off; a flight takes about 1 s at most and a far one still flies (never a jump cut) |
| QZ3 | Trip stops | tap a stop number, Back; tap it twice; tap a border diamond; keyboard | Flies to the stop and opens details; no Details button; Back and a second tap fit the whole route; border flies to the crossing; diamonds on the route; buttons have names; the start and arrival marks fly to those places and mark their cards; at 375 the sheet keeps its height on any tap (peek, half or full) and the spot shows in the map above it; each stop shows bare bolts and its top kW before Car-limited |
| QZ4 | Trip cards | 1280 and 375, dark and light | Each row on a card, route line still joins the marks, selected card marked, text ≥ 4.5:1; each mark centred on the line; How this was estimated unrolls (lane line, chevron), instant with Animations off |
| QZ5 | Closing the trip | close at the overview; close after zooming into a stop | Camera stays on (or returns to) the whole route; the line draws back in view |
| QZ6 | Phone sheet | 375: drag the sheet up and down repeatedly; tap a pin; pick a place | Filters always open, no Chargers toggle, drags only change height; pin/place lower the sheet to peek; at peek only Where to shows (no count, filters or list) and the sheet does not scroll; tapping Where to leaves the sheet as it is, typing raises it; trip (form and plan) at peek: no scrolling, car card inert, swipe up raises to half, lowering scrolls back to the top |
| QZ7 | Car accordion | before planning: open/close the car tile, change the % fields, Change car; Animations off | Fields and Change car inside it; the % values grow into the fields and back; values keep and re-plan as before; aria-expanded; instant with Animations off; Plugs used is a list with plug drawings; Change car is a row; closing has no flicker (height only shrinks) |
| QZ8 | Car picker | header Change car and Compare Add a car; 1280 and 375, dark and light; search, pick by steps, plug switches, Cancel, Escape | Overpass title, search icon, menu-style suggestions; numbered steps on one raised panel, number filled once chosen; select menus; plug rows with drawings; action bar pinned at the foot; picking, plugs and the already-compared marks work as before; text ≥ 4.5:1 |
| QZ9 | List speed, credits, locating | Stations in view with Level 2 on; open/close the ⓘ credits; Locate me (and reload with location allowed); Animations off | Bare bolts by speed and the plug for Level 2 before the kW; ⓘ stays visible and the pill animates both ways; "Finding your location…" with the road loader, not hidden by open panels; credits unroll from the ⓘ without the text reflowing and roll back into it, the ⓘ stays put, "About Voltway" first and goes to /about; bolts follow 1 < 150 kW, 2 150–<250, 3 ≥ 250 on pins, groups, the key (bare bolts), the list and stops; the opening unroll is even, not a pop (check a 150 and a 250 kW station) |

## B89 results

| ID | Pass / Fail | Notes |
|----|-------------|-------|
| QZ1 | Pass | road names no text-transform, bold; dark shield text 7.09:1 on its badge; light keeps sprite shields (docs/plan/reports/b89/qa-report.md) |
| QZ2 | Pass | row flies to z15 in ~604 ms clear of the panel; Back only if not moved; far flights ≤ 1100 ms, no jump cut; Animations off instant |
| QZ3 | Pass | stop, border, start, finish buttons fly and open; again/Back fits route; bolts + kW then Car-limited; 375 keeps sheet height. Fix after QA: Back from a stop now reads "Back to the whole route" (was "Back to stations in view") |
| QZ4 | Pass | marks centred, no contrast fails; How this was estimated unrolls ~300 ms, instant with Animations off |
| QZ5 | Pass (partial) | camera stays on the whole route on close; the line drawing back not observable in stills |
| QZ6 | Pass | peek no scroll, car card inert (real clicks), wheel/drag raises to half, lowering resets scroll; Where to tap keeps height, typing raises (mouse, not real touch) |
| QZ7 | Pass | aria-expanded, plugs list, Change car row, values kept, close only shrinks; FLIP grow not visible in stills; Animations off not checked |
| QZ8 | Pass after fix | restyle OK in header dialog and Compare Add a car, no contrast fails. Found: at 1280 the dialog reopened scrolled 32 px, clipping the title; fixed (scroll reset on open, 4/4 opens at 0) |
| QZ9 | Pass | 150/250 tiers in list and key (bare bolts), L2 plug; credits open 460 ms even / close 320 ms, ⓘ fixed, About Voltway first → /about; Animations off instant; locate loader above the sheet at 375. Not testable: auto-locate with access granted; no exact 150/250 kW station in view |

## 9. Car data rebuild (B90–B95, DESIGN-9)

Run from a fresh clone of the branch. `npm ci`, then `npm run validate && npx vitest run && npx astro check && npm run build`; all must pass. Start the dev server (`preview_start` "voltway-dev") for the screen checks. Check 1280 px and 375 px, dark and light.

| ID | Requirement | How to check | Edge cases / failure paths |
|----|-------------|--------------|----------------------------|
| QD1 | Every model lists generations (9.1) | `node -e` over `data/models/**`: each has `generations[]` with `first_year`; validate rejects a model with none | Model whose generation is still running (no `last_year`) |
| QD2 | Chargeprice curves are `community`, same generation only (9.2, B95) | `public/data/cars/tesla/model-3/2026/*.json`: no `chargeprice-2021`/`-2023` curve; grep built cars for `"kind":"tested"` with a `chargeprice-` id: none | A Chargeprice record from an older year of the *same* generation still attaches |
| QD3 | Curve linter (9.3) | `npx vitest run tests/curve-check.test.ts`; `crosswalk/GAPS.md` lists warnings; edit a curve's peak above `dc_max_kw` + 5 % → validate fails | A warned curve with `reviewed_note` can be default; without it, it isn't |
| QD4 | Curve picker (B92, 9.4) | `/charging?car=tesla/model-3/2026/performance-awd`: one curve, no dropdown; a car with two measured curves (find one with `node -e`): dropdown lists only measured curves by source and year; an IONIQ 5 with no measured curve: template, marked Estimated, no dropdown | Screen reader label on the dropdown; French-ready (no hard-coded text) |
| QD5 | Wheel picker (B93, 9.5) | A car with 18/19/20″ factory wheels offers 16–22″ only; a car with one size (19″) offers 17–21″ | Car with no wheel data: picker hidden |
| QD6 | Powertrain model (9.7–9.9) | Each `data/variants/**` has `powertrain_id` that resolves; two variants on one powertrain show the same curve; a variant's own range overrides the powertrain | Curve with `variant_id` only shows on that variant |
| QD7 | Migration kept figures (9.8) | Compare the before/after snapshot in the PR: only listed intended changes differ | IONIQ 5 "(19" Wheels)"/"(20" Wheels)" now one trim with two wheel options, each with its rated range |
| QD8 | EPA import (9.11) | `npx vitest run tests/epa.test.ts`; `data/imported/epa/2017.json` contains a Bolt EV row with range in km and Wh/km consumption | Units: 1 mi = 1.609344 km; kWh/100 mi → Wh/km = ×10 / 1.609344 |
| QD9 | Catalogue and trim names (9.12–9.15, B90) | `index.json` has a 2017 Chevrolet Bolt EV and a 2014 Tesla Model S; no trim name contains "-I", "-B", "(19\" Wheels)" or "(pre-"; each wave's review file shows owner approval | Duplicate NRCan rows (Model 3 Performance vs Performance AWD) merged or kept with a stated reason |
| QD10 | Market labels (B91, 9.16) | A model year with CA- and US-specific variants (2026 Model 3) shows "· Canada"/"· US" in the Charging, Compare and trip car pickers; a shared car (2019 Bolt EV) shows no suffix | 375 px: suffix doesn't wrap the select |
| QD11 | Scale (9.17) | Measured `index.json` size, MiniSearch build and Cars first render within the budgets in CHECKLIST 9.17 | Year select order: newest first |
| QD12 | Research process (9.18–9.20, B94, B95) | Read the three agent files and the skill: curve researcher exists with dense-point and source rules; spec researcher has no curve duty and market-neutral sources; fact-checker checks plausibility; source licences recorded in `data/sources/` | No source fetched by working around a bot block (evkx.net is manual reference only) |
| QD13 | Review before push (owner, 2026-11-19) | `git log origin/main..` vs what the owner approved: no Phase 9 data was pushed before the owner's review | — |

## Phase 9 results

| ID | Pass / Fail | Notes |
|----|-------------|-------|
| QD1 | | |
| QD2 | | |
| QD3 | | |
| QD4 | | |
| QD5 | | |
| QD6 | | |
| QD7 | | |
| QD8 | | |
| QD9 | | |
| QD10 | | |
| QD11 | | |
| QD12 | | |
| QD13 | | |

## Outside temperature (B116, DESIGN-temperature)

Branch `feat/b116-outside-temperature` (owner approved going live 2026-11-20). Run `npx vitest run tests/temperature-effect.test.ts tests/i18n.test.ts`, then `npx astro check && npm run build`. Screen checks run on the dev server at 1280 px and 375 px, dark and light.

| ID | Requirement | How to check | Edge cases / failure paths |
|----|-------------|--------------|----------------------------|
| QT1 | The formula follows design §3 | Unit tests. Spot values: `retention(0,'none')` = 0.75, `retention(0,'heat_pump')` = 0.83, `retention(-10,'none')` = 0.60, `retention(32,…)` = 0.95 | −40 °C → clamped to the −30 °C value with `clamped: true`; 50 °C → 45 °C value; NaN → treated as 20 °C (no change) |
| QT2 | Every adjusted figure is sourced | Set −10 °C: the range tile's badge is Estimated, its source is a B116 study, and the note gives the temperature basis. The Sources list gains the B116 studies. | Wheels and temperature both changed: the note gives both bases, and Rated: shows the official figure |
| QT3 | Heat-pump states | `chevrolet/bolt/2027/bolt` (LFP, standard): −10 °C → −38 % (−33 % plus the LFP penalty, QT9). `audi/q4-e-tron/2023/q4-40-e-tron` (none) → −40 %. `audi/q4-e-tron/2022/q4-50-e-tron-quattro` (optional) → −40 % plus "With the heat pump: −33% (−20% to −42%)". A trim with unknown heat pump (`bmw/i3-sedan/2027/i3-50-xdrive-2`) → −40 % plus "assumes none" | 30 °C: no heat-pump notes (the curves are the same) |
| QT4 | Chemistry | LFP car at −5 °C: charging note shown; at 5 °C: hidden. NMC/NCA cars: never shown | Unknown chemistry: no note |
| QT5 | °C/°F switch | Switch to °F: −10 °C shows as 14 °F; typing 32 °F gives the 0 °C figures; reload keeps °F; with no saved choice and miles selected, °F is the default | Typing in °F then switching back shows whole °C |
| QT6 | Placement and layout | 1280 px: the field and switch fill the cells under Range basis / Wheels. 375 px: no horizontal scroll, field and switch on one row, the note wraps cleanly. Dark and light: text contrast ≥ 4.5:1 | Car with several curves (a curve picker row): the field still follows Price, with no overlap |
| QT7 | Figures follow | At −10 °C: range, consumption, "km added" and "km per 10 min" all change by the same factor as the note, and every changed figure (both "Added per 10 min" and "Added (…)") shows "~" | 20 °C: identical to before the feature |
| QT9 | LFP penalty (owner 2026-11-20) | Unit tests; on screen, Bolt 2027 (LFP, heat pump) at −10 °C shows −38 % vs. −33 % for an NMC heat-pump car | 10 °C and above: same as NMC; LMFP treated as LFP |
| QT10 | Heat pump checkbox (owner 2026-11-20) | `audi/q4-e-tron/2022/q4-50-e-tron-quattro` at −10 °C: checkbox unticked → −40 % + "With the heat pump: −33%"; ticked → −33 %, no extra line, and the range tile follows | No checkbox on standard/none/unknown trims; switching trim unticks it |
| QT11 | Best/worst band and Estimate labels (owner 2026-11-20) | Unit tests. At −10 °C, `audi/q4-e-tron/2023/q4-40-e-tron` reads "Estimate: range −40% vs. mild weather (likely −28% to −48%)"; the Q4 50 with Heat pump unticked also shows "With the heat pump: −33% (−20% to −42%)"; picking 21″ wheels reads "Estimate: …% energy per km…" | 20 °C: "Mild weather: range as rated", no band; the figures use the middle only |
| QT12 | Heat pump note (owner 2026-11-20) | −10 °C: 2027 Bolt (standard) shows "…saves about 7% of range here…" after the LFP note, and at 30 °C "…saves no range at this temperature."; Q4 50 with the box ticked shows "Heat pump: saves about 7%…"; the Wheels "Estimate:" line is bold; Q4 40 (none) shows "No heat pump on this trim…" | Q4 50 (optional, unticked) and i3 sedan (unknown): neither note. At 20 °C and up the no-heat-pump note is gone; a standard heat pump at 30 °C says it saves no range |
| QT13 | Range basis defaults to Combined (B117) | Open `/charging` for a car with combined, highway and city figures: Range basis shows Combined, and the Car figures "Added per 10 min" equals the viewer's | A car without a combined figure (`cadillac/escalade-iq/2025/awd`): the select shows Highway, the label reads "Added (Highway)", and the missing bases are greyed out |
| QT14 | New logo (B118, owner 2026-11-20) | Every page's header shows `/logo.png` (the V, road and bolt with a cream outline), the same file and size (39×28) in light, dark and a theme picked in Settings. `/favicon.ico` (16/32/48), `/favicon-192.png` and `/apple-touch-icon.png` show the new mark; Base.astro links all three; `/favicon.svg` is gone and nothing links it. `public/og.png` shows the new mark beside "Voltway". `node scripts/logo-assets.mjs` then `node scripts/og-image.mjs` reproduce the files | Animations off: no strike-in or hover jolt; first page of a visit: the mark strikes in once; 375 px: the header still fits with My car and Settings |
| QT8 | Goes live as one PR | After the owner's go-ahead (2026-11-20): one PR from `feat/b116-outside-temperature`, CI green, squash-merged; production serves the new `/favicon.ico` and `/apple-touch-icon.png` | — |

## Compare costs (B119)

Run `npx vitest run tests/price.test.ts`, then open `/compare?cars=kia/ev3/2027/long-range-awd,tesla/model-3/2018/long-range-awd` at 1280 px and 375 px, dark and light.

| ID | Requirement | How to check | Edge cases / failure paths |
|----|-------------|--------------|----------------------------|
| QC1 | Controls under the curve | Charger, Range basis (starts at Combined), Distance km/mi and Price per kWh sit in one row at 1280 px; at 375 px the charger is full width and the others wrap two per row, with no sideways scroll | Switching km/mi here also switches the header and other pages; changing the price here shows on the Charging page and in Settings |
| QC2 | Costs on each lane | Per 10 min shows ~$ for 10 minutes; 10% → 80% shows ~$ for the charge (= energy added ÷ 0.92 × price); Added shows ~$/100 km. Check one by hand: cost/100 km × km added ÷ 100 ≈ the charge cost | Average power has no cost; a car with no consumption figure shows no per-100 cost and Unknown for km; a car with no curve shows no costs |
| QC4 | Sources and popovers (owner 2026-11-20) | Click any "[n]" in the spec table: the Sources section opens, scrolls to source n and highlights it; the same source shows the same number under every car. Scroll the table fully right and open a badge in the last column at 1280 and 375 px: the popover is fully visible. The km \| mi switch fills its cell; group rows have square top corners. With a 400v and an 800v car, Voltage class marks the 800v one best | Two 800v cars and no 400v: no star (all equal). A badge near the bottom of the table opens upward when there is more room above; Animations off: the highlight shows without the fade |
| QC3 | Everything follows the settings | Highway → mi → /usr/bin/bash.60: every distance and cost changes, /100 km becomes /100 mi, and the race re-sorts when racing by Added | A car without a combined figure keeps its highway figure on Combined |

## Compare costs results

| ID | Pass / Fail | Notes |
|----|-------------|-------|

## Outside temperature results

| ID | Pass / Fail | Notes |
|----|-------------|-------|
