# Design language for content pages

The visual rules the content pages share (Charging, Cars, Compare, About), so they read as the same product as the charger map. They were set by the owner during the Charging page review (B83, 2026-11-18). Use this file when restyling Cars, Compare and About. It adds to the root `DESIGN.md` (Road Paint) and doesn't replace it. Where the two disagree, the owner's decisions recorded here win for content pages.

Shared CSS lives in `src/styles/global.css`, in the block headed "Content-page design language". Reuse those classes rather than writing page-local copies.

## 1. Surfaces step up in three levels

| Level | Token | Used for |
|-------|-------|----------|
| Page | `--bg` (Asphalt / Concrete) | the page behind everything |
| Card | `--surface` | a section: the curve viewer, an accordion |
| Raised | `--surface-2` (Raised Asphalt / Sunk Concrete) | what sits *inside* a card: readouts, panels, the chart |

- A raised block has no border and no shadow, a 10 px radius, and padding of 10–16 px.
- Cards stay flat on content pages (the Float-Only Rule).
- Never put a raised block inside another raised block.

## 2. Readouts: one figure per card

A figure the visitor reads or compares (charging time, km added, kWh, kW, cost, range, battery) sits on its own raised card, so it reads like a variable on a dashboard.

- Classes: `.readouts` (grid, `minmax(140px, 1fr)`, 8 px gap), `.readout`, `.readout-label`, `.readout-value`.
- Label: 0.8 rem, muted, above the value.
- Value: Overpass 700, 1.15 rem, tabular figures. A source badge or note under the value keeps Archivo.
- On phones: three columns (two below 400 px), with tighter padding (8 × 10 px) and a 1 rem value.
- The page's one headline answer (e.g. "10% → 80% in ~20 min") is *not* a readout. It sits above them, in Overpass 800 at display size, with no card.

Used in: the curve viewer's results, "Car figures and assumptions".

## 3. Panels: grouped rows

A group of label/value rows (a spec group, the trims table, the source list, the chart with its controls) sits on one raised panel.

- Class `.panel`. Its heading (`h3` or `.panel-title`) is Overpass 700, 1 rem.
- Row dividers are a faint field-border line; the last row has none.
- Table values (`.v`) are Overpass 650 with tabular figures.
- The highlighted row (e.g. the trim being shown) gets a soft yellow wash (`--accent-soft`).
- Source lists are numbered rows: the number in Overpass, muted, then the linked title, then the "Accessed / Licence" line in muted small text under it.

Used in: Specifications, Trims, Sources, the chart.

## 4. Controls look the same everywhere

- **Segmented switches:** use `.seg`, the Settings look. The selected option is filled yellow with an ink label (light: yellow with an ink edge). This applies to km/mi, State of charge/Time, and every future two- or three-way switch. *(Owner, B83: replaces the earlier "raised, not yellow" toggle.)*
- **Sliders:** use the map's kW slider: `.power-track` with `.power-rail`, `.power-fill`, two (or one) native range inputs, and `.power-ticks` underneath.
  - Thumbs are round and the fill is the accent colour (yellow on asphalt, amber on concrete).
  - On a raised panel the rail uses `--field-border`, so it stays at 3:1.
- **Charger power** is picked in **50 kW steps**: 50, 100, 150, 200, 250, 300, 350 kW, then "Max" (no limit). *(Owner: 50 kW increments, not the map's uneven Level 3 stops.)* A kW value from a link that isn't a step is shown as given, with the handle at the nearest step.
- **Selects and number fields** keep the field style from `DESIGN.md` (surface fill, Field Border, 8 px).

## 5. Source badges read on any surface

Badges are outlined pills, so they stand out on a card and on a raised panel alike, in both themes:

- **Default kinds** (Manufacturer, Tested, Community…): transparent fill, a `--field-border` outline, text in the text colour.
- **Official** (Canada / US): yellow-soft fill, a solid accent outline, accent text.
- **Estimated:** violet-soft fill, a dashed violet outline, violet italic text.
- **Low confidence:** a dotted outline.

The contrast pairs are checked in `tests/contrast.test.ts`: field-border and estimated on `surface-2`.

## 6. Charts draw the road

- A measured curve, inside the charging window, is drawn like the trip line: yellow, 4 px, on the 10 px dark road band.
- **Outside the charging window** the curve is drawn as **lane-line dashes** (16 px of paint, 12 px gap, 3 px wide). They are yellow on asphalt and road-band colour on concrete. Dots are not used.
- **Estimated or not measured** stretches are violet: short dashes inside the window, lane-line dashes outside it. Violet still means only "estimate".
- The start and end guides are 2 px lines in the text colour (stop bars). Their values sit on the slider under the chart, which lines up with the chart's 0–100 % axis.
- The charger limit stays an orange dashed line, because orange means a limit or problem.
- The delivered area is a soft fill in the curve's colour.

## 7. Type

- **Overpass** (display): page and section headings, the headline answer, readout values, panel titles, table values, list numbers.
- **Archivo**: running text, labels, badges, notes.
- Every number the visitor compares uses tabular figures.

## 8. Sections and menus: "Road unrolls" (overdrive pass)

*(Owner, B83 overdrive, 2026-11-18; under review, not committed yet.)* Code: `src/components/react/Accordion.tsx` and the "Road unrolls" and "Select menus" blocks at the end of `global.css`.

**Accordion header**
- The title is in Overpass 700. A preview written as "a · b · c" is shown as small pills (`.acc-chip`: surface-2, 0.8 rem, tabular figures). The pill row fades out at the right edge instead of being cut off. Other previews stay plain text.
- The chevron is a 30 px round button (`.acc-chev`, 28 px on phones) on `surface-2`. Open, it turns 180° and takes the yellow-soft fill with an accent chevron.
- The header gets a faint surface-2 tint on hover and the accent focus outline (3 px) from the keyboard.
- Under an open header runs a **lane line** (`.acc-lane`): 2 px accent dashes, 16 px of paint and 12 px gap, the chart's lane dashes.

**Accordion motion** (Web Animations API, so every browser gets it)
- Opening: the body grows from 0 to its height in **320 ms**, ease-out (`--ease-out`). The lane line paints in from left to right. The blocks and cards inside rise 8 px and fade in, **30 ms apart**, at most 10 of them.
- Closing: a quicker reverse, **220 ms**. The lane line unpaints, and the section closes when the animation ends.
- A second click mid-animation cancels the running one and runs the other direction.
- A section opened by code (a source `[n]` link opening Sources) opens at once, so its scroll lands in the right place.
- The native `<details>` element keeps its keyboard and screen-reader behaviour.

**Select menus** (all `.explorer` selects: Select vehicle, wheel size)
- The closed field keeps the field style (surface fill, Field Border, 8 px radius) and adds:
  - the chosen value in Overpass 600;
  - a drawn chevron in the muted colour;
  - a text-colour border on hover;
  - the 3 px accent focus outline.
- Where the browser supports a customizable select (`appearance: base-select`, Chrome/Edge today), the open list is styled to match the site:
  - a raised card on `surface`, with a 10 px radius, a border and the shadow;
  - it drops in 6 px and fades in;
  - option rows have a 6 px radius, hover on `surface-2`, and the chosen row in yellow-soft with an accent checkmark.
- Other browsers show their native list under the restyled field.

**Animations setting**
- With Animations off (the site's own Settings switch, B65 → `html[data-motion="off"]`; not the operating system's reduce-motion signal):
  - sections open and shut at once;
  - the lane line doesn't paint in;
  - the hover and chevron transitions and the select drop-in are off.
- Every new motion on content pages must check this the same way: `reducedMotion()` in script, and `html[data-motion="off"]` in CSS.

## 9. Still to decide (polish pass)

Open points for the owner: grouping the assumption controls, a shorter estimate notice, the phone order, and the first-load car picker (from the first B83 review). The Compare page still uses the old charger dropdown and the old toggles, and moves to §4 when Compare gets its pass.
