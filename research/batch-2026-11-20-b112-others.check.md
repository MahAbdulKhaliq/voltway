# Check: batch-2026-11-20-b112-others.json

Verdict: **REJECT for every `heat_pump` entry** (all rest on ArenaEV, whose terms bar reuse without written permission). **FIX for `adapters_included`** (mostly sound; a few source and basis repairs below). `npx tsx scripts/add-facts.ts ... --check`: OK (valid, nothing written).

## Answers to the riskiest points

1. **ArenaEV terms.** https://www.arenaev.com/terms.php3, "USE OF WEBSITE INFORMATION": documents may be used "solely for personal, informational, non-commercial purposes", and "you may not use, download, upload, copy, print, display, perform, reproduce, publish, license, post, transmit or distribute any information from this website in whole or in part without the prior written permission of ArenaEV.com." There is no explicit scraping clause, but this is the same kind of restriction as the iSeeCars ban in ROUND2-BRIEF line 8 ("check any other spec aggregator's terms before citing it"). Recommend not citing ArenaEV for this round. (Other batches and NOTES.md already cite ArenaEV for specs; the owner may want to rule on it once for all.)
   - The values are also weak for NA trims. Pages I opened: Wagoneer S 2024 (US prices, EPA range) lists "Heat pump: Yes"; Charger Daytona Scat Pack 2024 (US, $73,200) says Yes and has no R/T data; Recon 2026 says Yes ($67,000, but "EU: 858 l" trunk); Fiat 500e is the **2020 European** 42 kWh sheet (WLTP 312 km), not the US car; Grecale Folgore is a 2022 **European** sheet (EU weight, EUR first); I-PACE 2023 is a European sheet (WLTP, EUR/GBP); VF 8 Plus 2022 says "For Europe, USA & Canada" but is a 2022 sheet; Rimac Nevera is a 2021 sheet. Carrying one sheet across 2024 to 2027 and across trims (R/T, Wagoneer S second trim, VF 8 Plus Performance, GranCabrio from GranTurismo) is not backed by any source. The Fiat and VinFast 2022/2023 sheets are, at best, `low_confidence` carry-overs, and the brief's carry-over rule needs a source that says the system is unchanged: none is given.
2. **Jaguar I-PACE adapter.** **`none` is supported.** InsideEVs (Aug 2025, 769774) quotes a Jaguar rep: "no word on when NACS to CCS1 adapters will be available for I-Pace owners" and "there is no Jaguar-approved charging adapter yet." The Charge Port's NACS checker does show I-PACE 2019-2024 as "Paid adapter", but that page attributes none of its rows to a source and Jaguar is not among its named sources, so it is unsupported. Disagreement to report (access not changed): our data gives I-PACE `supercharger_access = via_adapter` (estimated, low confidence) while adapter is `none`. The two are not strictly contradictory (Tesla allows access; the owner uses a third-party adapter, per InsideEVs the warranty risk is theirs) but under the brief a `via_adapter` car "normally" has some adapter value. InsideEVs is US only, so Canadian I-PACE is unverified (the notes already say so).
3. **VinFast adapter `none`.** The Charge Port rows show VF 8 (2023-2025 and 2027) and VF 9 (2024-2025 and 2027) as CCS1, "No adapter yet", and its FAQ says "no manufacturer-approved NACS adapter". VF 7 is **not on the page** (batch admits assumed). VF 8 2026 is not in the listed ranges (carried). No source behind the rows. **Terms of The Charge Port: could not be read** (the /terms URL returned 404 and the homepage fetch gave no footer text), so mark that unverifiable, not OK. The page's own source list names no VinFast source. Kind `community` + `low_confidence` is correct. A VinFast US page or a news item ("VinFast NACS" press) would be better; `none` also fits the already-stored `supercharger_access = no` (InsideEVs 2026 list), so the two agree.
4. **Fisker and Lordstown `none` (estimated).**
   - Fisker: Cars.com (Aug 2023) says Fisker would offer adapter-based Supercharger access "in the first quarter of 2025" and give a CCS adapter "later". That dates the maker's first (planned) offer after both Ocean model years. The bankruptcy (17 June 2024) is confirmed on the Wikipedia Fisker Inc. page, but **that page is not a registered source in the batch**; it only appears in the notes as a bare URL. Rule holds in substance; the source must be added.
   - Lordstown: the cited Wikipedia page confirms Chapter 11 (27 June 2023), the sale approved 18 Oct 2023 and production ending June 2023, but **says nothing about NACS, Superchargers or adapters**. The brief requires a source that dates the maker's first offer or Supercharger access. None is cited. Weak. The store already has `src-insideevs-supercharger-list-2026` (Lordstown not on the 2026 list), which is a better citation for the estimate. Note the Endurance 2023 cars were built before any NACS programme (Ford first announced Feb 2023), so the estimate is plausible but not shown.
5. **Estimates.**
   - Wagoneer S 2026 (nacs_to_ccs1_sold, estimated): electrive names Wagoneer S 2024 and 2025 only (verified). Basis "same CCS1 port and hardware, no change shown" is acceptable as a same-model carry; keep `low_confidence`. Still unproven that 2026 exists unchanged; compare with the 2025 car in `public/data/cars/` before accepting.
   - Grecale Folgore 2027: electrive lists Grecale Folgore 2025 and 2026 (verified); the Charge Port does list 2025-2027 as "Paid adapter" (but unsourced, ToS unknown, and it gives a $255 MSRP on Mopar vs the batch's $230/$250). Basis (same CCS1 hardware) acceptable; keep `low_confidence`.
6. **Unfilled (nothing written to the batch).**
   - Rimac Nevera adapter (4 cars): a web search for Nevera Supercharger/NACS adapter returned nothing Rimac-specific. Rimac is not on the Stellantis/electrive list and our access is `no` (InsideEVs 2026 list). For an unfilled field the owner rule applies (no unknowns): candidate is `none` estimated with the InsideEVs list as source, but that needs a source dating Rimac's first offer; none found.
   - Fisker Ocean heat pump (5): searches find only a Carwow UK equipment list that reportedly shows a heat pump on the Ultra (the Carwow specs page I opened did **not** mention it) and a spreadsheet with an unclear asterisk on Sport. Wikipedia's Fisker Ocean page does not mention one. Unconfirmed; nothing usable.
   - Lordstown heat pump (1): nothing found in this check.

## Table

Adapter rows share a source, so they are grouped. `Pages opened` = I reopened the cited URL.

| Variant group | Field | Value | Result | Evidence |
|---|---|---|---|---|
| dodge/charger-daytona 2024-2026 (R/T, Scat Pack, -2) | adapters_included | nacs_to_ccs1_sold, manufacturer | ✅ US / ⚠ Canada | electrive lists "Dodge Charger Daytona: 2024, 2025, 2026"; adapter "sold through certified low-emission vehicle dealers and online via Mopar"; electrive gives no price (the $230/$250 and CAD 386 come from InsideEVs, Electrek, Auto123, not opened by me). Canada availability only "implied". |
| dodge/charger-daytona 2027 Scat Pack (and -2) | adapters_included | ccs1_to_nacs_sold, manufacturer | ✅ (wording) | InsideEVs: CCS1-to-NACS adapter "not included. Customers must pay extra"; J1772 AC adapter standard. "Sold by Stellantis" is an inference but reasonable; US only is stated. |
| fiat/500e 2024-2026 (both ids) | adapters_included | nacs_to_ccs1_sold | ✅ | electrive: "Fiat 500e: 2024, 2025, 2026". |
| jeep/recon 2026 | adapters_included | nacs_to_ccs1_sold | ✅ US / ⚠ Canada | electrive: "Jeep Recon: 2026". Canada only inferred. |
| jeep/wagoneer-s 2024, 2025 | adapters_included | nacs_to_ccs1_sold | ✅ | electrive: "Jeep Wagoneer S: 2024, 2025". |
| jeep/wagoneer-s 2026 (awd, awd-2) | adapters_included | nacs_to_ccs1_sold, estimated | ✅ estimate OK | Year not named by electrive; same-model carry (see point 5). |
| maserati granturismo / grancabrio 2024-2026 | adapters_included | nacs_to_ccs1_sold | ✅ | electrive lists GranTurismo and GranCabrio Folgore 2024-2026. |
| maserati/grecale-folgore 2025, 2026 | adapters_included | nacs_to_ccs1_sold | ✅ | electrive: Grecale Folgore 2025, 2026. |
| maserati/grecale-folgore 2027 | adapters_included | nacs_to_ccs1_sold, estimated | ✅ estimate OK | see point 5. |
| jaguar/i-pace 2019-2024 | adapters_included | none, manufacturer | ✅ supported | InsideEVs: "there is no Jaguar-approved charging adapter yet". Charge Port "Paid adapter" unsourced. Kind: a Jaguar spokesperson statement, so `manufacturer` is acceptable. Disagrees with stored `via_adapter` access (report only). |
| vinfast vf-7 2025, 2027 | adapters_included | none, community | ❌ no support | VF 7 not on The Charge Port page; assumed from VF 8/9. |
| vinfast vf-8 2023-2027, vf-9 2024-2027 | adapters_included | none, community | ✅ with caveat | Charge Port: "No adapter yet"; no manufacturer-approved adapter. Site terms unverifiable; VF 8 2026 not in listed ranges. |
| fisker/ocean 2023, 2024 (5 ids) | adapters_included | none, estimated | 🏷 fix source | Cars.com: adapter access "in the first quarter of 2025"; bankruptcy 17 June 2024 confirmed on Wikipedia but not a registered source. |
| lordstown/endurance 2023 | adapters_included | none, estimated | ❌ basis not shown | Wikipedia page has no NACS/Supercharger/adapter content. |
| rimac/nevera (4 ids) | adapters_included | not filled | ❌ missing | see Unfilled. |
| all dodge, fiat, jeep, maserati trims | heat_pump | standard | ❌ source barred | ArenaEV terms (see point 1). Pages do say "Heat pump: Yes" for Wagoneer S 2024, Scat Pack 2024, Recon 2026, Fiat 500e 2020, Grecale 2022, GranTurismo (not opened). R/T has no sheet. |
| jaguar/i-pace 2019-2024 | heat_pump | standard | ❌ source barred | ArenaEV 2023 sheet "Yes", European. |
| vinfast vf-7/8/9 | heat_pump | standard | ❌ source barred / ⚠ weak | ArenaEV VF 8 Plus 2022 "Yes", "For Europe, USA & Canada"; VF 7 and VF 9 sheets not opened; Eco, Plus Performance carried. |
| rimac/nevera (4 ids) | heat_pump | standard | ❌ source barred | ArenaEV 2021 sheet "Yes", price €2,000,000. |
| fisker/ocean (5 ids), lordstown | heat_pump | not filled | ❌ missing | see Unfilled. |

## Required changes

1. Drop all `heat_pump` entries (and the `src-b112o-*` ArenaEV sources) sourced from ArenaEV, or get the owner's explicit decision that ArenaEV may be cited. If kept, they are not usable as `standard` for trims no page shows (Charger R/T, Wagoneer S second trim, VF 8 Plus Performance, Eco, GranCabrio, Nevera R, all years carried).
2. Replace with maker or allowed sources (Stellantis US/Canada build pages, Car and Driver, MotorTrend, InsideEVs, Electrek, Wikipedia, Auto-Data, Cars.com, KBB), starting with Fiat 500e (US page, not the 2020 European sheet) and Jaguar (Jaguar I-PACE spec pages).
3. VinFast VF 7 `adapters_included`: drop or mark clearly as an estimate from VF 8/9 with a basis, since the cited page does not list VF 7. Add a source for VinFast's own statement if one can be found; The Charge Port's terms could not be checked.
4. Fisker (5 cars): register the Wikipedia Fisker Inc. bankruptcy page (or another dated source) as a source and cite it, in addition to Cars.com.
5. Lordstown: change the source to `src-insideevs-supercharger-list-2026` (plus Wikipedia for dates) or drop the field; Wikipedia alone does not meet the brief's estimate rule.
6. Dodge/Fiat/Jeep/Maserati: the notes' prices and CAD 386 come from sources not cited in `sources`; electrive states no price, so either cite InsideEVs/Electrek/Auto123 as separate sources or drop the prices. Canada for Recon is only inferred.
7. Report: I-PACE adapter `none` vs `via_adapter` access disagreement; VinFast and Fisker access `no` agree with `none`; Rimac adapter and Fisker/Lordstown/Rimac heat pump remain unfilled (owner rule 2026-11-19 requires a value or an explicit decision).

## Applied by the main session (2026-11-20)
1. All ArenaEV heat pump entries removed (66) with their sources, pending the owner's ruling on ArenaEV (its terms bar reuse; 41 existing sources cite it). The batch before this change is kept as `batch-2026-11-20-b112-others.with-arenaev.json` (git-ignored).
2. VinFast VF 7 adapter dropped (not on The Charge Port page).
3. Fisker: Wikipedia bankruptcy source registered (`src-b112o-wikipedia-fisker`) and named in the notes.
4. Lordstown adapter cites `src-insideevs-supercharger-list-2026`.
5. Stellantis: notes say the prices come from articles not cited; CA-market cars `low_confidence`.
6. Rimac adapter, Fisker/Lordstown heat pumps and every heat pump this batch had from ArenaEV stay unfilled.
- `add-facts --check`: OK.
