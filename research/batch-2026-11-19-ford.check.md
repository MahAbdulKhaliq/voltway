# Check: research/batch-2026-11-19-ford.json

**Verdict: FIX.** Schema check passes (`add-facts.ts --check`: OK). Nothing is systematically wrong: the Ford spec-sheet figures I could read all match. The fixes are one wrong AC value, several mislabels, year-mismatch confidence flags, an invalid 2025 ER estimate, and conflicts with existing OpenEV-sourced values the batch does not override. No curves, wheels or `based_on` in this batch (checks 7-9 and 13 not applicable).

How I read the PDFs: WebFetch could not parse them, so I inflated the PDF text streams myself (saved copies in the tool-results folder). 2022, 2023 and 2025 Mach-E sheets and 2023 and 2025 Lightning sheets were readable. The 2024 sheets and a 2021 sheet are not available (403, or a photo-only file), so 2024 and 2021 values are not confirmed by Ford.

## Results

| Variant / powertrain | Field | Value | Result | Evidence |
|---|---|---|---|---|
| Mach-E 2022 SR (rwd and eAWD, incl. override on `2022/standard-range-rwd`) | usable, DC | 70 kWh, 115 kW | ✅ | 2022 sheet: "(SR) RWD (70 kWh)"; "Up to 115kW DC Fast Charge" under Select only |
| Mach-E 2022 ER, CA1, GT, GTPE | usable, DC | 91 kWh, 150 kW | ✅ | 2022 sheet: "(ER) eAWD (91 kWh)"; "Up to 150kW" on Extended Range / CA1 / GT |
| Mach-E 2023 ER, CA1, GT, GTPE | usable, DC | 91 kWh, 150 kW | ✅ | 2023 sheet: "SR/ER: 72/91", "ER: 91"; "Up to 150kW DC Fast Charger Capability" |
| Mach-E 2023 SR (LFP cars: `-lfp`, `-rwd-e`, `-eawd-e`) | usable, DC, 10-80 | 72 kWh, 150 kW, 33 min | ✅ | 2023 sheet "SR: 72", 108 cells; InsideEVs: LFP SR "72 kWh... 150 kW... 33 minutes" |
| Mach-E 2023 SR CA NMC overrides (`2023/standard-range-rwd`, `-eawd`) | usable 70, DC 115 (estimated) | | ✅ basis holds | Repo: CA 2023 SR RWD 397 km = 2022 NMC (LFP cars 402 km); SR eAWD 360 km = 2022 NMC (LFP 370 km). Range is used only to pick the pack, not estimated. |
| Mach-E 2025 SR | usable | 73 kWh | ✅ | 2025 sheet: "SR RWD (73 kWh)", "SR eAWD (73 kWh)" |
| Mach-E 2025 / 2026 ER (RWD) | usable | 88 kWh | ✅ for 2025; ⚠ for 2026 | 2025 sheet: "ER RWD (88 kWh)", 360 cells. 2026 cars use the 2025 sheet without `low_confidence` (see change 5) |
| `2025/extended-range-eawd-e` (crossed link) | usable 73, chemistry LFP, 10-80 33 | | ✅ | Car is the 380 km Standard Range eAWD. 2025 sheet "SR eAWD (73 kWh)", 108 cells (same as the LFP SR); overrides are right and labelled estimated where inferred. Inherits 150 kW (sheet) and 400 V. |
| Mach-E 2025 ER | published_10_80 = 45 (estimated, AutoTrader 2021) | | ❌ | 2025 ER pack is 88 kWh / 360 cells; 2021-2024 ER is 376 cells. Different pack, so the "same hardware" basis fails (change 4) |
| Mach-E 2026 GT | usable 91 (2025 sheet "GT eAWD (91 kWh)"), DC 150 | | ✅ value; ❌ fit | Existing 2026 GT / Rally cars carry usable 82, gross 88 (OpenEV). 91 vs 82 is over 5 % and the batch does not resolve it (change 6) |
| Mach-E 2024 SR | usable 72, chemistry LFP | | ✅ | InsideEVs: "Standard Range (SR) LFP battery (72 kWh)" |
| Mach-E 2024 ER | usable 91 | | ⚠ | InsideEVs: "ER... 91 kWh of net capacity". Wikipedia says 88 for 2024+ (and the 2025 sheet says 88). Within 5 %, keep `low_confidence`, mention the conflict |
| Mach-E 2024 DC 150 (SR, ER) | estimated from 2023 sheet | | ✅ | Same hardware; no change shown 2023 to 2024 |
| Mach-E 2021 usable / gross | SR 68 / 75.7, ER 88 / 98.8 | | ✅ | InsideEVs 2022: "68 kWh (2021) vs 70 kWh (2022)"; "88 ... 91"; totals 75.7 / 98.8 (2022 totals applied to 2021: flagged low) |
| Mach-E 2021 GT usable 88 | `manufacturer` | | 🏷 | The page names ER only, not GT. GT shares the ER pack (376 cells in the 2023 sheet), so this should be `estimated` with that basis |
| Mach-E 2021 DC 115 / 150 | estimated from 2022 sheet | | ⚠ | Notes say "only usable capacity changed 2021 to 2022", but InsideEVs 2022 says "improved fast charging curve". That is a charging-software change, so the basis is unproven. Reword the notes and keep `low_confidence` (change 7). Wikipedia lists the same 115/150 for 2020-22, which supports it. |
| Mach-E 2021-2022 10-80 | 38 / 45 min | | ✅ | AutoTrader: "about 38 minutes", "about 45 minutes" (2021). Applied to 2022 with `low_confidence` |
| Mach-E 2022-2024 ER 10-80 | 45 | | ✅ | InsideEVs LFP article: ER "about 45 minutes" |
| Mach-E chemistry NMC (2021, 2022) | estimated, Wikipedia | | ✅ | Wikipedia infobox NMC (LG) for the 75.7 / 98.8 packs |
| Mach-E chemistry NMC (ER 2023-2024) | `manufacturer`, InsideEVs | | ✅ | "ER stays NCM" |
| Mach-E 2025 / 2026 ER chemistry NMC | estimated, InsideEVs 2023 | | ⚠ | Pack changed (360 vs 376 cells), but NCM is still the likely chemistry. Mention the pack change in the notes |
| Mach-E 400v (all) | estimated, Electrek 347.8 V | | ✅ | Electrek: "78.21 kWh on 225Ah at 347.8V" |
| Mach-E LFP gross 78.21 (2023, 2024) | `tested`, Electrek | | 🏷 | Electrek says the figure "read" on a pack shown in Ford's presentation. That is a manufacturer figure, not an independent test. Use `manufacturer` (change 2) |
| Mach-E `ac_max_kw` 11 (all) | estimated, Wikipedia | | ⚠ | Wikipedia lists "AC charging rate: 11 kW" for the model, and existing 2026 data also says 11. The Wikipedia page does not name a market, so the Canadian car is unproven; acceptable as an estimate, kept `low_confidence` |
| Mach-E `charge_port` ccs1 (all years) | estimated | | ✅ | Wikipedia: "native CCS1 port" for 2025 US; 2025 sheet: "Fast Charging Adapter (NACS) (opt.)"; InsideEVs 2026: "has a CCS1 charge port"; Ford Canada page: adapter needed in Canada. The 2026 car is explicit. No port change found, so the estimate holds. |
| Mach-E `supercharger_access` via_adapter | manufacturer | | ✅ (2025+) / ⚠ (2021-2024) | Ford page: adapter required, Canada and US. It names no model years, so the 2021-2024 eligibility is not shown by the cited page (the batch admits "press reports"). Keep `low_confidence`. |
| All Ford: preconditioning | `automatic_with_navigation`, estimated | | ⚠ | Ford CA page: "enabled when you plan a route / pick a DC fast charger" in Connected Navigation, Google Maps, Apple Maps. It does not mention a manual control, and it is silent on model years (it says earlier years need software updates). ford.com page only mentions preconditioning "using the FordPass app before driving" (cabin, not battery). I searched for a manual battery button: Ford does not offer one; owners have asked for it since 2021 (macheforum, InsideEVs CarPlay article, Ford winter-driving tips for Lightning). So the value is consistent with the evidence but is not proven by the cited page; estimated + `low_confidence` is the right label. Fix the notes: "no manual control described" is silence, not proof; also state that years before 2022 are unconfirmed (change 8). |
| Lightning ER 131 usable | 131 kWh | | ✅ | 2023 sheet: "131 kWh of usable energy"; 2025 sheet "131 kWh of usable energy"; Battery Design: "131 kWh usable" |
| Lightning SR 98 usable | 98 kWh | | ✅ (2025) / ⚠ (2023) | 2025 sheet: "98 kWh of usable energy". The 2023 sheet text for SR could not be read |
| Lightning DC 150 (all) | 150 kW | | ✅ | 2023 sheet: "150 kW DCFC 15-80%"; 2025 sheet "15-80% DCFC (150kW+)". Existing data says 155 (OpenEV), 3 % apart, within tolerance; batch note already flags it |
| Lightning SR AC 11.3 | 11.3 kW | | ✅ | Both sheets: "11.3 kW/10.5 kW" |
| Lightning ER AC 19.2 (2022, 2023 platinum / ER) | 19.2 kW | | ✅ | 2023 sheet: ER "19.2kW/17.6 kW" |
| Lightning 2025 Platinum AC 19.2 | on powertrain `2025-platinum` (covers 2022-2025) | | ❌ | 2025 sheet: retail 11.3 kW/10.5 kW on every battery; "19.2/17.6kW (Fleet only option)". So `ford/f-150-lightning/2025/platinum` must be 11.3 (change 1) |
| Lightning 2024 ER / Pro / Pro ER AC 19.2 | cites 2023 sheet | | ⚠ | 2024 sheet unreachable (403). 2025 retail dropped to 11.3, so 2024 is unproven. Mark `low_confidence` |
| Lightning 2024 `pro` (CA) mapped to ER 131 | usable 131 | | ✅ | Repo: CA 2024 Pro 515 km = ER (SR is 386 km) |
| Lightning 2025 Platinum = 131 kWh | | | ✅ | 2025 sheet: Platinum column marked "S" only on the 131 kWh row |
| Lightning chemistry NMC (all) | estimated, Ford Corp / Battery Design | | ⚠ | Ford Corp: SK "Nickel 9" cell "mass produced... powering Ford's F-150 Lightning"; Battery Design: "SK On NCM9" for the ER pack. Applied to the SR pack on the same-cell-family basis (sheet: both lithium-ion pouch). Acceptable estimate; weak for the 123 kWh pack |
| Lightning 400v (all) | estimated, Battery Design 349 V | | ✅ | Battery Design: "349 V" |
| Lightning gross 142 | `tested`, Battery Design | | 🏷 | Page gives a published spec ("limited data"), not a test. Use `manufacturer` (page cites Ford specs) or `estimated` (change 2) |
| Lightning `charge_port` ccs1 | estimated, Ford CA Supercharger page | | ✅ | Page: "requires the Fast Charging Adapter (NACS)" for Lightning, US and Canada |
| Lightning `supercharger_access` via_adapter | manufacturer | | ✅ (2025) / ⚠ (2022-2024) | Same as Mach-E: the Ford page does not name model years |
| Lightning preconditioning | `automatic_with_navigation`, estimated, Ford CA nav page | | ⚠ | Same as Mach-E. Ford CA page: "automatic preconditioning... as it approaches a known DC Fast Charger" |
| Source records | all | | ✅ | All have URLs, `accessed_on` and sensible `type` (PDFs `oem`, relays `community`) |
| Validity | `add-facts.ts --check` | | ✅ | "batch is valid (490 variants, 165 sources after applying)" |
| Required fields (no unknowns) | 42 powertrains in `powertrain-gaps.json` | | ✅ | Every powertrain's missing fields are filled in the batch or already on the car. Quality of the "already on the car" values is the issue in change 6 |

## Required changes

1. **Lightning 2025 Platinum AC.** Add a variant override for `ford/f-150-lightning/2025/platinum`: `ac_max_kw` = 11.3 kW, `manufacturer`, source `src-ford-us-fl-specs-2025` (page: "11.3 kW/10.5 kW (48A)"; "19.2/17.6kW (Fleet only option)"). The shared `2025-platinum` value of 19.2 is right only for 2022-2024 and wrong for 2025. Check whether 2024 Platinum should be 19.2 (unverified, see item 5).
2. **Mislabels.** `battery.capacity_gross_kwh` 78.21 (Electrek, all LFP Mach-E powertrains): change `tested` to `manufacturer` and say "shown at Ford's presentation". Same for Lightning gross 142 (Battery Design): change `tested` to `manufacturer` or `estimated`. Also Mach-E 2021 GT `capacity_usable_kwh` 88 and `capacity_gross_kwh` 98.8 (page names ER only): change `manufacturer` to `estimated` with basis "GT shares the ER pack (376 cells, 2023 sheet)".
3. **Mach-E 2022 SR RWD override** (`2022/standard-range-rwd`): chemistry NMC cited as `estimated` from the same InsideEVs article that says "outgoing NCM"; fine, but the notes there say "this car sits on the shared 2023 LFP powertrain" at the end of the usable note; clarify the field note so it reads correctly (cosmetic).
4. **Mach-E 2025 and 2026 ER `published_10_80_min` = 45 (estimated, AutoTrader 2021).** Drop it or find a source for the 88 kWh / 360 cell pack. Estimating from the 2021 launch claim breaks the rule that the pack is unchanged (2021-2024 ER 376 cells, 2025 ER 360 cells).
5. **Missing `low_confidence`.** The researcher rule: no `low_confidence` only when read on the manufacturer's page for this exact car and year. Add `low_confidence: true` (or relabel as `estimated` from the sibling year) to these `manufacturer` values: all Lightning 2024 cars (cite the 2023 sheet), Lightning 2022 powertrains (cite the 2023 / 2025 sheet), `2025-platinum` and `2025-standard-range` as they cover 2022-2024 years, and the Mach-E 2026 powertrains (`2026-gt`, `2026-extended-range-rwd`, citing the 2025 sheet) and `2026-gt` covering 2024-2025.
6. **Conflicts with existing OpenEV values (over 5 %).** The batch fills only missing fields; the existing values stay and now conflict with the new Ford-sheet figures on the same powertrain. Resolve explicitly (add a variant override with the sheet value, or tell the owner):
   - 2026 GT and Rally: existing usable 82, gross 88; Ford 2025 sheet says GT and Rally "(91 kWh)". Add usable 91 to `2026-rally`.
   - 2026 SR AWD: existing usable 91, gross 98.8 (that is the ER pack) while the batch says LFP SR. 2025 sheet: SR 73 kWh, 108 cells. Add usable 73 (estimated, same hardware as 2025 SR) to `2026-standard-range` and `2026-standard-range-awd`. The existing 2026 SR has 70 / 75.7 (NMC pack figures) with LFP set in the batch.
   - 2026 ER (`extended-range`, `extended-range-awd`): existing 91; 2025 sheet and batch ER RWD say 88 (3 %); note the inconsistency between sibling 2026 cars.
   - Lightning 2025 Platinum, ER 131, Pro ER 131: existing usable 123 and gross 131 (the 123 kWh pack); Ford 2025 sheet says 131 kWh usable for these. Lightning 2025 SR: existing usable 91, gross 98; sheet says usable 98. Add usable 131 to the two 131 kWh powertrains (not in the batch now) and make sure the SR 98 wins over the existing 91.
7. **Mach-E 2021 DC.** Reword the notes of the four 2021 `dc_max_kw` estimates: "only usable capacity changed" is contradicted by InsideEVs ("improved fast charging curve"). State that the basis is unproven and that Wikipedia lists the same 115 / 150 for 2020-22.
8. **Preconditioning notes.** Change "no manual control described" to say the cited pages are silent on manual control, and add that no manual battery control is documented anywhere I could find (Ford support pages, owner forums). Say that 2021 and 2022 cars may predate the navigation trigger (Ford CA nav page: earlier years get it by software update); keep `estimated` and `low_confidence`.
9. **Supercharger access 2021-2024.** The Ford page lists no model years. State this in the notes (already hinted at) and keep `low_confidence`.
10. **Nice to have.** Mach-E AC 11 kW needs a Canadian source for the Canadian cars (rule 2). Wikipedia is generic. Keep as estimated.

## Applied by the researcher (2026-11-19)
Revised batch re-checked with `add-facts.ts --check`: OK (491 variants).
1. Lightning 2025 Platinum: variant override `ford/f-150-lightning/2025/platinum` ac_max_kw 11.3 (manufacturer, 2025 sheet). Shared `2025-platinum` keeps 19.2 for 2022-2024 with the note that 2024 is unproven.
2. Relabels: Electrek 78.21 and Battery Design 142 gross now `manufacturer`; Mach-E 2021 GT usable 88 and gross 98.8 now `estimated` (GT shares the 376-cell ER pack).
3. 2022 SR RWD override notes reworded.
4. `published_10_80_min` 45 removed from 2025-extended-range-rwd/-eawd and 2026-extended-range-rwd.
5. Conflicts: usable 91 + gross 98.8 (estimated) on 2026 GT and Rally; usable 73 (estimated) + gross 78.21 (estimated), DC, AC, 10-80 33 on 2026 SR / SR AWD; usable 88 + DC + AC on 2026 ER / ER AWD (OpenEV/Chargeprice 91 is 3 % off, kept as near-match); Lightning 2025 ER 131 / Pro ER 131 usable 131, gross 142 (estimated), DC 150, AC 11.3; ER 123 usable 123, DC 150, AC 11.3; SR 98 kept. `charge_port` ccs1 added to every one of those powertrains so unlinking OpenEV rows loses nothing. All 8 required fields verified present for every car on all 42 powertrains.
6. `low_confidence` added to every `manufacturer` value citing a sheet of a different year than the cars that take it (Lightning 2022, 2024, 2025-platinum, 2025-standard-range; Mach-E 2026 GT/Rally/ER).
7. 2021 DC notes now say the basis is unproven (InsideEVs "improved curve") and that Wikipedia lists the same 115/150.
8. Preconditioning notes: pages are silent on manual control, none found elsewhere; 2021/2022 may predate the navigation trigger.
9. Supercharger notes: Ford page names no model years; all low_confidence.
10. AC 11 kW notes say Wikipedia names no market. Chemistry notes on 2025/2026 ER mention the 360-cell pack change.
