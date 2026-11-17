# Code debt

## Open

### TD-C1 Precedence ignores kind for hand-entered facts
- **Since:** 2026-11-16, QA 9.1 #16.
- **Impact:** `scripts/lib/build.ts` (`resolve`, around line 73) ranks fact values by source type only, so an `estimated` value from a carmaker-type source would beat a `manufacturer` value from OpenEV. No current data triggers it.
- **Fix:** within the same source type, rank by kind (manufacturer → tested → community → estimated). Add a test.

### TD-C3 English is fixed at build time in some strings
- **Since:** 2026-11-16, PR #41.
- **Impact:** curve basis text, "Recorded for…" and NRCan model-name notes are rendered with `t()` during the data build, and `src/config.ts` market names at module load. They live in the dictionary now, but a French version would need a per-locale data build or render-time keys.
- **Also:** the Chargeprice importer writes English notes into the committed import JSON (`SPEC_NOTE`, `CURVE_NOTE` in `scripts/lib/chargeprice.ts`), which show in badges (QA re-check).
- **Fix:** when French starts, store keys + params in the car and import JSON and render them in the browser.

### TD-C4 `derived.km_per_10_min` is no longer used by the page
- **Since:** 2026-11-16, PR #41 (the tile now computes from the shown trim).
- **Impact:** a stored figure that nothing on screen reads; it could drift from what's shown. Phase 1b's Cars sort may want it.
- **Fix:** use it for sorting in 5.1 (variant-level is fine there) or drop it.

### TD-C5 Dark-theme colour tokens are defined twice
- **Since:** B20 (themes).
- **Impact:** `src/styles/global.css` repeats the dark tokens under `prefers-color-scheme: dark` and `[data-theme="dark"]`; an edit to one can miss the other (the contrast test checks both, which softens it).
- **Fix:** generate one from the other, or share them via a single selector list.

### TD-C7 A bare number in a trim crashes the build with a TypeError
- **Since:** 2026-11-16, QA re-check. `npm run validate` rejects it first, but running the data build alone gives a TypeError at `scripts/lib/build.ts` (~line 283) instead of a clear message. It still exits 1.
- **Fix:** guard the trim fields with a clear error naming the variant and field.

### TD-C8 "~" rules differ slightly between tile and viewer
- **Since:** 2026-11-16, QA re-check. The tile marks the per-10-min figure "~" when the wheel size is adjusted; the viewer's results don't.
- **Fix:** pass the wheel-estimate flag into the viewer.

### TD-C9 The station panel shows English pricing only
- **Since:** 2026-11-16, M8 (PR #54). AFDC gives pricing in English (`pr`) and French (`pf`); the panel shows `pr`.
- **Fix:** with the French site: pick `pf` when the locale is French, falling back to `pr`. Dates in the panel are also formatted with a fixed `en-CA` locale (see TD-C3).

### TD-C10 A missing translation key blanks the whole map
- **Since:** 2026-11-16, Phase 2 QA (M10, report `qa-phase2-2026-11-16.md` in the session notes).
- **Impact:** `t()` throws on an unknown key (by design, so builds fail). The map is `client:only`, so a key that slips through would throw in the browser with no error boundary, and the map area goes blank. Also: `en-CA` is hard-coded for numbers and dates in the map and panel (see TD-C3), and the OSM credit HTML lives in `src/config.ts` rather than `en.json`.
- **Fix:** wrap `ChargerMap` in a small React error boundary showing `map.error`; move the locale to one setting with the French work.

### TD-C11 The panel's "updated" date only moves on days with changes
- **Since:** 2026-11-16, Phase 2 QA (M10, report `qa-phase2-2026-11-16.md` in the session notes).
- **Impact:** `meta.json` is rebuilt only when the refresh commits (a station changed). After quiet days the footer date is older than the last successful check, so the data looks staler than it is.
- **Fix:** have the refresh record its last successful check (e.g. a small `checked_at` file committed weekly, or the run date via the Actions API at build time), or reword the footer to "data as of".

## Closed
- 2026-11-16, checklist 2.2 (B41): TD-C2 estimated-curve templates calibrated against published 10–80 % times (`docs/plan/calibration-report.md`).
- 2026-11-16, QA re-check PR: TD-C6 unused `tokenize` import removed; output check now also covers figures with no kind and wheels; 10–80 % minutes stored precisely so tiles match the viewer.
- 2026-11-16, PR #41: dead `SourceBadge.astro` / `FieldValue.astro` removed (QA #14); output check added to the data build (QA #6, #9); empty window "~5 min" (QA #10).
