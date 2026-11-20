# Check: research/batch-2026-11-19-bmw-vw.json

**Verdict: FIX.** `--check` passes (490 variants, 172 sources). Most values are right. One systematic error covers every i4 preconditioning entry, and some ID.4 entries need correcting. Nothing here is a REJECT.

I read every cited page except Wikipedia's lines after character 100,000 and the second half of the two BMW newsroom pages. In the BMW US release the passage was found in the first 100k characters; no later text was needed.

## Required changes

1. **All i4 `battery.preconditioning` entries.** 16 i4 powertrains carry `automatic_and_manual`. The 2022 BMW US release gives the navigation trigger: "anticipatory thermal management will automatically pre-condition the battery beforehand". It does not give manual battery control. The "iDrive / My BMW app" sentence reads "A pre-heating and pre-conditioning function is included… This is activated through iDrive, or by smartphone via the My BMW app", and it sits in the cabin and interior air-filter paragraph. It is cabin preheating, which rule 6 excludes. Change to `automatic_with_navigation`.
   - 2022 eDrive40 and 2022 M50 are `manufacturer` (US release). Keep that kind.
   - 2023–2025 eDrive40/xDrive40/M50 and the three 2026 Gran Coupe powertrains are `estimated`. Keep that kind.
   - The two eDrive35 powertrains are `estimated` and are also covered by item 7.
   - Remove the "plus iDrive/My BMW app control" wording from the notes.
2. **ID.4 `dc_max_kw` on `volkswagen/id-4/2026-standard` (CA, US) and `2026-awd` (CA).**
   - The batch gives the 82 kWh 2026 `pro-rwd` 175 kW (estimated).
   - Existing data on `2026-standard` and `2026-awd` is 135 kW (OpenEV, `src-openev-v1-24-0`), which the batch does not touch.
   - Same pack, same model year, different figure.
   - Cars.com gives 175 kW for 2024 AWD as well (82 kWh pack on Pro/Pro S/Pro S Plus, RWD or AWD).
   - Either add a 175 kW estimate for both powertrains with the 135 kW conflict noted, or state why 2026 Standard and AWD differ. The batch is silent on this.
3. **2023 ID.4 82 kWh `dc_max_kw` (170 kW).** The value is supported (InsideEVs: Pro and AWD Pro "170 kW"; SlashGear: 82 kWh pack "up to 170"). Two points need recording:
   - Wikipedia's table gives 2023 AWD as 175 kW.
   - For 2023 RWD it gives 135 kW on LG-built packs. The batch only mentions the LG split in the source notes.
   - Add a note on the entries for `2023-pro`, `2023-pro-s`, `2023-pro-awd` and `2023-pro-s-awd` that RWD cars with LG cells may be 135 kW, and keep `low_confidence`.
   - InsideEVs names only Pro and AWD Pro. Pro S and Pro S AWD rest on SlashGear's pack-level statement.
4. **ID.4 `battery.chemistry` for the 62 kWh pack (`2023-standard`, `2023-s`, `2024-standard-range`, `2025-base`, `2025-limited`).**
   - `2025-base`: the batch has `nmc` as `estimated` from thinkEV's 82 kWh page plus Wikipedia's module count.
   - The 62 kWh pack is a different pack (9 modules against 12). Rule 5 rejects estimates from a different pack.
   - Wikipedia does not state chemistry for any pack. My search found no source for the 62 kWh chemistry, and one EV Database listing for a later 58 kWh usable ID.4 Pure shows LFP (different model year and pack).
   - Find a source that states the 62 kWh chemistry. Otherwise the batch should say plainly that the figure is a low-confidence guess and keep `estimated` with `low_confidence`, or leave it for the owner.
   - Also check the 2023/2024 entries for the same issue. The summary shows the other 62 kWh powertrains carry no chemistry in the batch, so they presumably rely on existing data. Confirm.
5. **ID.4 `battery.preconditioning: none` for 2021–2023 (all `estimated`).**
   - InsideEVs and electrive are both European-sourced with no market stated. electrive's own wording says 3.9.1 covers "models built before October 2023".
   - Rule 5 rejects estimates that rest on differing markets. Either find a North American source or the owner accepts it with `low_confidence` (already set).
   - The 2024 entries use `automatic_and_manual` as `manufacturer` from vw.com. That page says "most 2024 and newer" and shows a 2024 Pro S. electrive says cars built before October 2023 are in the group that lacked it. Some early-build 2024 NA cars may therefore lack it. Keep `low_confidence`.
6. **2021 and 2022 ID.4 `capacity_usable_kwh` 77 (`manufacturer`).** The cited page is the 2023 SlashGear first drive. Strictly this is a different model year (and a different cell supplier: LG in 2021–22, SK On in 2023). Relabel 2021–2022 as `estimated` (basis: same 82 kWh pack), or cite a page for 2021–22. Wikipedia's table says 82/77 for 2021–22, but it is a secondary source.
7. **eDrive35 estimates (`2025-edrive35`; also `2023/2024-edrive35` preconditioning).**
   - Misquote: the batch says EV Database "says it succeeds the eDrive35 sold June 2024 to July 2025 with the same charging figures". The page does not say "same charging". It says only "same acceleration… similar in energy consumption". Fix the note.
   - The 2025 eDrive35 carries 66, 67, 180 kW and 11 kW over from the 2023 car. The basis is same model, same 70.2 kWh pack, no change found, so it is acceptable, but the claim about the EV Database page must go.
   - Preconditioning for the eDrive35 is carried from the eDrive40 (83.9 kWh pack). Rule 5 only allows a different pack when it is a lineup-wide software feature. Say that explicitly in the note, or leave it. No page states it for the eDrive35.
8. **Restore the sentence dropped from `src-bmw-canada-nacs-superchargers-2026-04`.**
   - The old note said "only all-new models sold in Canada from 2026 (iX3, i3) get a built-in NACS port".
   - The page does say that: "All-new BMW models in Canada starting in 2026 will have a built-in NACS port… iX3 and i3".
   - The batch's `charge_port` notes still rely on this claim, but the rewritten source note no longer carries it.
   - Re-add it to the source notes. The new "i4 is not named" is correct.
   - The old "model list seen in a search excerpt" wording was rightly dropped.
9. **`src-thinkev-bmw-i4-2026`** is not rewritten by this batch (0 matches). The only existing source touched besides the BMW Canada one is `src-thinkev-vw-id4-2026`, where only `accessed_on` changed. Nothing lost there.

## Values

| Variant / powertrain | Field | Value | Result | Evidence |
|---|---|---|---|---|
| i4 2022 eDrive40 / M50 | `capacity_usable_kwh` | 81.1 and 81.5 | ✅ | US: "net usable energy content 81.1 kWh". CA: "83.9 kWh gross and 81.5 kWh net". Both BMW. The 0.5 % spread is fine, existing 2026 data is 81.3. |
| i4 2022 | `chemistry` nmc | nmc | ✅ | "The high-voltage NMC-811 batteries" |
| i4 2022 | `nominal_voltage_class` 400v | 400v | ✅ | Voltage 398.5 V. The page doesn't label it nominal; it is 400 V class regardless. |
| i4 2022 | `dc_max_kw` | 200 | ✅ | "up to 200 kW" in BMW US and Canada releases. EVDB/thinkEV say 205 and existing 2026 data says 207 (OpenEV). The gap is 2.5–3.5 %, under 5 %. Note BMW has not published a 205 figure that I could find. |
| i4 2022 | `ac_max_kw` | 11 | ✅ | "AC Level 2 charging of up to 11 kW" |
| i4 2022 | `published_10_80_min` | 31 | ✅ | spec table 31 (DC fast) |
| i4 2022 | `battery.preconditioning` | automatic_and_manual | ❌ | Manual half is cabin only. Change to `automatic_with_navigation`. See item 1. |
| i4 2022 | `charge_port` | ccs1 (estimated) | ✅ | Lectron lists i4 "Model Year 2022 – 2026". thinkEV 2026: "CCS1". |
| i4 2022 | `supercharger_access` | via_adapter | ✅ | BMW CA: "all BEV models will be Supercharger-compatible… must only use the approved Lectron Vortex Plus". i4 not named, hence `low_confidence`. Acceptable. US: InsideEVs names i4 with adapter. |
| i4 2023–2025 eDrive40/xDrive40/M50 | usable, chemistry, voltage, dc, ac | 81.5 / nmc / 400v / 200 / 11 (estimated) | ✅ | Same model and generation, same pack figures from the 2022 releases. The 2026 update page names only SiC inverters, no pack or charger change. 2025 facelift not separately opened; the basis rests on BMW's releases. |
| i4 2023–2025 | `charge_port` / `supercharger_access` | ccs1 / via_adapter | ✅ | Same as 2022. No source shows a native NACS port on any i4. The 2026 update page mentions none; search results show the native NACS port first on the 2026 i5 M60. |
| i4 2023 / 2024 eDrive35 | usable, dc, ac, 10-80 | 66/67, 180, 11, 32 | ✅ | CA: "66 kWh net, 70.2 kWh gross", "180 kW", "11 kW". US: "net usable energy content of 67 kWh", "only 32 minutes". The 66 vs 67 conflict is under 2 %. |
| i4 eDrive35 | chemistry / voltage | nmc / 400v (estimated) | ✅ | auto-data.net: "Li-NMC", 400 V (a community page that states it for this car). |
| i4 eDrive35 (all) | `battery.preconditioning` | automatic_and_manual | ❌ | Manual half unsupported; different pack. See items 1 and 7. |
| i4 2025 eDrive35 (CA) | usable, dc, ac | 66, 67, 180, 11 (estimated) | ⚠ | Basis is sound; the EVDB note misquotes the page. See item 7. |
| i4 2026 Gran Coupe (3 powertrains) | `battery.preconditioning` | automatic_and_manual (estimated) | ❌ | Same as item 1. All other required fields come from existing data. |
| i4 2026 Gran Coupe | existing dc 207, usable 81.3 | untouched | ✅ | Within 5 % of the batch's 200 and 81.5. |
| ID.4 2021–22 82 kWh | `dc_max_kw` | 135 | ⚠ | GCR: "a peak of 135 kw versus the previous 125 kw", OTA "still to come". VW launch release: 125 kW. Recorded as the post-update figure with `low_confidence`. Acceptable. 2021 cars carry the 2022 article. |
| ID.4 2021–22 | `capacity_usable_kwh` | 77 | 🏷 | 2023 page for a 2021–22 car. See item 6. |
| ID.4 2021 | `charge_port` / `ac_max_kw` | ccs1 / 11 | ✅ | ConceptCarz: "equipped with a CCS (Combined Charging System) socket"; "The 11 kW onboard charger" |
| ID.4 2021–22, 2023 | chemistry nmc (82 kWh) | nmc (estimated) | ⚠ | thinkEV: "82 kWh, NMC chemistry" for the 2026 car. Supplier changed LG to SK On in 2023 (Wikipedia). Estimate is plausible, flagged. |
| ID.4 82 kWh | voltage 400v | 400v | ✅ | Guide Auto 2025 Pro AWD: "400 V". Chemistry on that page: only "Lithium-ion". |
| ID.4 2021–2023 | `battery.preconditioning` | none | ⚠ | European-sourced. See item 5. |
| ID.4 2023 82 kWh | `dc_max_kw` | 170 | ⚠ | See item 3. |
| ID.4 2023 Standard / S | usable 58, dc 140 | 58, 140 | ✅ | SlashGear: "62-kWh pack actually has 58 kWh of usable capacity", "charge rate of 140 kW". |
| ID.4 2024 Pro/Pro S/AWD | dc 175 | 175 | ✅ | Cars.com: 82 kWh pack on Pro, Pro S, Pro S Plus, RWD or AWD, 175 kW. |
| ID.4 2024 standard-range | usable 58, dc 140 | 58, 140 | ✅ | Cars.com 62 kWh pack, 140 kW. ArenaEV: "58 kWh usable, 62 kWh total", "CCS 140 kW". |
| ID.4 2024 | `battery.preconditioning` | automatic_and_manual (manufacturer) | ⚠ | vw.com: "automatically begin preheating the battery on the way" and a manual option, for "most 2024 and newer". Both halves are present on the page. See item 5 on build dates. |
| ID.4 2025–2026 | usable, dc, preconditioning | estimated | ✅ | Same hardware as 2024 (nothing in the sources shows a change). |
| ID.4 2025 base (CA) / limited (US) | `capacity_usable_kwh`, `dc_max_kw`, voltage | 58, 140, 400v | ✅ | ArenaEV, Guide Auto 2025 Base "62.0 kWh… 400 V". |
| ID.4 62 kWh | `battery.chemistry` | nmc | ❌ | See item 4. |
| ID.4 all years | `charge_port` | ccs1 | ✅ | vw.ca: "Press the CCS1 unlock latch on the adapter before plugging it into your vehicle". thinkEV: CCS1. 2022+ marked estimated, 2021 marked manufacturer. |
| ID.4 all years | `supercharger_access` | via_adapter | ✅ | vw.ca: "officially available for the ID.4 and ID. Buzz". Electrek: access from 2025-11-18, "Model year 2026+ VW EVs will come standard with the adapter". The vw.ca page doesn't list model years; it mentions MY24–25 software campaigns. 2021–2023 cars are not explicitly addressed, so `low_confidence` is right. |
| ID.4 2026 `pro-rwd` | usable, voltage, dc, ac, chemistry | 77, 400v, 175, 11, nmc (estimated) | ⚠ | Compatible with 2024. The 175 kW conflicts with thinkEV 135 and existing 2026 values. See item 2. |
| ID.4 2026 `standard` / `awd` | `dc_max_kw` | 135 (existing, untouched) | ❌ | See item 2. |

## Other checks

- **i4 usable, 81.1 vs 81.5.** Both are BMW releases. The batch lists both on 2022 and carries only 81.5 forward as estimated. Fine.
- **i4 DC peak.** 200 kW (BMW NA) against EVDB and greencarscompare at 205 kW. I found no BMW statement of 205. Keeping 200 is justified. The 5 % tolerance is not exceeded.
- **i4 port.** No sign of a native NACS port on any 2026 i4. The BMW Canada page names only iX3 and i3; US news names the 2026 i5 M60.
- **i4 Supercharger access in Canada.** The page says "all BEV models" (except original i3 and MINI Cooper SE F56), and the i4 is not named. Fine with `low_confidence`.
- **`variants` section.** `volkswagen/id-4/2025/base` `drivetrain: rwd` matches Guide Auto ("RWD").
- **ID.4 2026 `standard`.** The existing data names it AWD with US name Pro AWD and 82 kWh. Compatible with the "82 kWh AWD pack" treatment.
- **No unknowns (item 14).** I merged the batch with the repo data for every variant in `research/powertrain-gaps.json`. All 8 required fields are present for every variant. Gaps remain only in quality (items 2, 4).
- **Fit with existing data (11).** No batch value differs by over 5 % from existing same-kind values, except ID.4 `dc_max_kw` 135 against 175 on the 2026 cars (item 2).
- **Curves.** The batch contains no curves.

## Applied by the researcher (2026-11-19)
1. All 16 i4 `battery.preconditioning` -> `automatic_with_navigation` (2022 eDrive40/M50 stay `manufacturer`, the rest `estimated`); "iDrive / My BMW app" wording removed (cabin preheating). eDrive35 note now says the 83.9 kWh-pack page is carried over as a software feature, no eDrive35 page.
2. `2026-standard` and `2026-awd` get `dc_max_kw` 175 kW estimated (Cars.com 2024 82 kWh RWD/AWD; Wikipedia), with the 135 kW OpenEV/thinkEV conflict noted.
3. 2023 Pro-family 170 kW notes now record Wikipedia's 175 kW (AWD), LG RWD 135 kW, and that Pro S rests on SlashGear's pack-level wording.
4. 62 kWh chemistry: searched again (Weekly Driver, Guide Auto: "lithium-ion" only; no page states NMC/LFP). Kept `nmc` as `estimated`, low confidence, note rewritten as a weak guess (OWNER FLAG). All five 62 kWh powertrains carry it in the batch.
5. 2021-23 preconditioning `none`: searched VW US/CA pages, US press and software-update coverage; no North American source found. Kept `estimated`, note names the European basis. 2024 note adds the early-build caveat.
6. 2021-22 usable 77 relabelled `estimated` (2023 SlashGear page, same pack; Wikipedia 82/77 for 2021-22). 2023 stays `manufacturer`.
7. eDrive35 notes: EV Database misquote removed (source note and value notes).
8. Native-NACS sentence restored in `src-bmw-canada-nacs-superchargers-2026-04`.
`--check` passes.
