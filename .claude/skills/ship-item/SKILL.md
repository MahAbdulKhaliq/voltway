---
name: ship-item
description: Ship one finished Voltway checklist item end to end - checks, tick it in docs/plan/CHECKLIST.md with what was verified, commit, push, open the PR, wait for CI to really start and pass, squash-merge, update main. Use whenever a CHECKLIST.md item's code is done and verified ("ship it", "open the PR and merge", "tick and merge"). Not for data PRs that need owner review, Vercel changes or design-doc decisions.
---

# Ship a checklist item

Owner rule (CLAUDE.md, memory "autonomous-phase-build"): checklist PRs self-merge on green CI without asking. Data PRs (vehicle or station data needing review), Vercel settings and design changes still wait for the owner: stop and ask instead.

## Before you start
- You're on a feature branch (`phase<N>/<item>-<slug>`), not `main`. If on `main`, `git switch -c` first.
- The item's *Done when* is actually verified (tests, browser, command output). Never tick a skipped or stubbed step; note gaps in the tick text instead.

## Steps
1. **Checks** (all must pass; fix and re-run otherwise):
   ```bash
   npx vitest run
   npx astro check
   npm run build
   ```
   Tests must not read `public/data/` (git-ignored build output, absent in CI before the build): read `data/` via `buildCars('.')` / the script helpers.
2. **Tick** with the helper (no inline `node -e`; it breaks on quotes):
   ```bash
   node scripts/tick.mjs <item-id> "<what was verified, concise>"
   ```
3. **Commit** only the files you changed (`git add <paths>` or `-A` when the tree is only yours). Message: `<item-id>: <short summary>`, ending with the attribution lines from the system reminder.
4. **Push and open the PR:**
   ```bash
   git push -u origin HEAD
   gh pr create --title "<item-id>: <summary>" --body-file <scratchpad file>
   ```
   Write the body to a scratchpad file first: what changed, how it was verified, what's left for later items. End with the PR attribution line.
5. **Wait for CI correctly.** `gh pr checks --watch` can return before the `check` job registers. Loop until `check` appears, then watch:
   ```bash
   until gh pr checks <n> 2>/dev/null | grep -q '^check'; do sleep 10; done; gh pr checks <n> --watch --interval 15
   ```
   Run it with a long timeout (it can take a few minutes). Confirm `check  pass` in the output before merging.
6. **On failure:** `gh run view <run-id> --log-failed | grep -iE "fail|error"`, fix, push again, back to step 5.
7. **Merge and update** (no `-q`; `gh pr merge` has no such flag):
   ```bash
   gh pr merge <n> --squash --delete-branch && git switch main && git pull
   ```
8. **Report** in one or two lines: the PR link, what's now live, and the next checklist item you're starting (or "**Your move:** …" if the next step needs the owner).
