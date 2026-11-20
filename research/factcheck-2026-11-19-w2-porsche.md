# Fact-check: batch-2026-11-19-w2-porsche.json

Verdict: **FIX** (no systematic problems; the Taycan and Macan fan-out is right, but a few labels, one estimate and some source ids need changes).

`npx tsx scripts/add-facts.ts research/batch-2026-11-19-w2-porsche.json --check` passes. The batch has 112 powertrains, matching the 112 Porsche entries in `research/powertrain-gaps.json`, with none missing and none extra. All 8 required fields are present on every powertrain; `published_10_80_min` is on 63 of them, which is allowed because it is only filled when a page states it.

## Fan-out (ids against packs)

- **Taycan 2020-2024.** Ids named "Performance Battery" (4S) get 79.2 / 71 kWh and 225 kW. Every other id gets 93.4 / 83.7 kWh and 270 kW. That covers Plus, Turbo, Turbo S, all Cross Turismo trims and GTS. This matches the Porsche 2021 page: 225 kW for the Performance Battery, 270 kW for the Plus.
- **Taycan 2025.** The two ids named "4S Performance Battery" (CA+US and `-us`) get 89 / 82.3 kWh and 270 kW. Every other id gets 105 / 97 kWh and 320 kW. The 89/105 split is right. InsideEVs lists 105 kWh for Turbo, Turbo S, Turbo GT, Weissach and all four Cross Turismo trims, and the batch applies that.
- **Taycan 2026.** "4 Performance Battery" and "4S Performance Battery" get 89 kWh (estimated). Everything else gets 105 kWh. This is correct.
- **Taycan 2027.** All ids get 105 kWh and NACS. The only Weissach car, which would be the exception, has no 2027 id, so nothing is wrongly given NACS. The MY2027 Turbo GT (non-Weissach) gets NACS, which is consistent with the page.
- **Macan and Cayenne.** One pack each (100 / 95 kWh and 113 / 108 kWh), applied to every id. This is consistent with the Porsche pages.

## Value table (hardware generation, then fields)

| Generation (ids) | Field | Value | Result | Evidence |
|---|---|---|---|---|
| Taycan 2020-24 Plus | gross 93.4, DC 270 | manufacturer | ✅ | Porsche 2021 page: "Its gross capacity is 93.4 kWh"; "up to 270 kW (Performance Battery Plus)" |
| Taycan 2020-24 Performance Battery (4S) | gross 79.2, DC 225 | manufacturer | ✅ | Porsche 2021 page: "gross capacity of 79.2 kWh"; "up to 225 kW" |
| Taycan 2020-24 | usable 83.7 / 71 | manufacturer, low_confidence | ✅ (see 3) | Wikipedia lists 83.7 / 71.0 usable; usable is not on any Porsche page |
| Taycan 2020-24 | chemistry nmc | estimated | ⚠ | Only The Weekly Driver (third-party) says NMC; Porsche's battery page does not name the chemistry; the basis is weak (see 5) |
| Taycan 2020-24 | AC 9.6 | estimated | ⚠ | The page states 9.6 kW for the 2025 car ("9.6 kW"). Backward estimate within one generation; the 2021 Porsche page and Wikipedia mention 22 kW and 19.2 kW options (see 4) |
| Taycan 2020-24 | preconditioning automatic_with_navigation | **manufacturer** | 🏷 | Planner page: preconditions the battery, "not triggered manually", needs route guidance. The range-planner page: "regulates the preconditioning of the battery in good time before the charging stop". Two pages combined, so it should be estimated, naming both (see 1) |
| Taycan 2025 Plus (105) | gross 105, DC 320 | manufacturer | ✅ | Porsche US: "gross capacity of 105 kWh, increased from 93 kWh"; "up to 320 kW" |
| Taycan 2025 Plus | usable 97, AC 9.6 | manufacturer, low_confidence | ✅ | InsideEVs table: 97.0 usable, 9.6 kW |
| Taycan 2025 Plus | 10-80 = 18 min | manufacturer | ✅ | Porsche US: "takes just 18 minutes" (pack not named); InsideEVs: 18 min for both packs |
| Taycan 2025 GTS and GTS Sport Turismo | gross 105 | manufacturer, low_confidence | ⚠ unverifiable | InsideEVs says "GTS not mentioned"; Porsche US lists no GTS; Wikipedia does not name the 2025 GTS pack. The note says "per press (not opened)" |
| Taycan 2025 4S Performance Battery (89) | gross 89, usable 82.3, DC 270 | manufacturer | ✅ | InsideEVs table: "89.0 gross, 82.3 usable, 270 kW" |
| Taycan 2025 4S Performance Battery (89) | 10-80 = 18 | manufacturer, `source_id` = Porsche US | ❌ (see 2) | The Porsche US page does not name the pack or mention an 89 kWh pack; only InsideEVs gives 18 min for the base pack |
| Taycan 2026 (89 and 105) | all | estimated from 2025 | ✅ | Basis stated: same generation, no change found |
| Taycan 2027 | gross 105, port NACS | manufacturer | ✅ | MY2027 page: "Performance Battery Plus (105 kWh) now standard"; passenger-side DC port NACS, J1772 AC |
| Taycan 2027 | usable, DC 320, 10-80, AC | estimated | ✅ | Same pack as 2025. The page prints "320 kWh", a unit typo, and the note says so |
| Taycan 2027 | supercharger yes | estimated | ✅ | Native NACS plus the MY2025 programme; low_confidence |
| Taycan 2020-26 | port ccs1, supercharger via_adapter | manufacturer | ✅ | Porsche US: "CCS-equipped" Taycan; adapter included MY2026, free MY2025, $185 older |
| Taycan 2020-24 | adapter price, Canada | | ❌ (see 7) | Porsche CA page: older MSRP "$250"; the note says "C$250", which is fine. The note's US figure of $185 comes from a separate page and was not rechecked |
| Macan 2024-26 Macan 4, Turbo, GTS | 100 / 95 kWh, NMC 8:1:1, 800 V, 270 kW, 21 min | manufacturer | ✅ | Porsche GTS press kit: "gross energy capacity of 100 kWh"; "up to 95 kWh"; "8:1:1"; "up to 270 kW"; "about 21 minutes" |
| Macan | usable 95 | manufacturer, `source_id` = InsideEVs | ✅ (see 6) | InsideEVs says 95; Porsche's kit says the same |
| Macan | AC 9.6 | manufacturer (2024, 2025) / estimated (2026+) | ✅ | InsideEVs: 9.6 kW US. Porsche's kit says up to 22 kW, which is the European option. Note records this conflict |
| Macan | preconditioning automatic_with_navigation | manufacturer | 🏷 | Porsche: "Thermal preconditioning is possible through the Porsche Charging Planner". US planner page: needs route guidance, not manual. Two pages combined, so it should be estimated (see 1) |
| Macan 4S / base Macan (2025-27) | gross, usable, DC, 10-80 | estimated from the 4, Turbo and GTS | ✅ | Same pack and 270 kW stated for three trims |
| Macan 2024-26 | port ccs1, adapter | manufacturer | ✅ | Porsche US/CA: "CCS-equipped ... Macan Electric", adapter free to existing owners |
| Macan 2027 | port ccs1, supercharger via_adapter | estimated, low_confidence | ⚠ | Nothing found for MY2027; assumption disclosed. If MY2027 Macan has NACS this is wrong (see 8) |
| Cayenne (all 10 ids) | gross 113 | manufacturer | ✅ | Porsche US: "gross energy capacity of 113 kW" (typo for kWh); the HV page says 113 kWh |
| Cayenne | usable 108 | manufacturer, low_confidence | ✅ | InsideEVs: "108-kilowatt-hour (usable)". Not on a Porsche page |
| Cayenne | DC 400, 10-80 under 16 min | manufacturer | ✅ | Porsche US: "up to 400 kW"; "less than 16 minutes" |
| Cayenne | NMC, 800 V | manufacturer | ✅ | HV page: "Nickel-manganese- cobalt-aluminium (NMCA)"; "800-volt architecture" |
| Cayenne | port nacs | manufacturer | ✅ | Porsche US: J3400 DC-only driver side, J1772 AC-only passenger side, "all Cayenne Electric models" |
| Cayenne | supercharger yes | estimated, low_confidence | ✅ | Native NACS; the Porsche supercharger programme pages do not name the Cayenne. Basis is stated |
| Cayenne | **AC 9.6** | estimated from Macan | ❌ (see 9) | Different pack (113 vs 100 kWh) and not proven the same charger. The note itself lists conflicting 11 and 19.2 kW and a European 22 kW |
| Cayenne | preconditioning automatic_with_navigation | estimated | ❌ (see 10) | Note says "Porsche says the Cayenne has predictive thermal management"; the HV page says nothing of the kind ("does not mention preconditioning"). Porsche US names only Track-mode preconditioning. The US planner page lists only Taycan and Macan |
| Cayenne Coupe ids | all | | ⚠ | Porsche says the S battery is shared with "the other two current Cayenne Electric models" (base and Turbo). The Coupe is not covered; the same pack is assumed |

## Required changes

1. **Preconditioning, Taycan (all 99 ids) and Macan (all 16 ids): change `kind` from `manufacturer` to `estimated`.** The value is a combination of two pages that each cover half. Name both in the notes: the Charging Planner page ("preconditions the battery", needs route guidance, not manual) and the range-planner page or the Macan press kit ("regulates the preconditioning ... before the charging stop"; "Thermal preconditioning is possible through the Porsche Charging Planner"). Keep `low_confidence` off or on at your discretion. The value `automatic_with_navigation` itself is correct.
2. **Taycan 2025 and 2026 89 kWh ids, `published_10_80_min`:** change `source_id` to `src-insideevs-taycan-2025-specs`. That page gives 18 min for both packs; the Porsche US page does not name the pack. Keep `low_confidence`.
3. **Taycan usable kWh (2020-24 and 2025+):** `manufacturer` kind from Wikipedia and InsideEVs is not Porsche's own figure. Either set `kind: community`, or find a Porsche page. Since the repo rule treats relayed manufacturer figures as `manufacturer`, this is acceptable only if the Wikipedia/InsideEVs numbers are known Porsche figures; they are (82.3 and 97 come from Porsche's release), so I accept it with `low_confidence`, as already set. No change needed unless you prefer to relabel.
4. **Taycan 2020-24 `ac_max_kw` 9.6 (estimated):** the basis is a 2025 US table plus a calculation from a retrofit page, and the 2021 Porsche page says "up to 22 kW" onboard charger. Strengthen the note to say that 9.6 kW is the standard US charger and 19.2/22 kW are options, and keep `low_confidence`. If you can't find a 2020-24 page stating the standard charger, leave it as is.
5. **Taycan and Macan chemistry:** the Taycan `nmc` rests on one third-party site. It is flagged estimated with `low_confidence`, which is acceptable. No change.
6. **Macan usable 95:** change `source_id` to `src-porsche-macan-gts-battery` (it states "up to 95 kWh of its gross energy capacity of 100 kWh is actively used") instead of InsideEVs.
7. **Notes only:** Taycan supercharger adapter price. The Canada page says an "$250" MSRP for MY2024 and older; the batch note says "C$250". Fine. The US figure of $185 was not rechecked on the page I opened (the page I opened was the US page and gave no price I could confirm); verify it or drop the dollar figure from the notes.
8. **Macan 2027 `charge_port` ccs1 and `supercharger_access` via_adapter (estimated):** the Porsche MY2027 Taycan release announces NACS for the Taycan only. Search once for a Macan MY2027 statement. If none, keep as disclosed with `low_confidence`.
9. **Cayenne `ac_max_kw` 9.6: drop the estimate** for all 10 ids. The estimate rule needs a sibling with the same pack, motors and charger hardware; the Macan has a 100 kWh pack, and the batch's own note lists conflicting figures (11 / 19.2 kW US dealers, 22 kW Europe). Find a Cayenne source (Porsche US or Canada configurator, Monroney, or press) or report the field as missing to the owner.
10. **Cayenne preconditioning estimate:** correct the note. Remove the claim that "Porsche says the Cayenne Electric has predictive thermal management" (not on the page cited). State the true basis: US planner page lists Taycan and Macan Electric only; Porsche US names Cayenne preconditioning in Track mode only. If you can't find a Cayenne planner or preconditioning statement, report it as missing.
11. **2025 and 2026 GTS and GTS Sport Turismo `capacity_gross_kwh` 105 (manufacturer):** no opened page states the GTS pack for 2025 or later; the batch says it relies on a press listing it did not open. Either cite a page that states it, or change to `estimated` with the basis "GTS shares the 2025 refresh pack with the rest of the range" and keep `low_confidence`. All dependent values (97 kWh, 320 kW, 18 min, AC) should follow the same kind.

## Unverifiable or not checked

- Taycan 2025 GTS pack (see 11).
- Cayenne Coupe Electric pack and ports are covered by "all Cayenne Electric models" for ports only.
- Plug & Charge claim for Cayenne in the supercharger note was not found on the pages I read.

No curves are in this batch. No wheels are in this batch.
