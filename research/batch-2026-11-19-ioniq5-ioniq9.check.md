# Check: batch-2026-11-19-ioniq5-ioniq9.json

**Verdict: FIX.** `add-facts --check` passes (490 variants, 168 sources). No required field is left empty for any covered powertrain (all 34 powertrains cover every field in `powertrain-gaps.json`; 2025 N's port and Supercharger access come from the `variants` block). Most values verified. Five things need changing, below.

All 34 powertrains were checked. Values are grouped by powertrain family because they are identical across the member powertrains. Evidence quotes are under 15 words. Sources cited in the batch but not defined in it (`src-hyundai-ca-faq`, `src-hmgma-2025-ioniq-5-xrt`, `src-thechargeport-ioniq5-2026`) already exist in `data/sources/`.

## Results

| Powertrains (variants) | Field | Value | Result | Evidence |
|---|---|---|---|---|
| 58 kWh: 2022/2024 US SE Standard Range RWD, 2022/2023 CA Preferred | capacity_gross_kwh | 58 | ✅ | Canada Drives: "standard lithium-ion polymer 58-kWh battery"; HMGMA: "58.0 to 63.0 kWh". |
| 58 kWh (same four) | trim-to-pack mapping | CA Preferred = 58 kWh | ✅ (inferred) | Canada Drives does not name the trims. Repo data: 2022 and 2023 CA Preferred rated range 354 km, equal to US SE Standard Range 354.1 km. Mapping holds. |
| 58 kWh | usable 54, chemistry nmc, 800 V | | ✅ | EVDB 1476: 54.0 kWh usable, NMC, 523 V (800 V architecture). |
| 58 kWh | dc_max_kw | 175 | ✅ | EVDB: "175 kW (CCS)". Wikipedia table: 58 kWh, 175 kW. |
| 58 kWh, US variants | ac_max_kw | 10.9 | ⚠ market | Cited page is Canada Drives (Canadian car). It states "10.9 kW, standard on all models". No US page for the 58 kWh car; SlashGear covers only the 77.4 kWh launch car. Onboard charger needs a source for that market. |
| 58 kWh, all | preconditioning | automatic_with_navigation (estimated) | ⚠ see change 3 | electrive: "cannot be started manually". HMG 2023: "fast charging station" destination triggers conditioning. TSB 23-01-017H adds the trigger to 2022 cars by update. |
| 58 kWh, US | charge_port ccs1, supercharger via_adapter | | ✅ | Hyundai USA: legacy EVs have "native CCS ports"; Motor.com lists IONIQ 5 for adapters. |
| 58 kWh, CA | charge_port ccs1, supercharger via_adapter | | ✅ (weak wording) | CA FAQ: "IONIQ 5 ... (2026 model year onwards) are equipped with a NACS port"; "2025 and earlier can use a NACS adapter". The batch note "have a CCS port" is an inference, not a quote. |
| 77.4 kWh: 2022/2024 US RWD, 2022/2024 US AWD, 2022-24 CA Preferred Long Range, 2022-24 CA Preferred Long Range AWD | capacity_gross_kwh | 77.4 | ✅ | SlashGear: "only one battery for the US market, at 77. kWh" (text cut off). Canada Drives: 77.4 kWh on the Long Range. |
| 77.4 kWh | trim-to-pack mapping | US "RWD"/"AWD" = 77.4 kWh | ✅ | Repo EPA ranges 487.6 km (RWD), 412 and 418.4 km (AWD), against 354 km for the 58 kWh car. NRCan 488 km for CA Preferred Long Range. |
| 77.4 kWh | usable 74, nmc, 800 V | | ✅ | EVDB 1663: 74.0 kWh usable, NMC, 697 V. |
| 77.4 kWh | dc_max_kw | 233 | ✅ | EVDB: "233 kW"; Electrek: "up from 233 kW in earlier model years". |
| 77.4 kWh | ac_max_kw 10.9 | | ✅ | SlashGear: "10.9 kW onboard charger"; Canada Drives: "10.9 kW, standard on all models". CA variants cite the US page (SlashGear) but Canada Drives says the same; prefer citing Canada Drives for CA. |
| 77.4 kWh | published_10_80_min | 18 min | ✅ | SlashGear: "10-percent to 80-percent in 18 minutes". Canada Drives says 17 min 16 s on a 350 kW charger. |
| 77.4 kWh | preconditioning | automatic_with_navigation (estimated) | ⚠ see change 3 | Same sources as the 58 kWh row. |
| 77.4 kWh, US / CA | charge_port, supercharger_access | ccs1, via_adapter | ✅ | Same evidence as the 58 kWh row (US via Hyundai USA FAQ and Motor.com, CA via CA FAQ). |
| 2025/preferred-standard-range (CA/US) | capacity_gross_kwh | 63 | ✅ | HMGMA: "Standard Range models: 58.0 to 63.0 kWh". Electrek: "63 kWh (2025)". |
| same | usable 60, nmc, 800 V | | ✅ | EVDB 2235: 60.0 kWh usable, NMC, 520 V. ArenaEV: 800 V. |
| same, and 2026/2027 US SE Standard Range | dc_max_kw | 180, estimated | ❌ see change 1 | ArenaEV says "180 kW (CCS)" for the EU MY24 car. EVDB says 195 kW. Electrek (US) says 257 kW with 20 min 10-80 % for both packs. |
| same | ac_max_kw | 10.9, estimated | ⚠ | thechargeport: "up to 10.9 kW". US page, applied to a CA/US variant. Basis is sound (same generation). Canadian onboard charger is not sourced for Canada. |
| same | charge_port / supercharger_access, two values | CA: ccs1 / via_adapter. US: nacs / yes | ⚠ see change 2 | CA: Guide Auto says non-XRT 2025 models "get a CCS port". US: Hyundai USA says the 2025 IONIQ 5 is "first Hyundai to ship with a NACS port". Values are correct per market. The batch notes mark them "CANADA edition" and "US edition". |
| 2026/2027 US SE Standard Range RWD | gross 63 (est.), usable 60, nmc, 800 V, port nacs, access yes | | ✅ | Estimates are same generation; thechargeport: "2027 car keeps the factory-installed NACS port added for 2025". Electrek 2026-11-11 reports no charging changes. |
| 2025/2027 US RWD, Dual Motor AWD, Limited AWD; 2025 CA Preferred Long Range AWD; 2025 CA XRT; 2025/2027 US XRT AWD | gross 84, usable 80, nmc, 800 V | | ✅ | HMGMA: "Long Range models: 77.4 to 84 kWh". EVDB 2236: 80.0 kWh usable, NMC, 697 V. |
| same | dc_max_kw | 257 (manufacturer for 2025, estimated for 2027) | ✅ with note | Electrek: "peak rate of 257 kW" on a 350 kW charger. Electrek does not attribute it to Hyundai, though Edmunds does. Conflicts disclosed (EVDB 263, Wikipedia 238, C&D 258). |
| same | ac_max_kw 10.9 (estimated) | | ⚠ | US page. CA variants (2025 Preferred Long Range AWD, XRT, Preferred Standard Range) have no Canadian source. Existing 2026 CA/US variants already carry the same value from the same page. |
| 2025/2027 US 84 kWh | charge_port nacs, supercharger yes | | ✅ | HMGMA: first Hyundai with NACS. Hyundai USA FAQ: "first model to get the new NACS port". 2027 estimate holds. |
| 2025/preferred-long-range-awd (CA) | charge_port ccs1, supercharger via_adapter | | ✅ | Guide Auto: XRT is the first NACS, "other 2025 ... models use CCS". CA FAQ gives the adapter. Guide Auto is a pre-launch article. |
| 2025/xrt (CA) | charge_port nacs | | ✅ | Guide Auto: "the first Hyundai model in Canada to feature a ... NACS port". |
| 2025/xrt (CA) | supercharger_access yes | | ⚠ market | Cited page is Hyundai USA. The CA FAQ confirms Supercharger access only for 2026+ and does not mention the 2025 XRT. Needs a source for Canada, or mark estimated. |
| 2025/n (variants block) | charge_port ccs1 | | ✅ | US: "IONIQ 5 N vehicles do not have a native NACS port". CA: Guide Auto says the N has a CCS port. Both markets confirmed. |
| 2025/n | supercharger via_adapter | | ✅ | Motor: 2025 N is in the complimentary CCS-to-NACS adapter list (US). Guide Auto: adapter offered (CA). |
| 2026-n powertrain (2025 N and 2026 N) | capacity_gross_kwh 84 | | ⚠ unverifiable | Hyundai EU PDF is image-encoded and could not be read. Existing 2026 N already has gross 84. |
| 2026-n | capacity_usable_kwh 80 | estimated | ⚠ see change 4 | EVDB: 80.0 kWh, asterisk "estimated value". Existing 2026 N has 78 (OpenEV, manufacturer); 2.6 % apart. |
| 2026-n | nominal_voltage_class 800v | | ✅ | EVDB: 697 V. |
| 2026-n | dc_max_kw | 239 | ❌ see change 4 | Existing 2026 N has 220 kW (OpenEV), 8.6 % lower. Hyundai Canada N page (already on file) says 238 kW. EU PDF is unreadable. |
| 2026-n | ac_max_kw | 11 | ⚠ | Source is the EU PDF (unreadable). Existing 2026 N already has 11 kW. EU source for an onboard charger; 10.9 vs 11 is rounding. |
| 2025 US 77.4/63/84 and 2022-24 | preconditioning, 2025+ (all Long Range, Standard Range, XRT, N, IONIQ 9) | automatic_and_manual | ⚠ see change 3 | NE1a page: "manually activate ... or link its operation to the navigation system"; "DC charging station is set as a destination or waypoint". |
| 2026 long-range, long-range-awd, long-range-awd-xrt, 2026 SE Standard Range RWD (marked `manufacturer`), 2026 N (NE1n), IONIQ 9 x3 (MEa) | preconditioning | automatic_and_manual | ⚠ model unverified | Wording confirmed on all three pages, but none names the model. The index pages return only "%pagetitle%". Code NE1/NE1n/ME is the IONIQ 5/5 N/9 platform. A search shows a Hyundai USA "ioniq 5 welcome center" link and NE1a manuals, but I could not tie the 2026 NE1a page to the IONIQ 5 directly. |
| 2025/2027 variants (estimated) | preconditioning | automatic_and_manual | ⚠ | The 2025 estimate rests on a 2026 manual. A 2025 NE1a manual exists (`/full_pdf/NE1a/2025/en_US`) and should be cited instead. |

## Questions you asked

- **2025+ preconditioning.** The NE1a, NE1n and MEa pages say what the batch says (manual plus navigation trigger). None names a model. The identification by manual code is plausible (NE1 is the IONIQ 5 code) but not provable from the pages. Keep `kind: manufacturer` only once the model is tied to the page (Hyundai USA owner's-manual link for the 2026 IONIQ 5 and IONIQ 9). Until then label the 2026 ones `estimated` or keep `low_confidence`, which they already carry. The cars mapped on this value are right in substance.
- **2022-24 estimate.** The basis is thin but acceptable as `estimated`. electrive tested a 2023 EU car and says "cannot be started manually". HMG's 2023 story is silent on manual control. The TSB covers 2022. There is no source for 2024. electrive says the feature "arrived with" MY2023 and can be added to older cars by update, so 2022 cars without the update may lack it. That is a relevant change within the span, which the notes acknowledge only partly.
- **63 kWh DC peak 180 kW.** Not supported well enough. See change 1. The usable 60 kWh from EVDB is verified.
- **Port and Supercharger access split.** Verified. Canada 2025: only the XRT is NACS (Guide Auto). US 2025 N is CCS1 (Hyundai USA). Canada 2025 N is CCS with an adapter offered (Guide Auto).
- **`2025/preferred-standard-range` (CA+US).**
  - Canada: `ccs1` and `via_adapter` (Guide Auto and CA FAQ).
  - US: `nacs` and `yes` (HMGMA and Hyundai USA).
  - The variant is one record with both markets, so only one value can be shown per field. Check how the merge picks one; whichever is chosen is wrong for the other market.
  - The US trim name is "SE Standard Range RWD"; the Canadian name is "Preferred Standard Range".
- **Trim-to-pack mapping.** Canadian 2022/2023 Preferred = 58 kWh holds (354 km range, same as US SE Standard Range 354.1 km). The US 2022/2024 RWD/AWD = 77.4 kWh holds (EPA 487.6 and 412/418 km).

## Required changes

1. **`dc_max_kw` 180 for the 63 kWh powertrains** (`2025-preferred-standard-range`, `2026-se-standard-range-rwd`, `2027-se-standard-range-rwd`). No North American page states it. 180 is the middle of three EU figures (180, 195, 175), which is a "typical value" method. Electrek's US table gives the same 20-min 10-80 % (257 kW peak) for both packs. Rewrite the notes to disclose that conflict and the 195 kW EVDB figure. Cite only sources that were read (EVKX and the "Australian EV group" are named in the notes but not in `sources`). If a North American figure cannot be found, keep it `estimated`, `low_confidence`, and flag it for the owner.
2. **`2025/preferred-standard-range` charge_port and supercharger_access.** Check how the merge treats two values on one variant. If it cannot hold per-market values, split the variant by market or flag for the owner. The `ccs1`/`via_adapter` pair is Canada only and the `nacs`/`yes` pair is US only; the batch notes say so but the data does not.
3. **Preconditioning sources.**
   - Cite the 2025 NE1a manual for the 2025 variants.
   - Make the 2026 `manufacturer` values `estimated` or tie the manual to the model (Hyundai USA welcome-center link).
   - For 2022-24, note that 2024 has no source and that 2022 cars may lack the update.
4. **2026 N (and 2025 N) `dc_max_kw` 239 vs existing 220.** The difference is 8.6 %, over the 5 % limit. The 2026 N already holds 220 (OpenEV). Hyundai Canada's N page, already on file as `src-hyundai-ca-ioniq-5-n-2027`, says 238 kW. Either cite that page, or record the conflict in the notes. The EU PDF is unreadable, so 239, gross 84 and ac 11 from it are unverifiable. Re-extract the PDF text or cite the Hyundai Canada N page. Usable 80 (estimated) against existing 78 (OpenEV) is within 5 % and acceptable.
5. **Market sourcing for onboard charger and Supercharger access.**
   - `ac_max_kw` 10.9 on the US 58 kWh variants is sourced from Canada Drives. Cite a US source or mark `estimated`.
   - `ac_max_kw` 10.9 on the CA variants of the 63 and 84 kWh cars rests on a US page.
   - `supercharger_access: yes` on `2025/xrt` (CA) cites Hyundai USA. Cite a Canadian page or mark `estimated`.
   - The CA FAQ does not literally say 2025 and earlier "have a CCS port". Reword the notes to "NACS from 2026 model year; 2025 and earlier use an adapter".

Not required but worth noting: for the 77.4 kWh CA variants, cite Canada Drives instead of SlashGear for `ac_max_kw` (the figure is the same).

## Applied by the researcher (2026-11-19)
1. 63 kWh dc_max_kw: still estimated 180 kW, low confidence; notes now disclose Electrek's 257 kW / 20 min US figure and EV Database's 195 kW, uncited EVKX/"Australian" claims dropped; flagged for owner review (no North American source found).
2. Market split: Canada values (ccs1 / via_adapter) under `variants["hyundai/ioniq-5/2025/preferred-standard-range"]`, US values (nacs / yes) under `variants["hyundai/ioniq-5/2025/preferred-standard-range-us"]` (does not exist yet; `--check` fails only on it). Removed the powertrain-level variant_fields for that id. 2025/n agrees in both markets, so left as is.
3. Preconditioning: 2025 cars now cite the 2025 NE1a manual page (new source, opened); all NE1a/NE1n/MEa values are `estimated` (model tied only by platform code); 2022-24 notes add the no-2024-source and 2022-without-update caveats.
4. N: dc_max_kw now 238 kW manufacturer from `src-hyundai-ca-ioniq-5-n-2027`; the Hyundai Europe PDF figures (239 / 84 / 11) and its source were dropped; N gross and AC removed (already on file). N usable 80 stays estimated.
5. AC: US 58 kWh variants marked estimated (Canada Drives page covers the Canadian car); Canadian 77.4 kWh variants cite Canada Drives; 2025+ notes say no Canadian page states the charger. 2025 XRT (CA) Supercharger access is now estimated (CA FAQ + US page). CA FAQ note reworded: NACS from MY2026, 2025 and earlier use an adapter.
