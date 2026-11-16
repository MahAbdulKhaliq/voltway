# Data debt

Checklist 1.6 was closed for Phase 1a on 2026-11-16 (owner decision **B23**): the current data is good enough to ship. Missing fields already show as "Unknown" on the site, so nothing here blocks the map. This file lists data to improve later (code and product items are in the other files in this folder; see README.md), roughly in order of value. Run the `fill-data-gaps` skill for research items. Crosswalk items need an owner decision first (B8/B9).

State at closing (`npm run gaps`, 2026-11-15): 6/84 variants complete. Missing: preconditioning 69, wheel sizes 32, Supercharger access 30, chemistry 30, heat pump 22 (+23 where OpenEV says standard-or-optional only), usable battery 21, AC 8, port 7, DC 5, voltage 5, drivetrain 4. Template curve only: 69. No published 10–80 %: 57.

## 1. Owner decisions (crosswalk / stale matches)
These came up during research. Each needs a match changed in `crosswalk/crosswalk.csv`, the way B22 handled the EV6.
- **Solterra 2026**: the Chargeprice match brings values from the old car (usable 64 kWh, AC 6.6 kW, `chargeprice-2022` curve peaking at 150 kW against the old car's ~100 kW). Subaru Canada states 11 kW AC for 2026. Likely fix: unmatch.
- **Blazer EV 2026 LT/RS AWD**: matched to an OpenEV record with the SS's pack (102/97 kWh, 195 kW). LT/RS use the 85 kWh pack at 150 kW (dealer pages, window sticker, EVChargingStations). thinkEV's 190 kW on `standard` is also the SS figure.
- **LYRIQ 2026 port**: OpenEV says `nacs` for all three variants. Press says 2026 is CCS1 + adapter and native NACS starts in 2027. The site shows "sources differ".
- **Model Y Standard (rwd-b, standard-b)**: stored 78/75 kWh LFP at 170 kW (OpenEV). The evidence points to ~64 kWh gross / ~60 usable at 175 kW (EV Database, Electric Autonomy, Electrek, Tesla Canada table). The two variants may be duplicates (both 463 km). Model 3 Premium RWD may have the same issue. Their derived 10–80 % times rest on these inputs.

## 2. Charging curves (biggest visible gain)
- **Cars with no curve at all:** the 2026 IONIQ 5 Long Range variants, the EV9 Light and the bZ Standard have no DC peak, so not even an estimated curve can be made (QA 9.1 #3). Finding their DC peaks fixes it.
69 variants use the template curve. Rule from round 2: a curve tested on another model year, or borrowed from a sibling, needs a **shown pack match** (cells, supplier, kWh), not just matching database figures. A tested curve may hold only points quoted in the source.
- **Silverado EV Max Range**: State Of Charge 2024 RST test (EVChargingStations, `.../2024-chevrolet-silverado-ev-rst-dc-fast-charging-analysis-10-80/`). Usable if a source ties the 2024 RST pack to the 2026 WT Max.
- **LYRIQ**: State Of Charge 2024 AWD test. Needs a 2024→2026 pack carry-over source; drop the unquoted points (10 %, 40 %, 53 %).
- **Equinox EV**: EVChargingStations 2024 test, single runs only (the 0–100 run derates early).
- **bZ / C-HR**: a source tying the C-HR pack to the bZ 74.7 kWh pack would let the C-HR curve be borrowed.
- **Model Y**: a Berlin Model Y test (LG 5M cells); the Model 3 curve is a different pack.
- **IONIQ 5/6, EV6, IONIQ 5 N, EV9 Light**: no measured curve found yet (evkx tables are model-generated; don't use).
- Untouched groups: Ford, VW/BMW, Nissan, Volvo/Polestar had only quick lookups, no thorough curve research.

## 3. Preconditioning (69 missing)
Needs a model-specific 2026 owner's manual page (search excerpts and generic pages were rejected).
- Tesla: owner's-manual mirrors (tesla.com is 403 to WebFetch).
- GM: "Fast Charge Prep" + Google built-in navigation. chevrolet.com quick-start guides are blocked; try AutoTrader.ca's 2024 Blazer EV review.
- Hyundai NE1 (IONIQ 5), Kia CV1 (EV6) manuals. Don't cite one model's manual code for another.

## 4. Other fields
- Wheel sizes (32): Equinox/Blazer Canadian trim ids don't map to US trims; Model Y premium-awd-b (19/20) and performance-b (21) found on tslna but not added; Solterra 18/20 by trim but our variant is a single "AWD".
- Silverado usable kWh (Std/Ext), gross for Std (119 from Wikipedia was rejected) and Max (213.7 per InsideEVs).
- Heat pump: Blazer, Silverado, LYRIQ, C-HR, bZ Woodland.
- EV6 2025 Light/Wind/Land AWD usable kWh (Unknown since B22).
- bZ 57.7 kWh pack: chemistry (Wikipedia says LFP, unverified) and DC peak.
- Gross capacity: Toyota/Subaru Canada say 77 kWh, US says 74.7 kWh (both recorded; pick one to display).
- Thorough rounds (B15/B16 flow) for Ford, VW/BMW, Nissan, Volvo/Polestar.

