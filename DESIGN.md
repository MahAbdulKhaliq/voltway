---
name: Voltway
description: A free, no-login EV trip planner and charger map, in the "Road Paint" look.
colors:
  centre-line-yellow: "#FFD400"
  paint-ink: "#1A1B1E"
  asphalt: "#1A1B1E"
  asphalt-surface: "#1F2023"
  asphalt-surface-raised: "#2A2B2F"
  asphalt-border: "#34353A"
  asphalt-field-border: "#7C7A72"
  road-band: "#2B2C30"
  road-marking-white: "#F5F3EC"
  worn-marking: "#A4A29A"
  concrete: "#EEEDE8"
  concrete-surface: "#FAF9F5"
  concrete-surface-sunk: "#E4E3DD"
  concrete-border: "#D5D3CB"
  concrete-field-border: "#6E6D66"
  concrete-text-muted: "#55544E"
  amber-text: "#6F5300"
  amber-soft: "#FFF1A8"
  yellow-soft-dark: "#3A3310"
  construction-orange: "#FF7A1A"
  construction-orange-deep: "#9A3F00"
  warn-soft-dark: "#3A2210"
  warn-soft-light: "#FFE3CC"
  estimate-violet: "#C9B8FF"
  estimate-violet-deep: "#5B34C4"
  estimate-soft-dark: "#2C2640"
  estimate-soft-light: "#E9E3F8"
  unknown-light: "#5F5E58"
  location-blue: "#1D4ED8"
  map-water-dark: "#10151C"
  map-water-light: "#B4C4CC"
  map-green-dark: "#1C211E"
  map-green-light: "#DCE3D5"
  map-motorway-dark: "#55565D"
  map-road-casing-light: "#A9A79E"
  map-label-dark: "#D8D6CD"
  map-water-label-dark: "#7F8FA3"
  map-water-label-light: "#2F4858"
  car-1-dark: "#6FB1FF"
  car-2-dark: "#FF9A4D"
  car-3-dark: "#4ADE9A"
  car-4-dark: "#F58BC1"
  car-1-light: "#1D4ED8"
  car-2-light: "#B03A06"
  car-3-light: "#04704F"
  car-4-light: "#4B4D58"
  supercharger-red: "#E82127"
  faded-marking: "#8A8980"
typography:
  display:
    fontFamily: "Overpass Variable, Archivo Variable, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(1.6rem, 4vw, 2.2rem)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Overpass Variable, Archivo Variable, system-ui, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  label:
    fontFamily: "Archivo Variable, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  pill: "999px"
  card: "12px"
  panel: "10px"
  control: "8px"
  focus: "4px"
spacing:
  gutter: "16px"
  float: "12px"
  card: "20px"
  section: "28px"
components:
  button-primary:
    backgroundColor: "{colors.centre-line-yellow}"
    textColor: "{colors.paint-ink}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
  button-secondary:
    backgroundColor: "{colors.asphalt-surface}"
    textColor: "{colors.road-marking-white}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
  button-secondary-hover:
    backgroundColor: "{colors.asphalt-surface-raised}"
  field:
    backgroundColor: "{colors.asphalt-surface}"
    textColor: "{colors.road-marking-white}"
    rounded: "{rounded.control}"
    padding: "6px 10px"
  chip:
    backgroundColor: "{colors.asphalt-surface}"
    textColor: "{colors.road-marking-white}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
    height: "36px"
  nav-pill:
    backgroundColor: "{colors.asphalt-surface}"
    textColor: "{colors.road-marking-white}"
    rounded: "{rounded.pill}"
  nav-pill-current:
    backgroundColor: "{colors.centre-line-yellow}"
    textColor: "{colors.paint-ink}"
    rounded: "{rounded.pill}"
    padding: "6px 10px"
  card:
    backgroundColor: "{colors.asphalt-surface}"
    rounded: "{rounded.card}"
    padding: "20px"
  source-badge-official:
    backgroundColor: "{colors.yellow-soft-dark}"
    textColor: "{colors.centre-line-yellow}"
    rounded: "{rounded.pill}"
    padding: "1px 8px"
  source-badge-estimated:
    backgroundColor: "{colors.estimate-soft-dark}"
    textColor: "{colors.estimate-violet}"
    rounded: "{rounded.pill}"
    padding: "1px 8px"
---

# Design System: Voltway

Built tokens live in `src/styles/global.css` (`:root` for light, `prefers-color-scheme: dark` and `[data-theme="dark"]` for dark), the base map palette in `src/lib/map-style.ts` (`MAP_PALETTE`), trip colours in `src/lib/trip-map-style.ts` (`TRIP_MAP`) and charger marks in `src/lib/map-icons.ts` (`PIN`, `MAP_MARK`). The frontmatter lists the dark theme for components, because dark is the reference look; light swaps each role to its concrete value (Colors below). Colour pairs are checked in `tests/contrast.test.ts`.

## Overview

**Creative North Star: "Road Paint"**

Voltway is a highway at night, and the trip is the paint on it. Surfaces are asphalt charcoal; the one strong colour is centre-line yellow, kept for what the visitor should follow: the planned route, the primary action, the current page. Road-marking white draws stop bars and Level 2 chargers, and construction orange flags trouble (a charging gap, an unavailable charger). The light theme is the same road in daylight: pale concrete surfaces with the same roles, and yellow text turning dark amber where yellow would not read.

The interface is an Operate tool, used before a trip on a phone or laptop. It is calm and dense rather than decorative: the map fills the screen, and the planner card, navigation pill and map controls float over it on small rounded surfaces. Precision shows in tabular figures, a source badge on every vehicle figure, dashed lines for estimates, and a missing charger drawn as plainly as a present one.

It deliberately refuses the category default of a dark navy map app with a green accent, and it has no blue, teal or green interface colours. The exceptions are the comparison series and the blue "you are here" dot.

**Key Characteristics:**
- Asphalt charcoal and concrete surfaces; one loud colour, centre-line yellow.
- Filled yellow buttons always carry dark ink labels.
- Dashed means "not certain": estimated curves, charging gaps.
- Floating pill and card surfaces over a full-screen map.
- Archivo throughout, with tabular figures for every number.

## Colors

A night-road palette: charcoal and concrete neutrals, one paint yellow, and a small set of signal colours that each mean one thing.

### Primary
- **Centre-Line Yellow** (#FFD400): the trip line on the map, primary buttons, the current page in the nav pill, Level 3 charger marks, text selection, and the logo tile. In dark it is also the text accent (links, focus ring).
- **Paint Ink** (#1A1B1E): the label colour on anything filled yellow, and the dark ring around every map mark.
- **Amber Text** (#6F5300): the light theme's text accent (links, focus ring), because yellow text fails on concrete. Its soft fill is **Pale Yellow** (#FFF1A8) in light and **Night Yellow** (#3A3310) in dark, behind official source badges and hovered rows.

### Secondary
- **Construction Orange** (#FF7A1A, dark) / **Deep Orange** (#9A3F00, light): warnings only: charging gaps (the orange edge on the dashed trip line), the unavailable-charger badge, and warning banners. Banners sit on its soft fill (#3A2210 dark, #FFE3CC light).
- **Estimate Violet** (#C9B8FF, dark) / **Deep Violet** (#5B34C4, light): estimated figures only: the "Estimated" badge, dashed estimated curves, and their notices, on its soft fill (#2C2640 dark, #E9E3F8 light).

### Tertiary
- **Supercharger Red** (#E82127): Tesla network pins only (B55): the fill of a Supercharger pin with a white T, and the T on a white Tesla Destination pin.
- **Comparison series** (dark #6FB1FF, #FF9A4D, #4ADE9A, #F58BC1; light #1D4ED8, #B03A06, #04704F, #4B4D58): one colour per car on Compare charts. Never used for interface chrome.

### Neutral
- **Asphalt** (#1A1B1E): dark page background and map land.
- **Asphalt Surface** (#1F2023) and **Raised Asphalt** (#2A2B2F): cards, panels, sheets; hover and sunk fills.
- **Road Band** (#2B2C30): the dark band under the trip line in both themes, so the yellow reads on asphalt and concrete alike.
- **Asphalt Border** (#34353A): decorative card and divider lines. **Field Border** (#7C7A72 dark, #6E6D66 light): control outlines, kept at 3:1.
- **Road-Marking White** (#F5F3EC): dark-theme text, stop pins, Level 2 charger marks, cluster counts.
- **Worn Marking** (#A4A29A): muted text in dark, and "unknown" values. **Muted Concrete Text** (#55544E): muted text in light; "unknown" values use #5F5E58 there.
- **Location Blue** (#1D4ED8): only the "you are here" dot, the one blue mark on the map, kept on purpose because a blue location dot is what every map uses.
- **Concrete** (#EEEDE8), **Concrete Surface** (#FAF9F5), **Sunk Concrete** (#E4E3DD), **Concrete Border** (#D5D3CB): the light theme's background, surfaces and lines.
- **Faded Marking** (#8A8980, with #C4C2BA): charger marks while a trip shows, and unavailable chargers.

### Base map
The OpenFreeMap style is recoloured at load (`src/lib/map-style.ts`, `MAP_PALETTE`), so the map never shows stock colours. Dark: land Asphalt, water #10151C, parks #1C211E, roads stepping from #2E2F34 to motorways #55565D, labels #D8D6CD with water labels #7F8FA3. Light: land Concrete, water #B4C4CC, parks #DCE3D5, white roads on #A9A79E casings, labels #1A1B1E with water labels #2F4858. Roads stay readable at regional zoom.

### Named Rules
**The One Paint Rule.** Centre-line yellow marks what to follow: the trip, the primary action, the current place. If two yellow things compete on a screen, one of them is wrong. While a trip shows, charger marks turn grey so the trip is the only yellow on the map (B54).

**The Ink-On-Paint Rule.** Anything filled yellow carries Paint Ink (#1A1B1E) text or glyphs, never white.

**The Amber-In-Daylight Rule.** Yellow is never used for text on concrete; the light theme uses Amber Text (#6F5300) for links and focus.

**The One-Meaning Rule.** Orange means a problem, violet means an estimate, red means Tesla. None of them is decoration.

## Typography

**Display Font:** Overpass Variable (B64: open highway-sign lettering; headings, the logo, page links, panel titles, the trip's numbers), falling back to Archivo
**Body Font:** Archivo Variable
**Label/Mono Font:** Archivo Variable; `ui-monospace` only for code-like values

**Character:** Highway signage: Overpass for what you read at a glance, Archivo for the rest; heavy and tightly tracked in headings, plain and open in body text, with tabular figures so times and kilowatts line up.

### Hierarchy
- **Display** (800, clamp(1.6rem, 4vw, 2.2rem), 1.2, -0.02em): page titles and the trip's total time, the largest text on the planner.
- **Headline** (700, 1.3rem, 1.2, -0.01em): section headings.
- **Title** (600, 1.05rem, 1.2): card and panel titles, stop names.
- **Body** (400, 16px, 1.5): running text and controls; tabular figures in tables, inputs and figures (`.num`).
- **Label** (600, 0.875–0.9rem): nav pill links and filter headings. Chips (0.875rem) and source badges (0.75rem) use the regular weight (400).

### Named Rules
**The Tabular Rule.** Every number a visitor compares (times, kWh, kW, km) uses tabular figures.

**The Motion Rule (B64–B67).** Motion follows the road: the trip line paints itself, loaders are running lane dashes, panels grow and shrink, and moving between a list and its details is a sideways slide (forward to the right, Back to the left). One easing (`--ease-out`), 0.2–0.35 s. Everything stops when **Animations** is off in Settings (B65), which replaces the device's reduce-motion signal.

**The Muted-Suffix Rule.** A variant name's code suffix ("-B (pre-6/11/25)") is shown as a separate, muted span after the plain name (4.16), never in the same weight.

## Layout

The home page is a full-screen map with three floating layers: the planner card at top left (destination search, car tile, Chargers filters, then the trip), the navigation pill at top right, and the map controls (Map key, Locate me, zoom) at bottom right. Floating surfaces sit 12px from the edges. Content pages (Cars, Charging, Compare, About) use a centred column up to 1120px wide with 16px side gutters, cards with 20px padding, and 28px between sections.

Breakpoints, from the built CSS:
- **≤ 640px (phone):** the planner card becomes a bottom sheet with the summary and any gap warning above the fold; the nav pill spans the width with 8px margins; the Map key opens as a fixed popup.
- **≤ 767px:** the map panel starts closed.
- **≥ 900px:** the nav pill also lists the pages (Map, Charging, Cars, Compare, About) and the menu button goes (B65).
- **≤ 420px:** chips tighten their gaps and padding.

Touch targets: the My car plug switches are 44px tall on phones; chips and the Plugs toggle are 36px, Locate me 44px, and the zoom buttons 32px (MapLibre's, restyled in the panel surface; hidden on touch screens, B59). All meet WCAG 2.2's 24px minimum.

## Elevation & Depth

Depth is a single soft shadow plus tonal layering. Floating surfaces over the map (planner card, nav pill, Map key, dialogs, the side menu) carry the shadow; cards on content pages are flat, separated by a 1px border and the surface tone.

### Shadow Vocabulary
- **Float, light** (`box-shadow: 0 1px 2px rgb(26 27 30 / 8%), 0 4px 16px rgb(26 27 30 / 6%)`): anything floating over the map or the page.
- **Float, dark** (`box-shadow: 0 1px 2px rgb(0 0 0 / 45%), 0 8px 24px rgb(0 0 0 / 30%)`): the same role on asphalt, stronger so it reads on a dark map.

### Named Rules
**The Float-Only Rule.** Shadows mean "floating over the map". Cards on content pages stay flat.

## Shapes

Rounded, signage-like forms. Full pills (999px) for the nav pill, chips, source badges and the switches; 12px for cards and the planner; 10px for icon buttons, side-menu rows and banners; 8px for buttons and fields. The logo is a 24px yellow tile (6px corners) with a dark road in perspective whose centre line is a yellow bolt (B55).

Map marks are circles with a dark ring: Level 3 pins yellow with a bolt, Level 2 pins white with a plug, unavailable pins grey with an orange "!" badge. Clusters are a dark disc with a pale count and a ring split into a yellow Level 3 arc (from 12 o'clock, clockwise) and a white Level 2 arc, in proportion, with small gaps (B55). From zoom 9 in, groups of any size and single pins carry small dark tags (B58): speed bolts at top right (1, 2 or 3 for ≤ 75, ≤ 150 and > 150 kW) and stacked plug drawings at left (B54). Chargers stay grouped up to zoom 15 (B57).

## Components

### Buttons
- **Shape:** gently rounded (8px).
- **Primary:** Centre-Line Yellow fill, Paint Ink label, weight 600, 6px 12px padding; the border is ink in light and yellow in dark.
- **Disabled:** a disabled primary drops the paint: raised surface, muted label, plain border (one yellow means "do this").
- **Hover / Focus:** primary lightens (yellow mixed 86% with white); secondary moves to the raised surface. Focus is the site-wide 3px accent outline with a 2px offset. Pressed buttons drop 1px.
- **Secondary:** surface fill, text colour, Field Border outline. `.small` is 0.8rem with 4px 10px padding. Link-style buttons (`.link-btn`) read as inline links ("Change plugs").

### Chips
- **Style:** full pill, surface fill, Field Border outline, 36px minimum height, 0.875rem text. Used for "Pick your car" / My car and Compare in the header.
- **State:** the My car chip opens a menu with NACS / CCS1 / CHAdeMO switches (B55). Chips belong to their pages (B68): My car on the map only, Compare on the other pages only.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** Asphalt Surface / Concrete Surface.
- **Shadow Strategy:** flat on content pages; the Float shadow when over the map.
- **Border:** 1px decorative border.
- **Internal Padding:** 20px.

### Inputs / Fields
- **Style:** surface fill, Field Border outline (3:1), 8px corners, 6px 10px padding; placeholder in the muted text colour.
- **Focus:** the 3px accent outline. Hover darkens the border to the text colour.
- **Checkboxes, radios, ranges:** browser controls tinted with the accent colour; the power range has yellow-ringed thumbs.

### Navigation
- **Style:** a small floating pill at top right on every page (B54): on narrow screens a menu button, then the logo, the page links on wide screens, the page's chip (My car or Compare) and the **Settings** gear (B65: Theme, Animations, Charging price per kWh, Distances). Links are 0.9rem, weight 600, pill-shaped; the current page is filled yellow with ink text. On phones the pill spans the width; the menu button opens a side dialog with the page list.
- **Labels:** as few words as do the job (B68): "Plan", "Show stops", "Return to plan".

### Source Badge (signature)
Every vehicle figure carries a small pill badge naming its source. Official figures use the yellow soft fill and accent text; estimated figures use the violet soft fill, a dashed border and italic text; low-confidence ones a dotted border. Opening a badge shows the source.

### Trip Line (signature)
The planned trip is centre-line yellow (4.5px) on a 12px Road Band, so it reads on both map themes. A stretch with no usable charger is the same line dashed, on a band edged in construction orange. Stops are white numbered pins with a dark ring; the selected stop gets a yellow ring. Start is a yellow dot, the destination a dark dot with a pale ring.

### Charger Marks (signature)
Drawn on the fly by `drawMark` in `src/lib/map-icons.ts`, as described in Shapes. Tesla Supercharger pins are red with a white T, and Tesla Destination pins are white with a red T (B55). The Map key above Locate me explains every mark.

## Do's and Don'ts

### Do:
- **Do** keep Centre-Line Yellow (#FFD400) for the trip, the primary action and the current place, and grey out chargers while a trip shows.
- **Do** put Paint Ink (#1A1B1E) on every yellow fill.
- **Do** switch text accents to Amber Text (#6F5300) in the light theme.
- **Do** dash anything estimated or uncertain, and label it "Estimated".
- **Do** show a source badge on every vehicle figure.
- **Do** use tabular figures for numbers people compare.
- **Do** add every new colour pair to `tests/contrast.test.ts` (4.5:1 text, 3:1 graphics and controls).

### Don't:
- **Don't** use blue, teal or green for interface chrome; the comparison series and the location dot are the only exceptions.
- **Don't** put yellow text on concrete or white text on yellow.
- **Don't** use orange, violet or red for anything but warnings, estimates and Tesla pins.
- **Don't** add shadows to flat content cards; shadows mean floating over the map.
- **Don't** show speed or plug tags on groups of 20 or more chargers.
