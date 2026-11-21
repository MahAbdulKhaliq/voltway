# QA report: Content folds (B137-B141), checks 11a-11f

Run against http://localhost:4321 (dev). Verdict: **PASS with 3 minor observations (no blocking failures)**.
Desktop passes ran at the pane's own width (975 px viewport, 960 px content), not exactly 1280; the desktop layout (above the phone breakpoint) was shown. Dark first; light spot-checked at 375 on /charging and /compare only (not /cars, not desktop light).

| Id | Result | Evidence |
|---|---|---|
| 11a | PASS | 375 dark, acura/zdx/2024/a-spec-awd (estimated) and bmw/i4/2023/edrive40 (Tested): fold closed (body height 0), title "Range added, energy, average power and cost", digest "~292 km added · ~94 km per 10 min · 70.0 kWh · 135 kW average · ~$34.24". End slider 80 to 60 changed digest to "~208 km added · ~111 km per 10 min · 50.0 kWh · 160 kW average · ~$24.46". Open animates (body height 0, 19, 37, 54, 70, 84, 97, 109 ... 196 over rAF frames). Settings > Animations Off (data-motion=off): open jumps to 196 px in the first sample. Desktop: .figfold-row display none, figures block shown (68 px). Digest has no "~" for measured car, "~" for estimated: correct. scrollWidth = clientWidth = 375. |
| 11b | PASS | "About this curve" closed raised section (.acc-raised) with chips (Estimated / Tested + source name) at both widths. Open: "Curve: Estimated. The Charge Port: Acura ZDX [10]", warm-battery note, "54.3 kWh drawn, including ~8% charging losses (assumed)", price help text. aria-describedby targets #price-help and #settings-price-help both exist. Enter/Space handling: see 11c. |
| 11c | PASS | "More detail" closed with chips "Peak 190 kW", "8 points". Open: Peak power 190 kW at 10%, Time above 100/150/200 kW, Notes, "Curve points" table. Keyboard: focused summary, Enter closed it, Space reopened it (state toggled each time). Open/close animation not separately sampled. |
| 11d | PASS | 375 dark: rows closed, "Range and charging" + digest "515 km · 20.9 kWh/100 km · 600 kW peak · 10-80% in ~10 min · ~378 km per 10 min"; 5 figure cells hidden (display none). Open row shows 5 labelled figures (Range, Efficiency, DC peak, 10-80% time, Added per 10 min) as flex rows 30 px each; the + cell has border 0 (no line under it). Sorting DC peak and Range, flipping direction: digest bolds the sorted figure ("600 kW peak", "837 km"), td.on switches, scrollWidth stays 375, no layout break. Open state is not carried to a different car after re-sort (rows come back closed): acceptable. Desktop: fold buttons display none, 7 table cells, thead shown, normal table. |
| 11e | PASS | First visit (storage cleared): 10 per page in cards and table. From page 2, switching 5 / 25 / 50 / 10 each gave page 1 (first row = list start) and the matching row count (5/25/50/10); localStorage perPage follows. Reload with 50 kept 50 rows. Cards view: 50 / 5 / 10 distinct cards. |
| 11f | PASS | 375 dark with 4, 2 and 1 cars: scrollWidth 375 = clientWidth 375, table 313 px wide. Rows are grid blocks with spec name then one line per car with colour bar, value, badge, [n]. Stars on best values (42 matches, e.g. 800V x3, 600 kW). thead sticky (top 66 px, under the 50 px header) kept car-name strip visible while scrolling Specs. "Only show differences" switch: 17 rows to 16 and back to 17 (aria-checked toggles). Source badge popover opened at x 39-339 of 375 px, fully on screen. Desktop: original table (886 px, thead static, rows table-row). Light 375 4 cars: scrollWidth 375. |

## Contrast (measured)
| Item | Dark | Light |
|---|---|---|
| .figfold-sum (charging, 12.8 px, grey) | rgb(164,162,154) on rgb(31,32,35) = 6.37:1 | rgb(85,84,78) on rgb(250,249,245) = 7.21:1 |
| Cars row digest .figfold-sum | 6.37:1 | not measured |
| Bold sorted figure (.figfold-on, weight 700) | rgb(245,243,236) on rgb(31,32,35) = 14.67:1 | not measured |
| Open-row td.on (sorted figure) | 14.67:1 | not measured |
| Open-row labels (::before) | 6.37:1 | not measured |

All above 4.5:1.

## Observations (not failures)
1. In an open Cars row at 375, the sorted figure (td.on) has font-weight 650, the same as the other four figures, so it is not visually distinct when open (it is bold, 700 vs 400, only in the closed digest). QA text says "sorted figure bold": confirm that is intended for open rows.
2. /charging More detail for the Acura estimate: "Time above 200 kW: 0.0 min" for a 190 kW peak car (a threshold above the peak). Existing behaviour, not from folds.
3. Compare 375: best-value badges (bold, larger "Manufacturer") are slightly bigger than non-best badges, so lines are not the same height. Cosmetic.
4. Console: one error, "Not allowed to load local resource: chrome-error://chromewebdata/charging", from a navigation attempt (stale, not from the page). No page errors.

## Not checked
- Light theme on /cars and desktop light; true 1280 px width (pane gave 975 px); light-theme contrast of the Cars digest and bold sorted figure.
- Animated open/close of "More detail" and "About" (state toggles verified, motion not sampled).

## State restored
Animations On (voltway.motion=on), Cars sort "Added per 10 min" High to low, table view, Per page 10, voltway.curveSettings removed (added by me), viewport reset to desktop with dark colour scheme.
