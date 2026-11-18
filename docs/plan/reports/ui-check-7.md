# Owner-review screenshots: [7] 7.12 (B78, US chargers and Stay within the border)

Local dev server http://localhost:4321, 2026-11-18. Dark first. Images are in docs/plan/reports/phase7/ (.jpg). The 1280 shots are captured by the browser pane at 800x500 (scaled down from 1280x800, same limit as Phase 6); the 375 shot is 375x812. No source files changed. No address searches (place-list suggestions only). One real route call (Chicago to Denver, 200 OK) and one cross-border call that the server refused (422).

| File | Shows |
|---|---|
| 1-us-zoomout-1280-dark.jpg | Lower 48 zoomed out (about zoom 3.1), Level 3 clusters across the whole US plus southern Canada. "Stations in view 20,110". |
| 1-us-zoomout-1280-light.jpg | Same view, light theme. |
| 2a-la-pins-1280-dark.jpg | Downtown Los Angeles at zoom 12, single pins and small clusters (2, 3, 4, 6, 11), "Stations in view 80". Red Tesla pins visible. |
| 2b-la-station-panel-1280-dark.jpg | Station panel for "The Elysian Apartments - Los Angeles" (EVCS, 2 x CCS1 50 kW, 2 x CHAdeMO 50 kW). Footer reads "Data: NLR AFDC · updated Nov 18, 2026" and "This station's record last changed Nov 18, 2026." (map auto-zoomed in to street level after clicking a cluster first.) No OCM station was opened. |
| 3-trip-chicago-denver-1280-dark.jpg | Trip panel, Chicago, IL to Denver, CO with a 2026 Model Y Long Range AWD (NACS): ~18 h 13 min, 1,623 km, 6 stops, route drawn across IA/NE with numbered stops 1 to 6. |
| 3b-trip-stops-end-1280-dark.jpg | Same trip, stops list scrolled to the end (Kearney, Ogallala, Brighton Superchargers, arrive Denver with 71 %). |
| 4-crossborder-toronto-chicago-1280-dark.jpg | Toronto, ON to Chicago, IL: red-tinted message "Trips that cross the border aren't supported yet. Pick a destination in Canada." |
| 4-crossborder-toronto-chicago-1280-light.jpg | Same, light theme (message is a light peach box). |
| 5-settings-border-1280-dark.jpg | Settings open: under TRIPS, "Stay within the border" switch on and dimmed (aria-checked true, aria-disabled true) with help "Trips stay in the country they start in. Cross-border trips aren't supported yet." |
| 5-settings-border-375-dark.jpg | Same panel at 375 px wide; fits, help text wraps to 3 lines. No horizontal overflow (375/375). |
| 6-level2-zoomhint-1280-dark.jpg | Level 2 ticked at about zoom 4.5: no Level 2 pins, panel hint "Zoom in to see Level 2 chargers." (text rgb 245,243,236 on 38,39,44, high contrast). |

## Anything that looks wrong
No blocking problems. Notes for the owner:
1. Trip route is partly hidden by the panel. In shot 3 the Denver end of the route and stop 6 sit right at the panel's right edge (stop 6 marker is half covered); the map fit does not seem to leave room for the 245 px trip panel. Worth a look.
2. Cross-border message wording. Toronto to Chicago says "Pick a destination in Canada." (matches the `trip.status.crossBorderCa` string). Fine, but the message appears only after pressing Plan trip; nothing warns while choosing the destination.
3. Console shows repeated "Failed to load resource: 422" errors. These come from the cross-border plan calls (`/api/route?from=-79.384,43.653&to=-87.65,41.85` returned 422). Expected status, but it shows as a red console error. Also one "Uncaught (in promise) AbortError: Transition was skipped" from a page navigation during the run (view transitions, harmless). The Chicago to Denver request showed one 200 plus an aborted duplicate (net::ERR_ABORTED), so the first call may fire twice.
4. A dark pill (the phone-style bottom nav or collapsed sheet) peeks at the very bottom centre of the 1280 map in shots 1, 1 light, 3 (partly cut off at y ~495). It looks like a sheet handle or bottom bar rendering under the viewport; check on desktop.
5. On the zoomed-out dark map the label text for Canadian places and US states is faint and small (map style, not Voltway text).
6. Level 2 power slider labels read 0, 3.8, 7.2, 11.5, 19.2 and Max, odd step values but plausible for kW.
7. "Stay within the border" is a locked-on switch, shown only by dimming. The switch looks like the other two switches except lighter; a lock icon or "always on" label would make "locked" clearer. Owner's call.
8. The map loads slowly in the hidden pane (30 s on reload). Not a product issue.

## Not checked
- OCM-sourced US station panel (only an AFDC one, in LA).
- Light versions of shots 2, 3, 5, 6 (only 1 and 4 requested). 375 light.
- Real touch behaviour.

## Storage
Cleared `localStorage` at the end (it had My car, last trip, recent destinations, map view, filters added during this run). Viewport reset to desktop and colour scheme dark.

## QA fixes re-check (2026-11-18, desktop dark, plus 375 dark for check 1)

| Check | Result | Evidence |
|---|---|---|
| 1. Tile failure banner (S3), desktop | PASS | With `fetch` stubbed to reject `/data/map/tiles/*`, opening "Stations in view" at zoom 8+ showed `role=alert` text "Some station details didn't load. Check your connection." with a "Try again" button. Colours rgb(245,243,236) on rgb(38,39,44), about 12:1. Removing the stub and pressing Try again: banner gone, list loaded ("Nevada, MO - Tesla Supercharger ..."). |
| 1. Banner at 375 dark | ISSUE (minor) | No horizontal overflow (scrollWidth 375). Banner is only 187.5 px wide, 119 px tall, 4 lines, at x 94 to 281, y 112 to 231. The "Stations in view" list panel opens on top of it, so the first lines ("Some station details") are hidden and only "didn't load. Check your connection. Try again" shows. Same contrast. |
| 2. US trip date (M2) | PASS | Chicago to Denver (Model Y LR AWD): "Charger data: NRCan / NLR AFDC and Open Charge Map · updated Nov 18, 2026". |
| 2. CA trip date | PASS | Toronto to Ottawa: "... updated Nov 16, 2026". |
| 3. Console | Mostly clean | Console buffer showed repeated 422 (Unprocessable Entity), one 404 and one ViewTransition AbortError. Both `/api/route` calls in this run returned 200, and no 4xx entries remain in the resource timing, so the 422s look like leftovers from the earlier cross-border checks. The 404 could not be traced. No errors from the tile stub or retry. |

Notes: the browser pane here is about 800x306, so at desktop the banner sits partly under the list panel and the Map key panel too. Not judged. Storage cleared, viewport reset to desktop dark.
