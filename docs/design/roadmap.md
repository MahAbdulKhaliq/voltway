# Roadmap

The order in which the app gets designed and later built. Each phase is designed in this folder first. Building starts once its design docs are settled.

**Principle:** get the vehicle data right first. The map and routing both depend on it, and data accuracy is the pitch.

---

## Phase 1: Vehicle database & charging curves

**Goal:** a browsable, accurate EV database with charging-curve views that look good and can be trusted.

Design docs to write, in order:

| # | Doc | Covers | Status |
|---|-----|--------|--------|
| 1 | `data-sources.md` | Find free public sources for specs, curves, trim features and images. Check terms of use. Choose a minimum set. (D1, D9, C1, D8) | ✅ [Drafted](data-sources.md) |
| 2 | `vehicle-data-model.md` | Fields, how vehicles break down into model, trim, year and battery variant, rated vs. real-world values, source labels, matching across sources (D2–D4, D10–D12, P9) | ✅ [Drafted](vehicle-data-model.md) |
| 3 | `charging-curve-viewer.md` | 10–80% time, range gained, overlays, charger limits, estimated-curve templates, how it compares to better-dcfc-calculator (C3–C9) | ✅ [Drafted](charging-curve-viewer.md) |
| 4 | `database-ui.md` | Browse, filter, compare, the car pages, picking a car on first load and saving it locally (D6, P7, U3) | ✅ [Drafted](database-ui.md) |
| 5 | `phase1-stack.md` | Requirements for storage and hosting for this phase (S1, S2, S4). It needs to know the data shape first. | ✅ [Drafted](phase1-stack.md) |

**Done when:** the docs above are settled and there are no blocking (🔴) gaps left for Phase 1.

**Status (2026-11-15): ✅ Phase 1 design is complete.** All five docs are drafted, there are no blocking gaps, and the stack, public repo (S5) and translatable-text approach (U5) are decided.
- Known risk (K1): measured curves may stay limited to older models, so newer cars will mostly show tuned, labeled estimates at launch.
- Remaining non-blocking Phase 1 questions are in the gaps file (for example D10, D13–D16, C4, C11).
- **Ready to build** whenever you start. Plan mode is the right tool then, to turn these docs into a step-by-step build plan.

**Build split (2026-11-15, owner decision B21):** **Phase 1a** (About & sources, data gaps to "filled or unknown", EV6 match and trim-range fixes, draggable SoC guides, accessibility/phone pass, scheduled data check, then QA) is finished **before** the map. **Phase 1b** (Cars tab filters/sorts, first-load picker + My car, Compare, template calibration) follows the map. Phase 2 build starts once Phase 1a passes QA.

## Phase 2: Charger map

**Goal:** a simple map of Level 2 and Level 3 chargers with plug types and power-band filters.

*Placed before routing because the route planner needs the same charger data.*

- ✅ [`charger-map.md`](charger-map.md) drafted: free map tiles (OpenFreeMap, with Protomaps as a fallback), a daily AFDC pull as static files, filters, popups, status, Tesla access
- **Coverage decided: all of Canada.** Map tiles are free for the whole country.
- **✅ Phase 2 design is complete.** N8 is decided (Level 3 only by default). Non-blocking: N9, S6.

## Phase 3: Route planner

**Goal:** the simple threshold-based planner: stop at a fast charger near the user's threshold (default 15%) and charge to 80%.

- ✅ [`route-planner.md`](route-planner.md) drafted: openrouteservice behind a Vercel Function (the app's only server-side piece), a simple energy model with elevation, threshold stop rules, Phase 1 curve maths for charging time, itinerary and warnings
- **✅ Phase 3 design is complete.** R9 is decided (90% start). Non-blocking, for build time: R10, D17, S7.

**✅ All three phases are now designed.** Every part fits in free tiers. How the parts connect is in [user-flows.md](user-flows.md), and positioning against other tools is in [competitors.md](competitors.md).

## Later (after v1)

- Smart stop selection as a toggle
- User-set charge target per stop
- Winter estimate: temperature and battery chemistry give a % range loss
- Range estimator using trim features (heat pump, wheels)
- Level 2 suggestions at the destination and for short trips
- Markets beyond Canada and North America

---

## About plan mode

Plan mode is for planning **implementation**: changes to code in a project. Here, the output is design docs, so it isn't needed yet. Once a phase's docs are settled and you start building it in its own project folder, plan mode is the right tool for turning those docs into a step-by-step build plan.
