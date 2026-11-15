---
name: fill-data-gaps
description: Run Voltway's data research flow end to end - pick cars from the gap report, run ev-data-researcher agents in parallel, fact-check each batch with data-fact-checker, fix, apply with add-facts, verify and open a data PR. Use when the owner asks to fill data gaps, research cars, find charging curves, or "run the researchers".
---

# Fill data gaps (checklist 1.6; owner decisions B14–B16)

The main session coordinates; agents research and check; only the main session applies.

## 1. Pick the work
1. `git checkout main && git pull`, then a branch `data/research-<YYYY-MM-DD>-<slug>`.
2. `npm run data:build && npm run gaps`. Read `crosswalk/GAPS.md`: per-variant gaps, curve state (measured / borrowed / template only) and 10–80 % times.
3. Group models into batches of 2–3 models, keeping **platform siblings together** (e.g. IONIQ 5 + IONIQ 6 + EV6 on E-GMP; bZ + Solterra + C-HR; Equinox/Blazer/LYRIQ on Ultium) so one researcher can find a curve once and borrow it across same-pack variants. If the owner named cars or fields, start there. Older model years (back to 2010, e.g. a 2017 Bolt EV) are researched the same way; keep a model's years of one generation in the same batch so carry-over estimates can be checked across them.

## 2. Research (parallel)
Start one `ev-data-researcher` per group, in the background, in one message. Prompt each with:
- "Read `.claude/agents/ev-data-researcher.md` in full first; it is your current instructions." (agent definitions load at session start, so edits made this session only reach them this way)
- today's date, the models (make/model/year folders), the batch file name `research/batch-<date>-<slug>.json`, "touch only your own files; append to `research/NOTES.md`";
- anything the owner flagged for those cars (e.g. "the IONIQ 5 has no curve; check whether its pack matches the EV6's").

## 3. Fact-check (one per batch, as each researcher finishes)
Start a `data-fact-checker` per finished batch, in the background, with the same "read your agent file first" line and the batch's riskiest points (estimates and their basis, borrowed curves, trim mapping, US-vs-Canada differences). Make sure `research/<batch>.check.md` exists afterwards; if the checker only replied, save its reply there.

## 4. Fix
Apply each required change to the batch (drop or edit values, reword notes), then append to the `.check.md` a "Applied by the main session" section saying what was done and what wasn't, with the reason. Standing calls:
- Requests to relabel manufacturer figures relayed by press/dealer/spec sites as non-manufacturer: **don't** (researcher rule; source `type` is `community`).
- An unproven estimate or a borrowed curve whose pack match isn't shown: **drop** it.
- A trim wheel list with no standard size: **drop** it.
Re-run `npx tsx scripts/add-facts.ts <batch> --check` after each fix.

## 5. Apply and verify
1. `npx tsx scripts/add-facts.ts <batch>` for each batch (no `--check`).
2. `npm run validate`, `npx vitest run`, `npm run gaps` (note the before/after counts), `npm run build`.
3. Open one changed car on the dev server (`preview_start` "voltway-dev", `/charging?car=<variant id>`): the new values show with source badges; a new curve shows in the curve picker ("Estimated (sibling car, same battery)" for borrowed ones).
4. Add a dated progress line under checklist 1.6 in `docs/plan/CHECKLIST.md` with the new gap counts and what stays open.

## 6. Ship
Commit (batches, check reports, NOTES.md, data, checklist), push, open a PR with a before/after gap table, what the checkers dropped, and what's still open. Merge on green CI (owner's standing approval for autonomous builds). Report to the owner: what was filled, what was dropped and why, open questions.
