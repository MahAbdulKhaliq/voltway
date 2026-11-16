# EV App: Design Overview

A one-page summary of the whole design (as of 2026-11-15). Each section links to the detailed doc. When this summary and a detailed doc disagree, **the detailed doc wins**.

---

## 1. The idea

> **A free, no-login website for Canadian EV drivers and shoppers: trustworthy EV specs and charging curves, a simple map of every public fast charger, and easy road-trip planning, all running on the same data.**

| | |
|-|-|
| **Pitch** | **Accuracy of vehicle data.** Every figure shows its source. The map and routing stay deliberately simple. |
| **Market** | Canada first (North America later). **Branding is market-neutral (B12, 2026-11-16):** the product aims to go worldwide; the current data covers Canada and the site says so openly. |
| **Users** | Shoppers, owners and enthusiasts, served by **one interface in three layers**: headline → full specs → sources |
| **Platform** | Website. **No accounts.** Choices are saved in the browser. |
| **Budget** | **Free.** Every part fits in free tiers. |
| **The gap it fills** | No free tool combines Canadian, source-labeled vehicle data + charging curves + a map and planner that use that same data |

Details: [vision.md](vision.md) · [competitors.md](competitors.md)

---

## 2. Built in three phases

| Phase | What | Status |
|-------|------|--------|
| **1** | **Vehicle database + charging curves** (the core) | ✅ Designed |
| **2** | **Charger map** (Level 2/3, Canada-wide) | ✅ Designed |
| **3** | **Route planner** (simple threshold-based) | ✅ Designed |

Each phase ships on its own. The header gains **Map** and **Trip** as they're built. Details: [roadmap.md](roadmap.md)

---

## 3. Phase 1: Vehicle database & charging curves

### Data
- **Sources:** **NRCan official ratings** (the backbone: which cars are sold in Canada, range, kWh/100 km) + **OpenEV Data** (battery, DC power, 400V/800V, ports, wheels, heat pump) + **the Chargeprice curve archive** (Fastned-derived curves) + **hand entry** for gaps, every entry citing its source. → [data-sources.md](data-sources.md)
- **Hierarchy:** make → model → year → **variant** (battery + drivetrain, where curves live) → trim (wheels, heat pump). → [vehicle-data-model.md](vehicle-data-model.md)
- **Every figure is a "sourced value":** value + unit + *kind* + source. The kinds are **Official (Canada) · Official (US) · Manufacturer · Tested · Community · Estimated**. "Unknown" is an allowed value.
- **Combining sources:** our own IDs, plus a crosswalk table to each source (matches confirmed by a person), and an order of preference per figure (for example NRCan first for range). Differences over 5% get flagged.

### Charging curves
- Stored as **SoC → kW points**, several per variant (tests, software versions), one shown by default.
- **Charging maths:** step through SoC, with delivered power = the lower of the car's curve and the charger's kW. Results: **10–80% time**, km added, average kW, time lost to charger limits, and the headline figure **km added per 10 minutes**.
- **Estimated curves** for cars with no measured curve: three template shapes (400V NMC, 800V NMC, LFP) × peak kW, **tuned against published 10–80% times**. Shown with a **dashed line**, an "Estimated" badge and rounded times ("~25 min").
- v1 assumes a warm battery, with no charging-loss factor and no cold-weather effects. → [charging-curve-viewer.md](charging-curve-viewer.md)

### Screens
- **First load:** "Which EV do you drive, or want to?" (search or step-by-step pickers), or skip with "Just browsing".
- **Browse:** cards or a sortable table. Filters include sold in Canada (on by default), port, 400V/800V, heat pump, 10–80% time and "tested curves only".
- **Car page:** key figure tiles, the curve viewer, specs, trims, sources.
- **Compare:** up to 4 cars, curves overlaid, side-by-side specs with best values highlighted.
- **Source badges** on every figure, which open to show other sources and "sources differ" flags.
- km by default (km/mi switch). English v1, with **all text translatable** so French can follow. → [database-ui.md](database-ui.md)

---

## 4. Phase 2: Charger map

- **Data:** NLR (formerly NREL) AFDC (covers Canada), **pulled daily** and published as static files, about 15,000 locations. Automatic checks stop a bad update (for example a >10% drop in stations).
- **Map:** MapLibre + **OpenFreeMap** tiles (free, no key), with self-hosted Protomaps as a fallback. **Covers all of Canada.**
- **Filters:** Level 3 (shown by default) / Level 2 → **a kW range slider per level** (B35; unknown power shows at the full range) → plugs (CCS1, NACS, CHAdeMO, J1772) → "**Chargers my car can use**".

  | Level 2 | ≤3.6 · 3.7–7.2 · 7.3–11.5 · 11.6–19.2 kW |
  |---------|-------------------------------------------|
  | **Level 3** | **≤50 · 51–100 · 101–250 · >250 kW** |

- **Popups:** ports with kW, access, pricing, status (available / temporarily unavailable; planned hidden), last-updated date, links to Google/Apple Maps.
- **Tesla Superchargers:** an honest access note that adjusts to My car. No live availability. → [charger-map.md](charger-map.md)

---

## 5. Phase 3: Route planner

- **Inputs:** From / To, car, starting battery (**90%**), stop threshold (**15%**).
- **Services:** **openrouteservice** free plan (2,000 routes/day, with elevation), behind a small **Vercel Function** that hides the key, caches and limits each visitor. **The app's only server-side piece.**
- **Energy:** highway consumption (tested, or NRCan × 1.15) + elevation (climbs cost energy, descents give 60% back).
- **Stops:** at the threshold, pick the most powerful compatible fast charger within 2 km of the route (widening to 10 km if needed), and **charge to 80%**. If nothing is found, show a "charging gap" warning.
- **Charging time** uses the Phase 1 curve maths, plus 5 minutes per stop.
- **Results:** map, step-by-step itinerary, totals, warnings (estimated curve, Tesla network, gap, detour, winter), and an "estimate only" footer. A before-the-trip planner only. → [route-planner.md](route-planner.md)

---

## 6. How it fits together

```
                ┌──────── Public git repository (data + code) ────────┐
                │ NRCan · OpenEV Data · Chargeprice · hand entry      │
                │ → import → match → precedence → schema checks       │
                │ AFDC chargers → daily pull → automatic checks       │
                └───────────────────────┬─────────────────────────────┘
                                        ▼  build (GitHub Actions)
          ┌────────────────── Static website (Astro, Vercel) ──────────────────────┐
          │ car pages · browse · compare · curve viewer · map · trip planner       │
          │ browser does: search, charging maths, charger search, stop logic        │
          │ browser stores: my car, comparison, units, last trip                   │
          └──────────────┬──────────────────────────────┬──────────────────────────┘
                         ▼                              ▼
              OpenFreeMap tiles             Vercel Function → openrouteservice
              (Protomaps fallback)          (routes, elevation, address search)
```

**Key links between parts:** charger popup → "How fast would my car charge here?" · trip stop → "See the charging curve for this stop" · curve viewer → "Find chargers this fast". → [user-flows.md](user-flows.md) · [phase1-stack.md](phase1-stack.md)

---

## 7. Free-tier budget

| Need | Service | Free allowance |
|------|---------|----------------|
| Website hosting | **Vercel** (Hobby, non-commercial) | Ample for a static site this size. Hard limits: the project pauses rather than bills if exceeded |
| Builds, scheduled data pulls | GitHub Actions (public repo) | Free for public repos |
| Map tiles | OpenFreeMap | No key, no published limits (as-is, donation-funded) |
| Fallback tiles | Protomaps on Cloudflare R2 | 10 GB storage, free egress |
| Charger data | NLR AFDC API (developer.nlr.gov) | Free key (~1,000 requests/hour) |
| Routing, elevation | openrouteservice | 2,000 routes/day |
| Address search | openrouteservice | 1,000/day (local place list first) |
| Key protection | Vercel Functions | Included in the Hobby plan (check current limits) |

*Limits as published at research time. Re-check them at build time.*

---

## 8. Out of scope for v1

Accounts · live charger availability · community reviews · charging cost · winter/temperature effects · smart stop selection · user-set charge target · Level 1 chargers · Level 2 trip stops · turn-by-turn navigation · waypoints · trip comparison across cars · French · prices · markets outside Canada.

Most of these are planned as **later** features. See the "Later" lists in each doc.

---

## 9. Risks

| Risk | Mitigation |
|------|------------|
| **Measured curves mostly cover older models** | Tuned, clearly labeled estimates. Later: ask Fastned, testers or evkx for permission, and accept community curves through pull requests |
| **Free services change or shut down** | MapLibre makes the tile fallback a config change. The function isolates the routing provider. A static Astro build moves to another host easily |
| **Wrong range estimate strands someone** | Conservative threshold, visible warnings, "estimate only" footer, links to live network apps |
| **Upkeep as the EV market changes** | Scheduled update checks open pull requests for review |
| **Built-in car navigation improves** | The database and curves are the core, not the planner |

---

## 10. Left for build time (non-blocking)

| Item | ID |
|------|----|
| Calibrate the curve templates (target ±15% on 10–80% times) | C8, C12 |
| Calibrate the 1.15 highway factor | R10 |
| Add curb weight to vehicles (for elevation) | D17 |
| Function visitor limits and the "busy" message | S7 |
| Confirm ORS returns elevation in the route request | §5 |
| Canadian trim names with US aliases | D16 |
| Range effect of trim features (heat pump, wheels) | D10, D14 |

Full list: [gaps-and-questions.md](gaps-and-questions.md)

**Next step:** create the app's project folder, then use **plan mode** with these docs to build Phase 1.
