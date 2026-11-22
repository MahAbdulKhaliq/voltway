# Check: curves-2026-11-22-tesla-sx-new.json

**Verdict: FIX.** The points are exact and the independent time check holds. The problems are labels and borrowing: 10 Model X copies are mislabelled `tested`, the 2021 Model S Long Range is unproven, and the curve peaks 12.7 % below `dc_max_kw` (250), which fails B95.

`add-facts --check`: OK, batch valid (1433 variants, 1882 sources after applying). 23 powertrains, one curve each, all `tested`, none with `based_on`.

## Table

| Variant | Field / curve | Value | Result | Evidence |
|---|---|---|---|---|
| all 23 | points vs Fastned | 21 points, 3-91 % | ✅ | I read the page's `data-json`. Entry 737 "Plaid 100 kWh" and entry 739 "100 kWh (2022+)" have identical `chargeGraph` "300" (89 points, 3-91 %). All 21 batch points equal Fastned to 0.01 kW. 10 % = 204.83, 36 % = 218.23, 50 % = 145.16, 80 % = 64.58. |
| all 23 | time 10-80 % | 28.3 min at 92.3 kWh | ✅ | I recomputed 28.3 min from all 89 points. |
| src-fastned | source | listed max 218 kW, CCS, 30 C | ✅ | Page lists chargeSpeed 218, CCS, 300+ class. It says curves assume about 30 C. No Model X entry exists. WebFetch alone can't read the chart (images only); curl does. |
| all 23 | second source (InsideEVs 549335) | "a little over 28 minutes" | ✅ (wording) | Page says "10-80% SOC took a little bit over 28 minutes." The batch quote drops "bit"; the substance is the same. Also confirmed: "below 148 kW at 50% SOC", "below 68 kW at 80%", 249 kW at 8-33 %, "preconditioned", 2021 car tested Oct 2021 by Out of Spec. The page also says "150 kW" at the start. It lists the pack as about 95 kWh usable, which is 3 % above the repo's 92.3 estimate. |
| Model S 2021 Plaid | curve | `tested` | ✅ | InsideEVs describes a 2021 Plaid, so Fastned's "Plaid" entry and the Out of Spec test agree on the 2021 car. Both measurements are of the right model. |
| Model S 2022-2026 Dual Motor/AWD and Plaid (10) | curve | `tested` | ⚠ | The Fastned "100 kWh (2022+)" entry covers non-Plaid 2022+ cars. But Fastned's car is a European CCS2 car, and our powertrains are CA/US NACS cars (markets in `public/data/cars/`: CA, US). The curve's 218 kW cap is a CCS2 artifact, so it is a different charging interface from the NACS V3 car. The notes say so, but only the 2021 ids carry `low_confidence: true`. |
| tesla/model-s/2021-long-range | curve | `tested` | ⚠ unproven | Fastned has no 2021 non-Plaid entry. The repo's own pack figures for this id are `estimated` (92.3 usable from the Plaid page, 100 gross, no `raven` tag in `fields`) and peak DC is `estimated` 250. The "same pack" claim is the researcher's assumption. `low_confidence` is set. |
| model-x/2021-long-range, 2022-2026 (10 ids) | curve | `tested` | 🏷 | Fastned has no Model X entry and the batch says so. It is a Model S curve copied onto the X, so it is not tested. The rule in `scripts/add-facts.ts` and the precedent in `curves-2026-11-22-tesla-my.check.md` is `kind: estimated`, `based_on`, id `borrowed-...`, `source_id` equal to the sibling curve's source. Compare the two cars in the repo: usable 92.3 on both, but both `estimated`, so "within 1 %" is unproven. The X curb weight and motors differ from the S. The match is unproven. |
| all 23 | peak vs `dc_max_kw` | 218.2 vs 250 kW (-12.7 %) | ❌ B95 | The limit is 5 %. Cause: the Fastned car is CCS2-capped, and our cars are V3 NACS (InsideEVs: 249 kW at 8-33 %). The notes disclose this. Noting is honest, but it doesn't remove the B95 failure. The 2021 Plaid page of EVSpecifications gives 200 kW while others give 250; every `dc_max_kw` here is `estimated` or `community`, so the B95 comparison is itself uncertain. |
| all 23 | plausibility | shape | ✅ | 21 points below 100 %, largest SoC gap 5 % (91 to 100 not covered, 9 %, under 15 %). Taper agrees with Out of Spec: 145 vs under 148 kW at 50 %, 64.6 vs under 68 at 80 %. First 8 % differs (Fastned 132-176 kW at 3-8 %, Out of Spec about 150 kW then 249 at 8 %). The Fastned plateau is 210-218 kW against 249 kW. By my estimate the two roughly offset, which is why the 10-80 % times match. |
| all 23 | conditions | preconditioned `unknown`, 30 C, 300 kW | ✅ | Matches Fastned's stated assumptions. |
| source record | type, URL, `accessed_on` | `testing_org`, specific URL, 2026-11-22 | ✅ | Consistent with the existing Fastned source in the Model Y batch. The reuse-terms caveat (no data clause) is stated in the notes for the owner. |
| all 23 | unknowns (check 14) | none | ✅ | This batch adds curves only; no required field is touched. |

## Answers to the riskiest points

1. Points match Fastned: yes, exactly. Peak 218.2 kW at 36 %, 204.8 at 10 %, 145.2 at 50 %, 64.6 at 80 %, 28.3 min 10-80 %.
2. Out of Spec / InsideEVs: yes, "a little bit over 28 minutes" (batch drops "bit"). Note that the same article says the car is about 95 kWh usable. The batch compares times at 92.3 kWh.
3. Borrowing:
   - **Model X:** relabel as `estimated` with `based_on` and a `borrowed-` id. A measured sibling-curve rule needs the usable kWh within 1 %, which can't be shown (both are `estimated`).
   - **2021 Long Range:** unproven. Keep `low_confidence`; or drop it if no better source can be found. The 2021 Plaid (InsideEVs 2021 test) is solid.
4. CCS2 cap: noting it is accurate, since the notes say the V3 plateau is about 250 kW and the curve is understated by about 30 kW. But it still leaves the curve 12.7 % under `dc_max_kw`, and the viewer will show 218 kW as the peak for NACS V3 cars. It doesn't misstate V3 charging as long as the notes stay visible, but `low_confidence` should be on all S copies, not only the 2021 ones. The owner may prefer a curve built from the Out of Spec V3 data if a point table can be found.

## Required changes

1. Model X (10 ids: `tesla/model-x/2021-long-range`, 2022/2023/2024/2025 Dual Motor and Plaid, 2026 AWD and Plaid): change `kind` to `estimated`, add `based_on` (variant id of a Model S sibling holding the curve, `reason` stating the shared Palladium pack as an assumption and that the X is heavier), set `id` to `borrowed-fastned-2026-palladium`, keep `source_id`. Drop `conditions` or keep only the sibling's. Mark `low_confidence: true`.
2. Model S 2022-2026 (10 ids): add `low_confidence: true` (EU CCS2 car, NACS V3 cars here; peak 12.7 % under `dc_max_kw`). Keep `tested`.
3. Model S 2021 Long Range: keep `low_confidence`, and state in the notes that Fastned has no 2021 non-Plaid entry and that the pack is an estimate in the repo. Alternatively drop it.
4. Notes (all): quote "a little bit over 28 minutes" correctly; mention Out of Spec's pack is about 95 kWh usable (3 % over the repo's 92.3).
5. Decision for the owner: accept the B95 peak mismatch (218 vs 250) as documented, or add a V3 curve from Out of Spec data.

## Applied by the main session (2026-11-22)
- Model X (all ids): id `borrowed-fastned-2026-palladium`, `kind: estimated`, `based_on` tesla/model-s/2024/plaid, conditions dropped, `low_confidence`.
- `low_confidence: true` on every Model S copy.
- `tesla/model-s/2021-long-range`: notes say pack and year match are unproven (kept, low confidence).
- Quote fixed to "a little bit over 28 minutes"; Model S notes mention InsideEVs' ~95 kWh usable.
- Open for the owner: the 218 kW CCS2-capped peak vs 250 kW on V3 (documented in notes; time check agrees with the V3 test).
