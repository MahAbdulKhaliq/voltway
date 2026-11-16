# Vision

The owner's vision for the app, as described in their own words, plus decisions taken from [gaps-and-questions.md](gaps-and-questions.md). This doc wins over anything else when they disagree. The build order is in [roadmap.md](roadmap.md).

---

## In one line

> A free, no-login website for Canadian EV drivers: **trustworthy EV specs and charging curves**, a simple map of every public charger, and easy road-trip planning with fast-charging stops.

## Pitch (P2, Q-V1) ✅

- **Accuracy is the pitch for the vehicle data:** specs, charging curves and trim features. The database has to be good, and it's where the app earns trust.
- **The charger map and routing stay simple** and easy to understand. Being right enough and clear matters more there than modeling every detail.

## Market (P4) ✅

- **North America only to start, with Canada first.** If map or data costs force it, the starting area could shrink to **Ontario only**.
- Cars from other markets can go into the database if it's easy, but Canada is what the design is built around.
- **Branding is market-neutral (B12, 2026-11-16):** the long-term aim is worldwide, so the product isn't branded as Canadian. The site states its current coverage (Canada, NRCan ratings) openly instead.
- Every vehicle records **which markets it's sold in**, so the app can filter to cars available in Canada.

## Users & persistence (X3) ✅

- **No logins, accounts or sign-in of any kind.**
- On first load, the user picks a car and starts using the app.
- Their choices (selected car, settings) are saved **only in their own browser**, using local storage or cookies. Nothing is stored on a server per user.

## Platform (U1) ✅

- A **website**, used in the browser, hosted on **Vercel**.

## Project goals (P5, P6) ✅

- **Always non-commercial.** No ads, payments or paid tiers.
- **A learning project:** the owner wants it to teach them something new. Tools are chosen partly for that (Vercel, Astro, serverless functions, web maps). See [phase1-stack.md](phase1-stack.md) §7.

---

## Part 1: Vehicle database & charging curves

### Vehicle data
- A record of EVs, grouped by **brand** and tagged with **market availability**.
- **Data approach (D9) ✅:** start from **freely available public data**, using the minimum needed to work, and improve it over time. The sources still have to be found and their terms checked. That's the first job of Phase 1 in the roadmap.
- Reference sites (for comparison and ideas; their data can't be reused without permission):
  - [better-dcfc-calculator.vercel.app/charging](https://better-dcfc-calculator.vercel.app/charging): car and charging-curve data, apparently from evkx.net. The model for how the app should present curves.
  - [evkx.net/models](https://evkx.net/models/): vehicle and charging-curve data.
  - [evspecifications.com](https://www.evspecifications.com/): vehicle specs.

### Charging curves
- Store a charging curve for each vehicle (or each variant).
- Model charging time and **range gained** in a similar way to better-dcfc-calculator.

### Trim features (extra scope)
- Where possible, record what each car or trim usually comes with:
  - **Heat pump:** yes or no
  - **Wheel and tire options** from the manufacturer (bigger rims usually mean less range)
  - Similar options that affect range
- Purpose: feed a **range estimator**, which in turn feeds route planning.

### Battery chemistry
- Record each pack's **chemistry** (for example NMC or LFP). It costs little to collect now, and the later winter estimate depends on it (see Q-V4).

### Images (nice to have)
- A few pictures of each car for the site. Image rights need checking (see D8).

---

## Part 2: Charger map

Similar to PlugShare or ChargePoint, but simpler.

- A map of **all public chargers**.
- Scope is **Level 2 and Level 3** chargers. Level 1 is left out.
- Each charger shows its **plug types**: J1772, CCS1, NACS and **CHAdeMO** (N2 ✅).
- Users filter by level, using **simple power bands instead of a kilowatt slider**. The band checkboxes only appear once their level is selected, and all bands are on by default.

### Power bands (N1) ✅

Each band **includes its upper edge**, so a charger exactly on an edge goes in the lower band. Bands are based on the charger's **rated maximum power**.

| Level | Band | Covers | Typical hardware |
|-------|------|--------|-----------------|
| **Level 2** | Up to 3.6 kW | ≤ 3.6 | Older or low-amp units, 16 A |
| | 3.7–7.2 kW | > 3.6 and ≤ 7.2 | The most common public L2 (30–32 A; 6.2 kW at 208 V) |
| | 7.3–11.5 kW | > 7.2 and ≤ 11.5 | 40–48 A units |
| | 11.6–19.2 kW | > 11.5 | 80 A units (19.2 kW is the North American L2 maximum) |
| **Level 3** | Up to 50 kW | ≤ 50 | 24–25 kW and the common 50 kW DC chargers |
| | 51–100 kW | > 50 and ≤ 100 | 62.5–100 kW units |
| | 101–250 kW | > 100 and ≤ 250 | 150–180 kW units, 250 kW Tesla V3 |
| | Over 250 kW | > 250 | 320–400 kW units (for example Electrify Canada) |

**Rules:**
- **Level comes from the data source's classification** (Level 2 vs. DC fast), not from the power value. A 20 kW DC unit is still Level 3.
- **Sites with mixed hardware:** a site appears in a band if **any** of its ports fall in it.
- **Unknown power:** public data often has no kW figure, especially for Level 2. Such chargers go in an **"Unknown power"** band, which is on by default so chargers don't vanish from the map.

---

## Part 3: Route planner

Similar to ABRP, but deliberately simpler.

- **Stop selection (Q-V3) ✅:** drive until the battery reaches the **user-set threshold (default ~15%)**, then stop at a suitable **Level 3** charger near that point. Smarter stop choice (to save total trip time) could come later as an optional toggle.
- **Charging at each stop (Q-V2) ✅:** charge to **80%** and continue. Letting users set this target comes later.
- **Charger type:** v1 only uses **Level 3** chargers for stops.
- Range estimates should eventually use trim features (heat pump, wheels) from Part 1.

---

## Out of scope for v1

- User accounts and logins
- Level 1 chargers
- **Winter or temperature effects (Q-V4).** For later: a rough estimate that turns temperature into a % range loss based on battery chemistry.
- Smart stop selection (an optional toggle later)
- User-set charge target per stop (later)
- Suggesting Level 2 chargers near the destination, or using them on short trips
- Markets outside North America, apart from easy additions to the database

## Still to decide

- ~~**Tech stack and hosting (Phase 1)**~~ ✅ decided: a fully static site, data in a public git repository, and free static hosting. See [phase1-stack.md](phase1-stack.md).
- **Map and routing services:** must fit the free budget. This decides Canada-wide vs. Ontario only (S3, Phases 2–3).

---

## Earlier decisions (P1, P3), from the multiple-choice round

- **P1, users:** all three groups (shoppers, owners and enthusiasts).
- **P3, which part leads:** every part gets full depth in the end, but they're **built in order**, starting with the database and curves. See [roadmap.md](roadmap.md).
