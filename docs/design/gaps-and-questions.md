# Gaps & Open Questions

What still needs deciding before the design is solid. Each question has an ID (like `P3` or `C2`) so later docs and chats can refer to it. Mark questions resolved here, with a link to where the decision was written down.

**Legend:** 🔴 blocks other decisions · 🟡 important but not blocking · 🟢 can wait

---

## 1. Product & Vision (P)

The big framing questions. Most other answers depend on these.

| ID | Question | Priority | Notes |
|----|----------|----------|-------|
| P1 | ~~**Who is the main user?**~~ | ✅ | **Resolved:** all three groups (shoppers, owners, enthusiasts). See [vision.md](vision.md). |
| P2 | ~~**What's the one-sentence pitch?**~~ | ✅ | **Resolved:** accuracy. See [vision.md](vision.md). |
| P3 | ~~**Which of the three parts leads?**~~ | ✅ | **Resolved:** all three equally. See [vision.md](vision.md). |
| P4 | ~~**Which regions does it cover?**~~ | ✅ | **Resolved:** North America, Canada first (possibly Ontario only, if costs force it). See [vision.md](vision.md). |
| P5 | **Personal tool, portfolio piece or a product for the public?** | 🟡 | This sets how much data licensing, scale and polish matter. |
| P6 | ~~**How would it make money, if at all?**~~ | ✅ | **Resolved:** it won't. The project will **always be non-commercial**, which also fits Vercel's Hobby plan and the non-commercial terms of some data sources. |
| P7 | ~~**How does one interface serve all three audiences?**~~ | ✅ | **Resolved:** one interface in three layers (headline → full specs → sources), no modes. See [database-ui.md](database-ui.md) §1. |
| P8 | ~~**In what order does each part reach full depth?**~~ | ✅ | **Resolved:** database and curves, then the charger map, then routing. See [roadmap.md](roadmap.md). |
| P9 | ~~**How is data accuracy shown and checked?**~~ | ✅ | **Resolved:** a sourced value for every figure, a badge for each kind, a sources table, and conflict flags. See [vehicle-data-model.md](vehicle-data-model.md) §3 and §7. How the badges look on screen goes in `database-ui.md`. |

## 2. EV Database (D)

| ID | Question | Priority | Notes |
|----|----------|----------|-------|
| D1 | ~~**Where does the vehicle spec data come from?**~~ | ✅ | **Resolved:** NRCan ratings + OpenEV Data + hand entry, with sources cited. See [data-sources.md](data-sources.md) (and D9). |
| D2 | ~~**How detailed is each vehicle?**~~ | ✅ | **Resolved:** make → model → year → **variant** (battery + drivetrain) → trim. See [vehicle-data-model.md](vehicle-data-model.md) §2. |
| D3 | ~~**Which fields matter?**~~ | ✅ | **Resolved:** a field list per level, marked MVP or later. See [vehicle-data-model.md](vehicle-data-model.md) §4. |
| D4 | ~~**Rated vs. real-world figures**~~ | ✅ | **Resolved:** each figure carries a `kind` (rated_nrcan, rated_epa, tested, estimated…) and they're shown side by side. See §3. |
| D5 | ~~**How is data kept up to date?**~~ | ✅ | **Resolved:** see S4. OTA changes become new curve versions. |
| D6 | ~~**Which comparison features are needed?**~~ | ✅ | **Resolved:** browse with filters and sorting (the table view doubles as rankings), plus compare up to 4. See [database-ui.md](database-ui.md) §4 and §6. |
| D16 | **Canadian trim names** vs. US ones: use Canadian names, with US names as search aliases? | 🟡 | *New, from database-ui.md.* |
| D7 | **Can users add their own car's data,** such as its real efficiency or battery health? | 🟢 | Connects to C5 and R6. |
| D8 | **Where do car images come from, and can they be used?** Manufacturer press kits, Wikimedia Commons (free licenses), or none at first. | 🟢 | *New.* Press images often come with terms of use. |
| D9 | ~~**Which public sources make up the minimum data set?**~~ | ✅ | **Proposed** in [data-sources.md](data-sources.md): NRCan ratings + OpenEV Data + the Chargeprice curve archive + hand entry. Covers D1, C1 and D8 too. |
| D11 | ~~**Matching the same car across sources**~~ | ✅ | **Resolved:** our own IDs + a crosswalk table, with matches suggested automatically and confirmed by a person. See §6. |
| D12 | ~~**Which source wins when they disagree?**~~ | ✅ | **Resolved:** an order of preference per figure, plus a 5% conflict flag. See §7. |
| D14 | **Does NRCan split ratings by wheel size, or only EPA?** | 🟡 | *New.* Decides how far D10 can rely on official figures. **Partly answered (2026-11-15, from the NRCan import):** NRCan **does** split some cars by wheel size, as separate rows with the size in the model name, for example 2026 `C-HR AWD (18" Wheels)` / `(20" Wheels)` and `EX30 Cross Country (18" Wheels)` / `(19" Wheels)`. Not every car is split. Such rows can feed a trim wheel's `rated_range_km` as `rated_nrcan`. Still open: how many cars are split, and whether EPA splits more. |
| D15 | **Include MSRP (CAD) at all?** Prices change often. | 🟢 | *New.* Currently marked later. |
| D13 | **Kia and other Canadian-market cars missing from OpenEV Data.** | 🟡 | *New.* Fill by hand, starting from the NRCan list. |
| D10 | **How are trim features stored and turned into range effects?** For example, how much does a heat pump or 21" wheels change consumption? | 🟡 | *New.* Feeds the estimator. Real data on how much each option costs in range is scarce. |

## 3. Charging Curves (C)

| ID | Question | Priority | Notes |
|----|----------|----------|-------|
| C1 | ~~**Where does curve data come from?**~~ | ✅ | **Resolved:** Fastned-derived curves (via Chargeprice) + tuned, labeled estimates. Permission requests come later. See [data-sources.md](data-sources.md) (and C10, C12). |
| C2 | ~~**How is a curve stored?**~~ | ✅ | **Resolved:** SoC → kW points as given by the source, joined by straight lines, several curves per variant allowed. See [vehicle-data-model.md](vehicle-data-model.md) §5. |
| C3 | ~~**Which conditions are modeled?**~~ | ✅ | **Resolved for v1:** assumes a warm battery, with a note shown. Cold weather comes later. See [charging-curve-viewer.md](charging-curve-viewer.md) §7. |
| C4 | **What about charger limits?** | 🟡 | **Partly resolved:** v1 caps at the charger's kW. Current limits, 800V-on-400V and shared stalls come later and need charger data. See [charging-curve-viewer.md](charging-curve-viewer.md) §8. |
| C5 | ~~**Multiple curves per car?**~~ | ✅ | **Resolved:** one default curve plus a dropdown of others, which can be overlaid. See §2 and §6. |
| C6 | ~~**What should the viewer do?**~~ | ✅ | **Resolved:** inputs, results, chart and a comparison of up to 4 cars. See [charging-curve-viewer.md](charging-curve-viewer.md) §2–6. |
| C8 | **How are "Estimated" curves generated?** | ✅ | **Resolved (proposal):** three template shapes, to be calibrated against tested curves before launch. See [charging-curve-viewer.md](charging-curve-viewer.md) §9. |
| C9 | ~~**Include a charging-loss factor?**~~ | ✅ | **Resolved:** not in v1's time calculation. Added back later with cost. See §3. |
| C10 | **Which testing sources have curves we're allowed to record?** | 🟡 | **Researched, no longer blocking:** no open tested-curve database exists for North American cars. The plan is Fastned-derived curves (via Chargeprice) + tuned estimates + honest labels. Permission requests come later. See [data-sources.md](data-sources.md), "Tested curves: wider search". |
| C12 | ~~**Tune the templates with published 10–80% times?**~~ | ✅ | **Approved (2026-11-15):** manufacturer claims + single cited test results, with tested figures weighted more. See [charging-curve-viewer.md](charging-curve-viewer.md) §9. |
| C11 | **Show AC (Level 2) charging time too?** For example 20% → 100% overnight. | 🟢 | *New.* |
| C7 | ~~**"Range added per minute" view?**~~ | ✅ | **Resolved:** yes, as **km added per 10 minutes**, the headline comparison figure. See §4. |

## 4. Route Planning (R)

| ID | Question | Priority | Notes |
|----|----------|----------|-------|
| R1 | ~~**How deep is the energy model?**~~ | ✅ | **Resolved:** simple. Highway consumption (tested, or NRCan × 1.15) + elevation. See [route-planner.md](route-planner.md) §3. |
| R2 | ~~**Where does charger data come from?**~~ | ✅ | **Resolved:** the Phase 2 AFDC static files, searched in the browser. No live availability. |
| R3 | ~~**Which map, routing and elevation services?**~~ | ✅ | **Resolved:** openrouteservice (free plan) behind a Vercel Function. See §2. |
| R4 | ~~**What should the planner optimize for?**~~ | ✅ | **Resolved:** the threshold rule with the highest usable kW, then charge to 80%. See §4. |
| R5 | ~~**Charger filters**~~ | ✅ | **Resolved:** compatible ports and adapters, public sites, available only. Networks come later. See §4. |
| R9 | ~~**Default starting battery %?**~~ | ✅ | **Resolved:** 90%, adjustable per trip. |
| R10 | **Calibrate the 1.15 highway factor** against tested figures. | 🟡 | *New.* Before launch. |
| R6 | **Can it plan for the user's actual car?** Battery health, real efficiency history, current SoC. | 🟢 | Car connection APIs are a big extra piece. Maybe later. |
| R7 | ~~**Re-planning during the drive?**~~ | ✅ | **Resolved:** a before-the-trip planner only, with links out to Google/Apple Maps. |
| R8 | **How are charging costs estimated?** Per-kWh vs. per-minute pricing, memberships, idle fees. | 🟢 | Pricing data is patchy. |

## 5. How the Parts Connect (X)

The "all-in-one" idea only works if these connections are real.

| ID | Question | Priority | Notes |
|----|----------|----------|-------|
| X1 | ~~**What's the main flow between parts?**~~ | ✅ | **Resolved:** shared state, a cross-link table and five main journeys. See [user-flows.md](user-flows.md). |
| X2 | ~~**Compare a trip across cars**~~ | ✅ | **Resolved:** later, after Phase 3 v1. It only needs one routing request for all cars. See [user-flows.md](user-flows.md) §4. |
| X3 | ~~**Is there a user profile or garage?**~~ | ✅ | **Resolved:** no accounts. Choices are saved only in the user's browser. See [vision.md](vision.md). |
| X4 | ~~**How is data uncertainty shown?**~~ | ✅ | **Resolved:** source badges, "sources differ" flags, and estimated figures shown with "~". See [database-ui.md](database-ui.md) §7. |

## 6. Experience & Design (U)

| ID | Question | Priority | Notes |
|----|----------|----------|-------|
| U1 | ~~**Platform**~~ | ✅ | **Resolved:** a website. |
| U2 | **Does it need to work offline?** | 🟢 | Matters if it's used while driving in areas with poor signal. |
| U3 | ~~**Visual style**~~ | ✅ | **Resolved:** clean consumer app on the surface, data-rich underneath. See [database-ui.md](database-ui.md) §8. |
| U4 | ~~**Units**~~ | ✅ | **Resolved:** km and kWh/100 km by default, with a km/mi switch. See §9. |
| U5 | ~~**French language support**~~ | ✅ | **Resolved:** English in v1, with every piece of text translatable so French can follow. |

## 7. Competitors & Positioning (M)

| ID | Question | Priority | Notes |
|----|----------|----------|-------|
| M1 | ~~**What do the main tools do well and badly?**~~ | ✅ | **Resolved:** see [competitors.md](competitors.md) §1. |
| M2 | ~~**Which gap do none of them fill?**~~ | ✅ | **Resolved:** Canadian, source-labeled vehicle data + curves, linked to a simple map and planner. See [competitors.md](competitors.md) §2–3. |

## 8. Risks (K)

| ID | Risk | Notes |
|----|------|-------|
| K1 | **Data access and licensing.** Specs, curves and charger data may be unavailable or not allowed for reuse. | This could block the project. Look into it early. |
| K2 | **Accuracy and trust.** A wrong range estimate strands someone. | Responsibility and disclaimers, especially for routing. |
| K3 | **Scope creep.** Three products in one. | Answering P3 and setting an MVP line keeps this in check. |
| K4 | **Upkeep.** The EV market changes fast. | Ties to D5. |

---

## 9. Charger Map (N)

*New section, from the vision.*

| ID | Question | Priority | Notes |
|----|----------|----------|-------|
| N1 | ~~**Exact power band edges**~~ | ✅ | **Resolved:** each band includes its upper edge, plus an "Unknown power" band. See [vision.md](vision.md). |
| N2 | ~~**Include CHAdeMO?**~~ | ✅ | **Resolved:** yes. |
| N3 | ~~**How is Tesla Supercharger access shown?**~~ | ✅ | **Resolved for v1:** an access note on Supercharger sites, adjusted to My car. See [charger-map.md](charger-map.md) §7. |
| N4 | ~~**Charger data source for Canada.**~~ | ✅ | **Proposed:** NREL AFDC API (covers Canada, has `power_kw` and all four plug types) + Open Charge Map to fill gaps. See [data-sources.md](data-sources.md). |
| N7 | ~~**Removing duplicate stations across AFDC and Open Charge Map**~~ | ✅ | **Resolved:** v1 uses AFDC only. A merge rule is proposed for when OCM is added later. See §3. |
| N8 | ~~**Default map filter**~~ | ✅ | **Resolved:** Level 3 only by default. The user's choice is remembered. |
| N9 | **An open source for which Superchargers are open to non-Teslas** in Canada? | 🟢 | *New.* |
| N5 | ~~**Is live status shown?**~~ | ✅ | **Resolved:** no live status. AFDC's available / temporarily unavailable status is shown, planned sites are hidden, and every popup shows a "last updated" date. See §6. |
| N6 | ~~**Can the site be used before choosing a car?**~~ | ✅ | **Resolved:** yes. Picking a car is the main path, with a "Just browsing" skip. See [database-ui.md](database-ui.md) §3. |

## 10. Stack & Hosting (S)

*New section. Requirements only. The actual picks happen when the design is settled.*

| ID | Question | Priority | Notes |
|----|----------|----------|-------|
| S1 | ~~**Which database and app stack?**~~ | ✅ | **Decided:** no runtime database. Data as files in git, schema validation, and Astro as the static site. See [phase1-stack.md](phase1-stack.md). |
| S2 | ~~**Free hosting**~~ | ✅ | **Decided:** Phase 1 is fully static, hosted on **Vercel** (free Hobby plan). Phase 3 adds a Vercel Function. |
| S3 | ~~**Map tiles, routing and elevation within a free budget**~~ | ✅ | **Resolved:** map tiles from OpenFreeMap (Protomaps fallback). Routing and elevation from the openrouteservice free plan through a Vercel Function. All of Canada fits in free tiers. See [charger-map.md](charger-map.md) §2 and [route-planner.md](route-planner.md) §2. |
| S6 | ~~**Address search (geocoding)**~~ | ✅ | **Resolved:** the local place list first, then ORS geocoding on demand. See [route-planner.md](route-planner.md) §6. |
| S7 | **Protecting the function:** per-visitor limits, and the message shown when the day's allowance runs out. | 🟡 | *New.* |
| D17 | **Add `curb_weight_kg` to the variant** (needed for elevation). | 🟡 | *New.* MVP for Phase 3. |
| S4 | ~~**How is data refreshed?**~~ | ✅ | **Decided:** scheduled checks open pull requests, and a person approves them. See [phase1-stack.md](phase1-stack.md) §4. |
| S5 | ~~**Public or private repository?**~~ | ✅ | **Resolved:** public. |

## 11. Questions Raised by the Vision (V)

| ID | Question | Priority | Notes |
|----|----------|----------|-------|
| Q-V1 | ~~**Is accuracy still the headline pitch?**~~ | ✅ | **Resolved:** accuracy applies to the vehicle data. The map and routing stay simple. |
| Q-V2 | ~~**What happens at each charging stop?**~~ | ✅ | **Resolved:** charge to 80% in v1. A user-set target comes later. |
| Q-V3 | ~~**How smart is stop selection?**~~ | ✅ | **Resolved:** the simple approach (threshold, then a nearby fast charger). Smart selection may come later as a toggle. |
| Q-V4 | ~~**Winter in v1?**~~ | ✅ | **Resolved:** out of scope for v1. Later: a rough % range loss from temperature and battery chemistry. |

## 12. Decisions made at the start of the Phase 1 build (B)

*Raised while turning the docs into a build plan, 2026-11-15.*

| ID | Question | Priority | Notes |
|----|----------|----------|-------|
| B1 | ~~**Framework for interactive islands?**~~ | ✅ | **Decided (2026-11-15):** React. See [phase1-stack.md](phase1-stack.md) §3, §6. |
| B2 | ~~**ECharts or Chart.js?**~~ | ✅ | **Decided (2026-11-15):** Apache ECharts. See [phase1-stack.md](phase1-stack.md) §6. |
| B3 | ~~**Chargeprice "default curve" entries: import as estimated, or skip?**~~ | ✅ | **Decided (2026-11-15):** skip and log them. Our tuned template is the only estimate. See [data-sources.md](data-sources.md) §2, [vehicle-data-model.md](vehicle-data-model.md) §5. |
| B4 | ~~**Precedence order mixed kinds and sources** ("Manufacturer → tested → OpenEV Data", while OpenEV values are kind `manufacturer`)~~ | ✅ | **Decided (2026-11-15):** manufacturer entered directly from the OEM page → tested → manufacturer via OpenEV Data → Chargeprice. Rules keyed on kind + source. See [vehicle-data-model.md](vehicle-data-model.md) §7. |
| B5 | ~~**Product and repo name?**~~ | ✅ | **Decided (2026-11-15):** **Voltway** (public repo `voltway`). Not tied to Canada, so it still fits if the app expands. Trademark and domain not yet checked. |
| B6 | ~~**Chargeprice curves not flagged "default" but clearly generic?**~~ | ✅ | **Approved (2026-11-15):** the archive's flag misses most filler curves (175 "measured" curves share one identical shape). The importer also skips curves with < 3 points or whose points below 100% SoC are all round fractions (multiples of 0.05) of the curve's peak. 122 curves kept; every skipped one listed in the repo's `data/imported/chargeprice/SKIPPED.md`. See [data-sources.md](data-sources.md) §2. |
| B7 | ~~**Onboard-charger splits** (NRCan rates e.g. Equinox EV AWD and LYRIQ separately with 11.5 vs 19.2 kW chargers)~~ | ✅ | **Approved (2026-11-15):** same variant; a trim may carry its own `ac_max_kw` that overrides the variant's, like `range_km`. See [vehicle-data-model.md](vehicle-data-model.md) §4. |
| B9 | ~~**Approved matches that turn out stale** (an earlier-year record describing a car that has since changed)~~ | ✅ | **Approved (2026-11-15):** when a manufacturer page shows the car changed (new pack, power or port), the stale match is set to `confirmed=false` in the crosswalk with a note giving the evidence, so its values (and curves) stop flowing in. Only with evidence. First case: 2026 IONIQ 5 Long Range (84.0 kWh per Hyundai Canada) vs OpenEV 2025 and Chargeprice 2021 records with the old 72.6–77.4 kWh pack. See [vehicle-data-model.md](vehicle-data-model.md) §6. |
| B13 | ~~**Wheel/tire size effect on range (D10) now or later?**~~ | ✅ | **Decided by the owner (2026-11-16):** now. The Charging tab shows the trim's wheels next to the key figures and lets the user pick another size; range, efficiency and km per 10 min are then **estimated** (shown first, marked Estimated) with the official rated figure underneath. The rule is learned at build time from official ratings that test the same car on two wheel sizes, **from any source** (NRCan first; EPA, WLTP or others can add pairs; not NRCan-only). Today: median +3.6 % energy per km per inch over 164 pairs, with the spread shown. When another trim has an official rating at the chosen size, the page offers to switch to it. Trims rated on their own (wheel or charger splits) now carry their own efficiency and onboard charger too. Tire width, weight and type aren't modelled. See [vehicle-data-model.md](vehicle-data-model.md) §4 (D10). |
| B14 | ~~**Hand-entered wheel sizes have no source** (trim `wheels[]` entries had no `source_id`, so a researched wheel size would be a bare number)~~ | ✅ | **Approved by the owner (2026-11-15):** every hand-entered wheel entry carries a required `source_id` (optional `notes`, `low_confidence`), like any other figure. Research batches can add trim wheels, and the research agents also look up battery preconditioning. The gap report counts trims with no wheel sizes and variants with no published 10–80 % time. See [vehicle-data-model.md](vehicle-data-model.md) §4. |
| B15 | ~~**Research sources and depth** (hand research was Canada-first, "rough and quick", and couldn't estimate)~~ | ✅ | **Decided by the owner (2026-11-15):** research uses **US or Canadian** sources, **US first** (manufacturer US pages, EPA/fueleconomy.gov, US press), Canadian when the US page doesn't cover it or the Canadian car differs. A US figure is used only when nothing shows the Canadian car differs (port, onboard charger, pack, trim content). Research is now **thorough per car**: every missing field for every variant (model years, battery and trim variants, ports and Supercharger access included) and the charging curve, not one quick search per model. When no page states a figure but a close relative does (same platform **and** same pack, same motors), the researcher may record it as `kind: estimated`, `low_confidence`, with the reasoning and the relative's source in notes. Official rated figures (NRCan precedence, "Official (Canada)" badges, coverage note) are unchanged. Supersedes the 2026-11-15 "rough quick lookups" preference. See [data-sources.md](data-sources.md) §3. |
| B16 | ~~**Variants with no measured curve whose sibling has one** (e.g. same E-GMP 84 kWh pack in the 2025 EV6 and the 2026 IONIQ 5)~~ | ✅ | **Decided by the owner (2026-11-15):** research batches can add charging curves: measured or published curves from a cited source (`tested`, `community`, `manufacturer`), and **borrowed curves**: a measured curve of a sibling variant with the same pack (capacity, voltage class, chemistry, peak kW), stored as `kind: estimated` with `based_on` naming the sibling and the reasoning. Default order: measured → borrowed sibling curve → template estimate. The fact-checker verifies that the packs really match. See [vehicle-data-model.md](vehicle-data-model.md) §5.|
| B17 | ~~**When is a car "discontinued"?** (each model year had production / discontinued / announced, with no rule; older years of a current car could be mislabelled)~~ | ✅ | **Decided by the owner (2026-11-15):** an older model year of a car still in its generation, or still sold, is **not** discontinued. A model year is now `production` (built and sold, past or current) or `announced`. Models can list **generations** (`first_year`, `last_year` once ended); a model counts as discontinued only when its last generation has ended with nothing after it, derived, never stored. Older model years (back to 2010, e.g. the 2017 Bolt EV) are in scope for data, and research may carry figures across years of one generation when nothing changed in between. See [vehicle-data-model.md](vehicle-data-model.md) §4. |
| B18 | ~~**Charging tab feels bloated, especially on phones** (every section and card shown at once; chart controls overlapping)~~ | ✅ | **Decided by the owner (2026-11-15):** the Charging tab collapses into **accordions**. The **vehicle picker** is an accordion that shows the chosen car (year, make, model, variant) beside its title when closed; it is closed once a car is chosen and open on a first visit with no car. The **charging curve** comes first, right under the car name. **Car figures and assumptions** (range, efficiency, wheels, usable battery, DC peak, 10–80 % time, km per 10 min) move **under the curve** into an accordion whose closed state previews the headline numbers; **Specifications** and **Trims** are accordions too. **Sources** sit in a closed accordion as a **numbered list**, and every figure carries a Wikipedia-style **[n]** next to its badge that opens the list at that source. Curve controls are fixed so nothing overlaps (two per row on phones). See [database-ui.md](database-ui.md) §5, §7. |
| B19 | ~~**Charging cost, units switch and site menu** (cost was "later"; km/mi sat in the header; header listed every page)~~ | ✅ | **Decided by the owner (2026-11-15):** the curve viewer gets a **price per kWh** input (default **C$0.45/kWh**, a typical Canadian Supercharger rate in late 2026, editable and remembered) and a **cost result** for the chosen start → end window: energy added ÷ an assumed **92 % DC charging efficiency** (charging-curve-viewer.md §3 said ~90–95 %), times the price, shown as an estimate ("~") with the drawn kWh and loss assumption stated. The **km/mi switch** moves from the header into the curve controls, next to "Show against" (still remembered, still converts the whole page). The header shows a **hamburger menu** listing the pages instead of inline links. See [charging-curve-viewer.md](charging-curve-viewer.md) §3, [database-ui.md](database-ui.md) §2, §9. |
| B20 | ~~**Theme, menu placement and wheel picker** (dark-green theme not liked; menu on the right; wheel size sat in the figures)~~ | ✅ | **Decided by the owner (2026-11-15):** a **slate + blue** palette replaces the green one, light and dark, with every text and control colour pair meeting **WCAG 2.x AA** (4.5:1 text, 3:1 control outlines), enforced by a test on the stylesheet. Dark follows the device until the visitor picks a theme; the pick is remembered. The **menu button sits top left, before the logo**, and opens a **side panel** with a **light/dark toggle** at the top, a **page search** under it, then the pages (name and one-line description). The **wheel-size picker** moves from Car figures into the **curve controls**, since it changes range and km added there. See [database-ui.md](database-ui.md) §2, §8. |
| B21 | ~~**When does Phase 2 (charger map) start?**~~ | ✅ | **Decided by the owner (2026-11-15):** Phase 1 is split. **Phase 1a (before the map):** About & sources with licence credits (7.1); data gaps to their done bar, every MVP field filled or "unknown" (1.6), with deeper research continuing alongside later phases; the EV6 Chargeprice match decision and the trim-range estimate; draggable SoC guides (4.2); the rest of accessibility and phone layout (7.2); the scheduled data check (8.1); then independent QA (9.1). **Phase 1b (after the map, before or alongside Phase 3):** Cars tab filters and sorts (5.1), first-load picker and My car (5.2), Compare (6.1), template calibration (2.2). Phase 2 build starts once Phase 1a passes QA. See [roadmap.md](roadmap.md). |
| B22 | ~~**EV6 matched to the wrong Chargeprice records** (1.8: the 63 kWh 2025 EV6 Light showed 80 kWh usable)~~ | ✅ | **Decided by the owner (2026-11-15):** unmatch all three. `kia/ev6/2025/light` and `wind` are no longer matched to Chargeprice "EV6 GT" (80 kWh usable, 263 kW, 400V), and `land-awd` is no longer matched to the 2024 "EV6 Long Range AWD" (before the 2025 84 kWh pack). The rows stay in `crosswalk/crosswalk.csv` with `confirmed=false` and a note, as in B9. They brought uncited specs only, no curves; usable battery is now Unknown for these three (gross-capacity fallback, B10) until researched, and the voltage class shows 800V from the other source. |
| B23 | ~~**Is the data good enough to close 1.6 for Phase 1a?**~~ | ✅ | **Decided by the owner (2026-11-16):** yes. After two research rounds (E-GMP; Ultium, Tesla, e-TNGA), 1.6 is closed with the current data: every missing field already shows as "Unknown" on the site, which meets the "filled or explicitly unknown" bar. Further research, the open crosswalk questions (Solterra, Blazer LT/RS, LYRIQ port, Model Y Standard pack) and curve hunting move to `docs/tech-debt/data.md`, to pick up after the map. |
| B24 | ~~**Measured curves drawn past their measured points** (QA 9.1: the EV9 curve measured 18–80 % was drawn solid 0–100 % and its 10–80 % shown as "Tested")~~ | ✅ | **Decided by the owner (2026-11-16):** dash the parts outside the measured range and mark results that use them as estimated ("~", Estimated badge), with a note giving the measured range. See [charging-curve-viewer.md](charging-curve-viewer.md) §9. |
| B25 | ~~**Efficiency unit options** (database-ui §9 asks for kWh/100 km with Wh/km and mi/kWh options; v1 has kWh/100 km ↔ kWh/100 mi following km/mi)~~ | ✅ | **Decided by the owner (2026-11-16):** keep today's km/mi-linked unit for Phase 1a and build the Wh/km and mi/kWh options after the map (listed in `docs/tech-debt/data.md` §5). |
| B26 | ~~**Where does the charger map live?**~~ | ✅ | **Decided by the owner (2026-11-16, Phase 2 planning):** the map becomes the **home page** (`/`); the Charging tab moves to `/charging`. Replaces "Home = Charging" from B11. See [charger-map.md](charger-map.md). |
| B27 | ~~**How does the daily charger data go live?** (charger-map §3 says automatic checks replace review; S4 and the project rules say a person approves)~~ | ✅ | **Decided by the owner (2026-11-16):** a daily Action opens a PR, runs the sanity checks and full CI steps itself, and **merges automatically** when they pass. Exception for charger data only; vehicle data keeps human review. See [charger-map.md](charger-map.md) §3. |
| B28 | ~~**"Chargers my car can use" before My car exists?**~~ | ✅ | **Decided by the owner (2026-11-16):** the toggle and the My-car Tesla note variants move to **Phase 1b** with My car (5.2). v1 shows the generic Tesla note. `adapters_included` is still missing from the schema (tech debt). See [charger-map.md](charger-map.md) §4, §7. |
| B29 | ~~**Place search in map v1?**~~ | ✅ | **Decided by the owner (2026-11-16):** no. v1 has "Locate me" plus pan and zoom; place search comes with Phase 3 address search (S6). See [charger-map.md](charger-map.md) §5. |
| B30 | ~~**Licence for the Canadian charger data** (AFDC data comes through NLR's API, whose terms allow free use and copying with credit to DOE/NLR; NRCan's own site terms allow non-commercial reproduction only "as is", which may or may not apply to data reached through the API)~~ | ✅ | **Decided by the owner (2026-11-16, M1):** use it under **NLR's terms**. Credit DOE/NLR and NRCan on the map and the About page, keep the site non-commercial, no endorsement implied. Asking NRCan's copyright office to confirm stays optional (tech debt TD-P5). See [charger-map.md](charger-map.md) §3. |
| B31 | ~~**Map cross-links in Phase 2?** (user-flows.md §2 lists "Find chargers this fast" and "How fast would my car charge here?" as Phase 2; QA #2)~~ | ✅ | **Decided by the owner (2026-11-16, Phase 2 QA):** both move to **Phase 1b**, built alongside My car (5.2), since "how fast would my car charge" needs My car. The map ships without them. See [user-flows.md](user-flows.md) §2. |
| B32 | ~~**Reopening dates already passed** (most AFDC expected dates are in the past; QA #5)~~ | ✅ | **Decided by the owner (2026-11-16, Phase 2 QA):** a temporarily unavailable station shows its expected reopening date **only while that date is still in the future**; otherwise it just says "Temporarily unavailable". See [charger-map.md](charger-map.md) §6. |
| B33 | ~~**Saved view after Locate me** (Locate me stores nothing, but a later pan saves a view near the user's location; QA #10)~~ | ✅ | **Decided by the owner (2026-11-16, Phase 2 QA):** accepted. The Locate me move itself saves nothing; any later pan or zoom saves the view as usual. See [charger-map.md](charger-map.md) §5. |
| B34 | ~~**Keyboard and screen-reader access to stations** (pins are drawn on a canvas; TD-P9)~~ | ✅ | **Decided by the owner (2026-11-16, Phase 2 QA):** add a **"Stations in view"** list in the filter panel: the stations matching the filters inside the current view, nearest the map centre first, capped, each opening the station panel. Wide screens first; a phone version may follow (tech debt TD-P11). See [charger-map.md](charger-map.md) §5. |
| B35 | ~~**Power filter: band checkboxes or a kW range?** (the top Level 2 band "11.6–19.2 kW" also held a few ports above 19.2 kW; TD-P10)~~ | ✅ | **Decided by the owner (2026-11-16, Phase 2 QA):** replace the power-band checkboxes with a **kW range slider (two handles) for each level**, shown under the level when it is ticked. Supersedes "bands instead of a kilowatt slider" in [vision.md](vision.md) and the band boxes in [charger-map.md](charger-map.md) §4; the TD-P10 relabel is no longer needed. The handles snap to set stops, the top stop means "no upper limit", and chargers with unknown power show only while the slider covers its full range. Details in [charger-map.md](charger-map.md) §4. |
| B36 | ~~**How often does the charger data refresh?** (B27 planned a daily pull)~~ | ✅ | **Decided by the owner (2026-11-16):** **monthly**, on the 1st at 10:41 UTC, because this is a small project; a run can still be started by hand any time. Status changes (temporarily unavailable, reopened) can be up to a month old, which the panel's "updated" date already shows. The merge rule from B27 is unchanged. See [charger-map.md](charger-map.md) §3. |
| B37 | ~~**Where does the first-load picker go now that the map is the home page?** (database-ui.md §3 has first-time visitors land on "Which EV do you drive?"; B26 made the map the home page)~~ | ✅ | **Decided by the owner (2026-11-16, Phase 1b plan):** the full picker shows on the **Charging tab** (`/charging`) whenever no My car is set and no car link was opened, in place of today's auto-opened dropdowns. The **map is never blocked**: with no My car it shows a small "Set my car" prompt that can be dismissed (remembered). See [database-ui.md](database-ui.md) §3. |
| B38 | ~~**"Chargers my car can use" without `adapters_included`?** (the field isn't in the data, TD-P6; `supercharger_access` already records "via adapter")~~ | ✅ | **Decided by the owner (2026-11-16, Phase 1b plan):** the toggle uses the car's **`charge_port` and `supercharger_access`**: a "via adapter" car also sees Superchargers, marked "needs adapter". `adapters_included` is added to the schema as an **optional sourced field** shown as "Unknown" until researched; the research stays in tech debt (TD-P6). See [charger-map.md](charger-map.md) §4, [vehicle-data-model.md](vehicle-data-model.md). |
| B39 | ~~**Cars tab: accordions or cards?** (B11 made it make → model accordions; database-ui.md §4 asks for cards + table with filters and sorts)~~ | ✅ | **Decided by the owner (2026-11-16, Phase 1b plan):** **cards by default with a table toggle**, a filter panel (a bottom sheet on phones), search and sorts, as in [database-ui.md](database-ui.md) §4. The make → model accordions are removed; every card opens the car in the Charging tab. |
| B40 | ~~**Where do "My car" and "Compare (n)" go?** (the header has only the menu button and logo since B20)~~ | ✅ | **Decided by the owner (2026-11-16, Phase 1b plan):** two **chips at the top right of the header**: My car (menu: change car, open it, forget it) and Compare (n), which is hidden while the list is empty. Compare is also listed in the side menu. See [database-ui.md](database-ui.md) §2. |
| B12 | ~~**Branding: Canadian or worldwide?**~~ | ✅ | **Decided by the owner (2026-11-16):** the product brand and copy are **market-neutral**, because the aim is to open up worldwide later. The **data stays Canadian for now** (NRCan list and ratings), and the site says so openly in a coverage note on every page. The current market is a single setting in the app. Source badges keep naming the regulator ("Official (Canada)"), since that is source transparency, not branding. Updates [vision.md](vision.md) and [overview.md](overview.md) §1. |
| B11 | ~~**One screen per car, or separate pages per variant?**~~ | ✅ | **Decided by the owner (2026-11-16):** a **Charging tab** (the home page) modeled on better-dcfc-calculator: Make → Model → Year → Variant → Trim dropdowns with key figures, curve viewer, specs, trims and sources on one screen; URL updates (`/charging?car=…`). A **Cars tab** lists make → model accordions; picking a variant opens it in Charging. Separate car pages removed; old links redirect. See [database-ui.md](database-ui.md) §2, [user-flows.md](user-flows.md) §5. |
| B10 | ~~**Usable battery unknown** (many manufacturers publish one "battery capacity" without saying gross or usable)~~ | ✅ | **Approved (2026-11-16):** when usable kWh is missing, charging maths uses the gross (total) kWh and the results are marked estimated (shown with "~", like estimated curves), with a note on the car page. See [charging-curve-viewer.md](charging-curve-viewer.md) §3. |
| B8 | ~~**Phase 1 starter set**~~ | ✅ | **Approved (2026-11-15):** 25 models at their latest NRCan model year (mostly 2026), 84 variants, with the suggested matches, as listed in the repo's `crosswalk/starter-set.json` and `crosswalk/REVIEW.md`. |

## Suggested order to tackle

1. ~~**P1–P3, M2, P7–P9**~~ ✅ all done.
2. ~~**P4**~~ ✅ done.
3. From here on, follow the phases in [roadmap.md](roadmap.md). Phase 1 (database and curves) takes up D1–D10, C1–C7 and P9.

## Possible follow-up docs

- `vision.md`: answers to P1–P6
- `competitors.md`: M1/M2
- `data-sources.md`: D1, C1, R2 and licensing notes
- `vehicle-data-model.md`: D2–D4
- `charging-curve-viewer.md`: C2–C7
- `route-energy-model.md`: R1, R4
- `user-flows.md`: X1–X3
- `mvp-scope.md`: what's in v1 and what's later
