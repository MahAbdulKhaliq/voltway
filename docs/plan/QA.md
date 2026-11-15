# Phase 1 QA guide

A standalone guide for verifying Phase 1 with no memory of how it was built. Read these first:

- `docs/plan/DESIGN.md` (the build plan) and `CLAUDE.md` (the rules)
- Planning docs in `G:\Work\Ideating\EV-App-Planning`: `vehicle-data-model.md`, `data-sources.md`, `charging-curve-viewer.md`, `database-ui.md`, `phase1-stack.md`. **Detailed docs win over `overview.md`.**

Report every gap: what you checked, what you expected (with doc + section), what you saw.

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
