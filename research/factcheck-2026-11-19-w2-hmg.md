# Fact-check: batch-2026-11-19-w2-hmg.json (2026-11-19)

**Verdict: FIX.** `npx tsx scripts/add-facts.ts research/batch-2026-11-19-w2-hmg.json --check` passes ("batch is valid, 1408 variants, 535 sources"). The hardware fan-out is right. Nothing is a systematic reject. But about a dozen groups of values need a source, kind or basis change, and four of them can be upgraded with pages I found (list below). No required field is empty for any covered powertrain (55 powertrains plus 1 variant; the brief says 56).

Notes on method: ev-database.org returned HTTP 429 on every fetch, so EVDB figures below come from search excerpts and are marked "search excerpt". Genesis spec-sheet PDFs were not text-readable. Kind `community` (spec-site values such as Weekly Driver, Wikipedia, ArenaEV) is in the schema and I accept it.

## A. Fan-out by hardware generation

| Generation | Ids | Result | Evidence |
|---|---|---|---|
| GV70 77.4 kWh 2023-25, 84 kWh 2026-27 | 6 | ✅ split by year right | Green Car Reports table: "77.4 kWh" 2025, "84 kWh" 2026; Genesis US GV70 page "84-kWh battery"; Genesis KR notice lists Electrified GV70 84.0 kWh / 697 V / SK ON pouch / NCM |
| GV60 77.4 kWh 2023-25, 84 kWh 2026-27 | 17 | ✅ | Genesis US GV60 page "84 kWh battery and 800-volt architecture" (2027); Genesis KR notice: facelift GV60 84.0 / 697 V / NCM. Fastned labels 84 kWh "2025+" and 77.4 "2022-2025" (overlap in 2025). Genesis US says the 2026 model is the facelift, so 2025 = 77.4 is acceptable |
| Soul EV 27 kWh 2015-17, 30 kWh 2018-19 | 5 | ✅ capacity and voltage | Wikipedia table: 30.5/27 kWh, 360 V (2016-17); 31.8/30, 375 V (2018-19). 2015 = 2016 pack: SAE/Mobility Engineering Kia article "192 cells... 27 kW·h" |
| Soul EV Canada 2020+ 64 kWh and 39.2 kWh | 8 | ⚠ 64 ✅ (Wikipedia 67.5/64, 356 V, CCS, "up to 100 kW"); 39.2 kWh pack and its Canadian availability not on Wikipedia (see fix 4) | ArenaEV e-Soul 39 kWh 2020: "39.2 kWh usable, 42 kWh total", 327 V (European car) |
| Ioniq Electric 28 kWh 2017-19, 38.3 kWh 2020-21 | 5 | ✅ | Wikipedia: 28 kWh 2016-19, 38.3 kWh 2020-22; charger 6.6 then 7.2 kW; chargedevs: "38.3 kWh battery... 7.2 kW" |
| Ioniq 9 2027 (3 ids) | 3 | ✅ as carryover | Electrek 2026-11-11 describes it as carryover |
| G80 87.2 kWh 2023-25 | 3 | ✅ | Cars.com "87.2-kWh battery"; Genesis DE/CH pages now say 94.5 kWh (facelift) |
| EV3 (4), EV4 (4), Ioniq 5 2026 variant (1) | 9 | ✅ packs | Kia UK spec: 58.3 kWh 369 V 101 kW, 81.4 kWh 343 V 128 kW |

## B. Values

Phrases are quoted from the pages I opened. Rows are per generation; "x ids" = the same value on every id of the group.

| Variant / group | Field | Value (kind) | Result | Evidence |
|---|---|---|---|---|
| G80 (3) | gross | 87.2 (m / e for 2024-25) | ⚠ kind | Cars.com is a reviewer: "its 87.2-kWh battery", not attributed to Genesis. InsideEVs teardown also says 87.2 gross. Use `community`, or keep with low_confidence |
| G80 | usable | 83.4 (est) | ❌ basis | Basis (E-GMP 74/77.4 ratio, "likely the same cell") is not proven: the teardown compares modules only. Search excerpt: EVDB 1703 "Useable 82.5 kWh", EVKX 80.1. Use 82.5 from EVDB (community), drop the estimate |
| G80 | chemistry | nmc (est) | ⚠ no allowed basis (see section C) | Genesis KR notice row: "Electrified G80 \| 94.5 \| 523 \| SK ON \| Pouch \| NCM" is the facelift pack, not 87.2 |
| G80 | voltage class | 800v (m) | ✅ | ArenaEV G80: "522.7V (800V type)"; Genesis AU "Maximum 800V charging" |
| G80 | preconditioning | automatic_and_manual (est, DE page + GV60) | ❌ replace | Genesis AU Electrified G80 page: "activates when a fast-charging station is set as your destination and can also be controlled manually". Record as `manufacturer`, source that page. The DE page does not say how it starts (confirmed) |
| G80 | dc_max | 187 (m) | ⚠ kind | Cars.com: "can only accept a maximum 187 kW", reviewer wording; a search excerpt says a Genesis charging page states 187 kW, but the UK page now 404s and the CH page gives no peak. Relabel `community` unless a Genesis page is found |
| G80 | ac_max | 10.9 (m) | ⚠ | Cars.com "can charge at 10.9 kW" (US review). Genesis CH says 11 kW; AU spec sheet reportedly 10.5 kW (PDF not readable). Within 5 %, low_confidence kept |
| G80 | 10-80 | 22 (m) | ✅ | ArenaEV and Genesis AU: 22 min |
| G80 | charge_port / supercharger | ccs1, via_adapter | ⚠ Canada | Genesis US: "2023-2025 Genesis electric vehicles with CCS charge ports". Cars are CA+US; the Canadian page does not name the G80. Add a Canadian source or note it as US-only |
| GV70 77.4 (2023-25) | usable 74, chem nmc, V 800v, AC 11, DC 233 (all est) | ⚠ | Basis "same pack as GV60" is unproven for the 77.4 pack (Genesis KR notice proves it only for 84 kWh). Note text "GV70 shares the E-GMP platform" should be removed, it is not shown anywhere. Keep estimated, low_confidence |
| GV70 77.4 | gross 77.4, 10-80 18 | ✅ | Green Car Reports: "77.4 kWh", "now-optimal 18 minutes" (2025 car) |
| GV70 77.4 | preconditioning | automatic_and_manual (est, GV60 DE page) | ❌ replace | Genesis US owner page "Maximize Battery Life in Your Genesis GV70 EV": auto "may activate" when navigating to a fast charger; manual: EV menu > Battery Conditioning Mode > activate. Record `manufacturer` (applies 2023+ GV70 EV) |
| GV70 2023 (CA only) | charge_port ccs1 (m), supercharger via_adapter | ⚠ market | Port cited from Genesis USA page; this car is CA only. Genesis Canada (2023 announcement) says "from 2025" new or refreshed EVs get NACS only: 2025 Canadian GV70/GV60 port is not proven CCS1. Needs a Canadian source for 2023-2025 |
| GV70 84 (2026-27) | gross 84, 10-80 20/19, V 800v | ✅ | Genesis US GV70: "84-kWh battery", "up to 350kW... 800V", "as few as 19" min; GCR "about 20 minutes" |
| GV70 84 | usable 80 (est), chem nmc (est) | ✅ basis | Genesis KR notice: GV70/GV60 84.0 kWh, 697 V, SK ON pouch, NCM; matches the Ioniq 5 84 pack in `data/` (80 usable, nmc). Chemistry can be upgraded to `manufacturer` citing the KR notice (src needs adding) |
| GV70 84 | dc_max 260 (est), AC 11 (est) | ✅ basis (weak) | KR notice shows same pack; same charger hardware not shown. Keep low_confidence |
| GV70 / GV60 2026+ | charge_port nacs, supercharger yes | ✅ | Genesis US: "Beginning with 2026 models, every Genesis Electrified vehicle will feature... NACS port"; "36,000 Tesla Superchargers" |
| GV60 77.4 (2023-25) | gross 77.4, usable 74, chem, V, AC 11, DC 233 (community / est) | ✅ | Weekly Driver: "Genesis GV60 2023", 74 kWh usable of 77.4, NCM 811, 697 V, 233 kW, 11 kW. ArenaEV conflict (77.4 usable / 82.5 total) disclosed |
| GV60 77.4 | preconditioning | automatic_and_manual (m, DE page) | ⚠ kind | Genesis DE GV60: "activates automatically if a fast-charging station is set as a route destination, or can be activated manually" (verified). The page is undated and German, so 2023-25 US/CA cars should be `estimated` (same model, other year) unless a GV60 owner page is cited |
| GV60 77.4 | 10-80 18 | ✅ | ArenaEV: 18 min |
| GV60 84 (2026-27) | gross 84, V 800v, 10-80 18, port, supercharger | ✅ | Genesis US GV60: "84 kWh battery and 800-volt architecture", "as little as 18 minutes", "36,000 Tesla Superchargers" |
| GV60 84 | **dc_max 260 recorded `tested`** | ⚠ kind | Fastned page: "GV60 84 kWh (2025+) max charge speed 260 kW"; it does not say measured or manufacturer-stated, only that the curve shows behaviour at "around 30 C". Not proven independent measurement: label `community` (or keep `tested` only if the notes say "Fastned network charging data; method not stated"). Also covers GV70 260 (est from this) |
| GV60 Magma | dc_max 250 (m) | ✅ with caveat | Genesis Canada: "18-minute rapid recharging (10-80%) at 250 kW (800V) for the 84 kWh battery system". Ambiguous car-vs-charger, already disclosed; 4 % below 260 so fit is fine |
| Ioniq 9 2027 (3) | gross 110.3, usable 106, chem, V, DC 237, 10-80 24 (est from 2026) | ✅ | Matches existing 2026 powertrains (237 community, 24 manufacturer); carryover per Electrek |
| Ioniq 9 | AC 11 (est) | ⚠ market | EVDB European listing; the cars are US-only. Hyundai US states 10.9 on its other E-GMP cars. Within 5 %; add a US source or note |
| Ioniq 9 | preconditioning | automatic_and_manual (est) | ✅ | Hyundai US MEa manual: "manually operate the Battery Conditioning function or automatically" with DC charger as destination or waypoint; the page does not name the model (ME = IONIQ 9 code), disclosed |
| Ioniq 9 | charge_port nacs, supercharger yes (est) | ❌ market | Cited Hyundai Canada FAQ/showroom; the three 2027 cars are US-only. Port and Supercharger access need a US source (Hyundai USA IONIQ 9 page) |
| Ioniq 5 2026 Limited AWD (US variant) | charge_port nacs, supercharger yes (est) | ❌ market | Cited Hyundai Canada 2026 IONIQ 5 page ("Easily connect to Tesla Superchargers... with the NACS Charge Port"); the car is US-only and its page names no Limited trim. Cite the US 2025 Limited source already on file (src-hmgma-2025-ioniq-5-xrt) and the US 2026 page |
| Ioniq Electric 2017-21 | chemistry nmc (est) | ⚠ see section C | |
| Ioniq Electric | voltage 400v (est, cites Soul EV page) | ⚠ source | ArenaEV 38 kWh 2020: "320V"; use that page for the car itself |
| Ioniq Electric 2017-19 | gross 30.5, usable 28 | ✅ | ArenaEV: "28 kWh usable, 30.5 kWh total" |
| Ioniq Electric 2020-21 | usable 38.3 (est, "read as usable") | ❌ basis | chargedevs: "38.3 kWh battery pack" is a bare figure (gross by rule 3) and the batch's pattern-inference is not an allowed basis. ArenaEV 2020 page (fetched): "Total 40.4 kWh, Usable 38.3 kWh". Record usable 38.3 and gross 40.4 as `community` from ArenaEV |
| Ioniq Electric 2017-19 | dc 70 (tested) | ✅ | Fastned: "30.5 kWh 2016-2019... Max charge speed: 70 kW". Wikipedia's "up to 100 kW" is the inlet/charger rating |
| Ioniq Electric 2020-21 | dc 50 (community) | ⚠ fit | Wikipedia "would only accept a 50kw 'fast' charge" is a charger limit; Fastned 38.3 kWh: 45 kW; InsideEVs test "just under 50 kW". Value 50 is up to 11 % above Fastned. Prefer the InsideEVs tested figure (kind `tested`) |
| Ioniq Electric | ac 6.6 / 7.2 (m) | ✅ | Wikipedia 6.6 (2016-19), 7.2 (2020+); chargedevs "7.2 kW on-board charger"; CA assumed same, disclosed |
| Ioniq Electric | preconditioning none (est) | ✅ | HMG page: conditioning presented as new with 2023 IONIQ 5; UK press kit and chargedevs silent. Rule "predates the maker's first launch" holds. Caveat (Canadian battery heater) disclosed |
| Ioniq Electric | port ccs1, supercharger via_adapter | ✅ (CA weak) | Wikipedia "CCS Combo 1 inlet"; Motor.com: "IONIQ Electric (hatchback)" adapters, purchases by 2025-01-31. Hyundai CA FAQ does not name the Ioniq Electric (confirmed); it says 2025-and-earlier CCS EVs "can use a NACS adapter" |
| Soul 2015-17 | gross 30.5, usable 27, V 400v | ✅ | Wikipedia table (360 V) |
| Soul 2018-19 | gross 31.8, usable 30, V 400v | ✅ | Wikipedia table (375 V) |
| Soul 2015-19 | chemistry nmc (est) | ❌ upgrade | Pages name it for the 27 kWh pack (section C) |
| Soul 2015-19 | dc 50 (tested, Fastned) | ⚠ | Fastned: "Soul EV 33 kWh, 2017 to 2019... 50 kW... CHAdeMO", a European pack that does not match 27/30 kWh, and years do not cover 2015-16. Wikipedia says "up to 100 kW" (CHAdeMO spec), Electrek ~70 kW. Not a measurement of these packs: relabel `estimated` for 2015-16 and note the pack mismatch for all, or `community` |
| Soul 2015-19 | ac 6.6 (est) | ⚠ weak basis | fueleconomy.gov page: "4 hours at 240 V" (no kW). 27 kWh / 4 h = 6.75, so 6.6 is an inference, not an allowed basis. Find a Kia page stating the charger kW; the 2018-19 30 kWh pack is not on that fueleconomy page at all |
| Soul 2015-19 | port chademo, supercharger no | ⚠ | Electrek: "previous models used CHAdeMO". The batch's own caveat (some early US trims may lack the DC port) is unverified; say which trims or state the limit |
| Soul 2015-19 | preconditioning none (est) | ✅ | InsideEVs: EV6 conditioning upgrade 2022-23; Kia first launch long after |
| Soul 2020+ 64 kWh | gross 67.5, usable 64, V 400v, port ccs1 | ✅ | Wikipedia table; Electrek "CCS standard" |
| Soul 2020+ 64 kWh | chem nmc (est, Weekly Driver pre-E-GMP 64 page), DC 77 (est from Niro test), AC 7.2 (est) | ✅ basis | Electrek: pack same as Niro EV and Kona; InsideEVs Niro test peak ~77 kW; Kia's own "about 100 kW for the first 50 %" disclosed. Existing Niro 2019 (77 tested, 7.2 m, none est) agrees |
| Soul 2020+ 64 | preconditioning none (est) | ⚠ | Rests on Niro EV 2019 powertrain record, not a page; Canadian battery heater unchecked (disclosed) |
| Soul 2020+ 39.2 kWh | usable 39.2 (est, cites Fastned Kona 39) | ❌ page | Fastned says "39 kWh", not 39.2 and not usable. ArenaEV e-Soul 39 kWh 2020: "39.2 kWh usable, 42 kWh total", 327 V. Cite that page, add gross 42 |
| Soul 2020+ 39.2 | chemistry nmc (est) and preconditioning none (est) | ❌ basis | Both rest on the **64 kWh** pack page/records, a different pack. No allowed basis; need a page for the 39.2 pack (EVDB Kona/e-Soul 39 kWh entries, not opened) or a Kona 39 sibling with matching pack |
| Soul 2020+ 39.2 | dc 50 (est, Fastned Kona 39), ac 7.2 (est from Niro 64 page) | ⚠ | Fastned Kona 39 (2022-23): "Max charge speed: 50 kW" verified. Search excerpts: EVDB e-Soul 39.2 lists 44 kW (12 % lower), ArenaEV "CCS 100 kW max" (charger). AC 7.2 is borrowed from a different pack's page; ArenaEV shows 7 kW (EU) |
| EV3 / EV4 | gross, V, DC 101/128, AC 11, 10-80 | ✅ (AC ⚠ market) | Kia UK spec: "58.3 kWh... 369 V... 29 min (101 kW rating)"; "81.4 kWh... 343 V... 31 min (128 kW rating)"; "AC charge 10-100% (11 kW...)". UK page for 11 kW AC; EV3 cars are US-only, EV4 CA-only: AC is market-varying and needs a market source |
| EV3 / EV4 | usable 54.6 / 77.8 (est, Ioniq 5 58 kWh and 77.4 ratios) | ❌ basis | Batch notes admit "different cell supplier or pack design is possible". Search excerpts: EVDB EV4 "78.0 kWh useable" (81.4) and "55.0" (58.3); Fleet News "Battery useable 78 kWh". Replace with those (community); fetch EVDB/Fleet News to confirm before applying (429 for me) |
| EV3 / EV4 | chemistry nmc (community, Wikipedia) | ✅ | Wikipedia: "58.3 kWh NMC lithium-ion", "81.4 kWh NMC lithium-ion". A Kia AU brochure reportedly says "Li-ion NCM" (search excerpt, PDF unreadable) |
| EV3 | preconditioning automatic_and_manual (m) | ⚠ | Kia UK article names EV3, EV6, EV9; navigation trigger "most commonly" and manual via infotainment or Kia Connect, but it is general ("activation depends on make and model"). UK spec page itself does not mention it. Keep; consider `estimated` |
| EV4 | preconditioning (est) | ✅ | EV4 not named; estimate from EV3 lineup disclosed |
| EV3 US | port nacs, supercharger yes (m) | ✅ | Kia US: "Access to Tesla Supercharger & IONNA", NACS port standard on Light |
| EV4 CA | port nacs, supercharger yes (community) | ✅ | Guide Auto (not opened by me, ref in notes); sources are Canadian |
| EV3 / EV4 | 10-80 29/31 | ✅ | Kia UK and Kia US "31 min" |

## C. Chemistry `nmc` with no page naming it

Question: does any allowed basis apply, and is there a page?

- **Kia Soul EV 2015-17 (27 kWh): yes, a page names it.** Mobility Engineering Tech (SAE) article https://www.mobilityengineeringtech.com/component/content/article/41106-sae-ma-00240 says the cathode is "nickel-rich NCM (nickel-cobalt-manganese) chemistry" for the Soul EV cells (192 cells, 27 kWh). Electric Cars Report https://electriccarsreport.com/2014/02/kia-soul-ev-come-sk-innovation-ncm-li-ion-cells/ says the same (SK Innovation cells, Kia press material). Record as `manufacturer` (Kia material relayed), for 2015-17. For 2018-19 (200 cells, 30 kWh) no page names it; same cell family is plausible but the pack changed, so keep it `estimated` low_confidence with "same SK Innovation cell supplier, pack enlarged 2018" and owner approval.
- **Hyundai Ioniq Electric (28 and 38.3 kWh): no allowed basis in the batch** (batch itself says "outside the standard estimate bases"). Pages: a search excerpt says EV Database lists the 28 kWh cathode as "NMC622" (30.5 nominal / 28.0 usable); another spec site says NCM. I could not open EVDB (429), so retry `https://ev-database.org/car/1057/Hyundai-IONIQ-Electric` and `.../car/1165/Hyundai-IONIQ-Electric` (38.3 kWh) before applying and record as `community`. ArenaEV and Wikipedia name no cathode (confirmed).
- **Genesis G80 87.2 kWh: no allowed basis.** Not the same generation pack as the one the NCM page describes. Best page: Genesis KR notice https://www.genesis.com/kr/ko/support/notice/detail/0000000547.html: "Electrified G80 | 94.5 | 523 | SK ON | Pouch | NCM" (the 2026 facelift pack, a different pack from the 87.2 kWh one). The teardown compares modules with E-GMP modules but names no chemistry. Owner decision: accept as a low_confidence estimate citing the KR notice with notes saying "facelift pack, same maker and pouch format", or leave for an EVDB listing (search excerpts: EVDB 1703 "Genesis G80 Electrified Luxury (MY22-24)" lists usable 82.5; cathode not confirmed).
- **Kia Soul EV 2020+ 39.2 kWh and GV70 77.4**: see section B (no valid basis / platform-sibling only).

## D. Spot checks the task named

- **GV60 84 DC 260 as `tested` (Fastned)**: value quoted correctly, label unproven (see B). 257 kW on the Ioniq 5 84 (existing data, Hyundai US) and 250 kW Magma are within 5 %.
- **Soul EV 2015-19 DC 50 vs 100**: batch uses 50 and discloses 100 (Wikipedia, CHAdeMO ceiling) and 70 (Electrek). 50 is the likelier peak for these packs, but the evidence is a European pack listing; downgrade label (fix 5).
- **E-GMP-ratio usable**: G80 (87.2 x 74/77.4) and EV3/EV4 (x Ioniq 5 58 ratio) are not same-cell proven. GV60/GV70 84 → 80 is fine (same pack on the KR notice; matches Ioniq 5/EV6 84 usable 80 in `data/`).
- **GV70/GV60 dc_max siblings**: GV70 233 and 260 depend on "same charger"; KR notice proves the pack, not the charger. Keep estimated.
- **Existing data fit (>5 %)**: none between same-kind values (Ioniq 9 237/24/11 vs existing 2026; GV60 84 usable 80 vs Ioniq 5 80; Soul 64 DC 77 vs Niro 77). Differences over 5 % only where flagged above (Soul 39.2 DC 50 vs 44; Ioniq Electric 2020 DC 50 vs 45).
- **Kinds/low_confidence**: all non-OEM-page values carry low_confidence; `manufacturer` for relayed OEM figures is fine. Mislabels flagged: G80 187 kW and gross (reviewer wording), Fastned `tested` entries, GV60 preconditioning `manufacturer` for years not shown on the page.

## E. Numbered fix list

1. G80 preconditioning: change to `manufacturer` `automatic_and_manual`, source Genesis AU `https://www.genesis.com/au/en/models/luxury-sedan-genesis/g80-ev/electric.html` ("activates when a fast-charging station is set as your destination and can also be controlled manually"). Drop the DE-page estimate.
2. GV70 (all 6 ids): preconditioning to `manufacturer` `automatic_and_manual`, source Genesis US owner page `https://owners.genesis.com/us/en/resources/owner-education/maximize-battery-life.html` (add as a source, accessed 2026-11-19). Remove "GV70 shares the E-GMP platform" from the notes.
3. GV60 2023-25 preconditioning (`manufacturer` from the undated DE page): change to `estimated` (same model, other year), or find a dated GV60 page.
4. Soul EV 2020+ 39.2 kWh (4 ids): usable cite ArenaEV e-Soul 39 kWh 2020 (39.2 usable / 42 total; add gross 42); chemistry and preconditioning cannot rest on the 64 kWh pack: find a 39.2 pack page (EVDB Kona/e-Soul) or remove the estimate and tell the owner; check DC 50 against EVDB 44 kW; AC 7.2 cite a page for this pack.
5. Fastned-derived `tested`: GV60 84 DC 260 (and the GV70 estimate that copies it) and Soul 2015-19 DC 50: Fastned does not state a method. Use `community` (or `estimated` for Soul 2015-16 and the mismatched pack), and say so in the notes.
6. Ioniq Electric: voltage cite ArenaEV (320 V) not the Soul page; 2020-21 usable 38.3 and gross 40.4 from ArenaEV 2020 (`community`), not "read as usable"; 2020-21 DC use InsideEVs tested "just under 50 kW" (Fastned 45); chemistry per section C (needs EVDB fetch).
7. Soul EV 2015-17 chemistry: record `manufacturer` `nmc` citing the Mobility Engineering Tech / Kia article (add source); 2018-19 stays `estimated` with the cell-family note.
8. Soul 2015-19 AC 6.6: replace the charge-time inference with a page that states the charger kW, or flag as an owner question. Resolve the DC-port-on-all-trims caveat or state it.
9. G80: usable 82.5 from EVDB 1703 (confirm by fetch) in place of 83.4; chemistry per section C (cite KR notice, note facelift pack); dc_max 187 and gross 87.2 relabel `community` unless a Genesis page is cited; add a Canadian source for port/Supercharger or restrict to US.
10. EV3/EV4 usable: replace 54.6/77.8 with EVDB 55.0/78.0 (fetch to confirm) or Fleet News 78 kWh; if neither is confirmed, keep the estimate but note it fails the same-pack rule and put it in the owner questions.
11. Market sources: EV3 (US) and EV4 (CA) AC 11 kW (UK page); Ioniq 9 2027 port/Supercharger (Canada page, US-only cars) and AC (European listing); Ioniq 5 2026 Limited variant port/Supercharger (Canada page, US-only car): add US/CA sources as matching the car. GV70 2023 (CA only), GV60/GV70 2024-25 CA cars and G80 CA: port `ccs1` is cited from the US page only; Genesis Canada says NACS only on new or refreshed EVs from 2025, so 2025 Canadian port is unproven.
12. Optional upgrade: GV60/GV70 84 chemistry to `manufacturer` using the Genesis KR notice (GV60 facelift and Electrified GV70 rows: 84.0 kWh, 697 V, SK ON, Pouch, NCM); 697 V also supports `800v` for 2026+.
13. Ioniq 5 2026 variant and EV3 preconditioning: no change required, EV3 `manufacturer` is general-article wording (accept or relabel `estimated`).

Sources I opened (all accessed 2026-11-19): Genesis US GV70, GV60, electrified-g80 (NACS lineup); Genesis DE GV60 performance, DE and CH G80 charging; Genesis AU G80 electric; Genesis KR notice; Genesis CA Magma; Genesis US owner GV70 page; Green Car Reports GV70; Cars.com G80; InsideEVs Genesis adapter; Weekly Driver 77.4; ArenaEV GV60, G80, Ioniq 28, Ioniq 38, e-Soul 39; Fastned Genesis, Kia Soul EV, Hyundai Ioniq, Kona; Wikipedia Soul EV, Ioniq, EV3; Kia UK EV3 spec and preconditioning article; Kia US EV3; Hyundai CA FAQ and IONIQ 5; Hyundai MEa manual; Motor.com; chargedevs Ioniq 2020; Mobility Engineering Tech and Electric Cars Report (Soul EV cells). Not readable: Kia news center (certificate error), EVDB (429), EVKX (403), Genesis/Kia PDF spec sheets (binary).
