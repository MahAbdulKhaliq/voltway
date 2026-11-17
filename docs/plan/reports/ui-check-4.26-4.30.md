# UI check 4.26-4.30 (B55, B56)

Date 2026-11-17, dev server localhost:4321. Pane screenshots are downscaled (592 px wide at 1280), so mark detail was checked by drawing the marks with the app's own `drawMark` into a large canvas, plus 1:1 screenshots at an 800 px viewport. Passes done: 1280 dark, 1280 light (map marks and logo at 800 px), 375 dark, 375 light. Test storage cleared at the end.

**Verdict: ISSUES (1 fail, 3 minor notes)**

| Item | Result |
|---|---|
| 4.26 Ring clusters, fewer tags, NACS face | PASS |
| 4.27 Tesla pins | PASS |
| 4.28 My car plug toggles | FAIL (trip panel "Change plugs" link does not open the menu on a real click) |
| 4.29 Logo | PASS |
| 4.30 Locate on load | PASS |

## Evidence

**4.26** (dark and light)
- Cluster: dark disc, split ring. In the rendered mark (share 5 of 10) the yellow Level 3 arc starts at 12 o'clock and runs clockwise, the white Level 2 arc fills the rest, small gaps between. Share 2 gives a short yellow arc. The count is a pale text layer on the dark disc (pale on disc 15.5:1).
- Tags: on the live map, groups of 20 or more (115, 369, 106, 99, 28, 37) show no bolts or plugs. Groups of 3, 9, 10 and single pins show speed bolts and plug stacks. Map key says "Speed and plug marks show on groups of fewer than 20."
- NACS drawing (map Plugs list SVG, key, marks): wide rounded top tapering to a rounded bottom, two large top pins (r 2.7), ground pin low centre (r 1.5) plus two small PP/CP dots. Matches b54/nacs-reference.png.
- Vitest: tests/contrast, map-icons, my-car-plugs, map-filter: 155 tests pass.
- Contrast of marks against map land (dark #1A1B1E / light #EEEDE8): yellow 12.0:1 on dark; white 15.5:1 on dark; red 3.84:1 on dark and 3.83:1 on light; on light the white and yellow fills are only 1.06 and 1.22:1, but every mark has a dark #1A1B1E ring that is 14.7:1 on light land (9.6:1 on light water), so the edge carries it. Red on light water is 2.5:1, saved by the same ring.

**4.27**
- Bay Street Supercharger (Toronto, z14.5): red pin, white T, NACS tag. Dark and light.
- Canadian Appliance Source Tesla Destination (Level 2): white pin with a red T. Dark and light (light: the T is thin; red T on white 4.04:1).
- Map key lists "Tesla Supercharger" and "Tesla Level 2 (Destination)" with matching icons.
- During a trip the other marks go grey (Toronto to Ottawa screenshot). Trip Tesla mark renders grey with grey T (rendered mark check). White T on red is 4.49:1.

**4.28**
- "Pick your car" chip opens the dialog; text at the bottom: "We assume your car charges only with its own plug (no adapters). If you carry an adapter, switch that plug on in the My car menu (top right)."
- My car menu: "Plugs my car can use" with NACS (Tesla) / CCS1 / CHAdeMO switches. IONIQ 5 (2026) = NACS on, CCS1 and CHAdeMO off. Switching CHAdeMO on stored `plugs:["nacs","chademo"]` in `voltway.myCar` and it was still on after reload. Picking a different car (Model 3) reset to NACS only.
- No "Chargers my car can use" box anywhere on the map panel (page text).
- IONIQ 5 Long Range: planning shows "We can't plan a trip for this car yet" (no fast-charging curve): expected data limit, not a bug in this item.
- Model 3 Performance, Toronto to Ottawa (1 stop, Kingston Tesla Supercharger): trip panel shows "Plugs used: NACS (Tesla)" and a "Change plugs" link.
- FAIL: clicking "Change plugs" (by ref and by coordinates, twice) leaves the My car menu closed (`aria-expanded` false, no switches rendered). Dispatching the event it sends (`window.dispatchEvent(new CustomEvent('voltway:mycar-menu'))`) from script opens the menu, so the listener works. Likely cause: HeaderChips.tsx adds a document `click` listener that closes the menu on any click outside it. The same click that opened it then bubbles to the document and closes it. Menu at 375 px is inside the viewport (170 to 360 px), switch rows 176 x 36 px.

**4.29**
- Header logo: yellow rounded tile, dark road in perspective, yellow bolt centre line, 24 x 24 px, same in dark and light and at 375 px. Rendered favicon.svg at 16, 24, 32 px on dark, light and white grounds: the bolt reads at 16 px.
- public/og.png: 1200 x 630, dark Road Paint, new logo tile beside "Voltway", route line with numbered stops. Reads well.

**4.30**
- Permission 'denied' (the pane's real state): on loading / `getCurrentPosition` is never called and no error or message appears.
- Allowed path (stubbed `navigator.geolocation` and `navigator.permissions` after load but before the map finished loading; permission state 'prompt'): `getCurrentPosition` called once, the blue "you" dot appears, the map is centred on the stubbed point (Calgary). Nothing about the position in localStorage.
- Trip link `/?from=43.6533,-79.3839,Toronto,ON&to=...&start=90&min=15` (same stub): `getCurrentPosition` called 0 times, no dot, trip planned.

## Other checks
- Sideways scroll: scrollWidth equals clientWidth at 1280 (map and trip), 375 dark, 375 light.
- Console: no errors at 1280. One `Failed to load resource: net::ERR_CONNECTION_REFUSED` (no URL) appeared once at 375 light; no failed request visible in the network list. Probably a dev-server reload blip. Not reproduced.
- Network: 2 /api/route calls (one planned in the UI, one via the trip link).
- No old blue, teal or green marks. Only blue is the "you" dot.

## Issues
1. 4.28 "Change plugs" link does nothing on a real click (see above). Page: / with a planned trip, any theme and width. Expected: My car menu opens with focus on the first plug switch. Actual: stays closed.

## Looks off, not in the brief
- Overlapping tags: where several pins sit close together (Bay Street, downtown Toronto) the speed and plug tags of neighbours stack and pile on each other.
- My car plug switch rows are 36 px tall at 375 px (under 44 px touch size).
- Tesla Destination red T on the white pin is thin and small on the light map.

## Could not check
- The browser's own permission prompt (first-time allow) and a real fix; only a stubbed allowed path.
- Light desktop at exactly 1280 px: the light map, marks and logo were checked at an 800 px viewport (same desktop layout) so mark detail could be seen at 1:1.
- Exact pixel angles of ring arcs on the live map (checked on the rendered mark and in the passing unit tests).

## Fixes
1. HeaderChips.tsx: stop the opening click closing the menu (open the menu in a timeout or ignore the click whose target is the trip panel's Change plugs button, or `stopPropagation` in the RoutePanel click handler).
2. Optional: raise plug switch rows to 44 px on phones; stagger or hide tags when neighbouring pins overlap.

## Fixes after this check (main session, 2026-11-17)
- **4.28 "Change plugs" fixed:** `HeaderChips.tsx` now opens the menu on the next tick (the asking click no longer reaches the click-outside listener), and focus waits until the switches are enabled (the car file loads first). Re-checked with a real click: the menu stays open with 3 switches, focus on the first switch.
- **Plug switch rows** are 44 px tall at ≤ 640 px (`global.css`).
- Not changed (optional, logged for 4.17): tags of neighbouring pins piling up downtown; the thin red T on the white Destination pin on the light map (4.04:1, passes 3:1).
