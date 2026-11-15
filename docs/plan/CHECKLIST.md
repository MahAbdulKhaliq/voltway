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
- [ ] **0.5 GitHub repo + CI** (owner approves repo name first)
  - Files: `.github/workflows/ci.yml`
  - Done when: the public repo exists, `main` is pushed, and the CI workflow passes on a test PR.
- [ ] **0.6 Vercel import** (owner does it in the dashboard)
  - Done when: the connector shows a READY production deployment, and the test PR has a READY preview deployment.

## Phase 1: Data layer

- [ ] **1.1 JSON Schemas + validator**
  - Files: `schema/*.schema.json`, `scripts/validate.ts`, `tests/schema.test.ts`, `tests/fixtures/invalid/*`
  - Done when: `npm run validate` passes on the real data, and tests prove each of these fails: a bare number, a sourced value with no `source_id`, a `source_id` not in the sources table, a one-point curve, an unsorted curve, a wrong unit, two display-default curves on one variant.
- [ ] **1.2 NRCan fetch + importer**
  - Files: `scripts/fetch-nrcan.ts`, `scripts/import-nrcan.ts`, `sources/nrcan/`, `data/imported/nrcan/`, `data/sources/src-nrcan-bev-*.json`
  - Done when: the raw CSV is committed with its fetch date; imported records hold Wh/km (= kWh/100 km × 10), range km and 240 V recharge h as `rated_nrcan` sourced values; a unit test checks the conversion on a known row.
- [ ] **1.3 OpenEV Data importer**
  - Files: `scripts/import-openev.ts`, `sources/openev/`, `data/imported/openev/`
  - Done when: a pinned release is imported; values are tagged manufacturer-via-OpenEV; homepage-only source URLs carry `low_confidence`; validate passes.
- [ ] **1.4 Chargeprice importer**
  - Files: `scripts/import-chargeprice.ts`, `sources/chargeprice/`, `data/imported/chargeprice/`
  - Done when: measured curves import as `tested` with the Fastned → Chargeprice chain in notes; default curves are skipped and listed in a log; the MIT attribution is in the source record.
- [ ] **1.5 Match suggester + crosswalk**
  - Files: `scripts/match.ts`, `crosswalk/crosswalk.csv`, `crosswalk/unmatched.md`
  - Done when: suggestions are written with `confirmed=false`; unmatched records are listed; the owner has confirmed the starter-set rows; the build ignores unconfirmed rows (tested).
- [ ] **1.6 Starter set + hand entry**
  - Files: `data/makes/`, `data/models/`, `data/variants/`, `data/curves/`, `data/sources/`
  - Done when: the owner has approved the ~25-car list; each car has every MVP field filled or explicitly `"unknown"`; each hand-entered figure cites a specific-page source.
- [ ] **1.7 Data build (merge, precedence, conflicts, estimated curves, export)**
  - Files: `scripts/build-data.ts`, `src/lib/precedence.ts`, `src/lib/estimated-curve.ts`, `public/data/index.json`, `public/data/cars/*.json`
  - Done when: `npm run build` writes the index + one file per car; tests cover precedence order (incl. direct OEM > tested > via OpenEV > Chargeprice), the >5% conflict flag, estimated curves never default when a measured curve exists, and `sold_in_canada` derived from confirmed NRCan rows.

## Phase 2: Charging maths + calibration

- [ ] **2.1 Charging maths**
  - Files: `src/lib/charging.ts`, `tests/charging.test.ts`
  - Done when: tests pass for a flat curve (time = kWh/kW), a charger cap (lost time > 0), linear interpolation between points, 0%/100% edges, and km per 10 min.
- [ ] **2.2 Template calibration**
  - Files: `scripts/calibrate.ts`, planning `charging-curve-viewer.md` §9
  - Done when: the calibration report is shown to the owner, the owner approves the tuned numbers, and they are recorded in §9 and used by `estimated-curve.ts`.

## Phase 3: UI foundation

- [ ] **3.1 i18n + units + storage**
  - Files: `src/i18n/en.json`, `src/i18n/t.ts`, `src/lib/units.ts`, `src/lib/storage.ts`
  - Done when: tests cover missing-key detection, unit conversions, and storage that throws silently falling back to memory.
- [ ] **3.2 Layout, header, themes**
  - Files: `src/layouts/Base.astro`, `src/components/Header.astro`
  - Done when: header shows Cars, Compare (n), My car, km|mi (no Map/Trip); light/dark follows the device.
- [ ] **3.3 SourceBadge**
  - Files: `src/components/SourceBadge.tsx`
  - Done when: it shows the kind text, opens to source + other figures, shows ⚠ on conflicts, grey "Unknown", estimated style with "~".

## Phase 4: Car page + curve viewer

- [ ] **4.1 Car pages** — `src/pages/cars/[...id].astro`. Done when: one static page per variant at `/cars/make/model/year/variant`, key tiles with badges, specs, trims, sources.
- [ ] **4.2 Curve viewer island** — `src/components/CurveViewer.tsx`. Done when: every MVP item in charging-curve-viewer.md §2, §4, §5 works in the browser (checked manually).

## Phase 5: Browse + picker

- [ ] **5.1 Browse** — `src/pages/cars/index.astro`, `src/components/Browse.tsx`. Done when: cards/table, all MVP filters and sorts in database-ui.md §4, Canada on by default.
- [ ] **5.2 First-load picker + My car** — Done when: search and step pickers work, "Just browsing" skips, My car persists and drives the header chip and default car.

## Phase 6: Compare

- [ ] **6.1 Compare screen** — `src/pages/compare.astro`, `src/components/Compare.tsx`. Done when: every item in database-ui.md §6 and charging-curve-viewer.md §6 works.

## Phase 7: About & polish

- [ ] **7.1 About & sources** — Done when: every required license credit is shown.
- [ ] **7.2 Accessibility + phone layout** — Done when: charts have a table view, best values use icon + bold, tables stack at phone width.

## Phase 8: Data refresh automation

- [ ] **8.1 Scheduled checks** — `.github/workflows/data-refresh.yml`. Done when: a manual run opens a PR when the NRCan/OpenEV copy differs, and does nothing when it doesn't.

## Phase 9: Independent QA

- [ ] **9.1** Run the `qa-reviewer` subagent against `docs/plan/QA.md`; fix findings; re-run on fixed items.
