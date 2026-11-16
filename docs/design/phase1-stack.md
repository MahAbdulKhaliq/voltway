# Phase 1 Stack & Hosting

Phase 1, step 5 of [roadmap.md](roadmap.md). What Phase 1 (database and curves) needs to run, and a **recommended** stack that fits the **free hosting** goal. Covers S1, S2, S4 and D5 in [gaps-and-questions.md](gaps-and-questions.md).

**Status: accepted by the owner (2026-11-15).** See §6. Service limits and terms change, so check each service's current free tier at build time.

---

## 1. What Phase 1 actually needs

From the other Phase 1 docs:

| Need | Implication |
|------|-------------|
| **Read-only reference data.** Visitors never write to it (no accounts, X3) | **No runtime database is needed.** Data can be prepared ahead of time and served as files. |
| **Small data set.** A starter set of 20–30 cars, growing to a few hundred variants | Rough guess: **a few MB at most**, even with curves and multiple sources. Easily served as static files. |
| **Calculations** (charging time, km per 10 min) | Simple maths, done **in the visitor's browser**. No server needed. |
| **Personal settings** (my car, comparison) | **Browser storage** (database-ui.md §3) |
| **Shareable URLs for every car** | One page per car, **generated ahead of time** (good for search engines too) |
| **Data from several sources combined, matched and checked by a person** (vehicle-data-model.md §6–7) | A **build step** that imports, matches and validates, with data kept in **version control** so every change can be reviewed |
| **Free hosting** | A **static site host**. Several have free tiers. |

**Conclusion (S1, S2):** Phase 1 can be a **fully static website**, with **no server and no database server**. That's the simplest and cheapest possible setup, and it fits "free" comfortably.

---

## 2. Recommended architecture

```
 ┌───────────────────────── Data repository (version controlled) ─────────────────────────┐
 │  sources/        raw downloads: NRCan CSV, OpenEV Data release, Chargeprice archive      │
 │  data/           our records: one file per model / variant / curve (hand-edited + imported)│
 │  crosswalk.csv   our IDs ↔ each source's IDs (vehicle-data-model.md §6)                  │
 │  schema/         rules every record must pass (required fields, units, enums)            │
 └──────────────────────────────────────────┬──────────────────────────────────────────────┘
                                            │  build step
                                            ▼
              import → match → apply precedence rules → validate → export
                                            │
                                            ▼
 ┌──────────────────────────────── Static website ────────────────────────────────┐
 │  one HTML page per car, compare page, browse page                              │
 │  data files: a small index (for browse/search) + one file per car (details)    │
 │  browser does: search, filters, charging maths, charts, saving "my car"        │
 └────────────────────────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
                                Free static host + CDN
```

### Key choices
- **Data stored as files in a git repository ("data as code")**, the same approach OpenEV Data uses. Every change shows up as a reviewable diff, history comes free, and nothing has to be hosted.
- **Validation against a schema** at build time. A record with a missing source, a wrong unit or a curve with one point **fails the build** rather than going live. This enforces the accuracy rules automatically.
- **Two kinds of output data:**
  - a **small index** (name, key figures, badges) that the browse screen loads in one go
  - **per-car detail files** loaded only when someone opens that car
- **Search runs in the browser** over the index. With a few hundred cars, that's instant.

---

## 3. Recommended tools (proposals)

| Part | Recommendation | Why | Alternatives |
|------|----------------|-----|--------------|
| **Site framework** | **Astro** | Built for content sites: generates one static page per car, and adds interactive parts (curve viewer, filters) only where needed. Fast pages. | SvelteKit (static mode), Next.js (static export) |
| **Interactive parts** | Small UI components inside Astro: **React** (decided 2026-11-15) | The curve viewer, filters and compare screen need interactivity. Astro allows mixing. | Plain JavaScript |
| **Charts** | **Apache ECharts** (decided 2026-11-15) | Need: lines, dashed lines, shaded areas, a horizontal limit line, draggable markers, hover readouts, overlays of several cars | uPlot (very fast, more manual), Observable Plot |
| **In-browser search** | **MiniSearch** or **Fuse.js** | Tiny, works offline, typo-tolerant | n/a |
| **Data format** | **JSON** files (YAML for hand-edited records if easier to type) | Universal, easy to validate | n/a |
| **Validation** | **JSON Schema** | The same approach as OpenEV Data, so its schema can be adapted | n/a |
| **Build and import scripts** | **TypeScript** (same language as the site) | One language for everything | Python, which is good for data wrangling |
| **Code hosting + automation** | **GitHub** + **GitHub Actions** | Free for public repositories. Runs builds and scheduled data checks. | GitLab CI |
| **Website hosting** | **Vercel** (free Hobby plan) | Automatic deploys from GitHub, **a preview link for every pull request**, and built-in serverless functions for Phase 3. Astro supports it directly. | GitHub Pages, Cloudflare Pages, Netlify |

**Hosting notes:**
- **Vercel's free Hobby plan is for personal, non-commercial use.** That fits: the project will **always be non-commercial** (P6).
- **Preview deployments** suit the review workflow (§4). Every data-update pull request gets its own live preview, so changes can be checked on real car pages before merging.
- **Hobby limits are hard limits.** As far as I know, a project that goes over is paused until the next cycle rather than billed. That's very unlikely at this size, but worth knowing.
- **Switching is cheap:** a static Astro build deploys to GitHub Pages or Cloudflare Pages with little change if ever needed.
- Speed isn't a concern: Vercel serves from a worldwide CDN.

**The deciding factor between frameworks** should be what the builder is most comfortable with. The architecture in §2 works the same with any of them.

---

## 4. Data refresh (S4, D5) ✅

| What changes | How often | How it's handled |
|--------------|-----------|------------------|
| **NRCan ratings** (new models, new years) | A few times a year | A **scheduled GitHub Action** (for example monthly) downloads the CSV and compares it with the last copy. If anything changed, it **opens a pull request** listing new and changed cars. A person reviews and matches them. |
| **OpenEV Data releases** | Irregular | Same: a scheduled check for new releases, with a pull request showing differences |
| **Hand-entered data** (curves, trims, heat pump) | When found | Edited directly in the data repository, through a pull request |
| **OTA charging updates** | Rare | Added as a new **curve version** (vehicle-data-model.md §5) |

**Rule:** automation **suggests**, a person **approves**. Nothing from an outside source goes live without review. That's the accuracy pitch applied to updates.

---

## 5. Looking ahead (not decided here)

Phase 1's static setup shouldn't block later phases:

- **Phase 2, charger map:** about 15,000 Canadian charger locations (see data-sources.md) is still small enough to serve as **static files**, refreshed daily or weekly by a scheduled action. The real question is **map tiles** (S3).
- **Phase 3, routing:** needs a **routing engine** and probably **elevation data**. Those can't be static. It will most likely mean a **free tier of a hosted routing API**, or a small server. That's where "free" gets tested (S3).
- **When server code is needed (Phase 3),** it becomes **Vercel Functions** in the same project. They deploy with the site, with no separate service or account.

---

## 6. Decisions and open questions

**Decided (2026-11-15):**
- Fully static site, with no server or database server
- Data as files in git, with schema validation at build time
- Astro + a chart library (ECharts or Chart.js, picked at build time)
- **Interactive islands in React, charts with Apache ECharts** (owner's choice, 2026-11-15, at the start of the Phase 1 build). ECharts was picked because the viewer's dashed lines, shaded window, limit line, draggable markers and overlays are all built in.
- **Vercel** (free Hobby plan) as the host (owner's choice, 2026-11-15). Chosen for preview deployments and built-in functions, and as a chance to learn a new platform. GitHub Pages was the alternative. The data pipeline (scheduled GitHub Actions) is the same either way.
- Scheduled update checks that open pull requests for review
- **S5: a public repository.** It allows free hosting and automation, and community curve contributions through pull requests
- **U5: English for v1, built so all text can be translated.** No hard-coded text, so French can be added later as translation work

## 7. What this project teaches

One of the owner's goals is to **learn something new** with this project. The stack gives several chances:

| Skill | Where it comes up |
|-------|-------------------|
| **Vercel:** deploys from GitHub, preview deployments, project settings | Phase 1, from day one |
| **Astro:** static pages per car, interactive "islands" (curve viewer, filters) | Phase 1 |
| **Data as code:** JSON Schema validation, import scripts, a crosswalk table | Phase 1 data layer |
| **GitHub Actions:** scheduled jobs that open pull requests | Phase 1 updates, Phase 2 daily charger pull |
| **Charting:** lines, shaded areas and overlays in ECharts or Chart.js | Phase 1 curve viewer |
| **Web maps:** MapLibre, vector tiles, clustering | Phase 2 |
| **Serverless functions:** Vercel Functions, secret keys in environment variables, CDN caching headers, rate limiting | Phase 3 |
| **Translatable text** (i18n) | All phases |
