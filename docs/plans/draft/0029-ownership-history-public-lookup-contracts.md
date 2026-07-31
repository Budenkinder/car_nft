# Plan 0029 — Ownership history, proof-of-ownership, public lookup — Contracts

- **ADR:** `docs/adr/0029-ownership-history-public-lookup.md`
- **Paired plan:** `docs/plans/draft/0029-ownership-history-public-lookup-frontend.md`
- **GitHub Issue:** [#35](https://github.com/Budenkinder/car_nft/issues/35)
- **Status:** draft
- **Date:** 2026-07-31

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

No contract changes. `VinCidRegistry`'s inherited `ERC721` base already emits an indexed `Transfer(address indexed from, address indexed to, uint256 indexed tokenId)` event on every mint and transfer, and `ownerOf(tokenId)` already returns the current owner — both sufficient to reconstruct full ownership history and back a public lookup page. `tokenId` is derived off-chain the same way the contract does (`keccak256(vin)`), so no new view function is needed either. This plan file exists per CLAUDE.md's requirement to plan both sides even when one is a no-op.

## Files to Add / Modify

None.

## Tasks

None — no contracts-side implementation tasks for this plan.

## Contract Surface

- No changes. `Transfer` and `ownerOf` are both part of the standard `ERC721`/`ERC721URIStorageUpgradeable` surface already deployed.

## Interfaces with Frontend

- Event shape consumed: `Transfer(address indexed from, address indexed to, uint256 indexed tokenId)` — already present in `frontend/src/utils/contract_abi.json` (inherited standard ERC-721 event, included in every compile).
- No ABI re-sync needed; no redeploy or upgrade needed.

## Testing

- No new contract tests. Existing `test/VinCidRegistry.test.js` already exercises mint/transfer paths that emit `Transfer`; no gap to fill.

## Deployment and Migration

- None. This plan ships purely as a frontend read against already-deployed, already-emitting contract behavior.

## Risks and Rollback

- None beyond the frontend plan's risks — nothing here to roll back on the contracts side.

## Open Questions

- None.
