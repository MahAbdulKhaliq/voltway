# Phase 7: US chargers and "Stay in one country" (B78)

Status: **approved, 2026-11-18.** The owner set the direction in chat (tiles by area; AFDC + Open Charge Map for the US; GeoNames US towns; build in a fresh chat) and approved every detail below that was marked as a proposal (D1, D2, D4, D5) at item 7.0.

## Why
Voltway's charger data, place search and trip planner stop at the Canadian border (B74). The owner wants US chargers on the map and US trips in the planner. A trip stays inside the country it starts in, so "Stay in Canada" becomes a general "stay in the start's country" rule.

## What changes for the visitor
- The map shows US chargers as well as Canadian ones, with the same filters, pins and station panel.
- "Where to?" finds US towns and addresses.
- A trip may start in Canada or the US. It must end in the **same country** it starts in. A trip that crosses the border gets a clear message instead of a plan.
- Settings: **Stay in Canada** becomes **Stay within the border** **(approved 2026-11-18)**, still always on and locked. Help text: "Trips stay in the country they start in. Cross-border trips aren't supported yet."

## Out of scope (later, each needs its own decision)
- Cross-border trips (Detroit ↔ Windsor, Seattle ↔ Vancouver).
- US car data (EPA ratings). Cars stay the Canadian NRCan list; the About page says so.
- Defaults by country (miles, USD price). Settings keep km/mi and the price per kWh as they are; a US visitor sets them once.
- Mexico and other countries.

---

## D1. Data sources
- **AFDC US:** same NREL API and normaliser as Canada, `country=US`. New source record `src-afdc-us` (US DOE, public domain). The fetch stays one request (`limit=all`).
- **Open Charge Map US:** same rules as Phase 6 (B77 P1–P5 and its amendments): open-licensed providers only, never OCM's copies of AFDC, AFDC wins on duplicates, credit on every station.
  - **(approved 2026-11-18)** Before building, make one survey request for the US count and record it in this doc. Keep the page cap so a US pull stays at **≤ 10 requests a month** in total for both countries, 3 s apart. If the US needs more, stop and ask the owner.
- **Committed files (approved 2026-11-18):** split the imported data by country so no file gets near GitHub's 100 MB limit.
  - `data/imported/afdc/ca.json` and `us.json` (`stations.json` is renamed).
  - `data/imported/ocm/ca.json` and `us.json`, with one `skip.json` for both.
  - If `afdc/us.json` is over 50 MB, split it by region. The checks and the summary work per file.
- **Sanity checks:** the > 10 % drop and missing-field stops run **per country**. A failed US check doesn't block Canada, and the other way round.

## D2. Map loading: tiles by area (owner's choice)
Today the map downloads `l3.json` (1 MB) and `l2.json` (3.8 MB) for all of Canada. With the US that would be about 6× bigger.

**Two layers of files (approved 2026-11-18):**
1. **Overview (all zooms):** one compact file per level for both countries, for the zoomed-out view and its clusters.
   - Each station is an array of position, top kW, a plug bitmask, a level, a restricted/status flag and its tile key. No names or addresses.
   - Filters (plugs, power, level, access) work on these fields, so cluster counts stay true to the filters.
   - Level 2 overview is only drawn from **zoom 7** up, with a "Zoom in to see Level 2 chargers" hint. That keeps the first load to Level 3 only (estimate about 0.6 MB raw, under 200 KB gzipped).
2. **Detail tiles (on demand):** full station records (name, address, ports, network, hours, source).
   - Tiles are a quadtree over lat/lon. Start at 2° cells and split any cell with more than 1,500 stations into quarters, down to 0.25°.
   - Files: `public/data/map/tiles/{level}/{key}.json` plus `public/data/map/tiles/index.json`, which lists each tile's box and counts.
   - Tiles load when a pin is opened, when the map is at **zoom ≥ 9** (pins replace clusters), and for **Stations in view**. Each tile is fetched once per visit and kept in memory.
- **Budgets (approved 2026-11-18):** no tile over 300 KB raw; the first map load is under 1 MB raw; the build fails if a budget is broken.
- **Per-site counts** in the header and meta stay per country and per source.

## D3. Trip planner
- The planner needs full Level 3 records near the route. After `/api/route` returns the line, the planner loads **every Level 3 detail tile the route corridor touches** (the route's buffer, about 50 km), then plans as today.
- A loading step shows on the trip card while tiles load. They are cached for the visit.
- No change to the planning rules (B75, B76).

## D4. Stay within the border
- **Outlines:** add the US to the Natural Earth Admin 0 outline (public domain, already approved for Canada). `data/imported/naturalearth/` holds `ca.json` and `us.json`. `scripts/fetch-canada-outline.ts` becomes `fetch-outlines.ts`.
- **The function** (`src/lib/ors.ts`, `src/pages/api/route.ts`):
  1. Find the start's country (CA or US) from the outlines.
  2. If the start is in neither, answer 422 `outsideArea`.
  3. If the destination is not in the start's country, answer 422 `crossBorder`.
  4. Otherwise ask ORS with `avoid_borders: "all"` as today.
- **Alaska:** the Lower 48 to Alaska (or back) can only be driven through Canada, so ORS finds no route with `avoid_borders`. The function sees the start and end are in different US pieces and answers `crossBorder` with an Alaska-specific message **(approved 2026-11-18)**: "This trip would pass through Canada. Cross-border trips aren't supported yet." Trips inside Alaska work.
- **Hawaii and islands:** ORS has no road route, so the existing "no route" message stands.
- **Messages** (`en.json`, replacing `trip.status.outside*`):
  - start outside both countries: "Trips are supported in Canada and the US. Pick a start in one of them."
  - cross-border: "Trips that cross the border aren't supported yet. Pick a destination in {country}."
- **Settings** (`settings.inCanada*`): renamed as in "What changes" above, still locked on.

## D5. Place search
- **GeoNames US towns:** add the US dump (`US.txt`, CC BY 4.0, same licence as Canada) to `fetch-geonames.ts`. Keep populated places only.
  - **(approved 2026-11-18)** Use a higher population floor for the US than for Canada, so the US list stays under about 1 MB raw. Write `places-ca.json` and `places-us.json`. Load the US file the first time a search doesn't find enough Canadian matches, or right away when the map view is over the US.
- **Address search:** `boundary.country=CA,US` in `/api/geocode`. Results are biased towards the start's country once a start is set **(approved 2026-11-18)**.

## D6. Words and credits
- All new text goes in `en.json`. Replace "Canada" in the map and trip strings where they now mean "the area we cover". The About page credits AFDC US, OCM US and GeoNames US, and says that car data is the Canadian list.
- `PRODUCT.md` and `overview.md`: the data now covers Canada and the US for chargers.

## D7. Monthly refresh
- `.github/workflows/charger-refresh.yml` fetches AFDC CA and US and OCM CA and US.
- Each country's checks run on their own. A failed OCM pull keeps last month's file for that country.
- The PR body has one summary per source and country. It still self-merges on green (B27), but only when every country passed. If a country failed, the PR stays open for the owner.

## Risks
- **Size:** the US is large, so tiles and budgets are the core of this phase. Build and measure D2 first, before the UI work.
- **AFDC US fetch:** the single `limit=all` response may be about 100 MB. Stream it to disk under `sources/` (git-ignored) and parse it from there.
- **OCM fair use:** the survey (D1) comes before any real US pull.
- **ORS free quota (2,000 a day)** is shared with US trips. The function's rate limit is unchanged.
