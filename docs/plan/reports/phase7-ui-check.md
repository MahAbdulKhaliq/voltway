# Phase 7 UI check: items 7.7, 7.8, 7.9 (B78)

Run 2026-11-18 on the local dev server (port 4321). **Verdict: PASS for the numbered checks, with 4 small issues (none blocking).**

Setup notes: `npm run dev` runs `predev` (data:build), so the map data was rebuilt on server start (o3 564 KB, o2 1503 KB, 381 L3 / 535 L2 tiles, matching the committed sizes). Map position set through localStorage `voltway.mapView` and a reload; requests read from `performance.getEntriesByType('resource')`. The hidden Browser pane draws the base map slowly (20-30 s). Test car: 2026 Hyundai IONIQ 5 N, NACS + CCS1. Storage cleared and viewport reset at the end.

## Results

| # | Check | Desktop dark | Desktop light | 375 light | 375 dark | Evidence |
|---|---|---|---|---|---|---|
| 1 | Pins, clusters, panel, tile requests at 4 places | PASS | PASS (zoom 6 clusters over Michigan/Ontario) | PASS (Detroit: pins, L2 pin opened) | PASS (Detroit) | see 1 below |
| 2 | Level 2 hint, o2.json at zoom 7 | PASS | PASS (hint shows, no o2, hint contrast 16.35) | PASS (o2 loaded at zoom 11, L2 pins shown) | n/a | see 2 |
| 3 | Stations in view | PASS | not repeated | not repeated | PASS (50 rows, 0 blank) | see 3 |
| 4 | Trips and messages | PASS | not repeated | PASS (cross-border msg, contrast 14.03) | PASS (msg 13.36) | see 4 |
| 5 | Settings (map and /cars) | PASS | PASS | PASS | PASS | see 5 |
| 6 | Console | PASS | PASS | PASS | PASS | only expected 422 resource lines (see 6) |

No horizontal overflow in any pass (scrollWidth equals clientWidth at 1280 and 375; /cars at 1280 is 1265 = 1265, scrollbar).

### 1. Map at four places (desktop dark; zoom 11, Montana 9.5 and 7.5)
| Place | Pin opened | Map-data requests |
|---|---|---|
| Toronto | GreenP CP29: name, address, 1 x CCS1 50 kW + 1 x CHAdeMO 50 kW, "Data: NRCan / NLR AFDC, updated Nov 16, 2026" | o3.json, tiles/index.json, meta.json, tiles/3/50-66.json |
| Detroit (+ Windsor) | Trumbull Ave Mobil (US): CCS1 480 kW, NACS 480 kW, same source line | o3, index, meta, tiles/3/48-66.json |
| Los Angeles (218 in view) | Alhambra Tesla Supercharger: 12 x NACS 250 kW, Tesla note | o3, index, meta, tiles/3/30-62.json, tiles/3/30-61.json |
| Rural Montana (47.06,-109.43) | zoom 9.5: 0 stations in view (empty map is right, no tiles). Zoom 7.5: 2 in view (Great Falls); Great Falls Subaru opened from the list | o3, index, meta, tiles/3/34-68.json |

Pins and clusters show in both countries. o2.json never loads with Level 2 unticked. No tile was fetched twice (zoom-7 list view: 15 tile requests, 15 unique). No continent-wide fetching: at most 15 tiles for a 7 x 3.5 degree view.

### 2. Level 2 hint
Zoom 5, tick Level 2: "Zoom in to see Level 2 chargers." shows, no o2.json. Zoom 6: same. Zoom 7: o2.json requested, hint gone, white Level 2 pins drawn. PASS.

### 3. Stations in view
Zoom 7 near the SD/ND line: right after switching on, "Loading stations..." and 0 rows; about 4 s later 50 rows, all named, 0 blank (9 L3 + 6 L2 tiles). 375 dark Detroit: 50 rows, 0 blank. Montana: 2 named rows.

### 4. Trips (methods: Toronto → Ottawa by share link; US trips: destination from a station panel "Plan a trip here" or the Stations in view list, start from "Use my location" with `navigator.geolocation` stubbed, not real location; place search cannot pick US places yet, 7.10)
| Trip | Result | Evidence |
|---|---|---|
| Toronto → Ottawa | PASS: 453 km, 4 h 43 min, 3 stops (Trenton Tesla, Gananoque Tesla, Canadian Tire 290) | 1 /api/route; corridor tiles 50-67, 51-66, 51-67, 52-67 after the route (49-66, 50-66 came from the map view) |
| Chicago → Aurora CO (Denver) | PASS: 1,639 km, 11 stops. "Planning..." (button busy) first, then the card about 1.5 s later | 1 /api/route; 14 tiles under tiles/3/, all unique; no tiles/2, no o2 |
| Toronto → Detroit | PASS: "Trips that cross the border aren't supported yet. Pick a destination in Canada." | /api/route 422; only the pin tile 48-66, no corridor tiles |
| Seattle → Anchorage | PASS: "This trip would pass through Canada. Cross-border trips aren't supported yet." | 422 |
| Monterrey, MX → Anchorage | PASS: "Trips are supported in Canada and the US. Pick a start in one of them." | 422 |

curl on /api/route: Seattle→Anchorage 422 `crossBorder` reason `alaska`; Monterrey→Detroit 422 `outsideArea`; Detroit→Toronto 422 `crossBorder` country `us`; Seattle→Spokane and Anchorage→Fairbanks 200.
Not run in the UI: Hamilton → Vancouver (same stops as before Phase 7) and Anchorage → Fairbanks (7.8 Done-when); the API accepts the latter. No "US destination in the US" message variant (crossBorderUs) was seen on screen: Detroit→Toronto from the API returns country `us`, but I only drove the Canada one in the UI.

### 5. Settings
Map page and /cars, all four passes: "Stay within the border" switch is `aria-checked=true`, `aria-disabled=true`; help text "Trips stay in the country they start in. Cross-border trips aren't supported yet." Contrast: help 5.83 dark, 7.21 light; label 13.4 dark, 16.35 light. At 375 the panel spans x 78-366 (inside 375), switch row 44 px high, help wraps to 3 lines without clipping.

### 6. Console
Errors only: "Failed to load resource ... 422" for each deliberate cross-border/outside request (the browser logs every non-2xx fetch), and one `Uncaught (in promise) AbortError: Transition was skipped. New ViewTransition started` (see issue 4). No other errors on map or /cars.

## Issues
1. **Trip share links reject US places (likely 7.10 scope).** `readEnd` in `src/lib/trip-link.ts` only accepts lat 40-84 and lon -142 to -50. `/?from=41.88,-87.63,Chicago&to=39.74,-104.99,Denver` keeps Chicago but silently drops Denver (lat 39.7); Anchorage (lon -149.9) and Los Angeles (lat 34) would be dropped too. Saved-trip reading (`readSavedTrip`) uses the same function.
2. **Detail tiles for single pins do not load on first paint at zoom >= 9.** On a fresh load at zoom 10 over Toronto, no tiles/3 request was made until the map moved (the effect at ChargerMap.tsx ~line 626 runs before the pins layer has rendered features). Opening a pin still works (tile loads on click), so only the "opening is instant" benefit is missing on first view.
3. **Stale "From" text after "Plan a trip here".** Open `/?from=41.8781,-87.6298,Chicago` (From shows "Chicago"), open a station, click "Plan a trip here": the From field still reads "Chicago" but Plan trip is disabled (from is empty in state). Using "Use my location" fixes it. Probably pre-existing (`start({to})` resets `from`), but it now matters more for US starts.
4. **Uncaught AbortError "Transition was skipped. New ViewTransition started"** logged once when my script opened a list row and then Plan a trip within about 2 s. Likely harmless (view transitions overlapping on fast input), but it is an uncaught promise.

## Looks off, not in the brief
- Attribution control reads "Chargers: NRCan / NLR AFDC | OpenStreetMap..." everywhere, with no Open Charge Map credit for the US stations that came from OCM (7.11 covers credits). At 375 px the attribution opens expanded by default and covers the bottom of the map above the sheet.
- At 375 px the station panel's address line scrolls sideways (nowrap, clipped, text moves) and the panel is narrower than the screen (about 250 px of 375); looked mid-animation and I did not confirm it settles.
- Cars page filter still says "Sold in Canada only" (expected until 7.11; the car list stays Canadian).

## Not checked
- Real geolocation (stubbed instead, as stated).
- Hamilton → Vancouver and Anchorage → Fairbanks through the UI; place-search picks of US cities (7.10 not built).
- Light theme and 375 light/dark were checked for look, layout, contrast and the cross-border message, but not repeated for every place, trip and the Montana case.
