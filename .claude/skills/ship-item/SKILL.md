---
name: ship-item
description: Ship finished Voltway checklist items end to end - checks, tick each item in docs/plan/CHECKLIST.md with what was verified, commit, push, open the PR, wait for CI to really start and pass, squash-merge, update main, confirm the Vercel deploy. Handles one item or several in one PR (batch mode, to stay under Vercel's daily deploy limit). Use whenever checklist item code is done and verified ("ship it", "open the PR and merge", "tick and merge"), every time, not from memory. Not for data PRs that need owner review, Vercel changes or design-doc decisions.
---

# Ship checklist items

Owner rule (CLAUDE.md, memory "autonomous-phase-build"): checklist PRs self-merge on green CI without asking. Data PRs (vehicle or station data needing review), Vercel settings and design changes still wait for the owner: stop and ask instead.

## One item or a batch
- **Batch mode:** several finished items in one PR. Use it when items are small or closely related (e.g. a run of design items), because Vercel Hobby limits deployments per day and every merge to `main` deploys. Tick each item separately (step 3) and name them all in the title (`4.12-4.14: …`).
- Ship sooner, alone, when an item is large or risky, or the next item builds on it in a way that's easier to review separately.

## Before you start
- You're on a feature branch (`feat/<item>-<slug>`), not `main`. If on `main`, `git switch -c` first.
- Each item's *Done when* is actually verified (tests, browser report, command output). Never tick a skipped or stubbed step; note gaps in the tick text instead.
- No browser agent is still checking pages (CLAUDE.md): wait for its report.

## Steps
1. **Contrast pairs:** `node scripts/contrast-pairs.mjs`. If it lists colour pairs used in CSS that `tests/contrast.test.ts` doesn't cover, add the ones that are real text/background or control pairs to the test (or say why not in the PR body).
2. **Checks** (all must pass; fix and re-run otherwise):
   ```bash
   npx vitest run
   npx astro check
   npm run build
   ```
   Tests must not read `public/data/` (git-ignored build output, absent in CI before the build): read `data/` via `buildCars('.')` / the script helpers.
3. **Tick** each item with the helper (no inline `node -e`; it breaks on quotes):
   ```bash
   node scripts/tick.mjs "<item-id>" "<what was verified, concise>"
   ```
   Phase 4 ids need the prefix: `"[4] 4.15"` (plain `4.15` matches an old item). Cite the browser report path when there is one.
4. **Commit** only the files you changed (`git add <paths>` or `-A` when the tree is only yours), including any `docs/plan/reports/` file the ticks cite. Message: `<item-id(s)>: <short summary>`, ending with the attribution lines from the system reminder.
5. **Push and open the PR:**
   ```bash
   git push -u origin HEAD
   gh pr create --title "<item-id(s)>: <summary>" --body-file <scratchpad file>
   ```
   Write the body to a scratchpad file first: what changed (per item in a batch), how it was verified, what's logged for later. End with the PR attribution line.
6. **Wait for CI correctly.** `gh pr checks --watch` can return before the `check` job registers. Loop until `check` appears, then watch:
   ```bash
   until gh pr checks <n> 2>/dev/null | grep -q '^check'; do sleep 10; done; gh pr checks <n> --watch --interval 15
   ```
   Run it with a long timeout (it can take a few minutes). Confirm `check  pass` before merging. A failing `Vercel` preview check doesn't block the merge, but read its description (step 9).
7. **On failure:** `gh run view <run-id> --log-failed | grep -iE "fail|error"`, fix, push again, back to step 6.
8. **Merge and update** (no `-q`; `gh pr merge` has no such flag):
   ```bash
   gh pr merge <n> --squash --delete-branch && git switch main && git pull
   ```
9. **Confirm the deploy** of the merge commit (the Vercel connector may return 403; use GitHub's record):
   ```bash
   gh api repos/MahAbdulKhaliq/voltway/commits/$(git rev-parse HEAD)/status --jq '.statuses[] | .context + " " + .state + " " + .description'
   ```
   It can take a minute to appear. "Deployment rate limited" means the daily limit is hit: production lags `main` until it resets. Tell the owner, batch the next items, and don't change Vercel settings.
10. **Report** in one or two lines: the PR link, what's now live (or that the deploy is rate-limited), and the next checklist item you're starting (or "**Your move:** …" if the next step needs the owner).
