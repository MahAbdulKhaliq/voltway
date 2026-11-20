# Check: batch-2026-11-20-b113-bmw-mercedes.json (heat pumps, 42 trims)

**Verdict: FIX.** `--check` passes ("batch is valid"). 13 original i3 entries and the iX5 entries are supportable (keep, with the corrections below). The 8 Spectre, 10 EQB, 3 G 580 and 2 AMG GT entries and the 4 Neue Klasse estimates (iX4, i3 sedan) should be dropped: their only evidence is an ArenaEV "Yes" or a chained estimate, and I found direct proof that neither shows "standard".

## Systematic findings
1. **ArenaEV "Heat pump: Yes" does not mean standard.** ArenaEV lists "Heat pump: Yes" for the BMW i3 120 Ah (2019-2022, https://www.arenaev.com/bmw_i3_120_ah_2019-specs-34.php), a car where the heat pump was a paid option: $150 code 4T9 in the US (CarGurus 2019 and 2021 trim pages) and EUR 570 in Italy. "Yes" therefore means "fitted or available", and the batch's "read as standard" is not supported. It also fits the one ArenaEV-only EQB line and the G 580 Nordic "optional" snippet. Every entry whose only source is ArenaEV fails the brief's rule that a source silent on standard vs optional doesn't prove it.
2. **Markets can differ for the heat pump.** The i3 was a paid option in Italy while BMW US listed it STD in 2014-2017. Canada was not checked for any i3, EQB, G 580, Spectre or AMG entry (these cars list CA in `markets`). The batch marks most of them `low_confidence`, which is right.
3. **No Mercedes or Rolls-Royce maker page opened.** media.mbusa.com and media.mercedes-benz.ca returned 404 for me too. A search result lists a Mercedes media release ("the-new-eqb-family-size-electric-mobility") that reportedly says thermal management with heat pump is standard. I could not open it. The researcher should find a working copy of that release; it would turn the EQB entries into a maker-sourced value.

## Table
| Variant | Field | Value | Result | Evidence |
|---|---|---|---|---|
| bmw/i3/2014/i3-60-ah | heat_pump | standard / manufacturer | ✅ value, ❌ note | pdftotext of the PDF (BMW US MY2014, eff. 12/23/2013): "4T9 Heat pump  STD  STD". The i3 column AND the i3 with Range Extender column are both STD, so the note "Range Extender column is blank" (also in the source notes) is wrong. The value for this BEV is right. Source `type` should be `oem` (BMW document, just hosted on autoevolution), not `community`. |
| bmw/i3/2015/i3-60-ah | heat_pump | standard / estimated | ✅ | Same model and generation, no change between the 2014 and 2016 guides; both verified STD. Basis stated, years named. Keep. |
| bmw/i3/2016/i3-60-ah | heat_pump | standard / manufacturer | ✅ | MY2016 guide (eff. 9/9/2015): "4T9 Heat pump  STD  STD". Canada unchecked; low_confidence present. |
| bmw/i3/2017/i3-60-ah | heat_pump | standard / manufacturer | ✅ | "Pricing Guide i3 60 Ah Lower Range, MY2017, eff. Aug 1 2016": "4T9 Heat pump  STD". |
| bmw/i3/2017/i3-94-ah | heat_pump | standard / manufacturer | ✅ | "i3 94 Ah (i01), eff. April 1 2017": "4T9 Heat pump  STD  STD". |
| bmw/i3/2018/i3-94-ah | heat_pump | standard / estimated | ✅ (weak) | Basis is the same 94 Ah car as MY2017 (verified STD) plus GCF "all units made before the 2019 model year". Acceptable estimate. A BMW US MY2018 guide would settle it (not found). Keep, low_confidence. |
| bmw/i3/2018/i3s-94-ah | heat_pump | standard / community | ✅ (weak) | GCF: "all units made before the 2019 model year came with a heat pump." No i3s-specific page. Keep as community/low_confidence (could also be labelled estimated). |
| bmw/i3/2019/i3-120-ah, 2019/i3s, 2020 x2, 2021 x2 | heat_pump | optional / community | ✅ (better than the batch says) | GCF: "In 2019, it became an optional thing." Independent corroboration the batch did not cite: CarGurus 2019 and 2021 US trim pages list "4T9 Heat Pump $150" on 120 Ah RWD and 120 Ah s RWD, and not on the REx trims. 2020 sits between two verified years. Keep. Optional: add the CarGurus pages as sources (check its terms first; it is not on the banned or the allowed list). Note GCF is wrong that no REx had it (BMW's own 2016/2017 guides show STD for REx), so keep the CarGurus corroboration. |
| bmw/ix5/2027/60-xdrive and -2 | heat_pump | standard / manufacturer | ✅ weak | NetCarShow: "Battery-electric BMW iX5 variants feature a model-specific climate system with highly efficient heat pump technology." Bimmerfile: "The iX5 uses a dedicated heat pump climate system." Both say every BEV iX5 has it, and neither lists it in the Climate Package. NetCarShow places the sentence right after the optional Climate Package, so it isn't explicit. Keep with low_confidence (kind manufacturer is fine, press text relayed). Soften the notes to say the standard reading is an inference. |
| bmw/ix4/2027/50-xdrive and -2 | heat_pump | standard / estimated | ❌ | Basis fails: the cited EVMagz page (opened) says the iX3 40 "remains nearly identical to the iX3 50 xDrive" about looks (Germany), not about standard equipment, and no BMW page I opened (BMW global or Americas iX3 releases) mentions a heat pump. The batch chains to `src-b112-evmagz-ix3-40`, which is itself an estimate for the iX3 50 xDrive. An estimate from an estimate is not allowed. DROP. |
| bmw/i3-sedan/2027/i3-50-xdrive and -2 | heat_pump | standard / estimated | ❌ | Same chain, plus a false claim: notes say "same pack (112.2 kWh usable)" but `public/data/cars` has the i3 sedan at 108.7 kWh usable (iX3 and iX4: 112.2). Not the same pack. DROP. |
| rolls-royce/spectre/2024, 2025, 2026 spectre | heat_pump | standard / community | ❌ | ArenaEV "Heat pump: Yes", title "2023 - 2026", 101.7 kWh usable. No standard/optional wording; see systematic finding 1. DROP (or relabel only if a Rolls-Royce page is found). |
| rolls-royce/spectre/2025, 2026 black-badge | heat_pump | standard / community | ❌ | ArenaEV "Heat pump: Yes", title "2025 - 2026". Same problem. DROP. |
| rolls-royce/spectre/2024/black-badge-spectre | heat_pump | standard / estimated | ❌ | Estimate from a 2025-labelled page; our data has the same 120/102 kWh pack for 2024 and 2025 so hardware basis would be fine, but the underlying "Yes" does not show standard. DROP. |
| rolls-royce/spectre/2027 spectre, black-badge | heat_pump | standard / community | ❌ | Series II pages not reopened by me (only the title mapping in the batch); our 2027 Spectre has 112 kWh usable vs 102 kWh before, so the pack changed. Same "Yes" problem. DROP. |
| mercedes/eqb/2022-2025 eqb-350-4matic (x4) | heat_pump | standard / community | ❌ | ArenaEV "Heat pump: Yes", "2022 - 2025", "66.5 kWh usable, 79.8 kWh total", EU AC Type 2 / CCS: an EU car. Not shown standard, market not US/CA. KBB 2024 specs page has no heat pump line. Search suggests a Mercedes launch release says standard (not openable). DROP unless that release or an mbusa/Canada page is found; if found, keep as manufacturer. |
| mercedes/eqb/2023-2025 eqb-250-plus (x3) | heat_pump | standard / community | ❌ | ArenaEV "Heat pump: Yes", 70.5 kWh **usable** (EU 250+ pack). Our NA 250+ has 70.5 gross / 66.5 usable (same as 300/350), so the ArenaEV page is a different pack and market. DROP. |
| mercedes/eqb/2022, 2024, 2025 eqb-300-4matic (x3) | heat_pump | standard / estimated | ❌ | Estimate from the EQB 350 page. Hardware basis is OK (same 70.5 gross, 66.5 usable, 100 kW DC, 9.6 kW AC in `public/data/cars`), but it rests on ArenaEV "Yes". DROP with the 350. |
| mercedes/g-580/2025, 2026, 2027 | heat_pump | standard / community | ❌ | ArenaEV "Heat pump: Yes", "2024 -", 116 kWh usable. Nothing says standard. Batch itself notes a blocked evkx snippet saying "optional" in Nordic markets, and I could not open a Mercedes US/CA source (my search found none). 2027 has 117 kWh (estimated) vs 116. DROP. |
| mercedes/amg-gt-4-door/2027 gt-63 | heat_pump | standard / community | ❌ | ArenaEV "Heat pump: Yes", "2026 -", 106 kWh usable. ev-database lists "No Data" for the heat pump on GT 55 and GT 63. DROP. |
| mercedes/amg-gt-4-door/2027 gt-55 | heat_pump | standard / estimated | ❌ | Both trims point at one powertrain in our data (106 kWh, 600 kW), so the basis would be acceptable, but the GT 63 value is unproven. DROP. |

## Required changes
- Drop the 2 iX4, 2 i3 sedan, 8 Spectre, 10 EQB, 3 G 580 and 2 AMG GT entries (27 trims). They go in the "not filled" list (no-unknowns rule): list them with what was tried, and name the next sources (Mercedes launch release for EQB; Rolls-Royce newsroom for Spectre, now at https://newsroom.rolls-roycemotorcars.com/ ; BMW US iX4 and i3 sedan releases or window-sticker equipment lists; mbusa/mercedes-benz.ca build pages, if they load).
- Fix the 2014 i3 entry and its source notes: the Range Extender column is also STD, not blank. Change source `type` to `oem` for `src-b113-bmw-us-2014-i3-pricing`.
- Keep the 15 remaining entries: i3 2014-2021 (13) and iX5 (2). Optionally add CarGurus 2019 and 2021 as corroborating sources for the `optional` i3 entries (verify its terms first). Soften the iX5 notes: neither page literally says "standard".
- Source `src-b113-gcf-i3-aux-heating` says no REx ever had a heat pump, which BMW's 2016 and 2017 guides contradict. Add that to its notes so nobody reuses its REx claim.
- Note for the lead (outside this batch): `src-b112-evmagz-ix3-40` is described in the b112 batch as "nearly identical ... in standard equipment"; the page says nearly identical in design. The iX3 50 xDrive estimate rests on that.
- Canada was verified for none of the i3 entries; markets can differ (Italy: option). Keep `low_confidence` on everything except the 2014 US-only entry.

## Per-entry decisions (as requested)
- i3 2014, 2016, 2017 x2: keep (fix 2014 note).
- i3 2015, 2018: keep as estimated.
- i3s 2018: keep as community.
- i3 and i3s 2019-21: keep as optional (CarGurus corroborates).
- iX5: keep, low_confidence.
- iX4, i3 sedan: drop (chained estimate; i3 sedan pack differs).
- Spectre 2024-27 and Black Badge (incl. 2024 estimate): drop.
- EQB 350, 250+, 300: drop (250+ is also a different EU pack).
- G 580: drop. AMG GT 63 and 55: drop.

Notes: PDF text was extracted with pdftotext from the files WebFetch saved. I did not edit the batch, `data/` or `crosswalk/`.

## Applied by the main session (2026-11-20)
- Kept: i3 2014–2021 values as the checker recommended (2014 note fixed to "STD" on both columns; BMW pricing guides typed `oem`); iX5 with softened notes.
- Dropped: iX4 and i3 sedan 2027 (chained estimate).
- **Not dropped (owner decision B113: ArenaEV is allowed when cited):** Spectre, EQB, G 580 and AMG GT ArenaEV values. Kept as `standard`, low_confidence, with a note that ArenaEV's "Yes" does not say standard or optional and mixes EU data. Raised to the owner.
- Green Car Future source note now records the REx contradiction.
- `--check` passes.
