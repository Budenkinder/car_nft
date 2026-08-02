---
date: 2026-07-29
scope: both
status: superseded
related_adr: 0027-nft-transaction-provenance-link
supersedes: none
---

## Context

All coding tasks for plan 0027 are complete and verified as far as possible without a browser (build compiles cleanly, event-reconstruction logic verified against both a local Hardhat deploy and the live Sepolia RPC). The user set `REACT_APP_SMART_CONTRACT_DEPLOY_BLOCK=11371335` in Vercel's Production environment variables, per the previous turn's fix. However, Vercel Production tracks the `main` branch, while this implementation lives on `dev`. The user stated they will merge `dev` → `main` and perform the manual browser/MetaMask verification (register/load/update flows) themselves after that merge, not now.

## Decision

Treat plan 0027 as implementation-complete but not yet fully verified. It stays in `docs/plans/in-progress/` rather than `docs/plans/done/` — moving it to `done` requires the outstanding manual verification (per this repo's established pattern for plans 0018/0026), and that verification is explicitly deferred by the user until after the `dev` → `main` merge. No further action is expected from the assistant until the user reports back after that merge and manual test.

## Alternatives considered

- Move the plan to `done` now since all code tasks are checked — rejected; the plan's own Testing section still lists real UI verification as outstanding, and closing it out before that would misrepresent the plan as fully verified when it isn't yet.

## Consequences

- Plan 0027 remains `in-progress`; ADR 0027 remains `proposed`.
- Next expected trigger: the user reports the post-merge manual test result, at which point the plan transitions to `done` (or, if the test surfaces a new issue, gets amended).
