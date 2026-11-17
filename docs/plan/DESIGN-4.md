# Phase 4 build plan: whole-site redesign, "Road Paint" (approved 2026-11-16)

## Context

Phases 1a, 1b, 2 and 3 and the showcase polish pass are merged (main at 0c9a5fa). The owner wants the main page closer to A Better Routeplanner (ABRP) and a new look for the whole site.

What this plan rests on:
- **`PRODUCT.md`** (new): the product record for design work.
- **B52:** the primary user is an EV owner planning a trip; the trip planner leads.
- **The critique of the home screen** (2026-11-16, 24/40; snapshot in `.impeccable/critique/`). Its P1 gap-warning issue is already fixed (PR #103). The rest is input to this plan.
- **Owner answers in the shape round (to record as B53):**
  - First action on arrival: **a destination search plus a compact "your car" tile**, like ABRP.
  - ABRP is the reference for **how it works and feels** (immersive full-screen map, minimal chrome). Voltway keeps its own colours, type and details. It is not a clone.
  - Other pages: **new look, same structure**.
  - Trip result keeps only the "~" estimate mark; no source badges there.
  - Direction, picked from two rounds of sketches: **Road Paint**. The chosen sketch is `.impeccable/mocks/screens/reroll-4-road-paint.png`.

## The direction: Road Paint

- **World:** asphalt and road markings.
- **Signature:** the trip is a painted line. Solid centre-line yellow where the plan is sound; passing-zone dashes where there is no fast charger the car can use. The same line is on the map and beside the stop list.
- **Palette roles (dark leads):**

  | Role | Dark | Light (to tune in 4.1) |
  |------|------|------------------------|
  | Page / map land | asphalt charcoal `#1A1B1E` | pale concrete |
  | Panel | `#1F2023` | white-grey |
  | Text | `#F5F3EC` | near-black |
  | Muted text | `#A4A29A` | mid grey (≥ 4.5:1) |
  | Route, primary button | centre-line yellow `#FFD400` (dark label on buttons) | same yellow on lines and buttons; never yellow text on a light ground |
  | Warning | construction orange `#FF7A1A` | darker orange that passes 4.5:1 |
  | Stop marks | white bars | dark bars |
  | Estimated | keep the purple role (`--estimated`), retuned to sit with the palette | same |

  Sketch values are a starting point. 4.1 fixes the real tokens and `tests/contrast.test.ts` proves them.
- **Type:** Archivo (400, 600, 800), self-hosted with the build (no third-party font request). Tabular figures for every number column.
- **Yellow rule:** yellow is for lines, large text and filled buttons with dark labels. Small yellow text only where it passes 4.5:1 (dark theme).
- **Themes:** light and dark both ship and both get the same checks. The site still follows the visitor's system theme and the menu's theme button.

## Scope

**In:**
- Home screen redesign (layout, planner card, trip result, filters, phone sheet).
- New look on Cars, car pages, Charging, Compare, About and 404, with structure and features unchanged.
- A custom basemap style in both themes (same OpenFreeMap tiles).
- The critique's remaining findings on the home screen.

**Out:**
- Drive mode (see "Later").
- New planner features: waypoints, user-set charge target, smart stop choice.
- ABRP's branding or assets; any car maker's logo, font or assets.
- Data changes.

**Unchanged commitments:** the name Voltway; source badges on every vehicle figure (the trip result is the agreed exception, "~" only); WCAG AA; all text from `src/i18n/`; metric inside, km/mi on screen; free tiers only; no accounts.

## Home screen

### Layout
- **Desktop:** the map fills the screen. A planner card floats top left. A small navigation pill (Voltway, Map, Cars, Charging, Compare, menu) floats top right. Map controls sit bottom right.
- **Phone:** the planner is a bottom sheet. Its summary and any gap warning are always visible above the fold.
- The site header on the home page becomes the floating pill. ~~Other pages keep a normal header in the new look.~~ **B54 (2026-11-17): every page uses the same floating pill** (top right; full width minus a margin on phones). On the map it floats over the map; on other pages it stays in view as the page scrolls.

### Planner card, before a plan
- One destination search ("Where to?") and a compact **your car** tile.
- No car yet: the tile says so and opens the picker. The picker is a compact search field, not the page-sized picker.
- **B54:** the header's "Pick your car" and "Change car" open the full car picker in a **dialog** on whatever page the visitor is on (the car list loads when the dialog opens).
- Cars that can't be planned are marked in the picker ("no trip planning yet") and sorted last.
- From defaults to "Your location" when the visitor allows it; otherwise the card asks for From after the destination. Swap is an icon button between the fields.
- Start battery and stop level stay in a "Car and battery" disclosure, with **Change car** also visible in any message that tells the visitor to change car.
- Place search without a route still works: picking a place shows the place card with "Route here".

### Trip result
- **Total time first** (large), then distance, stops and charging time on one line.
- Warnings that concern the whole trip directly under the totals (gap, not expected to make it, no chargers).
- **Stop rows:** two lines each (name; arrive % → charge-to % and minutes), with one **Details** control that opens the station panel (which already holds directions and the curve link).
- The painted line runs down the list: white bar per stop, dashed on a gap leg, with the gap text on that leg.
- Notes said once: the Tesla note and "your car takes less" appear once for the trip, with a short tag on the stops they apply to.
- One **How this was estimated** disclosure holds the assumptions, the winter note and the data dates. The "estimate only" line stays visible outside it.
- **Share link** stays. **The last trip is restored after a reload**, or offered as a one-tap "Last trip" row.

### Filters
- Secondary: a "Chargers" control that opens the filter panel. It shows a count when anything is narrowed.
- ~~"Chargers my car can use" and the plug boxes must not appear to disagree.~~ **B55:** the "Chargers my car can use" tick box is removed. My car has plug toggles (NACS, CCS1, CHAdeMO) in the My car menu: its own plug on, the rest off by default. Trip planning uses them and the trip panel names the plugs used; the car picker dialog explains the default.
- **B54:** Plugs is a disclosure, closed by default, each plug with its small line drawing. The "temporarily unavailable" line moves to the **Map key** (a toggle above Locate me, bottom right).

### Selection
- Selecting a stop highlights it in the list and on the map; chargers off the route stay dimmed while a plan is shown.

### States to cover
First visit; car chosen; unplannable car; planning; planned; charging gap; not expected to make it; no chargers; no route; offline; busy; 0 to about 10 stops; long station names; km and miles; both themes; 375 px and desktop.

## Map style
- Ship Voltway's own MapLibre style for dark and light, built on the OpenFreeMap tile source already in use (`src/config.ts` `MAP.styleUrl` / `darkStyleUrl`).
- Land, water, roads and labels take palette colours. Roads must stay readable at regional zoom (the critique found the light basemap too pale).
- **B55 (2026-11-17):** cluster split moves to the ring (dark disc, pale count, white Level 2 arc and yellow Level 3 arc); speed and plug tags only on groups under 20 and on pins; red Tesla Supercharger pins with a T; NACS drawn from the J3400 face; logo = yellow tile with a road in perspective and a bolt centre line.
- **B58 (2026-11-17):** one car picker: the header dialog (the map's "Choose your car" prompt only appears when planning without a car, and opens it). Picking a suggestion selects the car without closing; "Select car" saves it, after showing its NACS / CCS1 / CHAdeMO switches. Tags show from zoom 9, not by group size. Charging opens on the first car in the list when no car is chosen.
- **B59 (2026-11-17):** phones: round icon buttons for Map key / Locate me (legend icon for the key), compact credits ⓘ, a draggable bottom sheet (peek / half / full) over a full-height map, no zoom buttons on touch screens. The route fit allows for the pill, the buttons and the sheet.
- **Clusters and pins (B54):** ~~split cluster discs (white Level 2 part, yellow Level 3 part, vertical line, sized by count)~~ *(replaced by the B55 ring above)*, speed bolts top right, plug marks stacked on the left. While a trip shows, chargers off the trip turn grey and faded so only the trip is yellow.
- Route: yellow with a dark road-band casing. Gap: dashed. Pins and stop numbers keep 3:1 against their casing (`tests/contrast.test.ts`).
- The attribution wording required by OpenFreeMap / OpenMapTiles / OSM is unchanged.

## Other pages
New tokens, type, buttons, form controls, tables, cards, banners, badges and chart colours. No change to content, order, filters, routes or behaviour. ECharts series, the 10/80 % guides and the dashed "Estimated" curve take the new palette and keep their meaning.

## Wording
- One word for the plan: **Trip** (not Route / Itinerary) in on-screen text.
- Car variants: a plain name first, the regulator's suffix as secondary text. Display only; no data change.
- The "Where to?" placeholder passes 4.5:1 in both themes.

## Later (not in this plan)
- **Drive mode ("follow my trip"):** uses the phone's location to show the next stop, distance to it and progress down the stop list, with the screen kept awake. No live battery reading (that needs a connection to the car) and no turn-by-turn. The stop list in this plan is built so that view can grow out of it.

## Build order
Phases 4a to 4e in `CHECKLIST.md` (items tagged `[4]`). Each phase leaves the site working:
- **4a Foundation:** tokens, type, shared controls, header.
- **4b Map:** basemap style, route and pins.
- **4c Home screen:** planner card, trip result, filters, phone sheet, last trip.
- **4d Other pages.**
- **4e Finish:** wording, accessibility, phone test, design-system record, independent QA.

## Verification
`QA.md` section "Phase 4" (QR checks). Tests: `npx vitest run`, `npx astro check`, the build. Browser checks go to `site-ui-checker`, one at a time.
