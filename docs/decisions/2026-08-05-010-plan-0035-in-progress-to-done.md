---
date: 2026-08-05
scope: both
status: accepted
related_adr: 0035-org-role-multisig-admin
supersedes: none
---

# Plan 0035 transitioned in-progress → done; ADR 0035 bumped proposed → accepted; issue #43 closure blocked on `gh` token permissions

## Context

Plan 0035's only remaining open task was contracts task 10 (Sepolia deployment), explicitly blocked pending user go-ahead since decision `2026-08-04-004`. The user's report of a Sepolia `execution reverted` error (while testing ADR 0037) prompted asking directly whether to proceed with the Sepolia upgrade now; confirmed yes. Decision `2026-08-05-009` records the upgrade itself and the `initializeV2` gap discovered and fixed along the way. With task 10 verified complete (upgrade live, pre-existing VINs intact, update-path gating confirmed live on Sepolia via a non-org wallet's blocked `staticCall`), every task in both `0035-org-role-multisig-admin-frontend.md` and `-contracts.md` is now checked off.

## Decision

Moved both plan files from `docs/plans/in-progress/` to `docs/plans/done/`, updated `Status:` frontmatter and `Paired plan:` paths, rewrote ADR 0035's `Related plans:` paths, and bumped the ADR's `Status:` from `proposed` to `accepted`.

Attempted `gh issue close 43 --repo Budenkinder/car_nft --reason completed`: failed with the same `GraphQL: Resource not accessible by personal access token (closeIssue)` already logged for issues #36 (decision `2026-08-04-005`) and #44 (decision `2026-08-05-008`) — a third instance of the same pre-existing token-permission gap. Left open, flagged here rather than worked around.

## Alternatives Considered

- **Transition to `done` now, flag the issue-closure gap separately** *(chosen)* — consistent with how plan 0037 was just handled; the implementation is genuinely complete and verified end-to-end (localhost and Sepolia both), and a GitHub bookkeeping permission gap shouldn't hold that back from being recorded accurately.

## Consequences

- **Positive:** `docs/plans/done/` now accurately reflects that both ADR 0035 and ADR 0037 are fully implemented, verified, and live on Sepolia — not just localhost. The two ADRs this session's work centered on are both `accepted`.
- **Negative / accepted costs:** issues #43 (this plan), #44 (plan 0037), and #36 (ADR 0030's superseded trio) all remain open on GitHub despite the underlying work being done — three instances of the same token gap.
- **Follow-ups required:** someone with a broader-scoped `gh` token needs to close all three: `gh issue close 43 --repo Budenkinder/car_nft --reason "completed"`, `gh issue close 44 --repo Budenkinder/car_nft --reason "completed"`, and `gh issue close 36 --repo Budenkinder/car_nft --reason "not planned"`.
