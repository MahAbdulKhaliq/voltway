# Check: research/batch-2026-11-19-toyota-subaru.json

**Verdict: FIX.** `add-facts --check` passes (valid, 162 sources after applying). 41 powertrains, no curves. Every field `powertrain-gaps.json` lists as missing is filled (no unknowns left). The charge port, Supercharger access, 150 kW peaks, 2026/27 pack sizes, 11 kW AC and 74.7 / 54 usable values check out against their pages. Six problems need changes before apply:

1. The `xle-fwd` and `xle-plus-fwd` pack assignment contradicts the approved crosswalk.
2. The 61 kWh usable figure is not a usable figure.
3. The 2023-25 AC value conflicts with sources.
4. Some labels are wrong.
5. Some Canada cars have no Canadian source.
6. Several source or quote mismatches.

I did not apply anything and did not edit the batch, `data/` or `crosswalk/`.

## Riskiest points, answered

| Point | Result |
|---|---|
| EPA Ah → pack | The batch follows Toyota's trim names, and those are right (Toyota USA 2026: "XLE FWD Plus" 74.7 kWh 314 mi; "XLE FWD" 57.7 kWh 235 mi; Limited FWD 74.7 kWh 299 mi; XLE AWD 74.7; Limited AWD 74.7). The repo's crosswalk maps EPA rows the other way round. See Required change 1 (blocker). |
| 2023 AWD 100 kW vs 2024-25 AWD 150 kW | ✅ 2023 = 100: InsideEVs/Out of Spec says AWD "charging at up to 100 kW", measured peak 88 kW. ✅ 2024-25 AWD = 150: InsideEVs says Toyota "raised that limit to 150 kW for the 2024 model year"; EV Pulse says the same. EV Database's 147 kW is the European AWD, a different market. |
| 2024 Solterra 150 | ⚠ Estimated from the twin's page. The batch's own note records the conflict: EV Specifications has 100 kW for MY23 and MY24 and 150 for MY25. Basis is valid under rule 5 (same pack and 80+80 kW motors per EPA), but it is unproven. Keep `low_confidence`. |
| Usable 64 (71.4 pack) | ✅ value, ❌ citation. See change 3. |
| Usable 61 (72.8 pack) | ❌ See change 2. |
| Usable 71 (74.7 pack) | ✅ EV Database 3401: "Usable 71.0 kWh" for the 74.7 pack. ⚠ unproven on Canada-listed cars (77 kWh gross). See change 7. |
| Usable 54 (57.7 pack) | ✅ EV Database 3133: usable 54.0 kWh, nominal 57.7. The Toyota UK press pack also gives the pack as 57.7 kWh, 78 cells. |
| 57.7 chemistry | ⚠ NMC is probably right, but no manufacturer page says it. EV Database 3133 says "NMC". Autopian (the cited source) gives 288.6 V and no chemistry. The 78 cells × 3.7 V = 288.6 V reasoning in the notes is sound. See change 6. |
| 2023-25 AC 6.6 vs 7 / 7.6 | ❌ Unresolved conflict. See change 4. |
| 2023-25 preconditioning `none` | ⚠ Acceptable as `estimated` (rule 6) for 2023 and 2024: EV Database lists "Not supported" for MY22-24, and Toyota USA calls it "new" on the 2026 bZ. 2025 is unverified for North America; I found no page. Both Toyota and Subaru call it new for 2026, which supports `none` for 2025. Counter-evidence: Subaru's 2025 kit says an "uprated battery conditioning system" improved cold-weather charging, and EV Pulse mentions a battery-heating valve on the 2024 AWD. Neither is a preconditioning control. |
| Woodland and C-HR Supercharger access | ⚠ Value plausible, but see change 5 (market source). |
| C-HR Canada SE is FWD, 77 kWh | ✅ Drivetrain: Toyota Canada SE is FWD (221 hp / 167 kW, 496 km), matching the repo (`c-hr/2026/standard` fwd, 496 km); the US C-HR is AWD only ("both SE and XSE standard with electronic all-wheel drive"). Toyota Canada states "total capacity of 77 kWh"; Toyota USA says 74.7. The batch's 71 usable assumes the same pack. See change 7. |
| Chargeprice figures | ✅ Not in the batch. The Chargeprice 2022 records (bZ4X AWD 64 kWh / 147 kW; Solterra AWD 64 / 150 / 6.6 AC) don't reach any 2023-25 car: those cars have no curves and null fields. The 2022 Solterra curve is already excluded from the 2026 Solterra. |

## Per-value results (grouped; every powertrain in the group has the same value)

| Variants | Field | Value | Result | Evidence |
|---|---|---|---|---|
| bZ 2023-25 FWD (7 powertrains: 2023-xle-fwd, 2024 le/limited/xle-fwd, 2025 le/limited/xle-fwd) | gross | 71.4 manufacturer | ✅ | InsideEVs: "FWD: 71.4 kWh battery (total capacity), charging at up to 150 kW"; EV Pulse "front-drive bZ4Xs have a 71.4-kWh pack". |
| same | usable | 64 estimated | ✅ value / ❌ cite | The cited EV Database 1565 is the **AWD** page ("Drivetrain AWD", 71.4 / 64.0). The FWD page (ev-database 1564) returned 429, so I could not read it. A search snippet shows 64.0 for the FWD, and EVKX and Zecar also say 64. Cite 1564. ArenaEV's 60.6 and Nyland's 57.7-60.8 (in the notes) are lower, so keep `low_confidence`. |
| same | chemistry | nmc manufacturer | ✅ | Autopian: "two different nickel-manganese-cobalt (NMC) battery packs". |
| same | voltage class | 400v estimated | ✅ | EV Database: "355 V"; InsideEVs: "400-volt electrical architecture". |
| same | dc_max | 150 | ✅ | InsideEVs: FWD "charging at up to 150 kW". The note cites "Toyota Canada FAQ 28 min", which is the 2026 bZ, not the 2023-25 car (the quote itself is not needed). |
| same | ac_max | 6.6 estimated | ❌ | See change 4. |
| same | preconditioning | none estimated | ⚠ | See the table above. |
| same | charge_port | ccs1 | ✅ | Toyota CA: "MY2023-25 BEV drivers will need an CCS1 to J3400 adapter"; Toyota USA: the same with "CCS". Both markets cited. |
| same | supercharger | via_adapter | ✅ | Toyota CA: adaptor "designed exclusively for 2025 and earlier Toyota BEV models"; Toyota USA free adapter letter, MY2023-25. Both markets cited. |
| bZ 2023-25 AWD (9: 2023-limited-awd, 2023-xle, 2024-limited/xle-awd, 2025 le/limited/nightshade/xle-tech/xle-awd) | gross | 72.8 manufacturer | ✅ | InsideEVs: "AWD: 72.8 kWh battery (total capacity)"; Autopian: AWD "72.8-kWh CATL pack"; EV Pulse 2024: "72.8-kWh battery pack". EV Database lists 71.4 for the AWD, which conflicts; not flagged because three sources agree. |
| same | usable | 61 estimated | ❌ | See change 2. |
| same | chemistry | nmc estimated | ✅ | Autopian "both NMC" plus 96 cells at 355.2 V (EV Specs). |
| same | voltage class | 400v estimated | ✅ | EV Specs 355.2 V. |
| 2023 AWD (2023-limited-awd, 2023-xle) | dc_max | 100 manufacturer | ✅ | InsideEVs: "AWD ... charging at up to 100 kW", measured peak 88 kW. |
| 2024-25 AWD (7 powertrains) | dc_max | 150 manufacturer | ✅ | InsideEVs (760604): "raised ... to 150 kW for the 2024 model year"; EV Pulse "from just 100 kW to ... 150". 2025 is not separately stated, but "2024 onward" is implied. |
| bZ 2023-25 AWD (9) | ac_max | 6.6 estimated | ❌ | See change 4. EV Pulse's 2024 AWD page says 7.6 kW. |
| bZ 2023-25 AWD (9) | preconditioning / port / supercharger | none / ccs1 / via_adapter | ⚠ / ✅ / ✅ | As for the FWD rows. The Canadian cars (2023-xle, 2024-xle-awd, 2025-le-awd, 2025-xle-awd-tech) have Canadian sources. |
| 2026-limited-fwd, 2026-xle-plus-fwd, 2027-xle-awd (2026 and 2027 cars), 2027-limited-fwd, 2027-xle-plus-fwd | gross | 74.7 manufacturer | ✅ (2026) / ⚠ (2027) | Toyota USA 2026: "74.7-kWh ... XLE FWD Plus ... XLE AWD and Limited (FWD/AWD)". The 2027 rows cite the 2026 release. A 2027 release exists (Toyota USA "Everyday Electric Confidence Returns for 2027 with Toyota bZ", 236 mi for XLE FWD 57.7) and should be cited. |
| same | usable | 71 estimated | ✅ / ⚠ | EV Database 3401: "71.0". |
| same | chemistry | nmc **manufacturer** | 🏷 | Autopian says the larger pack "retains the same chemistry and cells as the previous version". It never says "NMC" for the 74.7. That is an inference, so label `estimated`, or cite GreenCars' explicit NMC. |
| same | voltage class | 400v manufacturer | ✅ | Autopian "355V to 391V"; InsideEVs "400-volt". The Autopian page has no "400-volt" phrase, so add InsideEVs as a second cite. |
| same | preconditioning | automatic_and_manual manufacturer | ✅ | Toyota USA: "A new battery pre-conditioning function is also equipped on all models", manually or navigation destination. |
| same | dc_max | 150 manufacturer | ✅ | InsideEVs: "still capped at 150 kilowatts". Model-level, not per pack. |
| same | ac_max 11, 10-80 30, port nacs | | ✅ | Toyota USA: "11-kW ... (up from 7-kW ...)", "around 30 minutes", "NACS charging port". |
| same | supercharger yes | manufacturer | ✅ | Toyota USA: "more than 25,000 plugs ... through the Tesla Supercharger Network". |
| 2026-xle-fwd, 2027-xle-fwd | gross | 57.7 manufacturer | ✅ pack / ❌ vs crosswalk | Toyota USA: "57.7-kWh battery ... XLE FWD". See change 1. |
| same | usable | 54 estimated | ✅ | EV Database 3133: "Usable 54.0". |
| same | chemistry | nmc estimated | ⚠ | See the table above and change 6. |
| same | dc_max | 150 estimated | ✅ | EV Database 3133 says "150 kW DC maximum", and InsideEVs gives the 150 cap. Better to cite EV Database as the source. |
| same | voltage class | 400v manufacturer | ✅ | 288.6 V (Autopian), "289 V (400 V architecture)" (EV Database). |
| 2026-standard (CA) | usable 54, chemistry, dc_max | | ✅ / ⚠ | As above; existing gross is 57.7 (consistent). |
| 2026-awd (CA), 2026-limited-awd (CA+US), 2026-woodland-awd, woodland AT (CA) | usable | 71 estimated | ⚠ | Existing Canadian gross is 77 kWh (Toyota Canada), not 74.7, so "same pack" is unproven. The difference from 74.7 is under 5 %. See change 7. |
| 2026-limited-awd, woodland-awd | charge_port | nacs | ✅ | Toyota CA: "2026 BEVs come equipped with a NACS charging connector". The batch cites the US page for `limited-awd` and the Canada Woodland release for Woodland. |
| 2026-limited-awd (CA+US) | supercharger | yes manufacturer | ⚠ | Only the US page is cited. Add Toyota CA: "Toyota BEV drivers are now able to enjoy charging through the Tesla Supercharger Network" (`src-toyota-ca-media-bz-onsale-2026`). |
| woodland-awd, woodland AT | supercharger | yes estimated | ⚠ | No Toyota page names the Woodland. The basis (native NACS port plus lineup-wide access) is reasonable. The `source_id` is the US page for a Canada-listed car; add the Canada source as a second entry. |
| C-HR 2026-awd, 2026-standard, 2027-se | usable | 71 estimated | ✅ (US) / ⚠ (CA) | InsideEVs C-HR review: "gets 74.7 kilowatt hours of battery capacity, the same as the new bZ". The Toyota Canada C-HR says 77 kWh (see change 7). C-HR AWD uses 87+167 kW motors per EPA; the bZ AWD has 87+167 kW, so the AWD sibling match holds. The CA FWD SE has 167 kW like the bZ FWD. |
| C-HR 2027-se | dc_max | 150 manufacturer | ✅ | InsideEVs C-HR review: "can pull 150 kilowatts of maximum power" (measured 135 kW). |
| C-HR 2027-se | preconditioning, ac, 10-80, port | | ✅ | Toyota USA C-HR 2027: manual in settings or automatic when a fast charger is the navigation destination (needs Drive Connect). 11 kW, about 30 min, NACS. |
| C-HR (3) | supercharger | yes estimated | ⚠ | As for the Woodland. |
| Solterra 2023-25 (8 powertrains) | gross | 72.8 manufacturer | ✅ | InsideEVs: "72.8-kWh battery (CATL's lithium-ion cells)". |
| same | usable | 61 estimated | ❌ | See change 2. |
| same | dc_max 2023 | 100 manufacturer | ✅ | InsideEVs: "accept only 100 kW". |
| same | dc_max 2024 / 2025 | 150 estimated | ⚠ / ✅ | 2025: EV Specs "150 kW" for MY25. 2024: EV Specs says 100 kW. The sibling Toyota AWD was raised to 150 for the 2024 model year. |
| same | ac_max | 6.6 **manufacturer** | 🏷 / ❌ | The page is a 2023 InsideEVs article that says "6.6 kW onboard charger", not a Subaru statement. It is reused for 2024-25 with no year-specific source, and EV Specs says 6.7 / 7 kW. See change 4. |
| same | published_10_80 | 35 manufacturer | ✅ | Subaru 2025 kit: "10% to 80% in as little as 35 minutes". The 2024 car's value is not separately verified, but the note says the 2024 release is the same. |
| same | preconditioning | none estimated | ⚠ | The cited Subaru 2026 release says "newly added battery preconditioning system", which supports `none` for earlier years by implication. The note also admits the 2024 "uprated battery conditioning system". |
| same | charge_port | ccs1 estimated | ✅ | Subaru Oct 2025: "Genuine Subaru Accessory Fast Charging Adapter (NACS) for 2023-2025 Solterra" and "2026 ... equipped with ... NACS port". |
| same | supercharger | via_adapter | ✅ | Subaru and Drive Tesla Canada: 2023-2025 owners buy the NACS adapter; "more than 25,000 Tesla Superchargers" in "Canada and the U.S.". CA car (`2023-solterra-awd` etc.) covered. |
| Solterra 2026-awd (CA) | usable 71, chemistry nmc | estimated | ⚠ | Existing gross is 77 (Subaru Canada) vs 74.7 (USA). See change 7. |
| Solterra 2027 limited / premium | gross 74.7, dc 150, ac 11, 10-80 28, port nacs | manufacturer | ✅ | Subaru 2027 kit: "74.7-kWh", "up to 150 kW", "about 28 minutes", "uprated 11kW onboard charger", "NACS charging port". |
| same | preconditioning | automatic_and_manual manufacturer | 🏷 | The 2027 kit only says "battery preconditioning system". The navigation trigger comes from the 2026 release (cited in the note). A combination of two sources must be `estimated` with both named. |
| same | supercharger | yes manufacturer | ✅ value | The cited source is the 2026 release ("15,000"); the 2027 kit says "access to more than 25,000 stations". Cite the kit. |
| same | voltage class | 400v manufacturer | ⚠ | Cites `src-insideevs-solterra-nacs-test-2026` (testing_org), which says "74.7 kWh, 400 V" per the repo note. Acceptable. |

## Required changes

1. **Blocker: `toyota/bz/2026-xle-fwd`, `2027-xle-fwd`, `2026-xle-plus-fwd`, `2027-xle-plus-fwd` (and the 2026 Limited FWD rating).**
   - Toyota says XLE FWD = 57.7 kWh, 235-236 mi; XLE FWD Plus = 74.7 kWh, 314 mi. The batch matches that.
   - `crosswalk/crosswalk.csv` maps EPA #50042 (191 Ah, 314 mi) to `xle-fwd`, and #49983 (200 Ah, 236 mi) to `xle-plus-fwd`. Both are the 2027 pair too (#50864, #50863).
   - After apply, the 57.7 kWh car would show a 505 km range and the 74.7 kWh car 380 km. Both are impossible. The EPA kWh/100 mi figures confirm it (25.5 for the 314 mi row, 25.8 for the 236 mi row).
   - Owner or crosswalk owner: swap those four crosswalk rows (191 Ah → `xle-plus-fwd`, 200 Ah → `xle-fwd`) before applying, or hold these four powertrains.
   - `2026/limited-fwd` is linked to #49984 (200 Ah, 296 mi). Toyota's Limited FWD is 74.7 kWh at 299 mi, which is #50043 (191 Ah). The batch pack is right for Limited FWD; the EPA link should be reviewed (a 200 Ah Limited with 296 mi has no Toyota counterpart).
2. **Drop or relabel `battery.capacity_usable_kwh` = 61 for all 17 AWD/Solterra powertrains (bZ 2023-25 AWD ×9, Solterra 2023-25 ×8).**
   - The Out of Spec page states "Total energy delivered: 61 kWh" at the charger over 0-99 %. That is not usable capacity: charger-side energy includes losses, so true usable is lower.
   - It contradicts the batch's own 64 for the 71.4 kWh pack, since a larger pack at the same buffer would be about 65.
   - The test is a 2022 car. The page states no usable figure, so rule 5 (the page must state the figure) is not met.
   - A value that is honest about this needs either an owner decision on a proxy, or a source that states usable for the CATL 72.8 pack. Do not apply 61 as is. If the owner wants a number anyway, keep `estimated` and `low_confidence` and say "charger-side energy, upper bound".
3. **bZ 2023-25 FWD usable 64 (7 powertrains):** change `source_id` from `src-r19-evdb-bz4x-awd-1565` (the AWD page) to the FWD page (ev-database 1564) with its own source entry. Keep `estimated` and `low_confidence`.
4. **ac_max_kw for all 2023-25 bZ and Solterra powertrains:**
   - The sources conflict: 6.6 (InsideEVs 2022 test, EV Database), 7 (Toyota USA: "up from 7-kW ... on the prior model"; EV Specs Solterra 6.7 / 7), 7.6 (EV Pulse, 2024 AWD).
   - Pick one value per year and state the conflict, or ask the owner. Toyota's statement about the 2025 car (the "prior model") is the only manufacturer figure and says 7.
   - For Solterra 2024-25, `kind: manufacturer` from a 2023 InsideEVs article is a mislabel. Use `estimated`, or cite a year-specific source.
5. **Supercharger access market sources:**
   - `toyota/bz/2026-limited-awd` (CA+US): add Toyota Canada's page as a second entry.
   - `toyota/bz/2026-woodland-awd`, `-all-terrain-tire` and C-HR `2026-awd`, `2026-standard` (CA): add `src-toyota-ca-media-bz-onsale-2026` as a Canadian source entry. The values stay `estimated`.
6. **Chemistry labels:**
   - For 2026-27 74.7 kWh powertrains cited as `manufacturer` to Autopian ("retains the same chemistry and cells"), label `estimated`, or cite GreenCars ("no change to the cell chemistry", per the batch note) as a second source.
   - For the 57.7 kWh pack (`2026-xle-fwd`, `2027-xle-fwd`, `2026-standard`): add EV Database 3133 as the cited source for NMC (the page says "NMC cathode"). Autopian never states chemistry for this pack. Note: no manufacturer page states 57.7 chemistry, and EVKX reportedly shows LFP on one page (the note says unverified).
7. **Canada-listed 2026 cars with the 77 kWh gross (`toyota/bz/2026-awd`, `2026-limited-awd`, both Woodland, C-HR 2026-awd/standard, `subaru/solterra/2026-awd`):** the 71 usable assumes the same pack as the 74.7 kWh US car. Toyota Canada and Subaru Canada both state 77 kWh, so the match is unproven. Keep `low_confidence`, and say in the notes that 71 is for the 74.7 kWh pack and may be about 3 % low if the pack really is 77 kWh.
8. **Solterra 2027 preconditioning:** change `kind` to `estimated`, naming the 2027 press kit and the 2026 release (rule 6).
9. **Source/quote corrections (no value change):**
   - Remove the `"select models only"` quote attributed to Toyota Canada (it is not on `toyota.ca/en/electrified/electric-vehicle-charging/`). The 2023-25 `none` note cites it.
   - The "Toyota Canada FAQ ... 28 minutes" note under 2023-25 `dc_max_kw` is about the 2026 bZ.
   - Cite the 2027 bZ release for the four 2027 powertrains; cite the Subaru 2027 kit for the 2027 Solterra supercharger entry.
   - Source `src-r19-evpulse-bz4x-2024` is declared but not used by any entry. Cite it for the 2024 AWD dc_max and AC, or drop it.
10. **Preconditioning `none` for 2023-25 (all powertrains):** acceptable as `estimated`, but mark 2025 as the weakest in the notes (it already does). Also name Subaru's "uprated battery conditioning system" (2025 kit) and the Toyota 2024 battery-heating valve (EV Pulse) as counter-evidence, so the owner can see it.

## Checks not run or limited

- EV Database 1564 (bZ4X FWD MY22-24) returned HTTP 429, so its table was not read. The 64.0 figure rests on a search snippet plus EVKX and Zecar.
- No curves in this batch, so rules 8, 9 and 13 do not apply.
- Wheels and heat pump are out of scope for this round (researcher file line 24).
- 2025 North America preconditioning could not be confirmed on any page.

## Applied by the researcher (2026-11-19, revision)

`add-facts --check` passes (491 variants, 363 sources after applying). Scratch script: `gen-toyota.cjs` (scratchpad). `crosswalk/` untouched.

- Change 1 (crosswalk Ah mapping swap): not changed, owner's decision. Batch keeps Toyota's trim-to-pack assignment (XLE FWD 57.7, XLE FWD Plus 74.7).
- Change 2 (usable of the 72.8 kWh pack, 9 bZ AWD + 8 Solterra): 61 dropped. Searched for a usable figure (auto-data, ArenaEV, Subaru UK FAQ, FleetNews 403, search): none states usable for 72.8. Now 65.3 kWh `estimated`, low_confidence, basis 64/71.4 ratio (EV Database 1565) x 72.8. Note records that the Out of Spec 61 kWh charger-side figure is below it (uncertain start state).
- Change 3 (FWD usable 64): now cites new source `src-r19-evdb-bz4x-fwd-1564` (page returned 429; value from snippet, said so in the source note) plus the AWD page 1565 as supporting cite.
- Change 4 (AC): all 2023-25 bZ and Solterra now 7 kW `estimated` citing Toyota's 2026 release ("up from 7-kW"); 6.6 / 6.7 / 7.6 conflicts in the notes; Solterra "manufacturer 6.6" mislabel removed.
- Change 5: Toyota Canada source added for 2026-limited-awd (manufacturer), both Woodland and C-HR 2026-awd / 2026-standard (estimated).
- Change 6: 74.7 kWh chemistry now cites GreenCars (manufacturer, relayed) plus Autopian as `estimated`; InsideEVs added to the 400 V entries. 57.7 kWh chemistry cites EV Database 3133 and GreenCars as `estimated`; 57.7 DC peak cites EV Database 3133 first.
- Change 7: the 77 kWh caveat added to usable notes on 7 Canada-listed powertrains.
- Change 8: Solterra 2027 preconditioning relabelled `estimated`, both sources named.
- Change 9: "select models only" quote and "Toyota Canada FAQ 28 min" removed; 2027 bZ release (`src-r19-toyota-us-bz-2027`) cited on the four 2027 powertrains (gross, port, 10-80); Subaru 2027 kit cited first for the 2027 Solterra Supercharger entry; EV Pulse source now used (2024 AWD dc_max).
- Change 10: preconditioning `none` notes now name the Subaru "uprated battery conditioning system" and EV Pulse battery-heating valve as counter-evidence.
- C-HR rows (`2026-awd`, `2026-standard`, `2027-se`): all required fields are covered by the batch plus existing data (usable, chemistry, voltage, Supercharger access added; 2027-se has the full set). Remaining weaker points: usable 71 for the Canadian 77 kWh listing; Supercharger access estimated (no Toyota page names the C-HR; the 2027 C-HR release mentions only "thousands of public high-speed charging stations").
