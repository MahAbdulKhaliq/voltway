# UI check 4.21-4.25 (B54)
Verdict: ISSUES (3, all minor). Items 4.21-4.25 meet their Done-when lines.

Coverage: all items desktop dark (full), desktop light (map + header on /cars, /about, /404), 375 light (map, key, dialog, Plugs, all pages), 375 dark (trip, map). Not every page was re-measured in every theme (see "Not checked").
Screenshots (tool-results folder, `C:\Users\Mahmood\.claude\projects\G--Work-EV-Charging-App\77500f9d-94fc-462b-8294-6060c89796b9\tool-results\`): dark /cars `mcp-Claude_Browser-blob-1794912682530-732e07.jpg`; dialog `...1794912740796-rvqppp.jpg`; Plugs open `...1794912818568-f883wa.jpg`; Map key desktop dark `...1794912833029-5baoyu.jpg`; light map + key `...1794912870916-x39wlf.jpg`; trip grey desktop `...1794912893773-c7euqo.jpg`; trip closed `...1794912904769-7vzpr2.jpg`; 375 light map `...1794912920366-5q...` (see 1794912920366-*), 375 key `...1794912925178-5baoyu`/`...-whhrsp.jpg`, 375 dialog `...1794912932290-bq55e2.jpg`, 375 dark trip `...1794912979651-7vzpr2` (`...-c7...`); use folder listing by timestamp.

| Item | desk dark | desk light | 375 light | 375 dark | Evidence |
|---|---|---|---|---|---|
| 4.21 Pill header | PASS | PASS | PASS | PASS | Same pill on /, /cars, /charging (car + no car), /compare, /about, 404: top 12, height 50, right edge 1253/1268, links Map/Charging/Cars/Compare, current page highlighted (aria-current, dark on yellow). 375: pill x 8..367, top 8, links hidden, menu + logo + My car chip. h1 top 86 (desktop) / 82 (375) so nothing hidden at load. /cars sticky filter card x 89-349 vs pill x 512-1253: no overlap; table scrolls under the translucent pill only. No horizontal overflow anywhere (scrollWidth = clientWidth). Logo path fill rgb(255,212,0) with dark dashes; /favicon.svg 200 image/svg+xml, #FFD400 + #1A1B1E. Map: station sheet/route panel at 375 starts below the pill (sheet top 560; route sheet clears it). |
| 4.22 Car picker dialog | PASS | n/a | PASS (fits) | n/a | /cars, /compare, / with no car: "Pick your car" opens modal dialog (rect 253,183-1013,617 desktop), URL unchanged, focus in search input. "model 3 performance" + Enter: myCar set, chip updates, dialog closes, focus on chip. "Change car" from chip menu: Escape, close button and a real backdrop click all close it, focus returns to the My car chip. On /charging, Change car + "ioniq 5 long" + Enter switched URL and h1 to IONIQ 5 Long Range. 375: dialog 19..356 x 22..790 of 812, no horizontal scroll, no inner scroll. |
| 4.23 Plugs + Map key | PASS | PASS | PASS | not re-run | Plugs closed by default (aria-expanded false, "All"), opens true; unticking one shows "3 of 4"; 4 rows one per line (tops 538/570/602/634), each with 1 svg drawing. Car filter ticked with IONIQ 5 LR AWD: CCS1 + CHAdeMO unticked+disabled, NACS + J1772 ticked ("2 of 4"); that car is NACS per its data, so consistent (I did not retest with a CCS1 car). "Temporarily unavailable" absent from the filter panel (only in key). Map key button x1117-1228 y674-716 directly above Locate me y724-766; at 375 it is at y64-106 right under the pill with Locate me at y114-156. Key lists Level 3, Level 2, Temporarily unavailable, split group, Up to 75 / 150 / Over 150 kW with bolt tiles, 4 plugs with drawings, trip note. Enter and Space both toggle Plugs and Map key (aria-expanded flips). |
| 4.24 Marks | PASS (visual) | PASS (visual) | not seen at zoom | n/a | Toronto, both levels on: clusters show white left / yellow right with a vertical split, count dark in the disc, 1-3 bolts top right, dark plug stack left of the disc; single pins carry the same tags. Marks are canvas sprites so no DOM contrast read; source colours: count #1A1B1E on #FFD400 / #F5F3EC / trip grey #8A8980 (about 12 / 15 / 4.9 to 1 by calculation; tests/contrast.test.ts asserts >= 4.5). Browser screenshots are low resolution, so fine pixel detail of the drawings was not inspected. |
| 4.25 Trip grey | PASS | not run | n/a | PASS | Test link, Model 3 Performance: route 200 from /api/route (2 plans in all, one per viewport). Other clusters/pins grey and faded; the only yellow is the trip line + its numbered stops (the orange/brown dashed no-charger stretch is the trip's own warning). Closing the trip (x) restored yellow/white clusters and the Last trip row. |

## Issues, ranked
1. (Minor) 375 px, light, map: opening Map key gives a panel at y164-570 that runs under the bottom sheet (sheet top 560) and over the map credits line (about y525-555); the panel scrolls inside (scrollHeight 434 vs 404) so the trip note line is cut at the bottom until scrolled. Repro: / at 375 px, tap Map key.
2. (Minor) 375 px, sheet expanded (Chargers open): the map credits ("Chargers: NRCan / ...") sit over the top of the sheet and partly hide the "Where to?" field. Possibly existing behaviour, not B54-specific.
3. (Minor, note) 375 px /cars: the Filters sheet (z-index 40) covers the pill (z-index 20), so the pill is not available while filters are open. Probably intended for a modal sheet.

## Looks off, not in the brief
- Pill is 741 px wide at 1280 (includes the My car chip text), not very "small" but readable. It shifts about 30 px left on /cars between themes because chip text width differs (no overlap).
- /charging with no car param redirects to ?car=<My car> (existing behaviour).
- Console on / and pages: only 404 resource errors, which came from the intentional /nothere visit; none on real pages.

## Not checked
- Light theme on /charging, /compare, 375 light screenshots of 4.24 marks at pixel level (screenshots are only 800 px wide).
- 375 dark for pages other than the map/trip (pill geometry measured in light only; the same CSS).
- Car-filter lock with a CCS1-port car (used a NACS car).
- Measured marks contrast in the canvas (calculated from source colours instead).
- axe (belongs to 4.17).

Storage restored (voltway.myCar back to the original IONIQ 5 value); viewport reset to desktop, dark.
