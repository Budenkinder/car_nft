# Approved Plans

Plans here have been approved by the user and are ready to implement, but no implementation work has started yet.

**Entry:** ← `draft/` once the user signs off on the plan. A trio only lands here once its GitHub tracking issue exists in `Budenkinder/car_nft` and is linked from both plan files (`**GitHub Issue:** [#NN](…)`) and the ADR's `## References` — file it as part of the move, or reuse the trio's existing issue if one was opened at draft time. Every plan in this folder must carry a live, open issue link.

**Exit:**
- → `in-progress/` when the first task is started.
- → `rejected/` if the approval is withdrawn before any work happens (rare; record the reason in the decision log).

When a plan moves, both `-frontend.md` and `-contracts.md` move together, and the matching ADR's `Related plans:` paths are rewritten in the same change.
