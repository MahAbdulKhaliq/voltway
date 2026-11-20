# Fact-check: research/batch-2026-11-20-r2-gm.json

Checked 2026-11-20. `npx tsx scripts/add-facts.ts research/batch-2026-11-20-r2-gm.json --check`: **OK** (1404 variants, 993 sources, nothing written). Not applied.

## Verdict: **FIX**

The NRCan/EPA-driven charger work (B104) is sound for 2024-2027 Cadillac, Chevrolet and GMC and checks out against the imported rows. The problems are:
- markets on three new trucks,
- the Lyriq 2023-24 conflict, which the data does resolve and the batch does not,
- consumption values copied across model years and mixed bases,
- one Sierra estimate whose basis fails the same-motors rule,
- missing wheels on the new trucks,
- some Escalade labels and market scopes.

## 1. Charger options (B104)

I compared every `ac_max_kw` against `data/imported/nrcan/{2023..2026}.json` and `data/imported/epa/{2023..2027}.json` (labels and 240 V hours).

| Variant / trim | Value | Result | Evidence |
|---|---|---|---|
| Optiq 2027 AWD and RWD: 11.5 base plus new 19.2 trim, US | ✅ verified | EPA 2027 has "OPTIQ AWD 11kW / 19kW Charger" (9.5 h / 5.9 h) and "OPTIQ RWD 11kW / 19kW Charger" (9.5 / 5.9). No NRCan 2027 file, so US-only is right. Optiq-V 2027 and Vistiq 2027 also match. |
| Optiq 2025 AWD, 2026 AWD/RWD, Optiq-V 2026, Vistiq 2026 | ✅ verified | NRCan "(11.5 kW)" 9.5 h / "(19.2 kW)" 5.9 h. Vistiq 11.2 h / 7.0 h. EPA 2026 carries the same pairs, so CA+US names are right for 2026. EPA 2025 has no Optiq, so CA-only for 2025 is right. |
| Lyriq 2025 AWD (CA+US), 2025 RWD (CA only), 2027 RWD/AWD/V (US) | ✅ verified | NRCan 2025 LYRIQ and LYRIQ AWD: 11.2 h / 7.0 h. EPA 2025 lists both only for AWD ("11 kW" / "19 kW"); EPA 2025 RWD is a single 11.2 h row, so a CA-only RWD 19.2 trim is right. EPA 2027 lists RWD, AWD and AWD V-SERIES with 11 and 19 kW. |
| Lyriq / Lyriq-V 2026 charger trims | ✅ verified | NRCan 2026 LYRIQ, LYRIQ AWD, LYRIQ-V with both labels. EPA 2026 also has paired labels. |
| Equinox EV 2025/2026 AWD, Silverado 2025 LT/WT Ext, 2026 LT Ext (CA), 2026 Ext (US), Sierra 2026 Denali/Elevation | ✅ verified | NRCan labels with matching hours (Silverado/Sierra 18.6 h vs 11.5 h; Equinox 9.5 h vs 5.9 h). EPA Equinox 2025 labels both "11/19 kW" but both show 9.5 h (an EPA data quirk; NRCan's 5.9 h supports it). Silverado 2026 US: EPA "Ext Range (11kW)/(19kW)". |
| Silverado 2025 LT/RST Ext (CA only): 19.2 | ✅ verified | NRCan 2025 lists only "LT/RST Ext Range (19.2 kW Charger)" at 11.5 h. Variant market is CA. Powertrain fix 11.5 → 19.2 is right. |
| Silverado 2025 WT Max Range: 19.2 | ✅ verified | NRCan "WT Max Range (19.2 kW Charger)" 13.3 h. The GM spec guide in the repo also says the 8WT Max has the 19.2 kW module. |
| Sierra 2025 Denali Ext powertrain 11.5 → 19.2 (estimated) | ✅ verified | NRCan and EPA 2025 Sierra Ext show 11.5 h, equal to the Silverado "19.2 kW" rows (11.5 h); the 11.5 kW rows take 18.6 h. Same pack (170 kWh) and truck. Basis valid and labelled `estimated`. |
| Celestiq 2025/2026 powertrain 19.2 | ⚠ partly | GCC says "can charge at up to 19.2 kW AC and 190 kW DC", CCS1, 400 V, "116.8 kWh battery (111 kWh usable)". The 8.0 h at 240 V fits: 108.8 / 8.0 = 13.6 kW into the pack, about 70 % of 19.2. The same ratio holds for the 19.2 kW Lyriq (100 kWh / 7.0 h). But GCC doesn't name GM as the source, so `manufacturer` is unproven (see fix 9). The batch note's "108.8 kWh pack" is the repo's own estimate; GCC says 111 usable. |
| Escalade IQ 2025 Luxury 2 / Sport 2: 19.2 | ✅ verified (US) | Cars.com: "11.5-kilowatt onboard charger is standard in the lower trims", and the 2 trims get "the more powerful onboard charger" (19.2 kW). The page is US only, yet the variant also carries CA trim names. CA unproven. |
| Escalade IQ 2026 Premium Luxury / Premium Sport: 19.2 | ✅ verified (US) | InsideEVs: Premium trims "were offered with the 19.2 kW OBC"; Luxury and Sport "11.5 kW module". The article states no market. TTAC says the same. |
| Escalade IQ 2027, all four trims: 19.2, `manufacturer` | 🏷 | InsideEVs: "A more powerful on-board charger comes standard across all trim levels." TTAC: "every Escalade IQ trim comes standard with a 19.2-kW on-board charger." The batch's own note says GM did not announce it (GM Authority found it), so `manufacturer` is not supported (see fix 8). |
| Escalade IQL 2026 Premium Luxury / Premium Sport: 19.2 (estimated) | ✅ ok as estimate | Cars.com IQL: "11.5-kilowatt onboard charger; a 19.2-kW unit will be available", no trim split. InsideEVs 2026 trim split doesn't say IQ vs IQL. `estimated` with a stated basis is acceptable. |
| Escalade IQL 2027, all four trims: 19.2 (estimated) | ⚠ unproven | Neither InsideEVs nor TTAC says the IQL gets it. InsideEVs names the IQL only for NACS, and TTAC says it doesn't confirm the charger for the IQL. The basis "same pack and charger module" is unproven: Cars.com says the IQL pack is 5 kWh bigger, Wards says shared. Keep as `estimated`, `low_confidence`; say the IQL charger is unconfirmed. |
| **Lyriq 2024 RWD/AWD**: base trim 11.5 (CA+US names), new 19.2 trim CA only | ❌ | NRCan 2024 lists both labels for LYRIQ and AWD (10.7 h / 6.7 h). **EPA 2024 has one unlabelled row each, RWD 6.5 h and AWD 6.7 h, which is the 19.2 kW figure.** So the US 2024 car rated by EPA is the 19.2 kW one, but the batch shows US users only 11.5. |
| **Lyriq 2023 RWD / AWD** (not in batch) | ❌ gap | NRCan 2023 "LYRIQ" 6.5 h and "LYRIQ AWD" 10.7 h. EPA 2023 matches (6.5 h / 10.7 h). From the charge hours 2023 RWD is the 19.2 kW car and 2023 AWD the 11.5 kW car. The repo's 2023 RWD still says 11.5 (estimated) next to a 6.5 h rated time. |

## 2. New trucks (B97/B103)

| Car | Field | Result | Evidence |
|---|---|---|---|
| Hummer 2022 Edition 1 | usable 205 kWh (manufacturer) | ✅ | Motor Authority: "usable capacity of 205 kwh or 213 kwh depending on which standard". |
| | DC 350 kW | ✅ | "350-kw CCS DC fast-charging connector". |
| | AC 11.5 kW | ✅ | MA "Level 2 outlet at a rate of 11.5 kw" (from 2021 coverage). InsideEVs: "came with a standard 11.5 kW AC onboard charger". |
| | voltage 800v | ✅ | MA: "400V system, or in series at 800V". |
| | range 329 mi → 529 km | ✅ | "Total range is 329 miles"; 329 × 1.609 = 529.4 km. Not EPA rated (GVWR 10,400 lb), so claim is GM's. |
| | chemistry nmc (estimated), port ccs1 | ✅ | Basis is the same 24-module Ultium pack as the 2024 3X record. Plausible. |
| | preconditioning `automatic_and_manual` (estimated) | ⚠ | The cited guide was never read (403, search excerpt). The note admits the 2022 TechLink article documents only the app trigger. The automatic navigation trigger for a 2022 truck is unproven (see fix 7). |
| | Supercharger `via_adapter` (US) | ✅ | The InsideEVs list is current-state, and the batch says so. |
| | market `["US"]` | ❌ for 2023 | Batch notes "Canada sale in 2022 not checked". For 2023 the pickup was sold in Canada: GM Authority headline "2023 GMC Hummer EV pickup Edition 1 soon available in Canada" (seen as a search excerpt only, page 403). Its sister article says Canada gets no 3X pickup for 2023. |
| Hummer 2023 Edition 1 | range 329 mi | ✅ | KBB lists pickup Edition 1 at 329 mi. |
| | consumption 388 Wh/km | see section 3 | |
| Hummer 2023 EV3X | range 355 mi → 571 km | ✅ | KBB: EV3X "355 miles", 22-inch wheels, 329 with the Extreme Off-Road package. |
| | powertrain = 2022 Edition 1 (11.5 kW, 205 kWh) | ⚠ | Both are three-motor trucks per KBB, and InsideEVs says 19.2 kW began in 2024, so the carry-over is reasonable. Nothing states the 2023 EV3X pack or charger. It should stay `low_confidence`. |
| | market US only | ✅ | Supported by the GM Authority headline "Canada won't get a 2023 Hummer EV pickup 3X" (excerpt only). |
| Sierra EV 2024 Denali Edition 1 | usable 200 kWh (estimated) | ❌ basis | The Hummer 3X comparison fails the same-motors rule. InsideEVs: Edition 1 is "a dual motor" truck (754 hp); the Hummer 3X has three motors. The cited sources don't give a usable figure: InsideEVs says "more than 200 kWh ... 24 modules", ~190 kWh usable from export math, and GCR says Max Range is "205 kWh pack" (bare, so gross). The repo's Silverado Max Range sibling is 204 (estimated), more than 1 % from 200. |
| | DC 350 kW | ✅ | "up to 350 kW" and "up to 100 miles in about ten minutes". |
| | AC 19.2 kW | ✅ | "19.2 kW onboard AC charger" in both InsideEVs articles. |
| | voltage 800v | ✅ | "runs at 400 V but can switch to an 800 V configuration for DC fast charging". |
| | range 440 mi → 708 km | ✅ | "up to 440 miles", GM's estimate. |
| | port ccs1 (estimated from the Silverado guide) | ✅ | Acceptable. |
| | market US only | ✅ | Supported but not cited by the batch ("Canada: not found"). Electric Autonomy and GM Canada (Oct 2024): Canada "debut for 2025" with Extended Range and Max Range. Search result: the Edition 1 "was not sold in Canada". |
| Sierra EV 2025 Denali Max Range | range 460 mi → 740 km | ✅ | GCR: "460-mile range", 205 kWh pack, 350 kW. The value matches GM Canada's 740 km. |
| | **market `["US"]`** | ❌ | Electric Autonomy (Oct 2024): Canada gets "2025" Sierra EV Denali in "Extended Range" and "Max Range", 628 km / 740 km, Max Range MSRP $119,699. The Canadian Max Range exists; the batch's "no NRCan row" is true (heavy truck), but US-only is wrong. |

## 3. Consumption

| Value | Result | Evidence |
|---|---|---|
| Escalade IQ 2025 highway 287 Wh/km (tested) | ✅ arithmetic | InsideEVs: "482.2 miles", "222.7 kWh", ~214.9 driving + 7.8 climate/prep, "GPS-measured 70 mph", ambient "into the eighties". 222.7 / 482.2 = 0.4619 kWh/mi → 46.19 kWh/100 mi → 287.0 Wh/km. Driving-only 214.9 / 482.2 = 277.0. The article rounds to "2.1 miles per kWh" (= 296); the batch's exact division is better. Trim and wheels not stated (the batch says so). |
| Escalade IQ 2026 and 2027, same 287 | ❌ | Brief rule: no estimated consumption. A tested value for a 2025 car attached to other model years is an estimate in effect. The 2027 car also has a new charger and a NACS port. The batch itself calls it "judgment call for the lead". |
| Hummer Edition 1 388 Wh/km (2022) | ✅ arithmetic | InsideEVs: "343 miles on the trip gauge", "1.6 miles per kWh (38.75 kWh/100km)", "constant 70 mph", "212.7 kWh of usable capacity", 70-78 F, 9,063 lb. 1.6 mi/kWh → 62.5 kWh/100 mi → 388.4 Wh/km; 38.75 kWh/100 km = 387.5. Consistent. 343 / 212.7 = 1.61. |
| Hummer 2023 Edition 1, same 388 | ⚠ | Same truck and the same 329 mi, so a reasonable carry-over. The kind remains `tested` for a different model year; treat like the Escalade rows. |
| Sierra 299 Wh/km, combined (2025 Max Range Denali) | ✅ arithmetic | 48.1 × 10 / 1.609344 = 298.9. |
| Sierra relay faithful? | ✅ | InsideEVs: "507 miles", "48.1 kWh per 100 miles, or 2.0 miles per kWh", "60/40 city/highway ... average 40 mph", 58 F, 24-inch wheels, "200-kWh plus Max battery pack". Jalopnik: "We measured consumption at 48.1 kWh/100 mi", "Max Range Denali", "only available with 24-inch wheels", ~60 % city / 40 % highway. Neither states the model year, so "2025" is not on the cited pages. Edmunds itself blocks fetches, so the original is unverifiable. |
| Sierra 2024 Denali Edition 1 gets 299 | ❌ | Edition 1 is a different spec (dual motor, "200+"). The batch admits "trim equivalence is the judgment call". |
| Basis mismatch across the three | ⚠ | 48.1 kWh/100 mi × 507 mi = 244 kWh, more than the 205 kWh pack, so Edmunds counts energy at the charger. The Escalade (222.7 kWh against about 205) and Hummer (trip gauge) figures sit closer to the pack side. Regulator figures on other cars are wall-to-wheels. State the basis in each note (see fix 6). |

## 4. Wheels

| Variant / trim | Value | Result | Evidence |
|---|---|---|---|
| IQL 2026: Luxury 22, Sport 22, Premium Luxury 24, Premium Sport 24 | all `is_standard` true | ✅ | Cars.com IQL: Luxury and Sport 22-inch, Premium Luxury and Premium Sport 24-inch. All four trims have a standard size. |
| Lyriq 2025 RWD: 20 in | ⚠ | Cars.com 2025 specs: "4dr Luxury w/1SC", 265/50R20, 20-inch aluminium. Only one of six trims is listed and its drivetrain is not stated. The note says so and `low_confidence` is set. |
| Lyriq 2025 AWD: 20 in | ⚠ | Same page; the AWD trim isn't shown, so unproven. `low_confidence` is set. |
| Sierra 2025 Denali Ext: 22 in | ⚠ | InsideEVs: "Denali: 22-inch (late 2024)", Edition 1 24-inch; it is forward-looking text. Jalopnik says "The Sierra EV Denali is only available with 24-inch wheels" and Edmunds' Max Range Denali had 24-inch wheels. The 2025 Extended Range Denali's size is not shown anywhere. Keep `low_confidence` and name the conflict. |
| Hummer 2022 / 2023 Edition 1, 2023 EV3X, Sierra 2024 Edition 1, Sierra 2025 Max Range | none entered | ❌ gap | The pages already cited give 18 in (MA, "305/70R18"), 22 in (KBB, EV3X), 24 in (InsideEVs Edition 1; Jalopnik/Edmunds Max Range Denali). The batch lists them in notes only, so these trims still have no wheels. |

The batch has wheels on 4 variants / 7 trims, not 6 variants.

## Required changes (numbered)

1. **`new_cars` Sierra 2025 Denali Max Range:** set `markets` to `["CA","US"]` and add CA names. GM Canada and Electric Autonomy (2025 Canadian Sierra EV Denali, Max Range, 740 km) show it was sold in Canada.
2. **`new_cars` Hummer 2023 Edition 1:** set `markets` to `["CA","US"]`; Canada got the 2023 Edition 1 pickup and not the 3X. The citing source (GM Authority) returned 403, so find a readable page, for example gmccanada.ca or Autosphere "GMC Estimates for the 2023 HUMMER EV Pickup". Keep 2022 and 2023 EV3X as US only, with the evidence cited. The `notes` line "Canada sale in 2022 not checked" should be closed or kept as a stated unknown.
3. **Lyriq 2024:**
   - Add a US name to the 2024 RWD and AWD `19-2-kw-charger` trims. EPA rates the US 2024 cars at 6.5 h / 6.7 h, which is the 19.2 kW time.
   - Resolve what the US `standard` trim means, so a US user isn't shown 11.5 kW only. For example, EPA's single row maps to the 19.2 kW trim; give the base trim no US name, or note the conflict.
   - Write the basis into the notes: NRCan 2024 lists both labels, EPA gives one unlabelled 6.5 / 6.7 h row.
4. **Lyriq 2023 (add to the batch):**
   - RWD: the single NRCan/EPA row is 6.5 h, which implies 19.2 kW. Set the powertrain `ac_max_kw` to 19.2, `estimated` from the charge hours with the Lyriq 2025 pairing (7.0 h at 19.2) as the basis. The repo currently has 11.5.
   - AWD: 10.7 h implies 11.5 kW (2025: 11.2 h at 11.5 kW).
   - These are the 2023 rows in `public/data/cars/cadillac/lyriq/2023/`, and the batch does not touch them.
5. **Sierra 2024 Denali Edition 1 `battery.capacity_usable_kwh` (200, estimated):** the Hummer 3X is three-motor and the Edition 1 dual-motor, so the "same pack, motors and charger" test fails. Re-base on the same-truck 2025 Max Range / Silverado Max Range pack, whose repo value is 204 (estimated), and say whether the source figure (GCR "205 kWh pack") is gross or usable. Or leave `low_confidence` with the mismatch stated. A 2 % difference from 204 exceeds the 1 % sibling tolerance.
6. **Consumption:**
   - Remove the 287 Wh/km from Escalade IQ **2026** and **2027** (a tested figure on other model years is an estimate in effect; the 2027 car also changed charger and port). Keep it on 2025 only.
   - Remove the Sierra 299 Wh/km from the **2024 Denali Edition 1**; keep it only on the 2025 Max Range Denali, and state in the note that the model year is not on the cited pages.
   - Hummer 2023 Edition 1 388 Wh/km: decide the same way, or keep it with the note that the 2022 test truck is the same truck.
   - In every consumption note, say whether energy is battery-side (Escalade, Hummer: trip gauge or pack) or at the charger (Edmunds, 48.1 kWh/100 mi × 507 = 244 kWh against a 205 kWh pack), since a 299 combined figure will sit beside EPA wall-to-wheels figures.
7. **Hummer 2022 `battery.preconditioning` (`automatic_and_manual`, estimated):** the guide was never readable, and TechLink documents only app preconditioning. Change to `manual_only` (TechLink: "apps can precondition the battery") or keep `automatic_and_manual` with a clear `low_confidence` that the nav trigger isn't shown for 2022. The Sierra 2024 estimate rests on the same unread guide and needs the same caution.
8. **Escalade IQ 2027 `ac_max_kw` (4 trims, kind `manufacturer`):** the batch's own note says GM did not announce it. Relabel to a non-manufacturer kind or `estimated`, citing InsideEVs and TTAC. For the IQ 2025 Luxury 2 / Sport 2 and 2026 Premium trims, add that Cars.com / InsideEVs are US sources. The variants carry CA names too, so the Canadian charger is unverified; either limit the note to US or mark it `low_confidence` for CA (the data already does).
9. **Celestiq (19.2):** GCC does not name GM. Mark the value as not manufacturer-stated (use `estimated` with the 8.0 h charge-time basis: 108.8 / 8.0 = 13.6 kW, matching the 19.2 kW Lyriq at 14.3 kW) or keep `manufacturer` only with a GM source. Also the batch notes "108.8 kWh pack" while GCC says 111 usable. Say which is used.
10. **Wheels (no unknowns):**
    - Add the sizes the cited pages already give: Hummer 2022 Edition 1 pickup 18 in (MA, 305/70R18), 2023 EV3X 22 in (KBB), Sierra 2024 Denali Edition 1 24 in (InsideEVs) and Sierra 2025 Denali Max Range 24 in (Jalopnik "only available with 24-inch").
    - Hummer 2023 Edition 1: carry 18 in from the 2022 page as `low_confidence`.
    - Sierra 2025 Denali Ext 22 in: keep `low_confidence`, quote the Jalopnik 24-in claim as a conflict.
    - Lyriq 2025 20 in (one trim of six): keep `low_confidence`, and state the AWD unconfirmed.
11. **Escalade IQL 2027 estimate:** keep it `estimated` and `low_confidence`, but correct the note. The cited InsideEVs and TTAC pages name the IQL only for the NACS port, not the charger, and the pack match is disputed (Cars.com "5 kWh larger" vs Wards "shared").

## Rules respected
- No iSeeCars or EVChargingStations source is cited in this batch.
- Edmunds is not worked around (read through InsideEVs and Jalopnik), and GM Authority (403) was not worked around.
- The batch edits no `data/` or `crosswalk/` files, and I applied nothing.
