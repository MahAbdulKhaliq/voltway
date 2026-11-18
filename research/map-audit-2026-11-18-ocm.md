# Charger-map data audit, 2026-11-18 (AFDC + Open Charge Map, B77)

Auditor: map-data-auditor (read-only). Random seed for all samples: **20261118** (mulberry32 shuffle). Helper scripts live in the session scratchpad, not the repo. No API was called, `.env` was not read.

## Verdict: **FIX**

The AFDC side is clean (independent recompute of all 15,250 raw records matches `stations.json` and the map files exactly). The OCM side follows the written rules (independent recompute of all 2,844 raw POIs matches `data/imported/ocm/stations.json` and the map exactly), but the **duplicate step (rule 12) has behaviours that lose real stations and miss some duplicates**, and one OCM record plots in Asia.

Fixes in short:
1. OCM 160778 has a positive longitude (+122.46) and is on the map outside Canada. No bounding-box check exists in `scripts/lib/ocm.ts`.
2. The place and address layers drop an OCM station when the AFDC site shares **one** level+plug, even if the OCM station has ports the AFDC site lacks. 43 OCM sites with DC fast ports were dropped against AFDC sites that list no DC fast port (14 of them have no AFDC DC fast station within 150 m). 19 Tesla Destination (NACS) sites were dropped against J1772-only AFDC sites.
3. The address layer misses same-address duplicates when the street name is a number or very short ("Route 132", "Hwy 11", "7th Ave", "2nd Ave S" vs "2 Ave S"). 9 likely duplicates stayed on the map.
4. Owner call: OCM `LevelID` 2 on a CCS/CHAdeMO plug (and 50 kW "Level 2" J1772) gives DC plugs on the Level 2 layer.

## Counts

### AFDC (`sources/afdc-ca/stations-raw.json`, sha 9f32aa28..., matches FETCHED.json and stations.json)

| | n |
|---|---:|
| Raw | 15,250 |
| Dropped: private | 692 |
| Dropped: planned (P) | 3 |
| Dropped: Level 1-only / no L2-L3 ports | 8 |
| Dropped: no location | 0 |
| **Kept** | **14,547** (E 14,322, T 225; T with expected date 225) |
| Map (l3 + l2, AFDC part) | 14,547 (3037 + 12,032 in meta incl. OCM = 15,069 total) |

Drop share 4.6 % (limit 10 %), missing-field share 8 of 15,250 (limit 2 %). Both pass.

Kept by level: L3 only 2,591; L2 only 11,618; mixed L2+L3 338 (all mixed sites are in `l3.json`, none in `l2.json`).
Kept by plug (sites with the plug): J1772 11,553; CCS1 2,621; CHAdeMO 1,824; NACS 1,072.
L2 bands (sites in each band, a site counts in every band it has): unknown 1,417; <=3.6 15; <=7.2 8,385; <=11.5 1,085; >11.5 1,095.
L3 bands: unknown 9; <=50 1,433; <=100 778; <=250 1,075; >250 218.

### OCM (`sources/ocm-ca/poi-raw.json`, dry run from OCM's GitHub export dated 2026-04-22, 0 requests)

| | n |
|---|---:|
| Raw POIs | 2,844 (provider 1: 2,818; 24: 20; 45: 6; provider 2: 0) |
| Dropped: not operational / planned (station status 100, 150) | 92 |
| Dropped: private usage (2, 3, 6) | 270 |
| Dropped: unpublished / wrong provider / no location | 0 / 0 / 0 |
| Dropped: no L2/L3 ports | 30 |
| **Usable** | **2,452** (matches the summary) |
| Removed as AFDC duplicates | 1,930 = place 1,808 + address 106 + name 16 + skip 0 |
| **On the map** | **522** (l3 108, l2 414; all 14 mixed sites are in l3) |
| Near misses (kept, within 500 m of an AFDC station) | 254 (reproduced exactly) |

Ignored connection types: id 0 x6, id 11 x2 (counted, not guessed). Status 30 (temporarily unavailable): 6 raw, 4 usable, 1 kept (112038, T, no date; OCM gives none).
Kept by level: L3 only 94; L2 only 414; mixed 14. By plug: J1772 324; NACS 134; CCS1 102; CHAdeMO 71.
L2 bands: unknown 36; <=3.6 11; <=7.2 198; <=11.5 55; >11.5 141. L3 bands: <=50 61; <=100 29; <=250 39; >250 3 (no unknown on L3).
Restricted flag: 279 of 522 kept OCM stations (53 %), versus 403 of 14,547 (2.8 %) for AFDC. OCM usage type 4 "membership required" is 1,555 of 2,844 raw records.

Sanity check: the "more than 10 % drop" test compares this month with last month (no previous OCM data, so nothing to compare); raw-to-usable is 13.8 % but those are the intended private and not-operational drops. Missing fields 31 of 2,482 = 1.25 % (limit 2 %). Pass.

## Rules 1 to 14

| # | Rule | Result |
|---|---|---|
| 1 | Level from source classification | AFDC pass (level only from `charging_level`; 69 sites with DC under 25 kW are Level 3). OCM: see fix 4. |
| 2 | Bands, upper edge included, unknown, any-port | Pass. `inPowerRange` uses `kw <= stop`; edge ports (3.6, 7.2, 11.5, 50, 100, 250) are in the lower band in all 6 edge rows below. |
| 3 | Plugs | Pass. AFDC: no unmapped types had ports. OCM: ids 1/32/2/27/30 map correctly; other ids ignored and counted. |
| 4 | Dropped / kept statuses | Pass for both. AFDC T-with-date 225/225 (**220 of those dates are already past**, today is 2026-11-18; WATCH). |
| 5 | Access flags | Pass (`rs`, `ad`, `h` on map equal imported for all 14,547 AFDC and 522 OCM). |
| 6 | Tesla flags | AFDC pass (Tesla 297 all with L3; Tesla Destination 409, none with L3). OCM: "Tesla" only when a port is L3 (4 kept), else "Tesla Destination" (109). |
| 7 | Ports | Pass. 0 mismatches of 14,547 AFDC and 2,452 OCM against my own recompute from raw. |
| 8 | Sourcing / keys | Pass. Every feature has `src`; no `api_key=` or key literal in the repo (`.env.example` has blank names only; `.env` is git-ignored). |
| 9 | OCM filters | Pass (recomputed: 92 + 270 + 30 drops; membership/notice flagged, pay-at-location not: 154 raw u5 records, none flagged). Unpublished and wrong-provider branches cannot be exercised, the export has none. |
| 10 | OCM plugs and level | Matches the rule text. Oddities in fix 4. |
| 11 | Ids | Pass. 522 OCM ids all >= 100,000,000; no AFDC id >= 1e8; 15,069 map ids unique. |
| 12 | Duplicates | **FIX**, see below. |
| 13 | Credit | Pass. All 522 features have `src: src-ocm` and `op` (519 provider 1, 3 provider 24). `data/sources/src-ocm.json` has licence and attribution. `StationPanel.tsx` shows provider, licence link and an OCM link; `about.astro` lists src-ocm and throws if licence or attribution are missing. |
| 14 | Fair use | Not checkable from FETCHED.json (0 requests, dry run). Code: 3 s pause before every request after the first (including the reference-data call), one attempt per page, header key, `Voltway-charger-refresh/1.0 (+repo URL)` user agent; `tests/ocm.test.ts` covers pause, no retry, page cap. **Gap:** the page cap is 10, so the worst case is 11 requests, above the "5 or fewer" rule. Today's volume is 3 pages + 1 reference = 4; at about 4,000 CA records it becomes 6. WATCH: lower `MAX_PAGES` to 4, or add an explicit request-count check in the import. |

## Rule 12: duplicates (the focus)

### How I tested
- Reran the merge on the data on disk: 1,808 / 106 / 16 / 0 and 522 kept, identical to the summary.
- Judged **every** near miss: all 254 screened by script (shared plug, shared name word, same street number, same network within 300 m), the 117 that scored on any test read by hand; the other 137 have no shared level+plug within 200 m, no shared name word and no shared street number, so they are different sites.
- Sampled 30 removed records across layers (14 place, 10 address, 6 name; all 16 name-layer drops also listed), then scanned all 1,930 removals for structural problems.
- Also checked kept OCM vs kept OCM (the list only covers AFDC).

### Wrongly removed: structural problems (all 1,930 scanned)

A. **OCM DC fast ports lost.** 43 removed OCM sites have an L3 port while the AFDC "match" has no L3 port (address 8, place 35). For 29 of them an AFDC DC fast station exists within 150 m (for example HYDRO ... DCFC records), so the map still shows DC fast there. **14 have none within 150 m, so a DC fast site disappears:**

| OCM id | OCM name | Matched AFDC (L2 only) | DC ports lost |
|---|---|---|---|
| 75504 | FLO - SJHC-DCFC - Tranquility Entrance, Toronto | 315934 SJHC - Sunnyside | CCS+CHAdeMO 50 kW |
| 143983 | Glooscap Ventures, Lockhartville NS | 129612 | CCS+CHAdeMO 50 kW |
| 157423 and 250081 | Kidd Creek Rest Area, BC (two OCM records) | 154190 Kidd Creek Rest Area (L2) | CCS 50 kW x2 / x1 |
| 231454 | ChargePoint - HYUNDAICANADA CPE250, Markham | 428573 HYUNDAICANADA STATION 10 (L2) | CCS 125 kW x6, CHAdeMO x4 |
| 461019 | River Valley Ford Mission | 421785 (FLO L2, 253 m) | CCS 240 kW x2 |
| 73616 | BRCC-St-Hubert-St-Hyacinthe | 305455 Hotel Sheraton (L2) | CCS+CHAdeMO 50 kW x2 |
| 112126 | Salmon Arm - Ross Street Parking Lot | 200822 BC Hydro (L2) | CCS+CHAdeMO 50 kW |
| 144081 | CSRS Notre-Dame-de-la-Paix | 147516 (L2) | J1772 72 kW (source oddity) |
| 189575 | Volkswagen, Lethbridge | 372276 (L2) | CCS 24 kW |
| 193049 | Boston Pizza, Neepawa MB | 253794 (L2) | CCS 200 kW x2 (nearest AFDC DC is a Tesla at 231 m) |
| 295998 | SWTCH - Scotia Plaza, Toronto | 436643 SWTCH (L2, 57 m) | CCS+CHAdeMO 50 kW x2 |

Cause: `mergeOcm` accepts any one shared level+plug (here the L2 J1772) at "place", and the **address layer needs no shared plug at all**. Fix: for place and address, if the OCM site has an L3 port group and the AFDC match has no L3, keep the OCM station (or add only its L3 ports). Same logic for NACS.

B. **Tesla Destination (NACS) lost.** 19 removed OCM "Tesla Destination" sites matched an AFDC station that has only J1772 (hotels, wineries): 79616, 79758, 79811, 79981, 81960, 82285, 94968, 99413, 105509, 109015, 109300, 114656, 118067, 146037, 78714, 79577 and others, all by the address layer. A NACS-only driver now sees nothing there. Also 85068 "Rocky View Supercharger" (Tesla L3 NACS, address layer, 221 m) dropped against AFDC Cross Iron Mills (SURECHARGE).

C. Overall 192 of 1,930 removed OCM stations have at least one level+plug group the AFDC match lacks; 55 of 106 address-layer removals share **no** level+plug with the AFDC site. Owner decision needed: is "same site, AFDC wins" meant to also hide different charger hardware at the same site?

### Sample of removed records (30)

| Layer | OCM id | OCM | AFDC match (id, distance) | Judgement |
|---|---|---|---|---|
| place | 160358 | FLO - Canadian Tire Arnprior | 197804, 26 m | ✅ same |
| place | 73854 | CSSS-Iugs, 122 rue Murray | 305115, 0 m | ✅ same address |
| place | 117813 | BRCC Les Halles de Stoneham | 304949, 23 m | ✅ |
| place | 113654 | Ultramar, 2e Rang | 304892 BRCC Halte Porte de l'Erable, 75 m | ✅ same exit, same plugs |
| place | 160611 | Rudys Gas Bar Port Blandford | 201285 HYDRO PORT BFORD DCFC, 16 m | ✅ (OCM also had an L2 J1772 group, lost) |
| place | 15416 | Quality Inn Sudbury, 390 Elgin | 455736, 67 m | ✅ same address, other network |
| place | 73706 | MTQ Melbourne, 1035 Route 243 | 304653, 0 m | ✅ |
| place | 73796 | Cegep de Sherbrooke-Pavillon, 375 rue du Cegep | 316542 Palais des sports L.-Drolet, 360 rue du Cegep, 64 m | ⚠ different numbers and names, likely two chargers across the street |
| place | 248636 | FLO - Tesla - 18205 Minden | 255258, 7 m | ✅ |
| place | 190768 | Jule - Our Daily Bread Temagami | 201341, 17 m | ✅ |
| place | 92582 | DCFC Ottawa Terry Fox | 305191, 0 m (195 vs 135 Roland Michener) | ✅ |
| place | 148656 | Petro-Canada Woodbridge | 372125, 9 m | ✅ |
| place | 160796 | 1st Avenue East, Prince Rupert | 157791 BC Hydro, 33 m | ✅ |
| place | 290160 | Fernie Husky Tesla Supercharger | 220725, 6 m | ✅ |
| address | 15369 | Hotel Universel (J1772 L2) | 312755 (FLO DC fast), 92 m | ⚠ same hotel, different hardware; L2 lost |
| address | 74088 | Amt-Gare Saint-Jerome | 305370 Exo, 171 m | ✅ |
| address | 191495 | FLO Canadian Tire Wallaceburg | 197854, 331 m (same address 74 McNaughton) | ✅ |
| address | 461019 | River Valley Ford Mission (CCS 240 kW) | 421785 (FLO L2), 253 m | ❌ DC fast lost (A) |
| address | 160733 | FCL Brandon, 1035 Richmond Ave | 202261, 240 m | ✅ same L3 plugs |
| address | 15478 | Wickaninnish Inn (J1772) | 116384 Tesla Destination, 119 m | ⚠ different hardware (J1772 lost) |
| address | 112128 | Chase Chamber of Commerce | 164463 BC Hydro Chase, 202 m | ✅ |
| address | 146037 | Delta Thunder Bay (Tesla Dest NACS) | 258640 SWTCH J1772, 30 m | ❌ NACS lost (B) |
| address | 296794 | Electrify Canada Victoria Square | 279574, 192 m | ✅ |
| address | 79811 | Trois Tilleuls Hotel (Tesla Dest NACS) | 372224 FLO J1772, 111 m | ❌ NACS lost (B) |
| name | 145463 | Parc Clair Soleil de Cabano | 305007 BRCC, 158 m | ✅ |
| name | 15366 | Auberge La Seigneurie des Monts | 82930, 220 m | ✅ |
| name | 77593 | Tsawwassen Mills (FLO L2) | 129961, 269 m | ✅ |
| name | 15340 | Riverfront Chalets & Rafting | 83082, 169 m | ✅ |
| name | 74008 | Venise-en-Quebec Bureau d'Accueil | 306042 Hotel de Ville, 258 m (different addresses) | ⚠ possibly two sites |
| name | 73770 | Okanagan College Kelowna Campus | 130063 HSC Building Lot 6, 238 m | ⚠ campus with several lots |

Result: 21 ✅, 6 ⚠, 3 ❌ in the sample. The other name-layer drops (47508, 73646, 73759, 77592, 77594, 81642, 104969, 130721, 167222, 231990) are the same site, except **73759** (MRC du Haut-Richelieu vs Caisse Desjardins, 380 4e avenue vs 730 bd d'Iberville) and **104969** (Queen's Tindall garage, 142 Union vs Goodes Hall, 143 Union; both Tesla Destination, so plausibly another bay) which look like different sites (⚠).

### Missed duplicates: near-miss judgements (117 read; 40 most relevant shown)

| OCM id | OCM | AFDC | m | Verdict |
|---|---|---|---:|---|
| 111227 | Tim Horton's, 525 Hwy 11 W | 84130 same name and address, CCS+CHAdeMO | 0 | duplicate (OCM labels the DC plugs Level 2, so the place layer missed it) |
| 15414 | Best Western Inn On The Bay, 1800 2nd Ave E | 82925 same name and address, J1772 | 380 | duplicate (street name "2nd" too short for address layer; 380 m for name layer) |
| 160738 | FCL, 114 7th Ave Virden | 201036 Valleyview Gas Bar, 114 7th Avenue, both CCS 100 + CHAdeMO | 157 | duplicate ("7th" too short) |
| 171491 | Savory Rest Area | 434009 BC Hydro Savory Rest Area, identical plug set | 313 | duplicate (just beyond the 300 m name limit) |
| 234576 | HYDRO PORT CHOIX (L3+L2) | 236163 ...DCFC and 236502 ...L2 | 351 / 344 | duplicate (same name, street, network; 3 name words but over 300 m) |
| 145036 | Parlee Beach provincial park, 45 Parlee Beach Rd | 398074 Parlee Beach Provincial Park Campground, eCharge, J1772 | 395 | likely duplicate |
| 15481 | Woss Lake Provincial Park, Hwy 19 Englewood Dr | 445745 BC Hydro Woss, Englewood Dr, shares L2 J1772 | 340 | likely duplicate |
| 77595 | Tsawwassen Mills, Canoe Pass Way (FLO J1772 x2) | 129961 Tsawwassen Mills, 5000 Canoe Pass Way, FLO J1772 x14 | 328 | likely duplicate (77596 and 77597 are other lots, 462 m+; leave) |
| 172750 | Alt Hotel, 480 2nd Ave S | 383879 Indigo - Alt Saskatoon, 480 2 Ave S, J1772 | 170 | likely duplicate (different network name) |
| 15790 | 788 Rue Commerciale Nord (Webasto, 1 J1772) | 305007 BRCC Parc Clair Soleil, 759 Rue Commerciale Nord, has L2 J1772 | 226 | possible; same street and town, 145463 (same site) was already removed |
| 94990 | FCR-Carrefour St-David Ouest, 2815 Av St-David | 129910 Trudel Alliance, 2850 Av St-David (FLO J1772) | 258 | possible, review |
| 110778 | LEAVENS VW | 321252 Leavens Volkswagen DC | 188 | possible (different network, one CCS port each) |
| 111822 | SAGUENAY, 665 Avenue du Pont S (CCS 24 kW) | 225447 Alma Volkswagen, 665 Ave Dupont Sud | 8 | not a duplicate (different network and plug), but OCM's "Level 2 CCS" is wrong |
| 73460, 74053, 74054, 95460, 73802, 73965 | BRCC/St-Hubert style sites, OCM L2 J1772 | AFDC BRCC DC fast at the same address | 15 to 109 | keep: complementary L2 vs DC. Note the address layer dropped 73719, 73750, 73908 and 73877 in the same situation, so the layer is inconsistent |
| 79420, 78718, 146072, 15389 | Tesla Destination or Sun Country J1772 at same hotel | AFDC J1772 or NACS from another vendor | 13 to 89 | keep: different hardware |
| 129825 | Irving Oil Salisbury (CCS/CHAdeMO 50, J1772, **NACS x8 with no level and no kW**) | 153435 Salisbury Tesla Supercharger | 18 | keep, but the 8 level-less NACS ports are almost certainly the Supercharger stalls, shown as L2 NACS (WATCH) |
| 191383, 191333, 210098, 135502, 148144, 77596 to 77598 | Ivy / Petro-Canada / On the Run / Tsawwassen Mills HPC next to a Tesla Supercharger | AFDC Tesla Supercharger | 18 to 480 | keep: different networks |
| 80005, 104407, 81683, 15452, 47513, 73786, 73682, 160181 | other same-street neighbours | | | keep: different addresses or buildings |

### Likely missed duplicates, ready to paste (owner to approve)

```json
{ "ocm_id": 111227, "reason": "Duplicate of AFDC 84130 Tim Horton's, 525 Highway 11 W, Fort Frances (same address, CCS+CHAdeMO; OCM wrongly says Level 2)" },
{ "ocm_id": 15414, "reason": "Duplicate of AFDC 82925 Best Western - Inn on the Bay, 1800 2nd Ave E, Owen Sound (same address and name)" },
{ "ocm_id": 160738, "reason": "Duplicate of AFDC 201036 Valleyview Gas Bar, 114 7th Avenue, Virden (same address, CCS+CHAdeMO)" },
{ "ocm_id": 171491, "reason": "Duplicate of AFDC 434009 BC Hydro - Savory Rest Area (same name and plug set, 313 m apart)" },
{ "ocm_id": 234576, "reason": "Duplicate of AFDC 236163 HYDRO PORT CHOIX DCFC + 236502 HYDRO PORT CHOIX L2 (same site, split in two there)" },
{ "ocm_id": 145036, "reason": "Likely duplicate of AFDC 398074 Parlee Beach Provincial Park Campground (same park, eCharge, J1772)" },
{ "ocm_id": 15481, "reason": "Likely duplicate of AFDC 445745 BC Hydro - Woss, Englewood Dr (same village and street, shares the J1772)" },
{ "ocm_id": 77595, "reason": "Likely duplicate of AFDC 129961 Tsawwassen Mills, Canoe Pass Way (FLO J1772, same site)" },
{ "ocm_id": 172750, "reason": "Likely duplicate of AFDC 383879 Alt Saskatoon, 480 2 Ave S (same address, J1772)" }
```

Review first, not recommended yet: 15790, 94990, 110778.

OCM-internal duplicates (two OCM records for the same charger, both kept; rule 12 only compares against AFDC, so these never get removed). The skip list works for any OCM id:

```json
{ "ocm_id": 73944, "reason": "Duplicate of OCM 23448 Ville de Labelle - Bibliotheque (same address, same coordinates, J1772)" },
{ "ocm_id": 250603, "reason": "Duplicate of OCM 190086 Canadian Tire South - FLO, 2110 101 St NW Edmonton (2 m apart, same CCS+CHAdeMO)" },
{ "ocm_id": 79397, "reason": "Duplicate of OCM 64540 Vignoble Val Caudalies, 4921 Rue Principale (5 m apart; 64540 already lists the NACS port)" },
{ "ocm_id": 77600, "reason": "Duplicate of OCM 77599 Fisherman Way (13 m apart, identical J1772 x2)" }
```

Bad data, not a duplicate (see fix 1):

```json
{ "ocm_id": 160778, "reason": "OCM longitude is +122.46 (wrong sign); plots in Asia. Real site is BC-97 and Windt Rd, Cariboo; check AFDC before restoring" }
```

## Sample tables

### AFDC: 40 random (seed 20261118), all ✅ (raw units -> normalized -> map file identical)
Ids: 83312 471419 83156 257355 256480 460028 305743 231825 261154 389017 232480 145321 315984 253492 84247 211939 464692 421317 463474 313731 465752 237995 375796 304104 461287 470681 326609 84207 332716 300795 261869 252094 452359 261155 129612 304254 168340 455305 315809 304913.
Included: L2 without kW, DC 50 kW pairs, mixed L2+DC (464692, 421317), 11.6 kW and 12 kW L2 (326609, 300795: band >11.5), 16.6 kW L2.

### AFDC and OCM: edge cases

| Id | Rule | Raw | Ours | Result |
|---|---|---|---|---|
| A 256295 | 2 edge 3.6 | L2 J1772 3.6 x10 | L2 j1772 3.6 x10, band <=3.6 | ✅ |
| A 82994 | 2 edge 7.2, restricted | L2 7.2 x2, restricted | band <=7.2, `rs` | ✅ |
| A 255484 | 2 edge 11.5 | L2 11.5 x2 | band <=11.5 | ✅ |
| A 256410 / 145242 | 2 just above edge | L2 3.7 / 7.3 | bands <=7.2 / <=11.5 | ✅ |
| A 83432, 85200 | 2 edge 50 / 100 | DC 50x2+50x2; DC 100 + 50 | <=50 ; <=100 and <=50 | ✅ |
| A 153407 | 2 edge 250 | DC TESLA 250 x6 | band <=250, Supercharger | ✅ |
| A 82833 | 2 no kW | L2 J1772 x1, restricted, access CALL | L2 unknown, `rs`, `ad=CALL` | ✅ |
| A 84376 | 2 mixed no kW | DC TESLA + L2 J1772 | L3 and L2 unknown, in l3 | ✅ |
| A 83443 | mixed, DC 25 kW, LIMITED_HOURS | DC COMBO 25 + L2 | L3 ccs1 25, `ad=LIMITED_HOURS` | ✅ |
| A 153838, 201260 | 1 DC under 25 kW | DC 24.8 / 24 | Level 3 | ✅ |
| A 82965 | 4 T with date | status T, 2026-07-01 | `t:1`, `ed` | ✅ (date is past, WATCH) |
| A 83915 / 84772 | 6 Supercharger / Destination | network Tesla (DC 150x8) / Tesla Destination (L2 17 kW) | flags correct | ✅ |
| A 450132 | 7 | L2 J1772 159.9 kW + TESLA 160 kW, 1 L2 unit, network ChargePoint | L2 bands >11.5 | ⚠ source oddity (likely 16 kW) |
| A 466742 | 7 | DC COMBO 640 kW x6 | band >250 | ⚠ source oddity (640 kW per port is not credible) |
| O 112038 | 4 T | status 30 | `t:1`, no date (OCM has none) | ✅ |
| O 80035 | 9 restricted | usage 7 | `rs` | ✅ |
| O 24057, 49231 | 9 pay at location | usage 5 | not restricted | ✅ |
| O 23448 | 13 provider 24 | p24, 6.24 kW | `op:24` | ✅ |
| O 9845, 132524, 133130 | 2 edge 50 / 100 | L3 50; L3 100 | <=50; <=100 | ✅ |
| O 128545 | 2 edge 7.2 | L2 7.2 | <=7.2 | ✅ |
| O 46728, 111612 | 10 kW 40 rule | L3@40; L2 LevelID@40 | L3 | ✅ per rule (111612 uses the 40 kW rule over OCM's "level 2") |
| O 110759, 110778 | 10 DC under 40 kW | LevelID 3, 24 kW | L3 | ✅ |
| O 24639 / 90707 | 6 Tesla | operator Tesla, L3 150 x8 / L2 NACS 16 | Tesla / Tesla Destination | ✅ |
| O 129825 | 10 no level | t27 x8, no LevelID, no kW | L2 nacs x8 | ⚠ (stalls of an adjacent Supercharger) |
| O 161624 | 10 no level | t30 x2, no level, no kW | L2 nacs, Tesla Destination | ✅ |
| O 110772, 111227, 111249, 111822 | 1 / 10 | CCS (+CHAdeMO) 24 to 35 kW with LevelID 2 (current type AC) | **Level 2 layer** | ⚠ DC plugs on L2 (fix 4) |
| O 135295 | 1 / 10 | J1772, LevelID 2, 50 kW | **L3 J1772 50 kW** | ⚠ AC plug at Level 3 by the 40 kW rule (probably 5.0 kW) |
| O 459954 | 10 | t27 NACS LevelID 2, 55 kW | L3 nacs 55 | ✅ per rule |
| O 160778 | oddity | lon +122.4591368 | on the map | ❌ fix 1 |

### OCM: 40 random (seed 20261118), all ✅ (raw connections -> imported -> map: ports, level file, `rs`, `t`, `src`, `op`)
Ids: 64540 74111 15389 210065 73460 15480 461074 193536 77599 73682 90707 249957 74000 15457 73724 73802 188634 15364 73323 15429 74208 160778 73991 111822 111632 80021 128062 288670 148227 81626 278409 161624 15376 250603 461132 90367 47512 30007 18666 85691.
Notes from the sample: 47512 has a Level 1 connection (type 9, level 1) correctly ignored; 30007 has station status 75 (partly operational) kept as E; 18666 and 111632 have status 0 (unknown), kept; 111632 has a 3 kW J1772 pair plus a 24 kW CCS (listed as mixed, L3 file).

## Oddities

- **Coordinates:** AFDC 0 outside Canada's box, no 0,0. OCM: 1 outside (160778, fix 1). No missing coordinates.
- **Duplicate coordinates:** AFDC 190 groups, all separate stations of one site (Hwisel "YYC-Station 1..9", FLO parkade levels): fine. OCM kept: 1 pair (23448 / 73944, duplicate, above).
- **Blank names:** none in either source. Port counts of 0: none. kW in another unit: none at 1,000 or more. Highs: AFDC 640 kW (466742), OCM 400 kW CCS (311699 Ivy West Mall, plausible).
- **Unknown-power share by network (sites with a missing kW):** AFDC: Non-Networked 1,155 of 1,465 (79 %), SWTCH 237 of 479 (49 %), Tesla Destination 26 of 409, others under 1 %. OCM kept: unknown 36 of 522, ChargePoint Network 15 of 60 (25 %), no network 10 of 72, Sun Country Highway 4 of 70. OCM's `PowerKW` is often an estimate by plug type ("kW power is an estimate based on the connection type" in 160778): it is shown like a measured rating.
- **Age:** AFDC none updated before 2020. OCM kept: 334 of 522 (64 %) last updated before 2020; years 2013 (54), 2016 to 2017 (186). Stale status for old Sun Country Highway and 2017 records is likely. WATCH, maybe show the "updated" date more prominently for OCM.
- **Restricted share:** 53 % of OCM kept stations carry the restricted warning (usage 4 "membership required", mostly Circuit electrique / FLO / Tesla Destination), against 2.8 % for AFDC. Per the rule, but the popup warning will be on most OCM stations.
- **Text encoding:** OCM 73698 name is mojibake in the source ("FLO â Atlantic Superstore"); 3 imported OCM and 4 AFDC names have it too (source).
- **Stale local file:** `sources/afdc-ca/summary.md` says "Sanity checks: FAILED, 14547 -> 12297". It does not match the current raw file (sha equals FETCHED.json and `stations.json`, which recompute to 14,547). Probably left over from a test run; it is git-ignored, but it is confusing next to the real data.
- **Near-miss list limit:** it names only the closest AFDC station. 77595 and 77597 (Tsawwassen Mills) show a Tesla Supercharger as the "closest", while the real counterpart (129961) is the second closest. List all AFDC stations within 500 m, or the best name match, to make the owner's review quicker.

## Required fixes (code and data)

1. **`scripts/lib/ocm.ts`, id 160778 "Australian Rest Area DC Fast":** longitude +122.4591368 passes through; the station plots in Asia. Add a Canada bounding-box check (lat 41.6 to 83.2, lon -141.1 to -52.5) that drops the record and counts it, or flips a positive longitude; add it to `afdc-checks.ts` failure reasons. Then add the skip entry above (or fix the sign and check for an AFDC twin).
2. **`scripts/lib/ocm-merge.ts`, place and address layers:** do not remove an OCM station when it has an L3 port group and the matched AFDC station has no L3 (43 stations, 14 with no DC fast nearby: table A), nor when it has NACS and the AFDC match has none (19 Tesla Destination sites, 85068). Simplest: require the AFDC match to share a level+plug in the address layer too and add "OCM has L3 but AFDC has none" as an exception in the place layer.
3. **`scripts/lib/ocm-merge.ts`, `sameAddress` / `normText`:** street names made of short tokens or digits never count ("route 323", "Hwy 11", "7th Ave", "2nd Ave S" vs "2 Ave S"). Keep numeric or two to three-letter street tokens, normalize ordinals ("2nd", "7th", "3e", "1re" to the number) and compare them. This would have caught 15414, 160738 and 172750 with no skip entries. Optionally widen the name layer from 300 m to about 400 m when names share three or more words and a plug (171491, 234576, 145036).
4. **Owner decision, `levelOf` in `scripts/lib/ocm.ts`:** OCM `LevelID` 2 on a CCS1 or CHAdeMO port (111227, 111249, 110772, 111822 kept) puts DC plugs on the Level 2 layer and in Level 2 power bands, and 135295 puts a J1772 (AC) port at Level 3 through the 40 kW rule. Proposal: CCS1 and CHAdeMO are always Level 3; J1772 is never Level 3 (treat 40 kW or more on J1772 as unknown kW, Level 2). The rule text and this audit's rule 1 conflict on this point, so the owner should say which wins.
5. **Add the skip entries** above after approval (9 AFDC duplicates, 4 OCM-internal, 1 bad coordinate).
6. **Fair use (WATCH):** lower `MAX_PAGES` in `scripts/fetch-ocm.ts` from 10 to 4, or add a hard stop on total requests of 5, so rule 14 holds if OCM's Canada list grows.
7. **Optional:** fix the near-miss list (second-closest and name matches), and treat OCM level-less NACS with count 6 or more and no kW as a likely Supercharger.
