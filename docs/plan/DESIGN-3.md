# Phase 3 build plan: threshold route planner (approved 2026-11-16)


## Context
Phases 1a, 1b and 2 are merged (main at ed8e734). Phase 3 is the simple trip planner in `docs/design/route-planner.md`: drive until the battery nears the threshold (default 15 %), stop at a compatible Level 3 charger, charge to 80 %, repeat. Routing needs a road network, so this phase adds the app's **first and only server piece**: a Vercel Function in front of openrouteservice (ORS).

What exploring the code turned up:
- `curb_weight_kg` already flows through the build (OpenEV, `manufacturer`): **53 of 84** cars have it.
- Highway consumption is NRCan `rated_nrcan` on **all 84**, but **no car has a tested highway figure**, so R10 has nothing to calibrate against yet.
- Usable kWh: 63 of 84 (the rest use the gross fallback, already flagged "estimated" by B10).
- The "static list of Canadian places" that route-planner §6 relies on was never built (B29 deferred place search to Phase 3).
- ORS moved its API to **`api.heigit.org`** (the old `api.openrouteservice.org` is deprecated). The free Standard plan is unchanged: 2,000 directions/day (40/min) and 1,000 geocodes/day. Over the daily limit ORS returns 403, over the per-minute limit 429.
- Vercel Hobby allows **one WAF rate-limit rule**. A community report says picking "429" as the action may prompt a Pro upgrade on Hobby; "Deny" is the fallback.
- Reusable code: `calculateCharge`/`powerAt` (`src/lib/charging.ts`), `estimateCurve` (`src/lib/estimated-curve.ts`), `carPlugs`/`carCanUse`/`topDcKw` (`src/lib/map-filter.ts`), map data types (`src/lib/map-data.ts`), `StationPanel.tsx`, map style and pins in `ChargerMap.tsx`, `getMyCar` (`src/lib/my-car.ts`), `CarPicker.tsx`, `KEYS` (`src/lib/storage.ts`), and the `kw` cap link on `/charging`.

**Owner answers from this planning round (to record as B44–B47):**
- **B44 (S7) Rate limit:** one **Vercel firewall rate-limit rule** on `/api/*`, set up by the owner in the dashboard with my step-by-step guide, plus CDN caching and a friendly "Trip planning is busy, try again later" message.
- **B45 (S6) Places:** add **GeoNames** Canadian places (population ≥ 1,000, CC BY 4.0, credited on About) as a static file, for instant suggestions. ORS geocoding is called only for full addresses on Search.
- **B46 (R10) Highway factor:** **research tested highway figures, then calibrate**. Ship with 1.15 marked "not yet calibrated" until the calibration is approved.
- **B47 (D17) Curb weight:** a default per body type = the **median of our own sourced curb weights**, computed at build time and labelled estimated with its basis, plus a research pass on the 31 missing cars.

## Docs PR (first, before code)
- `docs/plan/DESIGN-3.md` (this plan, expanded); `[3]`-tagged CHECKLIST items, each with a *Done when* line; a Phase 3 section in `QA.md`.
- B44–B47 in `gaps-and-questions.md` (R10, D17, S7 status updates); `route-planner.md` §2 (ORS domain, firewall rule), §3 (weight defaults), §6 (GeoNames); `data-sources.md` (GeoNames source); CLAUDE.md scope line → Phase 3.

## Phase 3a: data and logic (no server, all pure and unit-tested)

**3.1 Places (B45).** `scripts/fetch-geonames.ts` downloads GeoNames `CA.zip` (or `cities1000`, filtered to CA) → `data/imported/geonames/places.json` (schema `schema/imported-geonames.schema.json`: name, ASCII name, province code, lat, lon, population). The data build writes `public/data/places.json` (short keys, about 3,000 rows) and a `src-geonames` source record. Credit on the About page. Tests: parser, province mapping, filter.
*Done when:* the file builds, schema-validates, has Toronto/Montréal/Whitehorse, and the About page credits GeoNames.

**3.2 Curb weight defaults (B47).** In `scripts/lib/build.ts`, compute the median sourced `curb_weight_kg` per `body_type` (and an overall median for a body type with fewer than 3 cars). A car without a weight gets an `estimated` value with a basis note ("median of N sourced <body type>s"). Shown as Estimated in the specs table. Tests in `build.test.ts`.
*Done when:* all 84 cars have a weight, every filled-in one is `kind: estimated` with a basis, and the build still fails on an unsourced figure.

**3.3 Research round (B46, B47).** The `fill-data-gaps` flow (ev-data-researcher → data-fact-checker → add-facts) for (a) the 31 missing curb weights and (b) **tested highway consumption** (a 110–120 km/h range test, e.g. 70 mph tests) for about 20 cars across makes and pack types, stored as `consumption_highway_wh_per_km` with `kind: tested`. The data PR waits for owner review (vehicle data is never auto-merged).
*Done when:* the owner approves and merges the data PR.

**3.4 Energy model (R1).** `src/lib/trip-energy.ts`:
- Base Wh/km: a tested highway figure if present, else NRCan highway × `HIGHWAY_FACTOR` (1.15, in `src/config.ts`, with an `uncalibrated` flag).
- Elevation per segment: climbing `m·9.81·Δh / 0.9`, descending gives back 60 %; mass = curb weight + 150 kg.
- SoC drop = kWh ÷ usable kWh × 100 (gross fallback marks the trip estimated).
Tests: flat, climb, descent, the cancelling round trip, unknown weight.

**3.5 Route geometry.** `src/lib/route-geo.ts`: cumulative distance along a polyline (haversine), project a point onto the route (distance from the route, distance along it) with a bounding-box prefilter so 2,929 L3 stations stay fast. Tests on a synthetic route.

**3.6 Stop planner (R4, R5, §4–5).** `src/lib/trip-plan.ts`: `planTrip(route, car, stations, options)`, pure and separate from the routing call (keeps X2, multi-car compare, cheap). It follows the §4 algorithm exactly:
- the stop window (threshold to threshold + 20 %, ≤ 2 km, then 10 km, then the last earlier charger, then a "charging gap");
- the highest usable power (`topDcKw` capped at the car's DC peak), ties → furthest along;
- charge to 80 % with `calculateCharge`, + 5 min overhead;
- detour = 2 × distance off the route, timed at the route's average speed;
- arrival ≥ threshold at the destination.
Compatibility comes from `carPlugs`/`carCanUse` (B38, B42). Stations with `t` (temporarily unavailable) are skipped. Restricted-access stations (`rs`: customers only, limited hours) are also skipped, as "public only" for a planned stop (accepted with the plan, 2026-11-16). Output: legs, stops (arrival %, kW, minutes, `estimated`, Tesla/detour flags), warnings, totals.
Tests: no stop needed, one stop, the 2 km → 10 km → earlier fallbacks, a gap, a NACS car at a Supercharger, a CCS car via adapter (flagged), and an estimated curve that carries "~".

**3.7 Highway calibration (R10), after 3.3.** `scripts/calibrate-highway.ts` (`npm run calibrate:highway`) compares NRCan highway × factor with the tested figures and writes `docs/plan/highway-calibration-report.md`. The owner approves the factor, then I update `config.ts`, drop the "not yet calibrated" note and record it in route-planner §3 and gaps.

## Phase 3b: the function (owner setup first)

**3.8 Owner setup (guided step by step).**
1. Make a free HeiGIT/ORS account and key.
2. Add `ORS_API_KEY` as a Vercel environment variable (Production + Preview, marked Sensitive).
3. Put a local `.env` with the same key (already gitignored; I'll check).
I explain what an env var and a function are as we go. **No Vercel settings are changed by me.**

**3.9 Vercel Function.** Add the `@astrojs/vercel` adapter, keep `output: 'static'` (every page stays pre-rendered), and add on-demand endpoints with `export const prerender = false`. I'll confirm in the build output that only `/api/*` became functions.
- `src/pages/api/route.ts`: `GET ?from=lon,lat&to=lon,lat`. It checks the input (numbers, inside a Canada-plus-border box) and calls ORS `driving-car` geojson with `elevation=true`. It returns a trimmed body: coordinates `[lon, lat, elev]` (simplified), distance, duration and ascent/descent. Coordinates are rounded to 3 decimals so the same city pair hits the same cache. `Cache-Control: public, s-maxage=604800`.
- `src/pages/api/geocode.ts`: `GET ?q=` with `boundary.country=CA`, max 5 results, cached the same way.
- ORS 403/429 and timeouts → `503 {error: "busy"}`. No address logging. The key never leaves the server.
- Tests with a mocked `fetch`: validation, mapping, the busy path, and cache headers.

**3.10 Firewall rule (B44, owner in the dashboard, guided).** One rate-limit rule: path starts with `/api/`, 30 requests per IP per 10 minutes (fixed window; Hobby caps the window at 600 s; owner set 2026-11-16), action 429 (or Deny if Hobby forces an upgrade for 429). The client treats 429, 403 and 503 the same way: the busy message.

## Phase 3c: Trip screen

**3.11 `/trip` page + `TripPlanner.tsx` island.** "Trip" goes in the header nav and side menu (user-flows §5).
- Form: From/To suggestions from `places.json` via MiniSearch, plus "Search full address" (→ `/api/geocode`, only on press), and "Use my location" for From.
- The car comes from My car (inline CarPicker if none; "Change car" re-plans the same route without a new route request).
- Start % (90), threshold (15).
- Plan trip → `/api/route` → `planTrip` in the browser with `l3.json` and the car file.
- The last trip is saved (`KEYS.lastTrip`). The share link is opt-in (`?from=&to=&start=&min=`).

**3.12 Results.**
- The map: extract the style, theme and pin helpers from `ChargerMap.tsx` into a shared module rather than copying them. It shows the route line and numbered stop pins, and a pin opens `StationPanel`.
- The itinerary (side panel; bottom sheet on phones) matches the §7 layout, with totals.
- Inline warnings: estimated curve, Tesla network, charging gap, detour, and the always-on winter footer.
- The K2 disclaimer, plus the charger-data and car-data dates.
- Per stop: Open in Google Maps / Apple Maps, Open charger, and **"See the charging curve for this stop"** → `/charging?car=&trim=&kw=&from=<arrival>&to=80` (CurveViewer gains initial-SoC-window params, not saved over settings).
- km/mi follows the units setting, and all strings go in `src/i18n/en.json`.

**3.13 Cross-link.** StationPanel gets **"Plan a trip to here"** → `/trip?to=lat,lon,name`. It was hidden until now.

**3.14 Polish.** Phone layout at 375 px, dark mode, keyboard access (combobox ARIA as in CarPicker, an itinerary list as the accessible version of the map), and empty, error and busy states.

## 3d: The planner moves onto the charger map (B50, owner decision 2026-11-16, after 3.14)

The owner decided one page instead of two: the charger map gets a **"Where to?" box** (search mode → place card → **Route here** → route mode), and `/trip` is removed outright (no redirect). The planning logic (`trip-plan.ts`, `trip-car.ts`, `route-geo.ts`), the function, the itinerary content and the warnings are unchanged; the work is moving the UI.

**3.16 Docs.** B50 in `gaps-and-questions.md`; `route-planner.md` §1, §7; `charger-map.md` §5; `user-flows.md`, `overview.md`; this section; checklist items; QA.md rows.

**3.17 "Where to?" search.** Extract the From/To field from `TripPlanner.tsx` into `PlaceField.tsx`. The map gets the box at the top of its panel (top of the screen on phones). Picking a place flies the map there (about zoom 10) with a small marker and a **place card**: the name, "N fast chargers within 25 km" (counted from the loaded L3 data with the current filters), **Route here** and a close button. Escape or close clears the place.

**3.18 Route mode on the map.** `RoutePanel.tsx` replaces the filter panel while route mode is on: From (last start; "Use my location"; the location without a press only if `navigator.permissions` says it is already granted, B33), To, swap, a one-line summary of car · start % → threshold that expands to the car picker and the two numbers, **Plan route**, then the itinerary (from `TripResults.tsx`) and **Close route**. The route overlay (line, gap stretches, numbered stops, start and end; from `TripMap.tsx`) is drawn on the charger map; other pins drop to about 35 % opacity. Stop pins and "Charger details" open `StationPanel`. The station panel's "Plan a trip to here" becomes **Route here** (in place, no navigation). The last trip restores the form (no auto-plan); `/?from=…&to=…` auto-plans; the share link writes that form.

**3.19 Remove `/trip`.** Delete `src/pages/trip.astro`, the page-only parts of `TripPlanner.tsx` and `TripMap.tsx`, and the "Trip" nav item; drop unused i18n keys; update tests.

**3.20 Phone, dark, keyboard, states on the combined map.** Re-check everything 3.14 covered, now on `/`: the place card and itinerary as bottom sheets at 375 px with no sideways scroll, both themes, the box and the route form by keyboard, the empty, no-route, busy, offline and no-chargers messages, and no console errors. The plain charger map (filters, list, Locate me, station panel) must work as before.

**3.15 Independent QA.** `qa-reviewer` against the QA.md Phase 3 section, and `site-ui-checker` (formerly map-ui-checker) on the charger map with the planner (after 3.16–3.20; B50). The owner can also run `Run QA: follow docs/plan/QA.md against DESIGN-3.md and report every gap.` Fix what they find, then re-check.

## Order and delegation
Docs PR → 3.1, 3.2, 3.4–3.6 (independent, separate files; 3.1 and the logic stack 3.4→3.5→3.6 can run in parallel sessions) → 3.3 research runs alongside in the background (fill-data-gaps uses its own agents) → 3.8 owner setup can happen any time before 3.9 → 3.9, 3.10 → 3.11–3.14 → 3.7 once 3.3 is merged → 3.15. Each code PR self-merges on green CI (standing rule). Data PRs and the calibration numbers wait for the owner.

## Verification
- Each PR: `npx vitest run`, `npx astro check`, `npm run build` (the build output lists only `/api/*` as functions), and CI green.
- The function locally (`astro dev` with `.env`) and on the preview deployment: Toronto → Montréal returns a route; a repeat call is a cache hit (`x-vercel-cache: HIT`); a bad input gives 400; a forced ORS error gives `busy`.
- Browser (`voltway-dev`, desktop + 375 px, light and dark):
  - Toronto → Montréal with an Ioniq 5 plans sensible stops;
  - Calgary → Vancouver shows elevation's effect (more energy than the flat estimate);
  - a long northern route shows a charging gap;
  - a CCS car can be routed to a Supercharger only with the flag;
  - "See the charging curve" lands on the matching window and cap;
  - "Plan a trip to here" pre-fills To;
  - the share link reproduces the trip;
  - Change car re-plans without a second `/api/route` call (checked in network requests).
- Then the final QA as in 3.15.
