---
date: 2026-08-02
scope: both
status: accepted
related_adr: 0034-github-issue-on-plan-approval
supersedes: none
---

# Also backfill a tracking issue (#42) for the in-progress trio 0027

## Context

ADR 0034's invariant, as written into `CLAUDE.md` §2a, covers plans in **`approved/` or `in-progress/`**. While backfilling 0013 (decision `2026-08-02-003`, user-confirmed) it turned out that trio 0027 (`nft-transaction-provenance-link`, in `in-progress/` since 2026-07-28) has no issue and no issue reference anywhere in its trio either — so the invariant would have been false the moment it was committed.

This was not one of the two open questions the user answered. It is the same gap as 0013, one folder further along.

## Decision

File [#42](https://github.com/Budenkinder/car_nft/issues/42) for trio 0027, link it from both plan files and ADR 0027's `## References`, and note in the issue body that it is a backfill of work already in flight (including the deferred manual verification recorded in `2026-07-29-011`).

Judgment call made without asking: it is the identical action to the one just approved for 0013, it costs one issue, and the alternative was to commit a documented invariant that a two-second `grep` disproves. Flagged to the user in the same turn rather than left silent.

## Alternatives Considered

- **Backfill 0027 too** *(chosen)* — makes the invariant true as written, for the same reason and at the same cost as the confirmed 0013 backfill.
- **Narrow the invariant to "plans approved under this rule"** — rejected: a rule with a grandfather clause is harder to check than a rule with two backfilled issues, and `grep -L "GitHub Issue"` stops being a valid audit.
- **Leave 0027 and note the exception** — rejected: an exception on actively in-flight work is the worst case for a tracker, since that is precisely the work someone would look for on GitHub.

## Consequences

- **Positive:** `grep -L "GitHub Issue:" docs/plans/approved/*.md docs/plans/in-progress/*.md` now returns nothing but the folders' `README.md` files. Both audit commands in plan 0034's Testing section pass.
- **Negative / accepted costs:** one issue filed slightly beyond the scope the user explicitly confirmed. Reversible by closing #42 and reverting two header lines if unwanted.
- **Follow-ups required:** #42 must be closed when trio 0027 finally reaches `done/` — it is subject to the same close-on-terminal rule as every other issue now.
