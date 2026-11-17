# Voltway

A free, no-login website for EV drivers and shoppers (data currently covers Canada; branding is market-neutral, B12): source-labelled EV specs and charging curves (Phase 1), then a charger map (Phase 2) and a road-trip planner (Phase 3).

## Design docs: the source of truth

The full design lives in **`docs/design/`** (moved into the repo 2026-11-15 so design changes are versioned with the code; the old `G:\Work\Ideating\EV-App-Planning` folder is retired, don't edit it).

- Read `overview.md` first, then the detailed docs it links to.
- **Where `overview.md` and a detailed doc disagree, the detailed doc wins.**
- Phase 1 docs: `data-sources.md`, `vehicle-data-model.md`, `charging-curve-viewer.md`, `database-ui.md`, `phase1-stack.md`. Build order: `roadmap.md`. Open questions: `gaps-and-questions.md`.
- The build plan for this repo is in `docs/plan/` (`DESIGN.md`, `CHECKLIST.md`, `QA.md`). Work from `CHECKLIST.md`.

## Rules

- **Don't change design decisions on your own.** If something in the docs doesn't work in practice, tell the owner and propose a change. The owner decides.
- **When the owner approves a change,** update the matching planning doc **and** `gaps-and-questions.md` (with the date), then `docs/plan/DESIGN.md` / `CHECKLIST.md` if affected.
- **Current scope (2026-11-16): Phase 4, the whole-site redesign "Road Paint"** (`docs/plan/DESIGN-4.md`, checklist items tagged [4]; owner decisions B52–B53; product record in `PRODUCT.md`). Phases 1a, 1b, 2 and 3 and the polish pass are done (Phase 2's M5 waits on the 2026-12-01 refresh).
- **Build in phases, in `roadmap.md` order.** Owner decision B21: Phase 1a came first, then the charger map (Phase 2); Phase 1b (Cars filters, first-load picker + My car, Compare, template calibration, and the map ↔ curve cross-links, B31) follows the map. Do not build the route planner before then, and hide links to parts that don't exist.
- **Data layer before UI:** schema, importers (NRCan, OpenEV Data, Chargeprice) and the crosswalk table come before any screens.
- **No bare numbers.** Every vehicle figure is a sourced value with `value`, `unit`, `kind` and `source_id` (`vehicle-data-model.md` §3). "unknown" is an allowed value. The build must fail on an unsourced figure.
- **All on-screen text is translatable.** No hard-coded user-facing strings in components or pages: use the i18n dictionary (`src/i18n/`). English for v1; French later.
- **Metric internally,** convert to miles only on screen. Derived numbers (10–80% time, km per 10 min) are calculated, never stored.
- **Automation suggests, a person approves.** Crosswalk matches are confirmed by the owner; no outside data goes live without review. *Exception (B27):* the monthly (B36) charger-map data refresh merges itself once its automatic sanity checks and CI pass.

## Stack (decided in `phase1-stack.md`)

- Fully static site: **Astro** (TypeScript), interactive islands in **React**, charts with **ECharts**, in-browser search with MiniSearch.
- Data as **JSON files** in a **public GitHub repo**, validated with **JSON Schema** (ajv) at build time.
- Hosting: **Vercel**, free Hobby plan (non-commercial). Phase 3 adds a Vercel Function for routing; nothing server-side before then.
- GitHub Actions: CI on pull requests; scheduled data checks that open pull requests.

## Vercel

- Project `voltway` (account `mahabdulkhaliq`). Production: https://voltway-ten.vercel.app/ (`voltway.vercel.app` belongs to someone else). Repo: https://github.com/MahAbdulKhaliq/voltway
- Preview deployments are behind Vercel Authentication (the owner must be signed in to open them).

- The Vercel connector is connected. Use it freely to **read** projects, deployments and logs.
- **Ask the owner before changing any Vercel setting or creating anything there.** For dashboard setup (Vercel, API providers), open the page in the built-in browser, go to the right screen and fill in what you safely can; the owner pastes keys or secrets and clicks Save.

## Working style: this is a learning project

- The owner is new to **Astro** and **Vercel**. Briefly explain new concepts as they come up (islands, static generation, preview deployments, build settings, etc.).
- Walk the owner through any setup they must do themselves.
- **Checklist items:** push, open the PR and squash-merge on green CI without asking (the `ship-item` skill). Still ask first for new repos, Vercel changes, data PRs that need owner review, and design changes.
- **Browser:** before the first built-in browser call, load the `anthropic-skills:built-in-browser` skill. Pass `tabId` on every action, take a screenshot before any click by coordinates (and again after scrolling), and prefer `find`/`read_page` refs. Long browser checks of a screen go to the `site-ui-checker` agent, not the main chat.
