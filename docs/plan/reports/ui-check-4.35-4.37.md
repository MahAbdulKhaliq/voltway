# UI check: 4.35, 4.36, 4.37 (B59 phone map)

Verdict: **ISSUES (3)**, all minor/for the owner's eye; every Done-when line is met in the tested states.
Page: local dev server `/`. Gesture evidence is Chromium emulation (mobile preset: touch + pointer: coarse), not a real phone. Drags were real mouse drags (computer tool), not touch events. Reduced motion was ON in this browser (matchMedia true), so the non-reduced transition could not be observed.

## Matrix (P = pass)
| Check | 375 dark | 375 light | 320x640 | 812x375 | 1280 dark/light |
|---|---|---|---|---|---|
| 4.35 buttons 44x44 round, names kept, legend icon | P (44x44, radius 50%, "Map key"/"Locate me") | P (same) | P (44x44) | n/a (>640: labelled buttons, 111x42 / 126x42) | P labelled, unchanged |
| 4.35 credits compact ⓘ, folded, opens | P (class maplibregl-compact, closed; open = 355x64 box above sheet) | P (compact, closed) | P (opens 300x64, bottom 310 < sheet top 320) | desktop style full line | P full line (110 chars), no summary button |
| 4.35 zoom hidden on coarse | P (display none) | P | P | shown (not coarse) | shown, 29x29, click zooms |
| 4.35 zoom with mouse at 375 | see Issue note 1 | | | | |
| 4.35 icon contrast | key/locate icon 14.67:1 | 16.35:1 | n/a | n/a | n/a |
| 4.36 sheet + handle | P | P | P | n/a: >640 gets side panel, no handle | P no handle, panel 280x542 floating |
| 4.36 gestures/keys/modes | P (see below) | look only | P (heights) | n/a | n/a |
| 4.37 route fit | P | P | P | see Issue 3 | n/a |
| 4.37 % wrapping | P (all NBSP) | P | P | | |
| Overflow (scrollWidth vs clientWidth) | 375/375 | 375/375 | 320/320 | 812/812 | 1280/1280 |

## 4.35 details
- Map key button: `.map-key-btn` 44x44 at (323,64); Locate me `.map-locate` 44x44 at (323,116); label span is visually hidden, accessible names "Map key" / "Locate me". Key icon is an SVG of three dots plus three lines (legend list), 18 px, not an ⓘ. Opened key popup at 320 px: x 8–312, y 168–632 (inside the 640 screen, below the buttons).
- Icon contrast: dark #F5F3EC on #1F2023 = 14.67:1; light #1A1B1E on #FAF9F5 = 16.35:1. The ⓘ credits glyph is MapLibre's own (black on 50% white), 21:1.
- Credits: starts folded in all three phone passes; summary button 24x24 at bottom-right. A real coordinate tap on it did not register in my run (my frame scaling may be off); `summary.click()` opened it (class maplibregl-compact-show, text lists "Chargers: NRCan / NLR AFDC | © OpenStreetMap contributors | OpenFreeMap …" ). Not confirmed with a real touch.
- Coarse: with mobile emulation `(pointer: coarse)` is true and the zoom group is `display:none`.
- Mouse at 375: **not directly testable** (any width < 768 forces touch emulation in this tool). Workaround: I deleted the `(pointer: coarse)` rule from the live stylesheet; the zoom group then showed (29x29) at y 294–352, above the credits (bottom ~396) and above the sheet top (406): not overlapping. This simulates, but does not prove, a real narrow mouse window.
- Desktop 1280 dark and light: panel at (12,12) 280x542, Map key 111x42 and Locate me 126x42 with text labels, 12 px radius, full credits line, zoom group 29x29 at (1241,712); clicking Zoom in with the mouse changed `voltway.mapView` zoom to 6.91. Nothing changed.

## 4.36 details
Heights at 375x812: peek 200 (max-height), half 406, full 740 (`style.maxHeight`); at 320x640: 200 / 320 / 568. Panel height is content-sized below the max, so the "peek" panel measured 169 px at 375 on the plain map (content is shorter than 200).
- Handle: `button.sheet-handle`, `aria-label` "Panel size: small|half|full. Change size", 28 px tall, sticky (handle top stays at panel top, delta 1 px, after scrolling the sheet's own content: scrollTop 21, overflow-y auto, page scrollY 0). Focus ring (solid #FFD400) shows on keyboard focus.
- Keyboard: Enter peek? half->full OK; Space full->peek OK; ArrowUp x3 stops at full; ArrowDown x3 stops at small (peek).
- Tap (mouse click) steps peek->half->full->peek (verified through labels).
- Mouse drag: drag up ~189 px from peek = half; drag up ~390 px from half = full; drag down ~355 px from full = peek; ~59 px flick up from peek = half (one step), and the click after a drag did not step again.
- Chargers open from peek: half (max 406, panel 392); closing: peek (169).
- Plan trip from peek: half. Focusing From or To (peek) opens full. Closing the trip after focus left the sheet at **half** (see Issue 2).
- Planned trip Toronto to Ottawa (start 80, min 15): opens half (panel 406 tall at top 406), no `.ti-gap-warn`. Toronto to Thunder Bay (start 60, min 20): `.ti-gap-warn` present, opens full (panel 562 tall, top 250).
- Controls above sheet: credits ⓘ bottom 396 vs sheet top 406 (half); 310 vs 320 at 320x640; `--sheet-px` tracks panel height (169/392/320 px). Key and Locate sit under the pill at y 64–160, never under the sheet.
- Reduced motion: transition-duration 0s on `.map-panel` and the bottom control corners (reduced motion was active). CSS source declares `max-height 0.22s` for normal motion; not observed.
- Station panel (Details on the Napanee stop): opens at (0,309) 375x503, z-index 4 over the sheet (z 3), covers the sheet; Close station details closes it; sheet stays half.
- Touch: the handle has `touch-action: none` in CSS. I could not synthesize real touch (setPointerCapture needs a live pointer id), so **touch dragging is untested**.

## 4.37 details
- fitBounds padding on phone: top 84, bottom half-sheet + 24, left 28, right 64. In screenshots (375x812 dark and light, 320x640 dark) Toronto sits at about x 26 and Ottawa at about x 290 (375 px) / 242 (320 px), left of the 323/268 button column and above the sheet top; neither end is under the pill, a button or the sheet. Estimated from low-resolution screenshots (frame ≈ 0.46x), not exact pixels; the map object is not exposed to the page.
- `%` wrapping: every "% " in the panel uses U+00A0 (e.g. "stop to charge at 15 %", "start 80 %", "Arrive 17 % → charge to 80 %", "Depart with 80 %", "Arrive with 15 %"). In the 320 px screenshot "stop to charge at / 15 %" wraps before the number, together.

## Issues
1. (Info/limit) Mouse at 375 px could not be tested natively; simulated by deleting the coarse rule (see above).
2. After a text field is focused (sheet goes full) and the trip is then closed, the sheet stays at **half** (peek for Chargers close, but not for trip close). Steps: 375x812, peek, Plan trip, focus To, blur, click Close trip, handle reads "half". Expected per brief: not specified; likely peek.
3. Gap trip opens the sheet **full** (top y 250) but the route is fitted for the half sheet (bottom pad 430 px), so Toronto/the lower part of the route sits under the full sheet at open (Toronto to Thunder Bay, 375x812 light). This follows the brief but conflicts with "no end under the sheet" for gap trips.
4. 812x375 landscape: width >640 so the desktop side panel applies (no sheet). Panel is 380x351 and overlaps the left part of the credits line; after Toronto-Ottawa fit the Ottawa end sits at about y 70, touching the pill's lower edge (pill bottom 62). Not in the B59 scope (≤640), but worth a glance on real landscape phones.

## Looks off, not in the brief
- Peek and half look identical on the plain map: the panel is content-height (169 px) and the max-heights are never reached, so tapping the handle appears to do nothing.
- Light theme Map key / Locate me: fill #FAF9F5 with border #D5D3CB (about 1.4:1 against the light map) and a soft shadow; same 1.41:1 edge in dark. Below the 3:1 control-edge guide if the owner holds these to it.
- Console shows old errors (404s, `ERR_CONNECTION_REFUSED`, two "[vite] Failed to reload CarSearchField.tsx") that remained in the tab buffer; on a fresh load no failed resources were recorded (performance entries with status >=400: none). Treated as stale hot-reload noise; not reproduced.

## Not checked
- Real touch drags and real phone behaviour; non-reduced-motion transition; real mouse at a narrow width; exact route-end pixel positions.

## Cleanup
localStorage keys I added (voltway.myCar, mapView, mapFilters, lastTrip) removed; viewport reset to desktop, dark. `/api/route` calls made: 3 (Toronto-Ottawa on each reload counted by tab buffer; Thunder Bay once).
