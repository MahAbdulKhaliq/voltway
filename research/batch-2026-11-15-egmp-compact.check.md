# Check: batch-2026-11-15-egmp-compact.json

**Verdict: FIX.** The batch is valid (`add-facts --check`: OK, 84 variants, 50 sources, nothing written). Most Hyundai/Kia values hold up, but two manual-code mappings are wrong, so the manual-based preconditioning values are unsupported. The N's 238 kW is also unproven for 2026.

## Key findings
1. **NE1N is the IONIQ 5 N manual, not the regular IONIQ 5.** Hyundai's own N manual PDFs carry the header "NE1N_en_GN.book", and the regular IONIQ 5 manual is NE1 ("NE1_US.book"). The batch applied the NE1N page to three non-N variants (Long Range, Long Range AWD, XRT). The page is unnamed and its mapping to the regular IONIQ 5 is wrong. It could support the **N** instead, but no N preconditioning value was filed.
2. **Kia MV1 is the EV9 manual, not the EV6.** An NHTSA TSB lists the "EV9 (MV1, MV1a)", and the manual's text mentions "(for GT)". The EV6 manual is CV1. The page itself names no model, so the three EV6 preconditioning estimates rest on the wrong model. The Kia UK page names EV6 for manual activation only, so the navigation half has no EV6 source.
3. **2027 IONIQ 5 N page is not shown to equal the 2026 car.** The page says the design was adjusted (13 mm lower, 80 mm longer). Nothing in the batch shows the 2026 charging figures are unchanged, so the 238 kW carry-over is unproven. It also conflicts with the existing 220 kW by 8 %.

## Table

| Variant | Field | Value | Result | Evidence |
|---|---|---|---|---|
| ioniq-5/2026/long-range, long-range-awd, long-range-awd-xrt | battery.capacity_usable_kwh | 80 kWh, estimated | ⚠ weak basis | EVDB: "80.0 kWh", flagged as the site's own estimate; European MY24 car. The Weekly Driver gives 81. The N has 78 (OpenEV) on the same pack. Three sources disagree (78/80/81) and none is a manufacturer figure. |
| same 3 | battery.chemistry | nmc, estimated | ✅ | Weekly Driver: NCM 811, SK On, lists 2025 IONIQ 5 Long Range/XRT. Pack is 84 kWh in Canada too (existing gross 84). EVDB agrees: NMC. |
| same 3 | battery.preconditioning | automatic_and_manual, manufacturer | ❌ mismatch | Source is the NE1N manual, which is the N. The page quotes both triggers ("automatically operate... DC charging station", "Active to use manually") but names no model. The regular IONIQ 5 manual (NE1) was not read; the NE1 2026 URL guess returned 404. |
| same 3 | ac_max_kw | 10.9 kW, manufacturer | ⚠ | The Charge Port (third party): "Home charging: up to 10.9 kW". Kia US page gives 10.9 kW for the EV6 sibling. Hyundai's own statement was not seen, so the "manufacturer" kind is not proven. EVDB (Europe) says 11 kW. Acceptable at low confidence. |
| ioniq-5/2026/long-range | trim wheels | 19 in standard | ⚠ | Hyundai Canada 2026 page: "exclusive aerodynamically-optimized 19" alloy wheels". The page does not assign the wheel to a trim, and the trims table did not load. Plausible but not trim-specific. |
| ioniq-5/2026/long-range-awd-xrt | trim wheels | 18 in standard, 235/60R18 | ✅ (caveat) | hmgma.com: "Unique model-specific black 18-inch wheels", "235 / 60 R 18". Page is US MY2025. Nothing shows the Canadian MY2026 car differs; keep at low confidence. |
| ioniq-5/2026/long-range-awd | trim wheels | none filed | note | The trim has no wheel entry. No source for it was found. |
| ioniq-5/2026/n | battery.chemistry | nmc, estimated | ✅ | Weekly Driver lists "Ioniq 5 N (2025, AWD only)" under the same 84 kWh NCM 811 pack. |
| ioniq-5/2026/n | charge_port | nacs (2 records) | ✅ (low confidence) | CarGurus: "all Ioniq 5 N models now come standard with... NACS", 2026 US. The Hyundai Canada FAQ says "IONIQ 5... (2026 model year onwards)" and does not name the N. The Charge Port says the 2025 N is CCS1. The Hyundai Canada 2027 N page mentions only "CCS DC Adapter needed" and no NACS. Canadian N port is unconfirmed but not contradicted. The CarGurus record is a journalist's claim; `manufacturer` is arguable. |
| ioniq-5/2026/n | supercharger_access | yes | ✅ (low confidence) | Follows from NACS (FAQ: Hyundai EVs gain Tesla Supercharger access; 146 Canadian stations). The N is not named. |
| ioniq-5/2026/n | dc_max_kw | 238 kW, estimated | ❌ | The page is the **2027** N: "charge speed of 238 KW when connected to a DCFC 350 kW charger". It says the design was adjusted, and no source shows 2026 equals 2027. The existing OpenEV value is 220 kW (8 % lower, over the 5 % flag). Independent logs cite about 257 kW (EVKX) and a 350 kW rating, so there are four different numbers. |
| ioniq-5/2026/n | trim heat_pump | standard, estimated | ⚠ | The 2027 page says "Heat pump, battery thermal management and preconditioning system". The hardware probably carried over. The notes should name the model years compared. |
| ioniq-5/2026/n | trim wheels | 21 in, 275/35R21 | ✅ | CarGurus: 2026 N "21-inch forged wheels" and 275/35R21. Hyundai Canada 2027: "21" lightweight wheel". |
| ioniq-6/2025/long-range, long-range-awd | charge_port | ccs1 (2 records) | ✅ | The FAQ states that 2025-and-earlier EVs have CCS ports. It is lineup-wide and does not name the IONIQ 6. The Charge Port row: "Ioniq 6 (2025) \| CCS1 \| Paid adapter". The Charge Port record is third-party, so `manufacturer` is arguable. |
| same 2 | supercharger_access | via_adapter | ✅ | FAQ: 2025-and-earlier EVs "can use a NACS adapter available separately". The "free adapter" forum claim is correctly excluded. |
| same 2 | battery.chemistry | nmc, estimated | ✅ | EVDB: IONIQ 6 Long Range AWD (MY23-25) 77.4 kWh, NMC, 697 V. Same model and generation. The Canadian 2025 gross is 77.4. |
| same 2 | battery.preconditioning | automatic_and_manual, estimated | ⚠ | Green Car Reports (2023 IONIQ 6): navigation trigger, "no manual button". Hyundai Ireland IONIQ 6: "activate it remotely via the Bluelink app or a button inside the car". The Ireland page says nothing on navigation. Two model-specific sources across years and markets is allowed as `estimated` with both named. The notes also cite the NE1N manual, which is the N and must be removed. The Green Car Reports article says a manual control was missing in 2023, so the Ireland page (European) covers the later state. Plausible, but low confidence is right. |
| kia/ev6/2025/wind, land-awd, light | battery.chemistry (wind, land-awd) | nmc, estimated | ✅ | EVDB EV6 GT: NMC, 84 kWh, 697 V, same pack as other long-range EV6. The Weekly Driver lists the 2025 EV6 Long Range under NCM 811. The Light (63 kWh) is correctly not filled. |
| kia/ev6/2025/wind, land-awd, light | battery.preconditioning | automatic_and_manual, estimated | ❌ | The MV1 manual is the EV9, not the EV6 (EV6 is CV1). The Kia UK page: EV3, EV6 and EV9 "manually activate battery pre-conditioning via the car's infotainment system or connected app". That gives manual only for EV6 (UK). No EV6/NA source for the navigation half. |
| kia/ev6/2025/wind | trim wheels | 19 in, 235/55R19 | ✅ (caveat) | Kia US 2026: Wind "19-in., Black". US MY2026 mapped to Canadian MY2025, but the refresh was already in 2025 and nothing shows a change. |
| kia/ev6/2025/light | trim wheels | 19 in, 235/55R19 | ✅ (caveat) | Kia US 2026: Light "19-in., Dark Gray". |
| kia/ev6/2025/light | trim heat_pump | none, manufacturer | ⚠ | Kia US: Light "Not available". Kia Canada (existing record) says heat pump "standard on Wind and Land" and is silent on Light. The US page shows heat pump as optional on other trims, while Canada has it standard, so the Canadian car differs and the US "none" cannot be assumed to map. The Kia Canada page was too large to read here. |

## Existing-data problems the researcher raised
- **kia/ev6/2025/light usable 80 kWh vs gross 63 kWh:** confirmed. Usable cannot exceed gross. The 80 comes from the Chargeprice archive (`src-chargeprice-archive-2025-04`, unsourced), which appears to assign the 84 kWh figure to all trims. Kia US 2026 lists Light at 63.0 kWh and "Light Long Range" at 84.0 kWh. The same Chargeprice 80 is on Wind and Land (fine for the 84 kWh pack), so only the Light usable is wrong. This needs an owner decision. Also check whether the 2025 Canadian "Light" is the 63 kWh pack or a Light Long Range.
- **EV6 voltage class 400v vs 800v:** the Chargeprice 400v is unsourced. The Kia US page doesn't state voltage, and EVDB gives 697 V nominal with 800 V architecture, so 800v looks right. It does not apply to the 63 kWh Light, whose voltage was not checked (peak 180 kW is not enough to decide).
- **EV6 Wind heat pump "standard" vs Kia US "Available":** not a real conflict. Kia Canada's page is the source for "standard on Wind and Land". The US page lists "Available" for the row, with a note about dual motor e-AWD, so the markets can differ. The Canadian page should be given priority for Canadian cars. This also undercuts the Light "none" mapping above.

## Required changes
1. Drop `battery.preconditioning` for `hyundai/ioniq-5/2026/long-range`, `long-range-awd` and `long-range-awd-xrt`. The NE1N manual is the N. Replace it with the regular IONIQ 5 (NE1) 2026 manual page, or cite the NE1N page only for `hyundai/ioniq-5/2026/n` with notes saying so.
2. Drop `battery.preconditioning` for `kia/ev6/2025/wind`, `land-awd` and `light`. MV1 is the EV9 manual. Replace with the EV6 manual (CV1) page, or an EV6-specific page that states the navigation trigger. The UK page alone supports manual only (`manual_only` estimated at best).
3. For `hyundai/ioniq-6/2025/long-range` and `long-range-awd` preconditioning, remove the NE1N manual from the notes. Keep it as estimated with the two named sources, or look for the IONIQ 6 (CE1) manual.
4. Drop `dc_max_kw` 238 for `hyundai/ioniq-5/2026/n`. The page is 2027, shows a design change, and conflicts with the existing 220 kW. Re-submit with a 2026-specific source, or with an explicit 2026 = 2027 comparison.
5. Reconsider `battery.capacity_usable_kwh` 80 (three IONIQ 5 variants). The only basis is EVDB's own estimate for a European car, and sources give 78, 80 and 81 for the same pack. Drop it, or state that it is a low-confidence estimate and keep the conflict visible.
6. `kia/ev6/2025/light` heat pump `none`: drop unless Kia Canada's page shows Light without a heat pump. The US/Canada difference is already visible on Wind.
7. For `hyundai/ioniq-5/2026/long-range` wheels 19 in: the page does not tie the wheel to a trim, so keep `low_confidence` and say so in the notes (already low confidence).
8. For `hyundai/ioniq-5/2026/n` heat pump: add to the notes which model years were compared. Optional.
9. Optional: for `ac_max_kw` 10.9 on the three IONIQ 5 variants, cite a Hyundai page (the Charge Port is third-party), or relabel.
10. Separate from this batch: fix `kia/ev6/2025/light` usable 80 vs gross 63 (owner decision).

## Applied by the main session (2026-11-15)
1. IONIQ 5 Long Range / Long Range AWD / XRT preconditioning: dropped (NE1N is the N's manual). Not re-sourced from NE1 this round. Done.
2. EV6 Wind / Land AWD / Light preconditioning: dropped (MV1 is the EV9 manual). Not re-sourced from CV1 this round. Done.
3. IONIQ 6 preconditioning notes: NE1N citation removed. Done.
4. IONIQ 5 N `dc_max_kw` 238: dropped (2027 page, no 2026 carry-over shown). The existing 220 kW (OpenEV) stays. Done.
5. IONIQ 5 usable 80 estimate: dropped on all three variants. Done.
6. EV6 Light heat pump `none`: dropped. Done.
7. Optional items (N heat-pump note years, Hyundai page for IONIQ 5 AC 10.9): not done.
Unreferenced sources removed from the batch. Existing-data problems (EV6 Light usable 80 from the EV6 GT Chargeprice match; EV6 voltage class 400v) are left for the owner: they come from an owner-approved crosswalk row (B8).
