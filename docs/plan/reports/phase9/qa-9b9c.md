# UI check: Charging page, Phase 9 (QD4, QD5, QD7)

Verdict: ISSUES (2). Dev server voltway-dev, 2026-11-19. Pane was hidden, so no screenshots; all values read with javascript_tool.

## Results

| Check | Result | Evidence |
|---|---|---|
| 1a QD4 Tesla Model 3 Performance AWD: no Curve dropdown, template default | PASS | Selects: Make, Model, Year, Variant, Trim only (no Wheels select on this page: wheels are buttons? see note) ; text "Estimated curve: no measured curve is available for this car yet." Note: "Curve: Estimated. OpenEV Data v1.24.0 (2025-12-30) [5]" |
| 1b QD4 Kia EV9 land-awd-gt-line | PASS | No Curve select. Note "Curve: Estimated. Edwards Auto Group - 2026 Kia EV9 GT-Line specs (US) [3]" |
| 1c Any car with a dropdown | PASS | Data has 9 cars with 2 curves (EV9 x4, IONIQ 9, Solterra, Model 3 x2, C-HR). Opened Solterra, C-HR, IONIQ 9: none has a Curve select; each shows the Estimated template note naming its source. |
| 2a QD5 IONIQ 5 long-range-awd: one trim | PASS | Trim select has one option "Long Range AWD". Trims table: "19″ standard, 20″". |
| 2b IONIQ 5 wheel select 17-22, 20″ shows official 425 km | FAIL / CANNOT RUN | Page shows "No charging curve yet: this car's DC fast-charging peak isn't known." The curve controls (Range basis, Wheels) and the "Car figures" panel are not rendered at all. `public/data/cars/hyundai/ioniq-5/2026/long-range-awd.json` has `dc_max_kw: null`, `curves: []`, wheels 19 (463 km) and 20 (425 km). So the wheel picker is unreachable for this car. |
| 2c One factory size, EV6 light (19″) lists 17-21″ | PASS | Wheels select: 17″, 18″, 19″ (as rated), 20″, 21″ |
| 2d Stand-in for the 20″ check: Kia EV6 Land AWD (19: 475 km, 20: 435 km) | PARTIAL | Options 17″ to 22″ (19″ as rated, 20″ factory option). 19″: Range "475 km" Official (Canada). 20″: summary "435 km", Range line "~435 km" Official (Canada) [6], no "Rated:" line, efficiency "~21.5 kWh/100 km" Official (Canada). 21″: "~443 km" Estimated, "Rated: 475 km". Issue: the 20″ rated figure carries a "~" (see issue 2). |
| 3a QD7 trims table IONIQ 5 | PASS | One row "Long Range AWD", wheels "19″ standard, 20″", range "Same as variant" |
| 3b BMW i4 eDrive40 Gran Coupe | PASS | Trim select: "eDrive40" only. Wheels select 16″-21″ (18″ as rated, 19″ factory option). Trims table "18″ standard, 19″". |
| 3c Cars page, Compare | PASS | /cars: 84 links, no "(NN″ Wheels)" trim names, no overflow at 375. /compare?cars=...: loads, no overflow. 0 console errors. |
| 4 Contrast, console | PASS | See matrix. Console errors: none in any pass. |

## Matrix (Kia EV6 Land AWD, the page with the new wheel picker)

| Measure | Desktop dark | Desktop light | 375 light | 375 dark |
|---|---|---|---|---|
| scrollWidth / clientWidth | 1265/1265 | 1265/1265 | 375/375 | 375/375 |
| Wheels select text contrast | 14.67 | 16.35 | 16.35 | 14.67 |
| Select border vs background (needs 3) | n/m | 4.93 | 4.93 | 3.79 |
| Wheels label (muted) | 6.37 | 7.21 | 7.21 | 6.37 |
| "Curve: ..." note | 6.37 | 7.21 | 7.21 | 6.37 |
| Note link | 11.38 | 6.84 | n/m | n/m |
| Select size | 250x37 | 250x37 | 149x37 (x 196-344) | 149x37 |
| Console errors | 0 | 0 | 0 | 0 |

n/m = not measured.

## Issues

1. QD5 on IONIQ 5 (as briefed): `/charging?car=hyundai/ioniq-5/2026/long-range-awd`, any theme/width. Expected: wheel select 17-22″, 20″ shows official 425 km. Actual: no chart and no wheel select, because dc_max_kw is null for this car. Either the check target should be a car with a DC peak, or the wheel/range panel should show for cars without a curve. The 20″ = 425 km figure is only visible in the trims data, not in any picker. Needs owner decision.
2. Official 20″ range shows a tilde. EV6 Land AWD, 20″: "~435 km" and "~21.5 kWh/100 km" with the Official (Canada) badge, while 19″ shows "475 km" with no tilde. A rated figure should not be marked approximate. Brief expected no estimate marker on a rated 20″ value (the top summary shows "435 km" without a tilde, so the two disagree).

## Looks off, not in the brief
- Solterra and C-HR have "tested" InsideEVs curves in the data, yet the page shows the Estimated template (consistent with the warned-curve rule, just worth knowing).
- Variant select on Tesla Model 3 2026 still lists names "Premium AWD-I" and "Premium-I" (QD9 says no "-I"/"-B" names; that is item 9.12-9.15, not this check). Same for Model Y "-B" trims in data.
- Page header at 1280 reports scrollWidth 1265 (scrollbar), no overflow.

## Not checked
- Screenshots (Browser pane hidden). Keyboard focus ring and screen reader label on the wheel select. Wheel select contrast of its dropdown popup.
