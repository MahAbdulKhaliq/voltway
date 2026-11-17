# UI check 4.20 follow-up

Verdict: **ISSUES (2, both minor / for the owner's call)**. All six fixes (A1-A6) pass. QR20 axe: 0 violations in every cell run. Two items could not be fully done (offline reload, real on-map Destination pin).

Setup: dev server http://localhost:4321, axe-core 4.10.2 (wcag2a, wcag2aa, wcag21a, wcag21aa). 4 /api/route calls used (Sudbury -> Thunder Bay twice [once + "Plan again" after a reload], Toronto -> Hamilton, Toronto -> Halifax). Size and theme changes after planning were done live (no reload) to save API calls; the trip stayed. Car for trips: Kia EV6 Wind (My car). Storage cleared and viewport reset at the end.

## A. Fixes
| # | Check | Result | Evidence |
|---|---|---|---|
| A1 | Gap warning above the fold, folded sheet | PASS | 375x812: .ti-gap-warn top 588, bottom 715 (inside 812), map 299 px. 375x667: top 508, bottom 635 (inside 667), map 220 px (>= 200). Also in dark at 375x812: bottom 715. |
| A2 | Header picker | PASS | "ioniq 5": "2026 Hyundai IONIQ 5 - N" first, then Long Range AWD XRT / Long Range AWD / Long Range each marked "no trip planning yet". "model 3": "Premium AWD-I" and "Premium-I" show .variant-suffix "-I", colour rgb(164,162,154), 12.8 px (muted). After picking Premium AWD-I the chip reads "My car: Model 3 Premium AWD" (no code). |
| A3 | Plug switches kept / reset | PASS | Model 3 (nacs) + CCS1 switched on -> stored plugs [nacs, ccs1]. Re-pick same car: still [nacs, ccs1]. Pick Kia EV6 Wind: plugs key gone (own plug). |
| A4 | Locate on load (B56) | PASS | Stubbed geolocation + permissions 'prompt' (see method below). (a) no interaction: map centred on stub point (Calgary), dot at viewport centre 640,400. (b) drag at +12 s with answer at +30 s: dot added, map stayed; picking "Ottawa" in Where to? at +14 s, answer at +40 s: map stayed on Ottawa; opening Plan trip at +11 s, answer at +40 s: map stayed. (c) denied (code 1) on load: no message, no dot. (d) Locate me click: "Finding your location..." while waiting; denied stub: "Location access was blocked. Allow it in your browser settings to use Locate me, or pan the map instead." |
| A5 | Tesla Destination T / zoom 14.5 | PASS (partial) | Map key icon enlarged in light: bold red T (fill + 1.1 stroke) on a white disc, readable; map pin code uses the same 1.1 stroke. Downtown Toronto, zoom 14.5, light: grouped circles with counts and tags, no piled pins. I did not find a real Destination pin on the map to inspect, so the pin itself was judged from the key icon and code. |
| A6 | /about#data heading under pill | PASS | 1280: h2 "Data sources and credits" top 80, pill bottom 62 (18 px clear). 375: heading top 80, pill bottom 58 (22 px clear). No horizontal overflow. |

Method note (A4): the page tool cannot add an init script, so I loaded the page HTML into a same-origin full-screen iframe with the stub as the first script in <head>; the stub logged call/answer/mousedown times. Not real location; the real page was untouched.

## B. Cells 4.17 did not run
| Check | Result | Evidence |
|---|---|---|
| QR1 edge: offline reload | NOT POSSIBLE | No offline emulation in this browser tool. Indirect evidence: Archivo Variable served from /node_modules/@fontsource-variable/archivo/files/*.woff2 (own origin), font-display swap, body stack "Archivo Variable", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, so text renders in a system font if the file is missing. The map also fetches label glyphs from tiles.openfreemap.org/fonts/Noto Sans ... (map tile host, expected). |
| QR3 edge: theme switch swaps map style, no reload | PASS | Side menu moon button: window marker survived (no reload), html data-theme -> dark, map went from light to dark style within 5 s. Stores localStorage voltway.theme. |
| QR6 edge: Just browsing | PASS (note) | First visit (cleared storage) shows the map straight away with a "Choose your car" tile and one "Where to?" field; tile opens a compact search with Cancel. Header "Pick your car" dialog -> "Just browsing" is a link to /cars (not the map); header "Map" link then returns to the map (canvas present). |
| QR8 edge: zero stops | PASS | Toronto -> Hamilton: "Total trip time: 54 min" at 32 px (largest text; next is 20.8 px), line "70 km - 54 min driving - 0 stops - 0 min charging", no gap warning, only start and end items. |
| QR8 edge: many stops | PASS | Toronto -> Halifax: 10 stops, "~22 h 23 min", "1,808 km - 19 h 4 min driving - 10 stops - ~2 h 29 min charging". 14 list items (start, 10 stops, end, 2 notes). Unfolded itinerary at 375 is 1,809 px tall (QR13's 1,600 limit is for six stops; the 6-stop gap trip measured 1,473 px). No sideways scroll. |
| QR10 edge: long name at 375 | PASS | "Rivière-du-Loup, QC - Boulevard de l'Hôtel-de-Ville - Tesla Supercharger" wraps to 2 lines inside 54-326 px of 375; no item overflows (light and dark); scrollWidth 375. |
| QR17 edge: source badges | PASS (note) | Car page (/cars/kia/ev6/2025/wind, redirects to /charging?car=...): 22 figures, 22 badges, 3 "Unknown". Compare with 4 cars (EV6 Wind, Model 3 Premium-I, IONIQ 6 Long Range, i4 eDrive40): 57 figures, 57 badges, 11 "Unknown". Note: derived charging rows (e.g. "~15 min", "~292 km", "176 kW") have no per-figure badge; they sit in rows tagged "Estimated". Compare table is 1265 px wide at 1280 (scrollWidth 1265, fits). |

## QR20 axe (violations, wcag2a/aa + 21a/aa)
| State | desktop dark | desktop light | 375 light | 375 dark |
|---|---|---|---|---|
| Trip form | not run (dark) | 0 | 0 | not run |
| Gap trip, sheet folded (Sudbury -> Thunder Bay, 6 stops) | 0 | 0 | 0 | 0 |
| Multi-stop trip (Toronto -> Halifax, 10 stops; 375 sheet unfolded) | 0 | 0 | 0 | 0 |
| Zero-stop trip (Hamilton) | 0 | - | - | - |

## Issues
1. (minor, for owner) QR6 wording: "Just browsing" in the Pick your car dialog goes to /cars, not the map. The map is one tap away via the header "Map" link, so the path still reaches the map, but if the QA text means "closes the dialog onto the map" it does not. Fix if wanted: make it close the dialog and stay on the map, or reword QA.
2. (minor, for owner) QR17 derived charging figures on /compare (e.g. "~15 min", "~292 km", "176 kW") carry no per-figure source badge, only a row-level "Estimated" tag. Probably by design (derived, calculated); confirm that QR17 "every vehicle figure" excludes calculated values.

## Looks off, not in the brief
- The 2025 Kia EV6 Wind's own plug in the data is NACS, so trips use Tesla Superchargers and show "Plugs used: NACS (Tesla)" (data/variants/kia/ev6/2025/wind.json charge_port nacs). Worth the owner confirming this is correct for the Canadian 2025 EV6.
- In dev, the Astro dev toolbar sits over the left half of the map credit line at the bottom centre (clicking there opens toolbar Settings). Dev only.
- After resizing the window with a planned trip showing (no reload), the map did not re-fit to the route (it showed southern Ontario with no route in view). Reload/replan re-fits; likely only an artefact of live resizing.
- Console (cumulative, cannot attribute): seven "Failed to load resource" errors (six 404s and one ERR_CONNECTION_REFUSED). I caused at least two 404s by opening /trip and the dev server was restarted at some point; the network buffer had dropped the URLs, so I cannot say which resources. Worth a fresh look in a clean tab.

## Not checked / limits
- Offline reload (QR1): no offline emulation available.
- A real on-map Tesla Destination pin in light theme (only the key icon and code).
- Real geolocation (stubbed only).
- Dark-theme axe on the empty trip form at desktop, and light/dark axe at 375 on the zero-stop trip (not asked).
