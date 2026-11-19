# UI check: 10.7 B83 overdrive "Road unrolls" (QC10-QC13)

Page: /charging?car=kia/ev9/2026/land-awd-gt-line (and Niro EV via the Model select). Chromium with `appearance: base-select` supported (true). Defaults used: none missing.

**Verdict: PASS (0 defects), 3 minor notes.**

| Row | desktop dark | desktop light | 375 light | 375 dark | Verdict |
|---|---|---|---|---|---|
| QC10 Section motion | pass (behaviour) | look ok | look ok, motion ok | look ok | PASS |
| QC11 Animations off | pass (behaviour) | - | - | - | PASS |
| QC12 Headers, source links | pass | pass | pass | pass | PASS |
| QC13 Select menus | pass | pass | pass | pass | PASS |

## QC10 evidence (1280 dark)
- All five sections (Select vehicle, Car figures, Specifications, Trims, Sources): open adds `acc-opening`, body animation 320 ms, lane animation 420 ms, 5-11 animations incl. staggered risers (60 ms + 30 ms steps); close adds `acc-shutting`, body animation 220 ms; after both, class is back to `card acc`, `details.open` false after close, no inline style on `.acc-body`, `getAnimations()` empty.
- Fast double click mid-open: goes to `acc-shutting`, ends closed, class cleared, no inline style. Open, close, click again mid-close: ends closed, clean (no stuck class, no clipped body).
- Keyboard: Tab-focus on Trims header, Enter opened (acc-opening, 5 animations), Space closed; focus outline `3px solid rgb(255,212,0)`, `:focus-visible` true.
- Programmatic `details.open = true`: no acc-* class, body 747 px, nothing clipped.
- Content height: all bodies `height == scrollHeight`, no style attribute; after switching car to Niro EV with sections open, still no fixed height. Select vehicle stays open across the car change (controlled state).
- 375: open/close classes behave the same (acc-opening, then cleared; acc-shutting, then closed).
- Console: only the stale `carData is not defined` (?t=1795056028965), ignored per brief.

## QC11 evidence
- Real Settings control (gear, Animations Off): `html[data-motion="off"]`, `localStorage voltway.motion=off`; persisted across a reload.
- All five sections open and shut at once on click: no `acc-opening`/`acc-shutting`, body/lane animations 0, `getAnimations({subtree:true})` 0. summary, chevron, select, `::picker(select)` transition-duration all `0s`.
- Turned Animations back On through Settings with no reload: animations immediately returned (acc-opening class, 5 animations, summary transition 0.2 s).
- Not separately screenshotted: the picker drop-in with motion off (computed transition is 0s).

## QC12 evidence
- Titles `Overpass Variable` in all five headers, all four passes.
- Pills: `.acc-chips` with mask fade gradient, `chipsOv` false, summary no overflow. At 375 the pills wrap to a second row and fit (313 px box, last chip right edge 259/344), so the right-edge fade is present in CSS but not visibly exercised (no preview long enough to overflow; not tested with a long car name).
- Chevron: 30 px (28 px at 375), `rotate: 180deg` when open. Dark: bg `rgb(58,51,16)` (yellow-soft), arrow `rgb(255,212,0)`. Light: bg `rgb(255,241,168)`, arrow `rgb(111,83,0)` (dark amber, not yellow).
- Lane line: 2 px high, repeating dash gradient, full header width (1046 px desktop, 313 px at 375). Dark yellow, light `rgb(111,83,0)`: visible in both.
- Pill text contrast: 12.74 dark, 13.39 light.
- Source link: clicked real `[6]` with Sources closed (1280 dark): Sources open at once (no `acc-opening`, no body animation), entry `#source-6` at y 406-474 of an 800 px viewport (in view). Repeated at 375 light via script: opens, entry 400-492 of 812, no horizontal scroll (375/375).
- Horizontal overflow: 1280 scrollWidth = clientWidth (1265, scrollbar), 375 = 375 in light and dark.

## QC13 evidence
- All 8 selects (5 in Select vehicle, others in Car figures/Trims area incl. wheel-size): font `Overpass Variable` weight 600, `appearance: base-select`, `text-overflow: ellipsis`, padding-right 34 px, height 37 px, same size closed and picked (no layout shift seen).
- Contrast: dark text 14.67, border vs card 3.79; light text 16.35, border 4.93. (Disabled Trim select is dimmed at opacity 0.6 and looks disabled.)
- Open list (real click, dark and light, desktop; keyboard alt+Down at 375 dark): raised card, dark bg `rgb(31,32,35)` / light `rgb(250,249,245)`, 1px border, radius 10 px, shadow, option radius 6 px, chosen row yellow-soft with checkmark (dark `rgb(58,51,16)`, light `rgb(255,241,168)`), option text contrast 15.1-16.4 light. Drop-in transitions 0.18 / 0.24 s.
- Keyboard: ArrowDown + Enter changed Model EV9 -> Niro EV: URL became `?car=kia/niro-ev/2026/standard`, h1 "Niro EV Standard", all selects updated. Escape closed the list without changing the car. Tab onto a select shows `3px solid rgb(255,212,0)` outline, offset 2 px.
- Type-ahead not tested.

## Notes (not defects)
1. Reversal: a second click during an opening animation closes from the partial height (fine), but a click during a closing animation keeps closing rather than re-opening. Ends clean, just not a true "reverse".
2. After the double click test, one stray animation remained in `getAnimations({subtree:true})` on the closed Specifications section 800 ms later (count 1, class clean, open false). Harmless but possibly a cancelled/finished leftover rise.
3. Pill right-edge fade was not visible in any state tested (nothing overflowed).

## Could not check
- Pill fade with an overflowing preview; type-ahead in the select; a non-Chromium browser (native select fallback). Screenshot pane is scaled small, so visuals are judged from computed values plus zooms.

Screenshots: `docs/plan/reports/b83/qa-od-1-dark-1280-select-open.jpg`, `qa-od-2-dark-1280-picker-section.jpg`, `qa-od-3-light-1280-select-open.jpg`, `qa-od-4-dark-375-select-open.jpg`, `qa-od-5-light-375-section.jpg`.

Cleanup: removed `voltway.motion` and my sessionStorage helper; viewport reset to desktop, dark.
