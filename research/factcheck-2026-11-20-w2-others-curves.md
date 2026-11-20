# Fact-check: curves-2026-11-20-w2-others.json

**Verdict: FIX.** All 17 Fastned series and the Bolt 2027 prose match their sources. The problems are Polestar 4 truncation, Polestar 3 2026 on the wrong hardware, Lexus RZ pack mismatch, Bolt 2027 coverage, and a few labels or confidence flags. `npx tsx scripts/add-facts.ts <batch> --check` passes (1408 variants, 948 sources); nothing was applied.

## Method
- Re-fetched every Fastned page with curl. Each page embeds a `data-json` block with `chargeGraph` (SoC % to kW) and `chargeSpeed`. I compared every batch point (all points of one powertrain per series; the rest share a hash) against that block: **0 mismatches** in all 17 series (tolerance 0.06 kW).
- Fetched the InsideEVs Bolt article (prose only, no table) and compared the 8 points to the quoted text.
- Compared each powertrain with its merged data in `public/data/cars/`. The pack figures below are from there.

## Table

| Variant / curve | Field | Value | Result | Evidence |
|---|---|---|---|---|
| GV60 77.4 (9 ids, 2023-25) | curve fastned-2026 | 21 pts, peak 234.8 at 52 % | verified | Page "GV60 77,4 kWh (2022 - 2025)", chargeGraph 2-95 %, max 234.79. dc 233, so +0.8 %. |
| GV60 2025 (3 ids) | pack match | 77.4 kWh | unverifiable | Fastned also lists "GV60 84 kWh (2025+) 260 kW" next to "77.4 (2022-2025)". Repo marks 2025 gross as estimated; GV70 2025 says "84 kWh from 2026". |
| GV70 77.4 (3 ids) | curve | same points as GV60, hash 91b801 | verified, label ok | GV70 page "77,4 kWh (2022+)" holds the same numbers. `tested` is literally right (Fastned publishes it), but it is not an independent measurement. `low_confidence` is set. Same pack 77.4/74 and dc 233 as GV60. |
| Ioniq Electric 28 kWh 2017-19 | curve | 19 pts, peak 68.7 at 75 % | verified | Page "30,5 kWh (2016 - 2019)", max 68.73. Repo gross 30.5, usable 28, dc 70. |
| Ioniq Electric 38 kWh 2020-21 | curve | 19 pts, peak 44.4 | verified | Page "38,3 kWh (2019 - 2022)". Rule: low confidence (set). |
| Kia Soul EV 39 kWh 2020-23 | curve | same hash cb4895 as Ioniq 38 | verified but doubtful | Same numbers as the Ioniq page. Repo usable 38.3 (Ioniq) vs 39.2 (Soul) differs 2.3 %, gross 40.4 vs 42 differs 4 %, so "same pack" is unproven. Fastned dates it 2020-22; 2023 is assumed. `low_confidence` set. |
| Kia Soul EV 64 kWh 2020-23 | curve | 18 pts, peak 76.7 at 40 % | verified | Page "64 kWh (2020 - 2024)", max 76.68. dc 77. |
| EV3 Long Range (3 ids) | curve | 19 pts, peak 132.3 at 63 %, ends 82 % | verified | Page max 132.25, chargeSpeed 135. dc 128 (+3.4 %, ok). EU CCS2 car; the 2027 US car is assumed to share pack and software (stated in the notes). |
| EV3 Standard Range (1 id) | curve | 15 pts, 17-80 %, peak 101.4 | verified | Page max 101.44. dc 101. No data below 17 %. |
| Polestar 3 2025 (3 ids) | curve | 20 pts, peak 235.5 at 13 % | verified | Page "111 kWh (2023 - 2025)", chargeSpeed 250. Repo 111/107/250, 400 V. Same numbers on the EX90 page, so not LC-flagged but should be (see 5). |
| **Polestar 3 2026 (3 ids)** | curve | same 400 V series | **mismatch** | Repo 2026 data: gross 106, dc 350 (manufacturer, 800 V refresh). Fastned has a separate "111 kWh (2025+) 350 kW" entry with `chargeGraph` null (no graph). The 2023-25 series is the wrong hardware for the possible refresh. |
| EX90 2025 (2 ids) | curve | same hash as Polestar 3 | verified | Page "111 kWh (2023 - 2025)". Repo 111/107/250 on both. Notes already say 2026+ is not covered. |
| **Polestar 4 (5 ids)** | curve | 20 pts, peak 209.5 | **truncated** | Page: 9 % 204.25, 10 % 210.53, 11 % 211.04, 12 % 211.95, **13 % 212.56**, 14 % 211.47. Every kept point matches, but points at 10-14 % (above 210) were dropped so the peak would pass the rule. Page chargeSpeed is 210. Repo dc_max is 200 (Polestar US/CA pages: "DC up to 200 kW"). |
| EC40 2022-23 | curve | 20 pts, peak 151 at 9 % | verified | Page "C40 Recharge 78 kWh (2021 - 2023)", chargeSpeed 150. Repo 78/75, dc 150. Fastned also lists a 82 kWh (2023-2024, 200 kW) pack; repo 2023 stays on 78 kWh (Volvo US: Twin keeps 78 kWh). |
| EC40 2024 | curve | same, LC | verified | Fastned dates 2021-23; repo 2024 is 78 kWh / 150 kW, manufacturer (Volvo US 2024). LC set, ok. |
| I-PACE 2019-24 | curve | 22 pts, peak 103.2 at 32 % | verified | Page "90 kWh (2020+)", max 103.22. Repo 90/84.7/100. 2019 is LC (set). |
| Lexus RZ (10 ids) | curve | 17 pts, peak 147.1, 9-85 % | verified, pack mismatch | Page "75 kWh (2023+)", chargeSpeed 150. Repo: 450e 71.4 (-5 %), 300e 72.8 (-3 %); neither within 1 % of 75. 300e vs 450e gross differ 2 %. The series is identical to Solterra/bZ4X, so it looks like a generic e-TNGA series. |
| Fiat 500e 2024-26 (6 ids) | curve | 18 pts, peak 85 at 20 % | verified | Page "42 kWh (2020+)", chargeSpeed 85. Repo 42/37.3, dc 85. |
| Fisker Ocean (4 ids) | curve | 17 pts, peak 174 at 30 % | verified, plausibility concern | Page "113 kWh (2023 - 2024)", max 173.97, chargeSpeed 250. Repo 113/106.5/250. Peak is 30 % below the rating, single source, no LC flag. |
| Bolt EV 2017-19 | curve | 17 pts, 22-92 %, peak 46.2 | verified, weak | Page "Ampera-e 60 kWh (2017 - 2021)", max 46.19, chargeSpeed 50. Same car and 60 kWh pack as the Bolt (gross 60 manufacturer). Repo dc_max 55 (estimated). Peak is 16 % under it; no data below 22 %. LC set. |
| **Bolt 2027** | curve | 8 pts, 10-80 % | **weak** | Quotes below. |

### Bolt 2027 points against the article (quotes under 15 words)
- 10 %: 151 kW, found ("going up to 151 kW", within a minute).
- 18 %: 156 kW, found.
- 40 %: 150, a lower bound ("sustained over 150 kW" from 18 % to 40 %); recorded as a measured value.
- 45 %: 140, 50 %: 115, 55 %: 110, 60 %: 100, all found.
- 80 %: 80 kW, found ("about 80 kW").
- Preconditioned yes, 75 F, 26 minutes: found.
- Charger `charger_kw: 250` is not in the article ("Tesla Supercharger" only). It is an assumption placed in `conditions`.
- SoC gaps: 18 to 40 is 22 %, 60 to 80 is 20 %. Both break the 15 % limit. Exactly 8 points. Nothing above 80 %.

## Checks by topic

**Identical-series pairs.**
- GV60/GV70: same E-GMP 77.4 pack, dc 233. Mapping is fine. `tested` is right as "Fastned publishes this graph" but it is one measurement shown twice. LC is set on the GV70 side. The GV60 side has no flag.
- Polestar 3/EX90 2025: same pack 111/107, dc 250. Same numbers, neither side LC-flagged. The two are one series, not two tests. Add `low_confidence` and a note to both.
- Ioniq 38/e-Soul 39: usable 38.3 vs 39.2 and gross 40.4 vs 42 differ, so identical numbers are a Fastned shared series, not proof of equal hardware. Both are LC. Only acceptable at LC.
- RZ vs Solterra/bZ4X: the RZ curve is one series from the generic e-TNGA page. LC set. See fix 3.

**Point-reading and plausibility (B95).**
- Every Fastned series has at least 15 points below 100 % and no gap above 6. The Polestar 4 gap of 6 comes from the dropped points.
- The upper limit "peak must not exceed dc_max by more than 5 %" holds in the batch as written. It fails for the true Polestar 4 data (212.56 vs 200 is +6.3 %), which is why points were dropped. It holds for GV 234.8/233, EV3 132.3/128 (+3.4 %), I-PACE 103.2/100.
- Curves far below their dc_max: Fisker 174/250, Ioniq 38 and Soul 39 at 44.4/50, Polestar 3 at 235.5/250 (-5.8 %), Bolt 46.2/55. The rule only caps from above; the Fisker gap is large enough to want a second source or LC.
- `--check` passes but does not test the peak rule, so a pass is not a plausibility pass.

**Kind.** All Fastned curves are `tested`, `source_id` is a `testing_org` source; ok. Bolt 2027 is `tested` from Out of Spec Testing relayed by InsideEVs; ok.

**Sources.** All 18 have URL, `accessed_on`, `type`. Several share one URL across two source ids (Ioniq 30.5 and 38.3 share a page; so do e-Soul 39 and 64, EV3 LR and SR). The version string is in the title and notes; ok.

## Fix list

1. **Polestar 4 (5 ids): keep the full measured curve.** Do not truncate. Put back the points at 10 % (210.5), 11, 12, 13 (212.6), 14 % (211.5), at least 10, 13 and 14 %. Then handle the peak rule one of two ways:
   a. Add a second `dc_max_kw` on the powertrain: **210 kW**, `kind: tested`, from `src-fastned-polestar-4-100kwh-2026` (page `chargeSpeed` 210), with a note that Polestar US/CA state 200 kW. Keep the 200 manufacturer value. Check that the displayed dc_max (the data build picks one) ends up where the peak rule is satisfied: 212.56 is +1.2 % over 210 but +6.3 % over 200. If the build picks the manufacturer value, the linter will flag it, so the owner should say which rule applies.
   b. If that is not wanted, hold the Polestar 4 curve until the rule is decided. A truncated curve should not ship, because it hides the real peak and misstates charging speed.
2. **Polestar 3 2026 (3 ids): drop the curves.** Repo says 106 kWh, 350 kW, 800 V refresh; the series is from the 111 kWh, 250 kW, 400 V car. Fastned's "111 kWh (2025+) 350 kW" has no graph. Hold until a measured 2026 curve exists. (The repo's 2026 data is itself inconsistent: gross 106, usable 107 estimated, 400 V estimated; flag that for the data owner, not the curve batch.)
3. **Lexus RZ (10 ids): pack mismatch.** The Fastned page is "75 kWh" and matches neither 71.4 (450e) nor 72.8 (300e). The series is also identical to Solterra/bZ4X. Drop the 300e (4 ids, 72.8 kWh; not even within 1 % of 71.4). Keep the 450e only at `low_confidence` with the pack mismatch in the note; or hold all RZ curves until an RZ-specific source. The current notes already state the mismatch.
4. **Bolt 2027: coverage.** Only 8 points with gaps of 22 and 20 %, and a lower-bound point recorded as exact. Either find a second source (Road & Track is cited in the notes, also an Out of Spec chart) and add points at about 25, 30, 35 and 65-75 %, or hold. At minimum drop the unstated `charger_kw: 250`, and state in the notes that the 40 % point is a lower bound. The peak rule (156 vs 150, +4 %) is ok.
5. **Polestar 3 2025 and EX90 2025: add `low_confidence`** and a note that the two pages carry one shared series (the Polestar 3 note says it, the flag is missing). GV60 has the same one-series issue with GV70 (flag is on the GV70 side only); mention it in the GV60 notes.
6. **GV60 2025 (3 ids): pack unverified.** Fastned lists a 2025+ 84 kWh pack next to "77.4 (2022 - 2025)" and the repo's GV70 note says the 84 kWh pack came with MY2026. Confirm that US/Canada MY2025 GV60 is 77.4 (the repo marks it `estimated`) or mark the 2025 GV60 curves LC.
7. **Bolt EV 2017-19: fix dc_max or mark.** Peak 46.2 vs repo dc_max 55 (estimated). Fastned states 50 for the Ampera-e. Change dc_max to 50 or say in notes that the Bolt NA 55 kW is untested; the curve already says no data below 22 %. Keep LC. The Ampera-e is the same car and pack as the Bolt (60 kWh, 2017-19), so the mapping itself is sound.
8. **Fisker Ocean (4 ids): add `low_confidence`** (single Fastned source, peak 174 against a 250 kW rating) or find a second source.
9. **Soul EV 39 kWh (4 ids):** keep LC. The Ioniq 38.3 and Soul 39.2 packs differ, so the match is unproven; word the note "Fastned shows the same series for both, hardware match unproven", not "shared pack hardware".

## Required fields
This batch is curves only, so the "no unknowns" rule is not tested here. Gaps seen in the merged data: Ioniq Electric (all years) and Soul EV 39 kWh have no `chemistry`.

Items I could not check: the Polestar US page for a 210 kW figure (the repo cites 200 from Polestar US/CA). Fastned's 210 comes from its own page data.
