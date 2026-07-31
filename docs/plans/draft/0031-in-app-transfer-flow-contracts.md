# Plan 0031 — In-app wallet-to-wallet transfer — Contracts

- **ADR:** `docs/adr/0031-in-app-transfer-flow.md`
- **Paired plan:** `docs/plans/draft/0031-in-app-transfer-flow-frontend.md`
- **GitHub Issue:** [#37](https://github.com/Budenkinder/car_nft/issues/37)
- **Status:** draft
- **Date:** 2026-07-31

> Plan files live in a subfolder named after their `Status:` value (`draft/`, `approved/`, `in-progress/`, `done/`, `rejected/`). New plans start in `docs/plans/draft/`. On every status transition, both files in the trio move together via `git mv`, and the ADR's `Related plans:` paths are rewritten in the same change. See [CLAUDE.md](../../../CLAUDE.md) for the full workflow.

## Scope and Goals

No contract changes. `VinCidRegistry`'s inherited `ERC721URIStorageUpgradeable` already provides `safeTransferFrom`/`transferFrom`/`ownerOf`, sufficient for a direct wallet-to-wallet transfer. This file exists per CLAUDE.md's requirement to plan both sides even when one is a no-op.

## Files to Add / Modify

None.

## Tasks

None — no contracts-side implementation tasks for this plan.

## Contract Surface

- No changes. Standard ERC-721 `safeTransferFrom`/`transferFrom` already deployed and already gated by the standard `_isAuthorized` check (owner or approved caller only) inherited from OpenZeppelin.

## Interfaces with Frontend

- Functions called: `safeTransferFrom(address from, address to, uint256 tokenId)` — standard, already in the deployed ABI.
- Event shape: `Transfer(address indexed from, address indexed to, uint256 indexed tokenId)` — already present, already consumed by ADR 0029's ownership history.
- No ABI re-sync, no redeploy or upgrade needed.

## Testing

- No new contract tests — standard ERC-721 transfer behavior is already covered by OpenZeppelin's own test suite (used as a dependency, not reimplemented here) and exercised incidentally by this project's existing mint tests.

## Deployment and Migration

- None.

## Risks and Rollback

- None on the contracts side.

## Open Questions

- None.
