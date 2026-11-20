# Fact-check: research/curves-2026-11-20-w2-german.json

**Verdict: FIX** (data is faithfully copied from Fastned; labelling, one borrow and a few scope/notes issues need changes). `npx tsx scripts/add-facts.ts ... --check` passes ("batch is valid"). Nothing applied.

## How I checked
- Re-fetched all 14 Fastned model pages cited (curl, HTTP 200, robots.txt is `Allow: /`), parsed each listing's `chargeGraph` JSON (listing matched by `"id":N,"brand"...` block, not by page order).
- Compared every batch point (all 20 curves, every point) with Fastned's per-percent series: max difference 0.05 kW on all 20 listings (rounding only). Peaks match too. Listing names/years match the batch titles.
- Compared each curve's pack/voltage/chemistry/dc_max_kw with `data/powertrains/<id>.json` for each of the 235 ids.
- Checked borrowed curves (points identical to sibling, sibling exists in `public/data/cars`), identical-graph groups across Fastned listings, linter-type rules (>= 8 points below 100 %, gaps, peak vs dc_max).

## Per-curve results
| Curve / source | Ids | Fastned listing (re-fetched) | Points vs page | Pack/hardware map | Peak vs dc_max | Result |
|---|---|---|---|---|---|---|
| fastned-106 | Taycan 93.4 kWh, 2020-24 (40 ids) | "Taycan 93,4 kWh (2021 -2024)", 270 kW | max diff 0.04 | all 93.4/83.7, 800 V, dc 270 | 268 / 270 | ✅ (note 2020 ids sit outside the page's 2021-24 years; see fix 6) |
| fastned-135 | Taycan 79.2 kWh, 2021-24 (8 ids) | "Taycan 79,2 kWh (2021-2024)", 225 kW | 0.05 | all 79.2/71, dc 225 | 223.6 / 225 | ✅ |
| fastned-933 | Taycan 105/97 kWh, 2025-27 (32 ids) | "Taycan 97 kWh (2024+)", 320 kW | 0.05 | all 105/97, dc 320; the 89/82.3 kWh ids (5) correctly left out | 322.3 / 320 (+0.7 %) | ✅ |
| fastned-885 | Macan 100 kWh 2024-27 (16 ids) | "Macan 4 Electric 100 kWh (2024+)", 270 kW | 0.05 | all 100/95, dc 270 | 269.2 / 270 | ✅ for data; graph is byte-identical to Audi Q6 listing 918 (see fix 3) |
| fastned-79 | e-tron 55/S 95 kWh, 2019-23 (12 ids) | "e-tron 55 Quattro, 95 kWh (2019 - 2022)", 150+ | 0.05 | all 95 gross, 400 V, dc 150; usable 83.6 (2019-20) vs 86.5 (2021-23) | 155 / 150 (+3.3 %) | ⚠ scope (fix 4) and identical to a different pack's listing (fix 4) |
| fastned-743 | Q8/SQ8 e-tron 114 kWh 2024-25 (9 ids) | "Q8 e-tron 55 quattro, 114 kWh (2023 - 2024)", 170 kW | 0.05 | all 114/106, NCA, dc 170 | 168.1 / 170 | ✅ |
| fastned-364 | e-tron GT 93.4 kWh 2022-24 (6 ids) | "e-tron GT 93,4 kWh (2021 - 2024)" | 0.00 | 93.4/84, dc 270 | 262 / 270 | ✅ (differs from Taycan 93.4 listing, so not a copy) |
| fastned-977 | e-tron GT 97 kWh 2025-27 (6 ids) | "e-tron GT 97 kWh (2024+)" | 0.05 | 105/97, dc 320 | 322.3 / 320 | ✅ for data; identical to Taycan 97 listing 933 (same pack, same platform; note says so) |
| fastned-541 (Q4) | Q4 e-tron 175 kW ids (8) | "Q4 e-tron 50/55, 82 kWh (2021+)", 175 kW | 0.04 | all 82/77, 400 V, dc 175 only; the eight 135/150 kW ids (2022-24) correctly excluded | 178.8 / 175 (+2.2 %) | ⚠ kind (fix 1) |
| fastned-918 | Q6/SQ6 100 kWh 2025, 2027 (10 ids) | "Q6 e-tron Quattro, 100 kWh (2024+)", 270 kW | 0.05 | all 100/94.9 or 94.4, 800 V; dc 260 (Q6/Q6 ultra 2025) or 270 | 269.2 vs 260 = +3.5 %, vs 270 = -0.3 % | ✅ |
| fastned-464 | EQS sedan 2022-24 (10 ids) | "EQS 107,8 kWh (2021-2024)" | 0.05 | 120 gross (2022) / usable 107.8-108.4, dc 200; 118/122 kWh ids (9) left out | 207.7 / 200 (+3.9 %) | ✅ |
| fastned-662 | EQS SUV 2023-24 (5 ids) | "EQS SUV 107,8 kWh" | 0.05 | usable 107.8-108.4, dc 200; the 118 kWh SUV ids (12) left out | +3.9 % | ⚠ identical to EQS sedan listing, so not an independent SUV measurement (fix 3) |
| fastned-578 | EQE sedan 2023-26 (11 ids) | "EQE 90,6 kWh", 170 kW | 0.05 (re-checked directly) | all 100/90.6 or 90.5, dc 170; the 96 kWh ids (3) left out | 173 / 170 (+1.8 %) | ✅ |
| fastned-467 | iX xDrive50/M60 2022-25 (7 ids) | "iX 50 105,2 kWh (2021 - 2025)", 200 kW (id 467; graph equals M60 listing 612) | 0.05 | all 111.5/105.2, dc 200/195 or 195 | 196 / 195-200 | ✅ |
| fastned-469 | iX xDrive40 2023-25 (3 ids) | "iX 40 71 kWh (2021 - 2025)", 150 kW | 0.05 | all 76.6/71, dc 150 | 149.2 / 150 | ✅ |
| fastned-849 | i5 2024-27 (11 ids) | "i5 Touring 81,2 kWh (2024+)", 205 kW | 0.05 | all 83.9/81.2, dc 205 | 207.4 / 205 | ✅ |
| fastned-663 | i7 2023-26 (10 ids) | "i7 101,7 kWh (2022+)", 200 kW | 0.05 | usable 101.7, dc 195; 2027 112.5 kWh ids (4) left out | 201.7 / 195 (+3.4 %) | ✅ |
| fastned-80 | i3 60 Ah 2014-17 (4 ids) | "i3 22 kWh (2013 - 2017)", 50+ | 0.05 | 22/19, dc 50 or 47 | 46.9 vs 50 (-6 %), vs 47 ok | ✅ (peak is under the rating, not over; the 5 % rule is about exceeding) |
| fastned-81 | i3 94 Ah 2017-18 (3 ids) | "i3 33 kWh (2017 - 2018)" | 0.05 | 33/27.2, dc 50 | 49.5 / 50 | ✅ |
| fastned-129 | i3 120 Ah 2019-21 (6 ids) | "i3 42,2 kWh (2018 - 2022)" | 0.05 | 42.2/37.9, dc 50 | 49.5 / 50 | ✅ (first point is 15 %, gap exactly 15, so inside the limit) |

## Borrowed curves
| Curve | Ids | Result |
|---|---|---|
| A6 e-tron, `based_on` audi/q6-e-tron/2025/q6-e-tron-quattro | 8 ids | ✅ Sibling variant exists and carries a `tested` curve in this batch; points identical (all 8 ids); same 100 kWh gross, usable 94.9 / 94.4 (<=0.5 % apart), 800 V, NMC, dc 270 (or 260 for two ids, 3.7 % off); `source_id` = sibling's source (918). `kind: estimated`, `low_confidence: true`. The A6 and Q6 pack/motors/charger match is from this repo's data (PPE platform); no source in the batch states it directly, but the rule (same pack, motors, charger) is met on the stored figures. |
| EQE SUV, `based_on` mercedes/eqe/2023/amg-eqe-4matic-plus-sedan | 9 ids | ⚠ 8 of 9 ok (usable 90.6 or 90.5, dc 170, 400 V NMC, points identical, source_id = 578). **`mercedes/eqe-suv/2023-eqe-350-4matic-suv` has usable 89 kWh vs the sedan's 90.6 (1.8 % apart, over the 1 % limit).** |

## Required changes (numbered fix list)
1. **Q4 e-tron curve is not an independent Audi test.** Fastned's Q4 50/55 graph (listing 541) and Q4 40/45 (411) are byte-identical to the VW ID.4 77 kWh listing 233 and ID.4 GTX 616 (I confirmed all four equal). The repo already stores that same graph as a `tested` ID.4 curve (`data/curves/volkswagen/id-4/2024-pro-awd/fastned-2026.json`, src-r19c-fastned-id4). A copy of another car's listing is not a measurement of the Q4. Change the 8 Q4 ids to `kind: estimated`, `low_confidence: true`, with `based_on` an ID.4 variant (same 82/77 kWh MEB pack, 400 V NMC, 175 kW) and `source_id` = the ID.4 curve's source. If the owner prefers to keep Fastned's Q4 labelling as `tested`, it must at least keep `low_confidence` and say it equals the ID.4 listing (already in the notes). The Q4 175 kW id selection itself is right (every id on this curve has dc_max 175).
2. **Drop `mercedes/eqe-suv/2023-eqe-350-4matic-suv` from the EQE SUV borrow** (usable 89 vs 90.6 = 1.8 %, over the 1 % rule), or first show the SUV's usable is also 90.6 (then fix the powertrain value). Pack match is unproven for that one id.
3. **Be consistent about Fastned listings that are copies.** The batch borrows EQE SUV (no Fastned graph) as `estimated`, yet takes EQS SUV (graph identical to the EQS sedan, listing 662 = 464) and Macan (identical to Q6, 885 = 918) as `tested`. Mark the EQS SUV (5 ids) and Macan (16 ids) curves `low_confidence: true` (they are the same figure as another car's listing), or relabel them as borrowed like the EQE SUV. The Taycan 97 / e-tron GT 97 pair (933 = 977) is the same pack and platform; it is fine as `tested`, but add `low_confidence` or keep the note that it may be shared.
4. **e-tron 55 (fastned-79), 12 ids.** (a) Fastned's graph 79 ("95 kWh, 2019-2022") is byte-identical to listing 744, Q8 e-tron 50 quattro 89 kWh (2023-2024), a different pack. The batch notes do not mention it. Add that to the notes and set `low_confidence: true`; it shows Fastned reuses graphs across packs, so the e-tron curve may not be a measurement of this car. (b) Usable capacity changes inside the covered range (83.6 kWh for 2019-20 ids, 86.5 kWh for 2021-23 ids, 3.5 % apart) and 2023 is outside the page's 2019-2022. The notes already say so, but the curve is applied across all of it with no flag; at least mark the 2019, 2020 and 2023 ids low-confidence, or limit the curve to 2021-2022.
5. **Side claims in the notes could not be verified from the cited pages** (they refer to listings on other model pages): Taycan "Cross Turismo ids 559/560 identical", e-tron "Sportback id 137 identical", Q8 "Sportback id 745", Q6 "SQ6 919, Sportback 1151, Macan Turbo 886", i5 sedan "id 818 has no graph". Marked ⚠ unverifiable, not wrong. Either re-check them or reword as "not checked".
6. **Taycan 2020 ids (3 ids) are outside Fastned's 2021-2024 range.** Same pack and dc 270, so applying is reasonable, but note it in the curve notes (launch-year software may differ), or mark those ids low-confidence.
7. **Fastned reuse terms are still open** (owner to confirm; no terms found, robots allows). All 20 sources say so, so no batch change, just a decision before pushing.
8. **No-unknowns list (item 14).** Required curve left empty for these ids this batch covers by model: Taycan 89/82.3 kWh 2025-26 (5 ids), Q4 e-tron 135/150 kW 2022-24 (8 ids), EQS 118 kWh sedan (7) and SUV (12), EQS 122 kWh 800 V 2027 (2), EQE 96 kWh sedan (3) and SUV (6), iX 2026 (3), i7 2027 112.5 kWh (4). The notes list these with reasons; Cayenne Electric and EQB are named as having no curve too. Nothing to fix in the file, but these ids stay without a curve.

## Other checks (no change needed)
- Kind: `tested` for Fastned follows the earlier merged Fastned batches (i4, ID.4, Polestar, EX30, Tesla). Preconditioning recorded `unknown`, `battery_temp_c: 30`, `charger_kw` set to Fastned's class; consistent with Fastned's stated conditions.
- Plausibility: all curves have 18-22 points, >= 8 below 100 %, no SoC gap over 15 % (largest: 15 % on the i3 120 Ah, first point at 15 %); every peak is within +4 % of the lowest dc_max on its ids (largest +3.9 % EQS, +3.5 % Q6 260 kW ids, +3.4 % i7, +3.3 % e-tron). Shapes fit the packs (800 V Taycan/GT/Q6 hold 250-320 kW plateau; 400 V NMC taper; e-tron holds ~150 kW to ~70 %; i3 50 kW cap).
- Second source: none found for any curve (notes say so). Fastned's duplicate listings are not independent.
- Linter warnings (flat_peak/off_template on first-gen e-tron, flat_peak on i3): real traits of those cars, nothing to fix. `--check` printed no errors.
- Source quality: specific URLs, `accessed_on: 2026-11-20`, type `testing_org`.
- Existing-data fit: no stored curves exist for these cars (data/curves holds only bmw/i4, ford, hyundai, kia, nissan, polestar, subaru, tesla, toyota, volkswagen, volvo).
- US-labelled Taycan ids (`-us`) get EU-market curves: pack and charger are the same (CCS1 vs CCS2 inlet only); acceptable but worth a note.
