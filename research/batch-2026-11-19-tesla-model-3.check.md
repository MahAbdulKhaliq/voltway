# Check: research/batch-2026-11-19-tesla-model-3.json

**Verdict: FIX.** The structure is sound and `add-facts --check` passes (490 variants, 171 sources). Every one of the 39 powertrains has all eight required fields, except the three 2026 powertrains that only lacked preconditioning. The pack, DC and chemistry figures match the pages cited. Several values need changes, mostly on the 2026-27 cars and on AC power.

Tesla's service manual page fetched fine (only the owner's manual is blocked). Tesla owner's-manual pages returned 403/404 and I did not work around that.

## Results by powertrain

| Powertrain (cars) | Field | Value | Result | Evidence |
|---|---|---|---|---|
| 2017/2018/2019/2020 Long Range, LR AWD, 2018-20 Performance | gross, usable, chemistry, voltage class | 78.8 / 73.5 / NCA / 400 V | ✅ (low conf) | EVDB 1138: "78.8 kWh nominal, 73.5 kWh usable (estimate)", NCA, 357 V. evspecs 2018 gives 77.8 (1.3 % off) and the 80.5 EPA figure is 2.2 % off, so the spread is small. The usable value is EVDB's own estimate and is labelled low confidence. |
| same | dc_max_kw | 250 | ✅ | evspecs 2018 LR AWD: "250 kW (DC, 350 V)"; EVDB 250 kW. |
| 2018-2020 Performance | all pack fields | same pack as LR | ✅ estimated | Estimated label and basis are fair. Existing EPA/NRCan range is 499 km for both trims in 2018 and 2019. 2020 Performance is 518 km, equal to 2020 LR AWD. |
| 2017/18/19/20 LR, LR AWD | ac_max_kw | 11.5 | ✅ | Service manual: "accepts up to 48A when equipped with the Long Range Battery… about 11 kW". 48 A x 240 V = 11.5 kW, which is 4.5 % off the page's "about 11". |
| 2018-20 Performance, 2021-23 Performance | ac_max_kw | 11.5, `manufacturer` | 🏷 | The manual names only the Long Range battery, not Performance. The value should be `estimated` (Performance on the LR pack). |
| 2018 Mid Range, 2019 Mid Range | gross, usable, chemistry, DC | 65 / 62.5 / NCA / 200 | ✅ | evspecs comparison: "65 kWh total, 62.5 kWh usable, NCA, DC up to 200 kW". Only evspecs supports this, so low confidence is right. ArenaEV is quoted in the notes but is not a cited source (not checked). |
| 2018/2019 Mid Range | ac_max_kw | 11.5 | ❌ | The manual ties 48 A to the Long Range battery. evspecs lists 1.44/5.76/9.6/11.5 kW for this car, so it does not settle the question. The batch applies 7.7 kW to every other non-LR pack and 11.5 here, with no basis. |
| 2018/2019 Mid Range | volt class | 400 V | ✅ estimated | evspecs: 360 V. Same cell family. |
| 2019/2020 SR+ | gross 53.1, usable 49.0, NCA, 400 V | | ✅ | EVDB 1177: "53.1 kWh nominal, 49.0 kWh usable, NCA". evspecs 2020: 52.4 kWh, 1.3 % off. |
| 2019/2020 SR+ | dc_max_kw | 170 | ✅ | CleanTechnica: software 2019.36.1 "increases the peak supercharging power for Model 3 SR+ to 170kW", up from about 100-105 kW. Cars before that update peaked lower, so 170 holds only for updated cars. |
| 2019/2020 SR+, SR | ac_max_kw | 7.7, `estimated` | ⚠ | The manual says "In 240V outlets, the maximum charge rate is 32A, or about 7.7 kW". That is the Mobile Connector limit, and "48A ... Long Range Battery" only implies a lower limit for other packs. EVDB, evspecs and Basenor give 11 kW or 11.5 kW. 7.7 is a reasoned estimate, not a stated figure. Acceptable as `estimated, low_confidence`, but say so in the notes. |
| 2019/2020 Standard Range | usable 49.0 | | ❌ | CleanTechnica says the SR is a "software-limited pack" and charging to 100 % is "~92% of the real pack". The pack is the same as the SR+, but its usable energy is about 45 kWh (49 x 220/240), not 49. The gross 53.1 is fine. |
| 2019/2020 Standard Range | dc_max_kw | 170 | ⚠ | The article gives no charging power. "Same hardware as SR+" is plausible but unproven for a software-limited car. Keep as `estimated`, `low_confidence`. |
| 2021 SR+ (CA) | 55 / 51 / NCA / 170 | | ✅ | EVDB 1485: "55.0 kWh nominal and 51.0 kWh usable", "Panasonic 2170L", "E1LR … produced in Fremont". The existing NRCan 2021 SR+ range is 423 km, equal to the 263 mi Fremont NCA rating. LFP RWD cars rate 438 km. That supports Fremont NCA, not the CATL car. |
| 2021 LR AWD (CA/US) | 82 / 76 / NCA / 250 | | ✅ | EVDB 1525: "82.0 kWh nominal, 76.0 kWh usable", variant E3LD, May-Dec 2021. evspecs 2021 NA entry: 82.1 kWh. The page warns of an LG pack in some markets. |
| 2021 Performance, 2022 LR AWD, 2022 Performance, 2023 Performance | same 82 / 76 | | ✅ (low conf) | Estimated from the 2021 Fremont car. Existing ranges are 507 km for Performance 2021-23, 568 to 576 km for LR AWD 2021-22, and the pack is unchanged. Wikipedia: Fremont cells are Panasonic NCA. |
| 2023 LR AWD (CA/US merged variant) | 82 / 76 / NCA | | ⚠ | Existing NRCan/EPA range drops 576 to 536 km (-7 %) from 2022 to 2023, while Performance stays at 507 km. That fits a pack or rating change, so "nothing shows a change" is not proven. The batch notes admit "Not verified for North America". The merged variant also lists CA, while a separate 2023 CA-only variant is given the LG 78.1 pack. Either confirm Fremont 2023 or mark it unproven. |
| 2023 LR AWD CA | 78.1 / 75 / NMC / 250 | | ✅ | EVDB 1591: "78.1 kWh nominal; 75.0 kWh usable (estimated)", NMC, LG 5L, 250 kW. |
| 2022/2023 RWD, 2024 RWD (CA, US) | 60 / 57 / LFP / 170 | | ✅ (low conf) | EVDB 1555: "60.0 kWh nominal and 57.0 kWh usable (both estimates)", LFP, "170 kW (estimated)". evspecs 2023 RWD: 62 kWh, LFP, 170 kW, 345 V. Existing 2022-24 range is 438 km in all three years, so the pack looks unchanged. The 2026 Premium-I (the same Highland LFP RWD) has 60/57/170 in OpenEV. |
| 2022/2023/2024 RWD, 2024 RWD CA | ac_max_kw | 7.7 | ❌ | Basenor covers "legacy" 2017-2023 cars and gives no AC figure for this trim in the text I read. Wikipedia's 7.6 kW (32 A) is for the old RWD. Existing OpenEV data for the 2026 Premium-I (the same Highland LFP RWD car) says 11 kW. Reconcile; 7.7 for the 2024 Highland RWD is 30 % below the repo's own value for the same hardware. |
| 2024 LR AWD (CA, US, -e, -ca), 2025 LR AWD, 2024 LR RWD (2024 US, 2025 CA/US) | 78.1 / 75 / NMC / 250 | | ✅ | EVDB 3034 (LR RWD Highland, Oct 2024-Oct 2025): "78.1 kWh nominal, 75.0 kWh usable", NMC, LG 5L, 250 kW. EVDB 2188 (Performance) gives the same pack. Wikipedia: Premium RWD and AWD at 78.1 kWh. AWD figures are estimated from the RWD page (same pack family). Fine for 2024-25. |
| 2023 LR AWD CA, 2024 LR AWD, 2025 LR AWD, Performance 2024+, Premium 2027 | ac_max_kw | 11.5, `estimated` | ✅ (minor) | The Wikipedia infobox gives 11.5 kW (48 A) for LR. The body text says "onboard AC/DC converter is 11 kW", EVDB says 11 kW, and OpenEV says 11 kW on 2026 cars. 4.5 % difference, so it passes. Using 11 would match the repo. |
| 2026-performance (2024, 2025, CA 2026, US 2027 Performance) | usable 75, gross 78.1 | | ❌ | The existing OpenEV values on 2026/performance (CA) are 82 / 79. The 75 is 5.1 % off the existing 79 and 78.1 is 4.8 % off the existing 82. EVDB 3841 (the 2026 Performance): "82.0 kWh nominal, 79.0 kWh usable, LG 5M NMC", 250 kW, 11 kW AC. The EVDB 2188 page the batch cites covers Apr 2024-Oct 2025 only. Existing range also changes: 478 km (2024-25), 497 km (2026 CA), 508.6 km (2027 US). **Split the powertrain** (see below). |
| 2026-performance | chem NMC, 400 V, DC 250 | | ✅ | EVDB 2188 and 3841 both: NMC, 250 kW. OpenEV agrees. |
| 2027 Premium AWD (US) | 78.1 / 75 | | ❌ | The existing 2026 Premium AWD-I (same trim line) is 82 / 79 (OpenEV). The batch's own notes mention that the 82/79 LG 5M pack came to Europe from Dec 2025. 5 % off the existing value, and KBB's 75 kWh (a "battery capacity" line, with no usable/gross label) does not settle it. |
| 2027 Premium RWD (US) | 78.1 / 75 | ⚠ | Range 584 km equals the LR RWD, which supports the LR RWD pack. But the 2026 Premium-I / "Premium RWD" (OpenEV, LFP 60/57, 463 km) is a different car with the same US trim name. The mapping of the 2027 car to the LR RWD pack is unproven. |
| 2026 Standard (US), 2027 RWD (US) | gross 69 | | ✅ (low conf) | ArenaEV: "69 kWh total", "Liquid-cooled Li-ion LFP battery (400V type)". The batch's other cited sources show 69.5 usable and 64 usable, so the numbers conflict (see below). |
| 2026 Standard, 2027 RWD | usable 64, `estimated` | | 🏷 | Electra states "about 64 kWh usable" for the Standard (French listing, "Tesla does not disclose the exact battery capacity"). That is a stated third-party figure, not an estimate from a named relative. Use `community`, low_confidence. The 69.5 figure was not opened by the researcher, so I did not verify it. |
| 2026 Standard, 2027 RWD | dc_max_kw 225 | | ✅ (conflict) | InsideEVs: "225 kW maximum input… 250 for the rest of the lineup". ArenaEV: 225 kW (US-labelled listing). Electra: 175 kW and EU lists 170 kW, but those are the European car. Keep 225 for US and note the conflict. |
| 2026 Standard, 2027 RWD | ac_max_kw 7.7 | | ❌ | Basenor is legacy 2017-2023 only. ArenaEV lists 11 kW (EU) and OpenEV has 11 kW on the 2026 Premium-I. The basis does not cover a 2026 car. |
| 2026-performance-awd, 2026-premium-awd-i, 2026-premium-i | preconditioning only | automatic_with_navigation, estimated | ✅ (nav half) | See the preconditioning section. |
| All 39 powertrains | charge_port nacs, supercharger_access yes | | ✅ | Wikipedia NACS: used "on all subsequent vehicles, including the Model X, Model 3, Model Y, and Cybertruck"; the Supercharger network "remains backward compatible with both". General statement, so a Canadian car is not separately covered, but it applies to both markets (low confidence, community). |

## Preconditioning, per year

- **What the sources show:** the navigation trigger. notateslaapp 2020.24.6.4: "precondition the battery when navigating to third party fast charging stations". 2025.2.3 says preconditioning "will start automatically when needed" once a charger is the destination. 2024.2.6 shows a "preconditioning for faster charging" message. The Tesla manual text in search results says "When using Trip Planner or navigating to a Supercharger station, your vehicle automatically prepares the Battery".
- **Manual control:** I found no readable page that shows a manual "Precondition" for Supercharging on the charging screen or in the app, or the software version that added one. The Tesla owner's manual returns 403/404. The search results show only scheduled departure preconditioning, which is cabin preheating and not battery. A reminder message (not a manual control) was added to the car's navigation. The batch's `automatic_with_navigation` is the only value the sources support, for every year 2017-2027.
- **Per year:**
  - 2017-2019 cars: the cited note is from 2020 and refers to third-party chargers. Existing evidence that these cars got on-route warmup by OTA update is the "in addition to Superchargers" wording. Keep `automatic_with_navigation`, estimated, low confidence.
  - 2020-2023: same.
  - 2024-2027 (Highland): same. The Tesla manual in the search results is a 2025.44 build and describes nav only.
  - A manual control, if confirmed, would make 2024+ `automatic_and_manual`. This cannot be sourced now, and the batch should not guess it.
- **Label:** `estimated` for the lineup-wide software feature is allowed. Add a sentence that the owner's manual was blocked and a manual control was neither confirmed nor ruled out. The batch's notes already say the page is "silent rather than a denial".

## Fit with existing data

- `2026/performance` (CA): OpenEV 82 gross / 79 usable / 11 kW vs the batch 78.1 / 75 / 11.5 (usable -5.1 %).
- `2026/premium-awd-i`: OpenEV 82 / 79 vs the batch's 2027 Premium AWD at 78.1 / 75.
- `2026/premium-i` (Highland LFP RWD): OpenEV AC 11 kW vs the batch's 7.7 on the 2024 RWD and 2026/27 Standard cars.
- Existing curves: none for these cars are touched by this batch.

## Required changes

1. **Split `tesla/model-3/2026-performance`.** Keep 2024 and 2025 Performance (CA/US) at 78.1 / 75 from EVDB 2188. For the 2026 CA and 2027 US Performance cars, drop the 78.1 / 75 and leave the existing OpenEV 82 / 79 (or add EVDB 3841 for 82 / 79 NMC 250 kW 11 kW AC with the 2026 range change as the basis).
2. **`2027-premium-awd` usable and gross:** change to 79 / 82 estimated from the same trim line (existing 2026 Premium AWD-I). If 78.1 / 75 stays, say why it overrides the repo's value. Re-check `2027-premium-rwd`, since the US trim name "Premium RWD" also maps to the LFP 60/57 Premium-I car; confirm which pack the 2027 car has.
3. **`ac_max_kw` 7.7 on `2024-rwd`, `2024-rwd-ca`, `2026-standard`, `2027-rwd`:** replace or justify. Basenor is a legacy-car page, and the repo's 2026 Premium-I (same hardware) says 11 kW. For 2022/2023 RWD keep 7.7 only as a low-confidence estimate with the Wikipedia 7.6 kW (32 A) figure as the stated basis.
4. **`ac_max_kw` for `2018-mid-range` and `2019-mid-range`:** the 11.5 conflicts with the manual's "Long Range battery" rule. Use one basis for all non-LR packs (7.7 estimated, low confidence) or find a source that gives a Mid Range AC figure.
5. **Performance `ac_max_kw` (2018-2023):** relabel `kind` from `manufacturer` to `estimated`; the manual says "Long Range Battery", not Performance.
6. **`2019-standard-range`, `2020-standard-range` usable:** the source says the pack is limited to about 92 %. Change 49.0 to about 45 (49.0 x 220/240), or state that 49 is the SR+ number for the same physical pack.
7. **`2026-standard`, `2027-rwd` usable 64:** relabel from `estimated` to `community` (Electra states "about 64 kWh usable"). Note the 69.5 conflict as unverified.
8. **`2023-long-range-awd` (CA/US):** the range drop 576 to 536 km means "no change" is not shown. Either find a 2023 Fremont source for 82 / 76 or mark the CA half unproven. The batch notes already say it is not verified for North America.
9. **Optional:** use 11 kW instead of 11.5 for Highland LR/Performance AC to match OpenEV and EVDB.
10. **Preconditioning notes:** say the manual control was neither found nor ruled out.

## Required fields not filled (item 14)

None, apart from `published_10_80_min` (optional, stated on EVDB 2188 as 27 min and 3841 as 28 min; not added).

## Applied by the researcher (2026-11-19)
1. Mid Range AC: 7.7 kW, estimated (same basis as other non-LR packs).
2. Standard Range usable: 45 kWh, estimated (49.0 x 220/240, CleanTechnica software-lock source); SR 170 kW note now says it is an estimate.
3. 2023 LR AWD: kept 82/76 estimated; notes carry the doubt (range 576 to 536 km, EPA 358 to 333 mi on re-introduction; InsideEVs speculates a different pack, EPA method change the alternative; nothing confirms either).
4. `2026-performance` powertrain kept at 78.1/75 (2024-25). Per-car overrides under `variants` for `2026/performance` (CA) and `2027/performance` (US): 82/79 NMC, 400v, 250 kW, 11 kW (EVDB 3841, estimated). `2027-premium-awd` now 82/79 NMC (EVDB 3405 + OpenEV 2026 Premium AWD-I), estimated. `2027-premium-rwd` stays NMC 78.1/75: range 584 km equals the NMC LR RWD, not the LFP Premium-I (463 km).
5. 2026 Standard usable 64 now `community` (2027 RWD stays estimated, as a carry-over); AC 11 kW estimated on 2026-standard, 2027-rwd, 2024-rwd, 2024-rwd-ca (2022/2023 RWD keep 7.7 with Wikipedia 7.6 kW / 32 A as basis).
6. Performance AC (2018-2023) now `estimated`; Highland LR/Performance AC 11 kW estimated.
7. Preconditioning notes: manual control neither found nor ruled out.
8. `--check` OK (491 variants, 194 sources).
