# Check: curves-2026-11-22-tesla-my.json

**Verdict: FIX (REJECT the borrow as written; also remove the existing CA copy)**

- The Fastned points are real and copied exactly.
- The Performance copy is labelled `tested` and has no `based_on`, so it is mislabelled.
- The CA copy puts an NMC curve on a car this repo lists as NCA, 82 kWh.

`add-facts --check`: OK (valid, nothing written). `npm run data:build` ran.

## Table

| Variant / curve | Field | Value | Result | Evidence |
|---|---|---|---|---|
| Fastned page (Model Y, Long Range 2022-2025, id 120) | source of the 18 points | 18 points, 8-90 % | ✅ | I read the page's embedded `chargeGraph` JSON (82 points, 8-90 %, graph class "300"). All 18 points in the batch and in `2023-long-range-awd-import/fastned-2026-my-lr.json` equal Fastned's values exactly. Peak 230.75 kW at 8 %, 105.09 at 50 %, 48.42 at 80 %. The page says "around. 30 °C" and chargeSpeed 250. |
| `tesla/model-y/2023-long-range-awd-import` / `fastned-2026-my-lr` | curve | points, `tested`, `low_confidence` | ✅ | Matches Fastned's LR (2022-2025) curve. Fastned is a charge-network measurement, so `tested` is fair. Conditions (30 °C, 300 kW) match the page. The Fastned page doesn't state the pack. The repo has this powertrain as 78.1 gross / 75 usable, NMC, 400 V, 250 kW, which is the car Fastned's European listing plausibly describes. |
| `tesla/model-y/2024-long-range-awd-ca` / `fastned-2026-my-lr` | curve | same points, `tested` | ❌ | Repo data for this powertrain: 82 kWh gross (manufacturer, OpenEV), 75 usable, chemistry **nca**. The import car is 78.1 gross, NMC. That is a different pack (5 % in gross kWh, different chemistry), so it is not a valid `tested` curve for this car. A web search supports Panasonic 2170 NCA ~82 kWh for the North American 2024 LR, but gave no source for the Canadian build location. Fastned's European curve is for a different pack and market. |
| `tesla/model-y/2024-performance-import` / `fastned-2026-my-lr` | points | identical to Fastned LR | ✅ copy / ❌ label | Points are exact. |
| same | `kind` | `tested` | 🏷 | Fastned does not test the Performance. This is a borrow from a sibling. The repo convention (see `audi/a6-e-tron/2025-s6-e-tron-quattro/borrowed-fastned-2026-q6.json` and the format in `scripts/add-facts.ts`) is `kind: estimated`, `based_on {variant_id, reason}`, and `source_id` = the sibling curve's source. The batch has no `based_on`, and the `id` is not marked as borrowed. |
| same | basis (pack/charger match) | 78.1 / 75 kWh, NMC, 400 V, 250 kW both | ⚠ | Both powertrains have identical figures, but every one of them is `estimated` from spec sites (EVDB), so the "same pack" claim is not independently proven. Performance vs LR trims also differ in motors and software. |
| same | peak vs `dc_max_kw` | curve peak 230.75 vs 250 | ⚠ | Peak is 7.7 % below `dc_max_kw`, over the 5 % B95 limit. This is the same for the LR import, so it is not specific to this batch. Real Teslas on Fastned don't reach 250 kW. |
| bevolt / Automobile Propre Supertest (Model Y Performance) | shape agreement | 222 kW at 15 %, 107 at 50 %, 47 at 80 %, 33 min 10-80 % | ✅ page / ⚠ weak | The page (redirects to bevolt.com) says "un maximum de 222 kW très brièvement à 15 %" and gives 107 kW at 50 %, 47 kW at 80 %, 33 min 10-80 %, Supercharger "préconditionnée", ambient 37 °C. All match the researcher's numbers. Fastned vs test: 105 vs 107 at 50 % (2 %), 48.4 vs 47 at 80 % (3 %), peak 231 (at 8 %) vs 222 (at 15 %, 4 %). Fastned at 15 % is 195 kW against the test's peak of 222 (12 % lower). The 10-80 % time is about 29.6 vs 33 min (10 % faster). The article is from 2022. It states no model year, no pack or cell supplier, and no battery temperature, so it cannot prove the pack of the 2024 Performance import. It is only loose shape agreement. |
| batch `sources` | source quality | `sources: []`, reuses `src-fastned-tesla-model-y-2026` | ✅ | Existing source has a specific URL, `accessed_on` 2026-11-19, type `testing_org`. The bevolt test is only in `notes`, with no source record. Add one if the test is cited. |
| batch | required fields (item 14) | curves only | n/a | Nothing in this batch touches powertrain fields. The Performance import already has battery, chemistry, voltage class and dc_max. |

## Required changes

1. **Performance import:** change the curve to `kind: "estimated"`, add `"based_on": {"variant_id": "tesla/model-y/2023-long-range-awd-import", "reason": "..."}` and `low_confidence: true`. `source_id` stays `src-fastned-tesla-model-y-2026`. Change `id` to `borrowed-fastned-2026-my-lr` (convention from the Audi files). In `reason`, say that the pack figures are all estimates and that the trim differs (Performance vs LR). Cite the bevolt test via a new source entry in `sources` (type `testing_org` or `press`, with `accessed_on`). Say plainly that it agrees only roughly (about 10 % faster 10-80 % on Fastned's curve).
   - If the owner wants it kept as `tested`, no: the page doesn't test the Performance.
2. **Remove `data/curves/tesla/model-y/2024-long-range-awd-ca/fastned-2026-my-lr.json`.** Repo data says NCA 82 kWh and Fastned's curve is for the 78.1 kWh NMC European car. It must not be `tested` and doesn't meet the `based_on` rule (no same-chemistry pack, gross differs 5 %). It should be dropped, or replaced with a curve that comes from a North American 2024 LR AWD test. The same issue applies to the other Fastned copies on NCA powertrains if any exist.
3. **B95 note:** the peak (230.75 kW at 8 %) is 7.7 % under `dc_max_kw` (250). Either accept it as a known exception for real Teslas, or note it on the curve.
4. The `off_template` linter warning is expected and is not counted as a fault.

## Applied by the main session (2026-11-22)
- Performance copy relabelled: id `borrowed-fastned-2026-my-lr`, `kind: estimated`, `low_confidence`, `based_on` the 2023 Long Range AWD import variant; conditions dropped (it is a borrow); notes no longer cite the bevolt test, so no source entry is needed.
- Removed `data/curves/tesla/model-y/2024-long-range-awd-ca/fastned-2026-my-lr.json`: European NMC curve on a North American NCA powertrain.
- Not done: the 230.75 kW peak sits 7.7 % below `dc_max_kw` 250. Fastned's CCS2 network is the likely cap, so the curve is kept as measured.
