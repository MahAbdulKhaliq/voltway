# Phase 1b build plan: calibration, Cars filters, My car, Compare (approved 2026-11-16)

## Context
Phase 2 (charger map) is done except M5, which waits for the 2026-12-01 monthly refresh. Owner decision B21 puts Phase 1b next: CHECKLIST items **2.2 template calibration, 5.1 Cars filters/sorts, 5.2 first-load picker + My car, 6.1 Compare**. 5.2 also carries the map's "Chargers my car can use" toggle and My-car Tesla notes (B28), plus the cross-links "Find chargers this fast" and "How fast would my car charge here?" (B31). Today these are one-line checklist items with no detailed plan.

**Owner answers from this planning round (recorded as B37–B40 in gaps-and-questions.md):**
- **B37 Picker placement:** the full first-load picker sits on `/charging` when no My car is set; it replaces today's auto-opened dropdowns. The map has no wall, only a small "Set my car" prompt the visitor can dismiss.
- **B38 Adapters:** "Chargers my car can use" uses `charge_port` + `supercharger_access`. `adapters_included` is added to the schema as an optional sourced field and shows as Unknown until researched. TD-P6 is narrowed to that research.
- **B39 Cars tab:** cards by default with a table toggle, a filter panel (a bottom sheet on phones) and sorts (database-ui.md §4). The make → model accordions are removed.
- **B40 Header:** a My car chip and a Compare (n) chip at the top right. The Compare chip is hidden while the list is empty. Compare is also listed in the side menu.

## Shared groundwork (in the first PR that needs it)
- `src/lib/storage.ts` KEYS: add `myCar` (`{carId, trimId}`), `compare` (car id list, max 4), `browse` (filters, sort, view), `mapCarNudge` (dismissed).
- New `src/lib/my-car.ts`: get/set/forget My car and the compare list. Changes go out as `voltway:mycar` / `voltway:compare` window events, the same pattern as `voltway:units` in `units-client.ts`, so the header chips and islands stay in sync. Covered by unit tests.
- Every string goes in `src/i18n/en.json`.

## 2.2 Template calibration (PR 1; the numbers need owner approval)
- `scripts/calibrate.ts` (`npm run calibrate`) reads `public/data/cars/*.json`. For every variant with a tested/community curve and/or `published_10_80_min`, it builds the template estimate (`estimateCurve` in `src/lib/estimated-curve.ts`, timed with `calculateCharge` in `src/lib/charging.ts`). It compares that 10–80 % time with the tested curve's time, or else with the published figure (tested counts for more, §9 step 3), and reports the error per car and per template. The target is ±15 %.
- Tuning: a small search over the template fractions (the shape stays monotonic after 10 %) that minimises weighted squared error per template. The sample is about 25 usable cars, a few of them LFP, so the report flags thin groups. No split template unless one group clearly can't fit (§9 step 5).
- Output: `docs/plan/calibration-report.md` (before/after table). Ask the owner to approve, and keep building 5.1 while waiting. **After approval:** update `TEMPLATES` and drop the "uncalibrated" basis note, record the numbers in `charging-curve-viewer.md` §9, and log the decision in gaps-and-questions.
- Tests: the calibrate maths (error per car, weighting) in `tests/calibrate.test.ts`.

## 5.1 Cars tab: browse (PR 2)
- `src/components/Browse.tsx` React island on `src/pages/cars/index.astro`, fed `loadIndex()`. The page keeps a noscript plain list.
- Pure `src/lib/browse.ts`: filter + sort + search over `IndexEntry`, with tests. Filters from §4: Sold in Canada (on), model year (default current + previous), make, body type, drivetrain, min range, min DC peak, max 10–80 %, port, voltage, heat pump (standard/optional/any), chemistry, tested-curves-only. "Unknown" values fail min/max filters while the filter is active. Sorts: name, range, efficiency, DC peak, 10–80 %, km/10 min (the table's default), newest. The index needs `consumption_combined_wh_per_km` added for efficiency (in `scripts/lib/build.ts` IndexEntry export + type).
- Search: MiniSearch (stack decision) over make/model/variant/trim aliases.
- Cards: body-type label (no images yet), name, variant, range, 10–80 %, km/10 min, port, curve badge (Tested / Estimated), "+ Compare". The whole card links to `/charging?car=`. The table has sortable column headers (`aria-sort`) and stacks at 375 px.
- Filters, sort and view are saved (`KEYS.browse`). A "Clear filters" button and a result count.
- A shared `estimated` badge in sort results (§4: sorting must not hide reliability).

## 5.2 First-load picker + My car + map links (PRs 3 and 4)
**PR 3: picker and My car**
- `src/components/CarPicker.tsx`: "Which EV do you drive, or want to?" A MiniSearch box with instant suggestions (keyboard: arrows/Enter, combobox ARIA), plus Make → Model → Year → Variant step selects (reuse the logic from CarExplorer's dropdowns), optional trim ("Not sure? We'll use the standard trim."), and a "Just browsing" link to `/cars`.
- `CarExplorer.tsx`: with no `?car=` and no My car, it shows CarPicker in place of the car section. Choosing a car sets My car and loads it. Add a "Set as my car" button (the label changes to "My car ✓") and "+ Compare". With no link, the Charging tab opens My car, else the picker (B37; the old "last viewed car" fallback is dropped so the picker isn't skipped). `?pick=1` (the chip's "Change car") opens the picker with a Cancel button. Also fix TD-P4's empty `?car=` case while here.
- Header chips in `src/layouts/Base.astro`: a small island `src/components/HeaderChips.tsx` (`client:idle`) for the My car menu (change → `/charging` picker, open → its Charging page, forget) and the Compare (n) link. Compare is added to the side-nav PAGES. *(Built 5.2a: the Compare chip is wired but stays off (`showCompare`) until 6.1 adds `/compare`, so no link points at a missing page.)*
- Schema (B38): `adapters_included` as an optional sourced field (`data/schema`, `vehicle-data-model.md`, MVP_FIELDS unchanged). The build passes it through and the specs table shows it (Ports & access). TD-P6 is reworded.

**PR 4: map side (B28, B31)**
- `ChargerMap.tsx`: when My car is set, a "Chargers my car can use" toggle in the filter panel, saved with the map filters. Pure logic goes in `map-filter.ts` (`carPlugs(car)`): NACS car → NACS; CCS1 → CCS1, plus NACS Supercharger ports marked "needs adapter" when `supercharger_access` = via_adapter; `yes` with a CCS1 port → CCS1 + NACS; unknown port → toggle disabled with a note. Tests in `map-filter.test.ts`. The map index needs the car's port and access; read them from `/data/cars/<id>.json` (one fetch).
- The dismissable "Set my car" nudge on the map (B37) appears only when no My car is set.
- `StationPanel.tsx` Tesla note: hidden when My car's make is Tesla; the via-adapter wording when `supercharger_access` = via_adapter.
- B31 links:
  - Curve viewer preset → **"Find chargers this fast"**: `/?power=<kW>&plugs=<car plugs>`. The map reads the URL params once, maps kW to the nearest L3 slider stop at or below it (min = that stop, max = Max), sets the plugs, then strips the params.
  - Station panel → **"How fast would my car charge here?"** (only when My car is set and the station has DC ports): `/charging?car=<id>&trim=<t>&kw=<max matching port kW>`. CurveViewer accepts an initial charger cap (`custom` preset at that kW), which is not saved over the remembered settings.

## 6.1 Compare (PR 5)
- `src/pages/compare.astro` + `src/components/Compare.tsx`. The list comes from `?cars=` (shareable, database-ui.md §2), else from `KEYS.compare`. Up to 4 cars; "+ Compare" from cards and the Charging tab, with a full list giving a clear message.
- Car headers: name, variant selector (siblings in the index), remove. One colour per car (a palette checked in `tests/contrast.test.ts`), used in the header, the overlay line and the table header.
- Curve overlay: refactor the ECharts setup in `CurveViewer.tsx` into a shared helper, or add a multi-curve mode. Shared SoC window and charger power. The comparison table has time, km added, km/10 min, average kW and a curve badge, sortable with km/10 min as the default. A mixed tested/estimated note.
- Side-by-side spec table using CarExplorer's `GROUPS` (export it). The best value per row gets an icon + bold (7.2 item moved here by B21), with direction per field (lower is better for 10–80 % and consumption). A "Only show differences" toggle.
- Phones: two cars side by side, sideways swipe (scroll-snap) for the rest.
- Pure helpers in `src/lib/compare.ts` (best value, differences, list ops), with tests.

## Docs PR (before code)
- `docs/plan/DESIGN-1b.md` (this plan, expanded), with detailed CHECKLIST items 2.2, 5.1, 5.2a/5.2b, 6.1, each with a *Done when* line, and a QA.md section (1b checks: filters, sorts, picker, My car persistence + storage-blocked, map toggle, cross-links, Compare, phone + dark).
- B37–B40 in `gaps-and-questions.md`; touch-ups to `database-ui.md` §2/§3/§4, `charger-map.md` §4, `vehicle-data-model.md`; the CLAUDE.md scope line (Phase 1b). This goes in one docs PR, before PR 1.

## Delegation
- 2.2's calibration report and 5.1 touch separate files and could run in parallel. 5.2/6.1 depend on my-car.ts. A `map-ui-checker` run after PR 4 and a `qa-reviewer` run at the end cover independent QA.

## Verification
- Each PR: `npx vitest run`, `npx astro check`, `npm run build`, CI green, then self-merge (standing rule).
- In the browser (dev server `voltway-dev`), at desktop and 375 px, light and dark: filters/sorts/view persist; the picker → My car → reload lands on the car; with storage blocked it still works; the header chips update live; the map toggle shows the right plugs for a NACS car, a CCS1 via-adapter car, and a Tesla; both cross-links land on the right filter/cap; Compare with 4 cars shows the overlay, best icons and the differences toggle, and the `?cars=` link reproduces it.
- Final: `qa-reviewer` against QA.md 1b checks and `map-ui-checker` on the map changes; the owner can also run `Run QA: follow docs/plan/QA.md against DESIGN-1b.md and report every gap.`
