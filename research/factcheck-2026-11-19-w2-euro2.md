# Fact-check: batch-2026-11-19-w2-euro2.json

Checked 2026-11-19. 48 powertrains (EC40 8, Polestar 3 6, Polestar 4 5, EX90 8, EX60 2, I-Pace 6, Eletre 4, Maserati 9), 43 new sources, no curves, no wheels. `npx tsx scripts/add-facts.ts ... --check` passes. volvocars.com and maserati.com were not fetched (blocked). EV Database returned 429.

## Verdict: FIX

Most values hold. Eight things need changing before apply (list at the end): the Maserati US AC 11 kW estimate, a wrong note on Polestar 3 2026, the EX60 preconditioning value, one EX60 10-80 figure, the Polestar preconditioning kind, and a few weak-basis labels.

## Table by hardware generation

| Powertrains | Field(s) | Value | Result | Evidence |
|---|---|---|---|---|
| EX90 2025 (2) | gross / usable / chemistry | 111 / 107 / nmc | ✅ | Motor1: "111 kWh gross and 107 kWh net", NMC from CATL |
| EX90 2025 (2) | voltage 400 V, DC 250, 10-80 30 min | | ✅ | InsideEVs: "400-volt" to 800 V, 2025 peak 250 kW, about 30 min |
| EX90 2025 (2) | ac_max_kw 11 | manufacturer | ⚠ | Motor1: 11 kW, no market stated; Wikipedia also 11 kW. Acceptable, low_confidence is set |
| EX90 2026 twin + performance (2) | 106 gross, 102 usable, 800 V, 350 kW, 22 min | | ✅ | KBB 2026 specs: 106.00 kWh; heise: 102 kWh net, 350 kW, 22 min, "400-volt ... to 800 volts" |
| EX90 2026 single (1) | 92 / 88 / 310 kW / 22 min | | ✅ | KBB 92.00 kWh; heise 88 kWh net, 310 kW |
| EX90 2027 (3) | all carried from 2026, kind estimated | | ✅ | Batch says "no 2027 page opened". KBB 2027 EX90 specs page does exist and lists 92 / 106 / 106 kWh (opened): cite it for gross |
| EX90 2026-27 | chemistry nmc (estimated) | | ⚠ | Wikipedia: CATL cells, 92/106 kWh; no page names the 800 V chemistry. The pack changed, so "no change in between" is not shown. Keep estimated, low_confidence |
| EX90 2026-27 | ac_max_kw 11 (estimated) | | ⚠ | No 2026 page states it. A search excerpt of Volvo regional spec pages shows "11kW On-Board Charger" for the 800 V EX90 (not fetched, volvocars blocked). Keep estimated |
| EX90 all | preconditioning automatic_and_manual (estimated) | | ⚠ unverifiable | Source is a volvocars.com support page read only as a search excerpt. A search result summary quotes both halves (auto when DC station is the nav destination; manual in the charging view) but I could not open it |
| EX90 all | charge_port ccs1, via_adapter | | ✅ | The Charge Port: EX90 2025-2027 CCS1, free adapter. Cision (CA): adapter included with new 2025 EX90/EX40/EC40, CA$310 for owners. Jalopnik (search result): 2026 EX90 kept CCS with an adapter as standard |
| EX60 2027 P10 AWD | gross 95, usable 91, 800 V, 19.2 kW AC, NACS | | ✅ | KBB specs 95.00 kWh (Plus/Ultra); KBB launch: P10 91 kWh, "800V", 19.2 kW, first native NACS |
| EX60 P10 / P6 | dc_max 370 / 320 | | ✅ | The Charge Port: P10 AWD 370 kW, P6 320 kW. Motor1 lists 350/400 kW (conflict noted in batch) |
| EX60 P10 | published_10_80_min 18 (manufacturer) | | ❌ | KBB: 18 min "does not specify a trim". Batch note says "stated for the top US trim" which the page doesn't say |
| EX60 both | chemistry nmc (estimated) | | ✅ | InsideEVs: "The EX60 uses high-nickel battery chemistry" |
| EX60 both | preconditioning automatic_with_navigation (estimated) | | ❌ | Basis is the EX90 article, which gives navigation trigger **and** manual start, and the EX90 entries say automatic_and_manual. The value contradicts its own basis |
| Polestar 3 2025 (3) | 111 gross, 107 usable, nmc, 400 V, 250 kW, 11 kW, 30 min | | ✅ | Polestar US: "400V lithium-ion battery, 111 kWh", "250 kW", "10-80% in 30 min", "11 kW AC". BatteryDesign: 111 total / 107 usable, NMC811, CATL, 375 V pack. Canada not separately checked for 2025 |
| Polestar 3 2025 | usable, chemistry kind manufacturer | | 🏷 | BatteryDesign.net is a third-party analysis site, not a manufacturer statement or an independent test. Keep low_confidence; consider estimated |
| Polestar 3 2026 (3) | same figures, kind manufacturer | | ❌ | Polestar US page states no model year. **Polestar Canada page now shows 106 kWh, 800 V, up to 350 kW, 11 kW AC, 22 min, trims "Dual motor" and "Performance" (labelled preliminary).** The batch note says the 800 V refresh "is not shown on the US/Canada pages": wrong for Canada. InsideEVs: 800 V 92/106 kWh, 310/350 kW, UK first, "other markets to follow". A search result (Jalopnik) says US availability of the refresh is later and the 2025 car is still on sale. The catalogue's 2026 trims are the old "Long Range ..." names, which supports old hardware, but it is not proven |
| Polestar 3 | preconditioning automatic_with_navigation | manufacturer (2025) | 🏷 | Manual: "automatically starts when a DC fast charging station is set in the built-in navigation app". Page is silent on manual control, and silence doesn't prove "no manual control" (rule 6) |
| Polestar 3 | supercharger via_adapter, ccs1 | | ✅ | Polestar US and CA: "Polestar 2, Polestar 3 and Polestar 4 vehicles are compatible with the NACS adapter". The Charge Port: CCS1, paid adapter |
| Polestar 4 2025-26 (5) | 100 gross, 400 V, 200 kW, 11 kW, 30 min | | ✅ | US and CA pages: "100 kWh", "400 V", "up to 200 kW", "11 kW AC" (UK/Wikipedia 22 kW correctly not used), "30 minutes" |
| Polestar 4 | usable 94, chemistry nmc | manufacturer | ⚠ | Only EV Database search excerpts (page 429). Wikipedia (opened) agrees NMC 400 V but gives 102 kWh total, no usable. EV Database isn't a manufacturer statement: 🏷 likely, keep low_confidence |
| Polestar 4 | preconditioning automatic_with_navigation | manufacturer | 🏷 | 2025 and 2026 US manuals opened: nav trigger, "stops below 7%", no manual control mentioned. Same silence issue as Polestar 3 |
| EC40 2022-23 twin (2) | 78 / 75 / nmc / 400 V / 150 kW / 11 kW | estimated | ✅ | Copied from applied EX40 2022-p8-twin-eawd and 2023-twin (same figures in `data/powertrains/volvo/ex40`). Same 78 kWh pack, 150 kW: conceptcarz (Volvo US 2024 copy) states the 78 kWh twin at 150 kW "for C40 and XC40". C40 to EC40 rename confirmed (InsideEVs) |
| EC40 2022-23 | dc_max 150 cites wikipedia-volvo-ex40 | estimated | ⚠ | That Wikipedia table is inconsistent (150 vs 175 kW). The 78 kWh twin's 150 kW is stated by conceptcarz; cite that instead |
| EC40 2024 (twin, single) | 78 / 150 kW and 82 / 200 kW / 28 min | | ✅ | conceptcarz and InsideEVs 2024 upgrade pages: Single Motor 82 kWh, 200 kW, 28 min; Twin 78 kWh, 150 kW |
| EC40 2025-26 | 82 gross, 79 usable, 205 kW, 28 min | estimated | ✅ | Copied from EX40; InsideEVs: Twin Motor 82 kWh, 205 kW both. The 2025 single motor pack is ambiguous (InsideEVs text vs GCR 82 kWh); the EX40 side already carries 82 |
| EC40 all | charge_port ccs1, via_adapter | | ✅ | The Charge Port: EC40 2022-24 CCS1 paid adapter, 2025-26 free adapter. Cision and InsideEVs name EC40 |
| EC40 | preconditioning automatic_with_navigation | estimated | ⚠ | Cited EV Database pages (not re-opened, 429) are described in the source record as "preconditioning supported and can start automatically via navigation"; EV Database also lists a "possible" flag, which implies manual too. Inherited from the EX40 data |
| I-Pace 2019-24 (6) | gross 90, 100 kW DC | manufacturer | ✅ | Jaguar US: "rated at 90 kWh"; JLR 2022 release: "100 kW DC charger ... 63 miles in 15 minutes" |
| I-Pace | usable 84.7 | manufacturer | ⚠ | EV Database search excerpt only; Jaguar UK page fetched says "90 kWh battery" with no usable split. Kind should not be manufacturer unless a Jaguar page is opened |
| I-Pace | chemistry nmc, 400 V (estimated) | | ⚠ | Wikipedia: LG Chem, 432 pouch cells, "lithium-ion", no chemistry named. Voltage is a cell-count calculation, not an allowed basis. Weak but labelled estimated, low_confidence |
| I-Pace 2019-20 | ac 7 kW | manufacturer | ✅ | Cars.com: earlier models "limited to 7 kW on 230 volts"; Jaguar UK page 7 kW |
| I-Pace 2021 (US only) | ac 7 kW (estimated) | | ⚠ | Cars.com: model skipped 2021. Wikipedia: "Later 2021 models: 11 kW AC". The catalogue has a 2021 US car, so the 7 kW carry-over is unproven; could be 11 kW |
| I-Pace 2022 (CA only) | ac 11 kW | manufacturer | ⚠ | JLR US release (2022 model year): "11kW on-board charger as standard". US page for a Canadian-only car; acceptable (same 240 V hardware) but flag |
| I-Pace 2023-24 | ac 11 (estimated) | | ✅ | Carry-over from 2022, nothing shows change |
| I-Pace | preconditioning manual_only (estimated) | | ⚠ | JLR: "pre-condition the battery and cabin ... before a journey" via InControl Remote; Jaguar US "preconditioning mode". Sources are silent on a navigation trigger, so manual_only isn't proven; stays acceptable only as estimated |
| I-Pace | supercharger via_adapter (estimated) | | ⚠ | InsideEVs: access from Aug 2025, **US only**, "Jaguar hasn't approved an adapter". JLR 2023 release names I-Pace only for adapters "once available", no country. The 2022 car is Canada-only, so its access rests on a US page |
| Eletre 2026 (4) | gross 111.9, usable 109, nmc, 22 kW AC, 350 kW, 10-80 20 min | | ✅ | CarExpert: "111.9 kWh gross, 109 kWh usable", NMC from CATL, 350 kW, 22 kW AC, 0.33 h. Lotus Canada page: "350 kW", "22 kW AC charger built-in". Conflicts (Wikipedia 107 usable, 430 kW) are noted in the batch |
| Eletre | voltage 800 V | manufacturer | ⚠ | Auto123 (2027 model year article) says "800-volt electric architecture"; Wikipedia 800 V; CarExpert 708 V nominal. Fine for the class, page is for the 2027 car |
| Eletre | preconditioning automatic_and_manual (estimated) | | ⚠ | Lotus OTA history: Hyper OS 1.5.1u "Optimised battery pre-conditioning to include navigation information"; 2.2.0 "New battery preheating switch ... manually turn ... on or off". One page covers both halves, as the batch says; no dates, so whether a 2026 Canadian car has 2.2.0 isn't shown |
| Eletre | charge_port, supercharger_access | EMPTY | see below | B96 gap |
| Maserati GT/GC 2024-26 (6) | 92.5 gross, 83 usable, nmc, 800 V, 270 kW | | ✅ | CarExpert/ArenaEV: "92.5 kWh gross, 83 kWh usable", NMC, 800 V, 270 kW. Wikipedia: 2026 facelift keeps "the same 92.5 kWh battery pack" |
| Maserati GT/GC | ac_max_kw 11 (estimated) | | ❌ | See fix 1 |
| Maserati Grecale 2025-27 (3) | 105 / 95 / nmc / 400 V / 150 kW / 40 min | | ✅ | CarExpert: "105 kWh gross, 95 kWh usable", NMC, 400 V, 150 kW, 0.66 h. Auto Express: 2026 update keeps the 105 kWh pack and 150 kW |
| Maserati Grecale | ac_max_kw 11 (estimated) | | ❌ | See fix 1 |
| Maserati all | charge_port ccs1, via_adapter (estimated) | | ✅ | The Charge Port: GranTurismo/GranCabrio 2024-26 and Grecale 2025-27 "CCS1", "Paid adapter" |
| Maserati all | preconditioning | EMPTY | see below | B96 gap |

## Specific questions from the brief

**EX90 fan-out.** Correct. 2025 = 400 V, 111/107, 250 kW; 2026+ = 800 V with two packs (92/88 kWh at 310 kW single, 106/102 at 350 kW twin and performance). Each split is on a cited page (heise, KBB, InsideEVs). 2027 is a carry-over (KBB 2027 page confirms the packs).

**Polestar 3 2025 vs 2026.** The 2026 figures are not proven for the Canadian market: Polestar Canada now publishes the 800 V 106 kWh 350 kW car as preliminary data. The US page and the catalogue's old trim names point to 400 V for cars actually sold as 2026, but no page says so for the model year. See fix 2.

**EC40 copied from EX40.** Copy mapping matches `data/powertrains/volvo/ex40` file by file (2022 P8 twin to 2022 twin, 2023 twin, 2024 twin, 2024 single, 2025 single and twin, 2026). The sibling basis is valid (same pack, charger, platform; rename confirmed). Kinds follow the EX40 side (several were manufacturer there and are estimated here, which is the safe direction).

**Values resting only on EV Database search excerpts.** Polestar 4 usable 94 and chemistry (chemistry corroborated by Wikipedia); I-Pace usable 84.7; EC40/EX40 preconditioning basis; Maserati preconditioning candidate (below). All unverifiable by fetch; the I-Pace and Polestar 4 usable values carry kind manufacturer from a community database, which is not shown.

**Maserati US AC 11 vs 22 kW.** Not supported. CarExpert (GT and Grecale), ArenaEV, Wikipedia all say 22 kW onboard; a search result for a US-oriented site also says 22 kW and no source says 11. EPA's 9 h (GT, 83 kWh) and 11 h (Grecale, 95 kWh) at 240 V imply roughly 10 kW into the pack, but EPA times are set by the 240 V test circuit (about 9.6-11.5 kW) and a 22 kW charger on that circuit would give the same times, so the times can't tell 11 from 22. The allowed estimate bases don't include "EPA time implies". CarExpert's Grecale page also lists a Type 1 (J1772) AC port, so the unit can be fed from a US-style supply.

**kinds / low_confidence.** `low_confidence` is set on nearly all (appropriate; none of the manufacturer values was read on a manufacturer page for this exact car and year except the Polestar manual preconditioning, which correctly has none). Mislabels listed above.

## Pages found for the empty fields

- **Lotus Eletre charge_port (Canada): CCS1 supported.** The Autopian review of the Canadian car: port "of the CCS variety rather than the Tesla-style NACS port" (https://www.theautopian.com/the-lotus-eletre-is-the-first-chinese-built-ev-sold-under-canadas-quota-program-and-its-shockingly-good/). A search result for a vehicle database says CCS Combo 1 in North America (EV Database, not opened). The Lotus Canada charging page and Auto123 don't state the port. Suggest `ccs1`, estimated or community-labelled, low_confidence.
- **Lotus Eletre supercharger_access: nothing found.** Lotus Canada charging page, Auto123 and The Charge Port (no Eletre row) are silent. Only a third-party guide (evcourse.com, 503, not opened) claims compatibility. No Lotus statement on an adapter. Remains open: B96 needs an owner decision (for example `no` estimated, "no adapter programme found").
- **Maserati GranTurismo/GranCabrio preconditioning: only an EV Database excerpt.** Search result text for EV Database MY24-26 and MY27 GranTurismo pages: "Preconditioning Possible Yes, Automatically using Navigation Yes". Page returned 429 when opened. Goodwood: EV Routing 2.0 evaluates battery conditioning on routes.
- **Maserati Grecale preconditioning: found.** Auto Express (opened): Maserati "added automatic battery pre-conditioning" for the 2026 update; it "intervenes when a charging station is chosen on the sat-nav via Maserati's 'EV Routing' function"; battery and 150 kW unchanged (https://www.autoexpress.co.uk/maserati/grecale/368206/updated-maserati-grecale-folgore-gets-more-range-and-sporty-cabin-upgrade). electrive.com (opened): "preacondicionamiento de la batería" added to the route planner for the 2026 year (https://www.electrive.com/es/2025/10/30/maserati-grecale-folgore-gets-range-boost-and-battery-preconditioning/). Maserati's own MY2026 page (US and CA) exists but is blocked. So 2025 Grecale predates it (`none`, estimated, cite the launch; trigger and manual control for 2026-27: navigation-triggered, manual not mentioned) and 2026-27 are navigation-triggered. A Stellantis 2023 press release (search excerpt) words the trigger differently ("near an ultra-fast charging point").
- ArenaEV (opened) lists no preconditioning for the GranTurismo.

## Numbered fix list

1. **Maserati `ac_max_kw` (9 powertrains: GT 2024-26, GC 2024-26, Grecale 2025-27).** The 11 kW estimate has no allowed basis and contradicts every page (22 kW). Change to 22 kW, `estimated`, low_confidence, with the allowed basis "same hardware in another market, nothing shows a US difference" and a note that US 240 V supply limits the delivered rate to about 10-11.5 kW (EPA 9 h / 11 h); or put the question to the owner. Do not keep 11 kW on the EPA-time argument.
2. **Polestar 3 2026 (3 powertrains).** (a) Correct the note: the Canada page (https://www.polestar.com/en-ca/polestar-3/specifications/) shows 106 kWh / 800 V / 350 kW / 11 kW AC, preliminary, trims Dual motor and Performance; add it as a source. (b) The Polestar US page states no model year, so relabel the 2026 gross, usable, chemistry, voltage, DC, AC, 10-80 values `estimated` with basis "US site and catalogue trim names show unchanged Long Range trims; the 800 V refresh is reported but US availability not announced (Jalopnik, InsideEVs)". (c) Tell the owner the 2026 CA/US Polestar 3 hardware is unproven.
3. **EX60 P6 and P10 `battery.preconditioning`.** Make it `automatic_and_manual` (estimated), matching the EX90 article it rests on, or drop it. The note's "automatic_and_manual is also possible" should not decide the value in the other direction.
4. **EX60 P10 `published_10_80_min` 18 min.** KBB doesn't tie 18 min to a trim. Drop it, or record `estimated` and remove "stated for the top US trim" from the note.
5. **Polestar 3 and 4 `battery.preconditioning`.** Manuals show only a navigation trigger; "no manual control" is not proven. Change to `estimated` with notes naming both manual passages, or keep `manufacturer` only if the owner accepts silence as "none" (rule 6 says it isn't).
6. **EC40 2022-23 `dc_max_kw`.** Re-cite to `src-conceptcarz-volvo-us-2024-powertrains` (78 kWh twin, 150 kW, covers C40) instead of the inconsistent Wikipedia EX40 table.
7. **I-Pace.** (a) `usable 84.7`: kind `manufacturer` isn't shown (EV Database excerpt only): relabel `estimated`/community or open a Jaguar page. (b) 2021 `ac_max_kw` 7 kW: Wikipedia says later 2021 cars had 11 kW; say so in the note or move to low-confidence unknown-resolution (the catalogue has a US 2021 car). (c) 2022 Canada-only car: record that port, AC and Supercharger access rest on US pages; add that Jaguar had not approved an adapter (InsideEVs).
8. **Polestar 4 `usable 94` and `chemistry`.** Source is EV Database search excerpts only (429). Relabel `estimated`, or find a Polestar press page; Wikipedia (opened) corroborates NMC and 400 V.
9. **EX90 2027.** Cite the KBB 2027 EX90 specs page (92 / 106 kWh, opened) and drop "no 2027 spec page opened".
10. **B96 gaps** (not defects of the batch, for the lead): Eletre `charge_port` ccs1 from the Autopian review; Eletre `supercharger_access` still unfilled (needs owner decision); Maserati Grecale `battery.preconditioning`: 2025 `none` (estimated; cite the 2026 launch), 2026-27 `automatic_with_navigation` (Auto Express); Maserati GT/GC preconditioning only from the EV Database excerpt (`automatic_with_navigation`, unverified page).

Accepted as is: EX90 400 V vs 800 V fan-out, EX90 pack sizes, EX60 packs and port, Eletre, Maserati packs/DC, Polestar 4 specs from US/CA pages, EC40 copy mapping.
