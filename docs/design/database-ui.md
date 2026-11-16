# Database UI

Phase 1, step 4 of [roadmap.md](roadmap.md). The screens for browsing, viewing and comparing cars, plus the first-load car picker. Covers D6, P7, U3, U4 and N6 in [gaps-and-questions.md](gaps-and-questions.md). It uses the data in [vehicle-data-model.md](vehicle-data-model.md) and embeds the viewer from [charging-curve-viewer.md](charging-curve-viewer.md).

Describes screens and behavior, not visual mockups or code.

---

## 1. Serving three audiences with one interface (P7) ✅

**Decision: one interface, simple first, with detail on demand.** No separate modes, and no "beginner / expert" switch.

| Layer | Who it's for | What it shows |
|-------|--------------|---------------|
| **1. Headline** | Everyone, especially shoppers | A few key figures in plain words: range, charging time, km per 10 min |
| **2. Full specs** | Owners, careful shoppers | Grouped spec tables, trims, the curve viewer |
| **3. Detail and sources** | Enthusiasts | Source badges you can open, other figures from other sources, raw curve points, conflicts |

**Why not modes:** modes make people choose who they are before they've seen anything, and the same person moves between layers (a shopper who gets curious about curves). Layers let everyone dig as deep as they like.

---

## 2. Site structure

```
Header:  [Logo]   Charging   Cars   Compare (n)   Map*   Trip*   [My car: IONIQ 5 ▾]  [km | mi]
                                                        * Phase 2 and 3, hidden until built
```

**Changed 2026-11-16 (owner's decision, B11):** the car page is replaced by a **Charging tab**, modeled on better-dcfc-calculator's charging page. One screen holds **Make → Model → Year → Variant → Trim dropdowns**, then the key figures, the curve viewer, and the full specs, trims and sources below. Switching car or trim never leaves the page. The **Cars tab** lists cars as **make → model accordions**; picking a variant opens it in the Charging tab. **Charging is the home page.** §5 below describes the content of the Charging tab's car section.

| Screen | Purpose | |
|--------|---------|-|
| **Pick your car** | First-load picker | MVP |
| **Charging** (home until B26; at `/charging` once the map ships, which becomes the home page) | Dropdowns to pick make, model, year, variant and trim; everything about that car on one screen (§5) | MVP |
| **Cars** | Make → model accordions of every car; filters and sorting (§4) to be added there | MVP |
| **Compare** | Up to 4 cars side by side | MVP |
| **About & sources** | Method, data sources, **required license credits** | MVP (licenses require it) |

### Shareable links
No accounts, but **every car and comparison has its own URL**, so people can bookmark or share. The Charging tab's URL updates as the car changes:
- `/charging?car=hyundai/ioniq-5/2024/long-range-awd` (old `/cars/…` links redirect here)
- `/compare?cars=hyundai/ioniq-5/2024/long-range-awd,tesla/model-y/2025/long-range-awd`

Curve settings (SoC window, charger power) can be included in the link too (*later*).

---

## 3. First load: pick your car (N6) ✅

**Flow:**
1. A first-time visitor lands on **"Which EV do you drive, or want to?"**
2. **A search box first** ("ioniq 5", "model y") with instant suggestions, **plus** step-by-step pickers: make → model → year → variant.
3. **Trim is optional** ("Not sure? We'll use the standard trim.").
4. The car is saved in the browser and the visitor lands on **that car's page**.

**"Just browsing" link** → skips straight to **Cars**. *Assumption:* the owner wants picking a car to be the main path, but not a wall. Choosing a car is **not required** to browse, and later not required to view the map (N6). Trip planning will ask for a car when it's needed.

**Afterwards:** the **"My car"** chip in the header shows the saved car. It opens a menu: change car, go to its page, forget it.

### Saved in the browser (no accounts)
| Saved | Used for |
|-------|----------|
| My car (variant + trim) | Default car everywhere |
| Comparison list | Compare screen |
| Units (km/mi) | Every figure |
| Last curve settings (SoC window, charger power) | Curve viewer |

**If browser storage is blocked** (for example a private window), the site still works fully and simply forgets on reload.

---

## 4. Cars: browse screen (D6) ✅

### Layout
- **Search** at the top.
- **Filters** in a side panel (a bottom sheet on phones).
- **Results** as **cards** by default, with a **table** toggle for dense comparison. The table view is effectively the "rankings" from D6: sort by any column.

### Filters (all MVP unless marked)
| Filter | Type | Default |
|--------|------|---------|
| **Sold in Canada** | toggle | **On** |
| Model year | range | Current and previous year |
| Make | multi-select | All |
| Body type | multi-select | All |
| Drivetrain | FWD / RWD / AWD | All |
| **Range** (rated, km) | minimum slider | Off |
| **DC peak power** | minimum slider | Off |
| **10–80% time** | maximum slider | Off |
| **Charge port** | NACS / CCS1 / CHAdeMO | All |
| **Voltage class** | 400V / 800V | All |
| **Heat pump** | standard / optional / any | Any |
| Battery chemistry | NMC / LFP / … | All |
| **Curve quality** | "Only cars with tested curves" | Off |
| Price | range | *later* (D15) |

### Sort options
Name · range · efficiency · DC peak · **10–80% time** · **km per 10 min** (the default for the table view) · newest.

**For browse and sorting,** 10–80% and km per 10 min are calculated with **no charger limit**, using each car's default curve. Cars with **estimated** curves carry a badge in the list, so sorting doesn't hide how reliable each figure is.

### Card contents
Image (or body-type silhouette) · make, model, year · variant · **range** · **10–80% time** · **km per 10 min** · port icon · curve badge (Tested / Estimated) · **"+ Compare"** button.

---

## 5. Car page (now the car section of the Charging tab, B11)

One page per **model year**, with a **variant selector** (and an optional trim selector) near the top. Changing the variant updates the page in place and changes the URL.

### Sections, top to bottom
**Changed 2026-11-15 (owner's decision, B18):** on the Charging tab the order is: vehicle picker (an accordion showing the chosen car when closed) → car name → **charging curve** → accordions for **Car figures and assumptions** (the key-figure tiles, closed state previews the headline numbers), **Specifications**, **Trims** and **Sources** (closed, numbered). The list below is the original car-page order; where they differ, this note wins.

1. **Header:** image (with credit), name, year, variant selector, trim selector, **"Set as my car"**, **"+ Compare"**.
2. **Key figures (layer 1):** five or six tiles:
   - Range (rated, NRCan) · Efficiency (kWh/100 km) · Usable battery · DC peak · **10–80% time** · **km per 10 min**
   - Each tile carries its **source badge** (§7).
3. **Charging curve:** the full **curve viewer**, set up for this variant.
4. **Specs (layer 2):** grouped tables (Battery · Charging · Efficiency & range · Ports & access · Dimensions *later*). "Unknown" values are shown, not hidden.
5. **Trims:** a table of trims on this variant: wheels (standard and options), heat pump, trim-specific range where available.
6. **Sources (layer 3):** every source used on this page, with license and access date. "Report a problem" (*later*, could be just a mailto or GitHub issue link).

### Data notices
- **Estimated curve:** a short banner in the curve section, saying no measured curve is available yet.
- **Sources differ:** a small icon on the figure (§7).
- **Not sold in Canada:** a banner when browsing with the Canada filter off.

---

## 6. Compare screen (D6) ✅

- **Up to 4 cars.** "+ Compare" from cards and car pages adds to the list. The header shows the count.
- **Layout:**
  1. Car headers (image, name, variant selector, remove button)
  2. **Curve overlay** (the viewer's comparison mode, sharing one set of settings)
  3. **Side-by-side spec table**, grouped like the car page
- **Highlight the best value** in each row (for example the shortest 10–80%). **"Best" is shown with an icon and bold text, not colour alone**, so it's accessible.
- **"Only show differences"** toggle hides rows where every car is the same.
- Each car keeps **one colour** across the curve, the table header and its badges.
- **Phones:** two cars side by side, swiping to see the rest.

---

## 7. Showing sources and accuracy (P9 on screen) ✅

The data model gives every figure a *kind* and a source. On screen:

| Element | Behavior |
|---------|----------|
| **Badge** | A small label next to the value: **Official (Canada)**, **Official (US)**, **Manufacturer**, **Tested**, **Community**, **Estimated** |
| **Tap or hover the badge** | Source name, date and link, plus **"Other figures"** listing values from other sources (for example "EPA: 488 km · Tested at 110 km/h: 430 km") |
| **Unknown** | Shown as "Unknown" in grey, never left blank |
| **Reference number** | **Added 2026-11-15 (B18):** each badge is followed by a Wikipedia-style **[n]**, the source's number in the page's numbered Sources list. Clicking it opens the Sources accordion at that entry and highlights it. The badge popup also shows the number. |
| **Sources differ** | A small ⚠ next to the value. Opening it shows both figures. *Shown to users, not hidden:* being open about disagreements builds trust. |
| **Estimated** | A distinct look (italic or outline badge), and rounded figures (for example "~25 min") |

**Badge style:** low-key, so a page full of numbers doesn't become a page full of labels. Colour helps, but the **badge text always says the kind**.

---

## 8. Visual style (U3) ✅

**Changed 2026-11-15 (B20):** slate + blue palette, light and dark, WCAG AA for every text and control colour (checked by a test). Theme follows the device until the visitor picks one in the side panel. Header: menu button top left → side panel (theme toggle, page search, pages). Wheel-size picker sits in the curve controls.

- **A clean consumer app on the surface, data-rich underneath**, following the three layers in §1.
- Cards and tiles for headline figures, tables for specs.
- **Light and dark themes**, following the device setting.
- **Readable on phones:** tables turn into stacked cards on narrow screens.
- **Accessible:** colour is never the only signal (best values, badges, curve lines all have a text or shape cue), and charts can be read as a table.

## 9. Units and language (U4) ✅

*B25 (2026-11-16): the Wh/km and mi/kWh options are deferred until after the map; v1 shows kWh/100 km, or kWh/100 mi when miles are chosen.*

**Changed 2026-11-15 (B19):** the km/mi switch lives in the curve controls on the Charging tab, not the header; the header has a hamburger menu of pages.

| Setting | Default | Options |
|---------|---------|---------|
| Distance | **km** | mi |
| Efficiency | **kWh/100 km** (what NRCan uses) | Wh/km, mi/kWh |
| Power, energy | kW, kWh | n/a |
| Currency | CAD | *later*, with prices |

**Language (U5) ✅:** English for v1, but **all on-screen text is kept separate from the code** (labels, badges, notes), so French can be added later as translation work. Québec is Canada's largest EV market, so French is a likely early addition.

---

## 10. MVP vs. later

**MVP:** car picker with search, browse (cards + table, filters, sort), car page with the embedded curve viewer, compare up to 4, source badges with details, km/mi, About & sources page, shareable links.

**Later:** price filter, dimensions, "report a problem", curve settings in links, rankings or leaderboards as their own page, French.

## 11. Questions resolved here, and new ones

**Resolved:** D6, P7, U3, U4, N6.

**New:**
| ID | Question |
|----|----------|
| U5 | **French language support?** Québec is Canada's largest EV market, and federal data (NRCan) is already bilingual. In v1, or later? |
| D16 | **How are trims named for Canada?** Canadian trim names often differ from US ones (for example "Preferred" vs. "SEL"). Use Canadian names, with US names as aliases for search? |
