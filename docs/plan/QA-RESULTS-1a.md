# Phase 1a QA results (9.1)

First run: 2026-11-16, `qa-reviewer` subagent against `docs/plan/QA.md`, scoped to the [1a] items (commit `ef62ea4`). Verdict: **pass with issues**. All build, test, data and negative checks passed; [1b] items (U1, U2, U5, U14) deferred.

| # | Issue | Outcome |
|---|---|---|
| 1 | Measured curves drawn flat past their points and labelled "Tested" | Fixed (owner decision **B24**): the extension is dashed and labelled "Not measured", a note gives the measured range, and results that reach into it (including the 10–80 % tile) are estimated. `measuredSpan`/`usesExtension` in `src/lib/charging.ts`, `derived.extrapolated` in the build. |
| 2 | "Added per 10 min" tile ignored the trim's own rating | Fixed: the tile uses the shown trim's highway consumption, like the viewer (IONIQ 6 20″: tile and viewer both ~147 km). |
| 3 | 5 cars have no curve (no DC peak) | Accepted under B23; in `docs/tech-debt/data.md` and `product.md`. |
| 4 | Efficiency unit options missing | Deferred (owner decision **B25**); in `docs/tech-debt/product.md`. |
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
| 16 | Hand-entered facts ignore kind in precedence (theoretical) | Tracked in `docs/tech-debt/code.md`. |

## Re-check (2026-11-16, `qa-reviewer`, commit 043c479)
Verdict: **pass with issues**; Phase 1a can pass. Eight fixes confirmed; follow-ups, fixed in the next PR:
- Tile and viewer still differed by 1 unit on 26 of 90 car-trims (10–80 % minutes stored rounded to 0.1). Now stored to 0.001: 0 time differences and 1 per-10 difference left, an exact x.5 tie (IONIQ 9 AWD Performance, 186.50 vs 186.50).
- Output check missed figures with no `kind`, and wheels with no source. It now checks every scalar `value` and every wheel, with tests. (`validate` already caught these in the full build.)
- Time-axis chart ignored B24: now dashed when the window uses the unmeasured part.
- "Added to battery" no longer gets "~" for an estimated curve (energy is exact); only for the gross-capacity fallback.
- Stale CHECKLIST 3.3 text, a CSS comment and an unused import fixed.
- Logged as tech debt instead: Chargeprice notes in English (TD-C3), the TypeError on a bare trim number (TD-C7), the wheel "~" difference (TD-C8), the silent bad `?trim=` (TD-P4).

**Result: Phase 1a passes QA (9.1 ticked 2026-11-16).** Not covered: real-phone touch and screen-reader passes (TD-T1, TD-T2).
