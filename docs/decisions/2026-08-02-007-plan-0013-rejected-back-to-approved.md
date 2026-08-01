---
date: 2026-08-02
scope: both
status: accepted
related_adr: 0013-devcontainer-env-scaffolding
supersedes: 2026-08-02-006-plan-0013-approved-to-rejected.md
---

# Rejection of plan 0013 reverted; trio returned to `approved/` and issue #41 reopened

## Context

Earlier on 2026-08-02 the user instructed "Reject plan 0013" and the trio was moved to `docs/plans/rejected/` with issue [#41](https://github.com/Budenkinder/car_nft/issues/41) closed as not planned (`2026-08-02-006`). No reason for the rejection had been given, and that gap was flagged back to the user. They then instructed: *"Revert my decision regarding plan 0013 and put it into approved state."* No reason was given for the reversal either.

`docs/plans/rejected/README.md` calls `rejected` terminal, with revival prescribed as "write a new ADR + plan trio with a fresh `NNNN`". That wording addresses reviving an idea abandoned long ago, not undoing a same-day mistaken instruction — applying it literally here would mint a duplicate ADR and trio for a plan that was never actually reconsidered on its merits.

## Decision

Treat the rejection as retracted rather than as history to work around: `git mv` both files back to `docs/plans/approved/`, restore `Status: approved`, and rewrite the paired-plan paths and ADR 0013's `Related plans:`. ADR 0013 was never moved off `proposed`, so it needs no change.

Issue #41 was **reopened**, not re-filed. §2a's re-entry into `approved/` requires an issue and says to reuse an existing one rather than duplicate — a reopen keeps the trio's `GitHub Issue:` link valid and preserves the close/reopen trail on GitHub.

The paper trail is preserved rather than erased: `2026-08-02-006` stays on disk with `status: superseded` and this file's `supersedes:` pointing at it. `2026-07-23-002` (the original approval) stays `superseded` — it was overridden by 006, and this record, not that one, is now the reason the trio is approved.

The trio returns exactly as it was: approved, unstarted, with its task checklist untouched. No implementation begins without an explicit `implement` or `autonomous`.

## Alternatives Considered

- **Move the trio back and reopen #41** *(chosen)* — cheapest, keeps one ADR and one trio for one piece of work, and the superseded decision chain (`002 → 006 → 007`) records exactly what happened and when.
- **Follow `rejected/README.md` literally: new ADR 0035 + a fresh trio linking back to 0013** — rejected: it would duplicate an unchanged ADR and split one piece of work across two numbers to honour a rule aimed at long-dormant ideas, not at a reversal issued minutes later.
- **Delete `2026-08-02-006` so the rejection never happened** — rejected outright: §4 forbids silently rewriting history, and the rejection *did* happen.
- **File a new issue instead of reopening #41** — rejected: §2a's reuse-never-duplicate clause covers this, and the closed-then-reopened issue is a more honest record than a fresh number with no history.

## Consequences

- **Positive:** `docs/plans/approved/` holds trio 0013 again with a live, open issue link; the §2a invariant still checks out. The Dev Container env-scaffolding gap is owned again.
- **Negative / accepted costs:** #41 carries a close-as-not-planned and a reopen within about half an hour — noisy, but accurate. `docs/plans/rejected/` is empty again, so the folder still has nothing to show for look-back.
- **Process note:** two reversals of the same plan in one session, neither with a stated reason. Nothing here needs a rule change, but if plan 0013's fate is genuinely undecided, leaving it approved-and-unstarted is the honest resting state.
- **Follow-ups required:** memory `docs/memory/contracts/fresh-container-env-files-not-scaffolded.md` was written on the assumption the fix had been dropped for good; it is corrected in the same change to describe an approved-but-unstarted plan instead. The historical-path note in plan 0034's file table is likewise updated.
