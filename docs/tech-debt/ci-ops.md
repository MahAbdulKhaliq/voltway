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

## Closed
- (none yet)
