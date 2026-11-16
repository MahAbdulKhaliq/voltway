# Check: research/batch-2026-11-16-hw-tesla-euro.json

**Verdict: FIX** (drop the BMW i4 value; trim unsupported words in notes; others stay, all low_confidence)

`npx tsx scripts/add-facts.ts ... --check`: OK (84 variants, 107 sources after applying; nothing written).

| Variant | Field | Value | Result | Evidence |
|---|---|---|---|---|
| tesla/model-3/2026/premium-i | consumption_highway_wh_per_km | 154 Wh/km tested | ✅ verified (notes wording needs a fix) | Page: "4.03 miles/kWh (154 Wh/km)" at 74.5 mph; "ambient temperature of around 66-67 degrees" (19 C ok). 1000/(4.03x1.609344)=154.2 ok. Also 5.49 mi/kWh = 114 Wh/km at 56 mph ok. 2024 Highland RWD LFP 60.9 kWh gross; ours 60/57 LFP, same pack. Wheels not stated (notes say so). "dry" is not on the page. Page never says "120 km/h" (the notes' conversion is fine). Fits NRCan 161 Wh/km highway (-4%). |
| tesla/model-y/2026/long-range-awd-b | consumption_highway_wh_per_km | 168 Wh/km tested | ⚠ verified but weak | Page: both cars "around 3.7 miles per kWh", 70 mph test, 20-30 mph winds, Long Range AWD; temp and wheels not stated. 1000/(3.7x1.609344)=167.9 ok. Figure is rounded (+/-1.4 % from rounding alone) and the page gives one figure for old and new car, not Juniper only. 20-30 mph wind is not neutral and direction is unknown. Ours: LR AWD "b" 82/79 kWh NMC; the page does not state the pack. Pack/generation match is plausible, not shown. Fits NRCan 182 (-8 %). Keep only as low_confidence; owner may prefer to drop since it is the weakest in the batch. |
| bmw/i4/2026/edrive40-gran-coupe | consumption_highway_wh_per_km | 184 Wh/km tested | ❌ drop (hardware changed) | Page: 120 km/h = 184 Wh/km (296 Wh/mile), 20 C, 255/45-18 Hankook; 296/1.609344=183.9 ok. But the 2022 car has a silicon inverter; 2025 refresh (July 2025 build) moved eDrive35/40 to SiC inverters. InsideEVs 2026 i4 page: "new silicon carbide (SiC) inverters" raise range by 15 mi on 18-inch (about +4.7 %). Pack (83.4 kWh) and 335 hp stated unchanged, but the inverter is a relevant change to consumption and the rules require no relevant change to carry a test across years. Researcher admitted it was not verified. "dry" not on the page. |
| volvo/ex30/2026/twin-performance | consumption_highway_wh_per_km | 245 Wh/km tested | ✅ verified | Page: "394 Wh/mile", 75 mph, 57 F (14 C), 20-inch, 69 kWh gross / 64 kWh usable. 394/1.609344=244.8 ok. Same 69 kWh NMC pack; the 64 vs 66 usable gap is only a rating difference (our own Chargeprice value is also 64), not a different pack. Test is a 2024 car; Twin Performance layout unchanged. Fits NRCan 209 (+17 %; cool weather and 120 km/h, plausible). Battery-side is an assumption, flagged in notes. |

## Sources
All four: specific URL, accessed_on set, type testing_org fits. The embedded YouTube IDs and "timestamp not known" are honest but the brief asked for the specific video URL; the InsideEVs article is the cited page, acceptable. Page text for each cited figure was readable.

## Required changes
1. Drop `consumption_highway_wh_per_km` for `bmw/i4/2026/edrive40-gran-coupe` (and its source `src-insideevs-nyland-i4-edrive40-2022`): the 2025 refresh changed the inverter to SiC and raised range about 5 %, so the 2022 test is not the same powertrain. Reinstate only with a test of a post-July-2025 car.
2. Remove "dry" from the Test: prefix for the Model 3 and (if kept) any other value; none of the pages state road conditions. Write "road conditions not stated".
3. Model 3 notes: say the page gives 74.5 mph (not 120 km/h); 120 km/h is the researcher's conversion (about 119.9 km/h, fine).
4. Model Y: keep only if the owner accepts a wind-affected, rounded figure; if kept, add to notes that the page's 3.7 mi/kWh is a single figure for both the old and new Long Range AWD and that the pack is not stated on the page. Alternative: drop.
5. Optional: keep the EX30 as is (usable 64 on the page vs 66 on our variant is a rating discrepancy, not a pack mismatch).

## Applied by the main session (2026-11-16)

1. Dropped `bmw/i4/2026/edrive40-gran-coupe` highway value and source `src-insideevs-nyland-i4-edrive40-2022` (2025 refresh changed the inverter; 2022 test isn't the same powertrain).
2. Model 3 note: "dry" replaced with "road conditions not stated"; says the page gives 74.5 mph and ≈120 km/h is our conversion. (i4 note gone with the drop.)
3. Model Y: kept as `low_confidence`; note now says 3.7 mi/kWh is one rounded figure for old and new LR AWD together and the page doesn't state the pack. Flagged in the PR so the owner can drop it.
4. EX30: no change.
