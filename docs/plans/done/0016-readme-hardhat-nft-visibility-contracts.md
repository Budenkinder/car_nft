# Plan 0016 — README: Hardhat NFT visibility — Contracts

- **ADR:** `docs/adr/0016-readme-hardhat-nft-visibility.md`
- **Paired plan:** `docs/plans/done/0016-readme-hardhat-nft-visibility-frontend.md`
- **Status:** done
- **Date:** 2026-07-26

## Scope and Goals

No contract code changes required. The README addition references the existing `_tokenIdFromVin` token-ID derivation (`uint256(keccak256(vin))`) in `contracts/car_nft_sc.sol:126-128`, which is already implemented and already documented via NatSpec — this plan only confirms that fact is accurately restated in the README, it does not change `contracts/`.

## Files to Add / Modify

None under `contracts/`.

## Tasks

- [x] **1.** N/A — no contracts work. Verified: README's description (`uint256(keccak256(vin))`) matches `contracts/car_nft_sc.sol:126-128` exactly.

## Contract Surface

Unchanged.

## Interfaces with Frontend

Unchanged — `_tokenIdFromVin` is `internal`, not part of the public ABI; the README note is descriptive only (explains how to compute the ID off-chain for a manual MetaMask import), it doesn't propose exposing a new public getter.

## Testing

Not applicable.

## Deployment and Migration

Not applicable.

## Risks and Rollback

None.

## Open Questions

None.
