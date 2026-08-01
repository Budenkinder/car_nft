---
date: 2026-08-02
scope: both
status: accepted
related_adr: 0034-github-issue-on-plan-approval
supersedes: none
---

# Backfill a GitHub tracking issue (#41) for the pre-existing approved trio 0013

## Context

ADR 0034 establishes that every plan trio in `approved/` carries a live GitHub issue link. Trio 0013 (`devcontainer-env-scaffolding`) has been in `docs/plans/approved/` since 2026-07-23 — well before the rule — with no issue and no `GitHub Issue:` line. The rule as worded targets *new* approvals, so 0013 was raised as an open question in plan 0034 with a recommendation to backfill; the user confirmed with "continue like proposed".

## Decision

File [#41](https://github.com/Budenkinder/car_nft/issues/41) (`Scaffold .env files on Dev Container creation (ADR 0013)`), add the `**GitHub Issue:**` line to both 0013 plan files, and add the link to ADR 0013's `## References`. The issue body states plainly that it is a backfill and that the trio is approved-but-not-started, so the timeline is not misrepresented.

Backfilling stops here: the three long-lived drafts (0014 rotate-pinata-credentials, 0019 persistent-local-hardhat-node, 0021 gate-vercel-deploy-on-contract-tests) get nothing, because they are not approved and the rule does not reach `draft/`.

## Alternatives Considered

- **Backfill only 0013** *(chosen)* — one issue makes the "everything in `approved/` has an issue" invariant literally true rather than aspirational, at trivial cost.
- **Leave 0013 alone** — rejected: the sole approved trio predating the rule would also be the sole violation of it, which is exactly the inconsistency ADR 0034 exists to remove.
- **Backfill 0013 plus the three stale drafts** — rejected: it would import Option B (issue-per-draft) through the back door, after that option was considered and rejected in ADR 0034.

## Consequences

- **Positive:** `grep -L "GitHub Issue" docs/plans/approved/*.md docs/plans/in-progress/*.md` returns nothing but trio 0027's files; the invariant holds for everything approved.
- **Negative / accepted costs:** #41 is open against work that may sit unstarted for a while — an honest reflection of its approved-but-not-started status, not a bug.
- **Follow-ups required:** none. Trio 0027 (`in-progress`, predating the rule) also has no issue — see `2026-08-02-004` for that call.
