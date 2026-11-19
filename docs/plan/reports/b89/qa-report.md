# B89 map fixes: QA report (browser run, 2026-11-19)

Run on the dev server (localhost:4321), uncommitted branch feat/b89-map-fixes. Widths 1280x800 and 375x812. Dark and light both covered for: map list/key/credits, trip planner, car picker. No screenshots were saved (the browser tool returns images but cannot write PNG files); measurements below are from the DOM and computed styles.

## Results

| ID | Result | Evidence |
|----|--------|----------|
| QZ1 | PASS (dark map checked by style + a look at the render; light checked by style only) | Road-name layers have text-transform none, Noto Sans Bold; street names render in proper case ("Bloor Street West", "Queen's Park Crescent West"). Dark shield layers use icon `vw-shield-dark` (image registered), text #D8D6CD on badge #3F4046 = 7.09:1; a "403" shield seen as a dark rectangle. Light theme keeps the sprite's own shield icon expressions. Water labels italic. Dark road names #A4A29A on land = 6.74:1. |
| QZ2 | PASS | Row click (180 kW station): one flyTo, zoom 15, offset [-30,0], duration 604 ms; charger sits mid-map clear of the right panel. Back (map untouched) flew back to zoom 12.2 / earlier centre in 777 ms. After dragging the map, Back made no flight back (stayed at zoom 15). Animations off: flyTo duration 0 for open and for Back. Far flights: trip stop to border logged a 1100 ms flyTo (cap 1100 ms, source min(1100, ...)); never a jump cut. Note the cap is 1.1 s, a hair over "about 1 s". |
| QZ3 | PASS (partial: keyboard not exercised beyond element roles) | Stop buttons have names ("Stop 1, Milton, ON - Tesla Supercharger: show it on the map", border "Show this border crossing on the map", start/finish "Toronto, ON: show it on the map"). Click stop -> flyTo zoom 15 and details open; no Details button. Detail panel chevron "Back" and a second tap on the same stop both fit the whole route (fitBounds plus flyTo zoom 7.24, 600 ms). Border click flies to the crossing (-83.105, 42.292) zoom 15. Start and finish flies to those places. Stop rows: 3 bolts + "325 kW", then "Car-limited", then Tesla; 50 kW stop shows 1 bolt. Animations off: duration 0. 375: tapping a stop on the card keeps the sheet top at 406 (half), tapping the map mark at peek keeps top at 612; the spot shows above the sheet (at y 379 and y 408 respectively, sheet top 406 and 612). |
| QZ4 | PASS | Marks (start, 1, 2, border diamond, finish) all centred at the same x (41 at 1280, 28 at 375). Selected card gets a yellow outline. Contrast sweep over the whole trip panel: 0 text below 4.5:1 in dark 1280, light 1280, dark 375, light 375. "How this was estimated" unrolls: heights 72 -> 369 over about 300 ms, dashed lane line and chevron visible; instant with Animations off (369 at once; closes at once). No horizontal overflow (scrollWidth = clientWidth at both widths, panel 378/378). |
| QZ5 | PASS (partial) | Closing after zooming into a stop: fitBounds + flyTo back to zoom 7.24 centred on the route (bounds -85.06..-79.10 / 41.54..44.27 contain the route). Closed with the trip layers emptied. I could not observe the "line draws back" animation (screenshots are single frames); closing at the overview not run separately. |
| QZ6 | PASS | 375: with no trip, peek shows only "Where to? | Plan"; sheet scrollHeight 78 = clientHeight 78, no inner scroller. Tapping Where to: sheet stays at peek (top 733, class peeked); typing "Mont" raises it (top 72). Trip: drag down gives `route-peek` (top 612), route-body overflow hidden, touch-action none, scrollTop 0. Mouse wheel on the sheet at peek raised it to half (top 406). Scrolled body to 150 at half, dragged down: back at peek with scrollTop 0. Trip form: at peek the car tile has `inert` (self and ancestor), not inert at half. Not testable: real touch swipe (used mouse drag and wheel); a trip plan card (as opposed to the form) has no car card to be inert. |
| QZ7 | PASS | Car accordion: aria-expanded false -> true, fields (Battery at the start %, Stop to charge at %), "Plugs used" as a list (`ul.route-plug-list` with a plug svg), "Change plugs" link, "Change car" row inside. Closing heights go 278,148,97,90,90,90,87,85 (only shrinks). Opening 85->278 with a 1 px overshoot (278 then 277), no flicker. Edited start 40 -> 55: kept after close/open and shown in the summary ("Start 55 % · charge at 15 %"). Contrast sweep clean. Animations off was only checked for the credits and trip accordion (instant), not for the car accordion; the "% values grow into the fields" effect was not observable in static samples. |
| QZ8 | PASS with one issue (see Issue 1) | Header trip "Change car" (desktop dark, light; 375 dark) and Compare "Add a car" (375 light): Overpass Variable title, search icon, suggestions as a menu list ("2026 Hyundai IONIQ 9 · Standard", ...), numbered steps on one raised panel (numbers filled yellow once chosen, outlined when empty at /compare), select menus (appearance base-select), plug rows with drawings (3 svgs) and toggles, action bar pinned at the foot (bottom 787 of dialog bottom 788; 799 of 800 at 375). Escape and Cancel close. Picking Hyundai / IONIQ 5 / 2026 / Long Range enabled "Add to Compare" (not clicked). Contrast sweep clean in dark and light (placeholder 7.21:1). No overflow. |
| QZ9 | PASS (auto-locate on reload not testable) | Stations in view with Level 2 on: Level 2 rows show a plug mark (`speed-mark l2`, one path, muted colour 164,162,154), no bolt; fast rows show bolts before the kW: 50/62.5 kW -> 1 bolt, 180 kW -> 2 bolts, 325 kW -> 3 bolts. Map key rows use bare bolts (1, 2, 3 paths) labelled "Under 150 kW / 150-250 kW / 250 kW and up". SPEED_LIMITS = [150, 250]. Bolt contrast: key bolts 13.42 dark, 16.35 light; list bolt accent #6F5300 on #FAF9F5 6.84 light; on the light trip-card fill 5.61. Credits: "About Voltway" first, links to /about; ⓘ stays at bottom right (button right edge 1269 in open and closed states); open: clip-path inset runs from the ⓘ corner, 460 ms, curve cubic-bezier(.45,0,.25,1) (progress about 5% at 46 ms, 49% at 171 ms, 99% at 421 ms: ease-in-out, smooth, no pop); close 320 ms, ease-out; box width constant 891 (no reflow). Animations off: no clip-path, state changes at once. Credits contrast 13.42 dark, 16.35 light. Locate me: "Finding your location…" with the road loader; at 1280 it sits bottom centre, not hidden by the open list panel; at 375 it is at y 627-669, above the ⓘ row (697) and the sheet (733). Stubbed navigator.geolocation (pending, then PERMISSION_DENIED). Not testable: auto-locate on reload with permission already granted (cannot stub before load). Did not exercise a 150 kW and a 250 kW station exactly at the boundary (none in view); the tier logic is the SPEED_LIMITS constant plus the three tiers observed. |

## Issues

1. **Car picker opens scrolled 32 px, title clipped (desktop 1280x800, dark and light).** Header/trip "Change car" dialog: dialog is 776 px tall, its content 833 px; on open (reproduced on 3 of 4 opens, including after Escape and after theme change) `dialog.scrollTop` is 32 and the h2 "Which EV do you drive, or want to?" has top y=1 while the dialog starts at y=12, so the top of the title is cut off. Likely the autofocused search input scrolling into view. Expected: dialog opens at scrollTop 0. Not seen at 375 wide (scrollTop 0) and the very first open in dark looked complete.
2. **Map key covers the ⓘ credits at 375 (dark and light).** Open key spans x 8-367, y 220-729 and `elementFromPoint` at the ⓘ (x 340-364, y 698-722) returns the key (z-index 6). The brief says sheets must not cover map credits. It is closed by closing the key, but while open the credits are unreachable.
3. **Map key overlaps the Stations in view panel at 1280x800.** With both open, the list panel (z 4, y 72-464) sits over the top of the key (y 130-610) so the key's title row is hidden. Cosmetic.

## Looks off, not in the brief

- The detail panel's chevron is labelled "Back to stations in view" even when it was opened from a trip stop (it returns to the whole-route view). The label does not match the action.
- At 375, tapping a stop mark on the map eases to zoom 6 (easeTo, no flyTo), while tapping the card button flies to zoom 15. Different behaviour for the same stop; may be intended.
- Key range label reads "150-250 kW" while the design says 150 to under 250 (a boundary at exactly 250 belongs to the next row).
- Flight cap is 1100 ms (the brief says "about 1 s at most").

## Console

`read_console_messages` onlyErrors showed one set of errors: a 500 / "[vite] Failed to reload /src/components/RoutePanel.tsx" and "speedTier is not defined at ListSpeed (ChartMap.tsx?t=1795077646239)". Those carry an old `?t=` timestamp from a hot-reload before this run and did not recur after fresh navigations; treated as stale. No new errors after any reload.

## Not checked

- PNG screenshots (not saved: the tool cannot write files).
- Real touch swipe (mouse drag and wheel used).
- Auto-locate on reload with permission granted (cannot stub before load).
- Line "draws back" animation on closing the trip; the "% values grow into the fields" animation.
- Keyboard (Tab/Enter) walk of the stop buttons; they are native buttons with names.
- Pins and groups on the map itself (speed marks drawn on canvas): only seen at screenshot resolution, not measured.
- Light-theme road names at zoom 13+ visually (style layers only).
- The first-load picker and Compare's own dialog at 1280.

## Cleanup

Removed my helper and the Level 2 filter key from localStorage, reset theme to dark, Animations to on, and the viewport to desktop/dark.
