# UI check: Phase 5 (items 5.3, 5.4, 5.7, 5.8; QD1-QD15)
Started 2026-11-18. Dev server http://localhost:4321 (started by coordinator; earlier BLOCKED stub replaced). Findings appended per check.

## Check 1 Settings (PASS, with a note)
- Gear on / and /cars: group heading "TRIPS" with Avoid tolls, Avoid highways (role=switch, aria-checked false by default), Stay in Canada (aria-checked true, aria-disabled true, clicking does nothing), note "Trips outside Canada aren't supported yet."
- Toggling Avoid tolls: aria-checked true, localStorage `voltway.routeOptions` = {"avoidTolls":true,"avoidHighways":false}; survives reload and shows on /cars.
- Keyboard: Enter on gear opens, Tab reaches switches incl. Stay in Canada (3px focus outline visible).
- Switch height: 1280 px = 36 px (desktop, OK); 375 px = 44 px x 254 px wide (PASS).
- 375: scrollWidth 375 = clientWidth 375.
- Note: disabled Stay in Canada looks dimmer yellow, still similar to an enabled switch (minor).

## Check 2 Trip form and re-plan (ISSUE 1)
Car: 2026 Tesla Model 3 Premium AWD (IONIQ 5 Long Range AWD has no curve: form says "We can't plan a trip for this car yet", but the options line shows).
- Summary line on the form: "Avoiding tolls · Change", "Avoiding highways · Change", "Avoiding tolls and highways · Change"; none when both off. PASS.
- Change opens Settings and focus lands on first switch (BUTTON.settings-switch "Avoid tolls"). PASS.
- Trip on screen (Toronto > Montreal, 1 stop): toggle Avoid tolls = exactly 1 new request `/api/route?from=-79.383,43.653&to=-73.567,45.502&avoid=tolls`; adding highways = 1 request `...&avoid=tolls,highways`. PASS.
- FAIL: after "Back to the trip form" (button reads "Return to plan"), changing an option does NOT turn it into "Plan trip". The trip re-plans on its own and the panel jumps straight back to the trip view (Drive button visible 1 s after the toggle). Reproduced with a never-planned combo (highways only: 1 request, then trip view). With cached combos, 2 requests (the first is a 1-2 ms cache hit, the second a real fetch).

## Check 3 Outside Canada (PASS)
Detroit > Toronto link: `/api/route` answered 422 (one request, with &avoid=highways because that option was on), banner "Trips outside Canada aren't supported yet. Pick a start in Canada." (typographic apostrophe), no trip, "Plan trip" button shown. Same at 375 (screenshot outside-canada-375-dark.jpg). Note: the red/brown banner sits below the Plan trip button; sheet at half does not hide it.

## Checks 4, 6, 7, 8 (Toronto > Montreal, Tesla Model 3 Premium AWD, highways avoided, 375 dark) 
Check 4 PASS: Drive button full width (347 x 44 px) under car line and cost; Drive view title "Drive", back arrow "Back to the trip" returns to trip, "Close trip" leaves trip (trip gone, sessionStorage cleared). Content: "Next stop · 1 of 1", station name (wraps over 3 lines at 375), "332 km · arrive ~7:22 a.m.", "Arrive 16 % → charge to 80 % · 17 min · ~$24.72", "Navigate to this stop" Google Maps / Apple Maps (52 px tall). hrefs (target _blank, rel noopener noreferrer):
- Google `https://www.google.com/maps/dir/?api=1&destination=44.59846,-75.69735&travelmode=driving&dir_action=navigate`
- Apple `https://maps.apple.com/directions?destination=44.59846,-75.69735&mode=driving&avoid=highways`
- Whole trip Google `...&destination=45.5017,-73.5673&waypoints=44.59846,-75.69735&travelmode=driving`; Apple `...destination=45.5017,-73.5673&waypoint=44.59846,-75.69735&mode=driving&avoid=highways`. Coordinates only.
- Notes shown: "Apple Maps gets your Avoid choices. Google Maps picks its own roads between stops." and "Your location is never saved or sent anywhere." (the design said "Location is used only while this page is open"; wording differs, fine).
Check 6 PASS (1-stop trip): stubbed watchPosition fed a fix at 44.5985,-75.6975: stop 1 ticked itself ("drive-item done", "Reached"), next became destination ("Last stretch", "Navigate to your destination", "Arrive with 36 %"). "Not reached yet" (44 px) unticks, "Mark as reached" ticks. Hidden page (visibilityState override + visibilitychange): clearWatch called; visible: watchPosition called again. Multi-stop tick-before logic: see check 5.
Check 7 PASS: wakeLock.request('screen') on open, again on visible, release() on back arrow and on Close.
Check 8: PASS from "/" (reload with Drive open and a stop marked reopens Drive, same ticks; sessionStorage `voltway.drive` = {"link":"from=...Toronto&to=...Montreal&start=90&min=15","reached":[true]}; after back arrow the key is null; no `voltway.drive` or start place in localStorage). ISSUE 2: when the URL itself still holds the trip link (`/?from=...&to=...`, e.g. a share link opened in the tab), a reload plans from the link and `clearDrive()` runs, so Drive does not reopen and progress is lost (ChargerMap.tsx line 688-692: link wins over loadDrive; RoutePanel.tsx line 84 clears). Minor note: localStorage `voltway.recentDestinations` holds "Toronto" and "Montreal" (existing B62 feature; destinations only, I could not tell if the start is included since Detroit>Toronto was also run).
Screenshot drive-375-dark.jpg saved.

## Check 5 Whole trip and progress on long trips (PASS)
- Toronto > Montreal (Tesla, 1 stop): both whole-trip buttons (Google/Apple) shown; with Avoid highways on, Apple href carries `&avoid=highways`, Google none; the Drive note says "Apple Maps gets your Avoid choices. Google Maps picks its own roads between stops."
- Toronto > Halifax with Tesla Model 3 plans only 6 stops (8 with highways avoided), so I used a F-150 Lightning Standard Range 2025 (13 stops) for the too-many case. Remaining stops 13 down to 10: no whole-trip button, line "Too many stops to send at once. Go stop by stop."; 9..4: Apple only (waypoint count = remaining stops); 3..1: both. With Tesla highways-avoid trip (5 remaining): Apple only and line "Too many stops for Google Maps at once (3 at most)." Waypoint order follows the list (Perth > Beloeil > Lévis > ... > Millbrook geographically, Apple URL).
- Mark as reached on stop 3 ticks start..3, next = stop 4 ("Next stop · 4 of 8"); Not reached yet on stop 2 unticks 2 and everything after, next = stop 2. PASS.
- "Location is off. Mark stops as you reach them." shows when watchPosition errors with code 1. PASS. No wakeLock API (navigator.wakeLock undefined): no errors thrown/rejected (window error and unhandledrejection listeners empty).
- Desktop screenshot drive-1280-dark.jpg saved. No horizontal overflow at 1280 (1280/1280).

## Checks 9, 10 and summary
Check 9 (looks): no horizontal overflow at 375 or 1280 in Drive or Settings (scrollWidth = clientWidth); no panel element past the right edge; long station names wrap (3 lines at 375). Contrast (computed, all text in .route-panel / .settings-pop incl. opacity): Drive dark 1280 min 5.83, light 1280 min 5.61, dark 375 min 5.83; Settings dark 375 min 5.83, light 375 min 7.21; `.drive-item.done .drive-num` 5.83 (dark), 7.21 (light); yellow Drive buttons dark text on yellow, no text under 4.5. Off-switch edge 4.0:1 dark / about 4:1 light (>= 3). 44 px targets at 375: Drive, Google/Apple buttons (52), whole-trip buttons (44), Mark/Not reached (44), switches (44). Exception: header "Back to the trip" and "Close trip" icon buttons are 30 x 30 (see issue 3). Axe was NOT run: axe-core isn't in node_modules and loading it from a CDN was denied by the permission layer, so no axe results; checks above are manual (names from text on the switches, role=switch, aria-checked/aria-disabled, focus ring 3px).
Check 10: no JS errors or unhandled rejections. Console "error" entries are only network: ERR_CONNECTION_RESET/REFUSED (from when the dev server was down at the start of the session) and two 422 (the expected Detroit refusals).
Words: all new strings found in src/i18n/en.json.
Screenshots: browser screenshots are JPEG and the tool can't re-encode, so they are saved as .jpg, not .png, in docs/plan/reports/phase5/: drive-375-dark, drive-1280-dark, settings-375-dark, settings-1280-dark, outside-canada-375-dark, drive-375-light.
Cleanup: localStorage and sessionStorage cleared, viewport reset to desktop, colour scheme dark. Server calls used: about 7 real `/api/route` (rest browser-cached) plus one 422.

## Issues (ranked)
1. MEDIUM (5.4/QD4): on the trip form after "Back to the trip form" ("Return to plan"), changing a route option does not make the button "Plan trip": the trip re-plans automatically (1 request for a new combo, 2 requests for cached ones, the first a 0-transfer cache hit) and the panel jumps back to the trip view. Repro: plan Toronto > Montreal, Back to the trip form, Settings > toggle an option. Expected "Plan trip" on the form, no request until pressed. Look at the ends-key / `current` handling in `useTrip.ts` and the `editing` state in `RoutePanel.tsx` (the planKey effect at line 75-85 sets editing false on a new plan; auto-plan on ends-key change while editing).
2. LOW-MEDIUM (5.8/QD14): Drive does not come back on reload when the address still holds the trip link (`/?from=...&to=...`, for example a shared link opened on the phone): `ChargerMap.tsx` ~688-692 takes the link and returns before `loadDrive()`, then `RoutePanel.tsx` line 84 calls `clearDrive()`; progress is lost. Works from `/`. Fix: when a link is present and `loadDrive().trip` equals it, use the saved reached list (setResumeDrive) instead of clearing.
3. LOW (44 px): header icon buttons `.route-head .map-place-close` ("Back to the trip", "Close trip") are 30 x 30 px at 375 (existing Trip-panel style, now also in Drive). Suggest 44 px hit area.
4. LOW: the disabled "Stay in Canada" switch (opacity 0.6, yellow) looks close to an enabled one; consider a lock icon or grey track.
5. LOW (looks): at 375 the map-key pill sits over the bottom edge of the half-open sheet, clipping the last visible line (e.g. "Google" button row at y ~800 in the first screenshots of Drive; also over "Location is off." line in light).
6. INFO: Not verified: axe scan (see above); keyboard Tab order inside Drive view; Safari/real phone links (not followed, per brief); Toronto > Halifax "10 stops" case needs a short-range car (used F-150 Lightning, 13 stops, Tesla needs only 6).

## Re-check (after fixes; 375 px, Tesla Model 3 Premium AWD)
1. Form path PASS, shown-trip path FAIL (new regression).
   - Trip shown > back arrow ("Return to plan") > Settings, toggle Avoid tolls: no new `/api/route` request, button reads "Plan trip", panel stays on the form, summary "Avoiding tolls · Change". PASS.
   - Trip shown (planned with Plan trip, and also a trip opened from the link): toggle an option in Settings: the panel drops to the form with "Plan trip" and NO re-plan (0 new requests in 9 s, reproduced twice). Expected (DESIGN-5 2.3, 5.4, QD4): a shown trip re-plans once on its own with `&avoid=...`. Before the fix this worked (exactly 1 request). So the fix now treats the shown-trip case like the form case. FAIL.
2. PASS. Trip link in the address (`/?from=...Toronto&to=...Montreal`), Drive open, stop 1 marked, reload with the same URL: Drive reopens ("Drive" title), stop 1 ticked (done, done, end next), `voltway.drive` still in sessionStorage.
3. PASS. Back arrow and Close in the Trip header and the Drive header are 44 x 44 at 375.
4. PASS. Stay in Canada now has a grey track with a grey knob in both themes. Dark: track rgb(49,50,56), knob rgb(164,162,154), knob vs track 5.0:1, edge rgb(134,132,123) vs menu 3.97:1. Light: track rgb(228,227,221), knob rgb(85,84,78), knob vs track 5.91:1, edge vs menu 4.93:1. (Track alone vs menu is about 1.2:1, but the edge carries it.) Still aria-disabled=true, 44 px tall.
Console: no JS errors; only network entries (stale connection resets and the two expected 422s). Route calls used: about 4 (rest browser-cached). Storage cleared, viewport reset to desktop dark.

## Re-check 2 (item 1 after the second fix; 1280 dark, Tesla Model 3)
- (a) PASS: trip on screen, toggle Avoid tolls on: trip view returns ("Drive" button) with `/api/route?...&avoid=tolls` (2 performance entries, both transferSize 0, i.e. browser-cache hits: the combo had been fetched earlier in this browser session, so no real server call); toggle back off: trip returns, 2 more entries without `avoid` (cache hits). Note: cached combos show a pair of entries per change; a never-fetched combo showed a single entry in the earlier run. Harmless, but not literally "one".
- (b) PASS: trip shown > back arrow ("Return to plan") > toggle an option: no new request, button reads "Plan trip", panel stays on the form, summary "Avoiding tolls · Change".
- Console: no JS errors (network entries only). Storage cleared, viewport reset to desktop dark.

## Re-check 3 (centred app buttons, painted route line; 1280 and 375, dark and light)
Cars: F-150 Lightning Standard Range 2025 (Toronto > Halifax, 13 stops, 2 stops marked reached) and Tesla Model 3 (Toronto > Montreal). Route calls: all browser-cached (0 new server calls).
- Button labels PASS: `.drive-app` is display:flex; text box centre vs button centre: next-stop buttons (52 px tall) dy -0.58 px, dx 0 to -0.01; whole-trip buttons (44 px tall) dy -0.13 px, dx 0. Same at 1280 and 375, dark and light. Within 1 px.
- Line continuity PASS: rows touch with no gaps (gap 0 between all 15 .drive-item rows, 1280 and 375); each row's `::before` is absolute, left 15 px, width 10 px, centred on the mark (offset 0 px); first row's line starts at the start mark's centre (top 24 px), the last ends at the destination mark's centre (bottom 24 px, mark centre = row centre). Marks and text are position:relative, z-index 1 (drawn above the line), marks have a 3 px ring in the surface colour.
- Greying PASS: after marking stops 1 and 2: rows = start(D) stop1(D) stop2(D) stop3(next)...: start>1 and 1>2 grey (driven gradient), stop2's row is grey above its mark and yellow below (2 gradients), 2>3 and onward yellow. Seen in all four screenshots; dark looks right (grey #A4A29A line on a dark band).
- ISSUE 6 (LOW-MEDIUM, light theme only): the driven (grey) segments use `--muted` #55544E on the dark band #2B2C30 = about 1.8:1, so the ticked part of the line is hard to see in light mode (it reads as an almost black bar; the yellow part is clear). Suggest a lighter grey for the driven segment in light theme (e.g. the dark theme's #A4A29A, 5:1 on the band). The ticks and "Reached" text still carry the state, so not blocking.
- No horizontal overflow (375/375, 1280/1280). On the half-open phone sheet (324 px of scroll area) the buttons and list cannot both show; the full-height sheet (tap the handle) shows both.
- Still seen: the dark map-key pill overlapping the bottom of the sheet at 375 (issue 5 above).
Screenshots overwritten in docs/plan/reports/phase5/: drive-375-dark.jpg, drive-1280-dark.jpg, drive-375-light.jpg (each with stops 1 and 2 reached; 375 versions use the expanded sheet scrolled to show the buttons and the first list rows); new drive-list-375-dark.jpg (end of list down to the destination mark). Storage cleared, viewport reset to desktop dark.
