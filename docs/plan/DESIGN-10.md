# Phase 10: Trip settings, weather and wheels, CA/US units (B123)

Status: **approved by the owner 2026-11-20; building locally for review.** Answers the owner's goals of 2026-11-20 and the choices picked that day (trip panel card, typed temperature, summary line + results hint, Region preset + both unit rows). Nothing here changes routing itself (the ORS request); it changes the energy model's inputs and the trip panel.

## Goals (owner, 2026-11-20)

1. Settings menu: drop the "On: … Off: …" help under **Stay within the border**.
2. Use the outside temperature in trip planning.
3. Gate the temperature and wheel-size effects behind an optional switch in Trip settings.
4. Hint at Trip settings while planning, without cluttering it.
5. A Canada / US preset in Settings that sets km + °C or mi + °F.
6. (Owner, in the answers) Trip settings also hold Avoid tolls, Avoid highways and Stay within the border (still in the Settings menu too); add an **Arrive at %** field; shorter labels on the number fields.

All of it follows `docs/design/design-language.md` (raised panels, `.seg` switches, `.settings-switch` switches, row actions, Overpass headings) and the trip panel's Road-unrolls card (B89).

## 1. Settings menu (header gear)

```
Settings
Theme         [ Light | Dark | System ]
Animations    [ On | Off ]
Charging price per kWh   [$ 0.45]
  Used to estimate what trip stops cost…
Region        [ Canada | US ]          ← new
Distances     [ km | mi ]
Temperature   [ °C | °F ]              ← new (was only on the Charging page)
Trips
  Avoid tolls                 (─○)
  Avoid highways              (─○)
  Stay within the border      (●─)     ← help text removed
```

- **Region** sets both units at once: Canada = km + °C, US = mi + °F. It shows as pressed only while both units match one region; mixed units leave neither pressed. It is not stored on its own; it is read from the two units.
- **B131 (owner 2026-11-20):** the results' weather line ("Cold out? Change ›" / "Planned for −10 °C with 20-inch wheels. Change ›") moves from the bottom of the itinerary to just under the cost line; its link is the shared "Change ›" in both states ("Adjust in Trip settings" is gone).
- **B129 (owner 2026-11-20):** General settings, Trip settings and My plugs open and close with the site's fold animation (instant with Animations off). My plugs keeps its open or closed state when the menu closes, for as long as the page is open; a page load starts it closed.
- **Owner review round 6 (2026-11-20):** the Settings menu has two folds: **General settings** (Theme, Animations, Region, Temperature; open on a first visit) and **Trip settings** (closed on a first visit). Opening one closes the other; clicking an open one closes it (both closed is allowed). A closed fold shows its summary line ("System theme · Animations on · Canada · °C"; "Mixed units" when Distances and Temperature don't match a region). The open fold is remembered in the browser (`voltway.settingsFold`: general | trips | none). The My car menu's plug title is shortened to **My plugs**.
- **Owner review round 5 (2026-11-20):** in the header's My car menu, **Plugs my car can use** folds the same way: the title (now full text colour) and a grey line with the plugs that are on ("NACS (Tesla), CCS1"), switches hidden until opened. It starts folded each time the menu opens, except when a trip's plugs "Change ›" opens the menu: then it's open with the first switch focused.
- **Owner review round 4 (2026-11-20):** the menu got long, so **Trips** becomes **Trip settings** (sentence case, the display font, no all caps) and folds to its title plus a grey summary line ("km · $0.45/kWh · Fastest route · may cross the border"), closed by default. It now holds **Distances** and **Charging price per kWh** (with its help line) above the three route switches. Theme, Animations, Region and Temperature stay at the top. Region still sets Distances inside the fold (the summary line shows the new unit). "Change cost estimate" and the border message open the fold at their row. The owner picked Distances inside the fold over keeping it next to Region (2026-11-20).
- **Temperature** writes `voltway.tempUnit` (B116's key) and broadcasts it, so the Charging page's own °C | °F switch (kept) follows, and vice versa. The B116 rule stays: with no saved °C/°F choice, temperature follows the distance unit.
- **Stay within the border:** the `settings.inBorderHelp` line and its `aria-describedby` go. The switch's name says enough; the trip status messages already explain a blocked crossing.

## 2. Trip settings card (trip panel)

The car card's open title "Car and battery" becomes **Trip settings**. Open, top to bottom, each block on the card's own raised surface with faint dividers (design-language §3):

```
🚗 2022 Audi Q4 e-tron*                        ⌃
   Trip settings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Battery
  Start      Charge at    Arrive at
  [ 90 %]    [ 15 %]      [ 15 %]
───────────────────────────────────────────────
Route
  Avoid tolls                       (─○)
  Avoid highways                    (─○)
  Stay within the border            (●─)
───────────────────────────────────────────────
Weather and wheels                  (●─)
  Outside temperature  [ −10 ] °C
  Estimate: ~40% less range
  20″ wheels · heat pump fitted
───────────────────────────────────────────────
Plugs used                    Change plugs
  CCS1
───────────────────────────────────────────────
⚙ Modify car settings                        ›
🚗 Change car                                 ›
```

- **Battery:** three short-labelled number fields in one row (two plus one on very narrow phones): **Start**, **Charge at**, **Arrive at**, each with a "%" suffix inside the field. Screen readers get the long names ("Battery at the start", "Stop to charge at", "Arrive at the destination with").
  - **Arrive at %** (new): the charge to have left at the destination. Default **20 %** (owner, 2026-11-20; until now the destination target was the threshold, 15 %). Range 5–90 %. The planner uses it only for the final leg (§4). Saved with the trip and in the link (`arrive=`).
- **Route:** the same three switches as the Settings menu, bound to the same stored options (`route-options.ts` / the border setting), so changing either place updates both. The "Avoiding tolls · Change" line under the closed card stays, and its Change now opens this card at Route instead of the Settings menu.
- **Weather and wheels** (switch, **off by default**, remembered in the browser):
  - Off: nothing else shows; the plan uses mild weather and the rated wheels, exactly as today.
  - On: an **Outside temperature** number field in the site's temperature unit (°C/°F from Settings; no unit switch here), default 20 °C (68 °F). One temperature for the whole trip. Saved with the last trip and in the link (`temp=`, stored in °C).
  - Under it, a muted "Estimate:" line with the combined change in range (owner 2026-11-20: range, not energy per km, reads better; "~40% less range" = 1 / energy factor), and a line naming what My car's settings feed in: wheels (standard or the picked size) and the heat pump (standard / fitted / not fitted / none / not known). That line links nowhere; Modify car settings is two rows below.
- Plugs, Modify car settings and Change car stay as they are.
- **Owner review round 1 (2026-11-20):**
  - **Battery stays open**; **Route** and **Plugs used** fold to their title and a grey summary line ("Fastest route · may cross the border", "Avoiding tolls · staying within the border"; "CCS1"), with a small round chevron. "Change" under the closed card opens Route.
  - The switch is named **Range adjustments**; off, a grey line reads "Mild weather, standard wheels".
  - **Modify car settings** moves behind the switch: with it on, the "19″ wheels (standard) · no heat pump fitted" line is a row with **Change ›** that opens the Modify car settings dialog. The dialog is still in the header's My car menu.
  - Text summaries, not pills (design language: grey summary lines).
- **Owner review round 3 (2026-11-20):** the trip's "change this" links read **Change ›** (link colour, bold, go chevron, no underline; `ChangeLink.tsx`), with the full name for screen readers: Change plugs and Change cost estimate in the results, "Avoiding tolls · Change ›" under the closed card, and the weather hint's "Planned for … Change ›". "Cold out? Adjust in Trip settings" keeps its words here (B131 later changed it to **Cold out? Change ›**, under the trip cost). "Change car" rows already have the chevron.
- **Owner review round 2 (2026-11-20):** the Estimate line ("~40% less range") moves under the wheels · heat pump row, in the display font at full text colour. **Plugs used** no longer folds: its plugs (with their drawings) are a row with **Change ›** that opens the My car menu's plug switches, like the car row.

## 3. The hint (summary line + results)

- **Closed card:** the grey line under the car name ends with the weather the plan uses: `Start 90% · charge at 15% · CCS1 · mild weather`, or `… · −10 °C` with the switch on. No new rows.
- **Results footer:** today's "Cold weather can cut range by a lot. This plan assumes mild weather." keeps its first sentence and adds a link button, **Cold out? Adjust in Trip settings**, that opens the card at Weather and wheels and focuses the temperature field (turning the switch on). With the switch on, the footer reads "Planned for −10 °C with 20″ wheels." instead, with the same link worded **Change in Trip settings**. *(B131, 2026-11-20: both now read **Change ›** and sit under the trip cost; see §1.)*
- *Built 2026-11-20 (for owner review):* the "How this was estimated" section is folded by default, so the hint line sits on its own just above the always-visible disclaimer; inside the section, the cold-weather sentence keeps "assumes mild weather" with the switch off and says what the plan uses (and leaves out) with it on.

## 4. Energy model (`trip-energy.ts`, `trip-car.ts`, `trip-plan.ts`)

- **QA fixes (2026-11-20):** a high Arrive at % that one charge can't reach no longer fills an earlier stop to 100 % before another stop; that stop charges as for the threshold and a later charger tops up. Wheels default to the trim's standard size (as the Charging page), so a trim rated on smaller wheels gets the penalty. The totals get "~" only while the switch changes the figures (factor ≠ 1), and the "~" note names Range adjustments. Arriving under Arrive at % with no charger ahead says so on the destination row. With no °C/°F saved, the trip follows a km/mi switch at once.

- `TripCar.whPerKm` stays the mild-weather highway figure. A new pure step, `adjustedWhPerKm(base, { tempC, heatPump, heatPumpFitted, chemistry, wheelIn, ratedWheelIn, wheelEffect })`, returns `{ whPerKm, tempFactor, wheelFactor }`:
  - temperature: `temperatureEffect(...).factor` (1 / retained share; B116 tables, heat-pump curve when standard or fitted, LFP penalty);
  - wheels: `applyWheelEffect(ratedWheelIn, wheelIn, wheelEffect).factor` when My car's wheels differ from the wheels the rating used (`ratedWheelFor`), else 1;
  - the two multiply. Applied only when the switch is on.
- Climbing and regen are unchanged (they depend on mass, not temperature).
- `planStops` gets `arriveSoc` (destination target). Today the destination checks use the threshold (`trip-plan.ts` lines ~203 and ~217); they use the arrive target instead. Stops along the way still use the threshold.
  - *Owner 2026-11-20:* the **last stop** charges only enough to arrive with Arrive at % (the last stretch + the target + the way back to the route, rounded up), never more than 80 %; when 80 % would not be enough, the B75 rule still charges more, up to 100 %. Stops before it still charge to 80 % (Q-V2). The "How this was estimated" text says so.
- The plan's `estimated` flag is set while the switch changes the figures, so totals show "~" (B24 style).
- **Not modelled (said in the footer):** slower charging when the battery is cold (the B116 LFP note stays the only mention), the weather changing along the route, wind, preconditioning. The temperature tables are mixed-driving range data applied to highway consumption: a rough estimate, labelled as one (same caveat as B116).
- Data: `ChargerMap` gets the build's `wheelEffect` and temperature sources (as the Charging page does from `loadEstimates()`); the car file already has `heat_pump`, `chemistry` and the trims' wheels.

## 5. Text (all in `src/i18n/en.json`)

New or changed keys (English): `route.settings` → "Trip settings"; `trip.start` "Start", `trip.chargeAt` "Charge at", `trip.arriveAt` "Arrive at" (+ long screen-reader names); `trip.routeTitle` "Route"; `trip.weather` "Range adjustments", `trip.weatherTemp` "Outside temperature", `trip.weatherEstimateLess` "Estimate: ~{pct}% less range" (and More, Same), `trip.weatherCar` "{wheels} · {heatPump}"; `route.carSub` gains "· {weather}"; `trip.winter*` variants with the link; `settings.region`, `settings.regionCa` "Canada", `settings.regionUs` "US", `settings.temperature` "Temperature". `settings.inBorderHelp` is removed.

## 6. Out of scope

Weather forecasts or temperature along the route; charging-speed loss in the cold; changing which chargers are picked by temperature; the trip's start time.

## 7. Owner answers (2026-11-20)

- **Q1.** The one switch applies both My car's wheels and the temperature, even at a mild 20 °C.
- **Q2.** Arrive at % defaults to **20 %**.
