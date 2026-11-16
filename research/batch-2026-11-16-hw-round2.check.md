# Check: research/batch-2026-11-16-hw-round2.json

**Verdict: FIX.** All 8 numbers match the right Nyland sheet row (re-read via the CSV export, gid 735351678). One value should be dropped (VW ID.4, wrong motor generation). Two cold tests (Ioniq 5 at 3 C, EV6 at 0 C) must be excluded from calibration. Two others need an owner caveat (Polestar pack data looks stale on our side). `npx tsx scripts/add-facts.ts ... --check`: OK (valid, nothing written).

Source record: one source (sheet URL with gid, accessed_on, testing_org) is specific enough, because every note names the sheet row ("Nyland, '<car>'"). The sheet has no battery-side/wall-side column; the notes say so honestly. Kind `tested` is right for all.

| Variant | Field | Value | Result | Evidence |
|---|---|---|---|---|
| tesla/model-3/2026/premium-awd-i | consumption_highway_wh_per_km | 161 | ✅ | Row "Tesla Model 3 LR Highland, Dry, 19 C, Michelin e-Primacy, 235/45-18, 120, 161, 74,5". The other Highland row (Wet, 3 C, Falken winter) is 226 and was correctly not used. 82 kWh gross matches our car; 18-inch matches. Existing rated_nrcan 173 (wall-side), tested 161 is 7 % lower, plausible. |
| hyundai/ioniq-6/2025/long-range | consumption_highway_wh_per_km | 197 | ✅ (caveat) | Row "Hyundai Ioniq 6 RWD, Dry, 9 C, Continental VC7 Winter, 225/55-18, 120, 197, 75,1". Pack 77.4 kWh gross matches ours; pre-facelift car on our 2025 trim is acceptable because our pack is the same. Cool (9 C) and winter tyres: borderline for calibration. |
| hyundai/ioniq-5/2026/long-range-awd | consumption_highway_wh_per_km | 248 | ✅ value, ⚠ use | Row "Hyundai Ioniq 5 AWD 84 kWh, Dry, 3 C, Continental VC8 Winter, 255/45-20, 120, 248, 78,4". Cold test, 11 % above our rated 223 (and well above a mild-weather figure). Euro car; motor output vs Canadian AWD not verified (batch admits this). |
| kia/ev6/2025/land-awd | consumption_highway_wh_per_km | 256 | ✅ value, ⚠ use | Row "Kia EV6 AWD facelift, Dry, 0 C, Nokian R5 EV Winter, 255/45-20, 120, 256, 78,4". 0 C test, 16 % above our rated 220. Euro motor output unverified. |
| kia/niro-ev/2026/standard | consumption_highway_wh_per_km | 223 | ✅ | Row "Kia Niro EV, Dry, 11 C, Continental EC6 Summer, 215/55-17, 120, 223, 64,3". Mild enough. Our usable 68.4 kWh on this variant looks stale versus 64.8 gross (batch notes it): owner should review that field, not this value. |
| polestar/polestar-2/2025/single-motor | consumption_highway_wh_per_km | 218 | ✅ | Row "Polestar 2 LR SM refresh, Dry, 15 C, Continental PreCon 6, 245/40-20, 120, 218, 79,1". Right car in generation terms (2024+ refresh = our 2025 NRCan car). Our 78/75 kWh looks stale: a web search found 79 kWh usable for the MY25/26 Long Range Single Motor (EV Database, Green Cars Compare), 82 kWh gross (Carsales); no Canadian page read. This is an upstream pack-data problem, not a wrong match. |
| polestar/polestar-2/2025/dual-motor-performance-pack | consumption_highway_wh_per_km | 222 | ✅ | Row "Polestar 2 Performance 2024, Dry, 11 C, Continental SC6, 245/40-20, 120, 222, 79,1". Dual motor Performance, 20-inch. Same stale-pack caveat. Our rated_nrcan highway is 240 (wall-side), so 222 is 7.5 % lower, plausible. |
| volkswagen/id-4/2026/awd | consumption_highway_wh_per_km | 218 | ❌ | Row "VW ID4 Pro 4Motion, Dry, 14 C, Hankook S1evo3, 235/55-19 / 255/50-19, 120, 218, 75,5" matches, but it is a pre-2024 car. The 2024 update added the 210 kW APP550 rear motor (AWD up to 220 kW, 175 kW DC) and 82 kWh gross pack; search confirms. Motor differs from our 2026 AWD, so the "same motors" rule fails. The note concedes the refresh is "not captured". Rated_nrcan 219 equals the tested 218 only by coincidence (wall vs battery side). |

## Required changes

1. **Drop `consumption_highway_wh_per_km` for `volkswagen/id-4/2026/awd`**: the test car is a pre-2024 Pro 4Motion with the old rear motor; our 2026 AWD has the post-2024 drive. Re-add only if a Nyland row for a 2024+ ID.4 AWD (APP550) exists (the "ID4 GTX 82 kWh" row is 21-inch, 24 C, 221, and a different car).
2. **Cold tests: do not feed `hyundai/ioniq-5/2026/long-range-awd` (3 C, 248) and `kia/ev6/2025/land-awd` (0 C, 256) into the highway-factor calibration.** The notes already start with the temperature, but there is no machine-readable flag. Either drop the two values (safest if calibration reads every `tested` value) or keep them and have the calibration script exclude tests below about 10 C (also consider the Ioniq 6 at 9 C with winter tyres, 197; it is the mildest of the cold-ish set, so keep it but treat it as low-weight).
3. **Owner follow-up (data on our side, not a batch edit):** Polestar 2 2025 variants show 78/75 kWh; the refresh car is 82 gross / 79 usable. Niro EV 2026 usable 68.4 vs 64.8 gross pack. Fix those in their own batches; the highway values themselves stand.
4. Optional: Ioniq 5 and EV6 are Euro cars; keep the "motor output not checked" wording as is.

Kept (6 of 8): Model 3 161, Ioniq 6 197, Niro 223, Polestar SM 218, Polestar Performance 222, plus Ioniq 5 248 and EV6 256 only if the calibration excludes cold rows.

## Applied by the main session (2026-11-16)

1. Dropped `volkswagen/id-4/2026/awd` (pre-2024 car; motors differ from our 2026 AWD).
2. Cold tests kept but their notes now carry a consistent "NOT FOR CALIBRATION: cold test" marker so item 3.7 can exclude them: IONIQ 5 AWD (3 °C), EV6 Land AWD (0 °C). The same marker was put on the LEAF Platinum+ (≈3 °C, other batch) and the Silverado LT ER (cold + headwinds, other batch). IONIQ 6 (9 °C) kept with a "low weight" note.
3. Polestar 2 pack figures (78/75 kWh, probably stale) and Niro EV usable 68.4 kWh: not changed here; listed as follow-ups in the PR.

## Owner decision B48 (2026-11-16, on PR #78)

The owner dropped every value marked "NOT FOR CALIBRATION" from the data (not from this batch file, which stays as the audit trail): tested consumption baselines must be mild-weather, near-standard tests. Removed from `data/variants/**`: IONIQ 5 long-range AWD (3 °C), EV6 Land AWD (0 °C), LEAF Platinum+ (~3 °C), Silverado EV LT ext range (cold + headwinds). Sources no longer cited (`src-insideevs-leaf-70mph-2026`, `src-insideevs-silverado-ev-lt-er-test-2025`) were deleted from `data/sources/`. Re-running add-facts on this batch would bring them back: don't.
