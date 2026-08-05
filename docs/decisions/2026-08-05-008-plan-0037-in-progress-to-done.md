---
date: 2026-08-05
scope: both
status: accepted
related_adr: 0037-application-onchain-receipt
supersedes: none
---

# Plan 0037 transitioned in-progress → done; ADR 0037 bumped proposed → accepted; issue #44 closure blocked on `gh` token permissions

## Context

All tasks in both `0037-application-onchain-receipt-frontend.md` and `-contracts.md` are complete and verified: contracts side has 46/46 Hardhat tests passing (45 pre-existing + the new `VinCidRegistry.applicationReceipt.test.js`); frontend side rebuilt clean and re-verified live via the headless-Chromium harness (`drive7-onchain-receipt.js`), covering the full happy path, a simulated wallet rejection, a field-edit clearing both proofs, and an account switch clearing both proofs.

## Decision

Moved both plan files from `docs/plans/in-progress/` to `docs/plans/done/`, updated `Status:` frontmatter and `Paired plan:` paths, rewrote ADR 0037's `Related plans:` paths, and bumped the ADR's own `Status:` from `proposed` to `accepted` — matching this project's established convention (e.g. `2026-08-04-006`, `2026-07-20-004`) of accepting the ADR once its implementation is verified.

Attempted `gh issue close 44 --repo Budenkinder/car_nft --reason completed`: failed with `GraphQL: Resource not accessible by personal access token (closeIssue)` — the same token-permission gap already documented for issue #36 (decision `2026-08-04-005`; the token can create issues but not close them). Per CLAUDE.md's rule to surface blockers rather than work around them, issue #44 is left open, flagged here as a follow-up requiring manual closure by someone with a broader-scoped token: `gh issue close 44 --repo Budenkinder/car_nft --reason "completed"`.

## Alternatives Considered

- **Transition to `done` now, flag the issue-closure gap separately** *(chosen)* — the plan/ADR completion is real and verified; a token permission gap on a bookkeeping step shouldn't block recording that the work is done, any more than it did for issue #36.
- **Leave the plan in `in-progress` until the issue can be closed** — rejected; conflates two independent facts (implementation status vs. GitHub bookkeeping permissions) and would leave `docs/plans/in-progress/` inaccurately implying open work remains.

## Consequences

- **Positive:** `docs/plans/done/` now accurately reflects that ADR 0037's implementation is complete and verified.
- **Negative / accepted costs:** issue #44 remains open on GitHub despite the underlying work being done — a second instance of the same pre-existing token gap as issue #36.
- **Follow-ups required:** someone with a broader-scoped `gh` token needs to run `gh issue close 44 --repo Budenkinder/car_nft --reason "completed"` (and, while at it, `gh issue close 36 --repo Budenkinder/car_nft --reason "not planned"` from the still-open prior gap).
