# UI check: 4.15 About/404/og, 4.16 Wording
Dev server http://localhost:4321. Defaults used: report path as given; passes dark 1280, light 1280, dark 375, light 375.

## Matrix (filled as I go)
| Check | desk dark | desk light | 375 dark | 375 light | Evidence |
|---|---|---|---|---|---|

## 4.15 results (about, 404, og.png)
Measured via computed styles; screenshots were inline only (not saved to repo).
| Check | desk dark | desk light | 375 dark | 375 light |
|---|---|---|---|---|
| /about tokens, Archivo | PASS bg 26,27,30, text 15.5:1, muted 6.74:1 | PASS bg 238,237,232, text 14.7:1, muted 6.48:1 | PASS | PASS |
| /about links | yellow #FFD400 underlined 11.4:1 (dark) | dark amber rgb(111,83,0) 6.84:1 | yellow | amber |
| /about overflow | 1265=1265 | 1265=1265 | 375=375 | 375=375 |
| /nothere "back" button | filled #FFD400, text 26,27,30 (12.0:1), no underline, 8px radius | same | same | same |
| /nothere overflow | none | none | none | none |
| off-palette colours | only #FFD400 / amber found; no #0b7a53, no blue/teal/green | same | n/a | n/a |
| /og.png | 1200x630, bolt mark + "Voltway", dark Road Paint, yellow trip line with numbered stops: PASS |
Console: only the expected 404 resource error on /nothere (the document itself).

## 4.16 results so far
- Trip link at 1280 dark (My car set to tesla/model-3/2026/performance via localStorage; original IONIQ 5 value saved in window.name 'orig:' and in notes below): 1 /api/route call (200). Panel h2 "Trip", button "Close trip", status (live region) "Trip planned: 8 stops. The stops are listed below and drawn on the map.", stop-list heading is an sr-only h2 "Trip". Also 375 dark trip view shows "Trip", "Show the stops". No "route"/"itinerary" text in DOM text, aria-label, title, alt, placeholder.
- Home "Plan trip": 1280 dark/light and 375 dark/light, nowrap, 68x29, ends at x=367 (<375), input 283 wide; sw=cw. PASS. Place card "Plan a trip here" (Ottawa, ON) PASS; station panel (Ottawa Boundary Road Tesla Supercharger) link "Plan a trip here" PASS.
- "Where to?" placeholder: dark rgb(164,162,154) on rgb(31,32,35) = 6.37:1; light rgb(85,84,78) on rgb(250,249,245) = 7.21:1 (same at 375). PASS.
- /charging?car=tesla/model-y/2026/long-range-awd-b-pre-6-11-25 h1: "Model Y" + "Long Range AWD" + span.variant-suffix "-B (pre-6/11/25)" at 0.8em (28.16px vs 35.2px), colour var(--muted): 6.74:1 dark, 6.48:1 light. PASS.
- ISSUE: at 375 (light and dark) this page scrolls horizontally: scrollWidth 396 vs 375. Cause: details.card "Select vehicle" summary preview (.acc-preview, plain text "2026 Tesla Model Y · Long Range AWD-B (pre-6/11/25)", white-space nowrap, inside flex summary), plus header.car-head r396. tesla/model-3/2026/performance does not overflow. Probably pre-existing nowrap rule but triggered by the long name; also the preview shows the whole name unsplit.

- /cars (cards and table, all four passes): 9 `.variant-suffix` spans (Tesla -B, -I, "-B (pre-6/11/25)"), suffix 12.8px in 16px cards (0.8em), contrast dark 6.37 (cards) / 6.74 (table), light 7.21 (cards) / 6.48 (table); no overflow at 375 (table card-stacks, scroll box 343/343). "Cadillac LYRIQ LYRIQ-V": whole, no suffix span. PASS.
- /compare?cars=tesla/model-y/2026/long-range-awd-b-pre-6-11-25,tesla/model-3/2026/premium-i (all four passes): 4 suffix spans (11.2px in 14px), contrast 6.37 dark / 7.21 light; no page overflow (wide table is inside its scroll box at 375). PASS. Variant `<select>` options still show the whole name ("Long Range AWD-B (pre-6/11/25)", "Premium-I"); native options cannot take a span, so this is expected.
- "route"/"itinerary" scan (DOM text, aria-label, title, alt, placeholder) on /, trip state, /cars, /charging, /compare, /about, /nothere: no hits. Only en.json hit is the hidden search keyword string `nav.map.keywords`.
- Console: no new errors on any page; the 404 resource errors in the log all come from /nothere (the document itself).
- Cleanup: voltway.myCar restored to hyundai/ioniq-5/2026/long-range-awd-xrt; viewport reset to desktop/dark. /api/route called 2 times total (desktop trip load and 375 trip load).

## Verdict: ISSUES (1 minor, plus 2 notes)

| Item | desk dark | desk light | 375 dark | 375 light |
|---|---|---|---|---|
| 4.15 /about new look, Archivo, links | PASS | PASS (amber 6.84:1) | PASS | PASS |
| 4.15 /nothere filled yellow button, dark text, no underline | PASS | PASS | PASS | PASS |
| 4.15 /og.png (1200x630, bolt mark, Road Paint) | PASS | n/a | n/a | n/a |
| 4.16 Trip wording (home, place card, station panel, trip title, Close trip, status, stop heading) | PASS | not re-run (static text) | PASS | not re-run |
| 4.16 "Plan trip" fits beside "Where to?" | PASS | PASS | PASS (ends x=367) | PASS |
| 4.16 variant names (cards, table, compare, car h1) | PASS | PASS | PASS | PASS |
| 4.16 variant suffix contrast >= 4.5 | 6.37-6.74 | 6.48-7.21 | same | same |
| 4.16 placeholder contrast | 6.37 | 7.21 | 6.37 | 7.21 |
| 375 horizontal overflow on /charging?car=...long-range-awd-b-pre-6-11-25 | n/a | n/a | FAIL 396>375 | FAIL 396>375 |

## Issues (by severity)
1. Minor, /charging at 375 px, both themes, car tesla/model-y/2026/long-range-awd-b-pre-6-11-25: page scrolls sideways (scrollWidth 396, clientWidth 375). Steps: open the URL at 375 px. Cause: the "Select vehicle" accordion summary preview `.acc-preview` (plain text "2026 Tesla Model Y · Long Range AWD-B (pre-6/11/25)", white-space nowrap inside a flex summary) pushes details.card, header.car-head and the selects to right edge 381-396. Does not happen for tesla/model-3/2026/performance. Probably an older nowrap rule meeting a long name, but the long regulator code is what triggers it, so it relates to 4.16.
2. Note, same page: the accordion preview shows the whole name "Long Range AWD-B (pre-6/11/25)" without the plain/secondary split (the h1 splits it correctly). Not in the 4.16 brief list but inconsistent with "plain name first".
3. Note: the h1 on the same page at 375 is 380 px wide (overflows with issue 1).

## Looks off, not in the brief
- Astro dev toolbar bubble appears at the bottom of screenshots; ignore (dev only).
- "Trip planned: 8 stops..." status text is duplicated in two live regions (harmless, screen readers).

## Not checked
- 4.15: DESIGN-4 light/dark on the og image (only one image exists). Stop list heading is an sr-only h2 "Trip", so no visible heading to measure.
- Wording passes in light theme repeated only for the Plan trip button and placeholder (text is theme-independent).
- Screenshots were inline only; none were saved to the repo.
