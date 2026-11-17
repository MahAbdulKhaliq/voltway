# UI check 4.17 Accessibility and browser check

Date: 2026-11-17. Dev server http://localhost:4321. axe-core 4.10.2 from cdnjs, tags wcag2a, wcag2aa, wcag21a, wcag21aa. Only serious/critical listed (minor/moderate counts were 0 in every run).
Done when: axe reports no serious or critical violations on every page and map state in both themes; QR checks pass at 375 px and desktop.

## Verdict: ISSUES (4)
1. axe serious: `#map-key` scrollable-region-focusable (Map key open), dark and light, 1280x800 and 375x667 (at 375x812 the key does not scroll, so no violation).
2. Charger-limit label clipped to a single "C" on /charging at 375 px (light and dark).
3. Tesla Destination (Level 2) pin: thin red T on a white disc is faint (4.04:1, stroke about 0.7 px).
4. Neighbouring pins' tags pile up at zoom 14 to about 15.5 (Level 3 only) and up to zoom 18 with Level 2 on (co-located stations).
Not reproduced: map credits overlapping the sheet at 375 (issue 1 of the brief); Charger-limit label clipped on /compare (issue 2, compare half).
Everything else: 0 serious/critical violations in all pages and states below.

## Axe matrix (serious + critical only)
| Page / state | 1280 dark | 1280 light | 375 light | 375 dark |
|---|---|---|---|---|
| Map default + Chargers sheet open | 0 | 0 | 0 | 0 |
| Plugs open | 0 | 0 | 0 | 0 |
| Stations in view list | 0 | 0 | 0 | 0 |
| Map key open | 1 (`#map-key`) | 1 (`#map-key`) | 0 (812 high; 1 at 375x667 dark) | 0 (812 high) |
| Station panel (list item) | 0 | 0 | 0 | 0 |
| "Where to?" suggestions + place card (Ottawa) | 0 | 0 | 0 | 0 |
| Car picker dialog (and its search listbox) | 0 | 0 | 0 | 0 |
| My car menu | 0 | 0 | 0 | 0 |
| Trip form | 0 | not run | not run | not run |
| Planned trip Toronto to Ottawa (folded, expanded, "How this was estimated" open, stop Details panel) | 0 | 0 | 0 | 0 |
| Trip with gap (Toronto to Winnipeg) folded, expanded, estimate open | not run | not run | 0 | not run |
| Six-stop trip (Toronto to Halifax) expanded, estimate open | not run | not run | 0 | not run |
| /cars cards | 0 | 0 (see note) | 0 | 0 |
| /cars table | 0 | 0 | 0 | 0 |
| /charging?car=Model Y (and with 150 kW charger) | 0 | 0 | 0 | 0 (with limit) |
| /compare?cars= four cars (and with 150 kW limit) | 0 | 0 | 0 | 0 |
| /about | 0 | 0 | 0 | 0 |
| 404 | 0 | 0 | 0 | 0 |

Widths: run at both widths for the map (sheet vs panel, menus) and for all other pages too (cheap), so every cell above is real except those marked "not run".
Note: the 1280 light /cars "cards" run may have been on the remembered table view; cards were re-run explicitly at 375 light and 1280 dark (0). The layout is the same component.
Overflow: `scrollWidth` equals `clientWidth` at 375 in every state (1265 vs 1280 on desktop pages is the scrollbar). Table scroll box on /cars: 955 in 808 at 1280, focusable (tabindex 0, labelled region).

### Violation
| Rule | Selector | Page/state | Theme | Detail |
|---|---|---|---|---|
| scrollable-region-focusable (serious) | `#map-key` | / with Map key open | dark and light | 1280x800: content 553 px in a 478 px box (`.map-key` has `max-height: min(60vh, 520px); overflow-y: auto`). 375x667: 490 in 489. The box has no focusable child and no tabindex, so keyboard users cannot scroll it. |

## QR checks
| QR | Result | Evidence |
|---|---|---|
| QR1 | PASS (partly checked) | `grep` of src for common old blue/teal/green hexes: none. Archivo comes from `@fontsource-variable/archivo` (own origin, `node_modules/...archivo-latin-wght-normal.woff2`, no font-host request). Page resource hosts: only localhost:4321 and tiles.openfreemap.org. Offline reload not tried. |
| QR2 | PASS | `npx vitest run tests/contrast.test.ts`: 97 tests passed. |
| QR3 | PASS | Map shows the Road Paint style on OpenFreeMap tiles in both themes; attribution reads "Chargers: NRCan / NLR AFDC, OpenStreetMap contributors, OpenFreeMap, OpenMapTiles, OpenStreetMap". Theme switch by `prefers-color-scheme` emulation followed a reload each time (live switch without reload not tried). |
| QR4 | PASS at 1280, 1024 not measured | First visit 1280x800: planner card x 21-283 top left; nav pill 708-1267 x, y 13-61 top right; Map key 1117-1228 x, Locate me 1102-1228 x (y 724-766) and zoom 1241-1270 bottom right; `elementFromPoint` at the Locate me centre returns Locate me (not covered). |
| QR5 | PASS | 375x812: planner is a bottom sheet (top 543 collapsed, 320 open, 264 with Plugs/list open), map region 543/320/264 px tall (at least 200), scrollWidth 375. 375x667: map 398 collapsed, 264 open. Keyboard opening not checked (real phone). |
| QR6 | PASS | After clearing storage: one "Where to?" search, a "Choose your car to plan trips and see chargers it can use" tile, no "Last trip", no first-load dialog, 0 `/api/route` entries. Picking a car opens a compact search (no dialog). "Just browsing" path not clicked. |
| QR7 | PARTLY | Searching "ioniq 5": "2026 Hyundai IONIQ 5 N" first; XRT, Long Range AWD and Long Range follow, each tagged "no trip planning yet" (sorted last, marked). Chosen car shows "Your car: IONIQ 5 Long Range AWD". The "Change car" message after Plan trip was not checked: the click on Plan trip was refused by the permission system, so I stopped there. |
| QR8 | PASS | Toronto to Ottawa and Toronto to Halifax: "Total trip time: ~5 h 1 min" / "~21 h 15 min" largest, then one line "451 km · 4 h 40 min driving · 1 stop · ~16 min charging". Zero stops and ten stops not tried. |
| QR9 | PASS with note | Toronto to Winnipeg (375x812 light): warning text "No fast charger your car can use for 1,965 km between London, ON - Wonderland Road - Tesla Supercharger and Morris, MB - Tesla Supercharger, and the car is not expected to make it..." sits under the totals and above "Show the stops" (folded sheet), names both places, and says "It's the dashed part of the line on the map." Dashed line on the map not inspected. Note: folded sheet was 575 px tall from y 265 so its bottom (840) was 28 px past a 812 px viewport and the warning's last line ended at 826. |
| QR10 | PASS | Each stop item is a "Stop n:" name line, an "Arrive 44 % to charge to 80 % . ~12 min" line and one "Details" button; Details opens the station panel (name as h2). Long station names not tested. |
| QR11 | not checked | |
| QR12 | PASS | "This is an estimate. Always check your car's own range..." visible when folded; "How this was estimated" `<details>` opens (296 px). Contents not read in detail. |
| QR13 | PASS (expanded) | Six-stop plan (Toronto to Halifax, 375x812): sheet 1,458 px tall expanded; 1,719 px with "How this was estimated" open (over 1,600 only when that is open). Per-stop item 124-148 px. |
| QR14 | not checked | |
| QR15 | PASS | After reload a "Last trip: Toronto, ON to Ottawa, ON  Plan again" row appears under the car tile; 0 `/api/route` entries on that page load; cleared storage shows no "Last trip". Clicking "Plan again" made the route request (resource timing lists two entries 33 ms apart for one click: `initiatorType` fetch and other; likely the same request, worth a look in the Network tab). |
| QR16 | PASS | Keyboard: focus a stop's Details, Enter: station panel opens, focus moves to its h2, the list item gets class `on` and `aria-current=true`; Escape closes the panel and focus returns to the Details button. |
| QR17 | PASS (spot check) | /cars, /charging, /compare, /about, 404 render in the new look at both widths with no overflow. Source badges on every figure not audited. |
| QR18 | PARTLY | Charging chart in new palette; estimated curve dashed with badge seen on /compare. Guides drag and km/mi switch not tested. Charger-limit label clipped, see issue 2. |
| QR19 | not checked | |
| QR20 | FAIL (1 violation) | See the violation table: Map key. Everything else passes. |
| QR21 | PASS | Hosts seen: localhost:4321, tiles.openfreemap.org. No ABRP or car-maker asset. Place and route search go through the site's own `/api/geocode` and `/api/route`. |
| QR22 | FAIL (not built yet) | Root `DESIGN.md` and `.impeccable/design.json` do not exist (that is item 4.19, not yet done). |

## Logged issues, measured
1. Credits overlap the sheet at 375 with Chargers open: NOT reproduced. 375x812 and 375x667, dark and light: attribution box 280-320 and sheet top 319.6 (812 high); 224-264 and 264 with filters/list open; collapsed 503-543 and 543. Overlap 0 to 0.4 px; `elementFromPoint` on every credit link and on a 12 px grid across the box returns the attribution itself. They touch with no gap, and the sheet has 14 px rounded top corners. If the owner still sees it, it may be on a real phone with its own browser bar or a different height; tell me the device height. One real overlap: with Map key open, the key box (160-652 at 812 high) covers the credits (all 5 links covered). That may be intended for a popover, but it hides the OpenStreetMap credit while open.
2. Charger-limit label clipped: reproduced on /charging at 375 (light `#9A3F00`, dark `#FF7A1A`). Canvas pixel scan (canvas 626 px wide at DPR 2): the label's pixels are only at x 605-625 (a single "C" glyph, cut at the canvas edge 626) at rows 192-210 beside the dashed line at rows 204-205. `CurveViewer.tsx` line 224 draws the label with the markLine default position (to the right of the line's end), so it falls outside the chart. On /compare at 375 and 1280 the label ("Charger limit 150 kW", `insideEndTop`) is fully inside: x 343-582 of 626 at 375 for limits 150 and 50 kW, not clipped. I did not reproduce a /compare clip (350 kW draws no line). Desktop /charging was not measured.
3. "Compare (3)" with a four-car link: not a counting bug. Header chip counts the saved list in storage (`voltway.compare`, 3 cars); `/compare?cars=` shows its own list of four and the page says "shared comparison. Your own saved comparison stays as it is until you change something here; then this list becomes yours." Saved list was unchanged after the visit. It reads as a mismatch though: the chip says 3 above a table of 4. (Observed on 1280 dark/light and 375 light and dark.)
4. Pins piling up in downtown Toronto: pins use `icon-allow-overlap: true` and `icon-ignore-placement: true` (`ChargerMap.tsx` lines 155-156), so neighbours never move apart. Clustering ends above zoom 13 (`clusterMaxZoom: 13`). Computed from `public/data/map/l3.json` (screen px, tag box about 36 x 30 px): Level 3 only, in the central bbox -79.45..-79.30, 43.62..43.72 there are 27 pins; pairs whose tag boxes overlap: 3 at z13.5 and 14, 3 at 14.5, 1 at 15 and 15.5, 0 at z16 and above. Worst case: Bay Street Tesla Supercharger over FLO Eaton Centre (about 5 px apart at z14); seen on screen at z14.5 (red Tesla pin on top of the yellow pin, three plug tags stacked) and clear at z16 (36 px apart vertically). With Level 2 on (389 pins in -79.42..-79.34, 43.63..43.69): overlapping pairs 1,287 / 936 / 523 / 339 / 179 at z14 / 15 / 16 / 17 / 18, with 333 / 186 / 97 / 33 / 11 pairs at the identical spot (same coordinate, so they never separate by zooming).
5. Thin red T on white Tesla Destination pin (light): reproduced at "One King West Hotel & Residence - Tesla Destination" (zoom 17.5). Fill `#F5F3EC`, T `#E82127`: ratio 4.04:1 (passes 3:1 for graphics) but the glyph is drawn at 16/24 scale, the arc stroke about 0.73 px, so it reads as a hairline. Same pin in dark theme is the white-on-red Supercharger look (white on `#E82127` is 4.49:1).

## Fix list (by severity)
1. (serious, axe) `src/components/ChargerMap.tsx` line 934: the `<section id="map-key" ...>`: add `tabIndex={0}` (it is already labelled by its h2; a `role="region"` is implicit with `aria-labelledby`). Alternative: make the contents fit. The box is `max-height: min(60vh, 520px); overflow-y: auto` in `src/styles/global.css` line 365. Re-run axe at 1280x800 and 375x667.
2. (visible bug) `src/components/CurveViewer.tsx` line 224: give the markLine label a position inside the chart, as `Compare.tsx` line 173 does: add `position: 'insideEndTop'` to the label (and keep `color: warn`). Check at 375 on /charging.
3. (map clutter) `src/components/ChargerMap.tsx` lines 148-160 and `src/lib/map-icons.ts`: pins overlap by design. Options for the owner to decide: raise `clusterMaxZoom` (14 or 15) so Toronto stays clustered until the pins separate (about z16 for L3-only); or offset co-located pins (spiderfy on click); or draw the tags only for the top pin at a spot. Not a bug per the code, so it is a design call.
4. (faint glyph) `src/lib/map-icons.ts` lines 22-27, 294-296 and `TESLA_T` (line 56): for Tesla Level 2 pins draw the T in the dark glyph colour `#1A1B1E` (15.5:1) or thicken the arc strokes in `TESLA_T`; mirror in `src/components/ChargerMap.tsx` line 171 (`PinIcon`) so the key matches.
5. (confusion, owner call) `src/components/HeaderChips.tsx` line 142: on `/compare?cars=` with a shared list the chip could show the shown count or add a hint ("saved: 3"), or the notice could point at the chip. No code change needed if the owner accepts the current wording.
6. (small) `.map-key` covers the map credits while open (all five links covered at 375): give the key a position above the credits, or accept.
7. (small) Folded trip sheet with a long gap warning is taller than a 812 px viewport (575 px from y 265, bottom 840); make sure "Show the stops" stays reachable (scroll or shorten).

## Looks off, not in the brief
- In the gap result for Toronto to Winnipeg the planner reports "No fast charger your car can use for 1,965 km" between London, ON and Morris, MB: the route evidently goes through the US, where there is no charger data. The message says so only indirectly. Worth a thought for cross-border routes.
- Ottawa place marker (red pin) sat east of downtown in the default Ottawa search, not on the city centre (seen at zoom about 11).
- One `/api/route` click produced two resource-timing entries 33 ms apart (see QR15): confirm it is one network call; the endpoint allows 30 per 10 minutes.
- Console: four "Failed to load resource: 404" errors sat in the buffer from earlier navigations (including the intentional 404 page); a fresh navigation to /cars added none. I could not attribute them.

## Could not check
- QR7 "Change car" message (Plan trip click refused by the permission system), QR11, QR14, QR19, QR18 guide dragging and km/mi, QR4 at 1024 px, QR5 on a real phone with the keyboard, QR8 zero and ten stops, offline font reload, gap dashed leg on the map, trip-form axe in light and 375, gap/six-stop states in other themes.
- Route calls used: about 7 plans (dark Ottawa, light Plan again, 375 light and dark Plan again, Winnipeg, Halifax), under the limit.

## Cleanup
localStorage cleared (all `voltway.*` keys and my helper key), viewport emulation reset to desktop, colour scheme set back to dark.

## Follow-up run (remaining QR checks)

Date: 2026-11-17. Dev server http://localhost:4321, axe-core 4.10.2 (tags wcag2a, wcag2aa, wcag21a, wcag21aa). Source tree had the `#map-key` `tabIndex={0}` and the CurveViewer `insideEndTop` label edits. `/api/route` trips planned: 3 (Toronto to Halifax with IONIQ 6 CCS-only, again with NACS switched on, and with a Model Y). The IONIQ 5 XRT trip made no call (blocked by the "Change car" message).

### Verdict: PASS (0 issues), with 3 small notes

| QR | Result | Evidence |
|---|---|---|
| QR4 at 1024 | PASS | 1024x768 first visit: planner card 12-292 x, 12-487 y (top left); nav pill 620-888 x, 20-54 y (top right); Map key 861-972 x 642-684 y; Locate me 846-972 x, 692-734 y; zoom 985-1014 x, 680-709 y. `elementFromPoint` at the Locate me centre returns Locate me. scrollWidth 1024 = clientWidth. |
| QR7 | PASS | Picked "2026 Hyundai IONIQ 5 Long Range AWD XRT" (picker tags it "no trip planning yet", sorted after the N). Home tile: "Your car: IONIQ 5 Long Range AWD XRT". "Plan a trip here" on the Ottawa card opens the Trip form with an amber box: "We can't plan a trip for this car yet: we don't have its fast-charging speed. Pick another car, or check back after the next data update." and a "Change car" button (clicking it opens the car search; no `/api/route` call). |
| QR11 | PASS | IONIQ 6 Long Range AWD, CCS1 only, Toronto to Halifax (9 stops): "Car-limited" tag on 3 stops (1, 3, 9), the note "The charger can give more power than your car takes, so the car sets the speed." appears once; no Tesla tag, no Tesla note (no Tesla stops with CCS1 only). Same car with NACS switched on in My car menu (Plan again, 9 stops): "Tesla" tag on 3 stops (Napanee, Centre Carnaval, Granite Centre), "Some stops are Tesla Superchargers. Not every Supercharger is open to other cars: check the Tesla app before you rely on one." appears once, Car-limited note once (4 tags). Model Y Long Range AWD-B (NACS), same trip, 7 stops: 0 Tesla tags, 0 Tesla note, 0 Car-limited. |
| QR14 | PASS (see note A) | Home 1024: one "Chargers" header control with no filter text; after unticking CHAdeMO the header shows an amber "1 filter on" chip and Plugs shows "3 of 4". Plugs section shows all four plugs (CCS1, NACS (Tesla), CHAdeMO, J1772 (AC only)); 2,929 stations changes to 2,917. |
| QR18 | PASS | /charging Model Y Long Range AWD-B at 1280 dark: purple "Estimated curve: no measured curve is available for this car yet." notice, dashed curve with "Estimated" label on the chart, yellow guides at 10 % and 80 %. km/mi: "Added (Highway)" ~304 km becomes ~189 mi, "Added per 10 min" ~162 km becomes ~101 mi (304 km = 188.9 mi). Guide drag: dragging the 80 % guide from x 589 to x 500 set the End slider 80 to 65 (Start unchanged 10). Charger-limit label (`?kw=150`) at 375x667 dark: orange pixels at canvas x 96-593 of 626, so no clipping; the earlier issue 2 is fixed. |
| QR19 | PASS (see note B) | i18n test passes (4 tests). No literal `aria-label`/`title`/`placeholder`/`alt` strings and no literal JSX text in `src` (grep). Live pages `/`, `/cars`, `/charging`, `/compare`, `/about`, 404: no "route", "journey", "itinerary" or "road trip" text; map UI uses "Trip", "Plan trip", "Plan a trip here", "Trip planned", "Last trip", "Plan again". Variant names: `.variant-suffix` (e.g. "-B (pre-6/11/25)", "-I") is a separate muted span (rgb 164,162,154 on dark, weight 400) beside the plain trim name. |

### Axe with the Map key open (serious/critical, all tags above)
| State | Result | Evidence |
|---|---|---|
| 1280x800 dark | 0 violations | `#map-key` tabindex "0", content 553 in a 478 px box. |
| 1280x800 light | 0 violations | same sizes. |
| 375x667 light | 0 violations | tabindex "0", content 490 in 489; scrollWidth 375. |
| 375x667 dark | 0 violations | same. |

Issue 1 of the first run is fixed. Focus ring: Tab/Shift+Tab lands on `#map-key` (SECTION) with `:focus-visible` true; outline 3 px solid #FFD400 (dark) / #6F5300 (light), offset 2 px; seen in a dark screenshot as a yellow frame around the whole key box. Tab order: Stations in view, map-key, Map key button, Locate me.

### Notes (not failures)
- A. The map's plug boxes are independent of My car (B55: the "Chargers my car can use" box is gone). With IONIQ 5 XRT chosen the map plug boxes show CCS1, NACS and J1772 ticked while the My car menu shows only NACS on (CCS1 and CHAdeMO off). That follows B55 but the two sets visibly differ, so a driver may read "CCS1 ticked" as "my car uses CCS1". Owner call.
- B. /about says "Place names for the trip planner's From and To suggestions": lower-case "trip planner" while the UI says "Trip". Probably fine.
- C. On /charging at 375 with a 150 kW limit the label "Charger limit 150 kW" now sits inside the chart but crosses the dashed curve and runs over "Estimated"; the "Power (kW)" axis title touches the "10%" guide label. Readable, a little crowded.
- D. "Where the tag says adapter needed" note and the "Tesla, adapter needed" tag did not appear for a CCS car with NACS switched on in My car (tag read plain "Tesla"), apparently because switching the plug on declares the adapter. Matches the My car text ("switch on another only if you carry an adapter"); could not make the adapter wording appear.
- E. Console after these runs: the same five 404 "Failed to load resource" entries as before (no URL given); not attributable.

### Cleanup
localStorage and sessionStorage cleared, viewport emulation reset to desktop, colour scheme dark. No source files changed.
