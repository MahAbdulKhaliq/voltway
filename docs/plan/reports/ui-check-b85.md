# UI check: B85 Compare overdrive (11.1, 11.2; QR1-QR5)

Dev server http://localhost:4321, Chromium pane (1280x800 emulated, 375x812 mobile preset). Main URL: EV9 land-awd-gt-line (tested), IONIQ 5 long-range-awd (no curve), i4 edrive40-gran-coupe (estimated). Also 4 cars (+ ioniq-5 long-range) and the empty list.
Storage restored: voltway.compare = [EV9] and voltway.myCar as found; voltway.curveSettings and voltway.motion (added by the test) removed; Animations restored to On; viewport reset to desktop/dark.

## Verdict: ISSUES (2 minor, 0 blocking). QR1 PASS, QR2 PASS, QR3 PASS, QR4 PASS, QR5 PASS (with notes)

| Row | Result | Evidence |
|---|---|---|
| QR1 design language | PASS | Names/values Overpass (car-name "Overpass Variable", lane-value 700). `.plot` panel: no border, no shadow. Group rows raised (42,43,47 dark; 228,227,221 light) in Overpass. Switch is role=switch. Contrast, all pairs measured, min 5.06:1 (light `.unknown` on lane), dark min 5.53 (lane-meta dt). Car colours on card/page/raised lane: light 4.73-7.97, dark 6.29-8.22. scrollWidth == clientWidth at 1280 (1265) and 375 in all passes; spec table scrolls in its own box (492 of 313 at 3 cars, 608 of 313 at 4). See note on 1px card border. |
| QR2 sliders and chart | PASS | Track left/right = chart grid edges exactly (1280: 169.5 / 1127.5; 375: 85 / 322), native thumb centre at 10 % = 265.3 vs axis 265.3 (0 px, limit 4). Screenshot: window lines on 10 % and 80 %. ArrowRight x10 moved start 10 -> 20; x80 more clamps at end (80, 80), cannot pass end. Charger: min 0 max 7, steps 50..350 + Max; at index 2 label "Charger: 150 kW", orange "Charger limit: 150 kW" line at 150 on the chart; race values changed (147/132 kW). Curves solid inside window, dashed outside; i4 (estimated) dashed; tooltip lists kW per car with a curve ("Kia EV9 ...: 207 kW", "BMW i4 ...: 130 kW"). Reload keeps window and charger (voltway.curveSettings). |
| QR3 charge race | PASS | Order and bar % (fill/road) at 1280, no limit: Per 10 min: i4 134 km 100 %, EV9 109 km 81.2 % (109/134 = 81.3), IONIQ none. Time: EV9 ~20 min 90.2 %, i4 ~25 min 100 %. Added: i4 311 km 100 %, EV9 228 km 73.2 % (73.3). Avg power: EV9 190 kW 100 %, i4 147 kW 77.2 % (77.4). Best lane has flag + sr-only "Best:", unknown always last, "No curve yet" and no fill; each lane meta lists all other figures and Curve Tested / Estimated / (none for no curve; Unknown for the three figures). Seg buttons aria-pressed. Race `ol` aria-label "Cars ranked by Average power, best first". Ties: not reproduced (no equal pair found), only unit-level. |
| QR4 race motion | PASS | First view: fills 0 -> full in ~0.6 s (samples 0, 540/440, 639/521, 656/535, 657/536 px). Fill `transition: width 0.62s`. Order change by charger Max after 35 min: `getAnimations()` right after: lane 1 translateY(84px)->none 460 ms, lane 2 translateY(-84px)->none 460 ms; 900 ms later all transforms "none", 0 animations, no overlap. Animations Off via Settings gear (data-motion=off, voltway.motion=off): transition 0s, no animations on lanes or document, order changed instantly, fills at final width. Restored to On via the control. |
| QR5 specs and list edits | PASS | Switch: role=switch, aria-checked false->true, rows 21 -> 18, back to 21. Specs section is a `details.acc` that animates (body height 1217 -> 281 mid-close -> hidden; 807 mid-open -> 1217). 9 best marks (star + sr-only "Best:", td font-weight 800). IONIQ 5 variant select to Long Range: header, lane, select, URL (`?cars=...ioniq-5/2026/long-range,...`) and voltway.compare updated. Remove i4: cards 3 -> 2, lanes 2, table columns 2, chart alt "for 1 cars", URL and storage updated. Empty list: "No cars to compare yet..." + yellow primary "Browse cars" (bg 255,212,0). 4 cars at 375: 4 cards, 4 lanes (2 unknown last), table 608 px in 313 px box, scroll-snap x mandatory, group-row sticky, scrolled to 233 px with scrollLeft=200, page no overflow. |

Matrix (look/layout; behaviour done at 1280 dark):

| Check | 1280 dark | 1280 light | 375 light | 375 dark |
|---|---|---|---|---|
| Horizontal overflow (sw/cw) | 1265/1265 | 1265/1265 | 375/375 | 375/375 (4 cars) |
| Handle vs axis | 0 px | 0 px | 0 px (85/322) | 0 px (85/322) |
| Contrast text min | 5.53 | 5.06 | 5.06 | 5.53 |
| Car colours >= 3:1 on lane | yes | 4.73+ | 4.73+ | 6.29+ |
| Console errors | only the two known stale HMR errors | same | same | same (no new) |

Screenshots (dark first): `docs/plan/reports/b85/qa-1280-dark-race.jpg`, `qa-1280-dark-chart.jpg` (tooltip, 150 kW line), `qa-1280-light-race.jpg`, `qa-375-light-race.jpg`, `qa-375-dark-4cars.jpg`. (Screenshots from the tool are small; the 375 ones are 171 px wide.)

## Issues
1. (minor, copy) Chart alt text on the page with one curve reads "Charging curves for 1 cars." Repro: /compare?cars=kia/ev9/2026/land-awd-gt-line,hyundai/ioniq-5/2026/long-range, read `.chart` aria-label. Key `compare.chartAlt` in `src/i18n/en.json` has no plural form. Note: the label counts cars with a curve, so "1 cars" shows whenever one of two cars has a curve.
2. (minor, data honesty) Time race bar uses raw minutes, display rounds to 5 min, so bars look inconsistent with labels. Repro: 1280 dark, main URL, figure "10% -> 80%": EV9 "~20 min" bar 90.2 %, i4 "~25 min" bar 100 % (20/25 would be 80 %). Same at charger 150 kW: both read "~25 min" but only the i4 lane is flagged "Best" and bars differ, so a visible tie is not flagged as a tie. The displayed rounding comes from `displayMinutes`.

## Looks off, not in the brief
- Chart curves are not clipped by the charger limit: with the charger at 150 kW the EV9 curve still draws above the orange line (tooltip says 207 kW at 50 %), while the race figures use the limited value. May be intended (raw curve plus a limit marker), but the tooltip kW and the race kW disagree.
- Car cards, race section and specs section keep the 1px `.card` border (rgb 52,53,58 on 31,32,35 dark); only the chart `.plot` and lanes are borderless. design-language §1 says raised blocks have no border; `.card` is the page-level card used elsewhere, so probably fine, flagging for the owner.
- With the Settings panel open on desktop, it covers the i4 lane value (overlay, expected).
- Known design question (not a defect): fastest car on time has the shortest bar (EV9 90 % vs i4 100 %).
- "1 cars" copy above; the empty list text uses straight quotes around "+ Compare" (fine).

## Not checked
- Dragging the window handles with the mouse (used keyboard and programmatic input events; thumb geometry computed from the native 18 px thumb, not read from the DOM thumb).
- The chart axis was compared to the track using the chart's container geometry (grid left 48, right 16) and a screenshot; ECharts `convertToPixel` is not reachable (no global).
- Tie flags (two lanes both "Best") could not be produced with the available cars.
- 4 cars at 1280 and the light 375 4-car view were not checked separately; the 4-car view was only run at 375 dark.
- Screen reader reading was checked via DOM (ol/li order, sr-only "Best:"), not with a screen reader.
