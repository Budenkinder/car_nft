---
date: 2026-08-04
scope: frontend
status: accepted
related_adr: 0035-org-role-multisig-admin
supersedes: none
---

# Fixed a BigInt sort crash in `getOrgRoleHolders`, found during manual verification

## Context

Manual verification of plan 0035's frontend tasks 13-15 (a headless-browser pass driving the real app against the local Hardhat node, since MetaMask itself isn't installable in this environment — see decision log entries around this session) surfaced a real bug: `OrgWalletsList` always rendered "No organizations approved yet," even for a wallet that `hasRole(ORG_ROLE, ...)` on-chain confirmed **did** hold the role.

The console showed `getOrgRoleHolders:failed { error: "Cannot convert a BigInt value to a number" }`. web3.js v4 returns event `blockNumber`/`logIndex` as `BigInt`, not `Number`. The sort comparator in `getOrgRoleHolders` was `(a, b) => a.blockNumber - b.blockNumber || a.logIndex - b.logIndex` — when block numbers differ, the engine's numeric coercion of the comparator's return value throws for a `BigInt` result. The existing `getTransactionHistoryForVin` (same file) already avoided this by explicitly mapping `blockNumber: Number(event.blockNumber)` before sorting — a convention `getOrgRoleHolders` should have followed and didn't.

## Decision

Fixed the comparator to explicitly coerce: `Number(a.blockNumber) - Number(b.blockNumber) || Number(a.logIndex) - Number(b.logIndex)`. Re-verified via the same headless-browser harness: a live "Refresh" click after granting `ORG_ROLE` to a third wallet (via `scripts/manage-org-role.js`) showed the wallet appear in the list; a live "Refresh" after revoking showed it disappear.

## Alternatives Considered

- **Fix in place, matching the existing `Number(...)` convention** *(chosen)* — consistent with `getTransactionHistoryForVin` in the same file; minimal, correct fix.
- **Catch and ignore, ship the silent-failure behavior** — rejected: it was already silently failing (the function's `catch` block returns `[]`), which is exactly the "empty list indistinguishable from zero organizations approved" failure mode the frontend plan's Testing section explicitly calls out as unacceptable.

## Consequences

- **Positive:** the org-wallet list now actually reflects on-chain `ORG_ROLE` state, confirmed via a live grant → refresh → appears, revoke → refresh → disappears round trip.
- **Negative / accepted costs:** none.
- **Follow-ups required:** none — this was caught and fixed within the same implementation pass, before the plan trio moves toward `done/`.
