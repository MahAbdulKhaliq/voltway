# Check: batch-2026-11-20-b112-hyundai.json (B112, adapters and heat pumps)

Checked 2026-11-20. `npx tsx scripts/add-facts.ts research/batch-2026-11-20-b112-hyundai.json --check` passes (1367 variants, 1603 sources). 98 cars in the batch, all 98 on `research/b112-todo-hyundai.json`; every car has `adapters_included`. 15 heat-pump trims are unfilled (see section 6). No blocked site was worked around: Autotrader and PressReader returned errors, so those points are marked unverifiable. ArenaEV, EVChargingStations, iSeeCars, Edmunds and ev-database were not used.

## Verdict: FIX

Adapters are largely sound. The free-offer facts check out, the NACS-port cars are supported (two need better sources), and Canada has an openable Hyundai source. The heat-pump side has real problems:
- Four values are unsupported or contradicted: IONIQ 6 SE Standard Range 2024 and 2025, Ioniq Electric 2017-21 `standard`, and Kona 2024 Canada.
- Five source URLs are mislabelled by model year.

## 1. Questions asked

### US free offer (CCS1 cars recorded `nacs_to_ccs1_sold`)
- **Hyundai.** Dates are verified. The giveaway FAQ (owners.hyundaiusa.com) says: "purchased or leased on or before January 31, 2025"; claim window "April 16, 2025 through May 30, 2025". The NACS charging-information page says: "the NACS Adapter program termination date is September 30, 2025."
- **Genesis.** Dates are verified. The giveaway FAQ says: "retail date before or on January 31st, 2025"; claim window April 16 to May 30, 2025. The Genesis NACS information page says owners "must redeem it by September 30, 2025".
- **Models in the giveaway FAQ.** For Hyundai it is KONA Electric, 22MY-24MY IONIQ 5, 25MY IONIQ 5 N and 22MY-25MY IONIQ 6. The IONIQ Electric is not named there. The separate NACS-info page does list "IONIQ EV", so the Ioniq Electric claim is supported, but cite that page. For Genesis it is 2023-2025 GV60, Electrified GV70 and Electrified G80.
- **Unverified part.** The note's "owners can buy it at a dealer from 2025-03-17" is not on the Hyundai adapter FAQ or giveaway FAQ (the adapter FAQ page has no March 17 date or $250 price). The $250 MSRP is verified on the giveaway FAQ ("The MSRP is $250", Hyundai and Genesis). Drop the March 17 date or find a source.
- **Convention.** The facts (free offer, retail date to 2025-01-31, ended 2025-09-30) are right. The owner decides whether `sold` or `on_request` is the better convention. Every US note records the offer and its end date, so either value is data-ready.

### Canada: July 2026 programme
An openable Hyundai Canada source exists that the batch did not use: https://www.hyundaicanada.com/en/evhub/electric-vehicles.
- It says: "a complimentary CCS to NACS charging adapter, for use at NACS Chargers."
- It says: "Offer eligible until December 31, 2026 or until supplies last."
- It says: "Only one complimentary charger is available per vehicle."
- It says enrolment in Bluelink and an 'EV Special Care' service are required, and "See your dealer for the list of qualifying Hyundai EV models".
- It does not state the delivery cutoff or the model list. Those ("delivered before December 31, 2025"; Hyundai IONIQ Electric 2019-21, Kona 2019-26, IONIQ 5 2022-25, IONIQ 6 2023-25; Genesis GV60 2022-25, G80 2023-24, GV70 2024-25) are verified only on electriccarsreport.com and conceptcarz.com (press). The conceptcarz page confirms the Genesis list and "delivered before 12/31/2025".
- The batch's own notes say the maker's page was not opened. Cite the evhub page for Hyundai `on_request` and keep the press pages for the model lists. The Genesis Canada release does not say free or sold, so Genesis Canada has press sources only.
- The Hyundai Canada FAQ (hyundaicanada.com/en/about/faq) says only: adapter "available separately". The FAQ has no programme text.

### NACS-port cars `ccs1_to_nacs` (in the box)
- **2025 IONIQ 5 US (NACS).** ✅ Adapter FAQ: "25MY IONIQ 5, with native NACS port, comes standard with a CCS adapter."
- **2026-27 IONIQ 5 Canada.** ✅ Hyundai Canada /2026/ioniq-5 page (the page itself is 2026): "NACS-equipped IONIQ 5 models come with two CCS adapters (AC and DC)". The URL cited in the batch (`/showroom/2024/ioniq-5`) redirects to a 2027 page, so the source URL is mislabelled.
- **2026-27 IONIQ 5 US non-N.** ⚠ Only inferred. The US FAQ names the 25MY only ("later years inferred", `low_confidence` is set, correctly). The Canada page above is the better support. Another market's source is fine for a fact that doesn't vary by market, but port and adapter are market-specific (B94 text), so keep `low_confidence`.
- **IONIQ 9 2026.** ✅ Hyundai Canada /2026/ioniq-9 (2026 page): "NACS-equipped IONIQ 9 models come with an AC CCS adapter and a DC CCS adapter." Cars.com 2026: "Standard NACS charging port and CCS adapter."
- **IONIQ 9 2027 US.** ⚠ Estimate carried from 2026 with no change listed; acceptable as `low_confidence`, but the notes call it "Estimated:" while `kind` is `manufacturer`. Set `kind: estimated`.
- **IONIQ 6 N 2027.** ✅ Electrek: "comes standard with a native NACS charging port and a CCS adapter." Press relay of the maker's claim; `manufacturer` is fine.
- **IONIQ 5 2027 US.** Electrek says "Like Hyundai's other electric vehicles ... standard with a native NACS charging port and a CCS adapter" (about the 6 N). Acceptable `low_confidence` support.
- **Genesis 2026-27 (GV60, GV70).** ✅ Better source exists and is not in the batch: https://owners.genesis.com/us/en/resources/owner-education/how-to-charge.html. It says "Level 2 AC charging and Level 3 DC charging require different adapters which are included" and "check the rear cargo area". It names 2026+ GV70 EVs as NACS. That page is for GV70; it doesn't name the GV60. The batch cites InsideEVs ("customers will get an NACS to CCS adapter", no mention of in-box) and the Genesis Canada release (no statement that it is in the box). Both are weak for "in the box". Keep `low_confidence`, and add the owners how-to-charge page for the GV70. GV60 2026-27 and GV70 2027 remain inferred.
- **Cross-check with `supercharger_access`.** All CCS1 cars have `via_adapter` and a `nacs_to_ccs1*` value. All NACS-port cars have `yes` and `ccs1_to_nacs`. One disagreement is listed in the next section.

### 2026 IONIQ 5 N: NACS or not (report only; port not changed)
Both statements are right, for different model years.
- The Hyundai USA adapter FAQ says "IONIQ 5 N vehicles do not have a native NACS port". This describes the 2025 N, and the FAQ pre-dates the 2026 N. The batch's 2025 N is correctly CCS1 `sold`.
- KBB: the 2026 IONIQ 5 N "switches from a CCS charge port to a NACS port" and "comes standard with a CCS adapter".
- electrive (2026-07-22): "Hyundai also includes CCS-to-NACS adapters for both AC and DC charging as standard."
- So the existing data (2026 N = NACS) is supported. But the batch cites the US adapter FAQ for the 2026 N (an FAQ that says the opposite) and a Canada IONIQ 5 page that only mentions the N in a model description. Replace the 2026 N source with KBB or electrive, drop the FAQ citation, and add a note on the change from CCS in 2025.
- The 2025 IONIQ 5 N Canada page says "CCS DC Adapter needed", consistent with a CCS port.

### Adapter and port disagreement to report
- `hyundai/ioniq-5/2025/xrt` (CA). The batch has `ccs1_to_nacs`, following the existing port data (`nacs`, estimated `sc: yes`). Hyundai Canada FAQ says NACS ports begin with the 2026MY ("2025 model year and earlier" are CCS), and its other 2025 Canadian trims (preferred, preferred-long-range-awd) are CCS. The 2025 CA XRT looks like a CCS car. This is a port/supercharger question for the lead; I did not change it.

## 2. Heat pump results

| Car | Value | Result | Evidence |
|---|---|---|---|
| IONIQ 5 US 2022 AWD | standard | ✅ | Cars.com 2022: "The AWD Ioniq has a heat pump" |
| IONIQ 5 US 2022 RWD / SE | none | ⚠ | Cars.com 2022: "We haven't tested a RWD Ioniq 5, which has conventional, resistive heat" (reviewer didn't test; a positive statement, though not a test) |
| IONIQ 5 US 2023-24 AWD | standard | ✅ | autoipacket brochures 2023 and 2024 list "Heat pump (heater)" inside the "HTRAC All Wheel Drive Option" block |
| IONIQ 5 US 2024 RWD / SE | none | ⚠ | Brochure lists it only under the AWD option; `kind: manufacturer` is overstated because the brochure never says RWD has none. Cars.com 2022 backs the claim. Keep `low_confidence`; `kind` should be `estimated` or the notes should say "inferred" (they do) |
| IONIQ 5 US 2025, 2026 AWD | standard | ✅ | Cars.com 2025: "AWD SE trims also get a heat pump"; Cars.com 2026: "All-wheel-drive Ioniq 5s also get a heat pump". The 2025 article names SE trims only; the Limited/XRT value is an extension but consistent with the 2026 sentence |
| IONIQ 5 US 2025-27 RWD | none | ⚠ | No 2025-27 page says RWD lacks it; carried from 2022 text. The 2027 value is correctly `estimated` |
| IONIQ 5 Canada 2022 Preferred | standard | ✅ | Canada Drives: heat pump "only available with the more expensive Preferred trim"; Wikipedia: Essential "removed heat pump" |
| IONIQ 5 Canada 2023-25 | standard (estimated) | ⚠ | Basis is the Hyundai Canada current page (a 2026/2027 page: "The heat pump system helps reduce loss of electric driving range"). The cited URL (/showroom/2024/ioniq-5) redirects to the 2027 page. No 2023-25 Canadian page opened. Wikipedia's Essential-only note covers 2022 only. The estimate brackets 2022 and 2026-27 with no change known; plausible. Keep `low_confidence` and fix the URL |
| IONIQ 6 2024 (US, all trims) | standard | ❌ | Brochure row "Heat pump for thermal efficiency" is present but the per-trim ticks are not readable (the lead is right). US trade sources point against standard on the SE Standard Range: Cars.com 2025 article: "the long-range SE gains a heat pump" and says nothing for SE Standard Range, SEL or Limited; the Autotrader and TrueCar snippets agree. So the "every trim assumed to have it" basis is unsound |
| IONIQ 6 2024 SE Standard Range RWD, 2025 SE Standard Range RWD | standard | ❌ | As above. Do not record `standard` for the 53 kWh trim without a positive source. The 2025 value is also a carry from this unreadable table |
| IONIQ 6 Canada 2024 trims | standard | ⚠ | Same brochure (US) assumed for Canada. Canada Preferred Long Range is the 77.4 kWh car, so the long-range heat pump is plausible, but no Canadian source |
| Kona US 2021, 2023 | none | ⚠ | Both brochures have a "Battery warmer system" row and no heat pump row. Absence only; brief wants a positive source for `none` |
| Kona US 2024 SE / long-range | none | ⚠ | Brochure tick table is readable and has no heat pump row ("Battery conditioning system" only). GearJunkie lists "no heat pump" as a con. An Edmunds owner review of a 2024 SEL claims the car has one. Conflicting, absence only |
| Kona Canada 2024 | standard (estimated) | ❌ | Cited URL /showroom/2024/kona-electric redirects to the 2027 page ("Heat Pump System"). A 2026 page also shows the heat pump. The same 2024-25 generation is `none` in the US, so a market difference is plausible but unproven; carrying from 2026-27 is not justified |
| Kona Canada 2026 | standard | ✅ | Hyundai Canada 2026 page: "The Heat Pump also absorbs external heat and converts it to the cabin" |
| Ioniq Electric US/CA 2017-2021 | standard | ❌ | Only support is one Cars.com owner review of a 2019 car: "Winter range ... largely due to the heat pump." A search turned up (not opened; PressReader returned 403) Vancouver Sun 2017 saying Canada's cold-climate package on the SE includes a heat pump, i.e. optional, not standard, in Canada. Hyundai 2020 material says the heat pump is now in all EV lines. Do not record `standard` for all years on an owner comment |
| Genesis G80 2023 | standard | ✅ | 2023 brochure Powertrain Technology: "Heat Pump & Battery Heater" row is "– – • •" under columns 2.5T, 3.5T, 3.5T, EV; the EV columns are marked. Column header alignment is by position, so ⚠ on exact trim but sound |
| Genesis GV60 2023 | standard | ✅ | 2023 brochure: "Heat Pump and Battery Heater • • • •" in all four columns |
| Genesis G80/GV60 2024-27 | standard (estimated) | ⚠ | Same 87.2 / 77.4 kWh hardware, carried from 2023 with no change shown. GV60 2026-27 includes the NACS refresh and the new Magma trim, so carrying to 2026-27 and to the Magma isn't proven; treat as `low_confidence` only |
| IONIQ 9 2027 US | standard (estimated) | ⚠ | Basis is Hyundai Canada's 2026 page. That page says "The standard system absorbs external heat energy" but not that it is on every trim. No US trim sheet |

## 3. Unfilled (no unknowns, owner 2026-11-19)
None of these is written in the batch:
- Electrified GV70, all 6 cars: 2023, 2024, 2025, 2026 (two variants) and 2027. Heat pump unfilled. No GV70 brochure opened (the autoipacket Genesis GV70 2023/2024 PDFs returned 403, so don't use them).
- IONIQ 5 N 2025, IONIQ 6 2023 (6 cars), IONIQ 6 N 2027, Kona N Line 2025: heat pump unfilled.
- Openable leads:
  - IONIQ 6 2023: the 2023 autoipacket brochure lists "Battery heating system and battery preconditioning function" and no heat-pump row at all (2024's has "Heat pump for thermal efficiency"). Possibly the heat pump arrived in 2024. A positive source is still needed; Autotrader says the 2023 SE long-range and AWD had it (not opened).
  - Kona N Line 2025 and IONIQ 5 N 2025: no source found.
  - IONIQ 6 N 2027: the Electrek 2027 lineup article does not mention a heat pump.

## 4. Source quality
- **autoipacket.com brochures (S3 mirror).** Acceptable as copies of the maker's brochure (the files carry Hyundai/Genesis brochure content, and the 2023/2024 Hyundai and 2023 Genesis files had text matching the brochures), but they are a third-party mirror, not a maker URL. `type: oem` is a stretch; allow it with a note, or prefer maker-hosted pages where they exist. The WebFetch tool can't read tick marks, but downloaded PDFs can be partly text-extracted (the IONIQ 5 and Kona tick marks are readable; the 2024 IONIQ 6 ones are not).
- **Year-mislabelled URLs.** `src-b112-hy-ca-ioniq5-page` (/2024/) redirects to 2027. `src-b112-hy-ca-kona-2024-page` (/2024/) redirects to 2027. `src-b112-hy-ca-ioniq9-page` is 2027 or 2026: the batch has both /2027/ and /2026/ pages; the 2026 page content verified. Rename or re-point the source ids to the year actually shown.
- **Source `type`.** Press and aggregators are labelled `community` (Cars.com, Wikipedia, InsideEVs, Electrek, conceptcarz, ERP), which is the repo convention; maker-stated adapter facts relayed by them are rightly `manufacturer`.
- **`accessed_on`.** Present on the sources I checked.

## 5. Fit with existing data
Not checked for heat pumps (no existing same-kind values except IONIQ 9 2026 `standard` on the Canada 2026 page, which agrees with the batch's 2027 estimate). Existing port data: 2026 IONIQ 5 N is `nacs` (low confidence), consistent with the 2026 press; 2025 CA XRT `nacs` conflicts with the Hyundai Canada FAQ (see section 1).

## 6. Required changes
1. `hyundai/ioniq-6/2024/se-standard-range-rwd` and `hyundai/ioniq-6/2025/se-standard-range-rwd`: drop `heat_pump` `standard` (or record `none` with a source; the brochure ticks are unreadable and Cars.com 2025 says only the long-range SE "gains a heat pump"). Other 2024 IONIQ 6 trims: keep `standard` for the long-range/AWD cars only if a source is found; the brochure alone doesn't show it per trim.
2. Ioniq Electric 2017-2021: drop `heat_pump` `standard` (estimated carries and the 2019 owner review). Canada may be optional (cold-climate package), which the lead should confirm from a readable source.
3. `hyundai/kona-electric/2024/kona-electric` (CA): drop or re-source `heat_pump`; the cited URL is a 2027 page. Add a note on the 2026 page if kept as estimated for 2026 only.
4. Kona US `none` (2021, 2023, 2024, 2025): keep as `low_confidence`, but note it rests on absence from a feature table, and set `kind` to `estimated` where the notes say "Estimated".
5. IONIQ 5 US RWD `none` (2022, 2024, 2025, 2026, 2027): keep `low_confidence`; change `kind` on the 2024 value from `manufacturer` to `estimated` (the brochure never says RWD lacks it).
6. `hyundai/ioniq-5/2026/n` adapter: replace the US adapter FAQ source with KBB (https://www.kbb.com/car-news/2026-hyundai-ioniq-5-n-gets-6300-price-cut/) or electrive (https://www.electrive.com/2026/07/22/usa-hyundai-cuts-ioniq-5-n-price-for-2026-model-year/). The FAQ says the opposite for the 2025 N.
7. Canada `nacs_to_ccs1_on_request` (Hyundai: IONIQ 5 2022-25, IONIQ 6 2023, Kona 2024/2026): add the Hyundai Canada EV hub page (https://www.hyundaicanada.com/en/evhub/electric-vehicles) as the maker source. Keep the press page only for the model list and the "delivered before 2025-12-31" cutoff. The hub page says eligible "until December 31, 2026 or until supplies last".
8. All "owners can buy it at a dealer from 2025-03-17": not found on the sources cited. Remove the date, or find a source.
9. Genesis 2026-27 `ccs1_to_nacs`: add https://owners.genesis.com/us/en/resources/owner-education/how-to-charge.html (says adapters "are included"; 2026+ GV70) and keep `low_confidence` for the GV60 and GV70 2027.
10. `hyundai/ioniq-9/2027/*` adapter: change `kind` from `manufacturer` to `estimated` (the note starts "Estimated:").
11. `hyundai/ioniq-5/2025/xrt` (CA): adapter and port disagree with the Hyundai Canada FAQ (CCS through 2025). Report to the lead; port and `supercharger_access` are not changed here.
12. Fill or list the unfilled items in section 3 (GV70 x6 heat pump, IONIQ 5 N 2025, IONIQ 6 2023 x6, IONIQ 6 N 2027, Kona N Line 2025).
13. Re-point the three year-mislabelled Hyundai Canada URLs (IONIQ 5 /2024/ and Kona /2024/ redirect to 2027; the IONIQ 5 2026 page is /showroom/2026/ioniq-5).

## 7. Per-value summary (adapters)

| Group | Value | Result | Evidence |
|---|---|---|---|
| US CCS1 Hyundai (IONIQ 5 2022-24, IONIQ 6 2023-25, Kona, N 2025) | nacs_to_ccs1_sold | ✅ (dates) / ⚠ (dealer date) | giveaway FAQ and NACS-info page, see section 1. $250 verified |
| US CCS1 Genesis (G80, GV60, GV70 2024-25) | nacs_to_ccs1_sold | ✅ | Genesis FAQ and the G80 page: "Purchase of external charging adapter is required for owners of 2023-2025" |
| Ioniq Electric 2017-21 (US) | nacs_to_ccs1_sold | ⚠ | Not in giveaway FAQ; "IONIQ EV" is on the NACS-info page. Canada list is 2019-21 only |
| Canada-only Hyundai CCS1 | nacs_to_ccs1_on_request | ⚠ | Press only; Hyundai Canada hub page supports it (see section 1) |
| 2023 GV70 (CA) | nacs_to_ccs1_sold | ⚠ | Genesis Canada release: "Genesis will offer an adapter", no free/sold wording; GV70 not in the 2026 programme for 2023 |
| 2025 IONIQ 5 US NACS | ccs1_to_nacs | ✅ | US adapter FAQ |
| 2026-27 IONIQ 5 CA, IONIQ 9 2026 | ccs1_to_nacs | ✅ | Hyundai Canada 2026 pages |
| IONIQ 9 2027, IONIQ 5 2027, IONIQ 6 N | ccs1_to_nacs | ⚠ | Press carry, `low_confidence`; IONIQ 6 N quote verified |
| Genesis 2026-27 | ccs1_to_nacs | ⚠ | See section 1; better source exists |
| 2026 IONIQ 5 N | ccs1_to_nacs | ✅ | KBB, electrive (not cited in the batch) |

## Applied by the main session (2026-11-20)
- Heat pumps dropped: IONIQ 6 2024 (all trims, ticks unreadable) and 2025 SE Standard Range; Ioniq Electric 2017–21; Kona Electric 2024 (CA, URL served a 2027 page). 12 car-trims.
- Kona US `none` (9): `estimated`, low_confidence, note on absence-only basis and the Edmunds conflict. IONIQ 5 2024 RWD `none`: `estimated`.
- Canada `_on_request` (14 cars): source is now the Hyundai Canada EV hub page; press keeps only the model list and cutoff.
- "Dealer from 2025-03-17" removed from all notes; giveaway notes rewritten with the verified dates and $250 MSRP.
- 2026 IONIQ 5 N adapter: re-sourced to electrive. Genesis 2026–27 `ccs1_to_nacs`: re-sourced to Genesis Owners "how to charge"; GV60 and 2027 GV70 low_confidence. IONIQ 9 2027 adapter: `estimated`.
- Hyundai Canada IONIQ 5 source URL now the 2026 page. autoipacket brochure copies retyped `community`.
- Not done, owner decision: 2025 IONIQ 5 XRT (CA) port (data NACS, Hyundai Canada FAQ says CCS through 2025); expired US free offers recorded `_sold`.
- Unfilled: GV70 heat pump (6), IONIQ 5 N 2025, IONIQ 6 2023 (6), IONIQ 6 N 2027, Kona N Line 2025.
- `--check` passes.
