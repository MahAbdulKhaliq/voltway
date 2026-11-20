# Fact-check: batch-2026-11-19-w2-misc2.json (2026-11-19)

**Verdict: FIX.** `--check` passes (1408 variants, 541 sources). All 75 powertrain ids in `research/powertrain-gaps.json` for these models are covered, and nothing extra. Most pack, DC and AC figures check out against the pages. The problems are the estimates and a few conflicts the batch does not record. Nothing here needs REJECT: the hardware splits (Focus 23 vs 33.5 kWh; 500e gen 1 vs 2024+; Fisker Sport vs Extreme/Ultra; Charger 2027 NACS) are correct.

Method: reopened each cited page (WebFetch; PDFs read as files). The Mopar 2026 Charger owner handbook (7 MB) could not be read, so its values are unverifiable, not wrong. The batch has no `curves`, so the curve checks do not apply.

## Numbered fix list

1. **Charger/Wagoneer S/Recon preconditioning `automatic_with_navigation` (all 13 Charger ids, 6 Wagoneer S, Recon): drop or replace.** The only source is Mopar Insiders, which says "preconditioned before arrival" at a Supercharger on a 2025 Scat Pack and gives no trigger (page: trigger not stated). The batch's inference ("must be automatic, presumably navigation") is not an allowed basis, and rule 6 says a source silent on one half does not prove it. The Wagoneer S and Recon values rest on the same weak estimate, and the Wagoneer S page for the review (InsideEVs) does not mention preconditioning. Needs a Stellantis/Jeep/Dodge page or owner's manual that states the trigger. If none is found, owner decision: the researcher must still fill the field, so either mark it as an owner question or use the value with the weakest wording the sources allow. Secondary lead only (not verified, not cited): a search snippet from a TechYorker review says the Wagoneer S can warm the pack when navigating to a charger, presented as best case.
2. **Charger/Wagoneer S/Recon `dc_max_kw` conflict, 183 vs 203 kW, is not recorded.** Charger spec sheet (2024 preliminary): "Peak Charge Rate w/ 350 kW (500A) EVSE 183 kW", and 20-80 % in 27.6 min on a 350 kW charger. Wagoneer S: InsideEVs "rated at 203 kilowatts"; Jeep's own sheet says 20-80 % in about 23 min. Same 100.5 kWh, 131 Ah, 400 V pack, so the same-hardware claim is not proven (11 % apart, and the charging times differ). Add the conflict to the notes of both. Wagoneer S 203 (manufacturer via InsideEVs) is acceptable as stated. For the Recon, Jeep states no peak (Electrek: "Jeep didn't reveal charge speeds"), so 203 is an estimate from a sibling whose own sibling says 183. Either keep as `estimated` with the conflict written in the notes, or choose 183; owner call. Also the Recon note says Jeep "quotes the same 28 min 5-80 % as the Wagoneer S". The Wagoneer S sheet says 23 min for 20-80 %, so correct that sentence.
3. **Wagoneer S and Charger `ac_max_kw` (Wagoneer S estimated 11 kW; Recon estimated 11 kW).** Charger 11 kW is verified ("On Board Charger Level 2AC Max Charge Rate 11 kW"). The Wagoneer S 6 h and Recon 6.8 h for 240 V are consistent with 11 kW, but "same charging hardware" is not proven (see 2). Acceptable as `estimated`; make the notes say so.
4. **Wagoneer S `charge_port` ccs1 (6 ids, kind `community`, cite InsideEVs): page does not state it.** The review "doesn't name the port standard" and only says the car lacks NACS. Re-cite to electrive (it names the "Free2move Charge NACS-CCS1 DC Adapter" for these models, which implies CCS1) or Electrek, and say so in the notes.
5. **Charger 2024-2026 `charge_port` ccs1 (cites Mopar 2026 owner handbook): unverifiable** (PDF unreadable here). Keep only if the handbook sentence is quoted; otherwise re-cite to electrive's adapter article.
6. **Charger 2024 values (4 ids) are not `low_confidence`, but the cited sheet is titled "PRELIMINARY SPECIFICATIONS ... to be confirmed."** Set `low_confidence: true` on them, or find a final sheet.
7. **Fiat 500e 2024+ chemistry `nmc` (estimated, 6 ids): basis is invalid** (a different generation's pack and supplier; the cited EVspecifications page lists the 2024 car only as "Lithium-Ion"). A page that does state it: Design News, https://www.designnews.com/automotive-engineering/is-the-150-mile-range-2024-fiat-500e-the-right-ev-formula- (search result says "42-kilowatt-hour nickel manganese cobalt (NMC) battery"; I did not open it, so the researcher should open it and cite it as `community`/`manufacturer` as fits). CarExpert's 2025 spec page lists Samsung SDI, prismatic (not opened either).
8. **Focus Electric 2017-2018 chemistry `other` (estimated from the 2013 LMO pack): reject basis.** The pack changed (23 to 33.5 kWh), and the notes themselves say a chemistry change is not ruled out. Need a page for the 33.5 kWh pack (Ford's US spec sheet, media.ford.com 2017 Focus Electric page named in `data/models/ford/focus-electric.json`, may have it) or owner decision. The `nominal_voltage_class` 400v for 2017 is stated by Green Cars Compare ("400 V architecture"), so label it `community`, not `estimated`.
9. **Focus 2017-2018 usable 31.8 kWh: the repo model note says usable conflicts (31.8 vs 29.0 kWh).** Record the conflict in the notes. Green Cars Compare page confirms 31.8 and 33.5.
10. **Preconditioning `none` estimates for the old cars (Focus 2012-18, 500e 2013-19, Azure, CODA, Kandi): the stated basis is absence of a mention.** The rules allow `none` only when an owner's manual or maker page describes charging with no battery-warming feature, or the car predates the maker's first preconditioning launch (cite it). None of these notes cites a launch or a manual. The 500e gen 1 note cites Fiat's spec sheet, which lists four automatic thermal modes and says nothing about a user feature, which is close to the allowed basis. Please add the maker launch citation (for example Ford's first battery-preconditioning car, Fiat/Chrysler's, CODA) or ask the owner to accept J1772-only/no-DC cars as `none` (dc_max 0 makes a charging-time preconditioning feature moot). Same for Fiat 500e 2024: AutoTrader.ca says it "doesn't offer battery preconditioning for more efficient charging", a direct statement and a good basis for a low-confidence estimate, but it is press, not Stellantis; accept or ask for the manual.
11. **Fiat 500e gen 1 `dc_max_kw` 0, kind `manufacturer`, cites Wikipedia (Fiat 500 (2007)): wrong kind.** The page says the car "does not come equipped with or offers as an option a DC fast charging connector," which is Wikipedia relaying a journalist, not a maker figure. Use `community`. (Same fact is on Green Cars Compare: "does not support DC fast charging".)
12. **Fisker Supercharger `no` (5 ids): notes say "no Fisker adapter programme was found." That is wrong.** Cars.com (Aug 2023): Fisker and Tesla agreed that "all current and future Fisker vehicles will be covered", with an adapter "in the first quarter of 2025". The value `no` is likely right in practice (Fisker bankrupt June 2024; no evidence the adapter shipped), but I could not confirm that, so the note must name the 2023 agreement and say that no shipped adapter was found.
13. **Supercharger `no` from absence in the Wikipedia NACS table (Focus, Fisker, VinFast x3, Rimac, Lordstown, Azure, CODA, Kandi, 500e 2013-19 uses electrive instead).** I confirmed Fisker, VinFast, Rimac and Lordstown are in neither the table nor the page text, but absence from a table is not one of the allowed estimate bases. For cars with no DC port (Focus 2012-16, Azure, CODA, Kandi, 500e 2013-19) the reasoning "no DC port, so no Supercharging" is sound; say that is the basis. For CCS1 cars (Focus 2017-18, Fisker, VinFast, Rimac, Lordstown) cite a positive source (the Ford adapter eligibility page, a VinFast/Tesla statement) or label the absence honestly. I searched for a VinFast adapter and found nothing.
14. **Fisker DC and AC conflicts not recorded.** evspecs.org gives 250 kW (Extreme, Ultra, One) and 200 kW (Sport), AC 11 kW. Wikipedia (and the repo model note) say 175 kW for all trims and 7.4 kW AC. evspecifications.com: Sport 200 kW and Extreme 250 kW (one table on that page uses 200). Pack size also conflicts: evspecifications.com says Extreme 105 gross / 100 usable, evspecs.org and Wikipedia say 113 / 106.5. AC is market-dependent and the cited page is generic: say whether a North American figure was found. Record all in the notes (values can stay, all LC).
15. **Rimac Nevera usable 120 kWh = gross (2024-2025 Nevera): mismatch.** The evspecs.org page cited says gross 130, usable 120, but the Rimac page says only "120 kWh" (bare = gross), and the batch also records gross 120. Pages that state usable: Battery Design (https://www.batterydesign.net/2020-rimac-nevera/): "120 kWh total", usable 106.8 kWh from "an 89% SoC window", nominal about 630 V (731 V to 435 V), 174s40p. Use usable 106.8 (`community`, LC) and record that evspecs.org disagrees. Nevera R 108 gross / 104 usable: Rimac's page shows a "108 kWh" block (not clearly tied to the R); evspecs.org states 108 / 104. Keep as is, but gross 108 `manufacturer` should say the page does not name the R. Voltage class 800v is supported (InsideEVs "800V system voltage (maximum 730 V)"; ArenaEV "730V (800V-type)").
16. **VinFast VF 7 (2025, 2027): usable 70.8 kWh (estimated) and chemistry LFP conflict with the repo and the pages.** The repo model note says "The LFP 70.8 kWh VF 7 is an Indian-market version, not this car", and the batch's own notes admit it. VinFast US lists the VF 7 at 75.3 kWh, and Green Cars Compare (VF 7 Plus) calls it "a 75.3 kWh usable battery pack", 400 V, 11 kW AC, CCS1. So 75.3 may be usable, not gross (then the `manufacturer` gross 75.3 is wrong; InsideEVs says only "75.3-kWh battery pack"). Replace usable 70.8 with a stated figure or label the conflict, and record voltage `400v` and AC 11 kW from Green Cars Compare (`community`, pre-production page, "some specs may change"). Wikipedia says LFP "Both variants" but the market is unclear; no US-market chemistry source found.
17. **VinFast VF 8 2023 ids (and `plus-performance` etc.): 87.7 kWh usable is verified only for MY2027** (spec sheet, "Battery Capacity - Usable 87.7 kWh", Eco 256 mi / Plus 224 mi). The repo VF 8 note says the first 2023 "City Edition" cars had the smaller 82 kWh pack. State which years were compared; the 2023 ids at least need a note or a source. Gross 92 (evspecs.org) conflicts with 94 (EVKX per search) and 90 (repo/ev-database); add to notes. The evspecs.org page also lists an impossible Plus Extended usable 97.7 > 92 gross, so it is a weak source.
18. **VinFast `dc_max_kw` 150 (VF 8, VF 9, VF 7):** VF 8 matches (VinFast technology article via search: 150 kW, 10-70 % in 31 min; spec sheet 31 min). The VF 9 sheet says "35 mins (10% - 70%)", and evspecs.org labels 150 kW as "DC Fast Charging" not "max". VF 7 Wikipedia says "Up to 150 kW" but Green Cars Compare says "peaks at 100 kW" (not recorded). Note the VF 7 conflict.
19. **VinFast preconditioning `none` (estimated):** the US charging page mentions only cabin "pre-heat or pre-cool"; the VF 9 sheet lists "High Voltage Battery Heater Included" (verified). Same basis problem as item 10: absence on one page. Acceptable only with an owner OK, or a manual.
20. **Wagoneer S usable 93.9 (estimated from Charger ratio 0.934):** basis is allowed (same 100.5 kWh, 400 V, 131 Ah NMC pack) and the Charger sheet states 100.5 / 93.9. Recon likewise. OK.
21. **Required fields still empty** (item list below): Needs to be filled or the owner told per field. Leads I found are in the next section.
22. **Canada coverage:** electrive says "customers in North America" and the earlier plan "the USA and Canada"; Charger 2024-26, Wagoneer S, Recon and 500e `via_adapter` for the CA ids are not confirmed for Canada. Say so in the notes (low-confidence already set). Charger 2027 is US-only in this data, so the NACS/`yes` value does not touch Canada.

## Table

| Variant / powertrain | Field | Value | Result | Evidence |
|---|---|---|---|---|
| Focus 2012-2016 | gross kWh | 23 | ✅ | INL sheet: "Rated Pack Energy: 23 kWh" (2013 car) |
| Focus 2012-2016 | usable kWh | 19.6 | ✅ | GCC 2012: "19.6 kWh" |
| Focus 2012-2016 | chemistry other (LMO) | other | ✅ | INL: "Lithium-Ion (LMO)" |
| Focus 2012-2016 | voltage 400v | 400v | ✅ | INL: "Nominal System Voltage: 318.2 V" (class mapping 318 V to 400v is an owner call) |
| Focus 2012-2016 | AC | 6.6 kW | ✅ | INL: "On-Board Charger: 6.6 kW" |
| Focus 2012-2016 | DC 0, port j1772 | 0, j1772 | ✅ | GCC: "don't list DC fast charging", Type 1 (J1772) |
| Focus 2012-2016 | preconditioning none | none | ⚠ | item 10 |
| Focus 2012-2016 | Supercharger no | no | ⚠ | item 13 (no DC port, sound) |
| Focus 2017-2018 | gross 33.5, DC 50, port ccs1 | | ✅ | InsideEVs "33.5 kWh", "Up to 50 kW", "CCS variety"; Green Car Reports: "Combined Charging System (CCS)" |
| Focus 2017-2018 | usable 31.8, AC 6.6 | | ✅ | GCC 2017 (conflict 29.0 in repo, item 9) |
| Focus 2017-2018 | chemistry other | other | ❌ | item 8 |
| Focus 2017-2018 | voltage 400v | 400v | 🏷 | GCC states "400 V architecture"; kind should be community, not estimated |
| 500e 2013-2019 | gross 24, voltage, AC, port | | ✅ | Fiat sheet: "24 kilowatt-hours (kWh)... 364 volts", "6.6 kW", "SAE J1772" |
| 500e 2013-2019 | usable 22.8 | | ✅ | GCC: "(22.8 kWh usable)" |
| 500e 2013-2019 | chemistry nmc | nmc | ✅ | EVspecifications 2019: "NCM", 364 V, 24 kWh (2019 car) |
| 500e 2013-2019 | dc 0 | 0 | 🏷 | item 11 |
| 500e 2013-2019 | Supercharger no | no | ✅ | electrive list is 2024-2026 only; J1772-only car |
| 500e 2013-2019 | preconditioning none | none | ⚠ | item 10 |
| 500e 2024-2026 | gross 42, DC 85, AC 11, port ccs1 | | ✅ | InsideEVs "42-kilowatt-hour", "Up to 85 kW", "rated at 11 kW", "CCS1"; Wikipedia CCS Combo Type 1 |
| 500e 2024-2026 | usable 37.3, voltage 400v | | ✅ | EVspecifications 2024: "37.3 kWh", "400 V" |
| 500e 2024-2026 | chemistry nmc | nmc | ❌ | item 7 |
| 500e 2024-2026 | preconditioning none | none | ⚠ | AutoTrader.ca: "doesn't offer battery preconditioning" (item 10) |
| 500e 2024-2026 | Supercharger via_adapter | | ✅ | electrive: Fiat 500e "2024, 2025, 2026" |
| Charger 2024-2027 | gross 100.5, usable 93.9, 400v, AC 11, DC 183 | | ✅ | Charger sheet: "100.5 / (93.9 kWh)", "183 kW", "11 kW", "400V BEV" (preliminary, item 6) |
| Charger 2024-2027 | chemistry nmc | nmc | ✅ | Wagoneer S/Recon sheet: "nickel manganese cobalt" same pack; estimate OK. The Motor1 NCA conflict was not checked by me |
| Charger 2024-2027 | preconditioning | automatic_with_navigation | ❌ | item 1 |
| Charger 2024-2026 | port ccs1 | | ⚠ | item 5 |
| Charger 2024-2026 | Supercharger via_adapter | | ✅ | electrive: Charger Daytona 2024, 2025, 2026 |
| Charger 2027 (US) | port nacs, Supercharger yes | | ✅ | electrive: first Stellantis NACS model "Dodge Charger Daytona 2027" |
| Wagoneer S 2024-2026 | gross 100.5, NMC, 400v | | ✅ | Wagoneer S sheet: "400-volt, 100.5-kWh ... nickel manganese cobalt" (2025 sheet; 2024/26 LC) |
| Wagoneer S | usable 93.9 | | ✅ | estimate basis allowed (item 20) |
| Wagoneer S | DC 203 | | ⚠ | InsideEVs "rated at 203 kilowatts"; conflict item 2 |
| Wagoneer S | AC 11 (est.) | | ⚠ | item 3 |
| Wagoneer S | port ccs1 | | ❌ | item 4 |
| Wagoneer S | preconditioning | automatic_with_navigation | ❌ | item 1 |
| Wagoneer S | Supercharger via_adapter | | ✅ | electrive: "Jeep Wagoneer S: 2024, 2025" (2026 estimated from Electrek claim, not opened) |
| Recon 2026 Moab | gross 100.5, NMC, 400v | | ✅ | Recon sheet "400-volt, 100.5kWh, 131Ah-cell ... nickel manganese cobalt" |
| Recon | usable (est.) | 93.9 | ✅ | item 20 |
| Recon | DC 203 est. | | ⚠ | item 2 |
| Recon | port ccs1 | | ✅ | Electrek: "launches with a CCS port" |
| Recon | AC 11 est. | | ⚠ | item 3 |
| Recon | preconditioning | | ❌ | item 1 |
| Recon | Supercharger via_adapter | | ✅ | electrive: "Jeep Recon: 2026" |
| Fisker Extreme/Ultra | 113 / 106.5, NMC, 250 kW, 11 kW, 400v | | ⚠ | evspecs.org and Wikipedia agree on packs; DC/AC/pack conflicts item 14 |
| Fisker Sport | 80 / 75, LFP, 200 kW, 400v | | ✅ | evspecifications Sport: "75 kWh usable... 80 kWh total", LFP, 400 V, 200 kW, AC 11 kW |
| Fisker | port ccs1 | | ✅ | evspecs.org / Wikipedia "J1772/CCS1 in North America" |
| Fisker | Supercharger no | | ⚠ | item 12 |
| VF 8 | usable 87.7, gross 92 | | ✅/⚠ | MY2027 sheet "87.7 kWh"; gross conflict, 2023 pack question: item 17 |
| VF 8 / VF 9 | DC 150, AC 11, port ccs1 | | ✅ | evspecs.org tables (community) |
| VF 9 | usable 123, gross 130 | | ✅ | VF 9 sheet "Battery Capacity - Usable 123 kWh"; gross 130 on evspecs.org (another source says 128; not recorded) |
| VF 7 | gross 75.3, usable 70.8, LFP, DC 150 | | ❌ | item 16, 18 |
| VF 7 | port ccs1 est. | | ✅ | GCC: CCS Type 1 for US; basis fine |
| Rimac Nevera | DC 500, AC 22, port | | ✅ | Rimac page: "500 kW DC Combo", "3-phase 22 kW" |
| Rimac Nevera | gross 120 | | ✅ | Rimac page, bare "120 kWh" (gross by rule) |
| Rimac Nevera | usable 120 | | ❌ | item 15 |
| Rimac Nevera | chemistry NMC, 800v | | ✅ | evspecs.org NMC; ArenaEV NMC, 730 V (800V-type) |
| Rimac Nevera | port ccs1 est. | | ⚠ | page says "DC Combo", not CCS1; US-market cars are Combo 1; estimate acceptable |
| Rimac Nevera R | gross 108, usable 104 | | ⚠ | evspecs.org "108 / 104"; Rimac page block not tied to R |
| Azure Transit Connect | gross 28, AC 3.3, port j1772 | | ✅ | Wikipedia: "nominal capacity of 28 kW-hr", "maximum 3.3 kW", "SAE J1772" |
| Azure | voltage 400v est. | | ⚠ | page gives "nominal 300 V" for the motor; owner's call on class `other` vs `400v` |
| CODA | gross 31, LFP, AC 6.6 | | ✅ | Wikipedia: "31 kWh", "lithium iron phosphate", "6.6 kW" |
| Kandi K27 | gross 17.69, AC 3.84 est. | | ✅ | InsideEVs "17.69 kWh", "7 Hours (240V/16A)" (3.84 is arithmetic) |
| Lordstown | gross 109, DC 150 | | ✅ | InsideEVs "109-kilowatt-hour", "up to 150 kilowatts" |
| Lordstown | usable 104, AC 11, ccs1 | | ✅ | evspecs.org "109 gross, 104 usable", "11 kW", "CCS" |

## B94/market and kind notes
- Kinds: `manufacturer` for figures relayed from the maker (InsideEVs Wagoneer S 203 kW, Wikipedia for Azure/CODA capacity) is fine. Mislabels are items 8 (voltage) and 11.
- Source quality: all sources have URLs and `accessed_on` 2026-11-19; `low_confidence` is set on almost everything. Exceptions: the 2024 Charger (item 6).

## Empty required fields, and pages I found
| Powertrains | Missing | Page found (not verified as exact car) |
|---|---|---|
| VF 8 (all) | chemistry | NMC: CleanTechnica https://cleantechnica.com/2024/10/11/vinfast-leads-way-in-ev-battery-optimisation/ ("an 87.7 kWh CATL NMC battery"; opened). Repo note says Samsung SDI NMC. |
| VF 8 (all) | voltage | EVKX (blocked, search snippet only): nominal 403 V; ev-database.org "400 V architecture" (429 error when I opened it). Use `400v` as `estimated` with ev-database once opened. |
| VF 9 (all) | chemistry | NMC: a search snippet for a spec page and a German spec sheet (not opened); VF 8 CATL NMC is the lineup supplier. |
| VF 9 (all) | voltage | ev-database.org "400 V architecture" (search snippet; 429 on opening). |
| VF 7 | voltage | Green Cars Compare VF 7 Plus: "400V architecture" (opened). |
| VF 7 | AC | Green Cars Compare: 11 kW (opened). |
| Fisker | preconditioning | A search snippet of a third-party Fisker guide says routing to a DC charger warms the pack; the ev.care guide I opened says only "Pre-condition before fast charging in cold weather". Not enough; owner's manual would be needed. Fisker owner manual site: https://fisker-ocean-manual.pages.dev/manual/ (third-party mirror, not read). |
| Rimac | preconditioning | None found: Rimac page, InsideEVs, Battery Design are all silent. |
| Lordstown | preconditioning, voltage, chemistry | None found. Search snippets only: LG 2170 cylindrical cells (Green Car Reports), a reseller listing implies about 350 V; not usable as sources. |
| CODA | voltage, usable | None found. |
| Kandi K27 | voltage, chemistry, usable | None found; sources say "lithium", K23 sibling is NCM. |
| Azure | chemistry, usable | Wikipedia says "lithium-ion", Johnson Controls-Saft; usable not stated. |
| Rimac | nominal voltage | Battery Design: about 630 V nominal (435-731 V); ArenaEV: 730 V (800V-type). |
| Rimac | usable | Battery Design: 106.8 kWh (item 15). |

Not filled and no page found: Fisker/Rimac/Lordstown preconditioning, CODA/Kandi/Lordstown voltage, Kandi/Lordstown chemistry, Azure/CODA/Kandi usable. B96 needs an estimate-with-basis or an owner decision on each (note: the allowed bases are narrow, so for these the owner may need to accept `other`/class-from-sibling estimates or hold the cars).
