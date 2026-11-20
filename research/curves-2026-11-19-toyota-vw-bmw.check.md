# Check: curves-2026-11-19-toyota-vw-bmw.json

**Verdict: FIX.** The Fastned values are copied correctly and the i4 and ID.4 curves are plausible. Two things must change: the 2023 AWD/Solterra curve breaks the B95 gap rule and has a made-up charger rating, and the bZ4X FWD curve is spread across two hardware generations with no `low_confidence`. Several same-hardware powertrains are also left without a curve.

`npx tsx scripts/add-facts.ts <batch> --check` passes: "OK, batch is valid (491 variants, 350 sources after applying)". `npm run data:build` threw an `rm` error on `public\data` (file likely locked). The Toyota/Subaru powertrains have no battery or `dc_max_kw` in `data/` yet, so I compared them with the pending `research/batch-2026-11-19-toyota-subaru.json` (71.4 kWh gross and 150 kW for FWD; 72.8 kWh gross and 100 kW for 2023 AWD, 150 kW from 2024). **Re-check these after that batch is revised.**

How I verified Fastned: I curled the three brand pages, decoded the `chargeGraph` JSON from each page's HTML (listing ids 573, 466, 233, 616) and compared every batch point against it. `robots.txt` is `Allow: /`, and no bot block was hit.

## Table

| Variant / curve | Field | Value | Result | Evidence |
|---|---|---|---|---|
| 7 bZ FWD powertrains (2023-xle-fwd, 2024-le/limited/xle-fwd, 2025-le/limited-fwd/xle-fwd) `fastned-2026` | points (17) | 9 to 85 %, peak 147.1 at 25 % | ✅ verified | All 17 points equal Fastned id 573 (class 300), within 0.06 kW. |
| same | listing and label | "75 kWh (2022 - 2025)", max 150 kW | ✅ verified | The page's accordion `data-name` is "75-kwh-(2022---2025)" and the listing is "Toyota bZ4X 75 kWh (2022 - 2025)" with `chargeSpeed` 150. Fastned's own text says the curve is at "optimal conditions (around. 30 °C)", so `battery_temp_c` 30 is stated. |
| same | pack match to 71.4 kWh | label 75 kWh vs 71.4 gross | ⚠ unverifiable | Fastned does not state the pack. The match rests on 150 kW. The peak is 147.1 (2 % under the 150 kW rating). Integrating 10 to 80 % gives 31.8 min at 64 kWh, against Toyota's claimed 28 to 35 min. Plausible, not proven. |
| same | year / generation | one curve for 2023 and 2024-25 | ❌ mismatch | The repo splits bZ FWD into `bz4x-launch` (2023-xle-fwd) and `bz4x-2024-charging-update` (2024-25). Fastned says "2022 - 2025" and gives no measured model year, and it is a European car. The same curve on both generations is unproven. |
| same | fit with independent test | Cars.com 2023 US FWD XLE | ⚠ conflict | I confirmed: "never observed higher than 52 kW", 39 °F, "150-kW" EA station, 54 min for 25 to 80 %. Fastned gives about 28 min for 25 to 80 %. The batch notes mention this, but the curve has no `low_confidence`. The test was cold, so it is not a clean contradiction. |
| 5 AWD/Solterra powertrains (toyota/bz 2023-limited-awd, 2023-xle; subaru/solterra 2023-limited, 2023-premium, 2023-solterra-awd) `insideevs-outofspec-2022` | points | 1/86, 7/87, 16/88, 50/51, 80/18, 90/7, 94/1, 99/1 | ✅ verified | InsideEVs lists "start: 0/1% SOC - right away at 86 kW", "6-8% SOC: 87 kW", "16% SOC: 88 kW (peak)", "50% SOC: 51 kW", "80% SOC: 18 kW", "90% SOC: 7 kW", "94% SOC or more: 1 kW". |
| same | right car | 2022 bZ4X Limited AWD, 72.8 kWh | ✅ verified | The page says "The 2022 Toyota bZ4X", "Limited trim all-wheel-drive", "72.8 kWh battery (total capacity), charging at up to 100 kW". This matches the pending spec batch for 2023 AWD (72.8 kWh, 100 kW). |
| same | SoC gaps | 16 to 50 (34 %), 50 to 80 (30 %) | ❌ mismatch | B95 and `MAX_GAP = 15` allow gaps of at most 15 %. The linter only warns, so `--check` still passes. The batch admits the gaps. A straight line from 16 % to 50 % to 80 % is a poor shape for a taper. |
| same | `conditions.charger_kw` | 150 | ❌ mismatch | The page says "according to the Electrify America's charger" with no rating. 150 is the batch's own assumption, entered as a stated condition. Use unknown or omit it. |
| same | Solterra copies | `kind: tested`, own `source_id` of the bZ4X test | 🏷 mislabel | No Solterra was tested. Rule 9 wants `based_on` with the sibling's measured curve and the comparison. Gross is 72.8 on both, DC peak 100 on both, NMC and 400 V on both. Usable is unknown on both (61 is the charger-side figure, flagged in the spec check), so that part is unproven. |
| 10 i4 powertrains `fastned-2026` (2022 edrive40, m50; 2023 edrive40, m50; 2024 edrive40, m50, xdrive40; 2025 edrive40, xdrive40, m50-xdrive) | points (22) | 4 to 98 %, peak 207.9 at 16 % | ✅ verified | All 22 points equal Fastned id 466 (e.g. 4 %: 198.9, 16 %: 207.92, 50 %: 107.2, 80 %: 56.6, 98 %: 39.1). The step at 17 % (196.08) and the 85 % bump are in the source. |
| same | listing | "83,9 kWh (2021+)", 200 kW | ✅ verified | `chargeSpeed` 200; "optimal conditions (around. 30 °C)". The page does not name M50 or the 2025 facelift; the "2021+" label covers them. |
| same | peak vs `dc_max_kw` | 207.9 vs 200 | ✅ verified | +3.96 %, within 5 %. All 10 powertrains have `dc_max_kw` 200. Other sources list 205 kW for later cars, which would make the margin smaller. |
| same | plausibility | 400 V NMC, 83.9 gross / 81.5 net | ✅ verified | The curve is the right shape for a 400 V pack (plateau to 20 %, taper). Integrating 10 to 80 % at 81.5 kWh gives 31.0 min, matching BMW's published 31 min in the powertrain data. That is a second source that agrees. |
| 8 ID.4 powertrains `fastned-2026` (2024 pro-awd, pro-s, pro; 2025 pro-awd, pro-s-awd, pro-s, pro; 2026 pro-rwd) | points (20) | 3 to 89 %, peak 178.8 at 18 % | ✅ verified | All 20 points equal Fastned id 233 (class 300). |
| same | "shared with GTX" | id 233 = id 616 | ✅ verified | Byte-identical graph JSON. The GTX listing (id 616) shows `chargeSpeed` 180 and id 233 shows 175. Fastned seems to reuse one MEB 77 kWh curve, so it is not proven which car was measured. Pack, chemistry and voltage match either way. |
| same | peak vs `dc_max_kw` | 178.8 vs 175 | ✅ verified | +2.2 %. Usable 77 kWh matches Fastned's "77 kWh" label. |
| same | second source | Cars.com "10-80 % about 30 min" | ⚠ weak | Integrating 10 to 80 % at 77 kWh gives 31.4 min. No independent shape source. The curve ends at 89 %. |
| All curves | kind, source quality | `tested`, Fastned `testing_org`, `accessed_on` 2026-11-19, specific URLs | ✅ verified | Acceptable; the notes say what Fastned itself states. |
| All curves | rule 11 fit | no existing curves on these powertrains | ✅ verified | Only the Solterra 2026 and C-HR curves exist, on other generations. |

## Required changes

1. **AWD/Solterra curve** `insideevs-outofspec-2022` on the 5 powertrains: it breaks the B95 gap rule (34 % and 30 %). Either drop it from all five, or get the owner to waive the rule for a `low_confidence` point-sample. The only way to meet the rule is a source with a chart or table (Out of Spec's own data).
   - If kept: remove `conditions.charger_kw: 150` (not stated on the page).
   - If kept: for the three Solterra powertrains, replace the copied `tested` curve with `based_on: { variant_id: <the bZ AWD 2023 variant>, reason: same 72.8 kWh gross, 100 kW, NMC, 400 V }`, `source_id` the InsideEVs source, and say usable is unknown on both sides.
2. **bZ FWD curve** on the 7 powertrains: add `low_confidence: true`.
   - State in the notes that Fastned gives no measured model year, that it is a European car, and that it covers both the launch and the 2024-update generations.
   - Either split the 2023 launch from the 2024-25 update, or state that same-curve across generations is unproven. At minimum the 2023 (launch) and 2025 (update) cars must be justified.
   - Name the Cars.com 39 °F test (52 kW peak, 54 min for 25 to 80 %) as a cold-battery contrast. Keep the "75 kWh vs 71.4 kWh pack" caveat: the match rests on the 150 kW rating only.
   - Re-check against the Toyota/Subaru spec batch once it is revised (pack, DC peak, preconditioning "none" vs this curve's optimal-30 °C conditions).
3. **ID.4 curve:** no value changes. Add to the notes that Fastned's ID.4 77 kWh and GTX listings carry identical data, so the measured car is unknown, and that the only second source is the Cars.com "about 30 min" figure (10 to 80 % integrates to 31.4 min).
4. **No-unknowns gaps for powertrains of the same hardware (rule 14)** left without a curve:
   - ID.4 `2026-awd` and `2026-standard`: 2024-update generation, 175 kW, 77 kWh. Add them to the ID.4 curve.
   - i4: 2026 `edrive40-gran-coupe`, `xdrive40-gran-coupe` and `m60-xdrive-gran-coupe` have no spec data yet. Their curve can't be matched until the 2026 pack and DC peak are known. The eDrive35 powertrains (2023, 2024, 2025: 180 kW, 66/67 kWh) are a different pack. Fastned id 827 "70,2 kWh" (180 kW) is a possible source. Report these as "no curve found".
   - bZ AWD 2024-25 (`bz4x-2024-charging-update`, 72.8 kWh, 150 kW) and Solterra 2024-25 have no curve. The 2023 AWD curve is the 100 kW car and can't be used for them.
   - bZ and ID.4 2023 US-built (170 kW) are a different hardware generation. These are left out correctly, but should be listed as "no curve found".
