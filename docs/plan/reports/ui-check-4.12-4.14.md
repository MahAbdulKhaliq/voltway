# UI check 4.12-4.14 (2026-11-17, dev server, Chromium pane)

## A. /cars (4.12)
| id | result | evidence |
|---|---|---|
| A1 | PASS (dark/light, desktop+phone) | dark body bg rgb(26,27,30), text rgb(245,243,236), font "Archivo Variable"; light bg rgb(238,237,232), text rgb(26,27,30), amber rgb(111,83,0), purple rgb(91,52,196). Contrast audit (4.5:1) 0 failures, no blue/teal/green text colours, cards + table views, light desktop/phone, dark phone. |
| A2 | PASS | "ioniq" -> 9 cars (Hyundai IONIQ 5/9); clearing -> 84 |
| A3 | PASS | untick 2026 -> 13; Tesla only -> 11; measured only -> 12; min range 500 km -> 3; Clear filters -> 84, resets checkbox and slider. Count line updates ("N cars") |
| A4 | PASS | Sort by Range desc -> Silverado EV 793 km first; asc -> Volvo EX30 327 km; Name A to Z -> BMW i4; Z to A -> Volvo EX40. Order labels switch ("Low to high"/"A to Z") with sort key. |
| A5 | FAIL (desktop, dark+light) / phone n/a | Table at 1280 wide: the table is 920-1000+ px wide inside a 808 px section with overflow visible, no own scroll box, so it spills past the viewport and the page scrolls horizontally (scrollWidth 1288 vs 1280 in dark; 1303 vs 1265 client in light). On phone the table switches to a stacked-rows layout (no horizontal scroll, readable), not an inner scroller. |
| A6 | PASS | "Estimated" tag: class kind-tag estimated, colour rgb(201,184,255) on rgb(44,38,64), dashed border, italic. "Tested" tag yellow on dark amber fill. "~" prefix on estimated figures (e.g. "~25 min"), plain text style. |
| A7 | PASS | card link href /charging?car=tesla/model-3/2026/premium-awd-i; "+ Compare" -> "In Compare ✓", header shows "Compare (1)". (Link navigation checked in B.) |
| A8 | PASS | phone 375: scrollWidth 375 in both themes, both views. Desktop table view is the exception (A5). |

## B. /charging?car=tesla/model-3/2026/performance (4.12, 4.13)
| id | result | evidence |
|---|---|---|
| B1 | PASS (dark/light, desktop+phone) | bg/text as palette; contrast audit 0 failures, no blue/teal/green text, in both tested and estimated curve states |
| B2 | PASS | canvas pixel sample: dark = yellow (~#FFD400) line over olive fill, light = dark amber (~#6F5300) line; no blue |
| B3 | PASS | Estimated curve: purple dashed (dark rgb~192,176,240, light rgb~80,48,192), "Estimated" label on the curve, banner "Estimated curve: no measured curve is available for this car yet.", "Why estimated?" details, "Estimated" badge in source line. Charger-limit line is orange dashed. |
| B4 | PASS | Start 10->20, End 80->90 via sliders: tiles "20% -> 90% in 23 min", avg power and cost update; real mouse drag of the start guide on the chart moved it 20->31 and tile became "31% -> 90% in 30 min". Settings persist across reload. |
| B5 | PASS | Curve select (Tested/Estimated) switches chart; Charger limit 100 kW -> 35 min and "Lost to charger limit +12 min at 100 kW"; Range basis City -> 318 km; Wheels 18" -> 342 km; Show against Time redraws x-axis in minutes; km/mi toggle -> "213 mi"; price 0.45 -> 0.60 changes cost to ~$36.07 |
| B6 | PASS | Car figures and assumptions, Specifications, Trims, Sources (6 sources, with licence and access date) open on click; source kind badges (Manufacturer/Tested/Estimated/Community/Official (Canada)) present; "Report it on GitHub" link -> https://github.com/MahAbdulKhaliq/voltway/issues (yellow in dark) |
| B7 | PASS | Select vehicle opens; Make -> Hyundai switched URL to ?car=hyundai/ioniq-5/2026/long-range; page shows "No charging curve yet" message for that car |
| B8 | PASS | 375: scrollWidth 375 both themes; chart 313 px wide, readable |

Off-looks (B): at 375 and ~532 widths the orange "Charger limit" label at the right end of the limit line is clipped to "Cl" (light and dark). Minor.

## C. /compare (4.14)
| id | result | evidence |
|---|---|---|
| C1 | PASS (dark/light, desktop+phone) | bg/text per palette; contrast audit 0 failures; text colours only yellow/cream/grey/purple (dark) and amber/ink/grey/purple (light); no console errors |
| C2 | PASS | 4 cars added from /cars ("Compare (4)"), all 4 shown in chart, results table (4 rows) and specs. 5th "+ Compare" is not disabled but is refused with message "Compare holds 4 cars. Remove one on the Compare page first." (count stays 4). The Compare page itself has no add-car picker, only a trim "Variant" select and Remove buttons. |
| C3 | PASS with a note | --car-1..4 dark: #6FB1FF (blue), #FF9A4D (orange), #4ADE9A (green), #F58BC1 (pink). Light: #1D4ED8 (blue), #B03A06 (burnt orange/red), #04704F (green), #B3175A (crimson). Each distinct on #1A1B1E / #EEEDE8. Estimated curves dashed (tested Tesla solid; 3 Hyundai estimated dashed), legend and table dots match. Note: the Charger-limit line is also orange dashed (#FF7A1A dark, #9A3F00 light) and sits close to --car-2, and in light the --car-2 (#B03A06) and --car-4 (#B3175A) are both red-leaning dashed lines; harder to tell apart on the chart (legend dashes help). |
| C4 | PASS | Results table per car (time, added, per 10 min, avg power, Curve badge Tested/Estimated), "~" on estimated figures; specs table with source badges and best-value stars; Remove of IONIQ 6 -> 3 cars, URL, storage and header count updated |
| C5 | PASS | 375: scrollWidth 375 both themes. Results table (313/576) and specs table (343/603) scroll inside their own .table-scroll boxes. |

Off-looks (C): opening /compare?cars=... with 4 cars while storage held 3 shows header "Compare (3)" next to 4 cars on the page (URL list overrides storage; pre-existing behaviour, not a redesign issue).

## Summary
FAIL: A5 only (see above). Everything else PASS. Console: no errors after fresh loads. Not checked: dark-desktop contrast audit of /cars and dark-desktop /compare light-theme-specific states beyond what is listed; drag on touch for the phone chart.
