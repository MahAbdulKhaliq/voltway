# Documentation debt

## Open

### TD-D1 DESIGN.md is out of date and only carries a pointer
- **Since:** 2026-11-16, QA 9.1 #13. Phases 3–4 still describe header links and per-variant `/cars/...` pages. A note at the top now points to the decisions log (B11, B18–B25), but the body isn't rewritten.
- **Fix:** rewrite the affected sections when the Phase 2 plan is written, or replace them with links to the design docs.

### TD-D2 Inconsistent decision dates
- **Since:** QA 9.1 #13. B10–B13 are dated 2026-11-16, while B18–B22, which build on B11, are dated 2026-11-15. CHECKLIST 4.2 says "Progress 2026-11-16" and then "Verified 2026-11-15".
- **Fix:** check against git history and correct the dates, or note that they're approximate.

### TD-D3 QA.md predates B24 and B25
- **Since:** 2026-11-16. QA.md still expects the efficiency options (U16) and doesn't test the measured-range rule (B24).
- **Fix:** update U16 (deferred by B25) and add B24 checks to M4/U12 before the next QA run.

## Closed
- 2026-11-16, PR #41: cost lines in `charging-curve-viewer.md` (B19); skip-log wording (QA #12); CHECKLIST 3.3 file reference (QA #14).
