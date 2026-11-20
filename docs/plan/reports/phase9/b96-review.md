# B96: no unknowns on charging figures — owner review (2026-11-19)

**State:** all 491 cars have the 8 required figures (usable kWh, chemistry, voltage class, preconditioning, DC peak, AC kW, charge port, Supercharger access). `npm run validate` now fails the build on any gap. Everything is local (commits 90a2769, 1aa6963, 0d05a45); nothing pushed.

**Curves:** 144 stored curves (was 7). On screen, 92 cars default to a measured curve, 5 to a borrowed sibling curve, 389 to the template estimate, and 5 have none (Leafs with no DC fast-charge port). 70 cars have a measured or borrowed curve held back by the plausibility linter (mostly too few points); they show the template until you clear them.

**Wrong imported values removed:** `research/openev-unlinks.csv` lists every OpenEV/Chargeprice match switched off and every figure removed, with the reason.

## Decisions for you
1. **Fastned curves.** Most new curves come from Fastned's public pages (embedded chart data). Their terms have no reuse clause either way. Keep, or ask Fastned?
2. **EVChargingStations.com** is cited for the charge port on 7 cars (2026 Blazer, six 2026 Silverados); its terms forbid compiling a database. Replace the citation?
3. **bZ 2026/27 EPA ratings** look swapped in the crosswalk (57.7 kWh car shows 505 km, 74.7 kWh car 380 km); 2026 Limited FWD link also suspect. Swap?
4. **Model Y 2026 Standard (Canada)** still carries OpenEV 78/75 kWh LFP, 170 kW; sources say about 60–69 kWh. Which figures?
5. **Equinox/Blazer 85 kWh:** sources say 85 usable / 89 gross; older records say 85 gross. Which gross?
6. **Silverado Extended `800v`:** 670 V charge voltage, about 290 V nominal. What does voltage class mean?
7. **Niro 2026 DC peak:** 85 kW (estimated; Fastned curve peaks at 84) vs EV Database 94 kW. Show which?
8. **Curve source labels:** Fastned sources are typed `community` while their curves are `tested`.

## Weakest values (estimates worth a look)
- Leaf 62 kWh DC peak 100 kW (Nissan) vs about 46 kW measured; Leaf 24/30/40 kWh peaks from EV Database.
- No DC port recorded on Leaf 2011–12 SV and Canadian 2013–15 S; US S had optional CHAdeMO.
- IONIQ 5 63 kWh DC peak 180 kW; IONIQ 6 DC 233 kW; EV9 76.1 kWh 236 kW (InsideEVs only).
- bZ/Solterra 72.8 kWh usable 65.3 kWh (estimate); bZ 2023–25 AC 7 kW (sources say 6.6–7.6).
- ID.4 62 kWh chemistry NMC (no page states it); ID.4 2021–23 preconditioning `none` (European basis).
- EX30 Canadian Supercharger access (no Canadian source); EX40 AC 11 kW and preconditioning (Volvo pages blocked).
- All GM preconditioning (GM pages blocked); Ford preconditioning and 2021–24 Supercharger eligibility.
- Kia Light trims: battery heater unconfirmed; Niro gen 1 preconditioning `none`.
- Tesla curves measured on EU CCS2 chargers (understate the North American early peak); Model 3 Performance assumed to share the LR curve.

## Not yet done
- The three small fill batches (ID.4, Niro, Ariya 2026) and the researchers' revisions after FIX have not been re-run through the fact-checker; that re-check is part of the QA pass after your review.
- No curve found yet for: Leaf 62 kWh and 2026; Ariya 63 kWh; Kona 48 kWh; IONIQ 5 63/84 kWh and N; IONIQ 6 53 kWh and N; EV6 63/84 kWh; EV9 76.1 kWh; most Tesla generations after 2020; Ultium (Equinox, Blazer, Lyriq, Silverado); Mach-E after 2021; Lightning; bZ/Solterra 2024+.
