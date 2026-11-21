# CI and operations debt

## Open

### TD-O1 CI failed on the automated refresh PR, cause unknown
- **Since:** 2026-11-16. The 8.1 test opened PR #39 from `data/source-refresh`. Its CI run (`ci.yml`, run 43809069826) failed with no jobs and no logs, which looks like a workflow startup failure. The PR was closed and its branch deleted within seconds, which may have caused it. Unverified.
- **Impact:** if real refresh PRs can't run CI, a person reviews them without the checks.
- **Fix:** on the next real refresh PR (the workflow runs on the 3rd of each month), check that CI runs. If it doesn't: PRs opened with the default `GITHUB_TOKEN` don't trigger other workflows, so the workflow would need a dedicated token or GitHub App, or a manual re-run of CI.
- **Update (2026-11-21 review):** half done. `charger-refresh.yml` now runs the CI steps inside its own workflow, and the real refresh PR #155 (2026-11-21) passed and merged. `data-refresh.yml` hasn't opened a PR since #39; check CI on its next run (the 3rd of the month).

### TD-O2 Refresh PRs update raw files only
- **Since:** 8.1 design (PR #34). By design, a refresh PR updates `sources/` but doesn't re-import, so the site doesn't change until a person runs the importers.
- **Fix:** none needed now. If the monthly step becomes routine, add an optional "re-import and show the diff" job.

### TD-O3 Repo setting changed for 8.1
- **Since:** 2026-11-16, at the owner's request: "Allow GitHub Actions to create and approve pull requests" is on. Default workflow token permissions stay read-only; `data-refresh.yml` asks for its own write access.
- **Note:** kept here so it isn't forgotten if the repo's permissions are reviewed.

### TD-O4 No fallback for the base map
- **Since:** 2026-11-16, Phase 2 plan (DESIGN-map.md M9).
- **Impact:** the map's tiles come from OpenFreeMap, a free service with no uptime promise. If it goes down or changes terms, the map shows pins on a blank background (or the "map couldn't load" message).
- **Fix:** host a Protomaps PMTiles extract of Canada on Cloudflare R2 (free tier) and point `MAP.styleUrl` / `MAP.darkStyleUrl` in `src/config.ts` at it. It's a config change by design; nothing is set up yet. Needs an owner step (R2 account).

### TD-O5 Repo growth from charger-data commits (watch item)
- **Since:** 2026-11-16, Phase 2 plan (DESIGN-map.md M9).
- **Impact:** each refresh (monthly since B36, so about 12 a year) commits `data/imported/afdc/stations.json` (~6.6 MB, one station per line) and `public/data/map/*.json`. Git stores changed files whole (compressed), so each refresh adds a few MB. Monthly, that is slow growth.
- **Fix:** check repo size every few months (`git count-objects -vH`). If it grows fast: commit only on real station changes (already the rule for merging), stop committing the built `public/data/map` files and build them on Vercel instead, or move the data to a separate repo or Git LFS.
- **Phase 7 (B78, 2026-11-18):** the US adds `data/imported/afdc/us.json` (38.7 MB, 85,947 stations), so each refresh that changes US stations adds roughly 5 MB compressed. Check `git count-objects -vH` after the first US refreshes.
- **Check (2026-11-21 review):** `git count-objects -vH` size-pack 29.31 MiB.

### TD-O7 The raw AFDC US pull is read as one string (watch item)
- **Since:** 2026-11-18, Phase 7 (7.3). The US pull is **313 MB** (91,729 stations). `fetch-afdc.ts` streams it to disk, but it and `import-afdc.ts` read it back with `readFileSync` + `JSON.parse`. Node caps a string at about 512 MB, so the pull fails cleanly (no data changes) once the US raw file grows past that.
- **Fix:** when it passes ~400 MB, ask AFDC for fewer fields (`fields=` with only what `normalizeStations` reads) or parse the stream (a streaming JSON parser).
- **Check (2026-11-21 review):** `sources/afdc-us/stations-raw.json` is 313 MB, still under the ~400 MB trigger.

## Closed
- 2026-11-21, tech-debt review: TD-O6 won't fix: written for the daily refresh; since B36 it runs monthly, and a blocked run fails and emails the owner, so an open PR isn't missed for long.
