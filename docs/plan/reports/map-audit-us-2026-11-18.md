# Map data audit: US chargers (Phase 7, B78, DESIGN-7 D1-D2), 2026-11-18

Scope: `sources/afdc-us`, `sources/ocm-us`, `data/imported/{afdc,ocm}/us.json`, `public/data/map/` (as built, 15:02), plus a Canada re-check.
Method: I re-normalised both raw pulls with my own code (not the importer's) and diffed the result against the imported files. I re-ran the duplicate merge and verified it independently. I then compared every map tile feature with its imported station. Raw files only, no API calls, no `.env`. Helper scripts live in the session scratchpad; nothing in the repo was edited. Random seed for all samples: **20261118** (LCG).

## Verdict: **FIX** (4 concrete problems) + WATCH items

The importers, level/plug/band rules, tiles and budgets are correct: 0 mismatches against the raw data on 85,947 AFDC-US, 11,711 OCM-US, 14,547 AFDC-CA and 2,508 OCM-CA records. What fails is the duplicate matching and location sanity in a few places, which put wrong or misplaced stations on the map.

| # | Finding | Rule | Severity |
|---|---|---|---|
| F1 | About 60 OCM Tesla Destination stations are removed as "duplicates" of a different hotel next door | 12 | FIX |
| F2 | 6 kept OCM stations and 2 AFDC stations sit at coordinates that disagree with their own state or city; 2 more kept OCM points are in the Pacific; 1 AFDC point (Oregon) is in Alberta | 12, 15 | FIX |
| F3 | 73 kept OCM stations (155 in the file) have no state | 15 | FIX |
| F4 | Two OCM J1772 ports carry 30,000 kW | oddities | FIX |

---

## 1. Counts

### AFDC US (`afdc-us`, `src-afdc-us`)
| | Count |
|---|---:|
| Raw (`fuel_stations`) | 91,729 |
| Dropped: private (non-public) | 5,453 |
| Dropped: planned (status P) | 214 |
| Dropped: no location | 0 |
| Dropped: no L2/L3 port (Level 1-only, NEMA, legacy) | 115 |
| **Kept** | **85,947** (matches the file, `meta.json` and `summary.md`) |
| Ignored connector ports | NEMA1450 80, J3271 4 (flagged, not guessed) |

- Kept by level: Level 2-only 69,388; Level 3-only 15,057; mixed L2+L3 1,502. That makes 16,559 sites on the Level 3 layer, as in the summary.
- Port counts by plug and level: L2 J1772 178,787; L2 NACS 16,474; **L2 CCS1 13**; L3 CCS1 40,988; L3 CHAdeMO 8,548; L3 NACS 46,160.
- Band counts (port lines, upper edge included):

| Level | Band | Port lines |
|---|---|---:|
| L2 | ≤3.6 kW | 247 |
| L2 | ≤7.2 kW | 46,815 |
| L2 | ≤11.5 kW | 13,778 |
| L2 | >11.5 kW | 8,957 |
| L2 | unknown | 5,996 |
| L3 | ≤50 kW | 4,696 |
| L3 | ≤100 kW | 5,720 |
| L3 | ≤250 kW | 9,623 |
| L3 | >250 kW | 5,453 |
| L3 | unknown | 75 |

- Temporarily unavailable (T): 1,853. All have an expected date, and 1,741 of those dates are already in the past (oldest 2022-01-05). The panel hides past dates (`station-details.ts`).
- Restricted: 1,800. `access_detail` is carried: CALL 622, CREDIT_CARD_ALWAYS 3,059, KEY_ALWAYS 35, LIMITED_HOURS 3, GOVERNMENT 1, CREDIT_CARD_AFTER_HOURS 1.
- Tesla: network "Tesla" (Supercharger) 3,329, all with an L3 port; "Tesla Destination" 3,923, none with an L3 port. Flags are correct.
- States: 51 codes present, all valid (50 states, DC) plus PR (26). AK 72, HI 422. **No GU, VI, MP or AS records exist in the raw pull**, so Guam is absent at the source, not lost by the importer.
- Unknown power per network (sites with at least one unknown-kW port): Non-Networked 3,743 of 4,830 (77%), AMPUP 542 of 991 (55%), Tesla Destination 670 of 3,923 (17%), SWTCH 87 of 571 (15%). ChargePoint, Blink, Electrify America, eVgo, Tesla Supercharger and the other major networks are under 1%.

### AFDC CA (re-check)
Raw 15,250; private 692, planned 3, no L2/L3 8; **14,547 kept**, unchanged from before (15,125 sites with OCM). My re-normalisation matches exactly.

### OCM US (`ocm-us`, `src-ocm`)
| | Count |
|---|---:|
| Raw | 13,232 (all provider 1; all submission status 100 or 200) |
| not_operational (100/150/200/210) | 210 |
| private (usage 2, 3, 6) | 1,004 |
| no_location | 7 |
| no_port_data | 164 |
| no_l2_l3_ports | 136 |
| **Usable** | **11,711** (6,877 L3 sites, 4,834 L2-only; summary agrees) |
| Removed as duplicates | place 8,997, address 171, name 53, skip 0 (9,221 total) |
| **Kept on the map** | **2,490** |
| Near misses within 500 m | 1,163 |

- Kept on the map by level: L2-only 1,873; L3-only 475; mixed 142.
- Kept by plug (port lines): L2 J1772 843; L2 NACS 1,226; L3 CCS1 643; L3 CHAdeMO 400; L3 NACS 143.
- Kept by band:

| Level | Band | Port lines |
|---|---|---:|
| L2 | ≤3.6 kW | 70 |
| L2 | ≤7.2 kW | 307 |
| L2 | ≤11.5 kW | 510 |
| L2 | >11.5 kW | 844 |
| L2 | unknown | 338 |
| L3 | ≤50 kW | 466 |
| L3 | ≤100 kW | 388 |
| L3 | ≤250 kW | 166 |
| L3 | >250 kW | 113 |
| L3 | unknown | 53 |

- Networks kept: Tesla Destination 1,191, none 416, ChargePoint 215, eVgo 170, Volta 55, EV Connect 48.
- Temporarily unavailable 19; restricted (usage 7) 92.
- The kept OCM set is 63% Tesla Destination or networkless. It is mostly small hotel and Tesla-wall-connector sites that AFDC lacks, which is what OCM is for.

### OCM CA (re-check)
Raw 2,901; not_operational 95, private 274, no_location 1, no_port_data 16, no_l2_l3 7; 2,508 usable. Merged against both countries' AFDC: skip 17, place 1,830, address 66, name 17, **578 kept, 307 near misses**. This equals the Phase 6 figures in CHECKLIST 6.4 and 7.2, so **Canada is unchanged: 14,547 + 578 = 15,125 sites**. `meta.json` per-source counts: afdc-ca 14,547, afdc-us 85,947, ocm-ca 578, ocm-us 2,490; total 103,562 = L3 20,236 + L2 83,326. Per-country and combined merges keep the same US set (0 differences).

### Sanity checks (rule 17)
- OCM US missing share = **171 of 11,882 = 1.44%** (limit 2%). It is made up of **no_location 7 + no_port_data 164 only**.
  - no_port_data: 106 records with no connection at all, 39 with only the "unknown" type (0), 19 whose connections are all gone.
  - no_location: 5 have coordinates at or near 0,0 or a positive longitude (Borden IN 85, Eldon MO 92.6, Marshfield MO 92.9, Priest River ID and Medford OR at 0,0, La Place LA at 0.0008), plus "Hubei" (a Chinese longitude).
  - Not counted as missing (correct): 136 no_l2_l3_ports (Level 1, NEMA, Type 2 and similar).
- With the old formula it would have been (171 + 136) / 12,018 = 2.6%, over the limit, so the B78 7.4 change is what lets the US pull through. It is justified, because those 136 are real stations of other kinds.
- AFDC US "missing" is 115 of 86,062 = 0.13%. For AFDC the importer still counts every `no_l2_l3_ports` as missing, including Level 1-only stations (raw has 2,703 Level 1 units). That is not the OCM rule, but it is harmless at this size. WATCH, not a bug.
- Drop check (>10%): not applicable on a first import (prev = none).

---

## 2. Rule-by-rule result

| Rule | Result |
|---|---|
| 1 Level from source | ✅ AFDC: `charging_level` "2" or "dc_fast" only. 280 US ports are DC under 25 kW (24 kW and similar) and stay Level 3. ⚠ See W1, W2. |
| 2 Bands, upper edge, unknown | ✅ Edge values exist and sit in the lower band: L2 3.6 (6), 7.2 (2,687), 11.5 (1,547); L3 50 (3,694), 100 (1,551), 250 (1,782). No kW lies within 0.05 above an edge. Overview band equals tile band for every station, 0 mismatches. The filter slider takes both ends inclusive (B35; bands are descriptive only). |
| 3 Plugs | ✅ J1772, J1772COMBO, TESLA, CHADEMO mapped; NEMA1450 and J3271 counted and ignored, none guessed. |
| 4 Dropped and kept | ✅ AFDC private 5,453 and planned 214 dropped; E and T kept, expected date only for T. Level 1-only dropped. |
| 5 Access flags | ✅ `restricted` and `access_detail` and `hours` carried into every feature (`rs`, `ad`, `h`). |
| 6 Tesla | ✅ See above. OCM: "Tesla" only when the site has an L3 port, else "Tesla Destination". ⚠ W3: one site is flagged Supercharger on a 6 kW "CCS1" port. |
| 7 Ports | ✅ 0 port mismatches against raw (AFDC counts, kW per plug; OCM `Quantity`). |
| 8 Sourcing | ✅ `source` = afdc-us / ocm-us / afdc-ca / ocm-ca; `source_id` = src-afdc-us / src-ocm / src-afdc-ca; every feature has the right `src` (0 bad). No key in the repo: the grep finds only the empty `OCM_API_KEY=`, `NLR_API_KEY=` and `ORS_API_KEY=` placeholders in `.env.example` and docs. No key in FETCHED, summaries or data. |
| 9 OCM filters | ✅ Providers only 1/24/45; submission only 100 or 200; gone (100, 150, 200, 210) and private (2, 3, 6) dropped; 30 kept as T (48 in the file, 19 on the map); only usage 7 restricted (membership 4 and pay-at-location 5 are not). 0 mismatches in my independent normalisation. |
| 10 Plugs and level | ✅ 1→J1772, 32→CCS1, 2→CHAdeMO, 27 and 30→NACS; others counted in `ignored_ports` (types 0, 5, 6, 7, 8, 9, 10, 11, 13, 15, 22, 24, 25, 33). CCS1 and CHAdeMO always L3, J1772 always L2 (level 1 dropped), NACS L3 only with OCM level 3 or ≥40 kW. ⚠ W2. |
| 11 Ids | ✅ OCM ids are 100,000,000 + id; no id appears twice across l3/l2 or tiles; every `src-ocm` feature has an id ≥ 1e8 and an `op`. |
| 12 Duplicates | ⚠ Layers behave as specified (0 violations in 9,221 removals; nothing kept that a layer should have removed). The "never removed" guard works. But the layers as specified give wrong removals (F1) and some missed duplicates (section 4). |
| 13 Credit | ✅ Every OCM feature has `src` and `op`; `src-ocm.json` carries licence and attribution; StationPanel shows provider, licence link and an OCM link; About lists `src-ocm` and `src-afdc-us`. |
| 14 Fair use | ✅ FETCHED: CA 4 + US 4 = **8 requests (≤ 9)**. `fetch-ocm.ts`: 3 s pause, `PAGE_SIZE` 5000, page caps CA 2 / US 5, one attempt per page, `X-API-Key` header, `Voltway-charger-refresh` agent. The CA FETCHED query still says `maxresults=1000`; it predates the 5,000 setting and a new pull will use 5,000. |
| 15 Country | ⚠ See F2, F3. All AFDC-US states valid; AK, HI, PR present; no US file station in Canada on the map except 251020 (bad coordinates). Guam, VI, MP, AS not in either source. |
| 16 Same rules | ✅ with the US-only oddities in section 5. |
| 17 Missing data | ✅ See section 1. |
| 18 Tiles | ✅ See section 3. |

---

## 3. Tiles (rule 18, D2)

- 916 detail tiles: 381 at Level 3, 535 at Level 2. The index lists exactly these files (0 missing, 0 extra) with the right counts.
- All **103,562** map stations are in exactly one tile of their level (20,236 L3, 83,326 L2). No id is in both levels, none is repeated, and every point lies inside its tile's box. Each station appears once in its level's overview. Overview ports and bands equal the tile's. Tile content equals the imported record on all 103,562 (name, address, network, T and expected date, restricted, hours, pricing, updated, coordinates at 5 dp).
- **Largest tile: `tiles/2/49-58.json` at 296,579 bytes, which is 98.9% of the 300 KB budget.** The build passes, but a few more Level 2 stations in that cell would force a deeper split (the quadtree already allows depth 6). WATCH.
- First load: `o3.json` 564,000 + `tiles/index.json` 10,659 + `meta.json` 633 = **575,292 bytes (under 1 MB)**. `o2.json` is 1,503,240 bytes, loaded from zoom 7 and outside the budget.
- Overview encoding clamps kW to 999.9 and zero. Two stations are affected (F4, 30,000 kW). Rounding to 0.1 kW changes no band elsewhere.
- Cosmetic: `meta.updated` and `fetched_at` come from the Canadian AFDC file (2026-11-16), so a US AFDC station's footer says "updated 2026-11-16" although the US pull is 2026-11-18. `meta.sources` has the right per-country dates. WATCH.

---

## 4. OCM duplicate matching (rule 12)

Removed: place 8,997 (77% of usable). Distance split of place removals: ≤10 m 5,259; ≤50 m 2,655; ≤100 m 775; ≤150 m 308. Address layer: median 197 m, p90 519 m, max 987 m.

### 4.1 Removed records: sample of 22 (seed 20261118)
"Same" means the AFDC match really is the same site.

| OCM id | Layer | OCM record | AFDC match | m | Verdict |
|---|---|---|---|---:|---|
| 218148 | place | Metropark Square - Tesla Supercharger, NACS 250 x8 | 237658 Shenandoah TX, same street no. | 3 | ✅ same |
| 472839 | place | Pilot #573 Hempstead, eVgo CCS1 350 x4 | 448769 Pilot 573 | 62 | ✅ same |
| 381928 | place | SOUTH HILL STATION 1, ChargePoint | 387525 same name | 0 | ✅ same |
| 241739 | place | Pismo Beach Premium Outlets, EA | 152395 same | 8 | ✅ same |
| 318870 | place | Austin Airport cell lot, ChargePoint DC | 180216 PIE AE AUS DC1 | 0 | ✅ same (same address) |
| 244807 | place | DC CORRIDOR NUGGET L2 (CCS1 62 x2) | 181881 GF4EVA NUGGET DC1 | 14 | ✅ same |
| 157337 | place | MGM Wine & Spirits Plaza, CCS1 50 + CHAdeMO 50 | 421817 Commerce EV Charger (Red E, CCS1 60 x2) | 5 | ✅ likely same |
| 312539 | place | Journey's End Expresso (Rivian, CCS1 300 x6) | 466721 Astoria OR (Rivian) | 63 | ✅ likely same |
| 299314 | place | Starbucks 1540 NW Gilman (ChargePoint 62.5 DC) | 346022 Volvo Issaquah DC1 (1460 NW Gilman) | 9 | ⚠ unclear: coordinates equal, addresses 80 numbers apart |
| 128826 | place | Corning Museum of Glass (4 x 7.2) | 122698 SULLIVAN PARK CMOG (2 x 6.5) | 11 | ✅ same site (OCM has more ports) |
| 227593 | place | Oskaloosa IA, Shell Recharge CCS1+CHAdeMO 50 | 167599 110 S D Street (ChargeLab) | 92 | ✅ same (operator changed) |
| 316340 | place | MB RIVERVIEW 5-6 (Mercedes HPC 400 x10) | 390814 Shoppes at Boyette MB.HPC | 4 | ✅ same |
| **141841** | place | DC Corridor Hagerstown #1 (ChargePoint CCS1 50 x4 + CHAdeMO x4 + J1772 L2 x2) | 391301 Hagerstown MD (**Rivian**, CCS1/NACS 300) | 148 | ❌ different network and equipment, different street (17523 vs 17301 Valley Mall Rd) |
| **9084** | place | Hilton Eugene Garage (Blink J1772 x4, 66 E 6th Ave) | 357160 LANE COUNTY LC PSB5 (ChargePoint, 675 Oak St) | 74 | ❌ likely different (other network, other street) |
| **97462** | place | Mainstreet Motors (Tesla Dest, 6958 Eubanks St) | 115733 Parkwood Collision (Tesla Dest, 8066 Parkwood Blvd) | 145 | ❌ different businesses |
| 278654 | address | Green Mountain Power - Bethel (ChargePoint CCS1 80) | 225582 GMP Royalton/Bethel (FLO 100) | 200 | ✅ same address |
| 117996 | address | 237 S Tryon St Garage (Tesla Dest) | 122500 same | 668 | ✅ same address |
| 278312 | address | Trailhead Golf Course (EV Connect 180 x2) | 311621 same | 180 | ✅ same |
| 174001 | address | Cedar Lakes Casino (J1772 x2) | 187549 (ZEFNET) | 240 | ✅ same |
| **54848** | name | Hilton LAX - Tesla (5711 W Century Blvd) | 150491 LA Airport **Marriott** - Tesla Destination (5855 W Century) | 246 | ❌ different hotels; match on "airport"/"tesla" |
| **61581** | name | Best Western Plus Richmond Inn & Suites - Tesla | 467490 **Home2 Suites** Baton Rouge Citiplace | 177 | ❌ different hotels; shared words only "suites" and "tesla" |
| 225348 | name | Pedricktown NJ - John Fenwick Supercharger (Tesla NACS 250 x8) | 451859 John Fenwick Service Area (Applegreen CCS1/NACS 400) | 162 | ⚠ same plaza, different operators; probably same site, power differs |

Result: 17 of 22 correct, 1 unclear, 4 wrong (18%, but the sample was chosen to include suspicious records, so this over-states the rate).

### 4.2 F1: Tesla Destination records wrongly removed (FIX)
Tesla Destination is one NACS 16 kW Level 2 line at each hotel, so every pair of neighbouring Tesla Destination hotels "shares a plug at the same level". Within 150 m, **55 OCM Tesla Destination records are removed as duplicates of an AFDC Tesla Destination record that has a different name and a different address** (the place layer). A further **5 name-layer removals share only generic words** ("tesla" plus "suites", "hotel", "resort" or "parking garage"). Examples:
- 48281 Fairfield Inn 2134 La Porte Rd vs AFDC Hampton Inn Waterloo 2034 Laporte Rd (108 m)
- 61887 Hilton Garden Inn 1020 Wilkinson Trace vs Courtyard Bowling Green 1010 Wilkinson Trace (132 m)
- 51814 Colony Palms Hotel vs Alcazar Palm Springs (143 m)
- 51900 Calistoga Spa Hot Springs vs Mount View Hotel & Spa (120 m)
- 61581 Best Western Plus Richmond Inn & Suites vs Home2 Suites Baton Rouge (177 m)
- 54848 Hilton LAX vs LA Airport Marriott (246 m)

Each is a real, separate Tesla wall connector that is now missing from the map.
- Place layer, 55 ids: 27337, 47473, 48234, 48281, 51814, 51900, 51949, 61887, 67377, 67379, 67404, 72144, 81583, 81716, 81928, 82369, 84403, 85075, 85473, 88027, 88753, 89632, 90288, 90338, 90433, 90561, 92310, 92472, 92561, 93398, 94606, 95073, 97462, 97848, 99399, 101500, 101545, 101922, 101945, 103654, 104300, 105349, 105528, 109169, 109236, 109299, 113805, 113978, 114040, 118095, 125157, 125162, 125958, 130995, 460024.
- Name layer, generic words only, 5 ids: 51702, 61581, 61856, 71599, 104910.
- Some of the 55 may be the same site spelled differently (for example 90202 Hampton Inn El Reno vs Home2 Suites El Reno at 1530 vs 1528 SW 27th St are separate hotels). The point is that the rule cannot tell, and Tesla Destination sites are nearly always a distinct business each.
- Suggested fix, for the owner to approve as a design change: for the place layer, when both sides are Tesla Destination (or both single-plug L2 NACS), also require a similar name or a matching street, or shrink the radius to about 25 m. In the name layer, ignore generic words (tesla, destination, hotel, suites, inn, resort, parking, garage, airport).
- A weaker form of the same issue: 391 removed records had a CHAdeMO port or a Level 2 J1772 port their AFDC match lacks (for example Pohanka Nissan 3634, CHAdeMO + J1772 next to a CCS1/CHAdeMO-only listing). That follows the written rule, because a CCS1 or CHAdeMO fast charger at the match counts as "has DC". The L2 ports are lost, which seems acceptable. Noted only.

### 4.3 Near misses: sample of 33 of the 1,163 (seed 20261118)
Classification of all 1,163: **159** are kept because the OCM record adds an L3 port or NACS plug (the guard); **750** have no plug shared at the same level with the nearest AFDC station; **254** share a plug but sit beyond 150 m and have no name or address match.
- 93 of the 159 are the same site (same name and/or street, often 0 m) where OCM adds a NACS port: eVgo plazas such as Sunrise 50 Plaza 223932, Highridge Plaza 227274, Shops at Erwin Mill 241989, Buckley Square 225326, Middletown Plaza 226359, plus Walt Whitman Service Plaza 349146 and BP Express Stop Jackson 461715. The rule keeps them, so those sites show twice, with their CCS1/CHAdeMO ports counted twice. See W4.

| OCM id | OCM / AFDC (m) | Class | Verdict |
|---|---|---|---|
| 223932 | Sunrise 50 Plaza / same (0) | adds NACS | same site; kept by rule |
| 227274 | Highridge Plaza / same (0) | adds NACS | same site; kept by rule |
| 241989 | Shops at Erwin Mill / same (0) | adds NACS | same site; kept by rule |
| 225326 | Buckley Square / same (0) | adds NACS | same site; kept by rule |
| 349146 | Walt Whitman Service Plaza / same (0) | adds NACS | same site; kept by rule |
| 461715 | BP Express Stop / FasCharge BP Express Stop Jackson (27) | adds NACS | same site; kept by rule |
| 479032 | Casey's, Interstate Blvd / Caseys 3760 Loves Park (67) | adds NACS | same site likely; kept by rule |
| 304949 | Rove Santa Ana / Rove EV Charging Hub (43) | adds NACS L2 x28 | same site; kept by rule |
| 304229 | Jack Keller Realtors / Plug N' Play (32) | adds NACS L2 | same J1772 ports; same site |
| 478115 | HubCharge, 201 E Bay State St / Tesla Supercharger Alhambra (27) | adds | unclear: Tesla NACS 250 x12 vs OCM CCS1+NACS 160 to 180; possibly a different operator on the same lot |
| 101908 | EVgo Whole Foods Houston / ChargePoint Town Square (318) | adds DC | ✅ different |
| 189353 | Meijer (Shell) / Blink "Scio" (280) | adds DC | ✅ different |
| 90436 | Potomac Lanes Tesla Dest / South Branch Cinema 6 J1772 (37) | no shared plug | ✅ different equipment |
| 25712 | CHAdeMO charger at Melbourne City Hall / DCFC 1 CCS1+NACS 62 (17) | no shared plug | same site, CHAdeMO only; owner's call |
| 143635 | Quechee Mall eVgo DC / Blink L2 (78) | no shared plug | ✅ different |
| 220344 | Friendly Hills Marketplace Volta L2 / eVgo DC (197) | no shared plug | ✅ different |
| 72617 | UIC Maxwell Garage eVgo DC / Blink L2 (23) | no shared plug | ✅ different |
| 104253 | Springhill Suites Modesto Tesla Dest / ChargePoint OBE (61) | no shared plug | ✅ different |
| 82287 | La Copa Inn Tesla Dest / South Padre Supercharger (360) | no shared plug | ✅ different |
| 106435 | Holiday Inn Express Golden Valley / Blink Parking Garage (431) | no shared plug | ✅ different |
| 95478 | Hotel Hot Springs / ChargePoint Embassy (420) | no shared plug | ✅ different |
| 9899 | Makoto's Japanese Steak House / Boone Supercharger (63) | no shared plug | ✅ different |
| 48152 | Holiday Inn ChargePoint 25 kW / La Quinta Blink (47) | no shared plug | ✅ different |
| 67174 | Atlantic House B&B / Ocean City street parking (310) | no shared plug | ✅ different |
| 51952 | Sayre Mansion / Ideal Food ChargePoint (318) | no shared plug | ✅ different |
| 458557 | Bazaar Properties Red E DC / Campanelli Red E L2 (316) | no shared plug | ✅ different |
| 74885 | North Houston Supercharger / Holiday Inn Express (295) | no shared plug | ✅ different |
| 95200 | Roger Smith Hotel Tesla Dest / 277 Park Ave EV Connect (83) | no shared plug | ✅ different |
| 71884 | PARK PLACE DC (ChargePoint) / PARK PLACE 5 L2 (15) | no shared plug | ✅ separate DC unit, same address |
| 123437 | Town of Elkin Rec Center / same name (300) | shared J1772 | ❌ **missed duplicate** |
| 40780 | Paramus NJ 501 NJ-17 Tesla / Paramus NJ-17 Tesla Supercharger (243) | shared NACS | ❌ **missed duplicate** |
| 3485 | Nissan of Visalia / Nissan of Visalia, 830 S Ben Maddox (323) | shared J1772 | ❌ **missed duplicate** |
| 72973 | Four Columns Inn / The Fat Crow, Tesla Dest (370) | shared NACS | ✅ different |
| 120709 | CHARGEPOINT 7250 N Dobson / ChargePoint SCD RTECH DC 1, 7350 N Dobson (172) | shared CCS1+CHAdeMO | likely same DC unit (just over 150 m); the OCM record also has J1772 x8; owner's call |

Result: 33 sampled; 3 clear missed duplicates, 2 owner's-call, about 10 same-site records kept by rule (W4), the rest correctly kept. I also scanned the other 127 near misses that share a plug or a network for shared name words and found no further clear duplicates. The 127 are dominated by neighbouring Tesla Destination hotels, which are correctly kept (the mirror image of F1).

### 4.4 Likely missed duplicates, ready to paste into `data/imported/ocm/skip.json` (owner approves)
```json
{ "ocm_id": 123437, "reason": "Duplicate of AFDC 104308 Town of Elkin - Recreation Center (same name, shared J1772, 300 m apart; street typed 'NC Highway 268 W' vs 'Highway 68 W' so the address layer missed it). Audit 2026-11-18 (US)." },
{ "ocm_id": 40780, "reason": "Duplicate of AFDC 257667 Paramus, NJ - NJ-17 - Tesla Supercharger (same Tesla site, 243 m apart, NACS 250 kW; OCM name carries AFDC's street number 501). Audit 2026-11-18 (US)." },
{ "ocm_id": 3485, "reason": "Likely duplicate of AFDC 39957 Nissan of Visalia (same dealer name and street, 323 m apart; OCM has no street number so the address layer cannot match). Audit 2026-11-18 (US)." },
{ "ocm_id": 189139, "reason": "OCM duplicate of OCM 189138 Preston Visitor Center (same coordinates, same Shell Recharge ports, same date). Audit 2026-11-18 (US)." },
{ "ocm_id": 189140, "reason": "OCM duplicate of OCM 189138 Preston Visitor Center. Audit 2026-11-18 (US)." },
{ "ocm_id": 189144, "reason": "OCM duplicate of OCM 189138 Preston Visitor Center. Audit 2026-11-18 (US)." },
{ "ocm_id": 172949, "reason": "OCM duplicate of OCM 130999 Silver Oak Alexander Valley (same coordinates, same Tesla Destination 6 kW x2). Audit 2026-11-18 (US)." }
```
The skip list takes OCM ids only. Skip entries for bad-coordinate OCM stations are in F2.

Owner's call (not in the list above): 120709 (ChargePoint Dobson Rd), 25712 (Melbourne City Hall CHAdeMO unit), 62161 (The Inn at Joseph Decuis vs Joseph Decuis Restaurant, both Tesla Destination, 338 m).

---

## 5. Required fixes

**F1 Tesla Destination wrongly removed (rule 12, DESIGN-6 P3).** `scripts/lib/ocm-merge.ts` place and name layers: 55 plus 5 OCM records for separate hotels are dropped. See 4.2 for the ids and the suggested rule change. It needs an owner decision, since it changes P3.

**F2 Records located far from where their own text says (rules 12 and 15).**
- Kept OCM records whose coordinates are in a different state or city from the stated one; each is on the map in the wrong place:
  - 291091 CITGO DCFC "Battle Creek MI": coordinates 42.22, -73.87 (Catskill NY).
  - 304491 Riverview Center "Menands NY": coordinates 37.42, -122.08 (Mountain View CA).
  - 116781 Melka Estate & Winery "St Helena CA": coordinates 34.69, -83.71 (Helen GA).
  - 488576 Hampton Inn & Suites Greenville/Spartanburg I-85 "Duncan SC": coordinates 35.87, -78.85 (Durham NC).
  - 488578 Holiday Inn Express "Lynchburg VA": same coordinates (Durham NC).
  - 488579 SpringHill Suites "Lynchburg VA": same coordinates (Durham NC).
- Kept OCM records in the Pacific Ocean:
  - 311824 "Univeral EV Charger" Van Nuys CA at 37.18, -122.53.
  - 460063 "Abq Mobile EV Charging" Albuquerque NM at 37.77, -122.86.
- AFDC: 251020 "The Lodge at Hot Lake Springs" (La Grande OR) is at lat 55.243 (a typo for 45.243), which lies in Alberta. AFDC 168759 "ENVi Mobile Car Wash" (Gardena CA) is at 33.585, -117.999, off Huntington Beach. The importer's US box is lat 13 to 72, lon -180 to -64, so Canada, Mexico and the sea all pass. Skip entries cover only OCM; the AFDC points need a code check.
- Suggested fix, after owner approval: a state-versus-coordinates check at import (nearest AFDC state, or a state outline) that drops or flags records disagreeing with the state, and a land check against the Canada and US outlines that exist for 7.5 (`makeCountriesOf` returns Canada only for 251020). The six AFDC Niagara Falls NY points that the outlines call Canada are an outline-slack artefact, not data errors; ignore them.
- Skip entries now (owner approves):
```json
{ "ocm_id": 291091, "reason": "Bad coordinates: listed as Battle Creek MI but placed in Catskill NY. Audit 2026-11-18 (US)." },
{ "ocm_id": 304491, "reason": "Bad coordinates: listed as Menands NY but placed in Mountain View CA. Audit 2026-11-18 (US)." },
{ "ocm_id": 116781, "reason": "Bad coordinates: listed as St Helena CA but placed in Helen GA. Audit 2026-11-18 (US)." },
{ "ocm_id": 488576, "reason": "Bad coordinates: Duncan SC hotel placed in Durham NC (same coordinates as 488578 and 488579). Audit 2026-11-18 (US)." },
{ "ocm_id": 488578, "reason": "Bad coordinates: Lynchburg VA hotel placed in Durham NC. Audit 2026-11-18 (US)." },
{ "ocm_id": 488579, "reason": "Bad coordinates: Lynchburg VA hotel placed in Durham NC. Audit 2026-11-18 (US)." },
{ "ocm_id": 311824, "reason": "Bad coordinates: Van Nuys CA mobile charger placed in the Pacific. Audit 2026-11-18 (US)." },
{ "ocm_id": 460063, "reason": "Bad coordinates: Albuquerque NM mobile charger placed in the Pacific. Audit 2026-11-18 (US)." }
```
An automated state check would likely find more beyond the 6 I found with a nearest-neighbour test (21 OCM records disagreed with the nearest AFDC station's state; the others were removed or are border towns).

**F3 No state on OCM US stations (rule 15).** 155 of 11,711 OCM US records have `province: null` (73 of the 2,490 on the map), because OCM's state field is blank, a county ("Cook County"), a misspelling ("Missisipi", "Mas") or an unmapped value. All 73 on the map are derivable from nearby AFDC stations or the postcode. Fix: `scripts/lib/ocm.ts provinceOf`, or fill from the nearest AFDC station or a state outline. The panel then shows a state for every US station.

**F4 kW in the wrong unit.** OCM 488571 (Hyatt Place Charlotte) and 504074 (Crown Toyota KS) each have a J1772 Level 2 port with `PowerKW` 30,000. They show as L2 above 11.5 kW, and the overview clamps them to 999.9 kW. Fix: in `ocm.ts portsOf`, treat kW above a sane ceiling (for example more than 1,000, or more than 400 for a J1772 or L2 port) as unknown.

## 6. WATCH (source oddities, not code bugs)

- **W1 AFDC "Level 2" units that are DC.** 4 AFDC US stations have an L2-classified CCS1 port at 180 to 320 kW: 471556, 471557, 471558 (Circle K, NC, IL, AZ: all four units "level 2", CCS1 180 kW, so the site is Level 2 with a CCS1 plug) and 473327 (Terrapin Station CO, one L2 unit at 320 kW CCS1/NACS beside dc_fast units). Per rule 1 the level follows the source, so they are Level 2 on the map. Also 17 J1772 L2 ports are rated at 40 to 180 kW (VT 388062 180 kW; FL 335583 120 kW; TN 322606 40 kW; NC 449107 40 kW), which is rule 16's "J1772 with DC kW". The kW goes into the >11.5 band. Canada has 2 such ports. Suggest a one-line note to the owner; no change needed.
- **W2 OCM CCS1 or CHAdeMO at tiny power is Level 3.** Because the plug decides, the 33 kept OCM L3 ports under 25 kW include CCS1 at 6, 7.2 and 10 kW (54969 Holiday Inn, 70545 Hamilton Stage, 108240 Cool Hand Luke's), likely J1772 entered as CCS1 in OCM; 60 across the file. AFDC has 280 DC ports under 25 kW (24 kW units are real). Per the owner's rule, so no fix; they pass the DC filter.
- **W3 One Supercharger flag from a low-power port.** OCM 54969 "Holiday Inn" (operator Tesla): CCS1 6 kW (L3) plus NACS 16 kW x2 (L2). The L3 port makes its network "Tesla" (Supercharger) rather than "Tesla Destination". Follows the rule; the data is wrong at the source.
- **W4 Same site shown twice** where OCM adds a NACS port to an AFDC site (about 93 near misses, section 4.3). Not a rule break, but the map shows two pins with duplicate CCS1/CHAdeMO counts at about 0 to 30 m. Options for the owner: keep (current), keep only the added NACS ports of the OCM record, or add a P3 amendment to merge. Cost of keeping: duplicated ports; cost of removing: the NACS plug.
- **W5 OCM-OCM duplicates** are outside P3 (AFDC only): 9 coordinate groups of kept records, 3 identical groups (Preston Visitor Center x4; Silver Oak x2). Skip entries in 4.4; 165 pairs lie within 50 m (mostly separate units at one site).
- **W6 Stale OCM records.** 1,553 of 2,490 kept OCM US records were last updated before 2020 (oldest 2011-02-07); AFDC US's oldest `updated` is 2023-03-10. OCM Tesla Destination records are mostly dated 2018 to 2020.
- **W7 US networks unknown in Canada.** 69 of AFDC US's networks have no Canadian counterpart. The biggest: Blink 6,153, Electrify America 1,234, eVgo 1,216, EVOKE 380, UNIVERSAL 326, CHARGESMART_EV 322. Spelling variants exist across sources (SHELL_RECHARGE vs "Shell Recharge", RED_E vs "Red E Charge", MERCEDES_BENZ vs "Mercedes-Benz High-Power Charging (US)", RIVIAN_ADVENTURE vs "Rivian Adventure Network", APPLEGREEN vs "Applegreen Fast Charge"), so the Network filter may show two entries per network. `NETWORK_OF` in `ocm.ts` only covers Canadian names.
- **W8 Duplicate coordinates on different ids**: AFDC US 862 (57 groups of four or more; the largest has 38 ChargePoint units "STUDIO 2375" at one address); OCM US 40. All are multiple listings at one site; no 0,0 and no port count of 0 anywhere.
- **W9 No Guam, VI, MP or AS stations.** The raw AFDC pull has none and OCM's US pull has none (PR has 26 AFDC and 2 OCM). Rule 15 expects Guam; it cannot be met from these sources.
- **W10 Raw OCM US includes Canadian points**: Montreal, Pemberton, Oliver and Whistler, plus Niagara Falls NY hotels, are all removed as duplicates of AFDC-CA or AFDC-US and none stays on the map; this is lucky rather than designed, so F2's land check would make it robust.
- **W11 Largest tile at 98.9% of budget** (section 3).
- **W12** `power-bands.ts` slider stops are 19.2 and 150/350 as well as the vision.md band edges (owner decision B35), so a port exactly on 50 kW matches both the 0 to 50 and 50 to 100 ranges. This is by design.

## 7. Sample tables (about 40 per source, seed 20261118)

Raw fields are `type/Level/kW/quantity` for OCM (type 1 J1772, 32 CCS1, 2 CHAdeMO, 27 and 30 NACS; usage `u`, status `s`) and `unit level:CONNECTORkWxcount` for AFDC. "Ours" is the imported record, and in all 80 cases the tile feature is identical to it (checked by script, 0 differences across all stations).

### 7.1 AFDC US (40 random)
| Station id | Raw (units) | Ours | Result |
|---|---|---|---|
| 293160 | 2:J1772 6.5x1 ; 2:J1772 6.5x1 | L2 J1772 6.5 x2 | ✅ |
| 467999 | 2:J1772 12 x1 ; x1 | L2 J1772 12 x2 | ✅ |
| 460988 | dc_fast:TESLA 50 + J1772COMBO 50 | L3 CCS1 50 x1, L3 NACS 50 x1 (ChargePoint) | ✅ edge 50 → ≤50 band |
| 351258 | 2:J1772 6 x2 | L2 J1772 6 x2 | ✅ |
| 452503 | 2:J1772 7.2 x4 | L2 J1772 7.2 x4 | ✅ edge 7.2 → ≤7.2 |
| 389758 | 2:J1772 11.5 x1 | L2 J1772 11.5 x1 | ✅ edge 11.5 → ≤11.5 |
| 312115 | 2:J1772 6.5 x2 | L2 J1772 6.5 x2 | ✅ |
| 458414 | 2:J1772 6.5 x2 | L2 J1772 6.5 x2 | ✅ |
| 449113 | 2:J1772 12 x2 | L2 J1772 12 x2 | ✅ |
| 195871 | 2:J1772 ? x6, restricted | L2 J1772 ? x6, rs | ⚠ unknown kW, restricted |
| 376077 | 2:J1772 10.4 x2 ; 6.2 x2 | L2 J1772 10.4 x2, 6.2 x2 | ✅ |
| 460448 | 2:J1772 3.8 x1 | L2 J1772 3.8 x1 | ✅ |
| 250661 | 2:J1772 6.5 x2 | L2 J1772 6.5 x2 | ✅ |
| 113038 | 2:TESLA 16 x1 | L2 NACS 16, Tesla Destination | ✅ |
| 420669 | 2:J1772 3.8 x1 | L2 J1772 3.8 x1 | ✅ |
| 448748 | 4 x dc_fast:TESLA 400 + COMBO 400 | L3 CCS1 400 x4, L3 NACS 400 x4 (>250 band) | ✅ |
| 193147 | 2:J1772 6.5 x2 | L2 J1772 6.5 x2 | ✅ |
| 349618 | 2:J1772 7.7 x2 | L2 J1772 7.7 x2 | ✅ |
| 220316 | dc_fast:COMBO 23.9 x1 | L3 CCS1 23.9 x1 | ✅ DC under 25 kW is Level 3 |
| 348161 | 2:J1772 12 x1 | L2 J1772 12 x1 | ✅ |
| 261629 | 2:J1772 6.5 x2 | L2 J1772 6.5 x2 | ✅ |
| 80258 | 2:J1772 6.5 x2 | L2 J1772 6.5 x2 | ✅ |
| 114515 | 2:TESLA 13 x1 ; x1 | L2 NACS 13 x2 | ✅ |
| 177714 | 2:J1772 6.5 x2 | L2 J1772 6.5 x2 | ✅ |
| 148685 | 2:J1772 6.2 x4 | L2 J1772 6.2 x4 | ✅ |
| 438161 | 2:J1772 11.1 x2, restricted | L2 J1772 11.1 x2, rs | ✅ |
| 467052 | 2:TESLA ? x4 | L2 NACS ? x4 (Tesla Destination) | ⚠ unknown kW |
| 199303 | 2:J1772 6.5 x2 | L2 J1772 6.5 x2 | ✅ |
| 195735 | dc_fast:CHADEMO 62.5 + COMBO 62 | L3 CCS1 62 x1, L3 CHAdeMO 62.5 x1 | ✅ |
| 254163 | 2:J1772 6.5 x2 | L2 J1772 6.5 x2 | ✅ |
| 321467 | 2:J1772 6.5 x2 | L2 J1772 6.5 x2 | ✅ |
| 259440 | 2:J1772 6.2 x2 | L2 J1772 6.2 x2 | ✅ |
| 472020 | 2:J1772 3.8 x1 | L2 J1772 3.8 x1 | ✅ |
| 238457 | 2:J1772 6.5 x2 | L2 J1772 6.5 x2 | ✅ |
| 117431 | 2:J1772 7.2 x2 (AK) | L2 J1772 7.2 x2 | ✅ Alaska present |
| 463745 | 2:J1772 7.7 x1 | L2 J1772 7.7 x1 | ✅ |
| 202924 | 2:J1772 6.5 x2 | L2 J1772 6.5 x2 | ✅ |
| 397514 | 2:J1772 19.2 + dc_fast COMBO 50 | L3 CCS1 50 x1 + L2 J1772 19.2 x1 (mixed) | ✅ in both bands |
| 257241 | 2:J1772 6.5 x2 | L2 J1772 6.5 x2 | ✅ |
| 169233 | 2:TESLA 16 x10 | L2 NACS 16 x10 (Destination) | ✅ |

Edge cases checked by script across the whole file (not sampled): kW exactly on an edge; no-kW ports (6,071 port lines); mixed L2+L3 (1,502); DC under 25 kW (280 ports); T with expected date (e.g. 21498); restricted (e.g. 6405, 7172); Supercharger (101972); Destination (52096); Alaska, Hawaii and Puerto Rico present; 0 mismatches.

### 7.2 OCM US, kept on the map (40 random)
| OCM id | Raw | Ours | Result |
|---|---|---|---|
| 98062 | t30/L2/16kW x3 u4 | L2 NACS 16 x3 [Tesla Dest] | ✅ |
| 479455 | t32/L3/200kW x2 | L3 CCS1 200 x2 | ✅ |
| 303953 | t32/L2/33kW x1 | L3 CCS1 33 x1 | ✅ plug decides level |
| 118532 | t30/L2/10kW x2 | L2 NACS 10 x2 | ✅ |
| 266683 | 2 x t1/L2/6.3 | L2 J1772 6.3 x2 | ✅ |
| 158968 | t1/L2/6kW x2 | L2 J1772 6 x2 | ✅ |
| 102011 | t30/L2/10kW x2 | L2 NACS 10 x2 | ✅ |
| 295399 | t32/L3/120 x3 ; t2/L3/100 x1 | L3 CCS1 120 x3, CHAdeMO 100 x1 | ✅ |
| 244880 | t1/L2/3.7 ; t2/L3/50 ; t32/L3/50 | L3 CCS1 50, CHAdeMO 50 + L2 J1772 3.7 | ✅ mixed, 3.7 → >3.6 band |
| 72277 | t30/L2/8kW u7 | L2 NACS 8, restricted | ✅ usage 7 is restricted |
| 142301 | t1/L2/6.8 | L2 J1772 6.8 | ✅ |
| 301087 | t1/L2/8kW x2 | L2 J1772 8 x2 | ✅ |
| 92698 | t30/L2/16kW x2 | L2 NACS 16 x2 | ✅ |
| 9612 | t2/L3/62.5 ; t32/L3/62.5, status 0 | L3 CHAdeMO + CCS1 62.5 | ✅ unknown status kept |
| 219898 | t2/L3/100 x6, t32/L3/350 x4, t32/100 x2, t27/L3/100 | L3 CCS1 350 x4, 100 x2, CHAdeMO 100 x6, NACS 100 | ✅ |
| 243921 | t2/L3/100 ; t32/L3/150 x3 | L3 CCS1 150 x3, CHAdeMO 100 | ✅ |
| 71427 | t30/L2/8kW | L2 NACS 8 | ✅ |
| 116813 | t30/L2/16kW x3 | L2 NACS 16 x3 | ✅ |
| 84905 | t30/L2/8kW | L2 NACS 8 | ✅ |
| 115755 | t2/L3/62.5 x4 ; t32/L3/62.5 x4 ; t1/L2/6.6 x2 | L3 CCS1 and CHAdeMO 62.5 x4 + L2 J1772 6.6 x2 | ✅ |
| 97586 | t30/L2/16kW x2 | L2 NACS 16 x2 | ✅ |
| 3610 | t1, Level missing, kW missing | L2 J1772 ? x1 | ⚠ unknown kW; level inferred from the plug |
| 13688 | t1/L2/?kW u0 | L2 J1772 ? x1 | ⚠ unknown kW |
| 66855 | t30/L2/8kW x2 | L2 NACS 8 x2 | ✅ |
| 39899 | t1/L2/3kW | L2 J1772 3 x1 | ✅ ≤3.6 |
| 225480 | t32/L3/28kW x2 | L3 CCS1 28 x2 | ✅ DC under 25 to 30 kW is L3 |
| 472362 | t1/L2/7 ; t1/L2/11.5, u4 | L2 J1772 11.5 x1, 7 x1 | ✅ edge 11.5; usage 4 not restricted. Name "Home Charge" is odd |
| 73112 | t2/L3/60 ; t32/L3/60 | L3 CCS1, CHAdeMO 60 | ✅ |
| 72166 | t30/L2/8kW x2 | L2 NACS 8 x2 | ✅ |
| 93757 | t30/L2/16kW x4 | L2 NACS 16 x4 | ⚠ no state (F3) |
| 105342 | t30/L2/16kW x2 | L2 NACS 16 x2 | ✅ |
| 95529 | t30/L2/16kW | L2 NACS 16 | ✅ |
| 496861 | t32/L3/180 x2, status 75 | L3 CCS1 180 x2 | ✅ partly operational kept |
| 92505 | t30/L2/16kW x4 | L2 NACS 16 x4 | ✅ |
| 16452 | t1/L2/7.2kW x2 | L2 J1772 7.2 x2 | ✅ edge 7.2 |
| 341570 | t32/L3/150 x4 | L3 CCS1 150 x4 | ✅ |
| 75770 | t30/L2/8kW x2 | L2 NACS 8 x2 | ✅ |
| 172498 | t1/L2/3kW x2 | L2 J1772 3 x2 | ✅ |
| 95169 | t1/L2/?kW x2 | L2 J1772 ? x2 | ⚠ unknown kW |
| 61697 | t30/L2/8kW | L2 NACS 8 | ✅ |

Extra OCM edge cases: temporarily unavailable status 30 (48 in the file, 19 kept, `expected_date` null as OCM has none); restricted usage 7 (221 in the file, 92 kept); L2 J1772 over 40 kW: 190573 (100 kW), 303209 (40.5 kW); 30,000 kW (F4); Tesla Supercharger network (25 kept, the rest were AFDC duplicates).

## 8. Summary of what is not wrong
- 0 differences between the importers' output and my independent re-normalisation, for 4 files.
- Canada unchanged: 14,547 AFDC + 578 OCM = 15,125 sites; the 17 skip entries, 1,830 / 66 / 17 removals and 307 near misses reproduce.
- No station is missing from a tile, repeated or in both levels. Budgets are met. OCM stations carry `src-ocm`, `op`, and ids ≥ 100,000,000.

Not audited: the tile loader and map UI (browser behaviour is covered by the UI checks in `docs/plan/reports/phase7-ui-check.md`); `scripts/lib/countries.ts` boxes beyond the bounds checks above; `scripts/fetch-afdc.ts` (no calls made, only reviewed for key handling: header, never in the URL).
