# Phase 8: Cross-border trips (B79)

Status: **approved, 2026-11-18.** The owner asked for cross-border trips in chat and chose each option below (AskUserQuestion, 2026-11-18): the switch becomes a real toggle, **on by default**; a trip that crosses may stop in **both countries**; a crossing trip gets a **note and a "Border crossing" row** in the itinerary.

## Why
Phase 7 (B78) kept every trip inside the country it starts in and listed cross-border trips as "later, needs its own decision" (DESIGN-7, Out of scope). Drivers do go Toronto → Detroit, Vancouver → Seattle, and the Lower 48 → Alaska through Canada. The data (chargers and places in both countries) is already there.

## What changes for the visitor
- **Settings:** **Stay within the border** stops being locked. It stays **on by default**, so nothing changes until a visitor turns it off. The choice is kept in the browser with the other route options (B73).
  - On (default): today's rule (B78). Same-country trips only; routes never leave the country (`avoid_borders: "all"`).
  - Off: a trip may start in Canada or the US and end in either. The route may cross the border wherever the road goes, including the Lower 48 ↔ Alaska through Canada and a same-country trip that is shorter through the other country (Detroit → Buffalo through Ontario).
  - Help text: "On: trips stay in the country they start in. Off: trips may cross between Canada and the US."
- **With the switch on,** a cross-border trip's message now says how to allow it:
  - "This trip crosses the border. Pick a destination in Canada, or turn off Stay within the border in Settings." (and "…in the US…")
  - Alaska: "This trip would pass through Canada. To plan it, turn off Stay within the border in Settings."
  - The message has a **Settings** button that opens Settings at the route options (as the price link does).
- **A trip that crosses the border** (switch off) shows:
  - a **note** under the trip summary: "This trip crosses the Canada–US border. Bring a passport or other entry documents and allow time at the crossing.";
  - a **Border crossing** row in the itinerary, in route order between the stops: "Border crossing · into the US near Port Huron, MI" (the nearest listed town on the far side; without a town, just "into the US"). One row per crossing; Alaska trips have two.
- **Stops:** the planner may choose chargers in **either country** the route passes through. A route that stays in one country (no crossing) still keeps its stops in that country, as today (QA 2026-11-18, S1).
- A start outside both countries still gets `outsideArea`; with crossing allowed, a destination outside both gets "Trips are supported in Canada and the US. Pick a destination in one of them." (`crossBorder` with no country; QA 2026-11-18).
- **Address search** ("Search full address", B78 D5) stops limiting results to the start's country when the switch is off, since the destination may be in either (QA 2026-11-18).

## B1. The route request
- `src/lib/route-options.ts`: `RouteOptions` gains `crossBorder: boolean` (false = Stay within the border on). Anything but `true` reads as false, so a damaged entry never allows crossing by surprise.
- `/api/route` takes `border=cross` (absent = stay within, the default; any other value → 400). It is part of the URL, so the CDN caches the two kinds of route apart. The trip key (`endsKey`) includes it, so changing the switch re-plans a shown trip (as tolls/highways do).
- `src/lib/ors.ts`:
  - `borderProblem(from, to, countriesOf, cross)`: with `cross`, only `outsideArea` (either end in neither country); without it, as today.
  - `routeBody(…, cross)`: no `avoid_borders` with `cross`.
  - **Crossings:** with `cross`, the response gains `crossings: { i, to }[]`, where `i` is the index in `coords` where the route enters country `to`. Found by checking every 10th route point (about 2 km apart; checking every point took ~4 s on a 6,000 km route) and taking the country of each point that is in exactly one country; where two such samples differ, the points between them are checked to find the exact crossing. A visit to the other country shorter than the sample step can be missed (QA 2026-11-18); that is rare on a trip route. `src/lib/country.ts` also skips outline segments too far away to matter (same answers, checked on 62,822 points). Points within the 0.5 km border slack (in both) are skipped, so a road along the border doesn't flap.
  - `countries` becomes **the countries the route passes through** (union of single-country points; both ends' countries when there are no such points). Same-country routes give one country (stops filtered as today); crossing routes give both (no filter, `inTripCountries`).

## B2. The trip panel
- `useTrip.ts`: sends `border=cross` when `opts.crossBorder`; keeps `crossings` in `RouteData`.
- `Itinerary.tsx`:
  - the note (`trip.border.note`) as a `banner small` under the summary when `crossings.length > 0`;
  - a `ti-border` row per crossing, placed by its distance along the route (from the route's cumulative km at index `i`) among the stops;
  - the town: nearest place in the entered country within 40 km (`NEAR_PLACE_KM`), else just the country, from the GeoNames lists (`places-ca.json`, `places-us.json`, loaded through the shared PlaceField store when a trip crosses); label as in place search.
- Drive mode (B72) is unchanged: Google/Apple Maps choose their own route.

## B3. Words and docs
- `en.json`: `settings.inBorderHelp`, `trip.status.crossBorder*` (above), `trip.status.openSettings`, `trip.border.note`, `trip.border.row` ("Border crossing"), `trip.border.into` ("into {country}"), `trip.border.near` ("into {country} near {place}"), `trip.border.ca` / `trip.border.us` ("Canada", "the US").
- `route-planner.md` and `gaps-and-questions.md` B79; DESIGN-7 "Out of scope" points here.

## Known limits (QA 2026-11-18)
- A crossing trip shows the Canadian charger-data date only (the US date shows on US-only trips, B78); logged as tech debt.
- An end inside the 0.5 km border slack (downtown Detroit, Windsor) can hide a crossing on a route that stays in the slack after crossing; real routes cross well before the end in the trips checked.

## Out of scope
- Entry rules, wait times or crossing hours: the note only reminds the driver.
- Currency and units by country (still one price per kWh and km/mi from Settings).
- Mexico and other countries.

## Risks
- ORS may pick a crossing the driver wouldn't (a closed or seasonal crossing). The row names the town so the driver can see it; Drive mode lets Google/Apple Maps re-route.
- A route along the border (QEW at Niagara, I-5 at Blaine) may touch the slack zone without crossing: those points are skipped, so no false crossing; a real crossing still has single-country points on both sides.
