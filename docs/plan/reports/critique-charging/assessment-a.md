# Assessment A: Charging page design review (in progress)

Date: 2026-11-18. Surface: /charging (ChargingPage.astro -> CarExplorer.tsx -> CurveViewer.tsx).

## Evidence so far (1280 dark)
- First load with no saved car: page jumps straight to the first car alphabetically (2026 BMW i4 eDrive40), which has an ESTIMATED curve. No page title "Charging"; the only h1 is the car name. Brief "Loading…" text flash before content.
- Order above the fold at 1280x800: intro sentence + coverage note, collapsed "Select vehicle" accordion, eyebrow + car h1, "Set as my car" / "+ Compare", "Charging curve" h2, violet estimate banner, 8-9 controls, 6 result tiles. The chart starts at ~y=730 of 800: the curve itself is below the fold.
- Only 12 of 84 variants have a non-estimated default curve (tested/community). Most visitors see a violet banner + dashed line first.
- Controls in one auto-fill grid: (Curve), Start slider, End slider, Charger, Range basis, Wheels (+ tire note), Show against (SoC/Time), Distance (km/mi), Price per kWh. 8-9 inputs at one decision point, same weight, no grouping; layout reflows differently per car (Curve select span 2 on EV9 pushes everything).
- Three segmented toggles/ sliders filled yellow at once (SoC, km, slider thumbs) + nav "Charging" pill + measured curve line and fill in yellow: breaks the One Paint Rule.
- Results: six equal tiles (time, added highway, added per 10 min, added kWh, avg kW, cost). The headline answer (10->80% in ~20 min) has the same size and weight as "Average power".
- EV9 measured 18-80%; default window 10-80 uses dashed extrapolation 10-18% so results get "~", but the tiles carry no source/estimate badge; banner is violet for a "Tested" curve.
- Curve footnote is one run-on paragraph: curve kind + source + warm-battery caveat + kWh drawn/losses + price default help.
- Distance km/mi toggle duplicated here and in Settings; price duplicated in Settings.
- Below chart: "More detail", then accordions Car figures and assumptions / Specifications / Trims / Sources.

Screenshots: a-1280-dark-estimated-fold.jpg, a-1280-dark-estimated-chart.jpg, a-1280-dark-measured-fold.jpg, a-1280-dark-measured-chart.jpg

## Remaining
375 dark, 1280 light, first-load, reference page.

## 375 dark (production voltway-routing.vercel.app, since 4322 was down)
- Fold at 375x812 holds: nav pill, 3-line intro, Select vehicle card, car head, buttons, h2, 5-line violet "Measured from 18% to 80%" banner, Curve select, sliders, Charger/Range basis, Wheels. ZERO results and no chart above the fold. The answer (time 10-80%) is about 1.5 screens down. Screenshot a-375-dark-measured-fold.jpg.
- Scrolled: results are a 2x3 grid of equal tiles after Wheels/Show against/Distance/Price; chart below that. At 375 the y-axis name "Power (kW)" collides with the "10%" window label. Screenshot a-375-dark-measured-results.jpg.

## 1280 light (Polestar 2 Dual Motor, Tested 2021)
- Same layout. Accent goes to amber #6F5300: selected toggles are brown-filled, curve line brown, delivered fill is a khaki/olive wash. Reads muddy rather than "road paint"; the curve has less presence than the yellow does in dark. With this car the chart top edge sits at the fold (~y=630/800), so only the top of the curve is visible.
- "Tested (2021)" curve on a 2025 car: the year mismatch is shown only in the dropdown, not explained.
- First load (no saved car): auto-selects BMW i4 eDrive40 (first alphabetically), an estimated curve; brief "Loading…" text. No empty state, no "pick your car" moment; intro says "Pick a car" while the picker is collapsed.
Screenshot a-1280-light-measured.jpg.

## Reference: better-dcfc-calculator.vercel.app/charging
- 1280: two columns. Left rail = Select Vehicle card (Database/Custom, Surprise me, make/model/variant) and Specs card (range scenario, battery, station power slider, dwell time slider, limit-by-current). Right = big "Charging Session" chart, visible above the fold at 1280x800, with legend (Vehicle limit / Actual speed), Y Power/Current and X SoC/Time toggles in the chart header, red dashed charger-limit line, green start and orange end guides, and ONE dual-thumb SoC range slider directly under the chart (10% / 80% labels coloured to match the guides). Results below: three cards Time ("41m 6s ACTUAL", ideal vs lost to limits), Range added (mi big, km small), Avg speed; then pack voltage/current cards.
- 375: inputs stack first; the chart is several screens down. It does not solve phone either.
- Takeaways: chart is the hero and the controls that change the chart sit ON the chart (window slider, axis toggles, legend); persistent car+inputs rail; the time result is visually dominant with "ideal vs lost" context. Weaknesses: generic dark-navy + blue SaaS look, icon tiles, dense enthusiast clutter, no sourcing, mph/kph oddities.
Screenshots: a-ref-1280-dark.jpg, a-ref-1280-dark-results.jpg, a-ref-375-dark.jpg

## Final report
See the SubagentHandback report (same content), appended below on completion.

### Verdict
Half-authored. The honesty layer (violet dashed estimates, "Measured from 18% to 80%" dashed tails, inline source link with footnote number) is specific to Voltway and could not be copied truthfully by a neighbour. Everything around it is the category default: intro line, accordion picker, flat form grid, row of equal KPI tiles, chart, accordions. Road Paint reaches this page only as colour tokens; the answer number is 1.15rem body text, not the Overpass display face the trip planner gives its total time.

### Heuristics (26/40)
1 Status 3 | 2 Real world 3 | 3 Control 2 | 4 Consistency 2 | 5 Error prevention 3 | 6 Recognition 3 | 7 Flexibility 3 | 8 Minimalist 2 | 9 Error recovery 2 | 10 Help 3

### Priority issues
P1 Answer not the hero (chart below fold at 1280x800; six equal tiles) -> layout, typeset
P1 Control wall (9 flat inputs, Distance/Price duplicate Settings) -> distill, layout
P1 Phone: nothing answered above the fold at 375 -> adapt
P2 One Paint Rule broken by yellow-filled toggles, thumbs, fill; light theme khaki/brown muddy -> colorize, quieter
P2 First load silently shows BMW i4 (estimated) -> onboard
