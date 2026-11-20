# Fact-check: batch-2026-11-19-w2-japan2.json

Verdict: **FIX**

`npx tsx scripts/add-facts.ts research/batch-2026-11-19-w2-japan2.json --check` passes (1408 variants, 494 sources after applying). 50 powertrains: 16 Lexus RZ, 8 ES, 2 TZ, 5 Trailseeker, 6 Uncharted, 3 MX-30, 1 Eclipse Sportback EV, 6 i-MiEV, 3 RAV4 EV. The existing cars in `public/data/cars/` are skeletons (regulator range figures only), so there were no same-kind values to compare against (check 11).

I reopened the key pages for each hardware generation. Pages cited only for market access (Lexus CA media and charging pages, the Subaru Canada pages that give only a port) were not all reopened. The EV Database (429 rate limit) and Mitsubishi US media (403) pages could not be opened and are marked unverifiable below.

## Answers to the brief

- **RZ 450e 71.4 kWh = bZ4X AWD pack?** Partly. The Lexus 2025 page says "71.4 kWh battery, developed by Prime Planet Energy & Solutions (PPES)". InsideEVs shows the 71.4 kWh PPES pack is the **US bZ4X FWD** pack, not the US AWD one. The US bZ4X AWD has the 72.8 kWh CATL pack and was rated 100 kW. EV Database's European bZ4X AWD page (car 1565) lists 71.4/64.0. That is a European car with a different pack from the US AWD. The pack match for gross, usable (64), chemistry and voltage is acceptable. Using the FWD bZ4X for DC peak is weak because the RZ 450e has two motors. A direct RZ source exists (item 1 below).
- **RZ 300e = 72.8 kWh CATL bZ FWD?** No. The 72.8 kWh CATL pack is the US bZ4X **AWD** pack (InsideEVs, EVPulse). The RZ 300e is FWD with that pack (Lexus 2024/2025: "72.8kWh ... (CATL)"). The batch note says "bZ4X AWD", which is right, but the user's label is wrong. See item 2 for its usable and DC peak.
- **95 % ratio on 76.96 / 95.82 kWh packs:** not allowed as written (item 3). No page ties those packs' cells to the 74.7 kWh pack.
- **ES Supercharger `tested`:** OK. InsideEVs timed a V4 Supercharger session: "10-80% in exactly 28 minutes" and "as tested". That is the reviewer's own measurement. The 2027 ES values rest on the 2026 car and are labelled `estimated`, which is correct.
- **Uncharted CA 77 vs 74.7:** unresolved in the batch (item 5).
- **RAV4 EV chemistry:** the estimate is thin (item 7).
- **i-MiEV port per year:** wrong for 2012 and 2013 (item 8).
- **kinds / low_confidence:** problems found at items 4, 6, 9 and 10.

## Table (representative rows; fan-out ids are identical per generation)

| Variant | Field | Value | Result | Evidence |
|---|---|---|---|---|
| lexus/rz 2023-25 450e (6) | gross | 71.4 | ✅ | Lexus 2023 page: "71.4 kWh battery"; 2025 page: PPES |
| same | usable / chemistry / voltage | 64 / nmc / 400v est. | ✅ | EV Database 1565 per batch notes. Not opened (429); the repo source record confirms 71.4/64.0 NMC 355 V |
| same | dc_max_kw | 150 est. | ❌ | Cites bZ4X page ("FWD ... up to 150 kW"), a single-motor car. Direct RZ source exists (item 1) |
| same | preconditioning | none est. | ✅ | Lexus 2025 page describes water cooling/heating only. Motor1: 2026 RZ "gains" it. A web search also showed EV Database RZ 450e MY23-25 listing it as "No" (not opened) |
| same | ac_max_kw | 7 | ✅ | Lexus 2026 page: 11-kW charger "up from 7 kW". Source is the 2026 page, `low_confidence` set |
| same | port / SC access | ccs1 / via_adapter | ✅ | Lexus CA charging page: CCS1 on 2023-25; the on-sale release says 2023-25 need an adapter |
| lexus/rz 2024-25 300e (4) | gross | 72.8 | ✅ | Lexus 2024: "72.8kWh ... (CATL)" |
| same | usable | 65.3 est. | ⚠ | Cited page (EV Database 1565) gives 64.0 for the PPES 71.4 pack, not 65.3. The 0.896 ratio comes from a different cell supplier. Same method as the existing Solterra record, so it is repo-consistent, but the same-cell condition is unproven (item 2) |
| same | dc_max_kw | 150 est. | ⚠ | EVPulse: bZ4X AWD 72.8 kWh peak rose to 150 kW for 2024. The RZ 300e is FWD, so motors differ. The pack matches. Weak basis (item 2) |
| lexus/rz 2026 350e/450e (5) | gross | 74.7 | ✅ | Lexus 2026 page prints "74.69 kW" for 350e/450e (unit typo, noted in the batch). `low_confidence` set |
| same | ac / port / 10-80 | 11 / nacs / 30 | ✅ | Lexus 2026 page: "11-kW on-board AC charger", NACS (SAE J3400), "30 minutes" |
| same | usable 71, chemistry, voltage, dc 150 | est. | ✅ | Autopian: larger pack "retains the same chemistry and cells", 355 to 391 V. InsideEVs: "capped at 150 kilowatts", 400 V. The same 74.7 pack is used. Autopian notes the RZ450e uses the same motor pair as the AWD bZ |
| same | preconditioning | automatic_and_manual est. | ❌ | ES page (touchscreen or automatic with a charger as destination) does not mention the RZ. Motor1 only says the RZ gains preconditioning. Lexus RZ pages say nothing on the trigger (item 4) |
| lexus/rz 2026 550e F Sport | gross | 76.96 | ✅ | Lexus 2026 page: "76.96 kW" (unit typo) |
| same | usable | 73.1 est. | ❌ | 95 % ratio from the 74.7 pack. No source says the 76.96 pack has the same cells (item 3) |
| same | dc_max_kw | 150 est. | ⚠ | Lexus gives no peak for the RZ. Sibling is the 74.7 pack, not the same pack (item 6) |
| lexus/es 2026 (4) | gross / dc / 10-80 / ac / port | 74.7 / 150 / 28 / 11 / nacs | ✅ | ES release: "74.7-kWh", "up to 150 kW", "about 28 minutes", "11-kW AC", NACS J3400 |
| same | preconditioning | automatic_and_manual manufacturer | ✅ | "activated directly via the touchscreen" and "automatically ... setting a public charger as the destination" (needs Drive Connect) |
| same | Supercharger access | yes (tested + 2 others) | ✅ | InsideEVs: "10-80% in exactly 28 minutes" at a V4 Supercharger. `tested` is right. Lexus CA media covers Canada |
| same | usable 71 / chemistry / voltage | est. from 74.7 bZ pack | ✅ | Same pack and cells (ES shares the 74.7 kWh pack) |
| lexus/es 2027 (4) | all | same hardware, port/SC est. | ✅ | Same model, next year, no change shown |
| lexus/tz 2027 premium (76.96) | gross | 76.96 | ✅ | Lexus TZ page: "76.96 kWh and 95.82 kWh" |
| same | dc_max_kw | 150 manufacturer | 🏷 | InsideEVs gives 150 kW "for the large battery only". TFL: "up to 150 kW" overall, with no per-pack figure. Not stated for this pack, so it should be `estimated` (item 6) |
| same | usable 73.1, voltage 400v, chemistry | est. | ❌ | Ratio and voltage borrowed from a different pack (items 3, 6) |
| same | preconditioning | automatic_and_manual est. | ⚠ | Lexus TZ page lists "battery ... preconditioning" with app registration and a trial or subscription. InsideEVs: "standard". The trigger is unstated (item 4) |
| same | ac | 11 | ✅ | TFL: "11 kW on all trims"; Toyota global: "11kW or 19kW" |
| lexus/tz 2027 touring (95.82) | gross / ac / 10-80 / dc | 95.82 / 11 / 35 / 150 | ✅ | Toyota global: "95.82kWh", "Approx. 35 min", 150 kW label; InsideEVs: 150 kW and about 35 min for the large pack |
| same | usable 91 | est. | ⚠ | A web search turned up "about 90 kWh usable" for this pack (EV Database TZ 3820, not opened). 91 is within 1 %, but the stated basis is the 74.7 pack |
| subaru/trailseeker 2026-27 (5) | gross / dc / 10-80 / port | 74.7 / 150 / 28 / nacs | ✅ | Subaru 2026 and 2027: "74.7-kWh", "up to 150 kW", "28 minutes", "standard NACS" |
| same | preconditioning | automatic_and_manual manufacturer | ✅ | Subaru: "selecting a charging destination or manually through the touchscreen" |
| same | ac_max_kw 11 | est. from Uncharted | ⚠ | Subaru does not state it for the Trailseeker. Same pack and platform, but charger identity is unproven. Acceptable low-confidence estimate |
| same | Supercharger access | yes est. | ✅ | InsideEVs list names the Trailseeker; the Solterra release gives the lineup basis. Subaru Canada pages cover CA |
| subaru/uncharted (6) | gross | 74.7 (US) / 77 (CA) | ❌ | Both values sit on the same powertrain field. See item 5 |
| same | usable 71 est. | | ❌ | Inconsistent with 77 kWh on the CA cars (item 5) |
| same | preconditioning | automatic_and_manual manufacturer | 🏷 | The 2026 page says only "shared with Solterra and Trailseeker". The 2027 page: "doesn't say whether automatic or navigation, no manual option". A combination of two sources must be `estimated` (item 9) |
| same | ac 11 / dc 150 / 10-80 | | ✅ | US: "11-kW onboard charger", "up to 150 kW", "28 minutes". CA (Guide Auto, Drive Tesla Canada): ~30 min, 11 kW, 150 kW |
| mazda/mx-30 2022-24 | gross 35.5 | | ✅ | Wikipedia: "35.5 kWh", prismatic. Mazda US: "35.5 kWh lithium-ion pack" |
| same | usable 30, voltage 400v | manufacturer | 🏷 | Green Cars Compare says "30 kWh usable" and "400 V architecture". It is a spec site that doesn't attribute to Mazda. Not `manufacturer` (item 10) |
| same | dc_max_kw | 40 community | ❌ | Mazda USA (2021-08-24 release): "Level 3: DC 50 kW", about 36 min to 80 %. The batch's 40 kW rests on Wikipedia/Fastned (European 2020-23). Green Cars Compare says "USA version does not support DC fast charging", and the batch ignored that. Contradictory, unresolved (item 10) |
| same | ac 6.6 | | ✅ | Wikipedia: "6.6 kW". Mazda US gives 240 V / 30 A (not kW) |
| same | port ccs1 / SC no | est. | ⚠ | Green Cars Compare: "CCS Type 1". Mazda US page doesn't name the port. SC list: MX-30 absent. Canada assumed |
| same | preconditioning none | est. | ⚠ | Absence-based. Mazda owner's manual not opened. Acceptable under the `none` rule only if the manual is cited |
| mitsubishi/eclipse-sportback 2027 | gross 75 | manufacturer | ⚠ | Mitsubishi CA: "Standard 75 kWh lithium-ion battery pack". Gross vs usable is not stated, and the batch's usable of 75.1 is higher than this gross (item 11) |
| same | dc 150 / 10-80 35 / port nacs / SC yes | | ✅ | Mitsubishi CA page ("up to 150 kW", "approximately 35 minutes", NACS, "access to the Supercharger network"). Car is US market per the gap file and the source is a Canadian page. Port/SC are market-varying, so a US source is still needed |
| same | usable 75.1, chemistry, voltage, ac 7.2, preconditioning manual_only | est. | ⚠ | Basis: "based on the next-generation Nissan LEAF". Leaf CA: "7.2 kW onboard charger", "can engage the heater to warm the battery". Eclipse has no Google built-in, so a Leaf navigation trigger can't carry over; `manual_only` is the cautious reading |
| mitsubishi/i-miev 2012-17 (6) | gross 16, voltage | | ✅ | Press kit: "total energy storage capacity is 16 kWh", 330 V. `400v` is a schema choice (the enum has 400v, 800v, other) |
| same | ac 3.6 | manufacturer | ⚠ | Wikipedia infobox "15 A 240 V AC (3.6 kW)"; it is a relayed derived figure and the press kit gives hours only |
| same | dc 40 | community | ⚠ | Fastned vehicle page says 40 kW. Mitsubishi says 80 % in under 30 minutes. OK as low-confidence |
| same | preconditioning none | est. | ⚠ | Press kit: battery heater and remote cabin pre-conditioning only. Judgement call, as the batch admits |
| same | port chademo | 2012, 2013 | ❌ | Owner thread: 2012 ES optional, 2012 SE none, SE Premium standard. One car record covers all trims (item 8) |
| same | port chademo | 2014-17 | ✅ | Press kit 2016: "DC quick-charge port (CHAdeMO protocol)" standard. Owner thread agrees |
| toyota/rav4-ev 2012-14 (3) | gross 41.8 / usable 41.8 | | ⚠ | Toyota: "full capacity of 41.8 kWh" (Standard Mode 35). GCR: "41.8 kilowatt-hours of usable capacity". Toyota doesn't say gross, so gross is the weaker claim |
| same | ac 10 | manufacturer | ⚠ | GCR "up to 10 kW". Wikipedia 9.6 kW. Within 5 %, but a press relay, not Toyota's page |
| same | chemistry nca | est. | ⚠ | Basis is Wikipedia "similar to the Model S" plus the Model S cell chemistry (item 7) |
| same | dc 0 / j1772 / SC no | | ✅ | Wikipedia: "factory vehicle did not include DC fast charging"; J1772 240 V 40 A |
| same | preconditioning none est. | | ✅ | Toyota page: "pre-cool or pre-heat the vehicle" = cabin only. No battery feature described |

## Required changes

1. **RZ 450e 2023-25, `dc_max_kw` 150.** Replace the bZ4X FWD basis. A direct RZ source says Lexus gives 150 kW for the RZ (found in a web search, not opened: lexus.com/rz-charging-information, EV Database car 1677). If the Lexus page states it, make the value `manufacturer`. Otherwise keep `estimated` and say the bZ4X FWD pack is single-motor.
2. **RZ 300e usable 65.3 and dc 150.** 65.3 is the ratio of a PPES pack (64.0/71.4) applied to a CATL pack. The cited page doesn't state 65.3 and the notes call the 71.4 pack "CATL". Either document the different supplier explicitly (the Solterra record has the same flaw) or get an EV Database or other page for the 72.8 kWh pack. DC 150 for a FWD car rests on an AWD review. Keep as low-confidence estimate but say the motors differ.
3. **95 % usable ratio on 76.96 kWh (RZ 550e F Sport, TZ Premium) and 95.82 kWh (TZ Premium Touring).** Not allowed without a same-cell ratio source. No page links these packs' cells to the 74.7 kWh pack (Toyota global/web: 312 vs 104 cells on the TZ, so different packs). Use a source stating usable for these packs. A search showed EV Database TZ 450e Long Range (car 3820) and TZ 550e (car 3821) listing about 90 kWh usable for the 95.8 kWh pack. Open them before use. Failing that, drop to a clearly documented estimate or hold these powertrains.
4. **Preconditioning on the 2026 RZ (5 ids plus 550e) and TZ (2 ids).** The ES page doesn't say the RZ or TZ share its triggers. For the RZ keep `estimated` only if both the ES page and Motor1 are named in the notes (the notes do). Try a Lexus RZ owner's manual or Drive Connect page. For the TZ the Lexus page names battery preconditioning but not the trigger, so say so.
5. **Uncharted 2026 (long-range-fwd, sport-awd), gross 74.7 and 77.** Resolve per market. 77 kWh is stated by two Canadian sources for the Canadian cars (Guide Auto: "AWD Sport/GT exclusively" and the FWD 480 km car), and 74.7 by Subaru US for all trims. Put each on the cars of its own market using `variants` (long-range-fwd is CA-only; sport-awd is CA+US). Usable 71 for the 77 kWh pack is unsupported (about 71/77 = 92 % vs 95 % elsewhere). Drop it or estimate it separately. Note that Guide Auto says the smaller battery size "isn't specified yet".
6. **TZ Premium (76.96 kWh) `dc_max_kw` 150 kind `manufacturer`.** The page states 150 kW for the large pack only. Make it `estimated` with the basis stated. Also the TZ voltage class 400v is borrowed from the bZ pack; Toyota's TZ page states no voltage (EV Database lists "400 V architecture" for the 95.8 kWh pack). Cite that page for voltage instead.
7. **RAV4 EV chemistry `nca`.** Wikipedia says only "lithium-ion"; the NCA claim comes from the Model S page. Toyota's page doesn't name the cells. Keep as a low-confidence estimate but say plainly the basis is "Tesla-designed pack with Model S-type cells" and that this is an inference. Also flag gross 41.8: Toyota doesn't call it gross (set gross to Toyota's 41.8 only if the notes say "full capacity").
8. **i-MiEV `charge_port` for 2012 and 2013.** The owner thread says 2012 ES optional, SE none, SE Premium standard. The single car record can't be `chademo` for every trim. Choose the most common value, say which trims differ and mark `low_confidence`, or ask the owner. `dc_max_kw` 40 has the same issue for the SE trim.
9. **Uncharted preconditioning (6 ids, `manufacturer`).** Relabel `estimated`, name both the Uncharted page ("shared with Solterra and Trailseeker") and the Trailseeker page (navigation or touchscreen).
10. **MX-30:** (a) `dc_max_kw` 40 conflicts with Mazda USA's "50 kW" (36 min to 80 %), though that page names the charger, not the car. Use the market-correct value or flag the conflict. (b) Relabel usable 30 and 400v from `manufacturer` to `community`/`estimated` (Green Cars Compare is not Mazda). (c) Cite the US/CA page for the port. (d) Green Cars Compare says the USA version has no DC fast charging; resolve before keeping `ccs1`.
11. **Eclipse Sportback usable 75.1 > gross 75.** Contradiction. Mitsubishi says "75 kWh" without gross/usable, and Nissan's "75 kWh" reads as nominal. Drop gross 75 or note it may be usable. The gap file lists this car as US-market only, so the NACS and Supercharger values need a US source (Mitsubishi US media returned 403).
12. **Wording.** The Lexus 2026 page prints "kW" for pack size; the batch already notes the typo.

## B96 fields the batch leaves empty (and pages found)

- **i-MiEV `chemistry`:** the 2012 Idaho National Laboratory fact sheet (US DOE, a test lab and independent testing source) states "Lithium-Ion (LMO)", cathode "Lithium-Manganese Dioxide / Carbon", manufacturer Lithium Energy Japan, 88 cells, 330 V, 16 kWh. URL: https://www.energy.gov/sites/prod/files/2015/02/f19/fact2012mitsubishii-miev.pdf (read and quoted). The schema enum has no LMO, so the value must be `other`. Kind: INL says specifications were "supplied by the manufacturer, measured, or derived", so use `manufacturer` or `tested` with that caveat.
- **i-MiEV `usable`:** no page I could open states it. EV Database and EVKX list 14.5 kWh usable (labelled an estimate); I could not open either to quote it (429, blocked). The INL test measured 14.9-15.0 kWh DC into the battery after a range test, which doesn't prove a usable capacity.
- **MX-30 `chemistry`:** web search found NMC statements (an Australian spec sheet "35.5 kWh NMC (30 kWh usable)" and EV Database EU page). I could not open any to verify. Candidates: https://ev-database.org/car/1680/Mazda-MX-30 and https://www.arenaev.com/mazda__35kwh_2020-specs-136.php. Both are third-party and unchecked.
- **MX-30 `usable`:** one web result gave gross 35.5 and net 30.0 kWh (5.5 kWh buffer); I could not open the page.

No wheels, heat pump or curves are in this batch, so checks 7, 8, 9 and 13 do not apply.
