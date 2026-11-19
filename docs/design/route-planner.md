# Route Planner

Phase 3 of [roadmap.md](roadmap.md). The simple, threshold-based trip planner from [vision.md](vision.md): drive until the battery reaches the user's threshold (default 15%), stop at a nearby Level 3 charger, charge to 80%, and repeat. Covers R1, R3–R5, R7, S3 (routing) and S6 in [gaps-and-questions.md](gaps-and-questions.md).

**Design principle (Q-V1):** routing stays **simple and easy to follow**. Accuracy comes from the Phase 1 vehicle data, not from a complex model.

*Researched 2026-11-15; re-checked 2026-11-16 at Phase 3 planning: the ORS free Standard plan still gives 2,000 directions and 1,000 geocodes per day, and its API now lives at **`api.heigit.org`** (the old `api.openrouteservice.org` host is deprecated). Over the daily limit ORS answers 403, over the per-minute limit 429.*

---

## 1. What the user does

**On the charger map, not a separate page (B50 ✅, 2026-11-16).**

1. Type a place in the map's **"Where to?"** box (**search mode**). The map flies there and a place card shows the fast chargers nearby, with **Route here**. (The station panel has **Route here** too.) *(Owner, 2026-11-19: closing a trip returns focus to Where to only with a mouse and keyboard; on phones and touch screens nothing is focused, so the on-screen keyboard stays closed.)*
2. **Route here** switches to **route mode**: **From** (the last start, or "Use my location"; the browser location is used without a press only if the browser already allows it, B33), **To**, a swap button, and one editable line for the car (from **My car**), **starting battery %** (default **90%**, R9 ✅) and **stop threshold** (default 15%).
3. Press **Plan route**.
4. The route and its charging stops show on the same map (other chargers stay visible, faded), with the step-by-step itinerary and totals in the side panel (a bottom sheet on phones). **Close route** goes back to the plain map.

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
- **Limits each visitor** to a reasonable number of trips per hour, so one person can't use up the day's allowance (S7). **Decided (B44, 2026-11-16):** one **Vercel firewall rate-limit rule** on `/api/*` (the Hobby plan includes one), 30 requests per visitor per 10 minutes (Hobby caps the window at 10 min; owner set 2026-11-16, to lower if needed), set up by the owner in the dashboard. When the rule or ORS says no, the page shows "Trip planning is busy, try again later" (S7).
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
| Otherwise | **NRCan highway consumption × 1.08** |

**Why a factor:** official highway ratings come from lab cycles that are slower than Canadian highway driving (100–110 km/h). The 1.15 factor is a **placeholder to calibrate** against tested highway figures, like the curve templates (R10). **Decided (B46, 2026-11-16):** no car had a tested highway figure yet, so Phase 3 first researches tested highway consumption (110–120 km/h range tests) for about 20 cars, then calibrates the factor; until the owner approves the result, 1.15 ships marked "not yet calibrated". **Calibrated (B49, 2026-11-16): 1.08** ships.

**Calibrated (B49, 2026-11-16): 1.08.** Fitted on 14 tested mild-weather highway figures; the owner picked the conservative 75th percentile over the 0.97 best fit. NRCan ratings are wall-side (they include charging losses), the tests mostly battery-side, so the two effects largely cancel. See `docs/plan/highway-calibration-report.md`.

**Baseline tests only (B48, 2026-11-16):** a tested figure is stored only from a mild-weather, near-standard test (dry, roughly 15–30 °C, normal tyres, no strong wind); climate, wheel and elevation effects come from conservative formula adjustments, not from cold- or wind-affected tests.

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
  4. Charge to 80% (Q-V2). Exception (B75): if 80% would only reach a short hop to a
     nearby charger, or a stretch with no reachable charger, charge just enough to reach
     the first charger past it (or the destination) with the arrival minimum left, up to 100%.
     Add the detour distance to the trip.
  5. Continue from the charger.
  If the trip can't be finished and NACS is off for the car, plan it again with NACS on; when that
  works, say so and offer to turn NACS on (B76).

At the destination: arrive with at least the threshold %. If not, add a stop as above.
```

### What counts as "compatible" (R5)
**B55 (2026-11-17):** the plugs switched on in **My car** (NACS, CCS1, CHAdeMO; by default only the car's own plug, no adapters assumed), and **Supercharger access** from the data model for Tesla-network sites. The trip panel names the plugs it used. *(Before B55: the map's "Chargers my car can use" rule, car port plus adapters from the data.)*
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
- **The charger map itself (B50).** The route line, plus numbered **stop pins**. Since B53 (Road Paint, 2026-11-17): the route is a yellow line on a dark road band, a charging gap is the same line dashed with an orange edge, and stops are white numbered pins. The other chargers stay visible but faded (filters still apply), so an alternative stop is easy to spot.
- Each stop pin opens the same **popup** as the charger map.

### Itinerary (side panel in place of the filters; bottom sheet on phones)
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

*(B89, owner 2026-11-19: each row of the itinerary sits on a card. The stop number is the button: it flies to the stop and opens its details (replacing Details); a border row's diamond flies to the crossing, which also shows on the route as a diamond. Back from a stop always returns to the whole route, as does tapping the same stop or border again. Closing the trip leaves the camera on the whole route so the line can be seen drawing back (replaces the B69 fly-back). Before planning, the battery fields and Change car live inside the car tile, which opens like an accordion. Round 2 (2026-11-19): the start and arrival marks fly to those places as well; "How this was estimated" is a section that unrolls (design-language §8); the car accordion lists Plugs used with the map filter's plug drawings and ends in a Change car row. Round 3 (2026-11-19): on phones a stop, border or end tap keeps the sheet at its height (it no longer drops to peek) and aims the spot into the map above the sheet, under the stop's details; Back fits the route above the sheet as it is. Round 4 (2026-11-19): each stop shows the speed bolts and the charger's top kW, then Car-limited; on phones the sheet at its lowest position doesn't scroll, its car card is inert, a swipe up raises it, and lowering it returns the trip to its top.)*

### Warnings (shown inline)
| Warning | When |
|---------|------|
| **Estimated curve** | The car has no measured curve. Charging times shown with "~" |
| **Tesla network** | A non-Tesla car is routed to a Supercharger |
| **Charging gap** | No compatible fast charger was found on a stretch. Always visible under the totals (on phones too, never behind "Show the stops"), named by the places on either side, and it says whether the car is expected to reach the far side (owner-approved fix, 2026-11-16). The leg is also marked in the stop list |
| **Detour** | A stop is more than 2 km from the route |
| **Winter** | Always shown in a short footer: "Cold weather can cut range by a lot. This plan assumes mild weather." |

### Trust and responsibility (K2)
- A clear footer: **"This is an estimate. Always check your car's own range and charger status before you rely on a stop."**
- The data dates are shown (charger data last updated…).

### Saving and sharing
- The **last trip** is saved in the browser.
- **Share link:** *opt-in*, because the link contains the From and To places. It opens the charger map in route mode (`/?from=…&to=…`, B50).

---

## 8. Scope decisions

- **R7 ✅: before-the-trip planner only.** No live navigation or re-planning during the drive. The itinerary links out to Google or Apple Maps for driving directions to each stop.
- **Drive mode (B72, 2026-11-17):** a planned trip opens a **Drive** view that hands the next stop (or, within each app's waypoint limit, the whole remaining trip) to Google Maps or Apple Maps, ticks off reached stops from the browser's location while the page is open, and keeps the screen awake. Still no turn-by-turn in Voltway. Details: [DESIGN-5.md](../plan/DESIGN-5.md) §1.
- **Route options (B73, B74, 2026-11-17):** Settings has **Avoid tolls** and **Avoid highways** (ORS `avoid_features`) and an always-on **Stay in Canada** (ORS `avoid_borders: "all"`; an end outside Canada gets "not supported yet" instead of a trip). Details: [DESIGN-5.md](../plan/DESIGN-5.md) §2.
- **Stay within the border (B78, 2026-11-18):** trips may start in Canada or the US and must end in the start's country; **Stay in Canada** is renamed **Stay within the border** (still locked on). Starts outside both get `outsideArea`, a cross-border end gets `crossBorder` (Lower 48 ↔ Alaska gets its own message, since that road passes through Canada), both before any ORS call. The planner loads the Level 3 detail tiles along the route corridor before planning. Charging stops stay in the trip's country, even where the route runs along the border (QA 2026-11-18). Details: [DESIGN-7.md](../plan/DESIGN-7.md) D3–D4.
- **Cross-border trips (B79, 2026-11-18):** **Stay within the border** is a real switch, off by default since B80 (2026-11-18). Off, trips may cross between Canada and the US (`border=cross`, no `avoid_borders`), stops may be in either country the route passes through, and a crossing trip shows a note (passport, time at the crossing) and a **Border crossing** row per crossing with the nearest town on the far side. Details: [DESIGN-8.md](../plan/DESIGN-8.md).
- **R8 (cost):** stays *later*.
- **Waypoints** (stops along the way, like "via Ottawa"): *later*. ORS supports them, so they're easy to add.
- **Live traffic, weather, live charger status:** out of scope.

---

## 9. Questions resolved here, and new ones

**Resolved:** R1 (simple model), R3, R4, R5, R7, R9 (90% start), S3 (routing part), S6.

**New:**
| ID | Question |
|----|----------|
| R10 | ~~**Calibrating the 1.15 highway factor** against tested highway range figures, before launch.~~ ✅ Resolved (B49, 2026-11-16): 1.08. |
| D17 | **Add `curb_weight_kg` to the variant** (needed for elevation). It's MVP for Phase 3. Sources: OpenEV Data, manufacturer, FuelEconomy.gov. |
| S7 | **Protecting the function:** per-visitor limits and what to show when the day's allowance runs out ("Trip planning is busy, try again later"). |

**B58 (2026-11-17):** without a chosen car, the trip form shows one "Choose your car" prompt that opens the header's car dialog; "Change car" opens the same dialog. The dialog shows the car's plug switches before saving.

**B61 (2026-11-17):** simpler trip form: From / To with placeholder labels and the map's start / end marks, Use my location as an icon inside From, one car row that opens the battery settings, and a full-width Plan trip.

**B66–B68 (2026-11-17):** each stop shows an estimated **charging cost** from the price per kWh in Settings (one site-wide price, $0.45 to start; energy added ÷ 92 % × price), and the trip shows the total as its second figure ("~$43.65 at $0.45/kWh", with Change cost estimate). The trip card order is: total time (with a share-link icon), From → To, distance · driving · stops, charging time · plugs used, cost, the car line, the stops, then the estimate note. The Trip header has a back arrow to the form (no Edit button) and stays at the top while the trip scrolls. Back on the form with the same ends, the one button is **Return to plan**; with new ends it is **Plan trip**. On phones the stops open with **Show stops**.

**B69 (2026-11-17):** only the trip body scrolls under a fixed header; closing the trip draws the line back and returns the map to the view from before the trip.

**B62 (2026-11-17):** the browser keeps the battery settings and the last 5 destinations (Previous destinations on the map), never where a trip started. The trip form opens with From empty (or the browser location when already allowed).
