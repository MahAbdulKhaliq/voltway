# Check: research/batch-2026-11-16-hw-gm-ford.json

**Verdict: FIX.** `--check` passes (84 variants, 109 sources). Seven values stand; three (Silverado LT Standard / LT Extended / Trail Boss weights) are unproven per-trim, the Trail Boss one is probably wrong, and the Silverado highway point is unfit for calibration.

## Table

| Variant | Field | Value | Result | Evidence |
|---|---|---|---|---|
| silverado-ev/2026/wt-std-range | curb_weight_kg | 3358 | ✅ | GM PDF read with pdftotext (WT page, "4WT (14 MOD)" column): "7,403/3358". Source already in `data/sources/`. |
| silverado-ev/2026/wt-ext-range | curb_weight_kg | 3675 | ✅ | Same PDF page, 5WT column: "8,102/3675". |
| silverado-ev/2026/wt-max-range | curb_weight_kg | 3839 | ✅ | Same PDF page, 8WT column: "8,464/3839". |
| silverado-ev/2026/lt-std-range | curb_weight_kg | 3358 | ⚠ unproven | The GM guide is titled "SILVERADO CREW CAB \| EV WT". KBB lists 7,403 lb for LT Std. KBB's figure is identical to GM's WT and its table has no trim labels, so it looks like a per-pack base value. The LT is not shown to weigh the same as the WT. |
| silverado-ev/2026/lt-ext-range | curb_weight_kg | 3675 | ⚠ unproven | KBB: 8,102 lb. Same issue; it equals the WT 5WT figure. |
| silverado-ev/2026/trail-boss-ext-range | curb_weight_kg | 3675 | ❌ likely wrong | KBB gives 8,102 lb, again identical to WT. Other sources contradict it: greencarscompare lists about 8,943 lb for Trail Boss Ext. Jalopnik expected over 8,500 lb. Cars.com shows 9,990 lb, which may be a GVWR mix-up. GM's guide has no Trail Boss page. The Trail Boss adds an off-road suspension and a different front end, so it is plausibly heavier than the WT. The batch itself says "looks pack-based". |
| silverado-ev/2026/lt-ext-range | consumption_highway_wh_per_km | 349 | ❌ unfit (arithmetic ✅) | Page: "320.6 miles", "179.9 kWh", "constant 70 miles per hour", "between 20 and 35 degrees", "cold weather and headwinds". 179.9 / 320.6 = 561.1 Wh/mi = 348.7 Wh/km. Battery-side (car-reported) is correct. Wheel size is not stated. See the calibration note below. |
| equinox-ev/2026/standard | consumption_highway_wh_per_km | 185 | ✅ | Page: "303 miles", "used 90.2 kWh", "3.4 miles per kWh", "mid-80s", "front-wheel-drive Equinox EV 2RS". 90.2 / 303 = 297.7 Wh/mi = 185.0 Wh/km. Variant is FWD. The page says "stated usable capacity of 85 kWh", while the repo has 85 gross / 80 usable, so the label differs but it is the same 85 kWh pack. Carry-over 2024 to 2026 is plausible. No change is known, but none is proven either. |
| lyriq/2026/standard | consumption_highway_wh_per_km | 197 | ✅ with caveat | Page: "330 miles", "used 104.7 kWh", "3.1 miles per kilowatt-hour", "rear-wheel-drive Lyriq", "upper 60s and about 80°". 104.7 / 330 = 317.3 Wh/mi = 197.1 Wh/km. Variant is RWD. Caveat: the page calls 102 kWh "usable". The repo has 95 usable / 100.4 gross, so the gauge used 104.7 kWh, more than either. The gauge over-reads, or the pack differs. Search shows the 2026 Lyriq still has a 102 kWh pack, but I found no source confirming the 2023 and 2026 RWD motor or pack match. The match is plausible but unproven. |
| mach-e/2026/extended-range-awd | consumption_highway_wh_per_km | 200 | ✅ (rounded input) | Page: "3.1 miles-per-kilowatt-hour", "285 miles", "upper 50s... mid-60s", "AWD with the extended range battery pack", usable "88 kWh to 91 kWh". 1000 / (3.1 x 1.609344) = 200.4. The page gives no kWh total, so the source is only the rounded 3.1 (range 197–204). 285 / 91 = 3.13 mi/kWh = 199 Wh/km, consistent. The batch correctly says "not confirmed" for the battery-side label. |
| f-150-lightning/2025/extended-range-131-kwh | consumption_highway_wh_per_km | 296 | ✅ (rounded input) | Page: "2.1 mi/kWh (29.5 kWh/100km)", "270 miles", "low 70s F", "Lariat trim with the Extended Range battery". 1000 / (2.1 x 1.609344) = 296; the page's own 29.5 kWh/100 km = 295 Wh/km. Both are consistent. The page calls 131 kWh "usable"; the repo has 131 gross / 123 usable, so the label differs. Pack and motors are the same from 2022 to 2025 as far as I know, but this was not checked. |

## Checks across the batch

- **Kind and type.** The GM figures are `manufacturer` (right). The KBB relay is `manufacturer` + `community` source type (matches rule 5). Highway values are `tested` from `testing_org` (right). All have `low_confidence`, and `accessed_on` is set.
- **Existing-data fit (>5 %).** Tested figures are below NRCan highway for four cars: Equinox 185 vs 210 (-12 %), Lyriq 197 vs 253 (-22 %), Mach-E 200 vs 213 (-6 %), Lightning 296 vs 333 (-11 %). That is expected, because NRCan is wall-side and adjusted while these are battery-side at 70 mph. It is the calibration signal, so don't treat it as a mismatch. Silverado LT ER 349 vs 341 (+2 %) is the exception, and only because it was cold.
- **Weights vs existing.** The batch adds no `curb_weight_kg` for variants that already have one (Equinox 2180, Lyriq 2550, Mach-E 2108, Lightning 2670 are untouched).
- **Wall-side vs battery-side.** All five highway notes say battery-side. The Mach-E and Lightning notes also say "not confirmed". That is honest, since those pages give no kWh total, and the notes label the basis correctly.
- **Label mismatch.** The 131 kWh (Lightning), 102 kWh (Lyriq) and 85 kWh (Equinox) figures are "usable" in the InsideEVs pages but gross or different in the repo. The batch doesn't write those as capacities, so only the notes are affected.

## Silverado calibration verdict

The 20–35 °F test with headwinds is not fit to keep as a calibration point. Cold air plus headwind and cabin heating raise the figure well above a mild-weather level, so the owner's highway factor would be biased. It is a measured figure from a credible source, so it is not wrong, but the other four tests sit at roughly 15–29 °C. The batch itself found a Trail Boss Max Range test at 454 mi (~2.1 mi/kWh), but it is a different pack, so it doesn't fit.

## Required changes

1. Drop `curb_weight_kg` for `chevrolet/silverado-ev/2026/trail-boss-ext-range`. KBB's 8,102 lb equals the WT figure, and other sources put the Trail Boss at roughly 8,900 lb or more. If kept at all it must be clearly flagged as unproven, but dropping is better.
2. Drop (preferred) `curb_weight_kg` for `lt-std-range` and `lt-ext-range`, or keep them only if the researcher finds a source that states the LT weight per trim (KBB's table has no trim labels and repeats GM's WT numbers). Without that the value could be low by several hundred lb.
3. Drop `consumption_highway_wh_per_km` (349) for `lt-ext-range`, or tag it so the calibration excludes it. If kept, add a "cold/headwind, not for calibration" note to the value. A mild-weather Silverado test is still wanted.
4. Optional wording fixes. In the Lyriq note, say "article calls 102 kWh usable; repo has 95 usable / 100.4 gross" instead of "Cadillac-listed usable 102 kWh", and note that the 2023-to-2026 pack/motor match is unconfirmed. In the Lightning note, say "article says 131 kWh usable; repo has 131 gross / 123 usable". For the Mach-E, add "3.1 is rounded (197–204 Wh/km)".
5. Nothing to change on the three WT weights or the Equinox, Mach-E and Lightning values.

Files: `G:\Work\EV Charging App\.claude\worktrees\friendly-haslett-5b3e50\research\batch-2026-11-16-hw-gm-ford.json` (not edited).

## Applied by the main session (2026-11-16)

1. Dropped `curb_weight_kg` for `trail-boss-ext-range` (likely wrong: Trail Boss is heavier than the WT/LT figure KBB repeats).
2. Dropped `curb_weight_kg` for `lt-std-range` and `lt-ext-range` (KBB repeats GM's WT per-pack figures; LT weight unproven). Source `src-kbb-silverado-ev-2026-specs` removed as unused.
3. Silverado LT ER highway 349: kept as a real tested figure but its note now says "NOT FOR CALIBRATION" (cold, headwinds); item 3.7 must exclude it. The owner may prefer to drop it.
4. Wording: Lyriq, Mach-E and Lightning notes now give the repo's usable/gross figures, the unconfirmed Lyriq pack match, and the rounded 3.1 mi/kWh.
5. WT weights, Equinox, Mach-E, Lightning, Lyriq values unchanged.

## Owner decision B48 (2026-11-16, on PR #78)

The owner dropped every value marked "NOT FOR CALIBRATION" from the data (not from this batch file, which stays as the audit trail): tested consumption baselines must be mild-weather, near-standard tests. Removed from `data/variants/**`: IONIQ 5 long-range AWD (3 °C), EV6 Land AWD (0 °C), LEAF Platinum+ (~3 °C), Silverado EV LT ext range (cold + headwinds). Sources no longer cited (`src-insideevs-leaf-70mph-2026`, `src-insideevs-silverado-ev-lt-er-test-2025`) were deleted from `data/sources/`. Re-running add-facts on this batch would bring them back: don't.
