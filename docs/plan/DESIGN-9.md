# Phase 9: Car data rebuild (catalogue, markets, curves)

Status: **approved, 2026-11-19.** The owner raised the data problems in chat, chose the options below (AskUserQuestion, 2026-11-19) and approved this plan. Decisions B90–B95 in [gaps-and-questions.md](../design/gaps-and-questions.md).

**Review before push (owner, 2026-11-19):** nothing from this pass is pushed until the owner has reviewed the data locally.

## Context

The owner found the car data unreliable:
- **Charging curves are wrong.** 64 of 84 cars show a generic template curve and 5 show none.
  - The 9 cars marked "Tested" use coarse Chargeprice curves taken from older model years. For example, the 2026 Model 3 Performance shows a 2023 pre-Highland curve that reads `0:250 5:250 20:250 35:250 50:200…`.
  - Three of the four 2026 IONIQ 5 variants have no curve at all.
- **Few model years.** The car list is a one-off copy of NRCan's 2025/2026 rows (`scripts/create-starter-records.ts`, B8). There's no 2017 Bolt or 2014 Model S, although NRCan 2012–2026 (1,250 rows) is already imported.
- **NRCan labels became our trim names.** "Premium-I", "AWD-B", "(pre-6/11/25)" and "(19" Wheels)" show up as trims. There are duplicate rows (Model 3 "Performance" and "Performance AWD"). The IONIQ 5 has no Preferred or Ultimate trims and no Standard Range pack. US-only trims (Model 3 Standard RWD) can't appear.
- **The wheel picker offers 14–24″ for every car**, and 34 of 101 trims have no wheel sizes.
- **The curve dropdown** mixes "Tested" and "Estimated" for the same car.
- **Sources are Canada-first (B15)**, although the site now covers Canada and the US.

**Root causes:**
- The catalogue is built from one Canadian regulator's rows instead of from the cars themselves.
- Curves are stored per variant, so nothing is shared across a generation.
- Chargeprice curves are trusted as `tested` and matched across generations.
- One researcher fills every field at once, so curves get the least attention.
- Nothing checks whether a curve is plausible.

**Intended outcome:**
- Every battery EV sold in Canada or the US from 2011 on, under its real trim names.
- Shared hardware records, so a generation's curve is researched once.
- A measured curve wherever one exists, checked for plausibility.
- Template estimates only as the fallback, and one clear curve on screen.

## Owner decisions taken while planning (2026-11-19, to record as B90–B95)

| Id | Decision |
|---|---|
| B90 | **Scope:** every BEV in NRCan (2012+) or EPA (2011+), both countries, all model years. |
| B91 | **No country field.** One model year can hold market-specific variants, and only then does the trim list label them, e.g. "Premium RWD · Canada" / "Premium RWD · US". Shared cars (older Bolts) show once. |
| B92 | **Curve picker:** show the best curve with its badge. The dropdown appears only when a car has 2+ **measured** curves. A template estimate is never listed beside a measured curve. |
| B93 | **Wheel picker:** factory sizes for that model year, from 2″ below the smallest to 2″ above the largest. Replaces B13's fixed 14–24″ list. |
| B94 | **Sources are market-neutral** (replaces B15's Canada-first wording). Any market's source may be used for facts that don't vary by market. Facts that vary carry the market they apply to. |
| B95 | **Curves get their own research and checks:** a curve-only researcher, a plausibility linter in the build, and Chargeprice curves re-graded to `community` and matched within a generation only. |

Each one gets a dated row in `docs/design/gaps-and-questions.md` and a note in the matching design doc.

## Design

### 1. Data model: shared hardware, per-market editions (`vehicle-data-model.md` §2, §4, §5)

```
Make → Model → Generation → Powertrain (pack + charging hardware + curves)
                         └→ Model year → Variant (markets[], powertrain_id) → Trim (names per market, wheels)
```

- **New record: powertrain.** Stored at `data/powertrains/<make>/<model>/<gen>-<slug>.json`.
  - It holds the battery (gross/usable kWh, chemistry, voltage class), `dc_max_kw`, `ac_max_kw`, `charge_port` and preconditioning, all as sourced values.
  - It lists the years it covers (`years: [2017, …, 2021]`). A software or pack change starts a new powertrain or a new curve version.
- **Curves move to the powertrain.**
  - `curve.schema.json` gets `powertrain_id`. `variant_id` is kept only for a curve that truly differs per year.
  - Every variant on that powertrain shows its curves.
  - Curve-borrowing (B16) mostly disappears, because siblings with the same pack share one powertrain. It stays possible across models (EV6 ↔ IONIQ 5) through a shared powertrain or `based_on`.
- **Variant** (model year × pack × drivetrain × market edition):
  - gains `powertrain_id` and `markets: ['CA','US']`;
  - keeps rated range and consumption (per regulator), which override the powertrain;
  - replaces the computed `sold_in_canada` with `markets`, derived from crosswalk rows (NRCan → CA, EPA → US) and checked against the variant's own field.
  - A market-specific variant (2026 Model 3 Premium RWD for Canada vs the US) is a separate variant with one market.
- **Trim:**
  - `name` becomes `names: { CA?, US? }`. Search aliases are kept.
  - Wheel sizes are wheel options, not trims. NRCan's "(19" Wheels)"/"(20" Wheels)" rows become one trim with two `wheels[]` entries, each with its own `rated_range_km`. That field is already in the design and becomes MVP now.
- **Model:** `generations[]` becomes required for every model, so curve matching and carry-overs have boundaries (e.g. Model 3: 2017–2023, Highland 2024+).
- **Migration:**
  - A script converts today's 84 variants, `data/curves/**` and the crosswalk to the new shape.
  - `buildCars` keeps emitting the same `public/data/cars/<id>.json` shape plus `markets` and per-market trim names. The UI therefore changes little until Phase 9e.

### 2. Catalogue: build it from both regulators, with owner approval

- **New EPA source:**
  - `scripts/fetch-epa.ts` and `scripts/import-epa.ts` → `data/imported/epa/<year>.json`.
  - Input is fueleconomy.gov `vehicles.csv` (US government data, public domain), BEV rows from 2011 on.
  - Fields: range, city/highway/combined consumption, motor, drive, base model and EPA's model string.
  - The parser and the sourced-value shape follow `scripts/lib/nrcan.ts`.
- **Catalogue suggester (replaces the one-off `create-starter-records.ts`):** `scripts/suggest-catalogue.ts`.
  - It groups every unmatched NRCan/EPA row into model → generation → powertrain → variant.
  - It reuses `parseName`, `scoreCandidate` and `variantGroupKey` from `scripts/lib/match.ts`.
  - It writes `crosswalk/catalogue-review.md` and `.csv` for the owner. Automation suggests and a person approves (CLAUDE.md).
  - On approval it writes skeleton records. It never overwrites existing ones.
- **Trim-name map:** `crosswalk/trim-names.csv`, with one row per regulator label.
  - Each row maps the label to a market, the buyer-facing trim name, the wheel size and the variant. Examples: NRCan "Model 3 Premium-I" → CA "Premium RWD", and "Model Y Long Range AWD-B" → CA "Long Range AWD".
  - A researcher fills it with a cited source and the owner confirms it. Duplicates such as "Performance" vs "Performance AWD" are resolved here: merged, or kept apart with the reason.
  - *2026-11-19 (owner, wave 1 review):* names are researched **before** wave 1 is approved. Columns: `model_id, source, year, label, market, trim_name, dealer_trims, source_url, notes, confirmed`. `trim_name` is the edition as the maker sold it in that market (pack + drivetrain wording); `dealer_trims` lists the maker trim levels one rating covers (e.g. EPA "IONIQ 5 RWD" → "SE; SEL; Limited"). The suggester names and pairs cars from these names; approving a proposal confirms its names. Clean proposals (no ⚠) are spot-checked and then approved in bulk; for flagged ones Claude recommends and the owner decides. Model year 2027 is included.
  - *2026-11-19 (owner, flagged rows):* weak Canada/US pairs (motor power only, names differ) stay apart; "(Import)"/"-I" ratings are their own cars; wheel, tire, charger and "(pre-/post-…)" ratings are options of one car (`regulatorOption` in `scripts/lib/catalogue.ts`); fleet-only cars are left out; a double EPA rating uses the newer one. US-only trim lineups on Canadian hardware are researched and paired with the matching Canadian car.
  - *2026-11-19 (owner, round 3):* ratings of cars never sold to the public in that market and year are left out. `crosswalk/not-sold.csv` lists them (label, reason, source), and the suggester drops those rows before grouping, so a car sold in the other market keeps its proposal (e.g. the US 2023 IONIQ 6 Standard Range).
- **Rollout in waves** keeps owner review manageable:
  1. today's 25 models, all years;
  2. other current models;
  3. discontinued models (Bolt EV/EUV, Leaf gen 1, i3, e-Golf, Kona Electric, Model S/X older packs, …).

### 3. Curves: sources, research, checks

- **Chargeprice import** (`scripts/lib/chargeprice.ts`, `scripts/lib/build.ts` around lines 358–383):
  - curves become `kind: community`;
  - they are matched only within the same generation and powertrain, never from a newer or other-generation year;
  - ~~a curve with fewer than 8 points below 100 % is skipped~~ **Changed (owner, 2026-11-19):** sparse curves are kept (100 of the 122 have 3–7 points, including reasonable ones like the 2017 Bolt's); the linter flags them, so they need the owner's review before they can be a default;
  - `isGenericShape` also rejects a "flat at peak, then even steps" shape.
- **Curve linter:** `scripts/lib/curve-check.ts`, run by `npm run validate` and the build.
  - Errors: the peak exceeds `dc_max_kw` by more than 5 %; points out of order or outside 0–100.
  - Warnings, listed in `crosswalk/GAPS.md`:
    - a flat peak over a wider SoC window than the template allows for that voltage and chemistry (e.g. 400 V NMC over 25 % SoC);
    - fewer than 8 points;
    - gaps over 15 % SoC;
    - a curve year outside its powertrain's years;
    - a measured curve that differs from the template by more than 40 % at 50 % SoC.
  - A curve with an open warning can't be the display default until a person clears it with a `reviewed_note`.
- **New agent `ev-curve-researcher`** (`.claude/agents/`): curves only, one powertrain at a time.
  - Source ranking: independent tests with dense data (Out of Spec Reviews, Bjørn Nyland's published test data, InsideEVs/Car and Driver tests, P3 charging index, Fastned vehicle pages), then manufacturer-published curves.
  - It records points every 5 % SoC plus the peak, with the conditions.
  - It notes when a second source agrees with the shape.
  - evkx.net blocks automated fetches (403 checked 2026-11-19). It is a manual cross-check for the owner only, never a scraped source (no bot-block workarounds).
  - First step of Phase 9d: check each candidate source's terms and record its licence/attribution in `data/sources/`.
- **`ev-data-researcher`:** curves come off its list. Its source rules become market-neutral (B94). It fills the trim-name map and wheel options per market.
- **`data-fact-checker`:** adds the plausibility questions (does the shape match a second source, is it the right generation and pack, is it dense enough) and checks the trim-name mapping.
- **`fill-data-gaps` skill:** runs per powertrain. Curve and spec researchers run as separate background agents. The order is the catalogue waves, then E-GMP (IONIQ 5/6/9, EV6/EV9) first, then Tesla 3/Y by generation, then Bolt, Leaf and the rest.

### 4. Screens

- **Curve picker:** `src/components/CurveViewer.tsx` around lines 414–421, `kindLabel` line 326.
  - Measured curves are offered only when there are 2 or more (B92).
  - The label names the source and year, e.g. "Out of Spec · 2025".
  - The template appears only when it's the only curve.
- **Wheel picker:** `src/components/CarExplorer.tsx` lines 182–187. The size list becomes `min(factory)-2 … max(factory)+2` (B93).
- **Trim list and car pickers:** `CarExplorer.tsx` lines 275–295 and `CarPicker.tsx` lines 194–218.
  - They show the market name, plus a "· Canada"/"· US" suffix only when the year has market-specific variants (B91).
  - New i18n keys go in `src/i18n/`.
- **Scale:** from about 84 to several hundred variants.
  - Check `index.json` size, MiniSearch load and the Cars page/table render.
  - Lazy-load per-car JSON as today.
  - Year selects list all years, newest first.

## Phases (each leaves the site working; batch PRs for the Vercel deploy limit)

- **9a — Docs and decisions.**
  - Record B90–B95.
  - Update `vehicle-data-model.md`, `data-sources.md`, `charging-curve-viewer.md`, `roadmap.md` and `overview.md`.
  - Write `docs/plan/DESIGN-9.md` (this plan), plus Phase 9 items in `CHECKLIST.md` and `QA.md`.
- **9b — Quick wins on today's data** (visible fixes before the big rebuild):
  - Chargeprice re-grade and generation-only matching;
  - curve linter;
  - curve picker (B92);
  - wheel picker (B93);
  - add `generations[]` to the 25 models.
  - The 2026 Model 3 Performance then shows its template, marked Estimated, instead of a wrong "Tested" curve until research lands.
- **9c — Data model:**
  - powertrain and markets schemas;
  - migration script;
  - `buildCars` changes;
  - tests (`tests/build.test.ts`, `tests/schema.test.ts`, a new `tests/curve-check.test.ts`).
- **9d — Catalogue:**
  - EPA importer;
  - catalogue suggester;
  - trim-name map;
  - wave 1 for owner review, then waves 2–3.
  - Each wave is a data PR that **waits for owner review**.
- **9e — Screens at scale:** market labels in the trim lists, scale checks, Cars/Compare/route picker with hundreds of cars.
- **9f — Research process and rounds:**
  - new curve researcher; updated researcher, fact-checker and skill;
  - research rounds per powertrain, starting with E-GMP and Tesla 3/Y;
  - data PRs for owner review.

## Critical files

- **Schemas:** `schema/variant.schema.json`, `schema/curve.schema.json`, `schema/model.schema.json`, new `schema/powertrain.schema.json`
- **Build:** `scripts/lib/build.ts` (`buildCars`, curve merge, `ratingRows`), `scripts/lib/chargeprice.ts`, `scripts/lib/match.ts`, `scripts/validate.ts`, `scripts/gap-report.ts`, `scripts/add-facts.ts` (batch format: powertrain targets, trim names per market)
- **New scripts:** `scripts/fetch-epa.ts`, `scripts/import-epa.ts`, `scripts/lib/epa.ts`, `scripts/suggest-catalogue.ts`, `scripts/migrate-powertrains.ts`, `scripts/lib/curve-check.ts`
- **UI:** `src/components/CurveViewer.tsx`, `src/components/CarExplorer.tsx`, `src/components/CarPicker.tsx`, `src/lib/types.ts`, `src/i18n/`
- **Agents:** `.claude/agents/ev-data-researcher.md`, `.claude/agents/data-fact-checker.md`, new `.claude/agents/ev-curve-researcher.md`, `.claude/skills/fill-data-gaps/SKILL.md`

## Verification

- `npm run validate`, `npx vitest run`, `npx astro check`, `npm run build` all pass after each phase.
- **Tests:**
  - the migration keeps every current car's figures identical (snapshot before and after);
  - the linter flags today's Model 3 Chargeprice curve;
  - the EPA parser works on a fixture;
  - the curve picker shows no dropdown for one measured curve plus a template;
  - the wheel sizes for an 18/19/20″ car are 16–22.
- **Gap report before and after:** count of template-only cars, cars with no curve, trims with no wheels, model years covered.
- **Browser check (site-ui-checker agent):**
  - `/charging?car=tesla/model-3/2026/…` shows one curve with the right badge;
  - the IONIQ 5 shows a curve;
  - a 2017 Bolt EV and a 2014 Model S can be picked;
  - a market-specific 2026 Model 3 shows "· Canada"/"· US" and a shared older car doesn't;
  - checked on desktop and at 375 px, in dark and light.
- **Independent QA:** the qa-reviewer agent runs against the Phase 9 section of `docs/plan/QA.md` at the end.
