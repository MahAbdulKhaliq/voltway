# UI check 4.31-4.34 (B58), local dev server, 2026-11-17

Verdict: **ISSUES (2, minor)**. All four items behave as specified; two deviations from the brief's wording are noted below.

Note: the map is at `/` (not `/map`, which 404s).

| Check | Desktop dark | Desktop light | 375 light | 375 dark | Evidence |
|---|---|---|---|---|---|
| 4.31 no car: no "Choose your car" tile on map card | PASS | - | PASS | - | body text has no such tile; card shows only Chargers panel |
| 4.31 route mode, no car: one "Choose your car" button, opens dialog | PASS | - | - | - | 1 button; `dialog.picker-dialog` open and `:modal` |
| 4.31 after select, form shows car line | PASS | - | - | - | "IONIQ 5 N · start 90 % · stop to charge at 15 %", "Plugs used: NACS (Tesla), CCS1 Change plugs" |
| 4.31 map card "Your car: X Change" opens dialog | PASS | - | PASS (card 359x44) | - | `.car-tile` text "Your car: IONIQ 5 N / Change"; click opens modal dialog; focus returns to `.car-tile` |
| 4.31 route Settings "Change car" opens dialog | PASS | - | - | - | "Car and battery" reveals "Change car"; opens dialog on saved car; focus returns to it |
| 4.31 can't-plan banner "Change car" (.route-carmissing) | PASS | - | - | - | with Long Range AWD XRT; modal opens; real Escape closes, focus back on banner button |
| 4.31 Escape returns focus to opener | PASS | - | - | - | header menu "Change car" -> focus on "My car" chip button (menu opener); banner -> banner button |
| 4.32 click and ArrowDown+Enter keep dialog open, selects fill, focus on "Select car" | PASS (keyboard + click) | - | PASS (keyboard) | - | selects Hyundai/IONIQ 5/2026/N; activeElement "Select car"; dialog.open true |
| 4.32 plug switches (NACS/CCS1/CHAdeMO, role=switch), car default on | PASS | PASS | PASS | PASS | IONIQ 5 2026 N = NACS on (data says NACS for 2026); LEAF 2026 default NACS only (CCS1 reset off) |
| 4.32 toggle, Select car: header menu shows same | PASS | - | - | - | saved `plugs: ["nacs","ccs1"]`; header menu NACS on, CCS1 on, CHAdeMO off |
| 4.32 reopen via Change car starts on My car with saved switches | PASS | - | - | - | selects Hyundai/IONIQ 5/2026/N, switches true/true/false |
| 4.32 switch height | 38 px | 38 px | 44 px | 44 px | >=44 at 375 px |
| 4.32 contrast | on border: bg=yellow | on border 16.35:1, off border 4.93:1, label 16.35:1 | - | on border 11.38:1, off border 3.79:1, label 14.67:1 | off-state edge >=3:1 in both themes |
| 4.32 dialog horizontal scroll | none (758/758) | - | none (335/335, doc 375/375) | none (335/335) | |
| 4.33 no bolts/plug marks below zoom 9 | PASS (zoom 5.6, 7, 8.8) | - | - | - | screenshots: clusters/pins plain |
| 4.33 marks from zoom 9 in, incl. cluster 25 | PASS (zoom 9.3 Toronto) | - | - | - | bolts and plug drawings on pins and on the "25" cluster ring |
| 4.33 Map key note | PASS | - | - | - | "Speed and plug marks show once you zoom in to city level. While a trip shows, the other chargers turn grey so the trip stands out." |
| 4.34 no car, no link: first car shown, no picker | PASS | - | PASS | PASS | h1 "i4 Gran Coupe eDrive40" (BMW 2026), no dialog |
| 4.34 ?car= link wins over My car | PASS | - | - | - | My car Ioniq 5 N set, `?car=tesla/model-3/2026/performance` shows Model 3 Performance |
| 4.34 My car wins over nothing | PASS | - | - | - | /charging shows "IONIQ 5 N" |
| 4.34 Forget my car on /charging | PARTIAL | - | - | - | goes to first car, storage null; URL is not `/charging` (see issue 1) |
| Console errors | none new | - | none new | - | stale entries only: 404 for `/map` (my wrong URL), vite reload of deleted `CarSearchField.tsx` |

Zoom was set by saving `voltway.mapView` and reloading (no map global to read `getZoom()`), then judged by screenshots.

## Issues

1. **URL is not `/charging` after Forget my car / on a no-car first visit.** Page /charging, dark, 1280 and 375. Steps: clear storage, open `/charging`, or set My car, open `/charging`, then header menu, Forget my car. Expected (brief): the first car shows and the URL is `/charging`. Actual: the first car (BMW i4 Gran Coupe eDrive40) shows, but the URL becomes `/charging?car=bmw/i4/2026/edrive40-gran-coupe&trim=18-in-wheels`. The CHECKLIST Done-when line for 4.34 only says the page shows the first car, so this may be intended (the link is shareable); owner to confirm.
2. **Switch height 38 px on desktop** (`.chip-plug`), 44 px at 375 px. The brief only requires 44 px on 375, so this is not a fail; noted in case a pointer target on desktop should match.

## Looks off, not in the brief

- Brief says the 2023 Ioniq 5 is CCS1; the data only has 2026 Ioniq 5 (NACS port), so the NACS default is correct for it. LEAF 2026 also defaults to NACS.
- After "Select car" from the trip form, focus lands on the header "My car" chip (the opener button disappeared), reasonable.
- The key note carries an extra sentence beyond the quoted text (about greyed chargers during a trip); fine, just longer than the brief's quote.
- Dev server is also reached at `/` only; `/map` 404 page shows the 404 template.

## Not checked

- Light theme for route mode / banner (look-only passes beyond the dialog and card) and 375 route mode with no car (the Choose your car button) were not repeated; verified on desktop dark only.
- Real touch sizing of the map card at 375 dark (card measured only in light).
- Zoom 9-15 pins at 375 px.

Storage cleared and viewport reset to desktop dark at the end.
