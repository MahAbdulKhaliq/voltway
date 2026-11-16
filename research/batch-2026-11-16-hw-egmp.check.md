# Check: research/batch-2026-11-16-hw-egmp.json

**Verdict: PASS** (with minor wording suggestions; no value needs to change).

`npx tsx scripts/add-facts.ts research/batch-2026-11-16-hw-egmp.json --check` -> OK (84 variants, 118 sources). `npm run data:build` ran. Nothing applied.

All lb -> kg conversions re-computed with 0.45359 and match the batch: 4376->1985, 4608->2090, 4707->2135, 5516->2502, 4134->1875, 4398->1995, 4630->2100, 5093->2310, 5331->2418, 5620->2549, 5842->2650, 5917->2684, 3721->1688.

| Variant | Field | Value | Result | Evidence |
|---|---|---|---|---|
| hyundai/ioniq-5/2026/long-range | curb_weight_kg | 1985 | ✅ | Guide Auto 2026 Preferred RWD: "1,985 kg (4,376 lb)", 84.0 kWh, P235/55R19 (our trim is 19 in) |
| hyundai/ioniq-5/2026/long-range-awd | curb_weight_kg | 2090 | ✅ (partial) | Guide Auto Preferred AWD: "2,090 kg (4,608 lb)", 84.0 kWh, 19 in. Variant also has a 20 in trim, which CarFactSheet suggests is heavier (Limited AWD 4,806 lb = 2,180 kg); notes already say 19 in only |
| hyundai/ioniq-5/2026/long-range-awd-xrt | curb_weight_kg | 2135 | ✅ | CarFactSheet table: XRT 4,707 lbs, labelled "Manufacturer Per trim Data as of July 2026", "published by Hyundai". A relay of the OEM figure, so `manufacturer` + `community` is right. US figure, no Canadian page; low_confidence is set. XRT is 84 kWh AWD, 18 in in our data |
| hyundai/ioniq-9/2026/standard | curb_weight_kg | 2502 | ✅ | Guide Auto Essential RWD 2026: "2,502 kg (5,516 lb)", 110.3 kWh |
| kia/ev6/2025/light | curb_weight_kg | 1875 | ✅ / label | Page says "Weight" 1,875 kg (4,134 lb), 62.9 kWh. Not labelled curb weight on the page; note should say "presumed curb weight" |
| kia/ev6/2025/wind | curb_weight_kg | 1995 | ✅ | Guide Auto Wind RWD 2025: 1,995 kg (4,398 lb), 84.0 kWh |
| kia/ev6/2025/land-awd | curb_weight_kg | 2100 | ✅ (partial) | Land AWD 2025: 2,100 kg (4,630 lb), 84.0 kWh, P235/55R19. Our variant has 19 and 20 in trims; note already limits to 19 in |
| kia/ev9/2026/light | curb_weight_kg | 2310 | ✅ | "Curb weight: 2,310 kg (5,093 lb)", 76.1 kWh |
| kia/ev9/2026/wind | curb_weight_kg | 2418 | ✅ | 2,418 kg (5,331 lb), 99.8 kWh, 2026 Wind RWD |
| kia/ev9/2026/land-awd | curb_weight_kg | 2549 | ✅ | 2,549 kg (5,620 lb), 99.8 kWh. Page tyres P255/60R19; our data has 20 in (275/50R20) for this trim, so wheel size on our side and the page differ (weight is for Guide Auto's Land AWD either way; note says 19 in) |
| kia/ev9/2026/land-awd-gt-line | curb_weight_kg | 2650 | ✅ / label | Page: "Weight" 2,650 kg (5,842 lb), 99.8 kWh, P285/45R21 (matches our 21 in). Note lacks the "presumed curb weight" caveat |
| kia/ev9/2026/gt | curb_weight_kg | 2684 | ✅ | 2,684 kg (5,917 lb), 99.8 kWh, 21 in |
| kia/niro-ev/2026/standard | curb_weight_kg | 1688 | ✅ | 2026 Niro EV Wind: 1,688 kg (3,721 lb), 64.8 kWh, P215/55R17 |
| kia/ev9/2026/land-awd-gt-line | consumption_highway_wh_per_km | 259 | ✅ | AOL (Car and Driver syndication) contains: "the van averaging 2.2 miles per kilowatt-hour versus the SUV's 2.4 mi/kWh". GT-Line, 99.8 kWh, 285/45R21, 240 mi, "our 75-mph real-world highway route". 1000/(2.4x1.609344)=259 ✓. Model year of test car ambiguous (caption "2024"), same generation/pack/wheels, stated in notes. Page does not say wall-side or battery-side, and notes say "not stated", which is accurate. NRCan highway on car is 292 (kind differs, no conflict flag) |
| hyundai/kona-electric/2026/standard | consumption_highway_wh_per_km | 214 | ✅ | InsideEVs: 2024 Kona Electric, 64.8 kWh, "extended 75 mph highway speeds", ~14 C, 21.4 kWh/100 km for full 132-mile test. 21.4 kWh/100 km = 214 Wh/km ✓. Source (display vs charger) not stated, notes say so. Existing NRCan highway 203 (+5.4 %, different kind) |

## Answers to the riskiest points
1. Every Guide Auto page was reopened: right trim, model year and 84.0 kWh pack (IONIQ 5 2026, EV6 2025 Wind/Land, EV9 2026). All lb/kg pairs match.
2. CarFactSheet is a relay of the Hyundai per-trim table (stated on the page as manufacturer data, July 2026), not a model. Acceptable.
3. 19/20 in: batch values are for the 19 in trims and the notes say so. The value is attached at variant level, so it will also show on the 20 in trim; low_confidence plus the note covers this.
4. Kona: page is a 2024 car, 64.8 kWh, same generation. OK.
5. EV9: AOL copy contains 2.4 mi/kWh and the 75-mph route; the page does not say wall-side. The notes' "not stated" is correct. Car and Driver usually measures at the charger, but that is not on the page, so it should not be asserted.

## Optional wording fixes (none block merging)
- kia/ev6/2025/light and kia/ev9/2026/land-awd-gt-line: Guide Auto labels the figure "Weight"; add "presumed curb weight" like the other notes. (My page reads were summarised by a model and the "Weight" vs "Curb weight" label differed between reads for several EV6/EV9/Niro pages, so the label cannot be treated as certain; "presumed" is safest.)
- kona note: "184 mi projected" was not found on the page (page says 132 mi driven, 18 % left, ~33 mi remaining, i.e. ~165 mi). Remove or correct that phrase.
- ev9/2026/land-awd note says 19-inch, but our data records 20 in (275/50R20) for this trim; reword to "Guide Auto's tyre listing is P255/60R19".

## Applied by the main session (2026-11-16)

All three optional wording fixes applied: "presumed curb weight" added to EV6 Light and EV9 GT-Line notes; "184 mi projected" removed from the Kona note (now "132 mi driven with 18 % left", test car 2024); EV9 Land AWD note now says Guide Auto's tyre listing is P255/60R19 while our data lists 20-inch. No values changed.
