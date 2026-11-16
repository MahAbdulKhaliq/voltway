# CI and operations debt

## Open

### TD-O1 CI failed on the automated refresh PR, cause unknown
- **Since:** 2026-11-16. The 8.1 test opened PR #39 from `data/source-refresh`. Its CI run (`ci.yml`, run 43809069826) failed with no jobs and no logs, which looks like a workflow startup failure. The PR was closed and its branch deleted within seconds, which may have caused it. Unverified.
- **Impact:** if real refresh PRs can't run CI, a person reviews them without the checks.
- **Fix:** on the next real refresh PR (the workflow runs on the 3rd of each month), check that CI runs. If it doesn't: PRs opened with the default `GITHUB_TOKEN` don't trigger other workflows, so the workflow would need a dedicated token or GitHub App, or a manual re-run of CI.

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

### TD-O5 Repo growth from daily charger-data commits (watch item)
- **Since:** 2026-11-16, Phase 2 plan (DESIGN-map.md M9).
- **Impact:** each daily refresh commits `data/imported/afdc/stations.json` (~6.6 MB, one station per line) and `public/data/map/*.json`. Git stores changed files whole (compressed), so busy days add up to a few MB each. Over a year that could make clones slow.
- **Fix:** check repo size every few months (`git count-objects -vH`). If it grows fast: commit only on real station changes (already the rule for merging), stop committing the built `public/data/map` files and build them on Vercel instead, or move the data to a separate repo or Git LFS.

### TD-O6 A blocked charger PR stays open through later quiet days
- **Since:** 2026-11-16, Phase 2 QA (M10, report `qa-phase2-2026-11-16.md` in the session notes). When a refresh is blocked, the PR stays open; if the next days have no changes, nothing updates or closes it, and only the first day's failed run emails the owner.
- **Fix:** on a quiet day, if `data/charger-refresh` has an open PR, fail the run (or comment on the PR) so it isn't forgotten. (Fixed in the same QA PR: a failed check with *no* change now fails the run instead of ending green.)

## Closed
- (none yet)
