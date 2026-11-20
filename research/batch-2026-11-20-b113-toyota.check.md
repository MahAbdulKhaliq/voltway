# Check: batch-2026-11-20-b113-toyota.json (heat pumps, 43 trims)

**Verdict: FIX.** `--check` passes (1367 variants, 1805 sources). 22 of the 43 entries can stay; 21 should be dropped or re-sourced (Lexus ES x8, RZ 2026 x6, Trailseeker x5, C-HR 2027, C-HR 2026 AWD US half). Not a REJECT because the direct ArenaEV entries hold.

Pages read. I did not hit a 403 or bot wall on any page. ArenaEV, Guide Auto, Toyota pressroom, Subaru media, CarsGuide and Lexus pressroom all loaded. The Lexus.ca spec PDF is image-only and unreadable, so heat pump there is unverifiable. The Subaru trim-comparison PDF is also unreadable.

## Source checks

| Source | Quote / finding | Result |
|---|---|---|
| ArenaEV RZ 450e 2023- | "Heat pump: Yes"; header "2023 -"; 71.4 kWh total. No market named (EU and US figures mixed, EUR/USD/GBP prices). Batch note "page mixes EU and US" is right. | ✅ |
| ArenaEV RZ 300e 2024- (arenaev.com/lexus_rz_450e_2022-122.php) | "Heat pump: Yes"; title "Lexus RZ 300e (2024 -)"; 72.8 kWh total. Market not stated (USD, EPA range, EU towing). The URL slug is "rz_450e_2022", but the page is the 300e. | ✅ (odd slug) |
| ArenaEV Solterra 2023-2025 | "Heat pump: Yes"; 2023 - 2025; **71.4 kWh total**; EU trunk figure, EUR prices, no market. Repo has 72.8 kWh gross for the 2024/25 US and CA cars, so this page's pack is the 2023 pack. | ⚠ page is 2023 pack and mixed EU/US |
| ArenaEV Solterra 2025 (-831) | "Heat pump: Yes"; "2025 -"; 74.7 kWh; "Coming soon. Expected release 2025"; no region. Batch calls it "the 74.7 kWh pack shared with Trailseeker/Uncharted" (true). | ✅ for what it says. It does not name the Trailseeker. |
| ArenaEV Uncharted Premium FWD | "Heat pump: Yes"; "For North America"; 2025 -; release "2026, Q1". | ✅ |
| ArenaEV Uncharted Sport | "Heat pump: Yes"; "For North America". | ✅ |
| ArenaEV Uncharted GT (m.arenaev) | "Heat pump: Yes"; "For North America". | ✅ |
| Subaru 2027 Uncharted press kit | "continues with its lineup of Premium FWD, Sport, and GT trim levels", no price increase. No heat pump, nothing on equipment. | ✅ as quoted. Says lineup and price only, not hardware. |
| Guide Auto C-HR | "the C-HR incorporates a heat pump and battery preconditioning system for faster charging in cold weather." Sits in the charging paragraph that opens "All C-HR models feature a standard NACS connector". Canadian article, trims SE, XSE, XSE Premium, 77 kWh across all. | ✅ for Canada 2026 (names no trim). Not stated for the US. |
| Toyota USA 2027 C-HR | "The 2027 model remains unchanged from the previous model year." Mentions manual or nav-triggered preconditioning. No heat pump. | ✅ quote; useless as evidence of a heat pump. |
| CarsGuide ES 350e (Australia) | "the highly effective heat-pump-aided climate control system feels lush"; 74.7 kWh; Australian dollars, ANCAP. Nothing on North America. | ✅ quote; wrong market |

## Per-entry table

| Variant(s) | Field | Value | Result | Evidence |
|---|---|---|---|---|
| lexus/rz/2023/rz-450e-luxury-awd, -signature-awd | heat_pump | standard (community) | ✅ | ArenaEV "Yes", 71.4 kWh matches repo (71.4 gross). Market not stated; low_confidence is right. |
| lexus/rz/2024/rz-300e-luxury, -premium | heat_pump | standard (community) | ✅ | ArenaEV "2024 -", 72.8 kWh matches repo. |
| lexus/rz/2024/rz-450e-luxury-awd, -signature-awd | heat_pump | standard (estimated) | ✅ (low confidence) | The 2023 page is open-ended ("2023 -") and the repo pack is unchanged at 71.4 kWh. Basis is acceptable. |
| lexus/rz/2025/rz-300e-luxury, -premium; rz-450e-luxury-awd, -signature-awd | heat_pump | standard (estimated) | ✅ (low confidence) | Same packs as 2024 in repo (72.8 and 71.4), same open-ended pages. Acceptable. Note the batch says "no change reported", which is silence, not a statement. Fine at low confidence. |
| lexus/rz/2026/* (6 trims: 350e premium, 350e signature-fwd, 450e luxury, premium, signature, 550e F Sport) | heat_pump | standard (estimated) | ❌ basis fails | The 2026 RZ is a new generation of hardware: new battery (repo 74.7 kWh; 550e 76.96), new eAxle, 11 kW onboard charger (Lexus 2026 RZ release). That is a change in pack, motors and charger, so a carry from a 71.4/72.8 kWh car is not allowed. No page for 2026 states a heat pump. Lexus pressroom "Five Things" for 2026 RZ is silent. The batch note also says "77 kWh pack", but the repo has 74.7 (550e: 76.96). |
| lexus/es/2026/* (4) and lexus/es/2027/* (4) | heat_pump | standard (estimated) | ❌ | The only source is the CarsGuide AU review of the ES 350e. Nothing North American found: the Lexus US pressroom ES launch release mentions only a "knee-level radiant heater ... standard on ES 350e and ES 500e Luxury" and no heat pump. The estimate basis fails three ways: (1) it is a different market, which rules reject for estimates; (2) the 500e is dual motor, so it is not a sibling with the same motors; (3) 2027 is carried with no source on 2027 at all. Also, a review's praise of "heat-pump-aided climate control" is a single phrase on one Australian car. Drop all 8. If an unknown is not acceptable, find a Lexus US/CA spec or order guide; the Lexus.com site is walled and was not tried. |
| subaru/solterra/2024/limited, premium; solterra-awd (CA) | heat_pump | standard (community) | ⚠ accept, low confidence | Page says "Yes" for "2023 - 2025", but shows the 71.4 kWh pack (repo has 72.8 for 2024) and mixed EU data. Heat pump likely identical, but the page does not say US or CA. Acceptable as community/low confidence; add a note that the page's pack is the 2023 one. |
| subaru/solterra/2025/limited, premium | heat_pump | standard (community) | ⚠ same as above | Same page, same caveats. |
| subaru/trailseeker/2026/awd (CA), limited-awd, premium-awd (US); 2027/limited-awd, premium-awd | heat_pump | standard (estimated) | ❌ | No Trailseeker page says it. The Subaru Trailseeker press kit mentions only "onboard battery-preconditioning system", no heat pump. The only basis is "same 74.7 kWh pack". That is a pack match only, and the batch itself says it does not prove climate hardware. It fails rule 5 (platform sibling needs the same pack, motors and charger; the Trailseeker is longer with dual motors, and Solterra 2026 is 74.7 or 77 kWh by market). The cited Solterra page says nothing on the Trailseeker, and the repo's Solterra 2026/27 heat pump entries are themselves estimated or CarGurus-based. Drop all 5 until a Trailseeker source exists. |
| subaru/uncharted/2026/gt-awd (US) | heat_pump | standard (community) | ✅ | ArenaEV GT "Yes", "For North America". |
| subaru/uncharted/2026/sport-awd (CA/US) | heat_pump | standard (community) | ✅ | ArenaEV Sport "Yes", "For North America". The note "matched ... for the Canadian trim name" is odd: Sport is the same name in both markets. Fix the note. |
| subaru/uncharted/2026/long-range-fwd (CA) | heat_pump | standard (community) | 🏷 | ArenaEV lists "Premium FWD". The Canadian "Long Range FWD" is mapped to it by the batch's own inference (74.7 kWh, FWD in repo). Relabel `estimated` with the mapping basis, or find a Canadian source. |
| subaru/uncharted/2027/gt-awd, premium-fwd, sport-awd (US) | heat_pump | standard (estimated) | ✅ (low confidence) | ArenaEV "Yes" (NA) plus the Subaru press kit "same lineup ... no price increase". The press kit covers lineup and price only; it is not a statement that equipment is unchanged. Acceptable at low confidence; reword the notes so they do not say "unchanged". |
| toyota/c-hr/2026/standard (CA, FWD) | heat_pump | standard (community) | ✅ (low confidence) | Guide Auto Canada: "the C-HR incorporates a heat pump". It names no trim, but is a general statement on the C-HR. |
| toyota/c-hr/2026/awd, trim 18-in-wheels (CA/US) | heat_pump | standard (community) | ⚠ US half unsupported | The trim covers CA and US. The batch notes "Toyota US release is silent". Reviews found by search go further than silence. GearJunkie: Toyota does not mention a heat pump. Jalopnik: no mention of a heat pump like in the bZ (both US launch coverage; read via search snippets only, not opened). Guide Auto is the only source and is Canadian. The US carry is not safe. Either restrict it to a CA note with low_confidence, or find a US source. |
| toyota/c-hr/2027/se (US) | heat_pump | standard (estimated) | ❌ | Chain is Canadian 2026 review plus US 2027 "unchanged". The US 2026 car has no heat pump statement, and US coverage reads the other way. Repo shows the 2027 SE as 74.7 kWh vs 77 kWh for the 2026 car, so "unchanged" is also contradicted by the repo's own pack figure (check the repo data; if it is wrong that is a separate fix). Drop. |

## Other checks
- **Kinds.** ArenaEV and Guide Auto entries are `community`. This is the batch's choice and is acceptable, since ArenaEV does not name a manufacturer source. No `manufacturer` mislabels in the batch.
- **Source types.** The two OEM press pages are `oem` and the rest `community`. `accessed_on` is present everywhere.
- **Market claim.** The batch notes say ArenaEV pages say North America. Only the three Uncharted pages do. The RZ and Solterra pages name no market (EU and US data mixed).
- **Fit with existing data.** The repo's heat_pump fields are all empty for these trims. The repo's Solterra 2026/27 rows already say standard (CarGurus CA, InsideEVs), which is not contradicted.
- **No unknowns (check 14).** After the fixes below, these trims stay empty and need another round: ES x8, RZ 2026 x6, Trailseeker x5, C-HR 2027, and the US half of C-HR 2026 AWD.

## Required changes
1. Drop the heat_pump entries for all 8 `lexus/es/2026` and `lexus/es/2027` variants: the only source is an Australian review of the 350e, and the carry to the 500e, to North America and to 2027 is not an allowed estimate basis (different market, different motors; no source for 2027). Lexus US pressroom lists only a radiant heater.
2. Drop the 6 `lexus/rz/2026/*` entries: 2026 has a new battery, eAxle and 11 kW charger, so the 2023-24 ArenaEV pages cannot be carried. Also fix the "77 kWh" statement; repo is 74.7 (550e 76.96).
3. Drop the 5 Trailseeker entries (2026 awd, limited-awd, premium-awd; 2027 limited-awd, premium-awd). A pack match is not a basis, and no source names the Trailseeker.
4. Drop `toyota/c-hr/2027/se`. For `toyota/c-hr/2026/awd`, restrict to CA in the notes or drop it, since US coverage found by search (GearJunkie, Jalopnik) says Toyota does not mention a heat pump. Keep `toyota/c-hr/2026/standard` (CA) at low confidence.
5. `subaru/uncharted/2026/long-range-fwd`: change kind to `estimated` and say the basis is the mapping of Canadian Long Range FWD to the ArenaEV Premium FWD page (same 74.7 kWh pack, FWD). Fix the "Canadian trim name" wording on `sport-awd`, since Sport is named the same in both markets.
6. Solterra 2024/2025 notes: add that the ArenaEV page shows the 71.4 kWh pack and mixed EU data; keep `low_confidence`.
7. Uncharted 2027 notes: replace "unchanged" with what the press kit says (same lineup and price; equipment not stated).

## Applied by the main session (2026-11-20)
- Dropped: Lexus ES 2026–27 (8), RZ 2026 (6), Trailseeker 2026–27 (5), C-HR 2027 SE.
- C-HR 2026 AWD (CA+US): kept, low_confidence, note says the source is Canadian and US is unconfirmed (owner lead: the C-HR has a heat pump).
- Uncharted CA long-range-fwd: `estimated` (mapped to Premium FWD). Sport note wording fixed. 2027 notes say what the press kit says.
- Solterra 2024–25 notes: ArenaEV page shows 71.4 kWh and mixed EU/US data.
- All values low_confidence. `--check` passes.
