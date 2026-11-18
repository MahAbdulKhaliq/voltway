# Charger-map data audit, 2026-11-18, first real Open Charge Map pull (checklist 6.9)

Auditor: map-data-auditor (read-only). Seed for all random samples: **20261118** (mulberry32 shuffle). Helper scripts were in the session scratchpad, not the repo. No API was called, `.env` was not read. Inputs: `sources/ocm-ca/` (FETCHED.json: sha 57f79726..., 2,901 POIs, **4 requests**), `data/imported/ocm/{stations,skip}.json`, `data/imported/afdc/stations.json` (unchanged since the last audit, raw sha 9f32aa28...), `public/data/map/{l3,l2,meta}.json` (not rebuilt).

## Verdict: **WATCH**

No rule break against the written rules 1 to 14, and every fix from the first audit works on the real data. Independent recompute (my own code, not the importer's) of all 2,901 raw OCM POIs matches `data/imported/ocm/stations.json` and the map exactly (0 mismatches in ports, level, restricted, T, kept set). AFDC is unchanged and still clean (all 15,250 raw records recomputed, 0 mismatches). Checklist 6.9 ("PASS or only WATCH items") is met.

What is left are rule-design weaknesses and source oddities, none a code bug. The one I would ask the owner to look at before the first monthly auto-merge is **W1 below** (the place layer can still remove a real DC fast site that sits next to an AFDC station of a different network; 1 certain case, about 10 likely ones).

## Counts

### AFDC (unchanged: raw 15,250)
Dropped: private 692, planned 3, Level 1-only/no L2-L3 ports 8, no location 0. **Kept 14,547** (E 14,322, T 225, all 225 with an expected date). Map AFDC part 14,547 = imported. Unmapped connector types with ports: none. Level, bands, plugs identical to the previous audit (L3-only 2,591, L2-only 11,618, mixed 338; J1772 11,553, CCS1 2,621, CHAdeMO 1,824, NACS 1,072). Only diff in `afdc.ts`/`afdc-checks.ts` is type signatures (shared with OCM).

### OCM

| | n |
|---|---:|
| Raw POIs | 2,901 (provider 1: 2,873; 24: 20; 45: 8; provider 2: 0) |
| Dropped: not operational / planned (status 100, 150) | 95 |
| Dropped: private usage (2, 3, 6) | 274 |
| Dropped: no location (outside Canada box) | 1 (160778, lon +122.46) |
| Dropped: unpublished / wrong provider | 0 / 0 |
| Dropped: no L2/L3 ports | 23 |
| **Usable** | **2,508** |
| Removed as AFDC duplicates | 1,923 = skip 9, place 1,831, address 66, name 17 |
| **On the map** | **585** (l3 134, l2 451; meta total 15,132 = 14,547 + 585) |
| Near misses (kept, AFDC station within 500 m) | 314 (summary.md; I reproduced it) |

Ignored connection types (counted, not guessed): id 0 x6, id 11 x2. Status 30 (temporarily unavailable) kept as T: 2 (112038, 249957), no expected date (OCM gives none). Sanity check passed: missing coordinates/level/plugs 24 of 2,532 (0.95 %, limit 2 %); no previous-month drop to compare.

Kept by level: L3-only 109, L2-only 451, mixed 25 (all mixed are in l3). Kept by plug (sites having it): J1772 360, NACS 162, CCS1 125, CHAdeMO 74. L2 bands: unknown 44, <=3.6 12, <=7.2 217, <=11.5 65, >11.5 154. L3 bands: <=50 71, <=100 31, <=250 55, >250 2, unknown 0. By provider: 576 / 3 (AddEnergie) / 6 (Greems). Restricted flag 318 of 585 (54 %; usage 4 "membership required").

## Check 1: do the fixes work on the real data?

| Fix | Result |
|---|---|
| Canada bounding box | ✅ 160778 dropped as no_location; no map feature outside the box; no id 100160778. |
| Plug decides level | ✅ CCS1/CHAdeMO with OCM LevelID 2 are now Level 3 (93 raw ports checked, e.g. 111227 now L3, then removed as a duplicate of AFDC 84130). J1772 >= 40 kW stays L2: 144081 (72 kW) and 135295 (50 kW) are L2 J1772, not L3. NACS with no level and no kW stays L2 (129825, 161624). |
| Finding A (DC fast lost) | ✅ All 14 listed stations are kept except 73616 (removed by name layer against 405547, which has the same CCS+CHAdeMO: correct) and 144081 (J1772 only, correct). 75504, 143983, 157423, 250081, 231454, 461019, 112126, 189575, 193049, 295998 are all kept with their DC ports. |
| Finding B (Tesla Destination NACS lost) | ✅ 79616, 79758, 79811, 79981, 81960, 82285, 94968, 99413, 105509, 109300, 114656, 118067, 146037, 78714 are kept. Still removed: 79577 (place, AFDC 383907 has the NACS x5: correct), **109015** (name layer, see W2) and **85068** (address layer, see W2). |
| Address fix (numbered streets) | ✅ 111227 (place), 15414, 160738, 172750 (address layer) all removed against the AFDC twin; no skip entry needed. All 66 address-layer removals read by hand: 60 same business and address; the rest are in W2. Distances run to 840 m but always same address text (geocode drift). |
| Address layer needs shared plug | ✅ (code and result: 66 removals, down from 106). |
| addsSomething | ✅ 14 stations kept only because of it (table below). |
| skip.json (9) | ✅ 9 removed by the skip layer. |
| MAX_PAGES 4 | ✅ code and test (`tests/ocm.test.ts`, 25 pass). Stale comment on line 11 of `scripts/fetch-ocm.ts` still says "stops after 10 pages". |

## Check 2: new duplicates from the new rules

### Stations kept only because of addsSomething (14, all read)

| OCM id | OCM | AFDC counterpart | m | Why kept | Judgement |
|---|---|---|---:|---|---|
| 15336 | Clarion Lakeside Inn (Sun Country, J1772 + NACS x4) | 331092 OpConnect J1772 | 20 | NACS | ⚠ 8 m from OCM 146072 (same hotel, NACS x2): OCM-internal duplicate (skip 15336) |
| 68407 | Okotoks Alberta (J1772 + NACS) | 327585 J1772, same address | 36 | NACS | ⚠ 47 m from OCM 79981 (NACS): OCM-internal duplicate (skip 68407) |
| 79283 | Avenue Electrique Trois-Rivieres (FLO, DC x6 + L2 + NACS 11.5) | 129850 same address, **identical DC ports**; 150514 Tesla Destination NACS 22 m; 304869 BRCC DC 23 m | 11 | NACS | ❌ duplicate: the AFDC cluster covers everything (see W3) |
| 125668 | Anarchist Mountain Rest Area (CCS+CHAdeMO 25 kW, J1772) | 390854 FLO J1772 | 82 | DC | ✅ DC not in AFDC |
| 143983 | Glooscap Ventures (DC 50 + J1772) | 129612 J1772, same address | 190 | DC | ✅ |
| 157423 | Kidd Creek Rest Area (CCS 50 x2) | 154190 J1772 | 57 | DC | ⚠ 31 m from OCM 250081, same DC site (skip 157423) |
| 250081 | Kidd Creek Rest Area (FLO, CCS 50 x1) | 154190 J1772 | 78 | DC | ✅ keep this one |
| 189575 | Volkswagen Lethbridge (CCS 24 kW) | 372276 J1772 | 17 | DC | ✅ |
| 193049 | Boston Pizza Neepawa (CCS 200 x2 + J1772) | 253794 J1772, same address | 9 | DC | ✅ (its J1772 duplicates AFDC's, see W3) |
| 265209 | Grande Prairie Volkswagen | 235980 Hyundai | 145 | DC | ✅ different dealers |
| 295998 | SWTCH Scotia Plaza (DC 50 x2 + L2 x15) | 436643 J1772 | 57 | DC | ✅ (L2 overlaps AFDC) |
| 296000 | SWTCH Atrium (CCS 60 x4 + L2 x14) | 345760 J1772 x18, same building | 53 | DC | ✅ DC is new; L2 overlaps |
| 475474 | Jule Watershed Rest Area (CCS 200 x2, NACS 200 x2, J1772) | 464788 Non-Networked CCS 200 x3 + J1772, 50 m | 50 | NACS | ⚠ probably the same Jule site; kept for NACS only. Owner call, not on the skip list below |
| 499673 | Avenue Lepage Dorval (ChargePoint CCS 198 x2 + NACS x2) | 4 x RECHARGECO DORVAL 01-04, CCS 200, 67-130 m | 67 | NACS | ⚠ likely same Rechargeco site (dual-cable units) |

### Near-miss list (314), read in full by script and by hand
Screened all 314 (same address, shared level+plug, shared name word, same network, distance). 271 had at least one signal and I read the ones with two or more. Result:
- **Complementary hardware, keep** (about 60): FLO / Sun Country L2 J1772 next to an AFDC BRCC DC fast site (St-Hubert, Namur, Val d'Or...), Tesla Destination NACS next to an AFDC J1772 at the same hotel, Park+Charge / Ivy DC next to a Tesla Supercharger. Different plugs at the same address: correct under the approved rule.
- **Likely duplicates: 5 stations** (skip list below: 21207, 79903, 79283, 504145, 499673) plus 3 OCM-internal pairs (157423, 15336, 68407).
- **Still unresolved from the first audit, unchanged:** 15790 (788 Rue Commerciale Nord, Cabano), 94990 (St-David Ouest), 110778 (Leavens VW). Review, not recommended.
- Same level+plug within 150 m but kept because the address differs and nothing else matches (e.g. 77597 Tsawwassen Mills 52 Street, 462 m): leave.
- OCM-vs-OCM pairs within 60 m: 7 (3 are duplicates above; 112190/190086 Canadian Tire Edmonton, 146062/191383 Upsala and 15353/100847 Delta PEI are different hardware; 90215/116213 are two Tesla Destination records 48 m apart under different names, leave).

### Wrongly removed (rule 12): every address (66) and name (17) removal read, plus all 71 place removals where network, address and name all differ

| | n |
|---|---:|
| Same site, correct removal | the great majority (about 1,800 of 1,923, including all 9 skip entries) |
| ❌ Confirmed lost real site | **1**: 504143 Jule Port Union Carpool Lot (CCS 200 x2 + NACS 200 x2) removed at 116 m against AFDC 256130 Tesla Supercharger (NACS only). Matched on the shared NACS L3 group, but the AFDC station has no CCS. |
| ⚠ Likely different sites, removed | 85068 Rocky View (Tesla, 8 stalls, address layer vs SURECHARGE 455765, no Tesla Supercharger in AFDC within 3 km), 148153 Petro-Canada Saint-Nicolas (CCS 350 x2) vs Marche Express 1220 Chemin Olivier (93 m), 289433 Chevron On The Run McCallum Rd (CCS 200 x6) vs 7Charge Abbotsford (99 m), 299714 Western Chevrolet vs Badlands Chrysler Drumheller (121 m), 459389 Irving New Minas (CCS 180 x3) vs Hyundai dealer 5482 Prospect Rd (33 m), 109015 Homewood Suites Ajax (NACS x8) vs Hilton Garden Inn Ajax 190 m (a different hotel; AFDC even lists a Homewood Suites OpConnect station), 192664 Bridgewater VW vs Chevy Buick, 111783 Saguenay CCS 24 kW vs Mercedes dealer SmartDC, 512246 Victoria 1300 Yates (FLO CCS 100 x4) vs Shell 1321 Yates, 73759 and 104969 (name layer, flagged in the first audit), 117827 Donnacona Rotisserie (unclear) |
| ⚠ L2-only different-network place matches | about 50 of the 71: J1772 L2 at a neighbouring business within 150 m (Sun Country 17.3 kW sites, FLO next to ChargePoint). Low impact (L2, one or two ports each) |
| 119 removed stations lose a level+plug group their AFDC match lacks | 87 are L2 J1772 only; **27 lose CHAdeMO** (AFDC match has CCS but no CHAdeMO, e.g. 288494 Shell C04590 London: real duplicate, only plug detail lost); 3 NACS (all Level 2 vs AFDC Level 3 NACS: not a real loss). No removed station loses a CCS or Level 3 group except 504143 |

## Check 3: rules 1 to 14 on the real data

| # | Rule | Result |
|---|---|---|
| 1 | Level from source classification | ✅ AFDC from `charging_level` only (69 DC under 25 kW are L3). OCM: plug decides, per the approved amendment; see W4 for DC under 25 kW. |
| 2 | Bands, upper edge, unknown, any-port | ✅ AFDC edges unchanged. OCM edges present: 7.2 (24057), 11.5 (15337, 15342), 50 (9845, 23320), 100 (132524), 250 (135475, 504145) land in the lower band. No 3.6 kW OCM edge kept (AFDC 256295 covers it). |
| 3 | Plugs | ✅ AFDC: no unmapped type with ports. OCM: 1/32/2/27/30 map right; 0 and 11 ignored and counted. |
| 4 | Dropped / kept statuses | ✅ AFDC T 225/225 with date. WATCH: those dates are mostly in the past (today 2026-11-18; 220 of 225 per the last audit). OCM T 2, no date. |
| 5 | Access flags | ✅ `rs`, `ad`, `h` on map equal imported for all 14,547 AFDC and 585 OCM stations. |
| 6 | Tesla flags | ✅ AFDC unchanged. OCM: "Tesla" for 4 stations, each with L3 NACS (24639, 79492, 114575, 135475); "Tesla Destination" for 126 (no L3). |
| 7 | Ports | ✅ 0 mismatches: 14,547 AFDC and 2,508 OCM against my own recompute from raw. |
| 8 | Sourcing / keys | ✅ every map feature has `src` (src-afdc-ca / src-ocm); grep for `api_key=` / `key=` finds only `.env.example` (blank names), docs and agent text; no uuid-style key anywhere outside raw data and the vehicle JSON; `.env`, `poi-raw.json` are git-ignored; FETCHED.json holds no key. |
| 9 | OCM filters | ✅ recomputed: providers only 1/24/45 (provider 2 = 0 in the pull), submission 100/200 only (all 2,901 are), drops 95 / 274 / 1 / 23; membership/notice flagged restricted (318 kept), pay at location not. |
| 10 | OCM plugs and level | ✅ matches the amended text (the brief's wording of the rule is superseded by the owner's 2026-11-18 amendment). |
| 11 | Ids | ✅ 585 OCM ids all >= 100,000,000; no AFDC id >= 1e8; 15,132 map ids unique. |
| 12 | Duplicates | ✅ code follows the written layers and the addsSomething rule; see W1-W3 for what the rule design lets through. |
| 13 | Credit | ✅ all 585 features have `src: src-ocm` and `op` (576/3/6); `data/sources/src-ocm.json` has licence and attribution; `StationPanel.tsx` shows provider, licence link and an OCM link (`map.station.sourceOcm`, `ocmLink`); `about.astro` lists src-ocm with its licence URL. |
| 14 | Fair use | ✅ FETCHED.json `requests: 4` (3 pages + reference data), limit 5. `fetch-ocm.ts`: PAUSE_MS 3000 before every request after the first (including reference data), MAX_PAGES 4, one attempt per page (no retry), key in `X-API-Key` header, user agent `Voltway-charger-refresh/1.0 (+repo URL)` (DESIGN-6 line 22 omits the "/1.0"; trivial). Worst case is exactly 5 requests. Note: 3,000+ Canadian records would use all 4 pages and stop with an error, by design. |

## Sample tables

### OCM: 40 random kept stations (seed 20261118), all ✅ (raw connections -> imported -> map: ports, level file, `rs`, `t`, `src`, `op`)
79350 146066 192915 231454 167793 74025 203959 15430 291223 81781 87604 148146 188931 304330 461293 73331 83991 146037 81341 288400 74043 114656 265209 81768 460966 73769 74070 134007 73389 263831 475474 73800 78627 73832 129825 500900 81787 192901 145492 148144.
(Verified for all 2,508 usable, not only these 40.)

### AFDC: all 15,250 recomputed; edge ids from the previous audit still hold (data unchanged)
Edges: 256295 (3.6), 82994 (7.2, restricted), 255484 (11.5), 83432 and 85200 (50 / 100), 153407 (250), 82833 (no kW), 84376 (mixed no kW), 83443 (DC 25 + L2, limited hours), 153838 and 201260 (DC under 25 kW), 82965 (T with date), 83915 / 84772 (Supercharger / Destination). All ✅. Source oddities: 450132 (L2 J1772 159.9 kW), 466742 (CCS 640 kW x6).

### Edge cases (OCM, this pull)

| Id | Rule | Raw | Ours | Result |
|---|---|---|---|---|
| 160778 | bbox | lon +122.4591 | dropped no_location | ✅ |
| 111227 | 1 / 10 | CCS+CHAdeMO 35 kW, LevelID 2 | L3, then place-layer duplicate of AFDC 84130 | ✅ |
| 110772, 111822, 148649 | 10 | CCS 24 kW, LevelID 2 | L3 (DC under 25 kW) | ✅ per amended rule |
| 135295 | 10 | J1772 50 kW, LevelID 2 | L2 J1772 50 kW, band >11.5 | ⚠ AC at 50 kW is a source typo (likely 5 kW) |
| 480802 | 10 | CCS 6 kW x2, LevelID 2 | L3 CCS 6 kW, band <=50 | ⚠ almost certainly an AC J1772 mislabelled CCS |
| 129825 | 10 | NACS x8, no level, no kW | L2 NACS x8 (plus DC and J1772) | ⚠ stalls of the adjacent Tesla Supercharger 153435 (18 m), carry-over |
| 249957 / 112038 | 4 | status 30 | `t:1`, no `ed` | ✅ |
| 79283 / 85068 | 12 | see above | | ❌ / ⚠ |
| 24639, 79492, 114575, 135475 | 6 | operator Tesla, L3 NACS | network Tesla | ✅ |
| 23448 / 128545 | 13 | provider 24 | `op:24` | ✅ |

## Oddities (WATCH, source data)

- **Province wrong in OCM free text:** 8 imported stations have a province that contradicts their coordinates (97775 Salt Spring Island as NS, 148142 Medicine Hat as BC are kept on the map; 13694, 15338, 15365, 145762, 300676, 300678 are removed). 7 kept stations have no province (77596-77599, 77601 Tsawwassen/Fisherman Way, 134894, 312384 whose postal field is "QC  G1V 2L9"). `provinceOf` could prefer the postal code or a coordinate box when the two disagree.
- **Age:** 334 of 585 kept OCM stations (57 %) were last updated before 2020 (2013: 53, 2016-2017: 208). Likely stale statuses.
- **Unknown power:** 44 of 585 have a port with no kW (ChargePoint 18 of 62, no network 12 of 76, Sun Country 5 of 71). `PowerKW` in OCM is often an estimate by plug type.
- **Restricted share:** 54 % of OCM stations carry the restricted warning, versus 2.8 % of AFDC.
- **Coordinates:** none outside Canada, none 0,0, no duplicate coordinates among kept OCM stations. No blank names, no port counts of 0, no kW of 400 or more.
- **Text encoding:** OCM 73698 and 74011 names are mojibake in the source ("FLO â ...", "HÃ´tel ALT"); the AFDC record 466362 "MarchÃ© Express" too.
- **Stale local file:** `sources/afdc-ca/summary.md` still says "Sanity checks: FAILED, 14547 -> 12297" from a test run; it does not describe the current AFDC data. Git-ignored but confusing.
- **Near-miss list** still names only the closest AFDC station (carry-over); for 79283, 499673, 21207 and 504145 the real counterpart is the second or third closest.

## Watch items and suggested changes (owner decides)

- **W1 (place layer, most important).** "AFDC within 150 m sharing a plug at the same level" lets a Tesla Supercharger (NACS only) swallow a Jule CCS 200 kW site next to it (504143), and lets a ChargePoint dealer station swallow a Petro-Canada or On The Run site (148153, 289433, 299714, 459389). `addsSomething` only protects "Level 3 absent" and "NACS absent". Two small additions would fix every case in the table above: (a) treat CCS1/CHAdeMO as a DC family: keep the OCM station if it has an L3 CCS1/CHAdeMO port and the AFDC match has none (restores 504143 only); and (b) for Level 3 OCM stations, require same network, or same address, or name similarity, or distance <= 40 m for the place layer (restores about 8 more likely-distinct DC sites, and would also put back a few real duplicates, which the near-miss list then catches). Until then these 12 or so sites show only the AFDC neighbour.
- **W2 (address/name layers).** 85068 (8 Tesla stalls, AFDC has no Supercharger in 3 km) and 109015 (Homewood Suites vs Hilton Garden Inn Ajax) are removed because the AFDC "twin" shares NACS L3 or a brand word. Name layer: "hilton" + "ajax" counts as two shared words.
- **W3 (duplicated ports inside kept stations).** When addsSomething keeps a station, its other ports still repeat the AFDC site (e.g. 193049 J1772 x3 next to AFDC J1772 x2; 79283 repeats every DC port). Option: drop the ports that the AFDC neighbour already lists, or add a "same network and address" exception.
- **W4 (DC under 25 kW from OCM).** 9 CCS ports of 22-24 kW (all "LevelID 2" CCS) and 480802 (6 kW) sit in Level 3 under the amended rule. Probably AC chargers mislabelled in the source; owner already chose "plug decides".
- **W5 (CHAdeMO detail).** 27 removed OCM sites list CHAdeMO that the AFDC match lacks; a CHAdeMO-filter user will not see them. Plug detail only.

## Required fixes

None that break rules 1 to 14. Housekeeping: update the stale comment "stops after 10 pages" in `scripts/fetch-ocm.ts` line 11; make `DESIGN-6.md` line 22 user agent match the code (`Voltway-charger-refresh/1.0 (+...)`).

## skip.json suggestions, ready to paste (owner to approve)

Likely duplicates of AFDC stations:

```json
{ "ocm_id": 21207, "reason": "Duplicate of AFDC 122364 Park'N Fly Vancouver Valet Airport Parking - Tesla Destination (same address, 8 m; OCM lists the 4 Tesla chargers as J1772, AFDC as NACS)" },
{ "ocm_id": 79903, "reason": "Likely duplicate of AFDC 150507 Hotel Must - Tesla Destination (same address, 17 m, both Tesla Destination network)" },
{ "ocm_id": 79283, "reason": "Duplicate of AFDC 129850 Station Roulez Electrique (same address, identical FLO DC ports; its NACS is AFDC 150514 Tesla Destination, 22 m)" },
{ "ocm_id": 504145, "reason": "Likely duplicate of AFDC 463326 M'Chigeeng Business Development Center EV Chargers (FLO Ultra CCS 250 kW x2, Hwy 551, 460 m apart, one site)" },
{ "ocm_id": 499673, "reason": "Likely duplicate of AFDC 459047-459048 and 460031-460032 RECHARGECO DORVAL 01-04 (same ChargePoint site, CCS ~200 kW, 67-130 m)" }
```

OCM records that duplicate another OCM record:

```json
{ "ocm_id": 157423, "reason": "Duplicate of OCM 250081 Kidd Creek Rest Area, 6725 BC-3 (31 m apart, same FLO DC site)" },
{ "ocm_id": 15336, "reason": "Duplicate of OCM 146072 Clarion Lakeside Inn Kenora (8 m apart, same NACS chargers; its J1772 is AFDC 331092)" },
{ "ocm_id": 68407, "reason": "Duplicate of OCM 79981 Okotoks Municipal Centre (47 m apart, same NACS; its J1772 is AFDC 327585)" }
```

Review first, not recommended yet: 475474 (Jule Watershed, NACS only differs from AFDC 464788), 15790, 94990, 110778. Do **not** put 504143, 148153, 289433, 299714, 459389, 85068, 109015 on the skip list: they are wrongly removed, not missed, and only a rule change (W1/W2) brings them back.
