# Route Planner

Phase 3 of [roadmap.md](roadmap.md). The simple, threshold-based trip planner from [vision.md](vision.md): drive until the battery reaches the user's threshold (default 15%), stop at a nearby Level 3 charger, charge to 80%, and repeat. Covers R1, R3–R5, R7, S3 (routing) and S6 in [gaps-and-questions.md](gaps-and-questions.md).

**Design principle (Q-V1):** routing stays **simple and easy to follow**. Accuracy comes from the Phase 1 vehicle data, not from a complex model.

*Researched 2026-11-15; re-checked 2026-11-16 at Phase 3 planning: the ORS free Standard plan still gives 2,000 directions and 1,000 geocodes per day, and its API now lives at **`api.heigit.org`** (the old `api.openrouteservice.org` host is deprecated). Over the daily limit ORS answers 403, over the per-minute limit 429.*

---

## 1. What the user does

1. Enter **From** and **To**.
2. Check the car (pre-filled from **My car**), **starting battery %** (default **90%**, R9 ✅) and **stop threshold** (default 15%).
3. Press **Plan trip**.
4. See the route on the map with charging stops, plus a step-by-step itinerary and trip totals.

---

## 2. Building blocks (S3 routing, S6) ✅

Phases 1 and 2 are fully static. Routing **can't be**, because it needs a road network. The smallest possible addition:

| Part | Choice | Free allowance (as published) | Notes |
|------|--------|-------------------------------|-------|
| **Routing** | **[openrouteservice](https://openrouteservice.org/plans/)** (ORS), free Standard plan | **2,000 directions per day**, 40 per minute | Based on OpenStreetMap. Free to use. Can return **elevation along the route** in the same request (to confirm at build time) |
| **Elevation** | Comes with the ORS route (above) | Included | Separate elevation calls also exist (2,000 points per day) |
| **Address search** (S6) | **ORS geocoding**, after a local check first (§6) | **1,000 per day** | Same key and account |
| **Key protection** | A small **Vercel Function** between the site and ORS, in the same project as the site | Included in the Hobby plan's function allowance (check current limits) | See below |
| **Chargers along the route** | **The Phase 2 static charger files**, searched **in the browser** | n/a | No extra service needed |

### Why a small function
A static site can't hide an API key. Anyone could copy it and use up the daily allowance. A **Vercel Function** (a tiny piece of server code that deploys with the site) sits in between:
- **Holds the ORS key** out of sight, in a Vercel **environment variable**.
- **Caches** repeated routes and searches (the same city pair is often asked for again), using **CDN cache headers** on its responses.
- **Limits each visitor** to a reasonable number of trips per hour, so one person can't use up the day's allowance (S7). **Decided (B44, 2026-11-16):** one **Vercel firewall rate-limit rule** on `/api/*` (the Hobby plan includes one), about 30 requests per visitor per hour, set up by the owner in the dashboard. When the rule or ORS says no, the page shows "Trip planning is busy, try again later" (S7).
- **Doesn't log** addresses beyond what it needs for the cache.

That's the **first and only server-side piece** in the whole app. It lives in the **same project as the site**, so there's no extra service or account.

### Alternatives considered
| Option | Why not first choice |
|--------|---------------------|
| GraphHopper free plan | 500 credits per day and **non-commercial only** |
| FOSSGIS public Valhalla / OSRM servers | Volunteer-run demo servers, **1 request per second**, no availability guarantee, and their policy says not to build apps on them |
| Photon public geocoder | Fair use only, with heavy use throttled or banned. A possible backup |
| Self-hosting a routing engine | Free software, but needs a server that runs all the time. A later option if traffic grows |

**Is 2,000 trips a day enough?** For a light project, yes. With caching and per-visitor limits, the free allowance should last comfortably. If it ever runs out, ORS offers a free higher-quota plan for non-profit and academic projects, and paid plans exist.

---

## 3. Energy model (R1) ✅, kept simple

For each stretch of the route:

### 1. Base consumption
| Situation | Consumption used |
|-----------|------------------|
| The variant has a **tested highway consumption** (data model `kind: tested`) | That figure, as is |
| Otherwise | **NRCan highway consumption × 1.15** |

**Why × 1.15:** official highway ratings come from lab cycles that are slower than Canadian highway driving (100–110 km/h). The 1.15 factor is a **placeholder to calibrate** against tested highway figures, like the curve templates (R10). **Decided (B46, 2026-11-16):** no car had a tested highway figure yet, so Phase 3 first researches tested highway consumption (110–120 km/h range tests) for about 20 cars, then calibrates the factor; until the owner approves the result, 1.15 ships marked "not yet calibrated".

### 2. Elevation
- **Climbing:** add the energy needed to lift the car: `mass × 9.81 × metres climbed`, ÷ 0.9 for drivetrain losses.
- **Descending:** take back **60%** of the descent energy (regenerative braking).
- **Mass:** the variant's curb weight + 150 kg (driver and luggage). If curb weight is unknown, a default by body type (D17). **Decided (B47, 2026-11-16):** the default is the **median of the sourced curb weights** for that body type in our own data (the overall median when a body type has fewer than 3), worked out at build time and shown as Estimated with that basis. A research pass also fills the missing weights.
- **Why include it:** it's cheap (ORS supplies the elevation) and it matters a lot on mountain trips in BC and Alberta, while having little effect in Ontario.

### 3. Not modeled in v1
Temperature and winter (Q-V4), wind, speed changes along the route, HVAC, payload beyond the 150 kg allowance, towing, battery health.

### 4. Turning energy into battery %
`SoC drop % = energy used ÷ usable kWh × 100`, using `capacity_usable_kwh` from the data model.

---

## 4. Choosing charging stops (R4, R5) ✅

The simple approach decided in Q-V3, written out step by step.

```
Start at the starting battery %.
Walk along the route, predicting battery % at each point.

When the battery would drop below the threshold (default 15%):
  1. Look for compatible Level 3 chargers:
       - within 2 km of the route,
       - where the car would arrive with between threshold and threshold + 20% battery
         (that is, the last stretch before the threshold).
  2. Pick the one with the highest power the car can actually use
       (charger kW, capped at the car's DC peak). Ties → the furthest along the route.
  3. None found? Widen to 10 km from the route.
     Still none? Use the last compatible Level 3 charger earlier on the route,
       even though the car arrives with more battery.
     Still none? Mark a "charging gap" warning on that stretch.
  4. Charge to 80% (Q-V2). Add the detour distance to the trip.
  5. Continue from the charger.

At the destination: arrive with at least the threshold %. If not, add a stop as above.
```

### What counts as "compatible" (R5)
The same rules as the map's "Chargers my car can use" toggle (charger-map.md §4):
- The **car's port**, plus **adapters** and **Supercharger access** from the data model.
- **Public** stations only. "Temporarily unavailable" and planned sites are **skipped**.
- Superchargers used for a non-Tesla car are **flagged** in the itinerary (access varies by site).

### Not in v1 (later options)
- Smart stop choice to save total trip time (Q-V3, later toggle)
- A user-set charge target per stop (Q-V2, later)
- Level 2 stops on short trips or at the destination
- Preferring or avoiding particular networks

---

## 5. Charging time at each stop

Uses the **Phase 1 curve maths** (charging-curve-viewer.md §3) with no changes:
- From the **arrival %** to **80%**
- Delivered power = the lower of the **car's curve** and the **charger's kW** (that site's best compatible port)
- The curve's **source badge travels with it**. A stop calculated from an estimated curve says "~", for example "~25 min".

**Stop overhead:** **5 minutes** added per stop for parking, plugging in and paying. *Later:* user-adjustable (it's the reference app's "dwell time").

**Total trip time** = driving time (from ORS) + detours + charging time + stop overhead.

---

## 6. Address search (S6) ✅

To stay inside the 1,000 searches per day:
1. As the user types, match first against a **static list of Canadian places**. That needs no service. **Decided (B45, 2026-11-16):** the list is **GeoNames** places with population ≥ 1,000 (CC BY 4.0, credited on About; see data-sources.md §5a). The map never got its own list (B29).
2. Call **ORS geocoding** only when the user presses Search or picks "Search full address", **not on every keystroke**.
3. Cache results through the function's CDN cache headers.
4. **"Use my location"** works for From (browser location, only when asked).

---

## 7. Results screen

### Map
- The route line, plus numbered **stop pins**. Pins use the Phase 2 style.
- Each stop pin opens the same **popup** as the charger map.

### Itinerary (side panel; bottom sheet on phones)
```
🟢 Toronto, ON                    Depart with 90%
   │ 185 km · 1 h 55 min
⚡ Stop 1 · Petro-Canada, Kingston     Arrive 22% → charge to 80%
   │ 150 kW CCS1 · ~24 min charging + 5 min
   │ 260 km · 2 h 40 min
⚡ Stop 2 · …
   │ …
🏁 Montréal, QC                   Arrive with 31%

Total: 545 km · 6 h 10 min driving · 2 stops · 58 min charging
```
*(Illustrative layout. These aren't real calculations.)*

### Warnings (shown inline)
| Warning | When |
|---------|------|
| **Estimated curve** | The car has no measured curve. Charging times shown with "~" |
| **Tesla network** | A non-Tesla car is routed to a Supercharger |
| **Charging gap** | No compatible fast charger was found on a stretch |
| **Detour** | A stop is more than 2 km from the route |
| **Winter** | Always shown in a short footer: "Cold weather can cut range by a lot. This plan assumes mild weather." |

### Trust and responsibility (K2)
- A clear footer: **"This is an estimate. Always check your car's own range and charger status before you rely on a stop."**
- The data dates are shown (charger data last updated…).

### Saving and sharing
- The **last trip** is saved in the browser.
- **Share link:** *opt-in*, because the link contains the From and To places.

---

## 8. Scope decisions

- **R7 ✅: before-the-trip planner only.** No live navigation or re-planning during the drive. The itinerary links out to Google or Apple Maps for driving directions to each stop.
- **R8 (cost):** stays *later*.
- **Waypoints** (stops along the way, like "via Ottawa"): *later*. ORS supports them, so they're easy to add.
- **Live traffic, weather, live charger status:** out of scope.

---

## 9. Questions resolved here, and new ones

**Resolved:** R1 (simple model), R3, R4, R5, R7, R9 (90% start), S3 (routing part), S6.

**New:**
| ID | Question |
|----|----------|
| R10 | **Calibrating the 1.15 highway factor** against tested highway range figures, before launch. |
| D17 | **Add `curb_weight_kg` to the variant** (needed for elevation). It's MVP for Phase 3. Sources: OpenEV Data, manufacturer, FuelEconomy.gov. |
| S7 | **Protecting the function:** per-visitor limits and what to show when the day's allowance runs out ("Trip planning is busy, try again later"). |
