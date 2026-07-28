# Plan 0018 — Unpin IPFS entry on mint failure — Contracts

- **ADR:** `docs/adr/0018-unpin-ipfs-on-mint-failure.md`
- **Paired plan:** `docs/plans/in-progress/0018-unpin-ipfs-on-mint-failure-frontend.md`
- **Status:** in-progress
- **Date:** 2026-07-26

## Scope and Goals

No contract changes required. `VinCidRegistry.storeCid` ([contracts/car_nft_sc.sol:49-77](../../../contracts/car_nft_sc.sol#L49-L77)) is already atomic — a failed call reverts all of its own state changes, it does not leave partial on-chain state. The bug this plan's paired frontend plan fixes is entirely in the frontend's cross-system orchestration (an off-chain Pinata pin that isn't rolled back when the following on-chain call fails), not in the contract.

## Files to Add / Modify

None under `contracts/`.

## Tasks

- [x] **1.** N/A — no contracts work. (Verification only: confirmed `storeCid` has no partial-failure state — every write in the function body happens before the single `_safeMint`/`_setTokenURI` external-interaction point, and a revert anywhere unwinds the whole call per normal EVM semantics.)

## Contract Surface

Unchanged.

## Interfaces with Frontend

Unchanged — same `storeCid(string vin, string cid, address recipient)` signature and `CidStored(vin, cid, tokenId)` event as before.

## Testing

Not applicable.

## Deployment and Migration

Not applicable.

## Risks and Rollback

None.

## Open Questions

None.
