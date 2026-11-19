# UI check: B86 Cars page overdrive (QV1-QV5)

Run 2026-11-19 on http://localhost:4321/cars (dev server). Pane was 532 px wide, so 1280 and 375 were emulated with resize_window. Theme and Animations were changed with the real Settings controls. Storage restored (voltway.browse back to its original value, voltway.browseOpen/theme/motion removed); viewport reset to desktop, colorScheme dark.

**Verdict: PASS (QV1-QV5), 0 blocking issues, 4 minor notes.**

| ID | Result | Evidence |
|----|--------|----------|
| QV1 | PASS | See below |
| QV2 | PASS | See below |
| QV3 | PASS | See below |
| QV4 | PASS | See below |
| QV5 | PASS | See below |

Matrix coverage: QV2 contrast/overflow was measured in all four passes (1280 dark, 1280 light, 375 light, 375 dark). QV1, QV3, QV4, QV5 behaviour was checked at 1280 dark (QV1 phone sheet at 375 light), as the brief allows.

## QV1 Filter sections
- 11 `details.acc.bf-sec` found: Model year, Minimum range, Minimum DC peak, Maximum 10-80% time, Make, Body type, Drivetrain, Charge port, Voltage class, Heat pump, Battery chemistry.
- First visit (both keys cleared, reload): all 11 closed, including Model year, which carried the default 2026/2025. Default years therefore did not count as in use.
- After ticking BMW and setting min range 200 km (slider via keyboard), count 3 cars. Closed Make header showed chip "BMW"; Min range header showed "200 km or more". Toggling is remembered: `voltway.browseOpen` updates (written a tick after the click) and after reload open = [years F, range T, ..., make F] exactly as left, chips intact.
- Clear filters: all chips gone except default Model year 2026/2025; count 84; range slider 0; stored filters back to defaults.
- Phone sheet (375, light): Filters (1) button opens `.browse-filters` (role=dialog, aria-modal=true, fixed, 375x650), focus lands on close button; sheet scrolls (overflow auto, scrollHeight 1600 vs clientHeight 648, scrollTop 0 to 400 worked). 60 Tab presses: 60 focusin events, 0 outside the sheet. Escape closes (display none) and focus returns to the "Filters (1)" button.

## QV2 Design language
Contrast ratios (computed colour against composited background; 4.5 needed):

| Element | 1280 dark | 1280 light | 375 light | 375 dark |
|---|---|---|---|---|
| card name (.cc-name a) | 14.67 | 16.35 | 16.35 | 14.67 |
| pill unchecked | 14.67 | 16.35 | 16.35 | 14.67 |
| pill checked (dark text on #FFD400) | 12.03 | 12.03 | 12.03 | 12.03 |
| readout label | 5.53 | 5.91 | 5.91 | 5.53 |
| readout value | 12.74 | 13.39 | 13.39 | 12.74 |
| count number | 15.51 | 14.69 | 14.69 | 15.51 |
| count help line | 6.74 | 6.48 | 6.48 | 6.74 |
| mark.hit | 11.39 | 15.09 | 15.09 | 11.39 |
| switch label (on / off) | 14.67 / 14.67 | 16.35 / 16.35 | same | same |
| switch help text | 6.37 | 7.21 | 7.21 | 6.37 |
| slider label | 6.37 | 7.21 | 7.21 | 6.37 |
| selects | 14.67 | 16.35 | 16.35 | 14.67 |
| Estimated tag | 8.08 | 6.15 | 6.15 | 8.08 |

- Names use "Overpass Variable"; readouts are `dl.readouts` with raised bg (dark rgb(42,43,47), light rgb(228,227,221)); readout boxes at 375 are 152x56 each, no overflow; card 343 px wide.
- Unchecked pill border 124,122,114 dark / 110,109,102 light (3:1 edge ok against the surfaces). Switches: `button role=switch`, aria-checked true/false, ON track yellow, OFF track raised with visible border.
- Keyboard focus on a pill (Tab from Make section): the pill shows a 3 px solid rgb(255,212,0) outline (`:focus-visible` true), visible in screenshot. Checked state = yellow fill.
- No horizontal page scroll: 1280 scrollWidth 1265 = clientWidth 1265; 375 scrollWidth 375 = clientWidth 375 (light and dark).

## QV3 Live reflow (1280 dark, Animations on)
- Tick Hyundai (65 to 10 cars): ghosts 6 (each with 1 animation) at 44 ms, still 6 at 200 ms, 0 at 506 ms; staying cards had 6 transform animations until ~200 ms, 0 after 506 ms. Untick: entering cards `transform+opacity` (6) plus moving `transform` (6), 0 animations by ~1.2 s.
- Sort (name to range and back), search "kia", clear search: max 12 animated cards at once (doc-wide max 12-17 incl. ghosts), all gone by ~600 ms; `.flip-ghosts` children 0 at 600 ms and after, `document.getAnimations()` = 0 at 2 s in every case.
- Only near-screen cards animate: with 84 cards, 69 offscreen cards had 0 animations in every sample; the source rule (useFlip.ts) animates a card only if its start or end spot is within 80 px of the viewport. With the page scrolled to 2200 px a tick showed 4 animated cards and 12 ghosts, none left behind after 1.5 s.
- Table view: Table button gives 84 rows, Kia tick gives 9 rows, untick back to 84, no animations, no card list; switching back to Cards gives 84 cards.

## QV4 Count and search (1280 dark)
- "ioniq": `.count-num` sequence 84, 52, 31, 19, 12, 9 cars; the `role=status` node changed once, to "9 cars". 9 cards, 9 `mark.hit` (text "IONIQ").
- "model 3": 9, 7, 6, 5, 4; status text once, "4 cars"; marks "Model" and "3" (8 marks over 4 cards).
- "zzzz": count to 0, status "0 cars", empty message "No cars match. Try fewer filters or another search."
- Clear: 0, 33, 59, 75, 82, 84; status "84 cars" once.

## QV5 Animations off (real Settings control)
- `html[data-motion=off]` set; pill, switch track, switch knob and card `transition-duration` all 0s.
- Tick/untick Hyundai, sort, search "ioniq", clear: max `document.getAnimations()` = 0, max ghosts = 0 in all five actions; count jumped straight between final values (84 to 10, 84 to 9) with no intermediate numbers.
- Turned Animations On again via Settings with no reload: tick Hyundai gave 17 animations and 6 ghosts, pill transition-duration back to 0.15 s.

## Console
Only the two stale HMR errors the brief told me to ignore (carData is not defined, Missing i18n key "viewer.custom"). No other errors.

## Defects / notes (ranked)
1. Low: count tick shows "1 cars" mid-tick (sequence 4, 2, 1, 0 cars for "zzzz"); the animated number uses a plural-less string. Only the aria-hidden visual and only transiently; the status line is correct. Check whether the final "1 car" case is handled by the i18n plural.
2. Low: closed-header chips also show while a section is open (e.g. "BMW" chip above the BMW pill, "200 km or more" above the slider). Redundant but harmless; the spec only requires chips when closed.
3. Low: the default Model year 2026/2025 shows as chips on the closed header on first visit (not "unset"). Matches "default years not in use" for opening, but the chips appear; decide if intended.
4. Info: the Make/Body/etc. "near screen" claim could not be measured with a clean off-screen scroll test because the page height shrinks on filter and clamps scroll; verified from the source rule and the zero-animation count on 69 offscreen cards instead.

## Not checked
- QV3/QV4/QV5 behaviour at 375 and in light theme (look-only passes per the brief); QV1 at 1280 light; first-visit state at 375.
- Real screenshots were only 532 px wide (pane scaling), so visual judgement of slider look relied on computed styles and a couple of small screenshots.

## Re-check after owner review (2026-11-19)

Scope: checkbox lists and per-section Clear (design-language §10). Dev server, tab "seed", 1280x800 and 375 (mobile preset), dark and light. Clear's behaviour tested at 1280 dark with real clicks and keys; looks measured in all four passes. Storage voltway.browse restored exactly, voltway.browseOpen removed (it was absent), voltway.motion removed, viewport and scheme reset.

**Verdict: ISSUES (2)**. QV1 FAIL (one layout overlap), QV2 PASS with one minor note, QV5-spot PASS.

| Check | 1280 dark | 1280 light | 375 light | 375 dark | Evidence |
|---|---|---|---|---|---|
| Clear only on sections in use | PASS | PASS | PASS | PASS | Default state: 0 Clear buttons (years 2026+2025, heat pump "any"). After setting: Model year only when one year off, Heat pump only when not "any", sliders when > 0 (time when < 60) |
| Clear resets only its section, focus on its summary | PASS | n/a | PASS (Make, phone) | n/a | Make x3 (BMW, Cadillac, Chevrolet) 17 cars: one Clear click empties makes, button gone, focus = Make summary, Body type "crossover" untouched; count back to expected. Keyboard (Shift+Tab to "Clear Body type", Enter) same |
| Clear on a closed section | PASS | n/a | n/a | n/a | Closed Make with 3 chips: click cleared, section stayed closed, focus on summary |
| Model year / sliders / heat pump Clear | PASS | n/a | n/a | n/a | years [2026] -> [2026,2025]; range 200 -> 0 (slider 0); DC 100 -> 0; time 50 -> 0 (slider 60); heat pump "available" -> "any" (radio Any checked) |
| Clear text contrast | 11.38 | 6.84 | 6.84 | 11.38 | yellow on panel dark; dark gold rgb(111,83,0) on rgb(250,249,245) light |
| Clear hit area | 48x26 | 48x26 | 48x26 | 48x26 | passes 24x24; below 44 px touch size on phone (note) |
| Clear vs title / chevron | FAIL | FAIL | PASS | PASS | see Issue 1. 375: title text right edge max 174 vs Clear left 278; Clear right 326 vs chevron left 332 (6 px gap) |
| Clear focus ring | PASS | PASS (set) | n/a | n/a | keyboard: 3 px solid rgb(255,212,0), offset 1, :focus-visible true; tab order Clear, summary, controls (Model year Clear, Model year summary, checkbox, checkbox, Minimum range Clear ...) |
| Checkboxes native, row clickable | PASS | PASS | PASS | PASS | input[type=checkbox] 18x18, accent-color rgb(255,212,0); click 150 px right of the label text toggled it |
| Checkbox focus ring | PASS | not keyboard-tested | n/a | n/a | Tab onto checkbox: 3 px solid yellow, focus-visible true |
| Label contrast | 14.67 | 16.35 | 16.35 | 14.67 | |
| Rows at 375 | n/a | n/a | 44 px min (31 rows) | 44 px min | 1280: 34 px rows |
| Heat pump radios exclusive | PASS | n/a | n/a | n/a | name bf-hp, Any/Standard/Standard or optional; ArrowDown moved selection (state "available"), only one checked |
| Phone sheet | n/a | n/a | PASS | PASS (layout) | dialog 0,162 to 375,812, scrolls (scrollHeight 2525 / clientHeight 648); 60 Tabs stayed inside; Escape closes and focus returns to "Filters (n)"; scrollWidth = clientWidth = 375 |
| Chips: closed shows, open hides | PASS | n/a | n/a | PASS | open: .acc-preview display none; closed: chips row below the title row (y 500 vs Clear y 467-493), no overlap |
| Horizontal overflow | 1265/1265 | 1265/1265 | 375/375 | 375/375 | |
| QV5 spot (Animations off, real Settings control) | PASS | n/a | n/a | n/a | data-motion=off; transition-duration 0s on Clear, checkbox, chevron; 0 running animations sampled each 16 ms across tick and Clear; .flip-ghosts has 0 children; count 84 -> 3 -> 84 instantly; Clear restores focus |
| Console errors | only the two stale ones | | | | carData is not defined, Missing i18n key viewer.custom (ignored as briefed) |

### Issues, by severity

1. **Medium, QV1, layout overlap: Clear covers the title "Maximum 10–80% time" at 1280.** Page /cars, any theme, viewport 1280 (sidebar filter panel 215 px wide). Steps: set Maximum 10-80% time to 50 so Clear appears. Expected: Clear clear of the title text. Actual: title text spans x 106 to 263, Clear spans x 237 to 285 (26 px overlap; Clear rect y 508-534 vs title row 508-527). The summary also grows to 70 px tall so the chevron sits at y 533 while Clear is at the top row. Near misses at 1280 with Clear showing: "Minimum DC peak" text ends x 227 (10 px gap), "Battery chemistry" ends x 228 (9 px gap; Clear would be shown when a chemistry is ticked, not directly tested). Fine at 375 (sheet is wider). Suggest: let the title shrink/wrap or reserve room for Clear.
2. **Low, QV2, light theme checkbox edge:** checked boxes use the yellow accent (rgb(255,212,0)) on rgb(250,249,245), about 1.3:1 for the box edge. The dark tick inside keeps the checked state readable (confirmed by screenshot), so I did not fail it; flagging against the 3:1 control-edge rule.
3. **Low (note), phone touch target:** Clear is 48x26 on a phone; rows are 44 px but Clear is below that. Passes the 24x24 minimum in the brief.

### Not checked
- Keyboard focus ring on checkboxes and Clear in light theme and at 375 (programmatic focus only; same CSS as dark).
- Clear for Battery chemistry / Body / Drivetrain / Charge port / Voltage class (same code path as Make; only Make and Body type tested). Chemistry title overlap inferred from text width.
- Screenshots at 375 were too small to read; 375 results come from measurements.
- First-visit open-state rule (QV1) was not re-run; my tests wrote browseOpen.

### Fixes after the re-check (2026-11-19, main session)
- Defect 1 (Clear over "Maximum 10–80% time" at 1280): section titles now shrink and wrap (`flex: 1 1 0; min-width: 0`), so the chevron stays on the title row. Re-measured with Model year, range, DC, time, heat pump and chemistry all set: no title text overlaps Clear at 1280 (time title wraps to 2 lines) or 375.
- Minor (Clear 26 px tall on phones): now 44 px at ≤ 640 px, centred on the chevron (mid 22 vs 23 px), inside the summary row.
- Kept: the yellow checkbox edge on the light theme (~1.3:1); the dark tick and the semibold label carry the checked state.
