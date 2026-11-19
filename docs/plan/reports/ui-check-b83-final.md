# UI check B83 final (Charging page hierarchy)

Verdict: **ISSUES (2)**. QC1, QC2, QC3, QC4, QC6, QC7, QC9 pass; QC8 fails on two details (62.5 kW label, end tick labels).

Run: dev server http://localhost:4321, EV9 Land AWD GT-Line (tested) and BMW i4 Gran Coupe eDrive40 (estimated), 1280x800 and 375x812, dark and light. Chrome pane scrollbar is 15 px, so the 1280 viewport lays out at 1265 px. 375 pass runs at dpr 2. Accordions opened (Car figures and assumptions, Specifications, Trims, Sources). QC5 skipped (superseded).

## Matrix

| QC | 1280 dark | 1280 light | 375 dark | 375 light | Evidence |
|----|-----------|------------|----------|-----------|----------|
| QC1 Answer first | PASS | PASS | PASS | PASS | Answer Overpass 800 41.6 px (1280) / 30.4 px (375), readout values 18.4 / 16 px. 1280 EV9 chart canvas top y=675, i4 y=674 (above the 800 fold). 375 answer y 420-452 (above 812 fold), chart top y=865 (not required). Values: EV9 ~228 km, ~109 km/10 min, 66.5 kWh, 190 kW, ~$32.53, 10-80 in ~20 min; i4 all `~`; 30-60 window has no `~` (all measured). "Lost to charger limit" only with a limit (150: "+3 min at 150 kW"; not at Max). |
| QC2 Window slider | PASS | PASS | PASS | PASS | Track = grid: 169.5..1127.5 (1280), 85..322 (375). Guide centres vs handle: 0.2 / 0.6 px (1280), 0.05 / 0.15 px (375). Arrow keys: End 80 -> 79 (1 %). Start jumped with End key stops at 79 (does not pass End). Each input has its own aria-label (Start, End) and aria-valuetext ("10%", "80%"). Dragging guides on the chart (synthetic mouse events) moved 30->42 and 60->70. Reload kept 42-70. `?from=30&to=60` shows Start 30 / End 60 (1280 and 375, with `&kw=150` too). Tab from Start goes to End, focus-visible true. |
| QC3 Axis switch | PASS | PASS | PASS | PASS | Switch at chart top right (right edge 1143.5 = canvas right), above the canvas (1280: y 636-671, canvas 675; 375: y 826-861, canvas 865), no overlap with the y-axis name. Time redraws (42->70 % = 8 min). |
| QC4 Curve paint | PASS | PASS | PASS | PASS | EV9 dark: yellow 255,212,0 solid on band 43,44,48 (10 px band), violet 201,184,255 dashed <18 % and >80 %; i4: violet dashed (201,184,255 dark / 91,52,196 light), no yellow, no band. Delivered fill: yellow alpha 0.16 (dark), violet 191,182,201 (i4 light), visible. Guides 245,243,236 (dark) / 26,27,30 (light) = text colour, 2 px. |
| QC6 Readouts and panels | PASS | PASS | PASS | PASS | Readouts bg 42,43,47 (--surface-2) in dark, 228,227,221 in light; no border, no shadow, radius 10 px. Panels (chart, 4 spec groups, Trims, Sources) same raised fill. Lowest text contrast on raised cards: dark 5.42 (orange warning glyph), 5.53 (muted label); light 5.06 ("Unknown"), 5.29 (warning glyph), 5.61 (source [n] links). Highlighted trim row wash checked as composite (>= 5.9). Readout values and panel titles Overpass; "10% -> 80% in" label Archivo. 375: readouts two columns (< 400 px), no overflow: scrollWidth = clientWidth = 375 (and 1265 at 1280), no element wider than the viewport. |
| QC7 Outside the window | PASS | PASS | n/a | n/a | EV9 10-80: 0-10 % violet lane dashes (16 on / 12 off), 10-18 violet short dashes (9 / 6), 18-80 solid yellow on band, 80-100 violet lane dashes. EV9 30-60 dark: 18-30 and 60-80 yellow lane dashes (15 / 13), 30-60 solid yellow; 0-18 and 80-100 violet lane dashes. Light 30-60: outside-window dashes in band colour 43,44,48, solid yellow 255,212,0 inside, violet 91,52,196. i4 10-80: violet short dashes (9 / 6) inside, 13-14 / 12 lane dashes outside, no solid. |
| QC8 Switches and sliders | FAIL (2 details) | FAIL (same) | FAIL (same) | FAIL (same) | See issues 1 and 2. Everything else passes (below). |
| QC9 Source badges | PASS | PASS | PASS | PASS | Outline vs surface-2: default kinds 3.29 dark / 4.04 light (dotted for low confidence, solid for the rest), Official 9.88 / 5.61 (solid yellow-accent), Estimated 7.93 / 5.98 (dashed violet, italic). Badge text 12.7 / 13.4 default. Popup opens on a raised readout card (Range), shows "[9] NRCan Fuel Consumption Ratings..." in a panel 320 px wide, not clipped. Clicking [9] opens Sources and scrolls to #source-9, highlighted with the yellow wash. |

QC8 detail (all passes except where noted):
- Switches: km/mi and State of charge/Time selected = yellow 255,212,0 with ink 26,27,30 label; unselected surface fill with field-border outline (settings look).
- Charger steps with arrow keys, 1280 dark: Max -> 350, 300, 250, 200, 150, 100, 50 kW, then Right x7 back to "No limit". Results update (answer ~20 min at 250+, ~25 at 150, ~80 at 50). "Find chargers this fast" link href `/?power=N&plugs=nacs,j1772` for every step, absent at Max; "Lost to charger limit" absent at Max and at 250+.
- Value remembered: 150 kW kept after reload (stored in voltway.curveSettings). `?kw=150` -> 150 kW, handle at step 2.
- Rail contrast vs raised card: 3.29 dark, 4.04 light. Round thumbs, accent fill (map slider look).
- Ticks 100..350 sit exactly on the handle positions (0.0 px). No label overlaps at 1280 or 375 (min gap 10 px, between 350 and Max). Each control has its own accessible name and value text (Charger label "Charger: 150 kW", aria-valuetext "150 kW").

## Issues

1. **`?kw=62.5` shows "63 kW", not "62.5 kW"** (QC8). Page /charging?car=kia/ev9/2026/land-awd-gt-line&kw=62.5, dark, 1280. Expected label "Charger: 62.5 kW" with handle at 50. Actual label "Charger: 63 kW" and aria-valuetext "63 kW"; handle at 50 (correct). Cause: `chargerLabel` uses `formatNumber(chargerKw)`, which rounds to whole numbers.
2. **First and last tick labels are not centred on their handle positions** (QC8, 1280 and 375, both themes). "50" is left-aligned: label centre 6.4 px right of the handle; "Max" is right-aligned: 10.7 px left of the handle. The QC8 / brief limit is 4 px. 100-350 are 0 px. No overlap or clipping. (This copies the map slider's ticks; if intended, loosen the QC8 wording.)

## Looks off, not in the brief
- Time axis: the Start/End window slider stays under the chart with SoC values, but the chart x-axis is minutes, so the slider no longer lines up with any guide. It still works (42-70 % window shown as "Start: 42% / End: 70%").
- Start and End can be equal (both 79) with the thumbs stacked; End is then the top thumb. Can't cross, as required, but a visitor might need to drag the right one first to separate them.
- At 1280, the floating nav bar sits over the top right of the page when scrolled, covering the "Charger" label row in the Car controls at some scroll positions (normal sticky nav, noted only).
- "Car figures and assumptions": the "25.5 kWh/100 km" value wraps to two lines at 1280, making that card taller than its neighbours (cards are stretched to equal height, so it reads fine).
- The i4 chart top is only ~6 px above the fold at 1280x800 (y=674 incl. its panel top ~664 plus the 24 px axis padding): the plot body is mostly below the fold on that car (estimate notice adds height).
- Console: no errors after fresh reloads (one stale `carData is not defined` entry in the buffer carries a `?t=1795056028965` timestamp from an older hot-reload; the file has no `carData` and the loaded module has a newer timestamp). Only warnings are from my own getImageData reads.
- No `/api/route` requests.

## Screenshots (docs/plan/reports/b83/)
final-1280-dark-ev9-top.jpg, final-1280-dark-controls-carfigures.jpg, final-1280-dark-specs.jpg, final-1280-dark-trims-sources.jpg, final-375-dark-ev9.jpg, final-1280-light-ev9-30-60.jpg, final-1280-dark-i4.jpg. The pane captures at a small size (532 px wide at 1280, 171 px at 375), so they show layout, not fine detail; measured values above come from JavaScript.

## Not checked / limits
- A real mouse drag on the round slider thumbs (only keyboard, plus synthetic mouse events on the chart guides).
- Pixel-level canvas checks are from getImageData on the live canvas; dash lengths are rounded (pattern 16/12 measured 15-16 / 12-13).
- Contrast for text inside the badge popup (.pop) not measured; popup bg 31,32,35 with text 245,243,236 (14+).
- 375 light with 30-60 window and 375 light i4 were not run separately; 375 light EV9 (10-80) and 375 dark EV9/i4 were.
