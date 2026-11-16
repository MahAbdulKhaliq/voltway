# Testing debt

## Open

### TD-T1 No real-device touch test of the curve guides
- **Since:** 4.2 (PR #32). The draggable 10/80 guides were tested with a mouse in the browser and headless Chrome only (QA 9.1, "not verified").
- **Fix:** try a drag on a real phone (iOS Safari and Android Chrome).

### TD-T2 No screen-reader pass
- **Since:** 7.2 (PR #35). Aria labels, the chart's table view and text badges exist, but no one has used the site with a screen reader.
- **Fix:** a short NVDA (Windows) or VoiceOver pass over the Charging page and a badge popover.

### TD-T3 Contrast is checked only by the automated test
- **Since:** B20. `tests/contrast.test.ts` checks the token pairs; nobody has measured the rendered pages.
- **Fix:** run an axe or Lighthouse accessibility check on the live site.

### TD-T4 Unit tests don't run on Vercel
- **Since:** Phase 0. Vercel's build runs `validate` and the data build (which now includes the output check), but not `npx vitest run`. Tests run only in GitHub CI on pull requests.
- **Impact:** a direct push to `main` would deploy without the tests. Today everything goes through PRs, so the risk is low.
- **Fix:** keep the PR-only flow; optionally protect `main` so CI must pass before a merge.

## Closed
- 2026-11-16, PR #41: runtime-built i18n keys covered by a test (QA #8).
