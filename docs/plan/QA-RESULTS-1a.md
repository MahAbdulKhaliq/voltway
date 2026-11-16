# Phase 1a QA results (9.1)

First run: 2026-11-16, `qa-reviewer` subagent against `docs/plan/QA.md`, scoped to the [1a] items (commit `ef62ea4`). Verdict: **pass with issues**. All build, test, data and negative checks passed; [1b] items (U1, U2, U5, U14) deferred.

| # | Issue | Outcome |
|---|---|---|
| 1 | Measured curves drawn flat past their points and labelled "Tested" | Fixed (owner decision **B24**): the extension is dashed and labelled "Not measured", a note gives the measured range, and results that reach into it (including the 10–80 % tile) are estimated. `measuredSpan`/`usesExtension` in `src/lib/charging.ts`, `derived.extrapolated` in the build. |
| 2 | "Added per 10 min" tile ignored the trim's own rating | Fixed: the tile uses the shown trim's highway consumption, like the viewer (IONIQ 6 20″: tile and viewer both ~147 km). |
| 3 | 5 cars have no curve (no DC peak) | Accepted under B23; in `DATA-BACKLOG.md` §5. |
| 4 | Efficiency unit options missing | Deferred (owner decision **B25**); in `DATA-BACKLOG.md` §5. |
| 5 | English text bypassing i18n | Fixed: template basis, "Recorded for…", NRCan model-name notes, curve conditions, charger-limit label and market names now come from `src/i18n/en.json`. |
| 6, 9 | No output check in the build itself | Fixed: `scripts/lib/output-check.ts`, run by `npm run data:build` (fails on any unsourced figure anywhere in a car file), with a test. |
| 7 | Energy "added to battery" not shown | Fixed: new "Added to battery" result. |
| 8 | Runtime-built i18n keys not covered by tests | Fixed: test for every key family the viewer builds at runtime. |
| 10 | Empty window showed "~5 min"; tile/viewer rounding differed | Fixed: `displayMinutes(0, …)` is 0; the tile now computes like the viewer. |
| 11 | No "Estimated" tag on the chart line | Fixed. |
| 12 | Skip-log claim overstated | Fixed wording in `import-chargeprice.ts` and CHECKLIST 1.4. |
| 13 | Stale docs | Fixed: cost lines in `charging-curve-viewer.md`, decision pointer at the top of `DESIGN.md`. Date inconsistencies in older entries left as they are. |
| 14 | Dead `SourceBadge.astro` / `FieldValue.astro` | Removed; CHECKLIST 3.3 points at `react/Badge.tsx`. |
| 15 | Bad `?car=` link fails silently | Fixed: a notice says the link didn't match. |
| 16 | Hand-entered facts ignore kind in precedence (theoretical) | Backlog (`DATA-BACKLOG.md` §5). |

Re-check of the fixed items: see below.
