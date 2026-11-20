# Check: research/curves-2026-11-19-egmp.json

**Verdict: FIX.** The batch is valid (`add-facts --check`: OK, 491 variants, 349 sources) and most points match their pages. But every curve fails the 8-point rule except the EV6 prototype, one curve was recorded for the wrong pack, the EV6 prototype curve should not be able to become a default, and the Ioniq 6 borrow is unproven. Note: `npm run data:build` threw an rm (EBUSY-style) error on `public/data` on my run; I used `data/` and the existing `public/data/cars/` output, which was current enough for the figures below.

## Curves in the batch (9 distinct curves, 63 powertrain entries)

| Curve id | Kind | Powertrains | Points below 100 % | 8-point / 15 % gap rule | Result |
|---|---|---|---|---|---|
| electrive-2023 (Ioniq 5 77.4) | tested | 10 | 5 | FAIL (sparse; gaps 15, 25 %; stops at 80 %) | FIX, see below |
| insideevs-batterylife-2021 (Ioniq 5 "77") | tested | 10 | 7 | FAIL (sparse; gap 25 % 55 to 80) | ❌ wrong pack |
| borrowed-ioniq5-electrive-2023 (Ioniq 6) | estimated | 10 | 5 | FAIL (inherits) | ❌ unproven match |
| insideevs-batterylife-ionity-2021 (Ioniq 5 58) | tested | 4 | 5 | FAIL (gaps 38, 29 %) | FIX |
| borrowed-ioniq5-58kwh-2021 (EV6 58) | estimated | 2 | 5 | FAIL (inherits) | ⚠ borrow OK, curve weak |
| oosr-prototype-2021 (EV6 77.4) | tested | 14 | 10 | Passes count; gap 44 % (2 to 46) | ❌ prototype, see below |
| insideevs-2024 (EV9) | tested | 8 | 7 | FAIL (sparse, gaps 22 at the start) | ✅ values; FIX duplicates |
| evercars-2026 (Ioniq 9) | community | 3 | 3 | FAIL (gap 50 %) | ⚠ too sparse |

Failing the 8-point rule: all of them except the EV6 prototype. The researcher rules say "at least 8 points below 100 %"; the curve linter warns `sparse` + `gap` for each (confirmed by running `scripts/lib/curve-check.ts` with each powertrain's real DC peak, chemistry and voltage). None exceeds `dc_max_kw` by 5 %.

## Value checks (rule 1/8; sources reopened)

| Curve | Point | Page says | Result |
|---|---|---|---|
| electrive-2023 | 19 %: 113 | "113 kW at 19 per cent" | ✅ |
| electrive-2023 | 25 %: 195 | ~195 kW plateau, no SoC given | ❌ SoC invented (batch admits "approximate reading"); drop the point or move it to a stated SoC |
| electrive-2023 | 40 %: 224 / 55 %: 224 | peak at 40 %, "constant up to 55 per cent" | ✅ |
| electrive-2023 | 80 %: 125 | "at those 80 per cent SoC, 125 kW" | ✅ |
| electrive-2023 | conditions ambient 4 C | 4 C is the outbound Ionity Lippetal stop; Lauenau session has no stated temperature | ❌ remove `ambient_temp_c` (or say so in conditions); the notes already say it, the field says otherwise |
| electrive-2023 | MY2023 car, applied to 2022 and 2024 | article: preconditioning "arrived with" MY2023, older cars by software update | ⚠ 2022 cars without the update may not match (the batch notes this); 2024 unproven |
| insideevs-batterylife-2021 | 10: 115, 15: 187, 30: 220, 51: 225, 80: 130 | "about 115 kW at 10%", "187 kW" at 14-15 %, "220 kW at 29-30%", ">225 kW around 51%", "130 kW" at 79-80 % | ✅ |
| insideevs-batterylife-2021 | 53: 120 | 120 kW at 52-54 % | ✅ |
| insideevs-batterylife-2021 | 55: 170 | "increased once again to 170 kW", no SoC | ❌ SoC inferred ("after 54 %" is not on the page) |
| insideevs-batterylife-2021 | pack | "2021 Ioniq 5 AWD, 77 kWh total, 72.6 kWh net", peak 225 | ❌ electrive says the MY2023 car is "77.4 kWh (up from 72.6 kWh)"; powertrains here are 77.4 kWh gross / 74 usable / 233 kW. Different pack and peak. Match unproven at best; also Korean 2021 firmware applied to 2023/2024 cars |
| insideevs-batterylife-ionity-2021 | 7 and 45: 177 | "about 177 kW", highest "from about 7% to 45% SOC" | ✅ |
| insideevs-batterylife-ionity-2021 | 50: 140, 57: 140 | "below 145 kW, which stays until 57%", "around 140 kW for a while" | ⚠ the 50 % point is a guess (page gives no SoC for the drop) |
| insideevs-batterylife-ionity-2021 | 86: 50 | "up to 50 kW at 86%" | ✅ |
| insideevs-batterylife-ionity-2021 | pack | "58.2 kWh net; about 62 total" (own guess), AWD | ⚠ data has 58 gross / 54 usable; pack match unproven; test car stated AWD while 58 kWh is sold RWD |
| oosr-prototype-2021 | 46: 233, 47: 186, 58: 116, 63: 30, 66: 191, 78: 62, 82: 6, 92: 50, 98: 20 | all match ("held until about 46%", "186 kW at 47%", "30 kW at 63%", "over 191 kW at 66%", "about 62 kW around 78%", "6 kW at 82%", "above 50 kW at 92%", "about 20 kW at 98%") | ✅ |
| oosr-prototype-2021 | 2 %: 205 | "above 200 kW before even reaching 2%" | ⚠ 205 is an invented number for ">200"; use 200 |
| insideevs-2024 (EV9) | 18: 200, 40: 207, 44: 209, 55: 216, 60: 201, 70: 180, 80: 103 | all quoted on page (e.g. "peaked at 216 kW in the ballpark of 55%", "103 kW at an 80%") | ✅ (18 % is "roughly 200 kW" at session start) |
| evercars-2026 (Ioniq 9) | 10: 211, 60: 235, 80: 124 | "211 kW at 10%", "peak of 235 kW at the 60% mark", "124kW at 80%" | ✅ values; trim not stated; two images may hold a chart with more points that the text reader could not see |

## Answers to the specific questions

1. **Sparse curves:** all except the EV6 prototype (see table). Required: add points from a table or chart, or label them honestly; at minimum do not ship a 3-point Ioniq 9 or 5-point Ioniq 5 curve as the display default.
2. **Ioniq 6 borrowed from Ioniq 5 77.4 (rule 9): unproven.** The sibling curve is measured (tested) and the points equal the copy, `source_id` is the sibling's source. But the Ioniq 6 side has no gross kWh at all, and its usable (74), chemistry and DC peak (233) are all `estimated` from EV Database (circular: same Ioniq 5 numbers), so "usable within 1 %, peak within 5 %" cannot be proven. The batch reason states "233 kW DC peak" as a fact. Also the sibling is sparse (5 points) and from a 4 C winter, nav-preconditioned test. Fix: get a manufacturer or tested gross and DC peak for the Ioniq 6 and re-check, or drop these 10 entries. If kept, `low_confidence` stays and the reason must say the Ioniq 6 figures are estimated.
3. **EV6 58 kWh borrowed from Ioniq 5 58 (rule 9): the match passes on the repo figures** (58 gross, 54 usable, nmc, 800 V on both; peak 180 vs 175 kW = 2.9 %), `based_on` variant exists, points identical, `source_id` is the sibling's. Caveats: both figures on the EV6 and Ioniq 5 sides are `manufacturer`/`community` with low confidence, and the sibling curve itself fails the 8-point rule and is based on a 58.2 kWh-net/AWD car. Keep only if the sibling curve is improved.
4. **EV6 prototype: should never be a default and should not be applied as a production curve.** The page says pre-production prototype; the curve drops to 6 kW for about 4 minutes at 82 % and to 30 kW at 63 %, which the article calls quirky and is not how production cars behave (a production EV6 reaches over 230 kW per the same article's mention). It is attached as `tested` to 14 production powertrains for 2022-2024 including GT, Wind and Land. Batches cannot set `is_display_default`, and the build picks the default, so as the only curve it would become the default for all 14. Required: remove it from the batch, or add a production-car curve and ensure the prototype is never chosen (needs an owner decision on a "prototype" flag or exclusion in the default picker). Also the 2 % point (205).
5. **EV9 and Ioniq 9 reusing existing curves:** values are fine (✅ above). Problems: (a) the repo already has `insideevs-2024` on `kia/ev9/2026-land-awd-gt-line` and `borrowed-ev9-gt-line-2026` (estimated, `based_on`) on `2026-land-awd` and `2026-wind`; this batch adds a `tested` `insideevs-2024` to those same two powertrains, so each will carry both a borrowed and a "tested" copy of the same points. Drop 2026-land-awd and 2026-wind from the batch (or remove the borrowed ones). (b) The test car is a 2024 GT-Line AWD; the batch claims it for 2027 (awd, gt-line-awd, light-long-range-rwd) and the single-motor RWD Wind without evidence for MY2027 charging software or hardware; the batch's own notes say 2026+ changed the port to NACS. For cars other than the tested one, `tested` mislabels a measurement; the same-generation convention in the agent file allows it only where pack, DC hardware and software are unchanged, and no source shows that for 2027. Mark 2027 entries as unproven or leave them out. (c) Ioniq 9: only `hyundai/ioniq-9/2026-standard` has this curve already (identical points). Adding it to `2026-awd` and `2026-awd-performance`, where the page gives no trim and those powertrains have no `dc_max_kw` or usable figure (and the repo notes a 99.5 vs 106 usable conflict), cannot be shown to fit; peak plausibility (rule 13) is unprovable. The batch notes say "applied to all three 2026 trims", but the source never says which trim was tested.

## Other required changes

- Add the missing provenance in notes where SoC points are inferred (electrive 25 %, Korea 55 %, Ioniq 5 58 kWh 50 %, EV6 2 %) or delete the point.
- Remove `ambient_temp_c: 4` from electrive-2023 conditions (not stated for the session).
- Corrective: drop insideevs-batterylife-2021 from all ten 77.4 kWh Ioniq 5 powertrains (72.6 kWh pack per the page and per electrive), or prove same pack and peak (225 vs 233 kW). It also contradicts the electrive curve at 80 % (130 vs 125 is fine) and the dip at 52-54 % is not in the electrive test; two curves on the same car with a visible dip invite default confusion.
- Rule 14 (no unknowns): after the earlier spec batches, the covered powertrains still miss: Ioniq 6 (all 10) `capacity_gross_kwh`; Ioniq 9 `2026-awd` and `2026-awd-performance`: `capacity_usable_kwh`, `dc_max_kw`, `ac_max_kw`. (`research/powertrain-gaps.json` is stale: it still lists everything as missing.)
- Source quality: the three new sources have URLs and `accessed_on`; types `testing_org` are sensible; all curves have `low_confidence: true`. OK. (The reused electrive source is typed `community`; acceptable.)
- Rule 11 (fit): no same-kind value differs by more than 5 %: EV9 peak 216 vs 210 (2.9 %), Ioniq 5 58 peak 177 vs 175, Ioniq 9 peak 235 vs 237.

## Summary of per-curve outcomes

- electrive-2023 (10): FIX (drop 25 % point or justify, remove ambient, still sparse).
- insideevs-batterylife-2021 (10): ❌ drop (wrong pack).
- borrowed Ioniq 6 (10): ❌ unproven; drop or prove.
- Ioniq 5 58 kWh (4): FIX (sparse, 50 % guess, pack figures differ).
- borrowed EV6 58 (2): ⚠ acceptable match; needs a better sibling curve.
- EV6 prototype (14): ❌ remove, or guarantee it cannot be default; flag as pre-production.
- EV9 (8): ✅ values; drop 2026-land-awd and 2026-wind duplicates; 2027 unproven.
- Ioniq 9 (3): ⚠ too sparse; AWD and AWD Performance unproven.
