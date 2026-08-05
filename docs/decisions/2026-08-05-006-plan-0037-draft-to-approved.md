---
date: 2026-08-05
scope: both
status: accepted
related_adr: 0037-application-onchain-receipt
supersedes: none
---

# Plan 0037 transitioned draft → approved; issue #44 filed

## Context

User said "autonomous" in response to ADR 0037 and its paired draft plans (application on-chain receipt). Per CLAUDE.md §2a, every plan entering `approved/` requires a filed GitHub tracking issue before implementation proceeds.

## Decision

Moved both `0037-application-onchain-receipt-frontend.md` and `-contracts.md` from `docs/plans/draft/` to `docs/plans/approved/`, updated each file's `Status:` frontmatter and `Paired plan:` path, and rewrote ADR 0037's `Related plans:` paths to match. Filed `gh issue create --repo Budenkinder/car_nft` → issue #44, and added the `**GitHub Issue:**` link to both plan files and the ADR's References section.

## Alternatives Considered

- **Follow the established draft → approved → in-progress sequence** *(chosen)* — matches exactly how plan 0035 was handled in this same project (decisions `2026-08-04-003`, `-004`), keeping the folder-as-source-of-truth convention consistent.

## Consequences

- **Positive:** Plan 0037 now carries a live tracking issue, satisfying CLAUDE.md's invariant that every plan in `approved/`/`in-progress/` has one.
- **Negative / accepted costs:** none.
- **Follow-ups required:** immediately followed by the `approved → in-progress` transition (decision `2026-08-05-007`) so task execution can begin.
