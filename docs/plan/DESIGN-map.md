# Phase 2 build plan: the charger map (approved 2026-11-16)

## Context
Phase 1a passed independent QA, so owner decision B21's gate is met and Phase 2 (the charger map) starts now. The design is `docs/design/charger-map.md`, with power bands from `vision.md` and the AFDC source from `data-sources.md` §5. The map is a static MapLibre map of every public Level 2 and Level 3 charger in Canada, using a daily AFDC pull and simple level, power-band and plug filters. There is no server. Phase 1b (Cars filters, My car, Compare, calibration) comes after the map.

### Owner answers (2026-11-16), to record as B26–B29
| ID | Decision | Docs to update |
|----|----------|----------------|
| B26 | **The map becomes the home page** (`/`). Charging moves to its own tab at `/charging`, which already exists. This replaces B11's "Home = Charging". | `database-ui.md`/`user-flows.md` home references, `charger-map.md` |
| B27 | **Daily charger data goes live through a PR that merges itself** once the sanity checks and the full CI steps pass. This is an exception to "a person approves" (S4), for charger data only. Vehicle data keeps human review. | `charger-map.md` §3, `phase1-stack.md` §4, CLAUDE.md rules line |
| B28 | **"Chargers my car can use" and the My-car-specific Tesla notes move to Phase 1b** (built with 5.2 My car). v1 always shows the generic Tesla note. | `charger-map.md` §4, §7 |
| B29 | **No place search in v1.** "Locate me" plus pan and zoom only. Search comes with Phase 3 address search (S6). | `charger-map.md` §5 |

### Facts checked during planning
- **The AFDC API has moved:** `developer.nrel.gov` was retired on 2026-05-29 and the new host is **`developer.nlr.gov`** (NREL is now the "National Laboratory of the Rockies"). The path `/api/alt-fuel-stations/v1.json?country=CA&fuel_type=ELEC&limit=all` still supports `json` and `geojson`.
  - `ev_charging_units[].connectors.{TYPE}.{power_kw, port_count}` and `charging_level` exist.
  - `status_code` is E (available), P (planned) or T (temporarily unavailable). `access_code` is public or private.
  - Rate limit: 1,000 requests per hour per key. DEMO_KEY allows 50 per day.
  - Docs still say NREL, so the design docs get updated.
- **Licence:** the API docs state no terms. Canadian records come from NRCan. Confirm the licence or disclaimer wording during M1. If it's unclear, stop and ask the owner before publishing.
- **Code to reuse** (from the survey): the `sources/` + `FETCHED.json` fetch pattern, the Ajv `SCHEMA_FILES` in `scripts/lib/validate-data.ts`, `scripts/build-data.ts` writing to the git-ignored `public/data/`, the `data/sources/src-*.json` registry, the `DATASETS` list in `about.astro`, `src/lib/storage.ts` (`getJSON`/`setJSON`, `KEYS`), `t()` in `src/i18n/t.ts`, CSS variables in `global.css` (checked by `tests/contrast.test.ts`), and the `data-refresh.yml` PR mechanics.
- **Gap for 1b:** `adapters_included` doesn't exist in the schema yet. It's needed only by the deferred My car filter (B28), so it goes in tech debt for 5.2.

## Owner steps (I'll walk you through them)
1. Sign up for a free API key at developer.nlr.gov. Account creation and the password are yours to do.
2. Add the key as the GitHub Actions secret `NLR_API_KEY` (repo Settings → Secrets → Actions), and put it in a local `.env` (git-ignored) for local fetches.
3. If the daily PR can't merge itself because of `main` branch protection, I'll ask before anything is changed.

## Build items (added to `docs/plan/CHECKLIST.md` as "Phase 2: Charger map", tag [2])

**Data layer first**

- **M0 Record decisions:** B26–B29 go in `gaps-and-questions.md` §12 and the matching design docs. Rename NREL to NLR and point the API host at `developer.nlr.gov`. Save `docs/plan/DESIGN-map.md` (this plan) and extend `QA.md`.
  *Done when:* the docs PR is merged.
- **M1 Fetch + source record:** `scripts/fetch-afdc.ts` reads the key from env and pulls Canadian ELEC stations (`limit=all`), writing `FETCHED.json` (URL, time, checksum, count). Also `data/sources/src-afdc-ca.json` with the confirmed licence and attribution.
  - Measure the raw size. If it's under ~10 MB, commit the raw file under `sources/afdc-ca/` (existing pattern). Otherwise commit only the normalized output and keep the raw checksum.
  - *Done when:* a local run with the key writes the file. The station count is in the expected range (~14–16k locations including L1 and planned).
- **M2 Normalize + classify:** pure helpers in `scripts/lib/afdc.ts`, with fixtures in `tests/fixtures/afdc/` and tests in `tests/afdc.test.ts`.
  - **Filtering:** drop private, Level 1-only and planned (P) stations.
  - **Level:** taken from the source's L2 vs DC classification (`charging_level` / evse counts), never from kW.
  - **Ports:** one line per {plug, kW, count}, with plugs J1772, CCS1 (J1772COMBO), NACS (TESLA) and CHAdeMO.
  - **Bands:** vision.md bands, upper edge inclusive. A missing kW goes in the "unknown" band. A site is in every band any of its ports falls in.
  - **Other fields:** network (Supercharger vs Destination flags), restricted / limited hours flag, status E/T with the expected date, pricing text, name, address, coordinates and updated date.
  - Output is `data/imported/afdc/stations.json`, sorted by id with one station per line so diffs stay small. It has a schema `schema/imported-afdc.schema.json` added to `SCHEMA_FILES`.
  - *Done when:* tests cover every band edge (3.6/7.2/11.5/50/100/250 and the value just above each), unknown power, mixed sites, a 20 kW DC unit staying Level 3, the private/L1/planned drops, and the Tesla network flags. `npm run validate` passes.
- **M3 Sanity checks:** `scripts/lib/afdc-checks.ts`. Fail if the count drops more than 10 % from the last committed file, or if required fields (coordinates, level, plugs) go missing on more than an agreed share of stations (start at 2 %). Write a change summary: added, removed and changed by province and level.
  - *Done when:* tests cover the pass case, the >10 % drop and missing fields.
- **M4 Map data build:** extend `scripts/build-data.ts` to write `public/data/map/l3.json` and `l2.json` (compact GeoJSON, short property keys) plus `meta.json` (updated date, counts). Extend `output-check.ts` so every station carries the AFDC `source_id`.
  - *Done when:* `npm run build` succeeds and the files are under ~2 MB gzipped (L3 well under).
- **M5 Daily refresh workflow:** `.github/workflows/charger-refresh.yml`, running daily and on demand with the secret `NLR_API_KEY`. Steps: fetch → normalize → checks.
  - If nothing changed, exit quietly. Otherwise force-push `data/charger-refresh`, open or update the PR with the summary, and run validate/test/astro check/build **in the workflow itself**. PRs opened with `GITHUB_TOKEN` don't trigger `ci.yml`, so the workflow can't rely on it.
  - When all of that is green, `gh pr merge --squash --delete-branch`. Vercel deploys on merge through its own Git integration.
  - If a check fails, the PR stays open, nothing merges and the run fails so the owner is notified.
  - *Done when:* a manual run on GitHub opens and merges a PR, and a forced-failure run (simulated drop) leaves it unmerged.

**UI**

- **M6 Map page + nav (B26):** add `maplibre-gl`. `src/components/ChargerMap.tsx` is mounted `client:only="react"` (MapLibre needs the browser).
  - `src/pages/index.astro` becomes the map. The side nav in `Base.astro` gets `map` first, then Charging, Cars and About. All text goes through i18n keys.
  - OpenFreeMap style URL in `src/config.ts` (`MAP.styleUrl`), so the Protomaps fallback is a config change. Attribution control shows © OpenStreetMap contributors and OpenFreeMap.
  - Default view is the last saved position (`KEYS.mapView`), or else southern Ontario/Québec. The map fills the content area on desktop and phone.
  - *Done when:* the home page shows the map in the browser on desktop and at 375 px, with no console errors, and the Charging tab still works at `/charging`.
- **M7 Pins, clusters, filters:** GeoJSON source with `cluster: true`.
  - Clusters show counts and zoom in on click. Pins use a bolt icon for L3 and a plug icon for L2 (shape, not only colour). Temporarily unavailable stations get a greyed pin with a mark.
  - Filter panel: Level 3 on and Level 2 off by default. Band boxes appear only under a ticked level, all bands on, including "Unknown power". Plugs CCS1/NACS/CHAdeMO/J1772 are all on.
  - Filtering happens on the client and feeds `setData`, so clusters respect it. Choices are saved in `KEYS.mapFilters`. L2 data loads only when Level 2 is first ticked.
  - Pure filter logic lives in `src/lib/map-filter.ts` with unit tests.
  - *Done when:* tests pass for the any-port-matches rule and the defaults, the browser check matches charger-map §4 and §5, and the filter panel works by keyboard and at phone width.
- **M8 Station details + Locate me:** a side panel on desktop and a bottom sheet on phones. It shows:
  - Header: name, network and level badge.
  - Port lines, for example "2 × CCS1 · 180 kW".
  - Access: public, or customers only / limited hours with a warning.
  - The generic Tesla Supercharger note, and the Destination customers-only note (B28).
  - Pricing as given, or "Not listed".
  - Status, with the expected date.
  - Google Maps and Apple Maps links.
  - Footer: "Data: NRCan / NLR AFDC · updated {date}".

  A "Locate me" button uses `navigator.geolocation` only when clicked and stores nothing.
  - *Done when:* the browser check covers each row of the §5 popup table, location-denied shows a message, and contrast tests pass for any new colours.
- **M9 About + tech debt:** add AFDC/NRCan, OpenFreeMap and OSM credits to `about.astro` `DATASETS`/credits. Log in `docs/tech-debt/`:
  - the Protomaps/R2 fallback not set up;
  - `adapters_included` missing (for 1b);
  - repo growth from daily data commits (watch item);
  - N9 (which Superchargers are open to non-Teslas);
  - OCM later.

  *Done when:* About lists every map credit and the tech-debt entries exist.
- **M11 kW range sliders (B35, owner change after QA):** replace the band checkboxes with one two-handle kW slider per level (charger-map.md §4: stops, both ends included, unknown power only at full range, words above the slider). Saved choices move to stop indices; old saved filters fall back to defaults for power.
  - *Done when:* unit tests cover the range rule (both edges, top stop = no limit, unknown power only at full range, any-port rule, saved-choice checks), and a browser check shows the sliders under ticked levels, keyboard steps, the count changing, persistence and 375 px.
- **M12 Stations in view (B34, owner change after QA, closes TD-P9):** a toggle under the station count opens a list of matching stations in the current view, nearest the centre first, capped at 50, over 640 px wide. Each item opens the station panel and centres the map.
  - *Done when:* unit tests cover the in-view, sort and cap logic; a browser check shows the list updating after a pan, a keyboard user opening a station from it, and the list hidden at 375 px. TD-P11 logs the phone version.
- **M10 Independent QA:** run `qa-reviewer` against the new Phase 2 section of `QA.md`, fix what it finds and re-check.

Each item ships as its own PR on green CI (standing rule). Explain new concepts as they come up: map tiles and vector styles, GeoJSON, clustering, `client:only`, Actions secrets, and why bot PRs don't trigger CI.

## Verification
- **Unit tests:** `npx vitest run` covers classification, band edges, sanity checks and map filtering. `npm run validate`, `npx astro check` and `npm run build` (map files and size) must pass.
- **Workflow:** a manual `charger-refresh` run on GitHub shows the merge path and the blocked path.
- **Browser:** the `voltway-dev` preview checks:
  - map loads as home, clusters, pins and icons, filter defaults and persistence, band reveal, L2 lazy load;
  - station panel rows, Tesla notes, Locate me (allowed and denied);
  - phone width 375 px, dark mode, keyboard use, no console errors.

  Then the same on the Vercel production URL after merge.
- **Independent QA:** `qa-reviewer` with `QA.md` Phase 2. The owner can also run QA in a fresh session.
