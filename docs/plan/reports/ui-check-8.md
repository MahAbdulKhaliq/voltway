# UI check: Phase 8 (B79 cross-border), commit 9853647

**Verdict: PASS after re-check** (ISSUE 1 fixed, see "Re-check after fix" at the end).

Checks QB4-QB8 on the dev server. Results appended below as the run goes.

| Check | Result | Evidence |
|---|---|---|
| QB4 | PASS | desktop+375, dark+light; see log |
| QB5 | PASS | Buffalo and Anchorage messages and button |
| QB6 | PASS (after fix) | note, rows with town, order verified |
| QB7 | PASS | Toronto-Ottawa no note, no rows |
| QB8 | PASS | border=cross only when off |

## Log

### QB4 Settings (done)
- Fresh localStorage: border switch `aria-checked=true` (default ON). Clicking it set `voltway.routeOptions` to `{"avoidTolls":false,"avoidHighways":false,"crossBorder":true}`; after a reload the switch was still off. PASS.
- Help text exact: "On: trips stay in the country they start in. Off: trips may cross between Canada and the US." PASS.
- Focus (Tab from Avoid highways): 3px solid rgb(255,212,0) outline around the row, same row markup/classes as tolls/highways. Switch track edge vs panel: dark 3.97:1 (desktop and 375), light 4.93:1 (>=3). Help text: dark rgb(164,162,154) on rgb(38,39,44) = 5.83:1; light rgb(85,84,78) on rgb(250,249,245) = 7.21:1.
- No horizontal overflow: 1280 (1280/1280), 375 (375/375), both themes. Help text wraps to 3 lines at 375 inside the panel (x 95-315), not clipped.
- Screenshots: phase8/qb4-settings-1280-dark-focus.jpg, qb4-settings-1280-light.jpg, qb4-settings-375-light.jpg, qb4-settings-375-dark.jpg
- Observation (not in brief): after switching Theme in Settings the map tiles kept the old theme for several seconds (dark UI over light tiles at 375; light UI over dark tiles at 1280). May be the existing map-theme lag, not Phase 8.

### QB5 Messages, switch ON (Toronto -> Buffalo) (done, 1280 dark)
- Trip Toronto, ON -> Buffalo, NY with the switch on: `GET /api/route?from=-79.384,43.653&to=-78.878,42.887` -> 422 (no `border=cross`). Banner (`banner small`): "This trip crosses the border. Pick a destination in Canada, or turn off Stay within the border in Settings. Open Settings". Text rgb(245,243,236) on rgb(58,34,16) = 13.36:1; button text rgb(255,212,0) on same = 10.36:1. No overflow (1280/1280). PASS (text exact).
- "Open Settings" is a BUTTON, 91.6 x 21 px (small target). Click opens the Settings popover and focuses the border switch (`document.activeElement` = `button[role=switch]` "Stay within the border", aria-checked=true). The 3px focus ring is not drawn after a mouse click (outline none), only after keyboard use (Space showed the ring). Minor.
- Space on the focused switch turned it off, banner cleared.
- Screenshots: phase8/qb5-toronto-buffalo-on-1280-dark.jpg, phase8/qb5-toronto-buffalo-on-1280-dark-open-settings.jpg

### ISSUE 1 (blocking QB6): a crossing trip crashes the whole map UI
- Switch OFF, Toronto -> Buffalo, press Plan trip. `/api/route?...&border=cross` returns 200, then the page goes blank except the header (map, panels gone). Reproduced twice (including after a fresh reload).
- Console: `Uncaught TypeError: Cannot read properties of null (reading 'trim')` at `search` (place-search.ts) <- `basicStateReducer` <- `RoutePanel`.
- Cause (from reading the code, not fixing): `src/components/RoutePanel.tsx` line 101, `loadUsPlaces().then((s) => alive && setBothPlaces(s), ...)`. `s` is the PlaceSearch, which is itself a function, so React's `setState` treats it as an updater and calls it with the previous state (`null`), and `search(null)` throws on `.trim()`. Fix idea: `setBothPlaces(() => s)`.

### QB7 Toronto -> Ottawa, switch OFF (done, 1280 dark)
- Request `/api/route?from=-79.384,43.653&to=-75.697,45.421&border=cross` -> 200. Plans: 453 km, 1 stop "Gananoque, ON - Tesla Supercharger" (Canada). No `.ti-border` rows, no note text ("passport" absent). No overflow (1280/1280). PASS. Screenshot: phase8/qb7-toronto-ottawa-off-1280-dark.jpg
- Not run: Detroit -> Buffalo (not in the caller's list).

### QB6 Toronto -> Detroit, switch OFF (WORKAROUND needed because of ISSUE 1)
- Because the trip panel crashes whenever a crossing has to load the US place list (ISSUE 1), I opened the trip from a share link (`/?from=43.653,-79.384,Toronto, ON&to=42.331,-83.046,Detroit, MI&start=90&min=15`) and, after load, replaced `window.fetch` so `places-us.json` requests are rejected. The town lookup then fails silently (RoutePanel ignores the rejection) so the rows fall back to "into the US" with no town. I could NOT see the "near <town>" wording working in the browser.
- Request `/api/route?from=-79.384,43.653&to=-83.046,42.331&border=cross` -> 200. 386 km, 1 stop "Comber, ON - Tesla Supercharger" (Canada, at 326 km). Panel: note `p.banner.small.ti-border-note` "This trip crosses the Canada–US border. Bring a passport or other entry documents and allow time at the crossing." under the summary and Drive button. Itinerary `li` order: Toronto (ti-start), Comber stop (ti-stop), "Border crossing · into the US" (ti-border), Detroit (ti-finish). Row 335 x 36 px at 1280, 347 x 36 px at 375. Mark: `span.ti-mark.ti-border-mark`, 10px square rotated 45deg (diamond).
- Contrast: dark note rgb(245,243,236) on rgb(58,34,16) 13.36:1; dark row text 13.42:1; dark diamond border rgb(245,243,236) on rgb(38,39,44) fill = 13.42:1. Light note rgb(26,27,30) on rgb(255,227,204) 14.03:1; light row text 16.35:1; light diamond border rgb(26,27,30) on rgb(250,249,245) 16.35:1. All pass.
- No horizontal overflow: 1280 dark/light 1280/1280; 375 light and dark 375/375, panel scrollWidth = clientWidth.
- Drive mode opens (desktop dark): "Next stop - 1 of 1 / Comber, ON - Tesla Supercharger", Google/Apple Maps buttons, list Toronto / Comber / Detroit (no border row in Drive, as designed). PASS.
- Phone: the itinerary is behind "Show stops" (button label is "Show stops", not "Show the stops"); the note shows above it. Rows verified after opening.
- Theme passes: 375 dark was produced by switching `data-theme` to dark in the page and emulating dark (no reload, to spare the routing allowance), so the map tiles stayed light in that shot.
- Not seen: stops in the US. With a NACS-only Model Y the planner chose one Canadian stop; "stops may be in either country" is untested here.
- Screenshots: phase8/qb6-toronto-detroit-1280-dark.jpg, qb6-toronto-detroit-1280-light.jpg, qb6-toronto-detroit-375-light.jpg, qb6-toronto-detroit-375-light-note.jpg, qb6-toronto-detroit-375-dark.jpg
- Note: Toronto -> Buffalo (switch OFF) cannot be viewed at all because of ISSUE 1 (the request itself returned 200 with border=cross). ORS calls used so far for Buffalo: 3 (two repro attempts plus the switch-on 422).

### QB5 Anchorage -> Seattle, switch ON (1280 dark, opened from a share link)
- `GET /api/route?from=-149.9,61.218&to=-122.332,47.606` (no border param) -> 422. Banner: "This trip would pass through Canada. To plan it, turn off Stay within the border in Settings. Open Settings". Text 13.36:1 on rgb(58,34,16); button 21 px tall. Open Settings click focuses `button[role=switch]` "Stay within the border" (aria-checked=true); Space turned it off. PASS. Screenshot: phase8/qb5-anchorage-seattle-on-1280-dark.jpg
- This also covers the QB8 "shared crossing trip opened with the switch on shows the message with the Settings button" (the trip came from a share link).

### QB6 Vancouver -> Seattle, switch OFF (1280 dark; 375 light layout only)
- Needed the same fetch workaround as Detroit. `/api/route?from=-123.121,49.283&to=-122.332,47.606&border=cross` -> 200. 229 km, 0 stops. Note shown; itinerary: Vancouver (ti-start) / "Border crossing · into the US" / Seattle (ti-finish). Diamond mark visible. No overflow 1280 and 375 (375/375; theme switched in page, no reload). Screenshot: phase8/qb6-vancouver-seattle-1280-dark.jpg
- Vancouver 375 dark and light screenshots not taken separately (same markup as Detroit, which was checked in all four passes).

### QB6 Anchorage -> Seattle, switch OFF (1280 dark, fetch workaround)
- `/api/route?from=-149.9,61.218&to=-122.332,47.606&border=cross` -> 200. 3,648 km, 5 stops. Itinerary order: Anchorage / Stop 1 ReCharge Alaska - Subway / "Border crossing · into Canada" / Stop 2 Four Rivers Co-op / Stop 3 Quesnel, BC / Stop 4 Cache Creek, BC / Stop 5 Chilliwack, BC / "Border crossing · into the US" / Seattle. Two rows, in order (Canada first, then the US), both with a diamond mark, 335 x 36 px; stops in both countries (Alaska stop 1, BC stops 3-5). Note present. PASS (town wording not checkable, see below). Screenshot: phase8/qb6-anchorage-seattle-1280-dark.jpg
- Not in the brief: this trip shows "car may not make it" banners with a 2,356 km no-charger gap between stops 1 and 2 (Model Y, NACS only), and the trip total is ~48 h 47 min. Looks like data/planner limits, not Phase 8.

### QB8 Cache and share
- With the switch ON: `/api/route?from=-79.384,43.653&to=-78.878,42.887` and `...Anchorage...` (no `border`). With the switch OFF: every route URL ends `&border=cross` (Toronto-Buffalo, Toronto-Ottawa, Toronto-Detroit, Vancouver-Seattle, Anchorage-Seattle). No other value seen. PASS.
- A shared crossing link opened with the switch on shows the message plus Open Settings (Anchorage link, above). PASS.
- Side effect: page loads and toggling re-request the same URL; each trip-link load shows two identical requests (one `ERR_ABORTED`), so repeated loads cost the routing allowance (dev server, no cache). Calls used in total: Buffalo x3 (one 422), Ottawa x1, Detroit x3, Vancouver x1, Anchorage x4 (two 422, plus the reload pair).

### Console (all from this run)
- ViewTransition AbortError "Transition was skipped. New ViewTransition started": known.
- `Failed to load resource ... 422`: expected, from the switch-on blocked trips.
- `Failed to load resource ... 404` (twice): source not identified (I did not log URLs); not seen to affect the page.
- `Uncaught TypeError: Cannot read properties of null (reading 'trim')` (RoutePanel/place-search): ISSUE 1, new in Phase 8.

## Could not check
- The "near <town>" wording (e.g. "Border crossing · into the US near Port Huron, MI"): ISSUE 1 stops the places list reaching the panel, so I blocked it and only saw the fallback "into the US". Once ISSUE 1 is fixed, re-check Toronto -> Detroit/Buffalo for the town text.
- Toronto -> Buffalo with the switch off (crashes, ISSUE 1). Detroit -> Buffalo (not on the allowed list).
- Stops in the US for a Canadian start (none were chosen for Toronto-Detroit or Vancouver-Seattle with this car).
- Geolocation, keyboard Tab order across the new row, and the production site.

## Re-check after fix (ISSUE 1, `setBothPlaces(() => s)`), switch OFF, no fetch workaround
- Toronto -> Buffalo (share link, car picked, 1 plan: `/api/route?from=-79.384,43.653&to=-78.878,42.887&border=cross` -> 200): no crash, no new console TypeError (the TypeError entries still listed are the three earlier crashes with stale `?t=` URLs). Note present. Itinerary: Toronto / "Border crossing · into the US near Buffalo, NY" / Buffalo, NY (0 stops, 159 km). Town sensible (the row wraps to two lines at 1280 and 375). No overflow (1280/1280, 375/375). PASS.
- Toronto -> Detroit (1 plan: `...&to=-83.046,42.331&border=cross` -> 200): no crash. Note present. Itinerary: Toronto / Stop 1 Comber, ON / "Border crossing · into the US near River Rouge, MI" / Detroit, MI. Town is in the Detroit area; position between the last stop and the destination is right. No overflow at 375 (375/375). PASS.
- ISSUE 1: FIXED. QB6 now PASS for these two trips (Vancouver and Anchorage not re-run).
- Remark: the Toronto -> Buffalo trip has the crossing as its last point, so the row says "near Buffalo, NY", the same as the destination; fine, not a bug.
- Screenshots: phase8/recheck-toronto-buffalo-1280-dark.jpg, recheck-toronto-buffalo-375-dark.jpg, recheck-toronto-detroit-1280-dark.jpg, recheck-toronto-detroit-375-dark.jpg
