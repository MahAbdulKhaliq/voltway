# Data debt

**Superseded by Phase 9 (2026-11-21 review).** This file listed gaps in the old 84-variant data set (Phase 1a, closed by owner decision **B23**). Phase 9 rebuilt the car data (B90–B114, PR #149: 1,433 car files), so the remaining car data work is tracked in `docs/plan/CHECKLIST.md`:

- **9.20b** (B96): no unknowns on the charging and mapping figures; until it's done, gaps are warnings only (B114). `B96_STRICT=1 npm run validate` lists them.
- **9.20**: a measured curve, or a stated "none found", for every powertrain.

Use the `fill-data-gaps` skill for research. Crosswalk changes still need an owner decision first (B8/B9).

## Open

### TD-A1 Model Y Standard battery figures
- **Since:** 2026-11-16, round 2 research (was listed under "Owner decisions" here).
- **Impact:** `tesla/model-y/2026/standard-b` and `rwd-b` show OpenEV's LFP pack at 170 kW. The evidence points to ~64 kWh gross / ~60 usable at 175 kW (EV Database, Electric Autonomy, Electrek, Tesla Canada table). Their derived 10–80 % times rest on these inputs. Model 3 Premium RWD may have the same issue.
- **Fix:** research it in a 9.20b round, or the owner overrides the OpenEV value.
- **Update (2026-11-21 review):** both variants now share one powertrain (`tesla/model-y/2026-rwd-b`), so the duplicate concern is gone; the battery figures are unchanged.

## Closed
- 2026-11-21, tech-debt review: **Solterra 2026** stale Chargeprice match fixed in Phase 9: 11 kW AC and 150 kW DC from Subaru Canada (`data/powertrains/subaru/solterra/2026-awd.json`).
- 2026-11-21, tech-debt review: **Blazer EV 2026 LT/RS AWD** has its own powertrain at 150 kW (`chevrolet/blazer-ev/2026-lt-rs-awd`), no longer the SS pack.
- 2026-11-21, tech-debt review: **LYRIQ 2026 port** is CCS1, no longer OpenEV's `nacs`.
- 2026-11-21, tech-debt review: the old sections on charging curves, preconditioning (69 missing) and other fields (wheel sizes, Silverado kWh, heat pumps, EV6 usable kWh, bZ pack, gross capacity, thorough rounds for Ford, VW/BMW, Nissan, Volvo/Polestar) moved to checklist items 9.20 and 9.20b. Phase 9's research batches and B112/B113 (heat pumps on 1,417 of 1,476 trims) cover most of them. Kept in git history (before this commit) for the research leads.
