# Phase 1 build checklist

Built from [DESIGN.md](DESIGN.md). Planning docs: `G:\Work\Ideating\EV-App-Planning` (detailed docs win over overview.md).
Tick an item only when its **Done when** is verified. Note skipped or stubbed work inline.

---

## Phase 0: Project foundation

- [x] **0.1 Project CLAUDE.md**
  - Files: `CLAUDE.md`
  - Done when: it points to the planning folder, says detailed docs win, and records every rule from the kickoff message (source of truth, propose-don't-change, update docs + gaps on approval, roadmap order / Phase 1 only, stack, no bare numbers, translatable text, learning project, Vercel read-only without asking).
- [x] **0.2 Plan files**
  - Files: `docs/plan/DESIGN.md`, `docs/plan/CHECKLIST.md`, `docs/plan/QA.md`
  - Done when: all three exist; QA.md can be followed without this conversation.
- [x] **0.3 Record approved decisions in the planning docs**
  - Files: planning `phase1-stack.md`, `data-sources.md`, `vehicle-data-model.md`, `gaps-and-questions.md`
  - Done when: React + ECharts, skip Chargeprice default curves, and kind+source precedence are written in the matching doc and logged in gaps-and-questions.md dated 2026-11-15.
- [x] **0.4 Repo + scaffold** (needs Node LTS installed by the owner)
  - Verified 2026-11-15: Node v26.13.1 (LTS), Astro 7.4, `npm test` 4 passing, `npm run build` → `dist/index.html`, `astro check` 0 errors. *Note:* `scripts/validate.ts` and `scripts/build-data.ts` are placeholders until 1.1 / 1.7.
  - Files: `.gitignore`, `README.md`, `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`
  - Done when: `node --version` is an even-numbered LTS; `git status` works; `npm run build` produces `dist/`; `npm test` runs (Vitest) with at least one passing test.
- [x] **0.5 GitHub repo + CI** (owner approves repo name first)
  - Files: `.github/workflows/ci.yml`
  - Done when: the public repo exists, `main` is pushed, and the CI workflow passes on a test PR.
  - Progress 2026-11-15: repo `MahAbdulKhaliq/voltway` created (public), `main` pushed, CI green on the push to main and on test PR #1 (merged).
- [x] **0.6 Vercel import** (owner does it in the dashboard)
  - Done when: the connector shows a READY production deployment, and the test PR has a READY preview deployment.
  - Verified 2026-11-15 **without the connector** (it returns 403 until the owner approves it for their Vercel account): Vercel's GitHub status was "success" on `main` and on PR #1; production https://voltway-ten.vercel.app/ returns HTTP 200 with our page; the owner opened the PR preview (protected by Vercel Authentication). Re-check through the connector once it's approved.

## Phase 1: Data layer

- [x] **1.1 JSON Schemas + validator**
  - Files: `schema/*.schema.json`, `scripts/validate.ts`, `scripts/lib/validate-data.ts`, `scripts/lib/csv.ts`, `tests/schema.test.ts`, `tests/fixtures/valid-repo/` (invalid cases are made by editing a temp copy of the valid fixture, one rule per test)
  - Verified 2026-11-15: 28 schema tests pass, covering every case below plus missing kind/unit, bad enum, homepage-only source, id/path mismatch, unsorted or repeated SoC, stored "estimated" curve, bad crosswalk rows. `npm run validate` OK on the (still empty) real data; `astro check` 0 errors.
  - Done when: `npm run validate` passes on the real data, and tests prove each of these fails: a bare number, a sourced value with no `source_id`, a `source_id` not in the sources table, a one-point curve, an unsorted curve, a wrong unit, two display-default curves on one variant.
- [x] **1.2 NRCan fetch + importer**
  - Files: `scripts/fetch-nrcan.ts`, `scripts/import-nrcan.ts`, `scripts/lib/nrcan.ts`, `schema/imported-nrcan.schema.json`, `sources/nrcan/`, `data/imported/nrcan/`, `data/sources/src-nrcan-bev-2026-09.json`, `tests/nrcan.test.ts`
  - Done when: the raw CSV is committed with its fetch date; imported records hold Wh/km (= kWh/100 km × 10), range km and 240 V recharge h as `rated_nrcan` sourced values; a unit test checks the conversion on a known row.
  - Verified 2026-11-15: 1,250 rows (2012–2026) → 15 files; `sources/nrcan/FETCHED.json` records fetch date + sha256; conversion tested on a verbatim 2026 Volvo EX30 row; a test re-derives 2026.json from the raw CSV and compares; validator rejects bare numbers in imports and crosswalk keys missing from the import. Motor kW also imported (as `rated_nrcan`) to help matching.
- [x] **1.3 OpenEV Data importer**
  - Files: `scripts/fetch-openev.ts`, `scripts/import-openev.ts`, `scripts/lib/openev.ts`, `schema/imported-openev.schema.json`, `sources/openev/`, `data/imported/openev/`, `data/sources/src-openev-v1-24-0.json`, `tests/openev.test.ts`
  - Done when: a pinned release is imported; values are tagged manufacturer-via-OpenEV; homepage-only source URLs carry `low_confidence`; validate passes.
  - Verified 2026-11-15: v1.24.0 pinned (sha256 in FETCHED.json); 665 North American records → 38 make files; all values cite `src-openev-v1-24-0`; 24% of records flagged `low_confidence`; validate OK; 14 OpenEV tests incl. a full re-derivation of the committed import from the raw release. Mapping rules in DESIGN.md. No Kia (D13 confirmed); no curves in this release.
- [x] **1.4 Chargeprice importer**
  - Files: `scripts/fetch-chargeprice.ts`, `scripts/import-chargeprice.ts`, `scripts/lib/chargeprice.ts`, `schema/imported-chargeprice.schema.json`, `sources/chargeprice/`, `data/imported/chargeprice/` (incl. `SKIPPED.md`), `data/sources/src-chargeprice-archive-2025-04.json`, `tests/chargeprice.test.ts`
  - Done when: measured curves import as `tested` with the Fastned → Chargeprice chain in notes; default curves are skipped and listed in a log; the MIT attribution is in the source record.
  - Verified 2026-11-15: pinned commit 32d7dc5; 1,282 cars → 69 files; 122 curves `tested` with the chain in notes; 407 flagged-default + 753 unflagged generic shapes skipped and listed in SKIPPED.md; attribution text is the licence's exact wording. **Owner review pending** on the generic-shape filter (DESIGN.md).
- [x] **1.5 Match suggester + crosswalk**
  - Files: `scripts/match.ts`, `crosswalk/crosswalk.csv`, `crosswalk/unmatched.md`
  - Done when: suggestions are written with `confirmed=false`; unmatched records are listed; the owner has confirmed the starter-set rows; the build ignores unconfirmed rows (tested).
  - Progress 2026-11-15: `scripts/lib/match.ts` + `scripts/suggest-matches.ts` done (12 tests). Proposed starter set in `crosswalk/starter-set.json` (25 models → 84 proposed variants); `crosswalk/suggestions.csv` (all `confirmed=false`) and `crosswalk/REVIEW.md` generated, incl. "no candidate found" lines for unmatched variants. **Waiting on:** owner review of REVIEW.md (starter list, variant grouping, matches) and the onboard-charger question. "Build ignores unconfirmed rows" is tested in 1.7.
  - Verified 2026-11-16: owner confirmed the starter rows (B8; 197 rows `confirmed=true` in `crosswalk/crosswalk.csv`); `tests/build.test.ts` "ignores unconfirmed crosswalk rows" passes. Stale matches withdrawn under B9 (IONIQ 5 Long Range).
- [ ] **1.6 Starter set + hand entry**
  - Files: `data/makes/`, `data/models/`, `data/variants/`, `data/curves/`, `data/sources/`
  - Done when: the owner has approved the ~25-car list; each car has every MVP field filled or explicitly `"unknown"`; each hand-entered figure cites a specific-page source.
  - Progress 2026-11-15: owner approved the starter set, grouping and matches (B8), plus B6 and B7. `scripts/create-starter-records.ts` generated 13 makes, 25 models, 84 variant skeletons (one trim per NRCan row) and 197 confirmed crosswalk rows (NRCan rows linked to their trim via `our_trim_id`). 19 variants have drivetrain `"unknown"` until hand entry. F-150 Lightning ER split into `-123-kwh` / `-131-kwh` ids (pack size added to slugs). Hand entry started: 2026 IONIQ 5 Long Range variants (port, Supercharger access, heat pump, 84.0 kWh gross, 10–80% claim) from Hyundai Canada; their stale OpenEV 2025 / Chargeprice 2021 matches dropped under B9. **Still to do:** hand entry for the other models (see `npm run gaps`), plus IONIQ 5 usable kWh, DC kW and voltage from a 2025+ source. **Paused 2026-11-15** (owner out of usage): owner wants rough quick web lookups, not deep research. Applied: `research/hyundai-2026.json`. Found but not applied: `research/NOTES.md` (Kia, IONIQ 6, GM). Next: apply NOTES.md findings, then look up the remaining models listed there.
  - Progress 2026-11-15 (B14): research tooling extended: sourced trim wheels in the schema and `add-facts.ts`, wheel and 10–80 % counts in `npm run gaps`, preconditioning and wheels in the researcher/checker agents. Then parallel research batches for the models with no lookups yet.
  - Progress 2026-11-15: six parallel research batches (Ford, VW/BMW, Toyota/Subaru, Nissan, Volvo/Polestar, preconditioning/wheels/Supercharger for earlier makes), each fact-checked (`research/*.check.md`) and fixed, then applied. Gaps now: preconditioning 76, chemistry 61, wheel sizes 58, Supercharger 37, heat pump 25 (+29 standard-or-optional), usable battery 24, port 17, AC 17, DC 14, voltage 11, drivetrain 4; no published 10–80 % 62. Open: LYRIQ 2026 port (evidence points to CCS1 + adapter, no page states it), Hyundai/GM preconditioning (pages blocked or silent), Kia/Tesla preconditioning needs a model-specific Canadian or owner-manual source.
  - Progress 2026-11-15 (B15, B16): research flow rebuilt: US-first and thorough per variant, estimates with a stated basis, measured and borrowed curves in batches (`add-facts` writes `data/curves/`), curve state in `npm run gaps` (75 of 84 template only), `fill-data-gaps` skill. Next: run it, starting with E-GMP (IONIQ 5/6, EV6, EV9, IONIQ 9).
  - Progress 2026-11-15: first run of the flow on E-GMP (two batches, both fact-checked and fixed). Added: EV9 measured curve (InsideEVs, GT-Line) borrowed by Land AWD, Wind and GT; IONIQ 9 Standard community curve (3 points; the AWD borrows were dropped, usable 106 vs 99.5 unreconciled); chemistry, wheels, usable/AC/DC for EV9 and IONIQ 9; IONIQ 6 port/Supercharger; IONIQ 5 N port. Gaps: 6/84 complete (was 0); template curve only 70 (was 75); preconditioning 69, chemistry 45, wheel sizes 47, Supercharger 34, heat pump 23 (+29), usable 20, port 14, AC 10, DC 11, voltage 11, drivetrain 4; no published 10–80 % 61. Still open: no measured curve for IONIQ 5/6, EV6, IONIQ 5 N or EV9 Light; IONIQ 5 DC peak; Hyundai (NE1) and Kia EV6 (CV1) preconditioning; EV6 Light/Wind matched to Chargeprice's EV6 GT record (Light shows 80 kWh usable on a 63 kWh pack; EV6 voltage 400v), needs an owner decision on the B8 match. Next: other platform groups (Ultium, Toyota/Subaru, Tesla, Ford, VW/BMW, Nissan, Volvo/Polestar).
- [x] **1.7 Data build (merge, precedence, conflicts, estimated curves, export)**
  - Files: `scripts/build-data.ts`, `src/lib/precedence.ts`, `src/lib/estimated-curve.ts`, `public/data/index.json`, `public/data/cars/*.json`
  - Done when: `npm run build` writes the index + one file per car; tests cover precedence order (incl. direct OEM > tested > via OpenEV > Chargeprice), the >5% conflict flag, estimated curves never default when a measured curve exists, and `sold_in_canada` derived from confirmed NRCan rows.
  - Verified 2026-11-16: `npm run build` writes public/data/index.json + 84 car files (9 tested and 51 estimated default curves; 24 cars have no DC peak yet, so no curve). 20 build tests: precedence for range/spec/fact groups incl. B4, WLTP never default, >5 % and fact conflicts, estimated never default when measured exists, sold_in_canada from confirmed NRCan rows, unconfirmed rows ignored, every cited source exists. Files live in `scripts/lib/build.ts`, `src/lib/estimated-curve.ts`, `src/lib/types.ts`. Gross-capacity fallback noted in DESIGN.md.

## Phase 2: Charging maths + calibration

- [x] **2.1 Charging maths**
  - Files: `src/lib/charging.ts`, `tests/charging.test.ts`
  - Done when: tests pass for a flat curve (time = kWh/kW), a charger cap (lost time > 0), linear interpolation between points, 0%/100% edges, and km per 10 min.
  - Verified 2026-11-15: 18 tests pass, incl. the QA.md hand example (49 kWh, 29.4 min, 58.8 min on 50 kW, ≈83.3 km/10 min), the exact ln 3 integral for a linear curve, partial charger caps, minutes above 100/150/200 kW, start = end, 0→100 %, non-step-aligned windows, unknown consumption, and rejected inputs. Midpoint rule over 0.5 % steps; no loss factor (C9); estimated results rounded to 5 min by `displayMinutes`.
- [ ] **2.2 Template calibration**
  - Files: `scripts/calibrate.ts`, planning `charging-curve-viewer.md` §9
  - Done when: the calibration report is shown to the owner, the owner approves the tuned numbers, and they are recorded in §9 and used by `estimated-curve.ts`.

## Phase 3: UI foundation

- [x] **3.1 i18n + units + storage**
  - Files: `src/i18n/en.json`, `src/i18n/t.ts`, `src/lib/units.ts`, `src/lib/storage.ts`
  - Done when: tests cover missing-key detection, unit conversions, and storage that throws silently falling back to memory.
  - Verified 2026-11-16: `tests/ui-lib.test.ts` covers unit conversions, Canadian number formatting, storage falling back to memory, and labels for every kind and enum value; `t()` throws on a missing key (i18n.test.ts). Also `src/lib/format.ts`, `src/scripts/units-client.ts`.
- [x] **3.2 Layout, header, themes**
  - Files: `src/layouts/Base.astro`, `src/components/Header.astro`
  - Done when: header shows Cars, Compare (n), My car, km|mi (no Map/Trip); light/dark follows the device.
  - Verified 2026-11-16 in the browser: header shows Cars and km|mi; Compare and My car stay hidden until Phases 5–6 build them (CLAUDE.md: hide links to parts that do not exist); no Map/Trip; dark theme follows the device; no horizontal scroll at 375 px.
- [x] **3.3 SourceBadge**
  - Files: `src/components/SourceBadge.tsx`
  - Done when: it shows the kind text, opens to source + other figures, shows ⚠ on conflicts, grey "Unknown", estimated style with "~".
  - Verified 2026-11-16: `src/components/SourceBadge.astro` (+ `FieldValue.astro`) shows the kind text and opens (native details element, no JS) to source, date, notes and other figures; ⚠ on conflicts; grey "Unknown"; dashed italic style for estimated; dotted border for low confidence.

## Phase 4: Car page + curve viewer

- [x] **4.1 Car pages** — `src/pages/cars/[...id].astro`. Done when: one static page per variant at `/cars/make/model/year/variant`, key tiles with badges, specs, trims, sources.
  - Verified 2026-11-16: 84 static pages at /cars/make/model/year/variant; sibling variants as links (no separate trim selector: trims are shown in a table), six key tiles with badges, grouped specs, trims table (per-trim NRCan range, heat pump), sources list, not-sold-in-Canada banner. Home page lists every car until Phase 5.
  - **Changed 2026-11-16 (owner decision B11):** per-variant pages replaced by the **Charging tab** (`/charging`, also the home page): Make → Model → Year → Variant → Trim dropdowns, key figures, curve viewer, specs, trims, sources on one screen; URL follows the choice. **Cars tab** (`/cars`) lists make → model accordions linking into Charging. Old `/cars/<id>` links redirect. Files: `src/components/CarExplorer.tsx`, `src/components/react/Badge.tsx`, `src/components/ChargingPage.astro`, `src/pages/{index,charging}.astro`, `src/pages/cars/index.astro`, `src/pages/cars/[...id].astro`.
- [ ] **4.2 Curve viewer island** — `src/components/CurveViewer.tsx`. Done when: every MVP item in charging-curve-viewer.md §2, §4, §5 works in the browser (checked manually).
  - Progress 2026-11-16: `src/components/CurveViewer.tsx` works in the browser: curve dropdown, SoC sliders, presets 50–350 kW + custom + No limit, range basis, SoC/time toggle, results panel (time, km added, km/10 min, average kW, lost to charger limit, curve source), More detail (peak, minutes above 100/150/200 kW, raw points table, conditions, basis), warm-battery note, estimated banner with explanation, dashed estimated line, ~ rounding, km/mi live. **Not done:** draggable window guides on the chart (the sliders set the window instead).

## Phase 5: Browse + picker

- [ ] **5.1 Browse** — `src/pages/cars/index.astro` (now the Cars tab accordions, B11), `src/components/Browse.tsx`. Filters and sorting get added to the Cars tab. Done when: cards/table, all MVP filters and sorts in database-ui.md §4, Canada on by default.
- [ ] **5.2 First-load picker + My car** — Done when: search and step pickers work, "Just browsing" skips, My car persists and drives the header chip and default car.

## Phase 6: Compare

- [ ] **6.1 Compare screen** — `src/pages/compare.astro`, `src/components/Compare.tsx`. Done when: every item in database-ui.md §6 and charging-curve-viewer.md §6 works.

## Phase 7: About & polish

- [ ] **7.1 About & sources** — Done when: every required license credit is shown.
- [ ] **7.2 Accessibility + phone layout** — Done when: charts have a table view, best values use icon + bold, tables stack at phone width.
  - Progress 2026-11-15 (B18): Charging tab collapsed into accordions (vehicle picker with car preview, curve first, then Car figures and assumptions, Specifications, Trims, numbered Sources); Wikipedia-style [n] source references; curve controls no longer overlap, two per row on phones. Checked at 375 px and desktop width.
  - Progress 2026-11-15 (B19): price per kWh input (default C$0.45, Canadian Supercharger typical) and cost result (energy ÷ 0.92 assumed DC efficiency × price); km/mi switch moved into the curve controls; header shows a hamburger menu of pages. Checked at 375 px and desktop width.

## Phase 8: Data refresh automation

- [ ] **8.1 Scheduled checks** — `.github/workflows/data-refresh.yml`. Done when: a manual run opens a PR when the NRCan/OpenEV copy differs, and does nothing when it doesn't.

## Phase 9: Independent QA

- [ ] **9.1** Run the `qa-reviewer` subagent against `docs/plan/QA.md`; fix findings; re-run on fixed items.
