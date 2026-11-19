# UI check: B83 Charging page hierarchy (10.4)

Dev server http://localhost:4321, 2026-11-18. Cars: kia/ev9/2026/land-awd-gt-line (tested), bmw/i4/2026/edrive40-gran-coupe (estimated). Screenshots in `docs/plan/reports/b83/`: 1280-dark-ev9.jpg, 375-dark-ev9.jpg, 1280-light-ev9.jpg, 1280-dark-i4.jpg.

**Verdict: PASS on QC1-QC5, with 4 minor observations (none block).**

| QC | 1280 dark | 1280 light | 375 light | 375 dark | Result |
|----|-----------|------------|-----------|----------|--------|
| QC1 | pass | pass | pass | pass | PASS |
| QC2 | pass | pass (aligned) | pass (aligned) | pass (aligned) | PASS |
| QC3 | pass | n/a | pass | pass | PASS |
| QC4 | pass | pass | pass | pass | PASS |
| QC5 | pass | pass | pass | pass | PASS |

## QC1 Answer first: PASS
- First child of `.viewer.card` is `.answer`. Headline "~20 min": Overpass Variable, 41.6 px / 800 at 1280 (30.4 px at 375). Next largest text is 17.6 px (the results row, also Overpass), so about 2.4x. Labels 12.8 px.
- Values, EV9 defaults: ~20 min, ~228 km, ~109 km, 66.5 kWh, 190 kW, ~$32.53. All match. i4: ~25 min, ~311 km, ~134 km, 56.9 kWh, 147 kW, ~$27.84, `~` kept on estimates.
- Charger 150 kW (EV9): ~25 min, ~84 km, 147 kW, and a sixth item "Lost to charger limit +6 min at 150 kW" appears only with the limit. Without a limit it is absent.
- 1280x800: chart canvas top at y = 641 (chart-head switch at 602); the answer ends at y = 499. Chart top and the answer are above the 800 fold. Chart is 320 px tall, so its bottom (961) is below the fold. The window slider is not visible without scrolling.
- 375x812: answer spans y 420-600, above the 812 fold. Chart switch row bottom 793, chart top 797 (just in view).
- Horizontal overflow: none (scrollWidth = clientWidth: 1265 at 1280 incl. scrollbar, 375 at 375), all four passes.

## QC2 Window slider: PASS
- Track vs chart grid (grid = chart left + 48, right - 16): left and right differ by 0.0 px at 1280 and 375, both themes. Thumb centres vs 10 % / 80 % guide x: 0.0 px (computed from the thumb travel; also visually under the guides in the screenshots).
- Accessible names: inputs are "Start" and "End" (aria-label), aria-valuetext "10%" / "80%".
- Keyboard: ArrowRight on Start 10 -> 11 (1 %). Holding it stopped at 80 (= End), never crossed. Same for End going left: clamped at Start. Shift+Tab and ArrowLeft move the correct handle; Tab goes Start -> End.
- Mouse: dragging Start past End stops at 80/80; from 80/80 the Start handle can still be dragged away (reached 49), so handles don't lock.
- Dragging the chart guide at 10 % to the right moved the Start handle to 25 and the labels to "Start: 25%".
- Reload keeps the window (49/80 after reload; stored in `voltway.curveSettings`).
- Trip-stop link: the params are `from`/`to` (not `start`/`end`; `?start=&end=` is ignored, 10/80). `?from=30&to=70` showed handles 30/70, labels "Start: 30% End: 70%", headline "30% -> 70% in 11 min".
- Note: start can equal end (80/80, a zero-width window). Not in the pass line; mentioned in observations.

## QC3 Axis switch: PASS
- 1280: switch group right edge 1155.5 = chart right edge, directly above the chart (rows 602-637 vs canvas top 641). 375: switch row 793 bottom, canvas top 797, the "Power (kW)" axis name sits inside the canvas below it. No overlap in the screenshot.
- Time click (keyboard Enter): `aria-pressed` flips, chart redraws against Time (step line, x-axis "Time"); returning to State of charge restores.

## QC4 Curve paint: PASS
Sampled canvas pixels (EV9, SoC 40 %):
- Dark: line rgb(255,212,0) = #FFD400, 4 px; band rgb(43,44,48) 10 px, directly under/over the line; fill rgb(85,78,49) visible. Violet dashed outside 18-80 % (screenshot; left of 10 % and right of 80 % is held flat, dashed).
- Light: line rgb(255,212,0) on the same dark band rgb(43,44,48); fill rgb(227,211,138) visible; violet dashed outside 18-80 % (rgb(91,52,196)).
- 375 dark and light: same colours and band.
- i4 (estimated): dashed violet only, no band. Dark rgb(201,184,255), light rgb(91,52,196); fill visible both themes (dark rgb(79,76,94), light rgb(191,182,201)); "Estimated" tag shown.
- Guides: dark rgb(245,243,236)-like near-white, light near-black, solid 2 px (text colour). With the 150 kW charger: limit line orange rgb(255,122,26) with label "Charger limit 150 kW" (dark).
- Time view with EV9 at start 10 % (below the measured 18 %): the line is dashed violet, no band, because the result is extrapolated (existing logic). See observations.

## QC5 One yellow: PASS
- Yellow-filled elements in the card (computed background scan): none, all four passes. Selected toggles ("State of charge", "km") are aria-pressed, bg dark rgb(42,43,47) / light rgb(228,227,221), border dark rgb(245,243,236) / light rgb(26,27,30).
- Selected border vs card surface contrast: dark 14.67:1, light 16.35:1 (min 3:1). Selected-vs-own-fill 12.74:1 dark, 13.39:1 light.
- Keyboard focus ring: Time toggle (focus-visible true) 3 px solid, offset 2 px: dark rgb(255,212,0) on surface rgb(31,32,35); light rgb(111,83,0) on rgb(250,249,245) = 6.84:1. Slider thumb: ring visible (zoom, light); computed value from the pseudo-element is not reliable, so seen visually. The dark thumb ring was not zoom-checked separately; same CSS (`var(--accent)`).

## Console
`read_console_messages` onlyErrors: no errors (checked after the 375 passes and the trip-link load).

## Observations (not in the brief)
1. The yellow focus ring (dark) is the only other yellow in the card; fine as a focus indicator, but literal "only yellow is the curve" is not strictly true.
2. Slider can reach start = end (zero-width window, e.g. 80/80); the results line then shows a window of nothing. Consider min gap of 1 %.
3. In the Time view the EV9 curve is violet dashed when the window starts below the measured 18 % (extrapolated). Matches design wording ("results that use it are estimated") but the dark band disappears; owner may want to know.
4. On the i4 the italic "Estimated" tag sits on the dashed line.
5. QA.md QC2 mentions `?start=…&end=…`; the trip link uses `?from=…&to=…` (CarExplorer.tsx:70). Wording in QA.md needs the correction.
6. At 375 the chart's top is only 15 px above the fold (y 797 of 812); the answer is well above. Fine against the brief, tight.

## Not checked
- i4 at 375 in either theme and i4 at 1280 light screenshot saved (measured only); 150 kW limit in light and at 375 not measured (dark 1280 only).
- Firefox thumb pseudo-elements (-moz) not checked; Chromium only.
- Touch dragging not tested (mouse only).

## Cleanup
Removed `voltway.curveSettings` from localStorage (`voltway.mapFilters` was already present and left alone). Viewport reset to desktop, colour scheme dark.
