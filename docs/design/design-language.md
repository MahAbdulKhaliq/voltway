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

## 9. Comparing cars: car colours and the "Charge race"

*(Owner, B85, 2026-11-18; under review, not committed yet.)* Code: `src/components/Compare.tsx`.

**Car colours**
- Each car keeps one colour (`--car-1` … `--car-4`) everywhere on the page:
  - a 4 px stripe along the top of its card;
  - a 4 px inset line on its spec-table column head;
  - its race lane;
  - its curve.
- Car colours are text-grade on the page and the card (4.5:1) and at least 3:1 on raised blocks (`tests/contrast.test.ts`).
- Car colours never replace the road paint's meaning. Yellow stays the action and selection colour; violet still means only "estimate".

**The race** (a ranked figure, shown as roads)
- A `.seg` above it picks the figure: **Per 10 min** (the default), the window time, Added, or Average power.
- **One lane per car**, best first:
  - for time, the shortest wins;
  - unknown figures go last and show "Unknown" or "No curve yet" with an empty road.
- The lane is a raised block. Inside it:
  - the road: a 14 px pill on `surface` with field-border centre dashes (16 px of paint, 12 px gap);
  - the car's bar, ending in a round marker with a raised ring;
  - the value on the right in Overpass 700;
  - the other figures and the curve-kind tag as a small line under the road.
- Bar length is proportional to the figure: the largest value fills the road. For time, the fastest car therefore has the *shortest* bar.
- The best lane gets a drawn flag (accent) and "Best:" for screen readers. Ties are all flagged.
- **Motion:**
  - bars grow in once on the first view;
  - bars resize smoothly when the window, charger or figure changes (0.62 s, `--ease-out`);
  - lanes that change place slide to their new spot (FLIP, Web Animations, 460 ms);
  - with Animations off, all of it is instant.

**The rest of the page on the shared language**
- The chart is on a panel:
  - each curve is solid in the car's colour inside the window and lane-dashed outside it (owner, 2026-11-19: estimated curves are solid inside the window too; the colours tell the cars apart and the race's Estimated badge marks estimates);
  - the stop bars are in the text colour;
  - the tooltip lists every car's kW at the hovered charge level.
- The window slider sits under the chart, lined up with its axis. The charger slider uses 50 kW steps, and the old "Custom" kW field is gone.
- The window and the charger are the same saved settings as on the Charging page.
- The spec table sits in a section that unrolls (§8):
  - group rows are raised, in Overpass;
  - values are in Overpass with tabular figures;
  - the best value per row gets a drawn star and bold.
- "Only show differences" is a switch (the Settings switch look).
- The empty state's "Browse cars" is the primary yellow button.

## 10. Browsing cars: filter sections and "Live reflow" (B86)

Decided by the owner 2026-11-19 (B86, under review). The Cars page uses everything above, plus:

- **Every filter category is its own section** inside the filter panel: Road unrolls (§8) without the card around it (`bare`), a smaller Overpass title, a thin divider between sections, and an `h3` heading so the panel's outline stays right.
- **A closed section shows its choices as pills** under its title (the makes ticked, "350 km or more", the model years). A section with nothing chosen shows nothing. While a section is open the pills hide (the choices are right below). The default model years show as pills too, so the header always says which years are listed.
- **Sections start closed unless a filter in them is set.** Once the visitor opens or closes one, that choice is remembered (`voltway.browseOpen`) and wins over the default.
- **Choices are a checkbox list** (owner, 2026-11-19 review, replacing pill toggles): native checkboxes (radios for heat pump) in road-paint yellow (`accent-color`), one per row, 34 px rows (44 px on phones), a ticked label in semibold, the accent focus ring. A list scans faster than wrapped pills when there are many makes.
- **Each section has its own Clear** while its filter is set (owner, 2026-11-19): a small underlined accent-coloured button beside the chevron, visible open or closed, named "Clear <section>" for screen readers. It resets just that category (model years back to the default years) and moves focus to the section's header. It sits over the header row, not inside `<summary>`, because a button inside a summary is not reliably reachable.
- **Yes/no filters are switches** (Sold in Canada, tested curves only), the same switch as Compare's "Only differences".
- **Range, DC peak and 10–80 % time use the map's slider** (§4), on a field-coloured rail because they sit on the panel.
- **Card figures are four raised readouts** (§2) in a 2 × 2 grid; car names in Overpass.
- **Live reflow.** When a filter, the sort or the search changes, cards that stay glide from where they were to their new place (FLIP), new cards rise in with a short stagger, and removed cards fade out where they stood (as copies in a layer over the grid, so React never sees them). Only cards near the screen animate, and nothing animates past 400 cards. The table rows glide the same way.
- **The count ticks** to its new value in large Overpass figures; screen readers hear the final count once, from a separate status line.
- **Search highlights the matched words** (word starts) in names and trims, with the accent tint and underline.
- **Animations off** (the site's setting, B65): every change is instant, with no copies, no ticking and no transitions on switches.

### Cars table and the compare toggle (B87, owner 2026-11-19)

- **The table fits its column** on desktop: no sideways scroll at 1280 in km or mi. Units sit under each column name ("Range / km"), so a cell is only the figure ("~" kept for estimates). The car cell carries the name (Overpass, →), the variant and year, and a small line with the port and the curve type.
- **Figures are right-aligned Overpass with tabular numbers.** The sorted column is marked in road paint: a yellow underline on its header and a faint yellow wash down the column. Rows lift to `surface-2` on hover. The table sits on a card, like the result cards.
- **On phones** each row stacks into labelled figures ("Range (km) … 570"), with the compare button pinned to the row's top-right at 44 px.
- **"+ Compare" is a toggle** everywhere it appears (cards, table rows, the Charging page's car section): in the list it reads "− Compare", painted like a selected `.seg`, and clicking it removes the car. The table uses a 32 px +/− square with the full name ("Add … to Compare" / "Remove … from Compare") as its label and tooltip.

### Adding cars on Compare (B87, owner 2026-11-19)

- **"Add a car" is the header's car picker** in a modal dialog (search with suggestions, then Make → Model → Year → Variant), titled "Add a car to compare", without the trim and plug steps. Cars already compared are greyed with "Already in Compare" and can't be picked. Its suggestion list sits in the flow (the dialog is shorter than the My car picker). The dialog is rendered outside the Compare page's wrapper, so its dropdowns look exactly like the My car picker's: one line each, long variant names cut off rather than wrapping.
- **A ghost card** follows the car cards while fewer than 4 are compared: a single dashed outline in the next car's colour (owner review: no stripe on top), a + and "Add a car", and "Car n of 4". It opens the dialog; afterwards focus returns to it, so adding several cars is quick. The empty page shows the same card, and the specs' "Add another car" opens the dialog too.

### Car picker (B89 round 3, owner 2026-11-19)

The one dialog behind the header's "Change car" and Compare's "Add a car":
- the title in Overpass 800; the search field has a search icon, a 10 px radius, and its suggestions open as the site's menu (surface, border, shadow, 6 px rows; hover on surface-2, the active row yellow-soft);
- "Or pick it step by step" is one raised panel (§3). Make, Model, Year and Variant are numbered 1–4, two columns on wider screens and one on phones. A step's number is outlined until it is chosen, then filled with road paint. The selects use the select menus (§4). The optional trim and its note sit under them, indented to the labels;
- "Plugs my car can use" is a second raised panel: one row per plug with the map filter's plug drawing, its name and a switch, divided by faint lines;
- the actions sit in a bar pinned to the dialog's foot (surface, top border). On phones the main button takes the row.

### Dialogs (B120, owner 2026-11-20)

Every prompt dialog (Car settings, Change car / Pick your car, Add a car to compare) shares one head and one kind of link (classes `.dlg-head`, `.dlg-eyebrow`, `.dlg-title`, `.dlg-sub`, `.dlg-row`):
- the head: a small muted label in sentence case naming the action ("Car settings", "Change car" or "My car", "Compare"), the headline in Overpass 800 at 2 rem (1.65 rem on phones), then a muted line (the variant, or the intro);
- a link elsewhere (the car's charging curve, "Just browsing? See all cars", "Browse all cars") is a row action on a raised block: icon, label, then a ↗; it opens in a new tab so the page behind stays put (B122, owner 2026-11-20);
- the pinned foot bar holds only the main button and Cancel.

**Car settings:** The My car settings dialog uses the car picker's frame. Its head (owner, 2026-11-20): "Car settings" as a small muted label in sentence case (owner: no all caps), then the year, make and model as the headline, in Overpass 800 at 2 rem (1.65 rem on phones) like the trip time, then the variant in smaller muted text. Then **See its charging curve** as a row action on a raised block (chart icon, label, go chevron, like the trip panel's Change car), then the **Range estimates** and **Plugs my car can use** panels. **Back to defaults** is a small underlined accent button in the Range estimates header, shown only while the wheels or heat pump differ from the defaults (like the Cars filters' Clear, §10). The pinned foot bar holds only Save and Cancel.

### Speed marks in menus (B89 round 4, owner 2026-11-19)

- The map's speed tag (bolts on a dark, outlined tag) stays on the map. The map key's speed rows use the bare mark too (owner, 2026-11-19: clearer there).
- In menus and lists (Stations in view, a trip's stops) the speed is a bare mark: one to three bolts in the accent colour, side by side and as tall as the text, with no tag or outline. A Level 2 station shows the plug drawing in the muted colour instead.
- Bolts by the fastest Level 3 kW (B89 round 5): 1 under 150 kW, 2 from 150 to under 250 kW, 3 from 250 kW.
- The mark is decorative; the kW beside it says the speed. On a trip stop the mark and kW come first, in Overpass 700, then Car-limited and the other tags.

### About page (B88, owner 2026-11-19)

- **Hero:** a large Overpass title and the intro, then a short stretch of road (`--band`) whose grey lane dashes paint in while a yellow charge marker drives from 10 % to 80 %. The stretch behind the marker turns paint yellow, and the marker glows once when it arrives. Below it sit four readouts that count up once: car variants, open datasets, cited pages, and accounts needed (0). The markup holds the final numbers.
- **Who built this:** a card with a paint-yellow "MA" initials avatar, the name in the display face, the role, a short bio that calls the site a portfolio project, and three links: Portfolio website (filled), GitHub and Source code. Each opens in a new tab and tells screen readers so. One quiet line under them points to GitHub issues and replaces the old "Report a problem" section.
- **Method and credits** are Road-unrolls sections (`Unroll.astro` + `lib/road-unroll.ts`, shared with the React Accordion). Both are closed at first and show chips: the kind names for the method; "8 datasets · Base map · Licences" for the credits. Figure kinds are drawn as the badges they become, in a grid of panels. Dataset and map credits are panels in a grid that rise in as the section opens. A link to `#data` opens the section without animating and scrolls to it.
- **Animations off:** the lane, the marker and the counts rest at their final state, and the sections open and shut at once.

## 11. Still to decide (polish pass)

Open points for the owner: grouping the assumption controls, a shorter estimate notice, the phone order, and the first-load car picker (from the first B83 review). Compare (B85): whether a time race should draw the fastest car with the longest bar instead (owner to decide).

### Button icons (B130, owner 2026-11-20)

- A small line icon (text colour, 16–18 px, 6 px gap; 8 px in Drive mode's app buttons) sits before the text of: the map's **Plan** and the trip's **Plan trip** (a route ending in a pin), **Return to plan** (an itinerary list), and Drive mode's **Google Maps** (a map pin) and **Apple Maps** (a folded map). The two map icons are generic shapes that hint at each app, not the companies' logos (trademarks). Icons live in `src/components/ButtonIcons.tsx`.

### Logo (B118, owner 2026-11-20)

- The mark is the owner's artwork: a dark V whose right arm is a road (yellow edge lines and dashes) that turns into a yellow bolt. It replaces the B55 yellow tile.
- Source: `scripts/assets/logo-source.webp`. `node scripts/logo-assets.mjs` makes `public/logo.png` (both themes, with a thin cream `--text` outline so the dark V shows on dark; owner 2026-11-20: one file, so the mark keeps its size when the theme changes), `favicon.ico` (16/32/48), `favicon-192.png` and `apple-touch-icon.png` (on the dark background). Then `node scripts/og-image.mjs` puts the outlined mark on the link-preview image.
- Header on narrow screens (B128, owner 2026-11-20): while the menu button shows (under 900 px), the header's mark and name are not a link (the side menu's are); a tap plays the hover jolt. From 900 px they link to the map as before.
- Side menu (B127, owner 2026-11-20): the same mark and name head the menu, beside its close button. The menu slides in and, since B127, slides back out when closed (button, backdrop or Escape); with Animations off it opens and closes at once.
- Header: shown 28 px tall (26 px of mark plus the outline) beside the name. On a visit's first page it strikes in with a flash of paint; on hover it jolts. Animations off stops both.
