# Fact-check: batch-2026-11-19-w2-gm-honda.json (62 powertrains, 18 hardware generations)

**Verdict: FIX.** `--check` passes (valid). The Bolt, Spark, Honda, Acura and Optiq generations are mostly sound. There are 4 hard errors (Sierra ER AC, Hummer 2025 SUV 3X pack, EVChargingStations citations, Celestiq/Fit/Spark estimates that break rule 5) and several soft ones.

Pages opened: Wikipedia (Bolt, Hummer, Prologue, Optiq, Spark EV, Sierra EV), The Charge Port (Hummer, Optiq, Sierra, ZDX), InsideEVs 2027 Bolt (775280), ArenaEV Bolt 66, Honda News Fit EV, GM TechLink Hummer. Not re-read: Auto123 and ArenaEV GM adapter news, GreenCarsCompare, Auto-data, KBB, Weekly Driver. All GM, Chevrolet, Cadillac and GMC sites are 403 and were not worked around.

## Table

| Generation / ids | Field | Value | Result | Evidence |
|---|---|---|---|---|
| Bolt 2017-19 | gross 60 | manufacturer | verified | Wikipedia "2017-2019: 60.0 kWh"; the GM TechLink page was not re-read. |
| Bolt 2017-19 | usable 59.1 | estimated | ❌ basis | The ratio comes from the N2.2 pack (66 vs 65), a different chemistry from N2.1. The 65 vs 66 pair is a nominal vs a press-relayed figure, so it is not a usable ratio. Fails rule 5. |
| Bolt EV 2020-23 | gross 66, usable 65 | manufacturer, estimated | ⚠ | Wikipedia: Bolt EV 66, EUV 65. ArenaEV states "66 kWh usable" for the 2019/20 car. The usable 65 comes from a 2022 press figure, so it is mixed. |
| Bolt EUV 2022-23 | gross 66 | manufacturer | ❌ | Wikipedia and InsideEVs both give the EUV pack as 65 kWh. The EUV shares the `bolt2223` generation, so it gets the EV's 66. |
| Bolt 2020-23 | dc 55 | manufacturer | verified | Wikipedia "55 kW maximum". |
| Bolt 2017-21 | ac 7.2 | manufacturer | verified | Wikipedia "up to 7.2 kW". |
| Bolt 2022-23 | ac 11.5 | manufacturer | verified | Wikipedia "upgraded to a maximum rate of 11.5 kW". |
| Bolt 2017-23 | preconditioning `none` | estimated | verified | InsideEVs 775280: "The lack of preconditioning meant charging in the dead of winter took even longer." The source URL ends `/775280/202`, so please confirm it is the canonical slug. |
| Bolt 2027 | 65 kWh LFP, 150 kW, 26 min, NACS | manufacturer | verified | InsideEVs 775280 states each of these. |
| Bolt 2027 | usable 65 | estimated | ⚠ | No page states it. The basis ("GM recommends 100 % charging") is a search excerpt. |
| Spark 2014-16 | gross 21.3 / 19, chemistry, 50 kW, 3.3 kW, CCS1 | manufacturer | verified | Wikipedia: A123 LFP for 2014; LG Chem 19 kWh for 2015-16; CCS Combo 1 at 50 kW; 3.3 kW; no usable figure. |
| Spark 2014 | usable 19 | estimated | ❌ basis | It copies the 2015-16 pack's nominal onto a different pack (LFP 21.3). Fails rule 5. |
| Spark 2015-16 | chemistry `nmc` | estimated | ❌ | Wikipedia says only "lithium-ion". NMC is assumed as typical for the period. |
| Spark | voltage 400v, preconditioning `none` | estimated | ⚠ | `none` rests on the absence of a mention. |
| Fit EV | 20 kWh, 6.6 kW, J1772 | manufacturer | verified | Honda press kit: "Toshiba-produced 20 kWh", "6.6kW on-board charger", "SAE J1772". |
| Fit EV | dc 0 | estimated | verified | The press kit has no DC mention, which matches the brief's `j1772` with 0 kW rule. |
| Fit EV | usable 20 | estimated | ❌ | The basis ("SCiB needs no reserve buffer") is a typical-value argument. |
| Fit EV | voltage 400v | estimated | ❌ | "No 800 V existed" is elimination, not a relative. The press kit gives no pack voltage. |
| Fit EV | preconditioning `none` | estimated | ⚠ | The press kit says "air-cooled" and mentions no heating. The cited "first precond = Prologue" claim is not on the Wikipedia page. |
| Clarity | usable 24.2, 400 V, dc 50 | estimated | ⚠ | The GreenCarsCompare page was not re-read. A page that states the figure for this car is not a "relative" estimate. |
| Clarity | chemistry `nmc` | estimated | ❌ | Honda says only "lithium-ion". NMC is assumed as typical. |
| Clarity | preconditioning `none` | estimated | ⚠ | Absence only. |
| Prologue | 85 kWh, 155 kW, 11.5 kW, auto precond | manufacturer | verified | Wikipedia: "85.0 kWh", "up to 155 kW peak", "11.5 kW onboard", Google Maps "automatically initiate battery preconditioning". |
| Prologue | port `ccs1` | manufacturer | ⚠ | Wikipedia does not name the port. The Charge Port page was not re-read. |
| Prologue | usable 85 | estimated | verified | Matches the Equinox EV records on the same pack (usable 85, gross 89). |
| ZDX | 102 kWh, 190 kW, 11.5 kW, CCS1, adapter since 2025-07 | manufacturer | verified | The Charge Port: "All three charge at up to 190 kW DC", "11.5 kW", "CCS1", "since July 2025". |
| ZDX | usable 100 | estimated | verified | Same 102 kWh pack as the Lyriq, whose records carry usable 100 / gross 102. |
| ZDX | voltage 400v | estimated | ❌ | The cited `src-evcs-2027-lyriq-nacs` is EVChargingStations, which the brief forbids citing. |
| Optiq / Optiq-V | 85 usable, 150 kW, 11.5 kW | manufacturer / estimated | verified | Wikipedia: "85.0 kWh (usable capacity)", 150 kW, 11.5 standard / 19.2 optional. Optiq-V AC and DC are marked estimated, which is right. |
| Optiq / Optiq-V | port `ccs1` 2025-26 | estimated | ⚠ | Wikipedia says CCS1. The Charge Port lists "native NACS" without a year. Leave as estimated and low_confidence. |
| Optiq 2027 | port `nacs` | estimated | ⚠ | The Optiq claim is cited to the Vistiq page. The Charge Port Optiq page says "native NACS" for Optiq and Optiq-V, so cite that page. |
| Vistiq | 102 gross, usable 100, 190 kW, 11.5 kW | manufacturer / estimated | ⚠ | The cited Wikipedia and KBB pages were not re-read, but the pack matches the ZDX and Lyriq. |
| Vistiq | voltage 400v | estimated | ❌ | Cites EVChargingStations. |
| Celestiq | gross 111 | manufacturer | ⚠ | The KBB and Wikipedia pages were not re-read. |
| Celestiq | usable 108.8, voltage 400v, AC 19.2 | estimated | ❌ | A different pack (111 vs 102) and a different charger. The basis is "assumed", "peak is like the Lyriq", and "could be 11.5". Fails rule 5. |
| Celestiq | dc 200 | manufacturer | ⚠ | Wikipedia text says 200, the infobox says 190. Either state the conflict or pick 190. |
| Hummer 2024 2X (both bodies, both `-2`) | 20-module, 170 kWh | estimated | verified | The crosswalk maps the 2X to the EPA "2M20" rows (#48787, 48788, 48789, 48790). Wikipedia: "20-module c. 170 kWh". |
| Hummer 2024 3X (pickup and SUV) | 24-module | | verified | The crosswalk maps the 3X to EPA #46951-46954, with no 2M20 label. GM TechLink: "approximately 200 kWh of available energy". |
| Hummer 24-module | usable 200 and 212.7 | manufacturer + estimated | ⚠ | The two values differ by 6 %. A page that states a figure (Wikipedia 212.7 / 246.8) is not an "estimated" relative. Keep GM's 200 and drop 212.7, or re-label it. |
| Hummer 24-module | dc 350 | manufacturer | verified | GM TechLink "up to 800V/350kW". The Charge Port: only the 24-module option reaches 350. |
| Hummer 2025 2X (4 ids) | 20-module, 300 kW | estimated | verified | The Charge Port: 2X trims "up to 300 kW" (2026 page). No year split is given. |
| Hummer 2025 3X pickup (`3x`, `3x-2`) | 20-module | estimated | verified | NRCan: "HUMMER EV3X Pickup (20M Battery)". The Charge Port: the 3X pickup is 20-module standard, with 24-module a $9,995 option. |
| Hummer 2025 3X SUV (`3x`, `3x-2`) | 20-module | estimated | ❌ unproven | The NRCan SUV 3X row carries no "(20M)" label, unlike the pickup. The Charge Port gives SUV 3X 300 kW but is a 2026 page. The fan-out maps by `id.includes('3x') && y===2024`, so it never separates SUV from pickup. |
| Hummer | AC 19.2, port `ccs1` | manufacturer / estimated | verified | The Charge Port: "up to 19.2 kW (about 80 A)"; "CCS1 port needs an adapter". |
| Hummer | preconditioning `automatic_and_manual` | estimated | ⚠ unverifiable | GM TechLink supports manual (app) only. The automatic half is a search excerpt from chevrolet.com (403). |
| Sierra Std 2026 | 119, 400 V, 220 kW, 11.5 kW | estimated | verified | Matches the Silverado EV 14-module records (usable 119, 400v, 220, 11.5). The Charge Port gives Standard Range AC 11.5. |
| Sierra ER (2025 Denali, 2026 Denali, 2026 Elevation, 2027) | usable 170, 800 V, 300 kW | estimated | verified | Matches the Silverado ER records. |
| Sierra ER | ac 19.2 | estimated | ❌ | The Charge Port: Elevation, Denali and AT4 Extended are 11.5 kW. Only Denali Max (205 kWh) is 19.2. The Silverado LT ER is 11.5 and only the WT ER is 19.2, so the sibling basis does not give 19.2. |
| Sierra 2027 | port `nacs`, supercharger `yes` | estimated | ❌ | Cites `src-evcs-2027-silverado` (EVChargingStations, forbidden). The Charge Port Sierra page says nothing about port or year. |
| Sierra | preconditioning | estimated | ⚠ unverifiable | A lineup-wide software feature, which is allowed, but the cited pages are 403. |
| Cadillac | preconditioning | estimated | ⚠ unverifiable | cadillac.com 403, reproduced from a search excerpt. |
| All CA-market adapter access | `via_adapter` | estimated | ⚠ | The Auto123 and ArenaEV pages were not re-read. The estimate is acknowledged in the notes. |

## Numbered fix list

1. **Sierra ER `ac_max_kw`:** change 19.2 to 11.5 for `2025-denali-extended-range`, `2026-denali-extended-range`, `2026-elevation-extended-range` and `2027-extended-range`. The Charge Port lists Elevation, Denali and AT4 Extended at 11.5 kW, and the Silverado LT ER is also 11.5. 19.2 applies only to the Max Range.
2. **Hummer 2025 SUV 3X** (`gmc/hummer-ev-suv/2025-3x`, `2025-3x-2`): the 20-module mapping is unproven, because the NRCan SUV row has no "(20M)" label. Either find a source for the 2025 SUV 3X pack, or keep the values but make the notes say so and rely on the 2026 Charge Port 300 kW listing. Do not leave `hummer20` applied blindly through `id.includes('3x')`.
3. **Remove every EVChargingStations citation** (`src-evcs-2027-silverado`, `src-evcs-2027-lyriq-nacs`). That covers the Sierra 2027 port and `supercharger_access`, ZDX voltage and Vistiq voltage. Re-source each from allowed pages, or drop the estimate and find another basis.
4. **Celestiq:** usable 108.8, voltage 400v and AC 19.2 are not valid estimates, because the pack differs from the Lyriq and Vistiq and the basis is "assumed" or "could be 11.5". Source them or leave a flagged gap for the owner, and state the 200 vs 190 kW conflict.
5. **Bolt 2017-19 usable 59.1:** the ratio basis crosses a chemistry change (N2.1 to N2.2). Re-source it, or keep it only with an explicit note that the basis is weak.
6. **Bolt EUV gross 66:** Wikipedia and InsideEVs give the EUV pack as 65 kWh. Give the EUV 65, or split it from the EV.
7. **Spark 2014 usable 19:** the basis is a different pack. Re-source it or flag it, and drop the "same range, so same energy" inference.
8. **Spark 2015-16 chemistry `nmc`, Clarity chemistry `nmc`, Fit usable 20, Fit voltage 400v:** these rest on typical values or elimination. Source them or flag them as owner questions.
9. **Hummer 24-module usable:** two values (200 manufacturer, 212.7 estimated) on one field differ by 6 %. Keep GM's 200 and drop 212.7, or relabel it as community.
10. **Optiq-V and Optiq 2027 port:** cite The Charge Port Optiq page ("native NACS") instead of the Vistiq page. Keep `ccs1` for 2025-26 as estimated and low_confidence.
11. **Bolt 2027 usable 65:** the basis is a search excerpt. State the weakness in the notes, or leave it low_confidence.
12. **`none` preconditioning for Spark, Fit and Clarity:** the Wikipedia Prologue page does not say it is Honda's first. Cite the actual statement or add a note that this is an absence of mention. The Bolt `none` is verified.
13. **Source `src-insideevs-2027-bolt-fast-charging`:** the URL ends `/775280/202`. It resolves, but confirm it is the canonical slug.
14. **No-unknowns check:** the 62 powertrains cover usable kWh, chemistry, voltage, DC, AC, port, supercharger access and preconditioning. Nothing is missing except gross (absent for most Ultium and truck packs, not in the gaps list).
