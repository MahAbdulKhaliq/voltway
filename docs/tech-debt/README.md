# Tech debt

Known shortcuts, gaps and deferred work, all in one place, so nothing lives only in a chat, a QA report or a checklist note. Planned features are **not** listed here: Phase 1b (2.2, 5.1, 5.2, 6.1), the charger map and the route planner live in `docs/plan/CHECKLIST.md` and `docs/design/roadmap.md`.

| File | What's in it |
|---|---|
| [data.md](data.md) | Missing or doubtful vehicle data, curve leads, crosswalk matches waiting on an owner decision |
| [code.md](code.md) | Shortcuts and weak spots in the code |
| [product.md](product.md) | Features or behaviour deferred by an owner decision |
| [testing.md](testing.md) | What isn't tested, or was only checked once by hand |
| [ci-ops.md](ci-ops.md) | CI, workflows, hosting and repo settings |
| [docs.md](docs.md) | Stale or inconsistent documentation |

## How to use it

- **Add** an item when you take a shortcut, defer something, or a review (QA, fact-check) finds something that isn't fixed right away. Give it the next ID in its file (`TD-C3`, `TD-T2`…), and include:
  - **Since:** the date, and where it came from (PR, QA issue, decision).
  - **Impact:** what goes wrong, or could, and for whom.
  - **Fix:** the idea, and anything it waits on (an owner decision, another phase).
- **Close** an item by moving it to the file's "Closed" list with the date and the PR that fixed it. Don't delete it.
- **Owner decisions** (marked "needs owner") are never made by Claude alone. Raise them, then record the outcome in `docs/design/gaps-and-questions.md` §12.
- Data research items follow `data.md`'s own sections and are worked with the `fill-data-gaps` skill.

Started 2026-11-16, at the end of Phase 1a, from: the 1.6 research rounds, the Phase 1a QA run (`docs/plan/QA-RESULTS-1a.md`), owner decisions B23–B25, and the handoff notes.
