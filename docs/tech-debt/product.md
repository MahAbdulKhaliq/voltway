# Product debt (deferred by decision)

## Open

### TD-P1 Efficiency unit options
- **Since:** 2026-11-16, owner decision **B25** (QA 9.1 #4).
- **Impact:** `database-ui.md` §9 asks for kWh/100 km with Wh/km and mi/kWh options. v1 shows kWh/100 km, or kWh/100 mi when miles are chosen.
- **Fix:** after the map: add the choice to the units setting (`src/lib/units.ts`, `src/i18n/en.json`).

### TD-P2 Should EPA ratings ever take precedence over NRCan?
- **Since:** open question in the handoff, 2026-11-15. **Needs owner.**
- **Impact:** matters once the site covers markets other than Canada (B12).
- **Fix:** decide when a second market is planned; record it in `gaps-and-questions.md`.

### TD-P3 Retired planning folder
- **Since:** 2026-11-15. `G:\Work\Ideating\EV-App-Planning` was replaced by `docs/design/` but still exists. **Needs owner** (delete or keep).

## Closed
- 2026-11-16, PR #41: "Added to battery" result shown (QA #7); notice for unmatched `?car=` links (QA #15); "Estimated" tag on estimated lines (QA #11).
