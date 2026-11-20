# Fact-check: batch-2026-11-19-w2-mercedes-smart.json (2026-11-19)

**Verdict: FIX.** `add-facts.ts --check` is OK (1408 variants, 549 sources). The mbusa data-sheet values I opened all match. The problems are a few mislabelled or unsupported values (B-Class, smart, AMG GT), a gross/usable reading that the researcher rules say not to make, and preconditioning that rests on one CLA page when better pages exist.

## Spot-checks (mbusa data sheets, re-read today)

| Powertrain | Field | Batch | Result | Evidence |
|---|---|---|---|---|
| eqs 2022 450+ | usable / AC / DC / 10-80 | 107.8 / 9.6 / 200 / 31 | verified (label caveat) | "Battery capacity 107.8 kWh"; Wikipedia table "120 / 107.8" full/usable |
| eqs 2023 450 4MATIC, eqs-suv 2023 580 | usable | 108.4 | verified (label caveat) | sheets: "108.4 kWh", DC 200 |
| eqs 2025 450+, eqs-suv 2024 580, 2024 450 SUV | usable | 118 | verified (label caveat) | sheets "118 kWh"; Edmunds / Green Car Reports (via search) say 118 usable |
| eqs-suv 2024 Maybach 680 | usable | 107.8 | verified | sheet "107.8 kWh" |
| eqs 2027 500 / 580 | DC, AC, 10-80 | 350 / 9.6 / 27 | verified | "350 kW (800V), 175 kW (400V)", 27 min; sheet has no battery row |
| eqs 2027 500 / 580 | usable 122 (estimated) | 122 | unproven | mbusa MY27 and electrive say only "122 kWh battery"; electrive labels just the 400's 112 as "usable net" |
| eqe 2024 350+ sedan | usable | 90.6 | verified | sheet eqe350v "90.6 kWh" |
| eqe-suv 2024 350+ | usable | 96 | verified | sheet eqe350x "96.0 kWh" |
| eqe 2025 350+ | usable | 96 | verified | sheet "96 kWh"; KBB says 350+/500 rose from 90.6 to 96 |
| eqe-suv 2023 350 4MATIC | usable | 89 | verified | sheet "89.0 kWh, 170 kW, 32 min" |
| eqe 2026 / eqe-suv 2026-27 320 4MATIC | usable | 90.5 | verified | sheets "90.5 kWh", 170 kW |
| eqe-suv 2027 320 | charge port | ccs1 | verified | 2027 sheet "Combined Charging System (CCS)" |
| eqb 2025 250+ | gross / AC / DC / 10-80 | 70.5 / 9.6 / 100 / 35 | verified | sheet "70.5 kWh", "9.6 kW", "100 kW", "35 minutes" |
| g-580 2026 | usable / DC / 10-80 | 116 / 200 / 32 | verified | sheet "116 kWh", "200 kW", "32 minutes"; auto-data.net "Net (usable) 116 kWh" |
| g-580 2027 | usable / port / 10-80 | 117 / nacs / 29 | verified (label caveat) | sheet "117 kWh", NACS DC connector, 29 min |
| cla 2026 250+ | usable / DC / AC / 10-80 | 85 / 320 / 9.6 / 22 | verified | sheet; MB release "Usable capacity 85 kWh", chemistry NMC |
| NACS page | CCS1 for EQB/EQE/EQS/G580; CLA NACS; MY27 NACS | | verified | "For vehicles with CCS1 inlet (EQB, EQE, EQS, G580), a NACS to CCS1 adapter is needed" |
| EQS/EQE Wikipedia | chemistry nmc, 400v | | verified | EQS "108 kWh 400V NCM 811"; EQE "90.6 kWh 400V NCM 811 328 volts" (page states them, so `estimated` is stricter than needed) |

## Your questions

**Fan-out (EQS 107.8/108.4/118; EQE 90.6 vs 96 per id).** Every sheet I opened matches the assignment per year and body: 2022 EQS 107.8, 2023-24 sedan and 2023 SUV 108.4, 2025-26 sedan and 2024+ SUV 118, Maybach 2024 107.8 and 2025+ 118. EQE 2024 sedan 350+ is 90.6 but the 2024 SUV 350+ is 96, which looks odd but is what the two sheets say (an EV Database MY24 listing says 96 for the sedan, so the sheet may be stale, but the sheet is what the batch cites). Wikipedia infobox gross values (EQS 120, EQE 100) are copied onto the 108.4 and 89/90.5 packs; that is unproven for those packs (see fix 9).

**mbusa "battery capacity" read as usable.** The researcher rule is: bare "battery capacity" is gross unless the page says usable/net. The batch departs from it, so these values cannot be `manufacturer` on the mbusa label alone. Per pack the reading is right for 107.8 (Wikipedia table: usable), 90.6 and 89 (Wikipedia: usable), 118 (Edmunds / Green Car Reports: usable), 116 (Mercedes release and auto-data: usable). It is not shown for 108.4, 96, 90.5, 117 and 122, and it is wrong for EQB (70.5 is gross). The `low_confidence` flag is the batch's own answer; the rule asks for `estimated` with a named basis (usable-from-source on a sibling) when the page is silent. I would accept `manufacturer` plus `low_confidence` only where a second page labels the same figure usable (107.8, 90.6, 89, 118, 116), and ask for `estimated` or a page elsewhere.

**EQB usable 66.5 (estimated).** Wikipedia's EQB page says only "66.5 kWh" with no gross or usable label, so the cited basis does not prove it. The 70.5 gross / 66.5 usable split is widely listed (ev-database, Auto Express listings), but I could not open a page that states it (ev-database returned 429; Auto Express pages not opened). Keep it `estimated` / `low_confidence`, but fix the note: Wikipedia does not say usable. The 2022 EQB 300 sheet shows 70.7 (not 70.5); a typo on the sheet most likely, so say so.

**EQB chemistry nmc and 400v.** Cited to Wikipedia EQS. That is the wrong car: the EQS page says nothing about the EQB, and EQB is a different platform (MFA2) with a different pack. EV Database (search excerpt) gives EQB "Architecture 400 V, nominal voltage 367 V", with cathode "No Data". 400v is supported by that excerpt but not by the cited source. Chemistry for the EQB is unproven; I found no page. A platform-sibling basis is not allowed here (different pack).

**G 580 chemistry nmc and 400v.** Also cited to Wikipedia EQS (wrong car). Mercedes describes the G 580 pack as lithium-ion, 216 cells, 116 kWh usable; German auto-motor-und-sport and auto-data.net list "Lithium-ion" only. I found no page naming the cathode and none stating 400 V (the 200 kW peak at 480 V, 300 A style sheet suggests 400 V class but is not a statement). Unproven; either find a page or drop both fields for G 580.

**CLA, GLC.** CLA usable 85, NMC, 9.6 kW AC, 320 kW verified on the MB release and sheet. The 800 V claim is cited to the mbusa future-vehicles page (not reopened by me; the sheet's 320 kW is consistent). GLC: usable 94, NMC and AC 11.5 are on the quick-reference guide per the notes (not reopened); the batch uses 9.6 (mbusa sheet) for AC, which is reasonable for the US. Keep the conflict noted.

## Weak values you asked about

**B-Class Electric Drive 28 kWh usable, 10 kW AC.** Pages exist, so the "recollection" notes can be replaced:
- Usable 28: https://auto-data.net/en/mercedes-benz-b-class-electric-drive-w242-28-kwh-179hp-20827 ("Gross 31 kWh", "Net (usable) 28 kWh"); Top Gear (search excerpt) calls it "28kWh (usable)". The US pricing release https://prnewswire.com/news-releases/mercedes-benz-announces-pricing-for-the-2014-b-class-electric-drive-257169381.html says only "28 kWh lithium-ion battery" (bare, no usable label).
- AC 10: https://chargedevs.com/newswire/mercedes-b-class-electric-drive-goes-into-production, "a 10 kW onboard charger", a US-launch article. Another ChargedEVs page says 10.1 kW; Autoblog quotes 11 kW for the European car. Record 10 as `manufacturer`-relayed or `estimated` with this page, `low_confidence`.
- Gross 36 is wrong as `manufacturer`: Wikipedia says only "36 kWh lithium-ion battery from Tesla Motors" (no gross label, and it conflicts with the 31 gross on auto-data; Consumer Reports calls 36 a maximum-charge figure). Drop the 36 gross, or record it as `estimated` with the conflict stated. Do not call it `manufacturer`.
- Chemistry nca (from "Tesla Motors supplied", Panasonic assumption): the cited page does not say it; the inference is by manufacturer identity only, not a same-model basis. Unproven; drop or leave with `low_confidence` and tell the owner it is a guess. Same for 400v (page silent).
- Preconditioning none and DC 0: reasonable (Wikipedia: Supercharging not enabled, CHAdeMO only by conversion), but the `none` basis ("predates Electric Intelligence launch") should cite the Mercedes launch page, not Wikipedia.
- The EPA charge-time basis in the AC note is not valid: the EPA page shows 3.5 h and battery -1 only.

**smart ED 2011 usable and AC.** The batch's 14 kWh usable rests on the English Wikipedia phrase "14 kWh initially, later 17.6", which is not labelled usable; the same Wikipedia says the ED2 pack is 16.5 kWh. Better pages: https://greencarscompare.com/car/smart-electric-drive-ed2-fortwo-coupe/charging/ ("16.5 kWh battery (15.7 kWh usable)", "up to 3.3 kW AC") and https://en.wikipedia.org/wiki/Smart_electric_drive ("The car has a 3.3 kW on-board charger"). So usable 14 is contradicted (15.7) and AC 2 kW (scaled from EPA hours, "implies a charger" is not an allowed basis) is contradicted (3.3). Replace both. The EPA 2011 record (id 31065) has battery -1 and no charger field; the 8 h figure cannot give a charger rating.

**smart 2013-2019.** Usable 16.7 is taken from the German Wikipedia ED4 row (2017-24), applied to the ED3 (2012-16) packs: same 17.6 kWh gross, but the English Wikipedia says ED4 usable is 17.2. Sources (search excerpts) put the 2013 car at 16.7. Accept as `estimated` for ED3 only if the note names the ED4 row as the basis (it does say German Wikipedia). For 2017: AC 7.2 kW is stated on English Wikipedia ("The charge rate is 7.2 kW", "7.2 kW onboard charger") and is labelled `manufacturer` in the batch; fine as a relayed figure, but it is a US 2017 statement; 2018-19 is estimated from it (OK). 2013-16 AC 3.3 is estimated from EPA hours; the English Wikipedia gives 3.3 only for ED2, and the DE page gives 3.7 kW for the EU ED3. Leave 3.3 `estimated`, but cite a US source for it if one is found (Fleetnews says 3 kW AC).
- smart gross values (16.5 / 17.6) are labelled `manufacturer` with the German Wikipedia table as source; the table does not say gross for ED2/ED3 (the page itself says it doesn't state gross vs usable). Make them `estimated` or add a gross/usable source.
- smart chemistry: nca for ED2 (Tesla) and nmc for ED3+ are both inferred, no page states either. English Wikipedia says only "lithium-ion", "LG chemistry". Unproven; both should be dropped or left `estimated` / `low_confidence` with that stated.

**Preconditioning resting only on the CLA release.** The CLA page does state a navigation trigger ("preconditioning the high-voltage battery ... for DC fast charging" with Electric Intelligence), so `automatic_with_navigation` is verified for the CLA. For EQS/EQE/EQB/G/GLC/AMG GT it is `estimated` from the CLA, with the notes claiming a 2021 EQS launch feature that no cited page shows. The batch can do better:
- EQE / EQS: Mercedes USA quick-start guide https://www.mbusa.com/content/dam/mb-nafta/us/mercedes-me-charge/EQE_EQS%20Quick%20Start%20Guide_Final.pdf (search excerpt: "HV Bat. Pre-Temp. Control will automatically prepare the battery ... before you reach the station"; my fetch could not read the PDF text, so confirm) and https://media.mbusa.com/releases/mercedes-amg-eqe-new-all-electric-performance-sedan-from-affalterbach (AMG EQE: battery preheated "if Navigation with Electric Intelligence is activated"), and https://media.mercedes-benz.ca/releases/release-c6ffb9918e70966e2c6964edd3051e7a-the-eqs-navigation-with-electric-intelligence. Use these for EQS/EQE (cite per car, same trigger on the sedan and SUV is a lineup-wide feature).
- Manual half: https://mbusa.com/en/electric-cars-faq says "Preconditioning can be initiated on-demand from the Mercedes-Benz app", but the same sentence is about extreme-temperature range, so it may be cabin climate preconditioning, not battery. If it is battery, `automatic_and_manual` would be right. Unproven either way; do not claim manual and do not claim "no manual" either; keep `automatic_with_navigation` and add the caveat.
- EQB, G 580, GLC, AMG GT: no page found. The cross-car estimate from CLA is allowed only as a "lineup-wide software feature" when Mercedes states it for that year; I found no such statement. EQB (MFA2) is the least certain (older MBUX). Keep as `estimated`, `low_confidence`, with a note that it is not shown for these cars, or drop EQB.

**AMG GT 4-Door 11 kW AC.** English Wikipedia: "11-kW AC" for the second-generation 2027 car (no market given; assembly Germany). Mercedes US lists 9.6 kW for every other US EV in this batch (EQS, EQE, EQB, G, CLA, GLC). Port/AC for the US needs a US source, so 11 is unproven for the US/Canada car. Either find the mbusa 2027 AMG GT data sheet (not found) or mark the US value unknown/low-confidence. Also: Jalopnik/InsideEVs say NCMA cathode (silicon anode); the batch records `nmc` for it. Check whether the schema has an NMCA enum; if not, `nmc` is a coarser statement than the page and should say so in the notes. Usable 106 is stated by Jalopnik; InsideEVs says only "106 kWh", so the usable label rests on Jalopnik (not reopened by me, the notes quote it).

## Kinds and low_confidence
- mbusa sheet values are `manufacturer`, correct.
- Wikipedia-sourced `manufacturer` figures that the page does not attribute to Mercedes or label gross (B-Class 36, smart 16.5 / 17.6 gross, 7.2 kW AC on smart 2017, Wikipedia gross 100/120 for EQE/EQS) should be `estimated` or `community`-backed; I flag B-Class 36 and smart gross as clear mislabels.
- EQS/EQE chemistry and 400 V are marked `estimated` although Wikipedia states them. That is over-cautious but not wrong; it could be upgraded to `manufacturer`-relayed only if the Wikipedia reference traces to Mercedes (infobox is uncited, so keep `estimated`).
- `low_confidence` is applied widely and correctly on the weak ones.

## No unknowns (item 14)
Not listed in this batch for a covered powertrain: B-Class and smart have no published 10-80 time (fine, no DC); G 580 has chemistry/voltage only as inferences; AMG GT has no DC 10-80 sheet; GLC and CLA complete. EQB/G 580/AMG GT preconditioning is estimated. Please confirm every covered powertrain has all required fields; I did not enumerate against `powertrain-gaps.json` field by field.

## Numbered fix list
1. B-Class gross 36 kWh: drop, or relabel `estimated` and state that auto-data lists 31 gross / 28 net and Consumer Reports calls 36 a maximum-charge figure.
2. B-Class usable 28: cite https://auto-data.net/en/mercedes-benz-b-class-electric-drive-w242-28-kwh-179hp-20827 (net 28) and drop the "recalled from launch coverage" note.
3. B-Class AC 10 kW: cite https://chargedevs.com/newswire/mercedes-b-class-electric-drive-goes-into-production ("a 10 kW onboard charger"), drop the EPA-hours basis.
4. B-Class chemistry nca and 400v: drop, or keep `estimated`/`low_confidence` and tell the owner no page states them. Preconditioning `none`: cite a Mercedes launch page rather than Wikipedia.
5. smart 2011: usable 14 is contradicted (15.7 on greencarscompare); AC 2 kW is contradicted (3.3 kW on Wikipedia Smart electric drive and greencarscompare). Replace both; cite those two pages.
6. smart gross 16.5 / 17.6: relabel `estimated` (German Wikipedia does not say gross) or find a gross/usable source; ED2 chemistry nca and ED3+ nmc are guesses, drop or leave flagged.
7. smart 2013-16 usable 16.7: note it is the ED4 row applied to ED3 (ev-database/iSeeCars list 16.7 for 2013-15); 2017 usable 16.7 vs English Wikipedia 17.2, record the conflict.
8. EQB: fix the 66.5 note (Wikipedia gives no usable label); chemistry nmc is cited to the EQS page, the wrong car (drop or find an EQB page); 400v cite EV Database (400 V, 367 V nominal) or similar, not the EQS Wikipedia page.
9. G 580 chemistry nmc and 400v: cited to Wikipedia EQS, wrong car; find a G 580 page or drop. Also, EQS gross 120 and EQE gross 100 are copied from Wikipedia to the 108.4, 89 and 90.5 packs; unproven for those, state it in the notes or drop.
10. EQS/EQE/AMG EQE preconditioning: cite the Mercedes USA quick-start guide, the AMG EQE release and the Canada EQS release instead of the CLA page plus "since the 2021 EQS launch". Do not use the CLA release for EQB, G 580, GLC or the AMG GT unless Mercedes states a lineup-wide feature.
11. 2027 EQS usable 122: still `estimated`; the "112 is usable so 122 is" argument is weak; say so in the notes.
12. AMG GT 11 kW AC: unproven for US/Canada (Wikipedia, Euro build); mark `low_confidence` and note that US Mercedes EVs show 9.6 kW, or drop. Chemistry NCMA recorded as `nmc`: note it.
13. Per-pack "battery capacity read as usable" should be `estimated` for 108.4, 96, 90.5, 117 (the pages are silent), or add a second page that labels it usable.

## Not verified
mbusa future-vehicles and quick-reference pages (CLA 800 V, GLC 94 / 11.5), Jalopnik, Canadian Supercharger access (no Mercedes Canada page). EV Database returned 429. Mercedes quick-start PDF could not be text-extracted.
