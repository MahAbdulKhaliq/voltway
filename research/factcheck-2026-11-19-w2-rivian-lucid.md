# Fact-check: batch-2026-11-19-w2-rivian-lucid.json

Verdict: **FIX**. `--check` passes (1408 variants, 464 sources). The sourced values mostly hold. The estimates do not meet the rules in several places, Gravity Touring has required fields empty, and some kinds are wrong.

Scope: 139 powertrains. Rivian Gen 1 (2022-24) Large/Max/Standard/Standard+, Gen 2 (2025-26) Standard/Large/Max, 2027 Premium/Long Range/Performance/Quad, R2 Performance AWD, Lucid Air 2022-27 and Gravity 2025-27. Every powertrain id exists in `research/powertrain-gaps.json`.

Limits of this check:
- The seven Lucid spec-sheet PDFs (Pure/Touring/GT/Sapphire, 2024/2025) could not be read. They are Flate-compressed. Marked unverifiable.
- evkx, Edmunds and archive.org were not used. The Recharged page returned HTTP 410.
- One value was seen only in a search excerpt: the 11.5 kW Gen 2 AC figure (Green Car Reports "48 amps (11.5 kw)", plus a greencarscompare snippet).

## Fan-out check

- The Gen 1 / Gen 2 split at MY2024 / MY2025 matches the cited sources.
  - Gen 1 pack sizes: Standard 105.9, Standard+ 121, Large 135, Max 149.
  - Gen 2 usable: Standard 92.5, Large 109.4, Max 141.5.
- Gen 1 values do not leak into Gen 2. Gen 2 has no gross values, which is fine.
- Each Rivian powertrain covers a single year. CA and US markets share a powertrain, and the port and Supercharger access are sourced from the Canadian-locale Rivian page, so that is acceptable.
- Rivian `large-plus-pack` powertrains (2025/26) are mapped to the Gen 2 Large pack (109.4). No cited page mentions a "Large+" Gen 2 pack. GCR lists only Standard/Large/Max for Gen 2. The Gen 1 "Standard+" naming is not the same thing. Unproven mapping, so flag it.
- The Lucid Air pack per trim and year is mostly consistent: Pure 84-88, Touring 92, GT 111-117, Sapphire/Dream 118. The mapping rests on sheets I could not read, plus the Lucid battery-data page. That page gives only module counts (16M Pure, 18M Standard, 22M Extended/Sapphire) and no kWh.

## Table (representative; the grouped rows cover every powertrain listed)

| Powertrain(s) | Field | Value | Result | Evidence |
|---|---|---|---|---|
| Gen 1 Large (18 ids) | dc_max_kw | 210 M | ✅ | InsideEVs 554265: EPA filing, 210 kW, 135 kWh pack. |
| Gen 1 Large | gross | 135 M | ✅ | InsideEVs debut: Large 135 kWh. |
| Gen 1 Large | usable | 128.7 E | ❌ basis | Ratio 0.953 comes from the Max pack (Wikipedia "revised to 142kWh usable", 149 rated). The notes say "same 2170 NCA format", but the batch's own autoevolution source says Max uses 53G cells and Large 50G, so not the same cell. The InsideEVs 554265 page about the Large pack itself says usable is 5-7.5% lower, about 125-128 kWh. 128.7 sits outside that. Use a figure from that page's range (about 126-128) with that page as the basis, or drop. |
| Gen 1 Large | chemistry | nca M | ⚠ | autoevolution says 50G NCA cells. The InsideEVs debut calls Gen 1 "NMC", and GCR says NCA. Conflict noted in the batch. Only autoevolution, a press site, backs "manufacturer" here. |
| Gen 1 Max (8 ids) | usable | 142 M | ✅ | Wikipedia: "revised to 142kWh usable capacity". The page does not say who stated it. |
| Gen 1 Max | gross | 149 M | ✅ | InsideEVs debut: "the Max battery was rated for 149 kWh". |
| Gen 1 Max | dc_max_kw | 210 E | ❌ | Estimated from the 135 kWh Large pack. The rules reject a different pack. No page gives a Max figure. A search shows forum claims of 215 kW and EVKX 207 kW (blocked site, not used). |
| Gen 1 Standard (3) | usable | 100 E | ❌ basis | 105 x 0.953, with the ratio from the Max pack. No same-cell proof. Gross is 105 here, but InsideEVs says 105.9. |
| Gen 1 Standard | gross | 105 M | ⚠ | The cited page says 105.9 (from leaked data); Wikipedia says 105. Use 105.9 with that page, or cite Wikipedia for 105. |
| Gen 1 Standard | chemistry | nmc E | ✅ weak | InsideEVs: Gen 1 "outgoing NMC units". Estimate is acceptable; label E is right. |
| Gen 1 Standard | dc_max_kw | 210 E | ❌ | Different pack, as for Max. |
| Gen 1 Standard+ (4) | usable | 115.3 E | ❌ basis | 121 x 0.953, Max-pack ratio, same problem. |
| Gen 1 Standard+ | gross / chem | 121 M / nmc M | ✅ / 🏷 | InsideEVs: "Standard+ had 121 kWh". The page says NMC for the outgoing generation as a whole and is leaked-data press, not a maker statement. A defensible label would be E. |
| Gen 1 Standard+ | dc_max_kw | 210 E | ❌ | Different pack. |
| Gen 1 (all) | ac_max_kw | 11.5 M | ✅ | InsideEVs 554265: 11.5 kW onboard charger (EPA). |
| Gen 1 (all) | volt | 400v M | ✅ | InsideEVs 554265: 216-459 V. This is the Large pack. It is reasoned onto the others, but the voltage window is a platform-level fact, so acceptable. |
| Gen 2 Standard (2) | usable 92.5, dc 200, chem lfp | M | ✅ | GCR: "92.5 kWh usable", LFP, peak 200 kW. |
| Gen 2 Large (16+16) | usable 109.4, chem nca | M | ✅ | GCR: 109.4 kWh usable, NCA 2170. Conflicts (autoevolution NMC, 108.5 snippet, 2027 press 105.5) are noted in the batch. |
| Gen 2 Max (10+14) | usable 141.5, dc 220 | M | ✅ | GCR: 141.5 kWh, 220 kW on Large and Max. |
| Gen 2 Large | dc_max_kw | 220 M | ⚠ | InsideEVs 761495 (the batch's own precond source): software 2025.18 "will see an improved peak charge rate of 215 kilowatts" for the Gen 2 Large. That contradicts a 220 kW peak, or at least raises doubt. The batch mentions it in the notes. State which one the maker supports. Needs an owner call. |
| Gen 2 (all) | ac_max_kw | 11.5 E | ❌ basis / fixable | The batch says "same as Gen 1" and "no Gen 2 page found". Gen 2 changed the drive units and electronics, so that estimate basis is not valid. But GCR (already a batch source) reads "48 amps (11.5 kw)" for 2025 in a search excerpt. Cite GCR and use `manufacturer` (check the page text first). |
| Gen 2 (all) | volt | 400v E | ✅ weak | No source for Gen 2 voltage. Large and Max "continue to use the same 2170 cells" (InsideEVs debut) and the peak (200-220 kW) is inside the Gen 1 window. Plausible; keep as E. |
| 2027 R1 (12+4) | usable / chem / dc / ac | E | ⚠ | "Assumed unchanged from 2026" is allowed in principle. But the 2027 EPA article (autoevolution) names 105.5 and 140 kWh, not 109.4 and 141.5, and does not say gross or usable. The batch records 141.5 / 109.4 anyway, so the pack may have been revised. Unproven; keep low_confidence and note it. |
| Rivian (all) | preconditioning | automatic_and_manual M | ✅ | InsideEVs 761495: 2025.18 lets owners "manually precondition the high-voltage battery pack"; "no longer be forced to use the car's built-in navigation". Both halves are shown, Gen 1 and Gen 2. The batch quotes "prepare for fast charging", which is not on the page, so fix the notes. |
| Rivian 2022-25 | charge_port ccs1 / via_adapter | M | ✅ | Rivian: model years 2022-2025 CCS and need a NACS adapter. |
| Rivian 2026+ | nacs / yes | M | ✅ | Rivian: "Starting in model year 2026 and onward... NACS". |
| R2 | gross 94 M | 94 | ⚠ | Battery Design: "Total pack energy 94 kWh"; the page is a reverse-engineering blog, not the maker. Label should be E or `community`-sourced with note. |
| R2 | usable 87.9 M | 87.9 | ✅ | Battery Design: "87.9 kWh" usable; The Drive: "87.9-kWh battery pack". EPA-certified usable is 86.8; noted. |
| R2 | chemistry | nmc E | ✅ | Battery Design: NCMA 4695 LG, reverse-engineered. E is right. |
| R2 | voltage | 400v M | ✅ | InsideEVs: "400-volt battery architecture". Battery Design: 353 V. |
| R2 | dc_max_kw | 217 M | 🏷 | Electrek: "seems capable of a peak DC rate of 217kW", from EPA certification data, not a maker statement. Battery Design says 230 kW; InsideEVs measured 229 kW ("peaked at 229 kW"). The three do not agree. See fix 7. |
| R2 | published_10_80_min | 29 M | ✅ | Electrek: "Rivian previously told us... 10-80% in 29 minutes". |
| R2 | preconditioning | automatic_and_manual E | ⚠ | Rivian charging page only says "preconditioning the battery to heat... cool". No R2 navigation or manual trigger is stated. A lineup-wide claim is possible for R1, but the R2 runs a new software stack. Weak. Keep E with low_confidence, or leave unknown with a note. |
| R2 | ac_max_kw | 11 E | ⚠ | Basis is the Wall Charger rating ("Up to 11kW"), which is the wall unit, not the onboard charger. Not a valid basis. Nothing else was found. |
| R2 | charge_port / supercharger | nacs / yes M | ✅ | Rivian: R2 has NACS; The Drive: NACS port. |
| Lucid Air Dream Edition (2) | usable 118 E, gross 118 M | | ✅ | InsideEVs: Lucid told them 118 is "both usable and total". |
| Lucid Air 2022 GT | usable 112 M | | ✅ | InsideEVs: "112 kWh usable battery capacity". |
| Lucid Air Sapphire (2024/25/26/27) | usable 118 E | | ✅ | Same 22-module 118 kWh pack as the Dream Edition. Acceptable same-pack basis. |
| Lucid Air 2023 GTP | usable 109.1 E, gross 112 E | | ⚠ | Notes cite the ArenaEV page for a 2022 GTP. Contradicts the 2022 GT 112 "usable" row on the other powertrain. Also applies a 2022 value to 2023 with "no change found". Weak but allowed as E. Resolve against the GT row. |
| Lucid Air Pure / Touring / GT (usable) | usable = bare capacity E | | ❌ basis | "Lucid told InsideEVs the 118 kWh pack is both usable and total" covers the 118 pack, not the Pure (84/88), Touring (92) or GT (111/117) packs. The notes concede "Battery Design puts the 112 pack at about 98 % usable", which argues the other way, and that source is not in the batch. The rule needs a ratio for that pack or a same-cell sibling. Not met. Rule violation, or relabel as an explicit unverified assumption. |
| Lucid Air 2023-24 Touring / 2025 Touring / Pure / GT dc | 250 / 250 / 300 | M or E | ⚠ unverifiable | Spec sheets unreadable. Evercars (readable) says Pure 250, Touring 250, GT 300. Electrek says the Touring "remains 250 kW". Consistent with the notes. |
| Lucid Air (all) | volt 800v | M or E | ✅ | InsideEVs: ">900 V battery system"; Evercars "900V (up to 924 V)". |
| Lucid Air (all) | ac_max_kw 19.2 M | | ✅ | Lucid charging page: "AC charging peaks at 19.2 kW". Page is en-us (the batch cites the en-ca page for the same figure; not re-read). |
| Lucid Air (all) | preconditioning | automatic_and_manual M | ✅ | Lucid page: manual "Start Preconditioning" and Smart Preconditioning on routing to a fast charger. Both shown. |
| Lucid Air | charge_port ccs1, via_adapter | M | ✅ | Lucid: combined J1772 (CCS1); NACS-to-CCS1 adapter required. |
| Lucid Air 2027 | charge_port ccs1 E | | ⚠ | Estimated. The Electrek 2026 article does not state the port either way. Fine as an estimate, but nothing positive supports 2027. |
| Lucid chemistry (all pre-2026) | nmc E | | ✅ | Lucid battery data gives only the "Li MM(NRMC)" code and the pack cell names (2170N, 50GV2). "Read as NMC" is a reasonable estimate. The 2026+ `manufacturer` label on that code is too strong, since the page does not decode it; use E. |
| Gravity GT (2025, 2026, 2027) | gross 123 M | | ✅ | Wards: "compact 123-kWh battery"; KBB: Grand Touring 123 kWh. Wards does not name the trim. KBB does. |
| Gravity GT / Dream | usable 123 E | | ❌ basis | Extends the 118 Air statement to the 123 Gravity pack. Different pack. Not an allowed basis. |
| Gravity GT | dc_max_kw 400 M | | ✅ | Wards: "speeds up to 400 kW"; Lucid Gravity page: 200 miles in 10.5 min at 400 kW. |
| Gravity Dream 2026 | dc 400 E | | ✅ | Same 123 kWh pack as GT (KBB). Good same-pack basis. |
| Gravity (all) | ac 19.2, nacs, yes, precond both | M | ✅ | Lucid Gravity page: "native NACS charge port"; "charge at up to 19.2 kW"; manual button and smart preconditioning. |
| **Gravity Touring 2026 / 2027** | usable, gross, dc_max_kw | **missing** | ❌ | Required fields left empty. KBB lists the Touring battery as "N/A", and Wards gives no Touring pack size. Rule 14 (no unknowns). |

## Answers to the brief's questions

- **Usable-from-ratio estimates:** The rule needs a ratio for that pack or a same-cell sibling. The Max ratio (0.953) is applied to the Large, Standard and Standard+ packs. Cell format differs for the Large (50G vs 53G, per the batch's own source). It is unproven for Standard and Standard+, whose cells no source names. The best fix for the Large pack is InsideEVs 554265, which gives a range for that pack itself.
- **Gen 1 Standard/Standard+/Max DC 210 from the Large pack:** Not allowed. Rule 5 rejects estimates from different packs. Note also that the Gen 1 Max forum claims run 207-215 kW and that the 2025.18 software raised the Large to 215 kW. None of this is a maker figure. The fix list below asks for a replacement basis or "unknown with attempts listed".
- **Lucid "usable = gross" reasoning:** Valid only for the 118 kWh pack (Dream, Sapphire). Invalid for the other Air packs and the 123 kWh Gravity pack.
- **R2 DC 217 vs 230:** 217 is an EPA-data inference (Electrek, "seems"), 230 is a reverse-engineering blog's figure (Battery Design), and 229 is an independent measured peak (InsideEVs). No maker figure exists. 217 is labelled `manufacturer`, which is wrong.
- **Kinds / low_confidence:** `low_confidence: true` is set on all powertrain fields, which is conservative and fine. Mislabels are in the fix list.

## Numbered fix list

1. Gen 1 Large usable (18 ids): 128.7 falls outside the 125-128 kWh range on the InsideEVs 554265 page, which is for that pack. Re-base the estimate on that page (stated 5-7.5% below 135), or drop the Max-ratio basis. The cell-format difference (50G vs 53G) in the batch's own notes breaks the "same-cell sibling" rule.
2. Gen 1 Standard (3 ids) and Standard+ (4 ids) usable (100 / 115.3): the Max ratio is not a same-cell basis. Find a ratio or discharge figure for those packs, or mark the field unknown and list what was tried.
3. Gen 1 Standard/Standard+/Max dc_max_kw 210 (15 ids): drop. Estimates from the Large pack are a different-pack estimate. Find a source for each pack (EPA/Rivian paperwork, tests) or record unknown with attempts listed.
4. Gen 1 Standard gross: 105 vs the cited page's 105.9. Use 105.9 for that page, or cite Wikipedia for 105. Gen 1 Standard+ chemistry: relabel `manufacturer` as `estimated`.
5. Gen 2 Large dc_max_kw 220: InsideEVs 761495 says the 2025.18 update raised the Gen 2 Large to 215 kW. Reconcile (is 220 right, or 215?) and drop `manufacturer` if the maker's number is not found. Also correct the preconditioning notes, which quote "prepare for fast charging", a phrase that is not on the page.
6. Gen 2 ac_max_kw 11.5 (all Gen 2 and 2027 ids): the "same as Gen 1" basis crosses a hardware change. Replace it with the GCR citation "48 amps (11.5 kw)" (seen only in a search excerpt; reopen the page and quote it), as `manufacturer` or as `estimated` with that basis.
7. R2 dc_max_kw: change 217 from `manufacturer` to a non-maker kind (regulator-derived, "seems capable"), add the measured 229 kW as `tested` (InsideEVs), and note the 230 kW Battery Design figure. Decide which is the display default. Owner call.
8. R2 ac_max_kw 11 E: the Wall Charger rating is not an onboard-charger basis. Find the R2 onboard charger rating or mark unknown with attempts listed. R2 gross 94: relabel from `manufacturer` to `estimated` or a labelled non-maker kind (Battery Design is a blog). R2 preconditioning: the cited page does not name an R2 trigger; downgrade or find an R2 source.
9. 2027 R1 (16 ids): the 2027 EPA article gives 105.5 / 140 kWh and no gross/usable label. Note that conflict in the values, or find the 2027 usable figures. Keep E and low_confidence.
10. Rivian `large-plus-pack` (2025/2026, R1S and R1T): no page shows a Gen 2 Large+ pack. Confirm the NRCan label maps to the Large pack (109.4) before applying.
11. Lucid Air Pure, Touring, GT usable (about 14 ids): "usable = gross" is proven only for the 118 kWh pack. Provide a ratio for each pack (for example the Battery Design ~98% figure, which would have to be added as a source) or a same-cell sibling, or mark as unknown. Also reconcile the 2023 GTP (109.1 usable / 112) with the 2022 GT (112 usable).
12. Lucid Gravity GT/Dream usable 123 E (2025, 2026 Dream, 2027): the 118-kWh statement is for the Air pack. Not valid for a different pack. Find a Gravity usable figure or a pack-specific ratio.
13. **Lucid Gravity Touring 2026 and 2027: usable and dc_max_kw are empty, and so is gross.** Required fields (rule 14). Research the Touring pack (KBB lists "N/A", Wards names no Touring pack size). Mark unknown with attempts listed if still unavailable.
14. Lucid Air 2026+ chemistry: the label `manufacturer` for "Li MM(NRMC)" reads a code the page does not decode. Relabel `estimated`.
15. Lucid spec sheets: the seven PDFs could not be read. Re-verify the 84/88/92/111/117/118 kWh, 250/300 kW and voltage values from readable text before applying. Those rows are unverifiable, not wrong.
